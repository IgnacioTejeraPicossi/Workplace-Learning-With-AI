"""
Self-Correcting Scaffold Loop (Option B) — contract tests.

The loop's ground truth is `ast.parse` (deterministic), so the core behaviour is
testable offline without an LLM. The endpoint test mocks the Mongo history
insert so it is CI-safe.

Run:  python -m pytest backend/tests/test_scaffold_loop_contracts.py -v
"""
import ast
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

import backend.services.scaffold_loop as sl
from backend.app import app

BASE = "http://test"


# ── Service: offline short-circuit (no LLM) → deterministic stub, pass ───────

def test_offline_short_circuit(monkeypatch):
    monkeypatch.setattr(sl, "ask_openai", None)
    r = sl.generate_scaffold_loop("VR Learning", "Learn in VR", "API Route")
    assert r["is_mock"] is True
    assert r["iterations"] == 1
    assert r["verdict"] == "pass"
    ast.parse(r["code"])  # stub is valid Python


# ── Service: real self-correction — bad code then good → iterations increment ─

def test_loop_self_corrects(monkeypatch):
    calls = {"n": 0}

    def fake_ask(prompt=None, task_type=None, complexity=None, max_tokens=None, messages=None, **kw):
        if prompt == "ping":
            return "pong"                       # probe: real LLM available
        if messages:
            return '{"pass": true, "issues": []}'  # Judge passes valid code
        calls["n"] += 1
        if calls["n"] == 1:
            return "def broken(:\n  return"     # iteration 1: SyntaxError
        return "from fastapi import APIRouter\nrouter = APIRouter()\n"  # iteration 2: valid

    monkeypatch.setattr(sl, "ask_openai", fake_ask)
    r = sl.generate_scaffold_loop("Test", "summary", "API Route", max_iterations=3)
    assert r["verdict"] == "pass"
    assert r["iterations"] == 2
    assert r["judge_notes"][0]["syntax"]["pass"] is False   # first failed
    assert r["judge_notes"][1]["syntax"]["pass"] is True    # second passed
    ast.parse(r["code"])


# ── Service: never-valid → escalates, and falls back to a usable stub ────────

def test_loop_escalates_with_stub(monkeypatch):
    def always_bad(prompt=None, messages=None, **kw):
        if prompt == "ping":
            return "pong"
        if messages:
            return '{"pass": false, "issues": ["nope"]}'
        return "def still broken(:"            # always a SyntaxError

    monkeypatch.setattr(sl, "ask_openai", always_bad)
    r = sl.generate_scaffold_loop("Test", "summary", "API Route", max_iterations=2)
    assert r["verdict"] == "escalate"
    assert r["escalate"] is True
    assert r["iterations"] == 2
    ast.parse(r["code"])  # delivered code is the deterministic stub, still valid


# ── Endpoint: offline → 200 with the loop contract; validation → 422 ─────────

@patch("backend.app.scaffold_history_collection")
@pytest.mark.asyncio
async def test_endpoint_offline_contract(mock_coll, monkeypatch):
    monkeypatch.setattr(sl, "ask_openai", None)
    mock_coll.insert_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/generate-scaffold-loop", json={
            "feature_name": "VR Learning",
            "feature_summary": "Learn in VR",
            "scaffold_type": "API Route",
        })
    assert r.status_code == 200
    d = r.json()
    for k in ("code", "is_mock", "iterations", "verdict", "escalate"):
        assert k in d
    assert mock_coll.insert_one.await_count == 1


@pytest.mark.asyncio
async def test_endpoint_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r_empty = await c.post("/generate-scaffold-loop", json={"feature_name": "", "feature_summary": "x"})
        r_iter = await c.post("/generate-scaffold-loop", json={"feature_name": "X", "max_iterations": 99})
    assert r_empty.status_code == 422   # feature_name min_length
    assert r_iter.status_code == 422    # max_iterations le=5
