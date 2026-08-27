"""Offline contract tests for Andrés' scholarly research (V1 + V2 routing).

Mocks the source fetchers so no network is touched. Verifies aggregation, the
per-source failure isolation, the empty-query guard, the prompt block, and the V2
topic routing ("bibliographic nose") + the new sources' plumbing.
"""
import os
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

_EXPLICIT = ["arxiv", "semantic_scholar", "wikipedia"]


@pytest.mark.asyncio
async def test_scholarly_aggregates_and_numbers_citations():
    with patch.object(S, "_arxiv", AsyncMock(return_value=_ARXIV)), \
         patch.object(S, "_semantic_scholar", AsyncMock(return_value=_S2)), \
         patch.object(S, "_wikipedia", AsyncMock(return_value=_WIKI)):
        res = await S.research("transformers", limit_per_source=3, sources=_EXPLICIT)
    assert res["used"] is True
    assert res["access"] == "available"
    assert res["sources_consulted"] == 3
    assert [c["n"] for c in res["citations"]] == ["S1", "S2", "S3"]
    assert {c["source"] for c in res["citations"]} == {"arXiv", "Semantic Scholar", "Wikipedia"}


@pytest.mark.asyncio
async def test_scholarly_source_failure_is_isolated():
    with patch.object(S, "_arxiv", AsyncMock(side_effect=RuntimeError("429"))), \
         patch.object(S, "_semantic_scholar", AsyncMock(return_value=_S2)), \
         patch.object(S, "_wikipedia", AsyncMock(return_value=_WIKI)):
        res = await S.research("anything", sources=_EXPLICIT)
    assert res["access"] == "available"
    assert res["sources_consulted"] == 2


@pytest.mark.asyncio
async def test_scholarly_all_fail_degrades_gracefully():
    with patch.object(S, "_arxiv", AsyncMock(side_effect=RuntimeError)), \
         patch.object(S, "_semantic_scholar", AsyncMock(side_effect=RuntimeError)), \
         patch.object(S, "_wikipedia", AsyncMock(side_effect=RuntimeError)):
        res = await S.research("anything", sources=_EXPLICIT)
    assert res["access"] == "unavailable"
    assert res["results"] == [] and res["citations"] == []


@pytest.mark.asyncio
async def test_scholarly_empty_query():
    res = await S.research("   ")
    assert res["access"] == "failed" and res["results"] == []


@pytest.mark.asyncio
async def test_scholarly_total_cap():
    many = [{"title": f"p{i}", "url": f"http://x/{i}", "snippet": "", "source": "arXiv"} for i in range(20)]
    with patch.object(S, "_arxiv", AsyncMock(return_value=many)):
        res = await S.research("q", sources=["arxiv"])
    assert res["sources_consulted"] == S._MAX_TOTAL


@pytest.mark.asyncio
async def test_new_source_plumbing_pubmed():
    pm = [{"title": "A clinical study", "url": "https://pubmed.ncbi.nlm.nih.gov/1/",
           "snippet": "Journal (2024)", "source": "PubMed"}]
    with patch.object(S, "_pubmed", AsyncMock(return_value=pm)):
        res = await S.research("diabetes", sources=["pubmed"])
    assert res["citations"][0]["source"] == "PubMed"


def test_prompt_block_cites_with_S_tags():
    block = S.prompt_block({"access": "available", "providers": S.PROVIDERS,
                            "sources_consulted": 1, "results": _ARXIV})
    assert "[S1]" in block and "SCHOLARLY SOURCES" in block
    empty = S.prompt_block({"access": "unavailable", "providers": S.PROVIDERS, "results": []})
    assert "do not invent papers" in empty


# ── V2 routing ("bibliographic nose") ────────────────────────────────────────

def test_routing_medicine_hits_pubmed():
    srcs = S._route_sources("clinical treatment of a disease")
    assert "pubmed" in srcs and "wikipedia" in srcs


def test_routing_stem_hits_arxiv():
    srcs = S._route_sources("a peer-reviewed research paper on preprint datasets")
    assert "arxiv" in srcs and "semantic_scholar" in srcs


def test_routing_books_hits_archives():
    srcs = S._route_sources("a public domain book about cultural history")
    assert "gutenberg" in srcs and "internet_archive" in srcs


def test_routing_always_includes_wikipedia_and_excludes_europeana_without_key():
    with patch.dict(os.environ, {k: v for k, v in os.environ.items() if k != "EUROPEANA_KEY"}, clear=True):
        srcs = S._route_sources("anything at all with no clear topic")
    assert "wikipedia" in srcs
    assert "europeana" not in srcs  # no EUROPEANA_KEY → excluded


def test_routing_never_empty():
    assert S._route_sources("") == list(S._BASELINE_SOURCES) or "wikipedia" in S._route_sources("")
