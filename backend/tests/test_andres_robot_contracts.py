"""
Andrés the Robot — V0 router contract tests (offline).

Auth-guarded (via the router's _verify_token wrapper) and Mongo/LLM-backed. Tests
override auth and mock the collections + the unified gateway, so they run with no
Firebase, no database and no AI key.

Run:  python -m pytest backend/tests/test_andres_robot_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.routers import andres_robot

BASE = "http://test"


class _AsyncIter:
    """Minimal async-iterable stand-in for a Motor cursor."""
    def __init__(self, docs):
        self._docs = list(docs)

    def limit(self, *_a, **_k):
        return self

    def sort(self, *_a, **_k):
        return self

    def __aiter__(self):
        async def gen():
            for d in self._docs:
                yield d
        return gen()


def _mem_collection(docs=None):
    """A MagicMock mimicking the andres_memories collection for offline tests."""
    docs = docs or []
    m = MagicMock()
    m.find = MagicMock(return_value=_AsyncIter(docs))
    m.count_documents = AsyncMock(return_value=len(docs))
    m.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mem_new"))
    m.update_one = AsyncMock(return_value=MagicMock(matched_count=1, deleted_count=1))
    m.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    m.find_one = AsyncMock(return_value=None)
    return m

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


@patch("backend.services.andres.memory_service.andres_profiles")
@patch("backend.services.andres.memory_service.andres_memories")
@patch("backend.routers.andres_robot.andres_profiles")
@patch("backend.routers.andres_robot.andres_conversations")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_real(mock_llm, mock_idprofiles, mock_convos, mock_profiles,
                         mock_mem, mock_mem_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_convos.insert_one = AsyncMock(return_value=None)
    mock_profiles.update_one = AsyncMock(return_value=None)
    mem = _mem_collection([])
    mock_mem.find = mem.find
    mock_mem.count_documents = mem.count_documents
    mock_mem.insert_one = mem.insert_one
    mock_mem.update_one = mem.update_one
    mock_mem_profiles.update_one = AsyncMock(return_value=None)
    mock_llm.return_value = "Hello Ignacio, I am Andrés and I am curious today."
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": "Hi Andrés"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert "Andrés" in d["message"]
    assert d["safety"]["reviewed"] is True
    assert d["identity_version"] == 1
    # autonomy 2 → a candidate memory was stored
    assert d["development_signals"]["new_memory_candidates"] == 1
    mem.insert_one.assert_awaited()


@patch("backend.services.andres.memory_service.andres_profiles")
@patch("backend.services.andres.memory_service.andres_memories")
@patch("backend.routers.andres_robot.andres_profiles")
@patch("backend.routers.andres_robot.andres_conversations")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_chat_offline_mock(mock_llm, mock_idprofiles, mock_convos, mock_profiles,
                                 mock_mem, mock_mem_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_convos.insert_one = AsyncMock(return_value=None)
    mock_profiles.update_one = AsyncMock(return_value=None)
    mem = _mem_collection([])
    mock_mem.find = mem.find
    mock_mem.insert_one = mem.insert_one
    mock_llm.return_value = "[MOCKED RESPONSE] All AI providers unavailable"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": "Hi"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    assert "no AI provider" in d["message"]
    # offline → no candidate memory is stored
    assert d["development_signals"]["new_memory_candidates"] == 0
    mem.insert_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_chat_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/chat", json={"message": ""})
    assert r.status_code == 422


# ── V1: memory CRUD + retrieval ──────────────────────────────────────────────

@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memories_list(mock_mem):
    docs = [
        {"_id": "m1", "user_id": "u1", "type": "semantic",
         "content": "The user loves sailing", "user_verified": True},
        {"_id": "m2", "user_id": "u1", "type": "episodic",
         "content": "We first spoke on 5 Aug", "user_verified": False},
    ]
    mock_mem.find = MagicMock(return_value=_AsyncIter(docs))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/memories")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 2
    assert d["memories"][0]["_id"] == "m1"


@patch("backend.services.andres.memory_service.andres_profiles")
@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memory_create(mock_mem, mock_mem_profiles):
    mock_mem.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mem_new"))
    mock_mem.count_documents = AsyncMock(return_value=1)
    mock_mem_profiles.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/memories",
                         json={"content": "The user is from Spain", "type": "semantic"})
    assert r.status_code == 200
    d = r.json()
    assert d["content"] == "The user is from Spain"
    assert d["user_verified"] is True   # hand-authored → verified
    assert d["_id"] == "mem_new"


@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memory_patch_verify(mock_mem):
    mock_mem.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
    mock_mem.find_one = AsyncMock(return_value={
        "_id": "abc", "user_id": "u1", "type": "episodic",
        "content": "x", "user_verified": True})
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.patch("/api/andres/memories/507f1f77bcf86cd799439011",
                          json={"user_verified": True})
    assert r.status_code == 200
    assert r.json()["user_verified"] is True


@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memory_patch_bad_id(mock_mem):
    mock_mem.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
    mock_mem.find_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.patch("/api/andres/memories/not-an-oid",
                          json={"user_verified": True})
    assert r.status_code == 400


@patch("backend.services.andres.memory_service.andres_profiles")
@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memory_delete(mock_mem, mock_mem_profiles):
    mock_mem.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    mock_mem.count_documents = AsyncMock(return_value=0)
    mock_mem_profiles.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.delete("/api/andres/memories/507f1f77bcf86cd799439011")
    assert r.status_code == 200
    assert r.json()["ok"] is True


@patch("backend.services.andres.memory_service.andres_memories")
@pytest.mark.asyncio
async def test_memory_retrieval_ranks_overlap(mock_mem):
    docs = [
        {"_id": "m1", "user_id": "u1", "type": "semantic",
         "content": "The user enjoys sailing boats", "importance": 0.5, "user_verified": True},
        {"_id": "m2", "user_id": "u1", "type": "semantic",
         "content": "The user dislikes cold weather", "importance": 0.5, "user_verified": False},
    ]
    mock_mem.find = MagicMock(return_value=_AsyncIter(docs))
    mock_mem.update_one = AsyncMock(return_value=None)
    from backend.services.andres import memory_service
    top = await memory_service.retrieve_relevant("u1", "tell me about sailing", limit=5)
    assert top and top[0]["_id"] == "m1"
