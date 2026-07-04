"""
English Mastery AI — Router
===========================
REST API for the advanced-English mentor (Language Agents group).
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.english_mentor import (
        get_false_friends, get_collocations, get_phrasal_verbs, get_idioms,
        get_grammar_path, get_grammar_point, get_minimal_pairs,
        get_vocab_all, srs_due, srs_review,
        get_overview, conversation_message, scenarios_catalogue,
        writing_feedback, health,
    )
except ImportError:  # pragma: no cover
    from services.english_mentor import (  # type: ignore
        get_false_friends, get_collocations, get_phrasal_verbs, get_idioms,
        get_grammar_path, get_grammar_point, get_minimal_pairs,
        get_vocab_all, srs_due, srs_review,
        get_overview, conversation_message, scenarios_catalogue,
        writing_feedback, health,
    )

router = APIRouter(prefix="/api/english")


# ─── Request models ───────────────────────────────────────────────────────────

class SrsReviewRequest(BaseModel):
    vocab_id: str = Field(..., description="Vocabulary item id (e.g. 'cvocab_001')")
    grade: str = Field(..., pattern=r"^(again|good|easy)$")


class ConversationMessageRequest(BaseModel):
    scenario: str = Field("smalltalk")
    difficulty: str = Field("c1", pattern=r"^(c1|c2)$")
    history: List[Dict[str, str]] = Field(default_factory=list)
    user_text: Optional[str] = Field(None)
    lang: str = Field("es", pattern=r"^(en|es|no)$")


class WritingRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=6000)
    register: str = Field("neutral", pattern=r"^(formal|neutral|informal)$")
    lang: str = Field("es", pattern=r"^(en|es|no)$")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.get("/overview", summary="Dashboard overview — stats + today's mission")
async def overview_endpoint() -> Dict[str, Any]:
    return await get_overview()


@router.get("/false-friends", summary="Spanish→English false friends")
def false_friends_endpoint() -> Dict[str, Any]:
    items = get_false_friends()
    return {"count": len(items), "items": items}


@router.get("/collocations", summary="Common collocation errors")
def collocations_endpoint() -> Dict[str, Any]:
    items = get_collocations()
    return {"count": len(items), "items": items}


@router.get("/phrasal-verbs", summary="C1/C2 phrasal verbs")
def phrasal_verbs_endpoint() -> Dict[str, Any]:
    items = get_phrasal_verbs()
    return {"count": len(items), "items": items}


@router.get("/idioms", summary="Natural English idioms")
def idioms_endpoint() -> Dict[str, Any]:
    items = get_idioms()
    return {"count": len(items), "items": items}


@router.get("/grammar/path", summary="Grammar nuance points")
def grammar_path_endpoint(level: str = Query("all", pattern=r"^(all|C1|C2)$")) -> Dict[str, Any]:
    items = get_grammar_path(level)
    return {"level": level, "count": len(items), "items": items}


@router.get("/grammar/{point_id}", summary="Single grammar point")
def grammar_point_endpoint(point_id: str) -> Dict[str, Any]:
    p = get_grammar_point(point_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Grammar point not found: {point_id}")
    return p


@router.get("/pronunciation/pairs", summary="Minimal pairs + pronunciation tips")
def pronunciation_endpoint() -> Dict[str, Any]:
    items = get_minimal_pairs()
    return {"count": len(items), "items": items}


@router.get("/vocab/all", summary="Full C1/C2 vocabulary list")
def vocab_all_endpoint() -> Dict[str, Any]:
    items = get_vocab_all()
    return {"count": len(items), "items": items}


@router.get("/srs/due", summary="Vocabulary items due for review")
async def srs_due_endpoint(limit: int = Query(20, ge=1, le=100)) -> Dict[str, Any]:
    items = await srs_due(limit=limit)
    return {"count": len(items), "items": items}


@router.post("/srs/review", summary="Grade a vocabulary review")
async def srs_review_endpoint(body: SrsReviewRequest) -> Dict[str, Any]:
    return await srs_review(body.vocab_id, body.grade)


@router.get("/conversation/scenarios", summary="List conversation scenarios")
def scenarios_endpoint(lang: str = Query("es")) -> Dict[str, Any]:
    return {"scenarios": scenarios_catalogue(lang)}


@router.post("/conversation/message", summary="Send a turn to the English mentor")
async def conversation_endpoint(body: ConversationMessageRequest) -> Dict[str, Any]:
    return await conversation_message(
        scenario=body.scenario, difficulty=body.difficulty,
        history=body.history, user_text=body.user_text, lang=body.lang,
    )


@router.post("/writing/feedback", summary="Get C1/C2 feedback on a written text")
async def writing_endpoint(body: WritingRequest) -> Dict[str, Any]:
    return await writing_feedback(body.text, body.register, body.lang)
