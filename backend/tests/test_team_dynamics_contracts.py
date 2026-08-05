"""
Team Dynamics — team CRUD + analytics contract tests (offline).

The endpoints are auth-guarded (verify_token) and Mongo-backed; analytics also
calls the LLM. Tests override auth with a fake user and mock the collections +
LLM, so they run with no Firebase, no database and no AI key.

Run:  python -m pytest backend/tests/test_team_dynamics_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from backend.app import app, verify_token

BASE = "http://test"
VALID_OID = "507f1f77bcf86cd799439011"


def _fake_user():
    return {"uid": "u1", "email": "u1@example.com"}


@pytest.fixture(autouse=True)
def _auth_override():
    app.dependency_overrides[verify_token] = _fake_user
    yield
    app.dependency_overrides.pop(verify_token, None)


class _AsyncIter:
    """Minimal async-iterable to stand in for a Motor cursor."""
    def __init__(self, items):
        self._items = items

    def __aiter__(self):
        async def gen():
            for x in self._items:
                yield x
        return gen()


# ── malformed id → 400 (the _oid hardening, not a leaked 500) ────────────────
@pytest.mark.asyncio
async def test_get_team_invalid_id_returns_400():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/teams/not-a-valid-objectid")
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_analytics_invalid_id_returns_400():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/teams/xxx/analytics", json={"metrics": ["collaboration"]})
    assert r.status_code == 400


# ── create team ──────────────────────────────────────────────────────────────
@patch("backend.app.team_members_collection")
@patch("backend.app.teams_collection")
@pytest.mark.asyncio
async def test_create_team_ok(mock_teams, mock_members):
    mock_teams.insert_one = AsyncMock(return_value=MagicMock(inserted_id="tid123"))
    mock_members.insert_many = AsyncMock(return_value=MagicMock(inserted_ids=["m1"]))
    payload = {
        "name": "Alpha", "description": "desc",
        "members": [{"name": "A", "role": "Dev", "email": "a@x.com", "skills": ["py"]}],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/teams", json=payload)
    assert r.status_code == 200
    assert r.json()["team_id"] == "tid123"


@pytest.mark.asyncio
async def test_create_team_duplicate_emails_400():
    payload = {
        "name": "Alpha", "description": "desc",
        "members": [
            {"name": "A", "role": "Dev", "email": "dup@x.com", "skills": []},
            {"name": "B", "role": "QA", "email": "DUP@x.com", "skills": []},
        ],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/teams", json=payload)
    assert r.status_code == 400


# ── analytics: is_mock vs real ───────────────────────────────────────────────
@patch("backend.app.team_analytics_collection")
@patch("backend.app.team_members_collection")
@patch("backend.app.teams_collection")
@patch("backend.app.ask_ai_unified_sync", return_value="[MOCKED RESPONSE] All AI providers unavailable")
@pytest.mark.asyncio
async def test_analytics_is_mock(mock_llm, mock_teams, mock_members, mock_analytics):
    mock_teams.find_one = AsyncMock(return_value={"_id": VALID_OID, "name": "Alpha", "description": "d"})
    mock_members.find = MagicMock(return_value=_AsyncIter([]))
    mock_analytics.insert_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post(f"/teams/{VALID_OID}/analytics", json={"metrics": ["collaboration"]})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    assert d["analysis"] == ""          # the raw mock string is never shown


@patch("backend.app.team_analytics_collection")
@patch("backend.app.team_members_collection")
@patch("backend.app.teams_collection")
@patch("backend.app.ask_ai_unified_sync", return_value="The team collaborates well.")
@pytest.mark.asyncio
async def test_analytics_real(mock_llm, mock_teams, mock_members, mock_analytics):
    mock_teams.find_one = AsyncMock(return_value={"_id": VALID_OID, "name": "Alpha", "description": "d"})
    mock_members.find = MagicMock(return_value=_AsyncIter([
        {"name": "A", "role": "Dev", "skills": ["py"]},
    ]))
    mock_analytics.insert_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post(f"/teams/{VALID_OID}/analytics", json={"metrics": ["collaboration"]})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert "collaborates" in d["analysis"]


@patch("backend.app.teams_collection")
@pytest.mark.asyncio
async def test_analytics_team_not_found_404(mock_teams):
    mock_teams.find_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post(f"/teams/{VALID_OID}/analytics", json={"metrics": ["x"]})
    assert r.status_code == 404
