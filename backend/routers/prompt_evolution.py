"""Router for the Homo Sapiens vs. KI i Test prompt-evolution governance.

Phase E. Six endpoints wired under /api/agi/homo-vs-ai/prompt-evolution/*.

Endpoints
---------
GET  /revisions             — list with optional task + status filters
POST /propose               — ask LLM #2 to propose a revision (persists pending|refused)
POST /{revision_id}/approve — activate a pending revision
POST /{revision_id}/reject  — reject a pending revision
POST /{revision_id}/rollback — re-activate a previously superseded revision
POST /{revision_id}/regression — run the curated regression harness

All endpoints degrade gracefully when MongoDB is unavailable — the in-memory
return values keep the UI flowing even if persistence is broken.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from backend.services.prompt_evolution import (
    approve_revision,
    list_revisions,
    propose_revision,
    reject_revision,
    rollback_to,
    run_regression,
)
from backend.services.homo_vs_ai_service import TASK_SPECS

router = APIRouter(
    prefix="/api/agi/homo-vs-ai/prompt-evolution",
    tags=["Homo vs AI · Prompt Evolution"],
)


# Provider header forwarding — mirrors the pattern used by /api/agi/homo-vs-ai
# so the workshop's LLM-provider selector works for these endpoints too.
_FORWARDED_HEADERS = (
    "x-api-provider", "x-openai-key", "x-openrouter-key",
    "x-itemai-endpoint", "x-itemai-model", "x-itemai-url", "x-itemserverai-url",
)


def _collect_llm_headers(request: Request) -> dict:
    return {k: v for k in _FORWARDED_HEADERS if (v := request.headers.get(k))}


# --- Request models ---------------------------------------------------------

class ProposeRequest(BaseModel):
    task: str = Field(..., description="Task key — must be one of TASK_SPECS.")
    user_input: str = Field(..., min_length=3, description="The original user input from the round.")
    previous_ai_output: str = Field(..., min_length=1, description="The AI's previous answer.")
    human_feedback: str = Field(..., min_length=3, description="Human improvement notes.")
    actor: Optional[str] = Field(default="workshop-host", max_length=80, description="Who proposed the revision (defaults to 'workshop-host').")


class ApproveRequest(BaseModel):
    approver: Optional[str] = Field(default="workshop-host", max_length=80)
    note: Optional[str] = Field(default="", max_length=600)


class RejectRequest(BaseModel):
    reviewer: Optional[str] = Field(default="workshop-host", max_length=80)
    reason: Optional[str] = Field(default="", max_length=600)


class RollbackRequest(BaseModel):
    actor: Optional[str] = Field(default="workshop-host", max_length=80)
    reason: Optional[str] = Field(default="", max_length=600)


class RegressionRequest(BaseModel):
    max_samples: Optional[int] = Field(default=3, ge=1, le=10)


# --- Endpoints --------------------------------------------------------------

@router.get("/revisions")
async def api_list_revisions(
    task: Optional[str] = Query(default=None, description="Filter by task key."),
    status: Optional[Literal["pending", "active", "rejected", "superseded", "refused"]] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    """List revisions, most recent first. No filters → all tasks, all statuses."""
    items = await list_revisions(task=task, status=status, limit=limit)
    return {"items": items, "count": len(items)}


@router.post("/propose")
async def api_propose(body: ProposeRequest, request: Request):
    """Ask the LLM to propose a revised system prompt for `task`. Persists
    the response (status='pending' on proposal, 'refused' if the LLM
    declined or the call failed)."""
    if body.task not in TASK_SPECS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown task '{body.task}'. Allowed: {sorted(TASK_SPECS.keys())}",
        )

    spec = TASK_SPECS[body.task]
    base_prompt = spec["system"]

    hdrs = _collect_llm_headers(request)
    try:
        doc = await propose_revision(
            task=body.task,
            base_prompt=base_prompt,
            user_input=body.user_input,
            previous_ai_output=body.previous_ai_output,
            human_feedback=body.human_feedback,
            request_headers=hdrs,
            actor=body.actor or "workshop-host",
        )
        return doc
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Propose failed: {e}")


@router.post("/{revision_id}/approve")
async def api_approve(revision_id: str, body: ApproveRequest):
    try:
        return await approve_revision(
            revision_id=revision_id,
            approver=body.approver or "workshop-host",
            note=body.note or "",
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Approve failed: {e}")


@router.post("/{revision_id}/reject")
async def api_reject(revision_id: str, body: RejectRequest):
    try:
        return await reject_revision(
            revision_id=revision_id,
            reviewer=body.reviewer or "workshop-host",
            reason=body.reason or "",
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Reject failed: {e}")


@router.post("/{revision_id}/rollback")
async def api_rollback(revision_id: str, body: RollbackRequest):
    try:
        return await rollback_to(
            revision_id=revision_id,
            actor=body.actor or "workshop-host",
            reason=body.reason or "",
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Rollback failed: {e}")


@router.post("/{revision_id}/regression")
async def api_regression(revision_id: str, body: RegressionRequest, request: Request):
    """Run the curated regression harness for this revision's task. Returns
    a side-by-side score table base vs proposed."""
    hdrs = _collect_llm_headers(request)
    try:
        return await run_regression(
            revision_id=revision_id,
            request_headers=hdrs,
            max_samples=int(body.max_samples or 3),
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Regression failed: {e}")


@router.get("/active/{task}")
async def api_get_active(task: str):
    """Resolve the currently active prompt revision for `task` (debug helper).

    Returns either the active revision doc or {"task": task, "active": null}
    when no revision is active — callers can use this to badge the UI when
    a task is running on an LLM-evolved prompt instead of the baked-in one.
    """
    from backend.services.prompt_evolution import get_active_prompt

    if task not in TASK_SPECS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown task '{task}'. Allowed: {sorted(TASK_SPECS.keys())}",
        )
    doc = await get_active_prompt(task)
    if not doc:
        return {"task": task, "active": None}
    return {"task": task, "active": doc}
