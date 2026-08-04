"""
Babel Library — intelligence + learning-profile router contract tests (offline).

Both routers delegate to service functions; these tests mock those services and
assert the endpoint wiring, response shaping and input validation. No DB, no LLM,
no auth (the routers are not auth-guarded).

Run:  python -m pytest backend/tests/test_babel_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from backend.app import app

BASE = "http://test"
INTEL = "backend.routers.babel_intelligence"
PROF = "backend.routers.learning_profile"


# ── intelligence: stats / batch status ──────────────────────────────────────
@patch(f"{INTEL}.get_stats", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_stats(mock_stats):
    mock_stats.return_value = {"classified": 10, "embedded": 8, "with_content": 3}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/babel/intelligence/stats")
    assert r.status_code == 200
    assert r.json()["classified"] == 10


@patch(f"{INTEL}.get_batch_status")
@pytest.mark.asyncio
async def test_batch_status(mock_bs):
    mock_bs.return_value = {"running": False, "total": 0, "processed": 0}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/babel/intelligence/batch/status")
    assert r.status_code == 200
    assert r.json()["running"] is False


# ── intelligence: classify ──────────────────────────────────────────────────
@patch(f"{INTEL}.classify_and_tag", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_classify_ok(mock_cls):
    mock_cls.return_value = {"classification": "AI", "tags": ["ml", "nlp"]}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/classify",
                         json={"title": "Intro to LLMs", "description": "..."})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert d["metadata"]["tags"] == ["ml", "nlp"]


@patch(f"{INTEL}.classify_and_tag", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_classify_fallback_when_llm_unavailable(mock_cls):
    mock_cls.return_value = None
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/classify", json={"title": "X"})
    assert r.status_code == 200
    assert r.json()["status"] == "fallback"


@patch(f"{INTEL}.process_single_resource", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_classify_with_id_strips_embedding(mock_proc):
    mock_proc.return_value = {"classification": "AI", "tags": [], "embedding": [0.1] * 1536}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/classify",
                         json={"title": "X", "resource_id": "abc123"})
    assert r.status_code == 200
    # The large embedding must not be echoed back in the response
    assert "embedding" not in r.json()["metadata"]


@pytest.mark.asyncio
async def test_classify_validation_missing_title():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/classify", json={"description": "no title"})
    assert r.status_code == 422


# ── intelligence: search ────────────────────────────────────────────────────
@patch(f"{INTEL}.hybrid_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_search_hybrid(mock_hs):
    mock_hs.return_value = {"results": [{"title": "A"}], "insights": {"count": 1}, "mode": "hybrid"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/search", json={"query": "llm"})
    assert r.status_code == 200
    assert r.json()["mode"] == "hybrid"
    mock_hs.assert_awaited_once()


@patch(f"{INTEL}.semantic_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_search_semantic(mock_ss):
    mock_ss.return_value = [{"title": "A"}]
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/search",
                         json={"query": "llm", "mode": "semantic"})
    assert r.status_code == 200
    d = r.json()
    assert d["mode"] == "semantic" and len(d["results"]) == 1


@pytest.mark.asyncio
async def test_search_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        bad_mode = await c.post("/api/babel/intelligence/search", json={"query": "x", "mode": "magic"})
        bad_limit = await c.post("/api/babel/intelligence/search", json={"query": "x", "limit": 999})
    assert bad_mode.status_code == 422
    assert bad_limit.status_code == 422


# ── intelligence: batch (no background work runs) ───────────────────────────
@patch(f"{INTEL}.get_batch_status")
@pytest.mark.asyncio
async def test_batch_already_running(mock_bs):
    mock_bs.return_value = {"running": True, "total": 5, "processed": 2}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/intelligence/batch", json={})
    assert r.status_code == 200
    assert r.json()["status"] == "already_running"


# ── learning profile ────────────────────────────────────────────────────────
@patch(f"{PROF}.record_interaction", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_interaction_splits_user_id(mock_rec):
    mock_rec.return_value = {"ok": True}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/profile/interaction",
                         json={"user_id": "u1", "resource_id": "r1", "action": "view"})
    assert r.status_code == 200
    args, _ = mock_rec.await_args
    assert args[0] == "u1"                 # user_id passed positionally
    assert "user_id" not in args[1]        # excluded from the interaction dict
    assert args[1]["resource_id"] == "r1"


@patch(f"{PROF}.get_recommendations", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_recommendations_limit_capped(mock_recs):
    mock_recs.return_value = {"recommendations": [], "profile_summary": None}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/babel/profile/u1/recommendations?limit=100")
    assert r.status_code == 200
    _, kwargs = mock_recs.await_args
    assert kwargs.get("limit") == 30       # min(100, 30)


@patch(f"{PROF}.generate_learning_path", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_learning_path(mock_lp):
    mock_lp.return_value = {"steps": [], "goal": "kubernetes"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/profile/u1/learning-path",
                         json={"goal_topic": "kubernetes", "max_steps": 6})
    assert r.status_code == 200
    assert r.json()["goal"] == "kubernetes"


@pytest.mark.asyncio
async def test_learning_path_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/babel/profile/u1/learning-path",
                         json={"goal_topic": "x", "max_steps": 2})  # below ge=3
    assert r.status_code == 422
