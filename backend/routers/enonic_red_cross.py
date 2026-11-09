"""
Enonic 'Red Cross' Agent — Router (V1)
======================================
REST API for the grounded project-knowledge & testing assistant.

Endpoints (plan §9, prefix adapted to repo convention):
  GET  /api/enonic-red-cross/health          — health probe
  GET  /api/enonic-red-cross/knowledge        — the curated knowledge base
  GET  /api/enonic-red-cross/test-catalog     — seed Sprint-7 cases (observations)
  GET  /api/enonic-red-cross/project-context  — env URLs, versions, known-unknowns
  POST /api/enonic-red-cross/chat             — one grounded, cited turn
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.enonic_red_cross import (
        answer, knowledge, test_catalog, project_context, health, sprints,
    )
except ImportError:  # pragma: no cover
    from services.enonic_red_cross import (  # type: ignore
        answer, knowledge, test_catalog, project_context, health, sprints,
    )

router = APIRouter(prefix="/api/enonic-red-cross")


class ChatTurn(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000,
                         description="A question about the Enonic platform or the Red "
                                     "Cross installation and how to test it")
    lang: str = Field("en", pattern=r"^(en|es|no)$")
    history: Optional[List[ChatTurn]] = Field(
        default=None, description="Prior turns for conversational context")


@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.get("/knowledge", summary="Curated Enonic + Red Cross knowledge base")
def knowledge_endpoint() -> Dict[str, Any]:
    items = knowledge()
    return {"count": len(items), "knowledge": items}


@router.get("/test-catalog", summary="Seed test cases (observations, not official steps)")
def test_catalog_endpoint(
    query: str = Query("", max_length=200, description="Match id / title / note"),
    persona: str = Query("", description="Filter by persona (Sluttbruker / Redaktør)"),
    result: str = Query("", description="Filter by result (pass/fail/partial/blocked)"),
    sprint: str = Query("", max_length=8, description="Filter by sprint (e.g. 7)"),
) -> Dict[str, Any]:
    items = test_catalog(query=query, persona=persona, result=result, sprint=sprint)
    return {"count": len(items), "cases": items, "sprints": sprints(),
            "disclaimer": "Observations at test time, not imported official steps or live status."}


@router.get("/project-context", summary="Environment URLs, versions, architecture, known-unknowns")
def project_context_endpoint() -> Dict[str, Any]:
    return project_context()


@router.post("/chat", summary="One grounded, epistemically-tagged, cited turn")
async def chat_endpoint(body: ChatRequest) -> Dict[str, Any]:
    hist = [t.model_dump() for t in body.history] if body.history else None
    return await answer(body.message, body.lang, hist)
