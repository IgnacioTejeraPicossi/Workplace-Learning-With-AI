"""Offline contract tests for Andrés' scholarly research (V1).

Mocks the three source fetchers so no network is touched. Verifies aggregation,
per-source failure isolation, the empty-query guard, and the prompt block.
"""
from unittest.mock import patch, AsyncMock

import pytest

from backend.services.andres import scholarly_research as S


_ARXIV = [{"title": "Attention Is All You Need", "url": "http://arxiv.org/abs/1706.03762",
           "snippet": "The Transformer…", "source": "arXiv"}]
_S2 = [{"title": "BERT (2018)", "url": "https://doi.org/10.18653/v1/N19-1423",
        "snippet": "Bidirectional…", "source": "Semantic Scholar"}]
_WIKI = [{"title": "Transformer (machine learning)",
          "url": "https://en.wikipedia.org/wiki/Transformer_(machine_learning)",
          "snippet": "A transformer is…", "source": "Wikipedia"}]


@pytest.mark.asyncio
async def test_scholarly_aggregates_and_numbers_citations():
    with patch.object(S, "_arxiv", AsyncMock(return_value=_ARXIV)), \
         patch.object(S, "_semantic_scholar", AsyncMock(return_value=_S2)), \
         patch.object(S, "_wikipedia", AsyncMock(return_value=_WIKI)):
        res = await S.research("transformers", limit_per_source=3)
    assert res["used"] is True
    assert res["access"] == "available"
    assert res["sources_consulted"] == 3
    # citations are numbered S1, S2, S3 and carry the source label
    assert [c["n"] for c in res["citations"]] == ["S1", "S2", "S3"]
    assert {c["source"] for c in res["citations"]} == {"arXiv", "Semantic Scholar", "Wikipedia"}


@pytest.mark.asyncio
async def test_scholarly_source_failure_is_isolated():
    # arXiv blows up; the other two still come through, no exception bubbles up.
    with patch.object(S, "_arxiv", AsyncMock(side_effect=RuntimeError("429"))), \
         patch.object(S, "_semantic_scholar", AsyncMock(return_value=_S2)), \
         patch.object(S, "_wikipedia", AsyncMock(return_value=_WIKI)):
        res = await S.research("anything")
    assert res["access"] == "available"
    assert res["sources_consulted"] == 2


@pytest.mark.asyncio
async def test_scholarly_all_fail_degrades_gracefully():
    with patch.object(S, "_arxiv", AsyncMock(side_effect=RuntimeError)), \
         patch.object(S, "_semantic_scholar", AsyncMock(side_effect=RuntimeError)), \
         patch.object(S, "_wikipedia", AsyncMock(side_effect=RuntimeError)):
        res = await S.research("anything")
    assert res["access"] == "unavailable"
    assert res["results"] == [] and res["citations"] == []


@pytest.mark.asyncio
async def test_scholarly_empty_query():
    res = await S.research("   ")
    assert res["access"] == "failed" and res["results"] == []


def test_prompt_block_cites_with_S_tags():
    block = S.prompt_block({"access": "available", "providers": S.PROVIDERS,
                            "sources_consulted": 1, "results": _ARXIV})
    assert "[S1]" in block and "SCHOLARLY SOURCES" in block
    empty = S.prompt_block({"access": "unavailable", "providers": S.PROVIDERS, "results": []})
    assert "do not invent papers" in empty
