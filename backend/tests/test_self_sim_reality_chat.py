"""
Self-Simulating Reality Agent — conversational chat contract tests (offline).

The router + service run with no LLM key: ask_ai_unified is patched to a mock so
the trilingual fallback path is exercised and the epistemic discipline is checked
without any network or model access.

Run: python -m pytest backend/tests/test_self_sim_reality_chat.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import self_sim_reality_chat as svc

BASE = "http://test"

_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}


def test_retrieve_is_deterministic_and_grounded():
    # a consciousness/observer question retrieves relevant chunks
    ids = [c["id"] for c in svc.retrieve("does the observer create reality?")]
    assert "oph-observer-patch" in ids or "rovelli-rqm" in ids
    # an unrelated query still returns OPH-core grounding (never empty)
    fallback = svc.retrieve("zzzzz qqqqq")
    assert fallback and all(c["id"].startswith("oph-") for c in fallback)


def test_kb_expansion_is_wellformed():
    # The hand-curated OPH expansion (2026-08-11) widened the KB; every chunk must
    # stay well-formed and tagged, and OPH-book-sourced chunks stay speculative
    # (or philosophy for the metaphysics chapter) — never presented as established.
    kb = svc.KNOWLEDGE_BASE
    assert len(kb) >= 26
    ids = [c["id"] for c in kb]
    assert len(ids) == len(set(ids))            # no duplicate ids
    for c in kb:
        assert c["id"] and c["title"] and c["text"]
        assert c["level"] in _ALLOWED_LEVELS
        assert c["sources"] and c["tags"]
        # a chunk crediting the OPH book must never be tagged as settled science
        if any("OPH book" in s for s in c["sources"]):
            assert c["level"] in {"speculative", "philosophy"}


def test_health_and_concepts():
    h = svc.health()
    assert h["status"] == "ok" and h["kb_chunks"] >= 10
    items = svc.concepts()
    assert len(items) == h["kb_chunks"]
    # every curated concept carries a valid epistemic level
    assert all(c["level"] in _ALLOWED_LEVELS for c in items)


@patch("backend.services.self_sim_reality_chat.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_offline_mock_is_structured_and_tagged(mock_llm):
    mock_llm.return_value = "[MOCKED RESPONSE] no provider"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/chat",
                         json={"message": "Does consciousness create the universe?", "lang": "en"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    # structured shape the frontend depends on
    assert d["short_answer"]
    assert isinstance(d["sections"], list) and len(d["sections"]) >= 1
    # every section is tagged with an on-palette evidence level
    assert all(s["level"] in _ALLOWED_LEVELS for s in d["sections"])
    assert len(d["objections"]) >= 1
    assert d["safer_reformulation"]           # the question had an over-claim
    assert d["suggested_next_question"]


@patch("backend.services.self_sim_reality_chat.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_real_llm_json_is_sanitized(mock_llm):
    # a real-looking JSON reply, including an OFF-palette level that must be clamped
    mock_llm.return_value = (
        '{"short_answer":"Observers correlate with outcomes.",'
        '"sections":[{"kind":"scientific_grounding","level":"established",'
        '"text":"Measurement interactions correlate with quantum outcomes.","sources":["Bell tests"]},'
        '{"kind":"oph_interpretation","level":"totally_made_up",'
        '"text":"OPH says reality is a fixed point.","sources":["OPH"]}],'
        '"objections":["Observer here is a device, not a mind."],'
        '"safer_reformulation":"",'
        '"suggested_next_question":"What is a fixed point?"}'
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/chat",
                         json={"message": "What is the observer effect?", "lang": "en"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    # the off-palette level was clamped to a safe default (speculative)
    levels = [s["level"] for s in d["sections"]]
    assert "totally_made_up" not in levels
    assert all(lv in _ALLOWED_LEVELS for lv in levels)


@pytest.mark.asyncio
async def test_chat_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        empty = await c.post("/api/self-sim-reality/chat", json={"message": ""})
        badlang = await c.post("/api/self-sim-reality/chat",
                               json={"message": "hi", "lang": "de"})
    assert empty.status_code == 422
    assert badlang.status_code == 422


@pytest.mark.asyncio
async def test_concepts_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/self-sim-reality/concepts")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] >= 10
    assert d["concepts"][0]["level"] in _ALLOWED_LEVELS
