"""Offline tests for Andrés' memory consolidation (P3).

Collections mocked → no Mongo. Covers: proposing (grounded offline summary),
the too-small-cluster guard, approving (creates one semantic memory + archives
the sources, never deletes), and rejecting.
"""
from unittest.mock import patch, AsyncMock, MagicMock

import pytest

from backend.services.andres import consolidation_service as C


class _Cursor:
    def __init__(self, docs):
        self._docs = list(docs)
    def sort(self, *_a, **_k):
        return self
    def limit(self, *_a, **_k):
        return self
    def __aiter__(self):
        async def gen():
            for d in self._docs:
                yield d
        return gen()


def _episodic(n):
    return [{"_id": f"m{i}", "content": f"a small early memory number {i}",
             "type": "episodic", "importance": 0.3, "access_count": 0,
             "created_at": f"2026-01-0{i}"} for i in range(1, n + 1)]


@pytest.mark.asyncio
async def test_propose_needs_a_minimum_cluster():
    mem = MagicMock()
    mem.find = lambda *a, **k: _Cursor(_episodic(2))   # only 2 → below _MIN_CLUSTER
    with patch.object(C, "andres_memories", mem):
        res = await C.propose_consolidation("u1")
    assert res["status"] == "nothing"


@pytest.mark.asyncio
async def test_propose_builds_grounded_offline_summary():
    mem = MagicMock()
    mem.find = lambda *a, **k: _Cursor(_episodic(5))
    cons = MagicMock()
    cons.insert_one = AsyncMock(return_value=MagicMock(inserted_id="c1"))
    with patch.object(C, "andres_memories", mem), \
         patch.object(C, "andres_memory_consolidations", cons), \
         patch.object(C.semantic_memory, "embed_text", return_value=None):
        res = await C.propose_consolidation("u1")
    assert res["status"] == "proposed"
    p = res["proposal"]
    assert p["count"] == 5 and len(p["source_ids"]) == 5
    assert p["is_mock"] is True                 # offline → deterministic summary
    assert "consolidation of 5" in p["summary"]  # grounded, not fabricated


@pytest.mark.asyncio
async def test_approve_creates_semantic_and_archives_sources():
    prop = {"_id": "c1", "user_id": "u1", "status": "pending",
            "summary": "a consolidated memory",
            "source_ids": ["a" * 24, "b" * 24, "c" * 24]}   # valid 24-hex ObjectId strings
    cons = MagicMock()
    cons.find_one = AsyncMock(return_value=dict(prop))
    cons.update_one = AsyncMock(return_value=None)
    mem = MagicMock()
    mem.insert_one = AsyncMock(return_value=MagicMock(inserted_id="new1"))
    mem.update_many = AsyncMock(return_value=MagicMock(modified_count=3))
    mem.count_documents = AsyncMock(return_value=10)
    prof = MagicMock(); prof.update_one = AsyncMock(return_value=None)
    with patch.object(C, "andres_memory_consolidations", cons), \
         patch.object(C, "andres_memories", mem), \
         patch.object(C, "andres_profiles", prof), \
         patch.object(C.semantic_memory, "embed_text", return_value=None), \
         patch.object(C, "_oid", lambda s: s):
        res = await C.act_on_consolidation("u1", "c1", "approve")
    assert res["status"] == "approved"
    assert res["new_memory_id"] == "new1"
    assert res["archived_sources"] == 3
    # the new memory is semantic + sourced from consolidation; sources archived not deleted
    new_doc = mem.insert_one.await_args.args[0]
    assert new_doc["type"] == "semantic" and new_doc["source"] == "consolidation"
    archive_set = mem.update_many.await_args.args[1]["$set"]
    assert archive_set["archived"] is True and archive_set["consolidated_into"] == "new1"
    assert not mem.delete_one.called if hasattr(mem, "delete_one") else True


@pytest.mark.asyncio
async def test_reject_marks_rejected_and_touches_nothing():
    prop = {"_id": "c1", "user_id": "u1", "status": "pending", "summary": "x", "source_ids": ["aa"]}
    cons = MagicMock()
    cons.find_one = AsyncMock(return_value=dict(prop))
    cons.update_one = AsyncMock(return_value=None)
    mem = MagicMock(); mem.insert_one = AsyncMock()
    with patch.object(C, "andres_memory_consolidations", cons), \
         patch.object(C, "andres_memories", mem), \
         patch.object(C, "_oid", lambda s: s):
        res = await C.act_on_consolidation("u1", "c1", "reject")
    assert res["status"] == "rejected"
    assert not mem.insert_one.called   # nothing folded on reject
