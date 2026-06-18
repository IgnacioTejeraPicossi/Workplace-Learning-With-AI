"""
Maestro Chino IA — Router
===========================
REST API for the Mandarin Chinese learning agent.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.chinese_teacher import (
        get_pinyin_deck,
        get_hanzi_deck, get_hanzi_detail, hanzi_mark,
        get_radicals,
        get_vocab_all, srs_due, srs_review,
        get_grammar_path, get_grammar_point,
        get_overview, conversation_message, scenarios_catalogue,
        get_bridge_entries, get_bridge_entry,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
        get_culture_notes, get_culture_note,
    )
except ImportError:  # pragma: no cover
    from services.chinese_teacher import (  # type: ignore
        get_pinyin_deck,
        get_hanzi_deck, get_hanzi_detail, hanzi_mark,
        get_radicals,
        get_vocab_all, srs_due, srs_review,
        get_grammar_path, get_grammar_point,
        get_overview, conversation_message, scenarios_catalogue,
        get_bridge_entries, get_bridge_entry,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
        get_culture_notes, get_culture_note,
    )

router = APIRouter(prefix="/api/chinese")


# ─── Request models ───────────────────────────────────────────────────────────

class HanziMarkRequest(BaseModel):
    char: str = Field(..., description="Hanzi character")
    status: str = Field(..., pattern=r"^(learning|known|review)$")


class SrsReviewRequest(BaseModel):
    vocab_id: str = Field(..., description="Vocabulary item id (e.g. 'hsk1_001')")
    grade: str = Field(..., pattern=r"^(again|good|easy)$")


class ConversationMessageRequest(BaseModel):
    scenario: str = Field("intro", description="Conversation scenario key")
    difficulty: str = Field("beginner", pattern=r"^(beginner|intermediate|advanced)$")
    history: List[Dict[str, str]] = Field(default_factory=list)
    user_text: Optional[str] = Field(None)
    lang: str = Field("es")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health probe")
async def health() -> Dict[str, str]:
    return {"status": "ok", "agent": "chinese_teacher"}


@router.get("/overview", summary="Dashboard overview — stats + today's mission")
async def overview_endpoint() -> Dict[str, Any]:
    return await get_overview()


@router.get("/pinyin/deck", summary="Pinyin initials/finals/tones/syllables")
async def pinyin_deck_endpoint() -> Dict[str, Any]:
    return get_pinyin_deck()


@router.get("/hanzi/deck", summary="HSK1 hanzi deck (50 chars)")
async def hanzi_deck_endpoint() -> Dict[str, Any]:
    deck = get_hanzi_deck()
    return {"count": len(deck), "items": deck}


@router.get("/hanzi/{character}", summary="Single hanzi detail")
async def hanzi_detail_endpoint(character: str) -> Dict[str, Any]:
    detail = get_hanzi_detail(character)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Hanzi not in V1 deck: {character}")
    return detail


@router.post("/hanzi/mark", summary="Mark a hanzi as learning / known / review")
async def hanzi_mark_endpoint(body: HanziMarkRequest) -> Dict[str, Any]:
    return await hanzi_mark(body.char, body.status)


@router.get("/radicals", summary="20 common radicals with examples")
async def radicals_endpoint() -> Dict[str, Any]:
    items = get_radicals()
    return {"count": len(items), "items": items}


@router.get("/vocab/all", summary="Full HSK1 vocabulary list")
async def vocab_all_endpoint() -> Dict[str, Any]:
    items = get_vocab_all()
    return {"count": len(items), "items": items}


@router.get("/srs/due", summary="Vocabulary items currently due for review")
async def srs_due_endpoint(limit: int = Query(20, ge=1, le=100)) -> Dict[str, Any]:
    items = await srs_due(limit=limit)
    return {"count": len(items), "items": items}


@router.post("/srs/review", summary="Grade a vocabulary review")
async def srs_review_endpoint(body: SrsReviewRequest) -> Dict[str, Any]:
    return await srs_review(body.vocab_id, body.grade)


@router.get("/grammar/path", summary="Grammar points for a given HSK level")
async def grammar_path_endpoint(hsk: str = Query("HSK1", pattern=r"^HSK[1-6]$")) -> Dict[str, Any]:
    points = get_grammar_path(hsk)
    return {"hsk": hsk, "count": len(points), "items": points}


@router.get("/grammar/{point_id}", summary="Single grammar point detail")
async def grammar_point_endpoint(point_id: str) -> Dict[str, Any]:
    p = get_grammar_point(point_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Grammar point not found: {point_id}")
    return p


@router.get("/conversation/scenarios", summary="List available conversation scenarios")
async def scenarios_endpoint(lang: str = Query("es")) -> Dict[str, Any]:
    return {"scenarios": scenarios_catalogue(lang)}


@router.post("/conversation/message", summary="Send a turn to the Chinese Shifu")
async def conversation_endpoint(body: ConversationMessageRequest) -> Dict[str, Any]:
    return await conversation_message(
        scenario=body.scenario, difficulty=body.difficulty,
        history=body.history, user_text=body.user_text, lang=body.lang,
    )


@router.get("/bridge", summary="Kanji-Hanzi Bridge entries (curated + auto)")
async def bridge_endpoint() -> Dict[str, Any]:
    items = get_bridge_entries()
    return {"count": len(items), "items": items}


@router.get("/bridge/{char}", summary="Bridge entry for a specific character")
async def bridge_char_endpoint(char: str) -> Dict[str, Any]:
    entry = get_bridge_entry(char)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Bridge entry not found: {char}")
    return entry


# ─── V2 endpoints (Reading, Speaking, Culture) ────────────────────────────────

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


@router.get("/culture/notes", summary="List all culture notes (V2)")
async def culture_notes_endpoint() -> Dict[str, Any]:
    items = get_culture_notes()
    return {"count": len(items), "items": items}


@router.get("/culture/{note_id}", summary="Single culture note detail (V2)")
async def culture_note_endpoint(note_id: str) -> Dict[str, Any]:
    n = get_culture_note(note_id)
    if not n:
        raise HTTPException(status_code=404, detail=f"Culture note not found: {note_id}")
    return n
