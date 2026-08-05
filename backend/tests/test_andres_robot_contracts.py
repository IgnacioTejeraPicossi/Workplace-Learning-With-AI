"""
Andrés the Robot — V0 router contract tests (offline).

Auth-guarded (via the router's _verify_token wrapper) and Mongo/LLM-backed. Tests
override auth and mock the collections + the unified gateway, so they run with no
Firebase, no database and no AI key.

Run:  python -m pytest backend/tests/test_andres_robot_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.routers import andres_robot

BASE = "http://test"

_PROFILE = {
    "_id": "pid1",
    "user_id": "u1",
    "identity": {"version": 1, "name": "Andrés", "traits": {}, "core_interests": []},
    "autonomy_level": 2,
    "created_at": "2026-08-01T00:00:00",
    "simulated_disposition": {"curiosity": 0.78, "confidence": 0.5},
    "counters": {"conversations": 0},
}


def _fake_user():
    return {"uid": "u1", "email": "u1@example.com"}


@pytest.fixture(autouse=True)
def _auth_override():
    app.dependency_overrides[andres_robot._verify_token] = _fake_user
    yield
    app.dependency_overrides.pop(andres_robot._verify_token, None)


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/health")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "healthy" and d["module"] == "andres_robot"


@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_profile(mock_profiles):
    mock_profiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/profile")
    assert r.status_code == 200
    d = r.json()
    assert d["identity"]["version"] == 1
    assert "developmental_age_days" in d


@patch("backend.routers.andres_robot.andres_profiles")
@patch("backend.routers.andres_robot.andres_conversations")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_real(mock_llm, mock_idprofiles, mock_convos, mock_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_convos.insert_one = AsyncMock(return_value=None)
    mock_profiles.update_one = AsyncMock(return_value=None)
    mock_llm.return_value = "Hello Ignacio, I am Andrés and I am curious today."
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": "Hi Andrés"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert "Andrés" in d["message"]
    assert d["safety"]["reviewed"] is True
    assert d["identity_version"] == 1


@patch("backend.routers.andres_robot.andres_profiles")
@patch("backend.routers.andres_robot.andres_conversations")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_offline_mock(mock_llm, mock_idprofiles, mock_convos, mock_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_convos.insert_one = AsyncMock(return_value=None)
    mock_profiles.update_one = AsyncMock(return_value=None)
    mock_llm.return_value = "[MOCKED RESPONSE] All AI providers unavailable"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": "Hi"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    assert "no AI provider" in d["message"]


@pytest.mark.asyncio
async def test_chat_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": ""})
    assert r.status_code == 422
