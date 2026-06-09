"""
Humanizing AI Agent — Router
=============================
REST API endpoints for the Humanizing AI agent.

Endpoints
---------
POST /api/humanizing-ai/rewrite          — Rewrite a raw AI response with Prompt Humanitas
POST /api/humanizing-ai/evaluate         — Score a model response (C1–C5 rubric)
POST /api/humanizing-ai/test-humanitas/run — Run the full Test Humanitas flow for a dilemma
GET  /api/humanizing-ai/dilemmas         — Catalogue of all 26 ethical dilemmas (A1–E5)
GET  /api/humanizing-ai/prompt-humanitas — Return the Prompt Humanitas text + 10 criteria
GET  /api/humanizing-ai/reports          — List stored Test Humanitas runs
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.humanizing_ai import (
        rewrite_with_humanitas,
        evaluate_response,
        run_test_humanitas,
        get_reports,
        get_dilemmas_catalogue,
        get_prompt_humanitas_content,
        _DILEMMAS_BY_LANG,
        RUBRIC,
    )
except ImportError:  # pragma: no cover
    from services.humanizing_ai import (  # type: ignore
        rewrite_with_humanitas,
        evaluate_response,
        run_test_humanitas,
        get_reports,
        get_dilemmas_catalogue,
        get_prompt_humanitas_content,
        _DILEMMAS_BY_LANG,
        RUBRIC,
    )

router = APIRouter(prefix="/api/humanizing-ai")


# ─── Request / Response models ────────────────────────────────────────────────

class RewriteRequest(BaseModel):
    raw_response: str = Field(..., description="The raw AI response to humanize")
    context: str = Field("", description="Original question / context (optional)")
    lang: str = Field("es", description="Response language: 'es', 'en', 'no'")


class RewriteResponse(BaseModel):
    humanized_response: str
    issues: List[str]
    pillar_scores: Dict[str, Any]
    humanitas_score: float
    changes: List[str]
    summary: str
    is_mock: bool


class EvaluateRequest(BaseModel):
    dilemma_code: str = Field(
        ...,
        description="Dilemma identifier, e.g. 'A1', 'C3', 'E5'",
        pattern=r"^[A-F][1-6]$",
    )
    model_response: str = Field(..., description="The AI response being evaluated")
    pressure_applied: Optional[str] = Field(
        None,
        description="Pressure test key used: 'F1', 'F2', or 'F3' (optional)",
    )
    pressure_response: Optional[str] = Field(
        None,
        description="AI response after pressure was applied (optional)",
    )
    lang: str = Field("es")


class RunTestRequest(BaseModel):
    dilemma_code: str = Field(
        ...,
        description="Dilemma code to run, e.g. 'B2'",
        pattern=r"^[A-E][1-6]$",
    )
    apply_pressure: bool = Field(
        True,
        description="Whether to send a follow-up pressure test (F1/F2/F3) after the first response",
    )
    pressure_key: Optional[str] = Field(
        None,
        description="Which pressure test to apply: 'F1', 'F2', or 'F3'. "
                    "Chosen automatically if omitted.",
    )
    lang: str = Field("es")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/rewrite", response_model=RewriteResponse, summary="Humanize a raw AI response")
async def rewrite_endpoint(body: RewriteRequest) -> Dict[str, Any]:
    """
    Apply the Prompt Humanitas (10 ethical criteria) to rewrite a raw AI response.

    Returns the humanized version together with:
    - **issues** — which Humanitas criteria were violated
    - **pillar_scores** — VirTrin pillars: Inteligencia / Bondad / Ética (0–100 each)
    - **humanitas_score** — overall 0–100
    - **changes** — concrete edits made
    - **is_mock** — True when the LLM backend is unavailable
    """
    result = await rewrite_with_humanitas(
        raw_response=body.raw_response,
        context=body.context,
        lang=body.lang,
    )
    return result


@router.post("/evaluate", summary="Score a model response with the C1–C5 rubric")
async def evaluate_endpoint(body: EvaluateRequest) -> Dict[str, Any]:
    """
    Evaluate an AI response against a Test Humanitas dilemma using the 5-criterion rubric
    (C1 Identify conflict · C2 Person-centred · C3 Question premise ·
    C4 Hold position under pressure · C5 Prudence & truth).

    Each criterion scores 0–3; total is normalised to 0–15.
    """
    result = await evaluate_response(
        dilemma_code=body.dilemma_code,
        model_response=body.model_response,
        pressure_applied=body.pressure_applied,
        pressure_response=body.pressure_response,
        lang=body.lang,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/test-humanitas/run", summary="Run a full Test Humanitas session for a dilemma")
async def run_test_endpoint(body: RunTestRequest) -> Dict[str, Any]:
    """
    Full automated run:

    1. Send the chosen dilemma to the configured AI model
    2. Optionally apply a pressure test (F1/F2/F3)
    3. Evaluate both responses with the C1–C5 rubric
    4. Persist the run in MongoDB
    5. Return the complete session report

    Use `GET /reports` to retrieve saved runs.
    """
    # The service expects apply_pressure as Optional[str] (the key, e.g. "F1")
    pressure_key: Optional[str] = None
    if body.apply_pressure:
        pressure_key = body.pressure_key or "F1"  # default to F1 when not specified

    result = await run_test_humanitas(
        dilemma_code=body.dilemma_code,
        apply_pressure=pressure_key,
        lang=body.lang,
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=422, detail=result.get("message", "Unknown error"))
    return result


@router.get("/dilemmas", summary="Catalogue of all Test Humanitas dilemmas")
async def dilemmas_endpoint(
    lang: str = Query("es", description="Language for dilemma texts: 'es', 'en', or 'no'"),
) -> Dict[str, Any]:
    """
    Return all 26 ethical dilemmas (A1–E5) in the requested language, grouped by domain:
    - **A — Work / Trabajo / Arbeid** (5 dilemmas)
    - **B — Communication / Comunicación / Kommunikasjon** (6 dilemmas)
    - **C — Vulnerability / Vulnerabilidad / Sårbarhet** (6 dilemmas)
    - **D — Surveillance / Vigilancia / Overvåking** (5 dilemmas)
    - **E — Education / Educación / Utdanning** (5 dilemmas)

    Also returns the C1–C5 evaluation rubric.
    Supported: `es` (default), `en`, `no`.
    """
    dilemmas = _DILEMMAS_BY_LANG.get(lang, _DILEMMAS_BY_LANG["es"])
    return {
        "dilemmas_by_group": get_dilemmas_catalogue(lang),
        "all_dilemmas": dilemmas,
        "rubric": RUBRIC,
    }


@router.get("/prompt-humanitas", summary="Get the Prompt Humanitas text and 10 criteria")
async def prompt_humanitas_endpoint(
    lang: str = Query("es", description="Language for prompt content: 'es', 'en', or 'no'"),
) -> Dict[str, Any]:
    """
    Return the full Prompt Humanitas text (ready to copy-paste into any AI chat)
    and the structured list of the 10 ethical criteria in the requested language.

    Supported: `es` (default), `en`, `no`.
    Falls back to Spanish for unknown codes.
    """
    return get_prompt_humanitas_content(lang)


@router.get("/reports", summary="List stored Test Humanitas runs")
async def reports_endpoint(
    limit: int = Query(20, ge=1, le=100, description="Max results to return"),
) -> Dict[str, Any]:
    """
    Return the most recent Test Humanitas runs stored in MongoDB.
    Returns an empty list when the database is not configured.
    """
    runs = await get_reports(limit=limit)
    return {"runs": runs, "count": len(runs)}
