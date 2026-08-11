"""
Self-Simulating Reality Agent — vector store + source-map contract tests (offline).

The embeddings backend is forced OFF (patched) so the deterministic TF-IDF vector
store is exercised without any network or API key.

Run: python -m pytest backend/tests/test_self_sim_reality_vectorstore.py -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import self_sim_reality_vectorstore as vs

BASE = "http://test"
_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}


def test_tfidf_ranks_relevant_chunk_first():
    r = vs.search("does the observer collapse the wavefunction in quantum measurement?",
                  k=3, backend="tfidf")
    assert r["backend"] == "tfidf"
    assert r["count"] >= 1
    # Rovelli's relational QM is the most on-topic chunk for observer + measurement
    assert r["results"][0]["id"] == "rovelli-rqm"
    # scores are sorted descending and each result carries a valid level
    scores = [x["score"] for x in r["results"]]
    assert scores == sorted(scores, reverse=True)
    assert all(x["level"] in _ALLOWED_LEVELS for x in r["results"])


def test_tfidf_simulation_topic():
    ids = [x["id"] for x in vs.search("are we living in a simulation?", k=3, backend="tfidf")["results"]]
    assert "bostrom-simulation" in ids or "oph-self-simulating" in ids


def test_tfidf_no_overlap_returns_empty_not_crash():
    # gibberish with no corpus terms → empty (the chat layer supplies the OPH fallback)
    r = vs.search("zzzzz qqqqq wwwww", k=5, backend="tfidf")
    assert r["backend"] == "tfidf" and r["count"] == 0


def test_health_reports_backend():
    h = vs.health()
    assert h["status"] == "ok" and h["kb_chunks"] >= 10
    assert h["default_backend"] in {"embeddings", "tfidf"}


@patch("backend.services.self_sim_reality_vectorstore.embeddings_available", return_value=False)
@pytest.mark.asyncio
async def test_source_map_endpoint_tfidf(_no_embed):
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/source-map",
                         json={"topic": "the observer effect and consciousness", "k": 4})
    assert r.status_code == 200
    d = r.json()
    assert d["backend"] == "tfidf"          # embeddings forced off → deterministic
    assert d["topic"].startswith("the observer")
    assert 1 <= d["count"] <= 4
    assert all(x["level"] in _ALLOWED_LEVELS for x in d["results"])
    assert "score" in d["results"][0]


@pytest.mark.asyncio
async def test_source_map_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        empty = await c.post("/api/self-sim-reality/source-map", json={"topic": ""})
        badk = await c.post("/api/self-sim-reality/source-map", json={"topic": "x", "k": 99})
        badbackend = await c.post("/api/self-sim-reality/source-map",
                                  json={"topic": "x", "backend": "magic"})
    assert empty.status_code == 422
    assert badk.status_code == 422
    assert badbackend.status_code == 422


@pytest.mark.asyncio
async def test_vectorstore_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/self-sim-reality/vectorstore/health")
    assert r.status_code == 200
    assert r.json()["component"] == "self_sim_reality_vectorstore"
