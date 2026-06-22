"""
Maestro Coreano IA — Router
===========================
REST API for the Korean language learning agent.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.korean_teacher import (
        get_hangul_deck, get_seed_syllables,
        compose_syllable, decompose_syllable, romanize_word,
        get_batchim_deck,
        get_vocab_all, srs_due, srs_review,
        get_grammar_path, get_grammar_point,
        get_overview, conversation_message, scenarios_catalogue,
        get_cjk_bridge_entries, get_cjk_bridge_entry, get_hanja_lookup,
        jamo_mark, syllable_attempt,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
        get_culture_notes, get_culture_note,
    )
except ImportError:  # pragma: no cover
    from services.korean_teacher import (  # type: ignore
        get_hangul_deck, get_seed_syllables,
        compose_syllable, decompose_syllable, romanize_word,
        get_batchim_deck,
        get_vocab_all, srs_due, srs_review,
        get_grammar_path, get_grammar_point,
        get_overview, conversation_message, scenarios_catalogue,
        get_cjk_bridge_entries, get_cjk_bridge_entry, get_hanja_lookup,
        jamo_mark, syllable_attempt,
        get_reading_texts, get_reading_text,
        get_speaking_phrases, speaking_attempt,
        get_culture_notes, get_culture_note,
    )

router = APIRouter(prefix="/api/korean")


# ─── Request models ───────────────────────────────────────────────────────────

class JamoMarkRequest(BaseModel):
    jamo: str = Field(..., description="Jamo character (e.g. 'ㄱ')")
    status: str = Field(..., pattern=r"^(learning|known|review)$")


class SyllableBuildRequest(BaseModel):
    initial: str = Field(..., description="Initial consonant jamo (e.g. 'ㅎ')")
    medial:  str = Field(..., description="Medial vowel jamo (e.g. 'ㅏ')")
    final:   str = Field("",  description="Final consonant jamo, optional (e.g. 'ㄴ' or '')")


class SrsReviewRequest(BaseModel):
    vocab_id: str = Field(..., description="Vocabulary item id (e.g. 'topik1_001')")
    grade: str = Field(..., pattern=r"^(again|good|easy)$")


class ConversationMessageRequest(BaseModel):
    scenario: str = Field("intro", description="Conversation scenario key")
    difficulty: str = Field("beginner", pattern=r"^(beginner|intermediate|advanced)$")
    history: List[Dict[str, str]] = Field(default_factory=list)
    user_text: Optional[str] = Field(None)
    lang: str = Field("es")


class RomanizeRequest(BaseModel):
    word: str = Field(..., description="A Korean word in Hangul to romanize")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health probe")
async def health() -> Dict[str, str]:
    return {"status": "ok", "agent": "korean_teacher"}


@router.get("/overview", summary="Dashboard overview — stats + today's mission")
async def overview_endpoint() -> Dict[str, Any]:
    return await get_overview()


# ─── Hangul ───────────────────────────────────────────────────────────────────

@router.get("/hangul/deck", summary="Hangul jamo deck (consonants, vowels, doubles, compounds)")
async def hangul_deck_endpoint() -> Dict[str, Any]:
    return get_hangul_deck()


@router.post("/hangul/mark", summary="Mark a jamo as learning / known / review")
async def hangul_mark_endpoint(body: JamoMarkRequest) -> Dict[str, Any]:
    return await jamo_mark(body.jamo, body.status)


# ─── Syllable Builder ─────────────────────────────────────────────────────────

@router.get("/syllable/seeds", summary="Curated seed syllable blocks")
async def syllable_seeds_endpoint() -> Dict[str, Any]:
    items = get_seed_syllables()
    return {"count": len(items), "items": items}


@router.post("/syllable/build", summary="Compose a Hangul syllable block from jamo")
async def syllable_build_endpoint(body: SyllableBuildRequest) -> Dict[str, Any]:
    block = compose_syllable(body.initial, body.medial, body.final)
    if not block:
        raise HTTPException(status_code=400,
                            detail=f"Invalid jamo combination: '{body.initial}' + '{body.medial}' + '{body.final}'")
    decomp = decompose_syllable(block)
    return {
        "block": block,
        "initial": body.initial,
        "medial": body.medial,
        "final": body.final,
        "romanization": decomp["romanization"] if decomp else "",
        "has_batchim": bool(body.final),
    }


@router.get("/syllable/decompose/{block}", summary="Decompose a Hangul block into jamo")
async def syllable_decompose_endpoint(block: str) -> Dict[str, Any]:
    d = decompose_syllable(block)
    if not d:
        raise HTTPException(status_code=400, detail=f"Not a valid Hangul block: {block}")
    return d


@router.post("/syllable/attempt", summary="Record a syllable building attempt")
async def syllable_attempt_endpoint(body: SyllableBuildRequest) -> Dict[str, Any]:
    return await syllable_attempt(body.initial, body.medial, body.final)


@router.post("/romanize", summary="Romanize a Korean word (Revised Romanization)")
async def romanize_endpoint(body: RomanizeRequest) -> Dict[str, Any]:
    return {"word": body.word, "romanization": romanize_word(body.word)}


# ─── Batchim ──────────────────────────────────────────────────────────────────

@router.get("/batchim/deck", summary="Batchim groups + sound-change rules")
async def batchim_deck_endpoint() -> Dict[str, Any]:
    return get_batchim_deck()


# ─── Vocabulary + SRS ─────────────────────────────────────────────────────────

@router.get("/vocab/all", summary="Full TOPIK1 vocabulary list")
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


# ─── Grammar ──────────────────────────────────────────────────────────────────

@router.get("/grammar/path", summary="Grammar points for a given TOPIK level")
async def grammar_path_endpoint(topik: str = Query("TOPIK1", pattern=r"^TOPIK[1-6]$")) -> Dict[str, Any]:
    points = get_grammar_path(topik)
    return {"topik": topik, "count": len(points), "items": points}


@router.get("/grammar/{point_id}", summary="Single grammar point detail")
async def grammar_point_endpoint(point_id: str) -> Dict[str, Any]:
    p = get_grammar_point(point_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Grammar point not found: {point_id}")
    return p


# ─── Conversation ─────────────────────────────────────────────────────────────

@router.get("/conversation/scenarios", summary="List available conversation scenarios")
async def scenarios_endpoint(lang: str = Query("es")) -> Dict[str, Any]:
    return {"scenarios": scenarios_catalogue(lang)}


@router.post("/conversation/message", summary="Send a turn to the Korean Seonsaeng")
async def conversation_endpoint(body: ConversationMessageRequest) -> Dict[str, Any]:
    return await conversation_message(
        scenario=body.scenario, difficulty=body.difficulty,
        history=body.history, user_text=body.user_text, lang=body.lang,
    )


# ─── CJK Bridge (the differentiator) ──────────────────────────────────────────

@router.get("/bridge", summary="CJK Bridge entries (Hanzi · Kanji · Hanja)")
async def bridge_endpoint() -> Dict[str, Any]:
    items = get_cjk_bridge_entries()
    return {"count": len(items), "items": items}


@router.get("/bridge/{concept_id}", summary="Single CJK Bridge entry by concept_id")
async def bridge_concept_endpoint(concept_id: str) -> Dict[str, Any]:
    entry = get_cjk_bridge_entry(concept_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Bridge concept not found: {concept_id}")
    return entry


@router.get("/hanja/{character}", summary="Look up a Hanja/Hanzi/Kanji character")
async def hanja_endpoint(character: str) -> Dict[str, Any]:
    entry = get_hanja_lookup(character)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Character not found in any CJK map: {character}")
    return entry


# ─── V2: Reading, Speaking, Culture ───────────────────────────────────────────

@router.get("/reading/texts", summary="List available reading texts (V2)")
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
