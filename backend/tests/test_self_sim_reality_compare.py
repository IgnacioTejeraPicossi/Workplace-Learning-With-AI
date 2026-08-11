"""
Self-Simulating Reality Agent — compare-theories contract tests (offline).

ask_ai_unified is patched so the trilingual mock path runs with no network/key,
and the vector-store grounding (TF-IDF) is exercised deterministically.

Run: python -m pytest backend/tests/test_self_sim_reality_compare.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import self_sim_reality_compare as svc

BASE = "http://test"
_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}
_ALLOWED_RELATIONS = {"competing", "complementary", "nested", "orthogonal", "unrelated"}


def test_ground_uses_vectorstore_level():
    # a consciousness-theory query grounds to a mainstream KB chunk with a valid level
    g = svc._ground("integrated information theory of consciousness")
    assert g["level"] in _ALLOWED_LEVELS
    assert g["matched_title"]


@patch("backend.services.self_sim_reality_compare.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_compare_offline_mock_is_structured(mock_llm):
    mock_llm.return_value = "[MOCKED RESPONSE] no provider"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/compare-theories",
                         json={"a": "IIT", "b": "GNW", "lang": "en"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    for side in ("a", "b"):
        assert d[side]["title"] and d[side]["level"] in _ALLOWED_LEVELS and d[side]["summary"]
    assert len(d["agreements"]) >= 1
    assert len(d["differences"]) >= 1 and "point" in d["differences"][0]
    assert d["relation"] in _ALLOWED_RELATIONS
    assert d["honest_note"]


@patch("backend.services.self_sim_reality_compare.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_compare_real_json_sanitized(mock_llm):
    # off-palette level + off-list relation must be clamped
    mock_llm.return_value = (
        '{"a":{"title":"OPH","level":"totally_made_up","summary":"..."},'
        '"b":{"title":"Celestial Holography","level":"mainstream","summary":"..."},'
        '"agreements":["both encode bulk on a boundary"],'
        '"differences":[{"point":"observers","a":"central","b":"absent"}],'
        '"relation":"is_better_than","relation_note":"n","honest_note":"open"}'
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/compare-theories",
                         json={"a": "Observer Patch Holography", "b": "Celestial Holography"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert d["a"]["level"] in _ALLOWED_LEVELS       # clamped from "totally_made_up"
    assert d["a"]["level"] != "totally_made_up"
    assert d["relation"] in _ALLOWED_RELATIONS      # clamped from "is_better_than"


@pytest.mark.asyncio
async def test_compare_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        missing = await c.post("/api/self-sim-reality/compare-theories", json={"a": "IIT"})
        empty = await c.post("/api/self-sim-reality/compare-theories", json={"a": "", "b": "GNW"})
        badlang = await c.post("/api/self-sim-reality/compare-theories",
                               json={"a": "IIT", "b": "GNW", "lang": "de"})
    assert missing.status_code == 422
    assert empty.status_code == 422
    assert badlang.status_code == 422
