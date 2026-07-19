"""
Self-Correcting AI Loop — API contract tests (offline, mock-first).

The Loop Builder's "Customize with AI" endpoint degrades to a deterministic
fallback when no LLM is available, so this suite runs with no LLM key and no
database. The LLM is patched to None to force the fallback path.

Run:  python -m pytest backend/tests/test_self_correcting_loop_contracts.py -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport

from backend.app import app

BASE = "http://test"
EP = "/api/self-correcting-loop"


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get(f"{EP}/health")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert d["agent"] == "self_correcting_loop"
    assert "llm_available" in d


@patch("backend.services.self_correcting_loop.ask_ai_unified", None)
@pytest.mark.asyncio
async def test_customize_fallback_contract():
    """With no LLM, the endpoint returns the deterministic scaffold (is_mock)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post(f"{EP}/customize", json={
            "task_type": "code",
            "task_description": "Fix a flaky pagination bug in the orders API",
            "lang": "en",
        })
    assert r.status_code == 200
    d = r.json()
    for k in ("builder", "judge", "manager", "stop", "is_mock", "version"):
        assert k in d
    assert d["is_mock"] is True
    # The user's task is injected into the Builder scaffold
    assert "pagination" in d["builder"].lower()
    # The Judge names an executable ground truth for code
    assert "test suite" in d["judge"].lower()
    # The stop block is hard logic, not "good enough"
    assert "max revisions" in d["stop"].lower()


@patch("backend.services.self_correcting_loop.ask_ai_unified", None)
@pytest.mark.asyncio
async def test_customize_ground_truth_varies_by_type():
    """Each task type steers the Judge toward its own ground truth."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        rc = await c.post(f"{EP}/customize", json={"task_type": "research", "task_description": "Summarize 5 papers on X"})
        rw = await c.post(f"{EP}/customize", json={"task_type": "writing", "task_description": "Draft a launch email"})
    assert rc.status_code == 200 and rw.status_code == 200
    assert "source" in rc.json()["judge"].lower()
    assert "brief" in rw.json()["judge"].lower()


@pytest.mark.asyncio
async def test_customize_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        # Empty task_description → 422 (min_length)
        r1 = await c.post(f"{EP}/customize", json={"task_type": "code", "task_description": ""})
        assert r1.status_code == 422
        # Invalid task_type → 422 (pattern)
        r2 = await c.post(f"{EP}/customize", json={"task_type": "bogus", "task_description": "do a thing"})
        assert r2.status_code == 422
        # Invalid lang → 422 (pattern)
        r3 = await c.post(f"{EP}/customize", json={"task_type": "code", "task_description": "x", "lang": "fr"})
        assert r3.status_code == 422
