"""
Self-Simulating Reality Agent — learning-path contract tests (offline).

Deterministic (no LLM); the goal→start routing uses the TF-IDF vector store.

Run: python -m pytest backend/tests/test_self_sim_reality_learning.py -v
"""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import self_sim_reality_learning as svc

BASE = "http://test"
_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}


def test_curriculum_is_evidence_first_and_valid():
    r = svc.learning_path("")
    ids = [s["id"] for s in r["stages"]]
    assert ids[0] == "rules"
    # established stages come before the speculative OPH core
    lvl = {s["id"]: s["level"] for s in r["stages"]}
    assert lvl["established_brain"] == "established"
    assert ids.index("established_brain") < ids.index("oph_core")
    assert ids.index("oph_core") < ids.index("philosophy")
    assert all(s["level"] in _ALLOWED_LEVELS for s in r["stages"])
    # no goal → start at the beginning
    assert r["recommended_start"] == "rules"


def test_goal_routes_to_entry_stage():
    assert svc.learning_path("what is a fixed point in OPH?")["recommended_start"] == "oph_mechanism"
    assert svc.learning_path("am I living in a simulation?")["recommended_start"] == "philosophy"
    # a goal with no KB overlap falls back to the start
    assert svc.learning_path("zzzzz qqqqq")["recommended_start"] == "rules"


@pytest.mark.asyncio
async def test_learning_path_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        default = await c.get("/api/self-sim-reality/learning-path")
        with_goal = await c.get("/api/self-sim-reality/learning-path",
                                params={"goal": "the observer effect in quantum mechanics"})
    assert default.status_code == 200
    d = default.json()
    assert d["count"] == len(d["stages"]) and d["recommended_start"] == "rules"
    assert with_goal.status_code == 200
    # a quantum-observer goal enters at the OPH core (its top KB chunk sits there)
    assert with_goal.json()["recommended_start"] in {"oph_core", "mainstream_physics"}


@pytest.mark.asyncio
async def test_learning_path_goal_too_long_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/self-sim-reality/learning-path", params={"goal": "x" * 301})
    assert r.status_code == 422
