"""
AI Learning & Training — progress/quiz persistence contract tests (offline).

The endpoints are auth-guarded (verify_token) and Mongo-backed. Tests override
the auth dependency with a fake user and mock the collection, so they run with no
Firebase and no database.

Run:  python -m pytest backend/tests/test_ai_training_progress_contracts.py -v
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


@patch("backend.app.ai_training_progress_collection")
@pytest.mark.asyncio
async def test_state_empty_when_no_doc(mock_coll):
    mock_coll.find_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/ai-training/state")
    assert r.status_code == 200
    assert r.json() == {"progress": {}, "quiz_results": []}


@patch("backend.app.ai_training_progress_collection")
@pytest.mark.asyncio
async def test_state_returns_saved(mock_coll):
    mock_coll.find_one = AsyncMock(return_value={
        "user_id": "test_uid",
        "progress": {"ai_intro_001": {"section": 2, "quizCompleted": True}},
        "quiz_results": [{"lessonId": "ai_intro_001", "score": {"percentage": 80}}],
    })
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/ai-training/state")
    assert r.status_code == 200
    d = r.json()
    assert d["progress"]["ai_intro_001"]["section"] == 2
    assert len(d["quiz_results"]) == 1


@patch("backend.app.ai_training_progress_collection")
@pytest.mark.asyncio
async def test_progress_upsert(mock_coll):
    mock_coll.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.put("/api/ai-training/progress",
                        json={"lesson_id": "ai_intro_001", "section": 2, "quiz_completed": True})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert mock_coll.update_one.await_count == 1
    # upsert requested
    _, kwargs = mock_coll.update_one.await_args
    assert kwargs.get("upsert") is True


@patch("backend.app.ai_training_progress_collection")
@pytest.mark.asyncio
async def test_quiz_result_push(mock_coll):
    mock_coll.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/ai-training/quiz-result",
                         json={"lesson_id": "ai_intro_001", "score": {"percentage": 80}})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert mock_coll.update_one.await_count == 1


@pytest.mark.asyncio
async def test_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r1 = await c.put("/api/ai-training/progress", json={"lesson_id": "", "section": 0})
        r2 = await c.put("/api/ai-training/progress", json={"lesson_id": "x", "section": -1})
    assert r1.status_code == 422   # empty lesson_id
    assert r2.status_code == 422   # negative section
