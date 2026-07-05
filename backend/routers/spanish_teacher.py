"""
Spanish Teacher AI — Router
===========================
REST API for teaching Spanish to non-native learners (Language Agents group).
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.spanish_teacher import (
        get_pronunciation, get_grammar_path, get_grammar_point,
        get_conjugation, get_verb, get_vocab_all, srs_due, srs_review,
        get_false_friends, get_culture, get_overview,
        conversation_message, scenarios_catalogue, writing_feedback, health,
    )
except ImportError:  # pragma: no cover
    from services.spanish_teacher import (  # type: ignore
        get_pronunciation, get_grammar_path, get_grammar_point,
        get_conjugation, get_verb, get_vocab_all, srs_due, srs_review,
        get_false_friends, get_culture, get_overview,
        conversation_message, scenarios_catalogue, writing_feedback, health,
    )

router = APIRouter(prefix="/api/spanish")


class SrsReviewRequest(BaseModel):
    vocab_id: str = Field(..., description="Vocabulary item id (e.g. 'esvocab_001')")
    grade: str = Field(..., pattern=r"^(again|good|easy)$")


class ConversationMessageRequest(BaseModel):
    scenario: str = Field("presentarse")
    difficulty: str = Field("intermediate", pattern=r"^(beginner|intermediate|advanced)$")
    history: List[Dict[str, str]] = Field(default_factory=list)
    user_text: Optional[str] = Field(None)
    lang: str = Field("en", pattern=r"^(en|es|no)$")


class WritingRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=6000)
    register: str = Field("neutral", pattern=r"^(formal|neutral|informal)$")
    lang: str = Field("en", pattern=r"^(en|es|no)$")


@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.get("/overview", summary="Dashboard overview")
async def overview_endpoint() -> Dict[str, Any]:
    return await get_overview()


@router.get("/pronunciation", summary="Spanish sounds + pronunciation tips")
def pronunciation_endpoint() -> Dict[str, Any]:
    items = get_pronunciation()
    return {"count": len(items), "items": items}


@router.get("/grammar/path", summary="Grammar points")
def grammar_path_endpoint(level: str = Query("all", pattern=r"^(all|core|advanced)$")) -> Dict[str, Any]:
    items = get_grammar_path(level)
    return {"level": level, "count": len(items), "items": items}


@router.get("/grammar/{point_id}", summary="Single grammar point")
def grammar_point_endpoint(point_id: str) -> Dict[str, Any]:
    p = get_grammar_point(point_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Grammar point not found: {point_id}")
    return p


@router.get("/conjugation", summary="Verb conjugation tables")
def conjugation_endpoint() -> Dict[str, Any]:
    return get_conjugation()


@router.get("/conjugation/{verb}", summary="Single verb table")
def verb_endpoint(verb: str) -> Dict[str, Any]:
    v = get_verb(verb)
    if not v:
        raise HTTPException(status_code=404, detail=f"Verb not in V1 set: {verb}")
    return v


@router.get("/vocab/all", summary="Full vocabulary list")
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


@router.get("/false-friends", summary="English→Spanish false friends")
def false_friends_endpoint() -> Dict[str, Any]:
    items = get_false_friends()
    return {"count": len(items), "items": items}


@router.get("/culture", summary="Culture notes (Spain vs Latin America)")
def culture_endpoint() -> Dict[str, Any]:
    items = get_culture()
    return {"count": len(items), "items": items}


@router.get("/conversation/scenarios", summary="List conversation scenarios")
def scenarios_endpoint(lang: str = Query("en")) -> Dict[str, Any]:
    return {"scenarios": scenarios_catalogue(lang)}


@router.post("/conversation/message", summary="Send a turn to the Spanish teacher")
async def conversation_endpoint(body: ConversationMessageRequest) -> Dict[str, Any]:
    return await conversation_message(
        scenario=body.scenario, difficulty=body.difficulty,
        history=body.history, user_text=body.user_text, lang=body.lang,
    )


@router.post("/writing/feedback", summary="Get feedback on a Spanish text")
async def writing_endpoint(body: WritingRequest) -> Dict[str, Any]:
    return await writing_feedback(body.text, body.register, body.lang)
