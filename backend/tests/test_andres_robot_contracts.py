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


# ── V2: reflection / curiosity / projects / evolution ────────────────────────

@patch("backend.services.andres.reflection_engine.andres_profiles")
@patch("backend.services.andres.reflection_engine.andres_conversations")
@patch("backend.services.andres.reflection_engine.andres_reflections")
@patch("backend.services.andres.memory_service.andres_memories")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_reflect(mock_llm, mock_idprofiles, mock_mem, mock_refl,
                       mock_refl_convos, mock_refl_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_refl_convos.find = MagicMock(return_value=_AsyncIter([]))
    mock_mem.find = MagicMock(return_value=_AsyncIter([]))
    mock_mem.update_one = AsyncMock(return_value=None)
    mock_mem.insert_one = AsyncMock(return_value=MagicMock(inserted_id="rm1"))
    mock_mem.count_documents = AsyncMock(return_value=1)
    mock_refl.insert_one = AsyncMock(return_value=MagicMock(inserted_id="r1"))
    mock_refl.count_documents = AsyncMock(return_value=1)
    mock_refl_profiles.update_one = AsyncMock(return_value=None)
    mock_llm.return_value = "I noticed I was too generic. A question: what does Ignacio value?"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/reflect")
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert "noticed" in d["reflection"]["content"]


@patch("backend.services.andres.reflection_engine.andres_reflections")
@pytest.mark.asyncio
async def test_reflections_list(mock_refl):
    mock_refl.find = MagicMock(return_value=_AsyncIter([
        {"_id": "r1", "user_id": "u1", "content": "x", "created_at": "2026-08-05T00:00:00"},
    ]))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/reflections")
    assert r.status_code == 200
    assert r.json()["count"] == 1


@patch("backend.services.andres.curiosity_engine.andres_curiosity_queue")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_curiosity_generate_offline(mock_llm, mock_idprofiles, mock_cur):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_cur.insert_one = AsyncMock(return_value=MagicMock(inserted_id="w1"))
    mock_llm.return_value = "[MOCKED RESPONSE] offline"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/curiosity/generate")
    assert r.status_code == 200
    d = r.json()
    # deterministic offline seeds are still produced and stored
    assert d["count"] >= 1
    assert d["wonderings"][0]["question"]


@patch("backend.services.andres.curiosity_engine.andres_curiosity_queue")
@pytest.mark.asyncio
async def test_curiosity_patch(mock_cur):
    mock_cur.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.patch("/api/andres/curiosity/507f1f77bcf86cd799439011",
                          json={"status": "explored"})
    assert r.status_code == 200
    assert r.json()["status"] == "explored"


@patch("backend.services.andres.project_service.andres_profiles")
@patch("backend.services.andres.project_service.andres_projects")
@pytest.mark.asyncio
async def test_project_create(mock_proj, mock_proj_profiles):
    mock_proj.insert_one = AsyncMock(return_value=MagicMock(inserted_id="p1"))
    mock_proj.count_documents = AsyncMock(return_value=1)
    mock_proj_profiles.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/projects",
                         json={"title": "Learn haiku", "description": "write one a day"})
    assert r.status_code == 200
    d = r.json()
    assert d["title"] == "Learn haiku" and d["status"] == "active"


@patch("backend.services.andres.evolution_manager.andres_evolution_proposals")
@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_evolution_propose_and_cap(mock_idprofiles, mock_props):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_props.insert_one = AsyncMock(return_value=MagicMock(inserted_id="ep1"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        # valid proposal
        ok = await c.post("/api/andres/evolution/propose", json={
            "rationale": "grow curiosity", "changes": {"trait_deltas": {"curiosity": 5}}})
        # over-cap proposal → 400
        bad = await c.post("/api/andres/evolution/propose", json={
            "rationale": "too big", "changes": {"trait_deltas": {"curiosity": 99}}})
        # unknown trait → 400
        unk = await c.post("/api/andres/evolution/propose", json={
            "rationale": "nope", "changes": {"trait_deltas": {"telepathy": 3}}})
    assert ok.status_code == 200
    assert ok.json()["status"] == "pending"
    assert bad.status_code == 400
    assert unk.status_code == 400


@patch("backend.services.andres.evolution_manager.andres_evolution_proposals")
@patch("backend.services.andres.evolution_manager.andres_identity_versions")
@patch("backend.services.andres.evolution_manager.andres_profiles")
@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_evolution_approve_versions_up(mock_idprofiles, mock_ev_profiles,
                                             mock_versions, mock_props):
    prof = dict(_PROFILE)
    prof["identity"] = {"version": 1, "name": "Andrés",
                        "traits": {"curiosity": 78}, "core_interests": ["language"]}
    mock_idprofiles.find_one = AsyncMock(return_value=prof)
    mock_props.find_one = AsyncMock(return_value={
        "_id": "ep1", "user_id": "u1", "status": "pending",
        "changes": {"trait_deltas": {"curiosity": 5}, "add_interests": ["poetry"]}})
    mock_props.update_one = AsyncMock(return_value=None)
    mock_versions.insert_one = AsyncMock(return_value=None)
    mock_ev_profiles.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/evolution/507f1f77bcf86cd799439011/approve")
    assert r.status_code == 200
    d = r.json()
    assert d["version"] == 2
    assert d["identity"]["traits"]["curiosity"] == 83   # 78 + 5, clamped
    assert "poetry" in d["identity"]["core_interests"]


# ── V3: creativity (surprise WITH usefulness + self-critique; concept blend) ──

@patch("backend.services.andres.creativity_engine.andres_profiles")
@patch("backend.services.andres.creativity_engine.andres_creative_artifacts")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_creative_generate_real_with_eval(mock_llm, mock_idprofiles, mock_art, mock_art_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_art.insert_one = AsyncMock(return_value=MagicMock(inserted_id="a1"))
    mock_art.count_documents = AsyncMock(return_value=1)
    mock_art_profiles.update_one = AsyncMock(return_value=None)
    # first call = artifact text, second call = evaluator JSON
    mock_llm.side_effect = [
        "A tiny museum of your own discarded ideas, revisited yearly.",
        '{"novelty": 0.8, "usefulness": 0.7, "self_critique": "Could be too whimsical to act on."}',
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/creative/generate",
                         json={"mode": "surprise_useful", "seed": "memory"})
    assert r.status_code == 200
    d = r.json()["artifact"]
    assert d["is_mock"] is False
    assert d["novelty"] == 0.8 and d["usefulness"] == 0.7
    assert "whimsical" in d["self_critique"]


@patch("backend.services.andres.creativity_engine.andres_profiles")
@patch("backend.services.andres.creativity_engine.andres_creative_artifacts")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_creative_generate_offline_heuristic(mock_llm, mock_idprofiles, mock_art, mock_art_profiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_PROFILE))
    mock_art.insert_one = AsyncMock(return_value=MagicMock(inserted_id="a2"))
    mock_art.count_documents = AsyncMock(return_value=1)
    mock_art_profiles.update_one = AsyncMock(return_value=None)
    mock_llm.return_value = "[MOCKED RESPONSE] offline"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/creative/generate",
                         json={"mode": "blend", "concept_a": "sailing", "concept_b": "grammar"})
    assert r.status_code == 200
    d = r.json()["artifact"]
    assert d["is_mock"] is True
    # even offline, an evaluation is always attached (heuristic)
    assert 0.0 <= d["novelty"] <= 1.0
    assert "self_critique" in d


@pytest.mark.asyncio
async def test_creative_mode_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/creative/generate", json={"mode": "not-a-mode"})
    assert r.status_code == 422


@patch("backend.services.andres.creativity_engine.andres_creative_artifacts")
@pytest.mark.asyncio
async def test_creative_list(mock_art):
    mock_art.find = MagicMock(return_value=_AsyncIter([
        {"_id": "a1", "user_id": "u1", "mode": "surprise", "content": "x",
         "novelty": 0.6, "usefulness": 0.5, "self_critique": "ok"},
    ]))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/creative")
    assert r.status_code == 200
    assert r.json()["count"] == 1


# ── V4: skills (static safety gate + sandbox run + human approval) ────────────

_SAFE_SKILL = "def skill(x):\n    return sum(range(x))"
_UNSAFE_SKILL = "import os\ndef skill(x):\n    return os.listdir('.')"


@patch("backend.services.andres.skill_service.andres_skills")
@pytest.mark.asyncio
async def test_skill_propose_safe_is_pending(mock_skills):
    mock_skills.insert_one = AsyncMock(return_value=MagicMock(inserted_id="s1"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/skills/propose",
                         json={"name": "sum_to", "description": "sum", "code": _SAFE_SKILL})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "pending"
    assert d["safety"]["ok"] is True


@patch("backend.services.andres.skill_service.andres_skills")
@pytest.mark.asyncio
async def test_skill_propose_unsafe_is_blocked(mock_skills):
    mock_skills.insert_one = AsyncMock(return_value=MagicMock(inserted_id="s2"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/skills/propose",
                         json={"name": "peek", "description": "bad", "code": _UNSAFE_SKILL})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "blocked"
    assert d["safety"]["ok"] is False
    assert any("Imports" in reason for reason in d["safety"]["reasons"])


@patch("backend.services.andres.skill_service.andres_profiles")
@patch("backend.services.andres.skill_service.andres_skills")
@pytest.mark.asyncio
async def test_skill_approve_requires_pending(mock_skills, mock_skill_profiles):
    # a blocked skill can never be approved
    mock_skills.find_one = AsyncMock(return_value={
        "_id": "s3", "user_id": "u1", "status": "blocked",
        "safety": {"ok": False, "reasons": ["Imports are not allowed."]}})
    mock_skill_profiles.update_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/skills/507f1f77bcf86cd799439011/approve")
    assert r.status_code == 409


@patch("backend.services.andres.skill_service.andres_skills")
@patch("backend.services.andres.skill_service.andres_skill_runs")
@pytest.mark.asyncio
async def test_skill_run_sandbox_executes(mock_runs, mock_skills):
    mock_skills.find_one = AsyncMock(return_value={
        "_id": "s4", "user_id": "u1", "status": "active",
        "code": _SAFE_SKILL, "safety": {"ok": True, "reasons": []}})
    mock_skills.update_one = AsyncMock(return_value=None)
    mock_runs.insert_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/skills/507f1f77bcf86cd799439011/run",
                         json={"input": 5})
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["output"] == 10   # sum(range(5))


@patch("backend.services.andres.skill_service.andres_skills")
@patch("backend.services.andres.skill_service.andres_skill_runs")
@pytest.mark.asyncio
async def test_skill_run_blocked_cannot_run(mock_runs, mock_skills):
    mock_skills.find_one = AsyncMock(return_value={
        "_id": "s5", "user_id": "u1", "status": "blocked",
        "code": _UNSAFE_SKILL, "safety": {"ok": False, "reasons": ["Imports are not allowed."]}})
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/skills/507f1f77bcf86cd799439011/run",
                         json={"input": 1})
    assert r.status_code == 409


def test_sandbox_blocks_escape_attempts():
    """Direct unit checks on the safety core (Andrés' chief V4 concern)."""
    from backend.services.andres.sandbox import static_safety_check, run_in_sandbox
    assert static_safety_check(_SAFE_SKILL)["ok"] is True
    assert static_safety_check("def skill(x):\n    return x.__class__")["ok"] is False
    assert static_safety_check("def skill(x):\n    return eval(x)")["ok"] is False
    assert static_safety_check("def skill(x):\n    return open(x)")["ok"] is False
    assert static_safety_check("def other(x):\n    return 1")["ok"] is False  # no skill fn
    # a runaway loop is stopped by the wall-clock timeout
    res = run_in_sandbox("def skill(x):\n    while True:\n        pass", 1, timeout=0.5)
    assert res["ok"] is False and "imed out" in res["error"]


def test_sandbox_adversarial_gallery():
    """Andrés' 'gallery of ugly bugs' — hardening cases he suggested in review."""
    from backend.services.andres.sandbox import static_safety_check, run_in_sandbox
    # indirect class access via dunder → blocked statically
    assert static_safety_check("def skill(x):\n    return (1).__class__")["ok"] is False
    # deep recursion → RecursionError is caught, not fatal
    rec = run_in_sandbox("def skill(x):\n    return skill(x)", 1)
    assert rec["ok"] is False and "RecursionError" in rec["error"]
    # oversized string / list outputs → size-capped (just over the 200k-char cap)
    big_str = run_in_sandbox("def skill(x):\n    return 'x' * 300000", 0)
    assert big_str["ok"] is False and "too large" in big_str["error"]
    big_list = run_in_sandbox("def skill(x):\n    return [0] * 120000", 0)
    assert big_list["ok"] is False and "too large" in big_list["error"]
    # the skill receives a COPY — it cannot mutate the caller's value
    caller = {"a": 1}
    mut = run_in_sandbox("def skill(x):\n    x['changed'] = True\n    return x", caller)
    assert mut["ok"] is True and "changed" not in caller
    # oversized input → rejected before running
    too_big = run_in_sandbox("def skill(x):\n    return 1", [0] * 50000)
    assert too_big["ok"] is False and "Input too large" in too_big["error"]
    # naming a forbidden-looking string is fine (naming != executing)
    named = run_in_sandbox("def skill(x):\n    return chr(95) + chr(95)", 0)
    assert named["ok"] is True and named["output"] == "__"


# ── V5: Personality Capsule + identity history + developmental initiative ─────

_CAPSULE_PROFILE = {
    "_id": "pid1", "user_id": "u1",
    "identity": {"version": 3, "name": "Andrés",
                 "self_description": "current self",
                 "core_interests": ["language", "creativity"],
                 "traits": {"curiosity": 78, "warmth": 70},
                 "preferred_expression": []},
    "autonomy_level": 2, "created_at": "2026-08-01T00:00:00",
    "simulated_disposition": {}, "counters": {},
}


@patch("backend.services.andres.capsule_service.andres_skills")
@patch("backend.services.andres.capsule_service.andres_projects")
@patch("backend.services.andres.capsule_service.andres_memories")
@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_capsule_export(mock_idprofiles, mock_mem, mock_proj, mock_skills):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_CAPSULE_PROFILE))
    mock_mem.count_documents = AsyncMock(return_value=4)
    mock_proj.count_documents = AsyncMock(return_value=1)
    mock_skills.count_documents = AsyncMock(return_value=2)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/andres/capsule/export")
    assert r.status_code == 200
    d = r.json()
    assert d["identity"]["version"] == 3
    assert d["manifest"]["memories_total"] == 4
    assert d["identity"]["traits"]["curiosity"] == 78


@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_capsule_preview_diff_changes_nothing(mock_idprofiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_CAPSULE_PROFILE))
    capsule = {"identity": {"self_description": "a bolder self",
                            "core_interests": ["language", "music"],
                            "traits": {"curiosity": 85, "warmth": 70}}}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/capsule/preview", json={"capsule": capsule})
    assert r.status_code == 200
    d = r.json()
    assert d["self_description_changes"] is True
    assert {"trait": "curiosity", "from": 78, "to": 85} in d["trait_changes"]
    assert "music" in d["interests_added"]
    assert "creativity" in d["interests_removed"]


@patch("backend.services.andres.capsule_service.andres_identity_versions")
@patch("backend.services.andres.capsule_service.andres_profiles")
@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_capsule_import_versions_up_reversibly(mock_idprofiles, mock_cap_profiles, mock_versions):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_CAPSULE_PROFILE))
    mock_versions.insert_one = AsyncMock(return_value=None)   # snapshot-current call
    mock_cap_profiles.update_one = AsyncMock(return_value=None)
    capsule = {"identity": {"traits": {"curiosity": 90}, "core_interests": ["language"]}}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/capsule/import", json={"capsule": capsule})
    assert r.status_code == 200
    d = r.json()
    assert d["version"] == 4                       # 3 → 4
    assert d["identity"]["traits"]["curiosity"] == 90
    mock_versions.insert_one.assert_awaited()      # prior identity was snapshotted


@patch("backend.services.andres.identity_service.andres_profiles")
@pytest.mark.asyncio
async def test_capsule_import_rejects_malformed(mock_idprofiles):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_CAPSULE_PROFILE))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/capsule/import", json={"capsule": {"identity": {}}})
    assert r.status_code == 400


@patch("backend.services.andres.development_service.andres_reflections")
@patch("backend.services.andres.development_service.andres_development_suggestions")
@patch("backend.services.andres.identity_service.andres_profiles")
@patch("backend.llm.ask_ai_unified", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_development_suggest_offline(mock_llm, mock_idprofiles, mock_sugg, mock_refl):
    mock_idprofiles.find_one = AsyncMock(return_value=dict(_CAPSULE_PROFILE))
    mock_refl.find = MagicMock(return_value=_AsyncIter([]))
    mock_sugg.insert_one = AsyncMock(return_value=MagicMock(inserted_id="d1"))
    mock_llm.return_value = "[MOCKED RESPONSE] offline"
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/development/suggest")
    assert r.status_code == 200
    d = r.json()
    # even offline, Andrés proposes deterministic developmental moves
    assert d["count"] >= 1
    first = d["suggestions"][0]
    assert first["kind"] in {
        "interest", "project", "curriculum", "reflection_focus", "trait_nudge"}
    # each suggestion carries its cost + end, not only its benefit (Andrés' ask)
    for field in ("benefit", "risk", "success_criterion", "close_plan"):
        assert field in first and first[field]


@patch("backend.services.andres.development_service.andres_projects")
@patch("backend.services.andres.development_service.andres_development_suggestions")
@pytest.mark.asyncio
async def test_development_accept_project_creates_project(mock_sugg, mock_proj):
    mock_sugg.find_one = AsyncMock(return_value={
        "_id": "d2", "user_id": "u1", "kind": "project",
        "title": "Dev journal", "rationale": "spine", "status": "open"})
    mock_sugg.update_one = AsyncMock(return_value=None)
    mock_proj.insert_one = AsyncMock(return_value=MagicMock(inserted_id="p9"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/andres/development/suggestions/507f1f77bcf86cd799439011",
                         json={"action": "accept"})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "accepted"
    assert d["created"]["project_id"] == "p9"
    mock_proj.insert_one.assert_awaited()
