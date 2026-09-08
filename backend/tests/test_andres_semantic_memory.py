"""Offline tests for Andrés' semantic memory (P2).

Embeddings are OFF under AI_FORCE_MOCK (which conftest sets), so these run with no
network: they check the gating, cosine maths, and that hybrid recall reduces to the
keyword path offline and ranks by meaning when embeddings are injected.
"""
import os
from unittest.mock import patch, AsyncMock

import pytest

from backend.services.andres import semantic_memory as SM
from backend.services.andres import memory_service as MS


def test_embeddings_off_under_force_mock():
    with patch.dict(os.environ, {"AI_FORCE_MOCK": "1"}):
        assert SM.embeddings_available() is False
        assert SM.embed_text("anything") is None


def test_cosine_maths():
    assert SM.cosine([1, 0], [1, 0]) == pytest.approx(1.0)
    assert SM.cosine([1, 0], [0, 1]) == pytest.approx(0.0)
    assert SM.cosine([1, 0], None) == 0.0
    assert SM.cosine([], [1, 2]) == 0.0


class _Cursor:
    def __init__(self, docs):
        self._docs = list(docs)
    def limit(self, *_a, **_k):
        return self
    def sort(self, *_a, **_k):
        return self
    def __aiter__(self):
        async def gen():
            for d in self._docs:
                yield d
        return gen()


def _mem_collection(docs):
    col = AsyncMock()
    col.find = lambda *a, **k: _Cursor(docs)
    col.update_one = AsyncMock(return_value=None)
    return col


@pytest.mark.asyncio
async def test_retrieve_offline_uses_keyword_path():
    # Two memories; query shares words with the second only. Offline (embed→None),
    # so ranking is keyword+importance — the word-overlap memory must win.
    docs = [
        {"_id": "1", "content": "the weather in Oslo was cold", "importance": 0.5},
        {"_id": "2", "content": "Ignacio is learning Japanese at university", "importance": 0.5},
    ]
    with patch.object(MS, "andres_memories", _mem_collection(docs)), \
         patch.object(SM, "embed_text", return_value=None):
        top = await MS.retrieve_relevant("u1", "how is the Japanese course going?", limit=2)
    assert top and top[0]["_id"] == "2"


@pytest.mark.asyncio
async def test_retrieve_semantic_beats_keyword_when_embeddings_present():
    # Query has NO literal word overlap with the relevant memory, but its embedding
    # is close. Semantic ranking must surface it above a keyword-only distractor.
    docs = [
        {"_id": "kw", "content": "course university studies", "importance": 0.5, "embedding": [0.0, 1.0]},
        {"_id": "sem", "content": "totally different words here", "importance": 0.5, "embedding": [1.0, 0.0]},
    ]
    def fake_embed(text):
        return [1.0, 0.05] if "?" in text else None  # query ~ the 'sem' vector
    with patch.object(MS, "andres_memories", _mem_collection(docs)), \
         patch.object(SM, "embed_text", side_effect=fake_embed):
        top = await MS.retrieve_relevant("u1", "unrelated phrasing entirely?", limit=2)
    assert top[0]["_id"] == "sem"
    # the internal embedding vector must never leak into the returned memory
    assert "embedding" not in top[0]
