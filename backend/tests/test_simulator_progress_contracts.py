"""
Scenario Simulator — interactive-run progress persistence contract tests (offline).

The endpoints are auth-guarded (verify_token) and Mongo-backed. Tests override
the auth dependency with a fake user and mock the collection, so they run with no
Firebase and no database.

Run:  python -m pytest backend/tests/test_simulator_progress_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app, verify_token

BASE = "http://test"


def _fake_user():
    return {"uid": "test_uid"}


@pytest.fixture(autouse=True)
def _auth_override():
    # Only override auth for this module; restore afterwards so other suites
    # keep the real dependency.
    app.dependency_overrides[verify_token] = _fake_user
    yield
    app.dependency_overrides.pop(verify_token, None)


@patch("backend.app.simulation_progress_collection")
@pytest.mark.asyncio
async def test_state_null_when_no_doc(mock_coll):
    mock_coll.find_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/simulator/state")
    assert r.status_code == 200
    assert r.json() == {"progress": None}


@patch("backend.app.simulation_progress_collection")
@pytest.mark.asyncio
async def test_state_returns_saved(mock_coll):
    mock_coll.find_one = AsyncMock(return_value={
        "user_id": "test_uid",
        "progress": {"scenarioType": "customer-service", "currentStep": 2, "completed": False},
    })
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/simulator/state")
    assert r.status_code == 200
    d = r.json()
    assert d["progress"]["scenarioType"] == "customer-service"
    assert d["progress"]["currentStep"] == 2


@patch("backend.app.simulation_progress_collection")
@pytest.mark.asyncio
async def test_progress_upsert(mock_coll):
    mock_coll.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.put("/api/simulator/progress", json={
            "scenario_type": "team-leadership",
            "current_step": 1,
            "selected_option": "B",
            "simulation_response": "Some feedback",
            "completed": False,
        })
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert mock_coll.update_one.await_count == 1
    # upsert requested, and progress stored under a "progress" object
    args, kwargs = mock_coll.update_one.await_args
    assert kwargs.get("upsert") is True
    update = args[1]
    assert update["$set"]["progress"]["scenarioType"] == "team-leadership"
    assert update["$set"]["progress"]["selectedOption"] == "B"


@pytest.mark.asyncio
async def test_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r1 = await c.put("/api/simulator/progress", json={"scenario_type": "", "current_step": 0})
        r2 = await c.put("/api/simulator/progress", json={"scenario_type": "x", "current_step": -1})
    assert r1.status_code == 422   # empty scenario_type
    assert r2.status_code == 422   # negative current_step
