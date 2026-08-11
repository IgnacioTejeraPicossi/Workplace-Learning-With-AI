"""
Self-Simulating Reality Agent — red-team contract tests (offline).

ask_ai_unified is patched so the trilingual mock runs with no network/key.

Run: python -m pytest backend/tests/test_self_sim_reality_redteam.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app

BASE = "http://test"
_ALLOWED_TYPES = {"empirical", "logical", "conceptual", "methodological", "parsimony"}
_ALLOWED_STRENGTH = {"strong", "moderate", "weak"}
_ALLOWED_VERDICTS = {"holds_up", "weakened", "does_not_survive"}


@patch("backend.services.self_sim_reality_redteam.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_redteam_offline_mock_is_structured(mock_llm):
    mock_llm.return_value = "[MOCKED RESPONSE] no provider"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/red-team",
                         json={"claim": "Consciousness collapses the wavefunction.", "lang": "en"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    assert d["steelman"]                                   # steelman first (good faith)
    assert len(d["objections"]) >= 2
    for o in d["objections"]:
        assert o["type"] in _ALLOWED_TYPES and o["strength"] in _ALLOWED_STRENGTH and o["detail"]
    assert len(d["what_would_change_my_mind"]) >= 1
    assert d["verdict"] in _ALLOWED_VERDICTS
    assert "surviving_core" in d


@patch("backend.services.self_sim_reality_redteam.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_redteam_real_json_sanitized(mock_llm):
    # off-list type / strength / verdict must be clamped
    mock_llm.return_value = (
        '{"steelman":"Strongest fair version.",'
        '"objections":[{"title":"X","type":"vibes","detail":"d","strength":"nuclear"},'
        '{"title":"Y","type":"empirical","detail":"e","strength":"strong"}],'
        '"what_would_change_my_mind":["a repeatable experiment"],'
        '"surviving_core":"the measurement correlation",'
        '"verdict":"totally_destroyed"}'
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/self-sim-reality/red-team",
                         json={"claim": "The universe simulates itself."})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert d["objections"][0]["type"] in _ALLOWED_TYPES          # clamped from "vibes"
    assert d["objections"][0]["strength"] in _ALLOWED_STRENGTH   # clamped from "nuclear"
    assert d["verdict"] in _ALLOWED_VERDICTS                     # clamped from "totally_destroyed"


@pytest.mark.asyncio
async def test_redteam_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        empty = await c.post("/api/self-sim-reality/red-team", json={"claim": ""})
        badlang = await c.post("/api/self-sim-reality/red-team",
                               json={"claim": "x", "lang": "fr"})
    assert empty.status_code == 422
    assert badlang.status_code == 422
