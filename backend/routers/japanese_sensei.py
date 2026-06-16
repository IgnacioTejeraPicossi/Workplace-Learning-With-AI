"""
Japanese Sensei AI — Router
============================
REST API for the Japanese language learning agent.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.japanese_sensei import (
        get_kana_deck, kana_review,
        get_kanji_deck, get_kanji_detail, kanji_mark,
        get_vocab_all, srs_due, srs_review,
        get_overview, conversation_message, scenarios_catalogue,
        get_grammar_path, get_grammar_point,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
    )
except ImportError:  # pragma: no cover
    from services.japanese_sensei import (  # type: ignore
        get_kana_deck, kana_review,
        get_kanji_deck, get_kanji_detail, kanji_mark,
        get_vocab_all, srs_due, srs_review,
        get_overview, conversation_message, scenarios_catalogue,
        get_grammar_path, get_grammar_point,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
    )

router = APIRouter(prefix="/api/japanese")


# ─── Request models ───────────────────────────────────────────────────────────

class KanaReviewRequest(BaseModel):
    char: str = Field(..., description="The kana character being reviewed")
    correct: bool = Field(..., description="Whether the answer was correct")


class KanjiMarkRequest(BaseModel):
    char: str = Field(..., description="The kanji character")
    status: str = Field(..., pattern=r"^(learning|known|review)$")


class SrsReviewRequest(BaseModel):
    vocab_id: str = Field(..., description="Vocabulary item id (e.g. 'n5_001')")
    grade: str = Field(..., pattern=r"^(again|good|easy)$")


class ConversationMessageRequest(BaseModel):
    scenario: str = Field("intro", description="Conversation scenario key")
    difficulty: str = Field("beginner", pattern=r"^(beginner|intermediate|advanced)$")
    history: List[Dict[str, str]] = Field(default_factory=list,
                                          description="Prior turns: [{role,content}, ...]")
    user_text: Optional[str] = Field(None, description="Latest user utterance (Japanese or fallback)")
    lang: str = Field("es")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health probe")
async def health() -> Dict[str, str]:
    return {"status": "ok", "agent": "japanese_sensei"}


@router.get("/overview", summary="Dashboard overview — stats + today's mission")
async def overview_endpoint() -> Dict[str, Any]:
    return await get_overview()


@router.get("/kana/deck", summary="Hiragana / Katakana deck")
async def kana_deck_endpoint(
    type: str = Query("all", pattern=r"^(hiragana|katakana|all)$"),
) -> Dict[str, Any]:
    deck = get_kana_deck(type)
    return {"type": type, "count": len(deck), "items": deck}


@router.post("/kana/review", summary="Record a single kana review answer")
async def kana_review_endpoint(body: KanaReviewRequest) -> Dict[str, Any]:
    return await kana_review(body.char, body.correct)


@router.get("/kanji/deck", summary="Kanji catalogue (V1: first 10 N5)")
async def kanji_deck_endpoint() -> Dict[str, Any]:
    deck = get_kanji_deck()
    return {"count": len(deck), "items": deck}


@router.get("/kanji/{character}", summary="Single kanji detail")
async def kanji_detail_endpoint(character: str) -> Dict[str, Any]:
    detail = get_kanji_detail(character)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Kanji not in V1 deck: {character}")
    return detail


@router.post("/kanji/mark", summary="Mark a kanji as learning / known / review")
async def kanji_mark_endpoint(body: KanjiMarkRequest) -> Dict[str, Any]:
    return await kanji_mark(body.char, body.status)


@router.get("/vocab/all", summary="Full N5 vocabulary list")
async def vocab_all_endpoint() -> Dict[str, Any]:
    items = get_vocab_all()
    return {"count": len(items), "items": items}


@router.get("/srs/due", summary="Vocabulary items currently due for review")
async def srs_due_endpoint(
    limit: int = Query(20, ge=1, le=100),
) -> Dict[str, Any]:
    items = await srs_due(limit=limit)
    return {"count": len(items), "items": items}


@router.post("/srs/review", summary="Grade a vocabulary review")
async def srs_review_endpoint(body: SrsReviewRequest) -> Dict[str, Any]:
    return await srs_review(body.vocab_id, body.grade)


@router.get("/conversation/scenarios", summary="List available conversation scenarios")
async def scenarios_endpoint(lang: str = Query("es")) -> Dict[str, Any]:
    return {"scenarios": scenarios_catalogue(lang)}


@router.post("/conversation/message", summary="Send a turn to the Japanese Sensei")
async def conversation_endpoint(body: ConversationMessageRequest) -> Dict[str, Any]:
    return await conversation_message(
        scenario=body.scenario,
        difficulty=body.difficulty,
        history=body.history,
        user_text=body.user_text,
        lang=body.lang,
    )


# ─── V2 endpoints ─────────────────────────────────────────────────────────────

@router.get("/grammar/path", summary="Grammar points for a given JLPT level (V2)")
async def grammar_path_endpoint(level: str = Query("N5", pattern=r"^N[1-5]$")) -> Dict[str, Any]:
    points = get_grammar_path(level)
    return {"level": level, "count": len(points), "items": points}


@router.get("/grammar/{point_id}", summary="Single grammar point detail (V2)")
async def grammar_point_endpoint(point_id: str) -> Dict[str, Any]:
    p = get_grammar_point(point_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Grammar point not found: {point_id}")
    return p


@router.get("/reading/texts", summary="List available reading practice texts (V2)")
async def reading_list_endpoint() -> Dict[str, Any]:
    items = get_reading_texts()
    return {"count": len(items), "items": items}


@router.get("/reading/{text_id}", summary="Single reading text with full breakdown (V2)")
async def reading_text_endpoint(text_id: str) -> Dict[str, Any]:
    t = get_reading_text(text_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Reading text not found: {text_id}")
    return t


@router.get("/speaking/phrases", summary="Speaking Lab practice phrases (V2)")
async def speaking_phrases_endpoint() -> Dict[str, Any]:
    items = get_speaking_phrases()
    return {"count": len(items), "items": items}


class SpeakingAttemptRequest(BaseModel):
    phrase_id: str = Field(..., description="Phrase being practiced (e.g. 'sp1')")
    transcript: str = Field(..., description="What Web Speech API heard")


@router.post("/speaking/attempt", summary="Record a speaking attempt (V2)")
async def speaking_attempt_endpoint(body: SpeakingAttemptRequest) -> Dict[str, Any]:
    return await speaking_attempt(body.phrase_id, body.transcript)
