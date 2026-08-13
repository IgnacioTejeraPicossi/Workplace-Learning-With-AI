"""
AGI Progress Tracker — seed integrity + endpoint contract (offline).

Guards the curated DEFAULT_DATA so a bad edit (scores not summing to total,
missing/extra domains, out-of-range values) can't ship silently. No DB needed:
GET falls back to DEFAULT_DATA when the Mongo collection is unavailable.

Run: python -m pytest backend/tests/test_agi_progress.py -v
"""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.routers.agi_progress import DEFAULT_DATA

BASE = "http://test"
DOMAINS = {"K", "RW", "M", "R", "WM", "MS", "MR", "V", "A", "S"}


def test_every_model_is_wellformed():
    for it in DEFAULT_DATA:
        d = it.model_dump()
        assert d["model"] and isinstance(d["year"], int)
        # exactly the ten CHC domains, each 0..10
        assert set(d["scores"].keys()) == DOMAINS
        assert all(0 <= v <= 10 for v in d["scores"].values())
        # total is the sum of the ten domains, and within 0..100
        assert d["total"] == sum(d["scores"].values()), f"{d['model']} sum != total"
        assert 0 <= d["total"] <= 100
        # MS (persistent long-term memory) is the shared LLM bottleneck → 0
        assert d["scores"]["MS"] == 0, f"{d['model']} MS should be 0"


def test_models_unique():
    names = [it.model for it in DEFAULT_DATA]
    assert len(names) == len(set(names))


def test_august_2026_refresh_present():
    names = {it.model for it in DEFAULT_DATA}
    # the 2026-08 refresh (incl. the Chinese Kimi models the tracker was updated for)
    for expected in ("Kimi K2.6", "Kimi K3", "GPT-5.6 Sol", "Claude Opus 5",
                     "Gemini 3.6 Flash", "Grok 4.5"):
        assert expected in names, f"missing refreshed model: {expected}"


@pytest.mark.asyncio
async def test_progress_endpoint_returns_seed():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/agi/progress")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= len(DEFAULT_DATA)
    names = {row["model"] for row in data}
    assert "Kimi K2.6" in names
