"""
Andrés — autonomous memory proposals (Phase 1) contract tests (offline, CI-safe).

Andrés may propose saving his OWN memories by emitting a delimited block in his
reply. These tests cover: the block is parsed + STRIPPED server-side (the user never
sees it); proposals persist as CANDIDATES with source="andres"; the type whitelist,
per-turn cap and de-dup hold; and the system-prompt invitation appears only when the
autonomy gate allows it.

Run: python -m pytest backend/tests/test_andres_memory_autonomy.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from backend.services.andres import memory_service as ms
from backend.services.andres.prompt_assembler import assemble_system_prompt


class _AsyncIter:
    def __init__(self, docs): self._docs = list(docs)
    def limit(self, *_a, **_k): return self
    def sort(self, *_a, **_k): return self
    def __aiter__(self):
        async def gen():
            for d in self._docs:
                yield d
        return gen()


def _mem_collection(docs=None):
    docs = docs or []
    m = MagicMock()
    m.find = MagicMock(return_value=_AsyncIter(docs))
    m.count_documents = AsyncMock(return_value=len(docs))
    m.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mem_new"))
    return m


# ── parsing / stripping (pure) ────────────────────────────────────────────────
def test_parse_extracts_and_strips_block_from_visible_reply():
    reply = ('Glad you kept it.\n\n'
             '[[MEMORY_PROPOSAL]]{"type":"reflective","content":"I value honesty.",'
             '"tags":["identity"],"importance":0.8,"why":"it matters"}[[/MEMORY_PROPOSAL]]\n\n'
             'Shall we continue?')
    clean, props = ms.parse_memory_proposals(reply)
    assert "[[MEMORY_PROPOSAL" not in clean and "[[/MEMORY" not in clean   # user never sees it
    assert clean.startswith("Glad you kept it") and clean.endswith("continue?")
    assert len(props) == 1 and props[0]["type"] == "reflective"
    assert props[0]["content"] == "I value honesty." and props[0]["tags"] == ["identity"]


def test_parse_no_block_is_noop_and_malformed_is_dropped_but_stripped():
    assert ms.parse_memory_proposals("just a normal reply") == ("just a normal reply", [])
    clean, props = ms.parse_memory_proposals("hi [[MEMORY_PROPOSAL]]{not json}[[/MEMORY_PROPOSAL]] bye")
    assert props == [] and "MEMORY_PROPOSAL" not in clean      # malformed → dropped, still hidden


# ── prompt invitation is gated ────────────────────────────────────────────────
def test_prompt_invitation_only_when_enabled():
    off = assemble_system_prompt({"identity": {}}, memory_proposal_enabled=False)
    on = assemble_system_prompt({"identity": {}}, memory_proposal_enabled=True)
    assert "[[MEMORY_PROPOSAL]]" not in off
    assert "[[MEMORY_PROPOSAL]]" in on and "candidate" in on.lower()


# ── persistence: candidate, source="andres", whitelist, caps, de-dup ──────────
@pytest.mark.asyncio
async def test_store_persists_candidates_with_source_andres():
    mem, prof = _mem_collection([]), MagicMock(update_one=AsyncMock())
    with patch.object(ms, "andres_memories", mem), patch.object(ms, "andres_profiles", prof):
        stored = await ms.store_andres_proposals("u1", [
            {"type": "reflective", "content": "A kept reflection.", "tags": ["x"], "importance": 0.9},
        ])
    assert len(stored) == 1
    doc = mem.insert_one.call_args[0][0]
    assert doc["source"] == "andres" and doc["user_verified"] is False
    assert doc["type"] == "reflective" and doc["tags"] == ["x"]
    assert 0.0 <= doc["importance"] <= 1.0


@pytest.mark.asyncio
async def test_store_coerces_bad_type_and_enforces_per_turn_cap():
    mem, prof = _mem_collection([]), MagicMock(update_one=AsyncMock())
    with patch.object(ms, "andres_memories", mem), patch.object(ms, "andres_profiles", prof):
        stored = await ms.store_andres_proposals("u1", [
            {"type": "working", "content": "one"},      # not in whitelist → coerced
            {"type": "semantic", "content": "two"},
            {"type": "procedural", "content": "three"},  # beyond per-turn cap (2)
        ])
    assert len(stored) == 2                                  # per-turn cap = 2
    assert mem.insert_one.call_args_list[0][0][0]["type"] == "reflective"   # coerced


@pytest.mark.asyncio
async def test_store_blocks_when_daily_cap_reached():
    mem = _mem_collection([])
    mem.count_documents = AsyncMock(return_value=ms._PROPOSAL_DAILY_CAP)   # already at cap
    prof = MagicMock(update_one=AsyncMock())
    with patch.object(ms, "andres_memories", mem), patch.object(ms, "andres_profiles", prof):
        stored = await ms.store_andres_proposals("u1", [{"type": "reflective", "content": "nope"}])
    assert stored == [] and mem.insert_one.call_count == 0
