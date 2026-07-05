"""
Contract smoke tests for the Language Agents subsystem.
=======================================================

Covers the six language agents that all follow the same service→router→i18n
pattern:

    japanese · chinese · korean · english · norwegian · spanish

Before this file the subsystem had ZERO automated coverage (only Robomind had
contract tests), so a silent router-registration failure in app.py — every
language router is wired inside its own try/except — would have gone unnoticed.

What is asserted (the frontend-facing contract, deterministic, no live deps):
  - GET /api/<lang>/health              → 200, {status:"ok", agent:<name>}
  - GET /api/<lang>/overview            → 200, non-empty dict
  - GET /api/<lang>/vocab/all           → 200, {"items": [...]}
  - GET /api/<lang>/srs/due             → 200, {"items": [...]}
  - GET /api/<lang>/grammar/path        → 200, {"items": [...]}
  - GET /api/<lang>/conversation/scenarios → 200, {"scenarios": [...]}

These endpoints are all backed by static data + spaced-repetition state; none
require the LLM, Mongo or Firebase, so the suite is fully offline (Firebase is
patched in conftest.py). POST/LLM flows are intentionally out of scope — this is
a registration + shape contract, not a behavioural test.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app import app

BASE = "http://testserver"

# (url prefix, agent name reported by /health)
AGENTS = [
    ("japanese",  "japanese_sensei"),
    ("chinese",   "chinese_teacher"),
    ("korean",    "korean_teacher"),
    ("english",   "english_mentor"),
    ("norwegian", "norwegian_mentor"),
    ("spanish",   "spanish_teacher"),
]

# Shared GET endpoints whose contract is {"items": [...]}. All six agents expose
# them with only optional query params (limit / lang have defaults).
ITEMS_ENDPOINTS = ["vocab/all", "srs/due", "grammar/path"]


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url=BASE)


@pytest.mark.parametrize("prefix, agent", AGENTS)
async def test_health(prefix, agent):
    """/health is reachable and self-identifies with the expected agent name."""
    async with _client() as client:
        r = await client.get(f"/api/{prefix}/health")
    assert r.status_code == 200, f"{prefix}/health -> {r.status_code}"
    data = r.json()
    assert data.get("status") == "ok", f"{prefix}/health status: {data}"
    assert data.get("agent") == agent, f"{prefix}/health agent: {data}"


@pytest.mark.parametrize("prefix, _agent", AGENTS)
async def test_overview(prefix, _agent):
    """/overview returns a non-empty dict (dashboard payload)."""
    async with _client() as client:
        r = await client.get(f"/api/{prefix}/overview")
    assert r.status_code == 200, f"{prefix}/overview -> {r.status_code}"
    data = r.json()
    assert isinstance(data, dict) and data, f"{prefix}/overview empty: {data}"


@pytest.mark.parametrize("prefix, _agent", AGENTS)
@pytest.mark.parametrize("endpoint", ITEMS_ENDPOINTS)
async def test_items_endpoints(prefix, _agent, endpoint):
    """Shared list endpoints return {"items": [...]} with a list payload."""
    async with _client() as client:
        r = await client.get(f"/api/{prefix}/{endpoint}")
    assert r.status_code == 200, f"{prefix}/{endpoint} -> {r.status_code}"
    data = r.json()
    assert isinstance(data.get("items"), list), \
        f"{prefix}/{endpoint} missing 'items' list: {data}"


@pytest.mark.parametrize("prefix, _agent", AGENTS)
async def test_conversation_scenarios(prefix, _agent):
    """/conversation/scenarios returns {"scenarios": [...]} with a non-empty list."""
    async with _client() as client:
        r = await client.get(f"/api/{prefix}/conversation/scenarios")
    assert r.status_code == 200, f"{prefix}/conversation/scenarios -> {r.status_code}"
    data = r.json()
    scenarios = data.get("scenarios")
    assert isinstance(scenarios, list) and scenarios, \
        f"{prefix}/conversation/scenarios not a non-empty list: {data}"


@pytest.mark.parametrize("prefix, _agent", AGENTS)
async def test_grammar_items_nonempty(prefix, _agent):
    """/grammar/path actually carries content (guards against an empty catalogue)."""
    async with _client() as client:
        r = await client.get(f"/api/{prefix}/grammar/path")
    assert r.status_code == 200
    items = r.json().get("items")
    assert isinstance(items, list) and items, f"{prefix}/grammar/path empty"
