"""Offline contract test for Andrés' development timeline (P4).

Mocks the profile + collections so it runs with no Mongo. Checks the snapshot
shape: totals, memory-by-type, identity versions, and the fixed-length activity
series (oldest → newest).
"""
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock

import pytest

from backend.services.andres import progress_service as P


class _Cursor:
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


def _coll(docs=None, count=0):
    c = AsyncMock()
    c.find = lambda *a, **k: _Cursor(docs or [])
    c.count_documents = AsyncMock(return_value=count)
    return c


@pytest.mark.asyncio
async def test_development_timeline_shape():
    today = datetime.utcnow().date().isoformat()
    profile = {
        "user_id": "u1", "created_at": (datetime.utcnow() - timedelta(days=20)).isoformat(),
        "identity": {"version": 3}, "autonomy_level": 2, "simulated_disposition": {"curiosity": 0.8},
    }
    memories = [
        {"type": "episodic", "created_at": today + "T10:00:00"},
        {"type": "episodic", "created_at": today + "T11:00:00"},
        {"type": "semantic", "created_at": today + "T12:00:00"},
    ]
    reflections = [{"created_at": today + "T13:00:00"}]
    versions = [
        {"version": 3, "created_at": today, "self_description": "v3"},
        {"version": 2, "created_at": today, "self_description": "v2"},
    ]
    with patch.object(P, "get_or_create_profile", AsyncMock(return_value=profile)), \
         patch.object(P, "developmental_age_days", AsyncMock(return_value=20)), \
         patch.object(P, "andres_memories", _coll(memories)), \
         patch.object(P, "andres_reflections", _coll(reflections)), \
         patch.object(P, "andres_identity_versions", _coll(versions)), \
         patch.object(P, "andres_skills", _coll(count=4)), \
         patch.object(P, "andres_projects", _coll(count=2)), \
         patch.object(P, "andres_creative_artifacts", _coll(count=5)), \
         patch.object(P, "andres_curiosity_queue", _coll(count=1)), \
         patch.object(P, "andres_evolution_proposals", _coll(count=2)), \
         patch.object(P, "andres_conversations", _coll(count=9)):
        snap = await P.development_timeline("u1", activity_days=14)

    assert snap["age_days"] == 20
    assert snap["totals"]["memories"] == 3
    assert snap["totals"]["memories_by_type"]["episodic"] == 2
    assert snap["totals"]["memories_by_type"]["semantic"] == 1
    assert snap["totals"]["reflections"] == 1
    assert snap["totals"]["identity_versions"] == 3
    assert snap["totals"]["skills_total"] == 4
    assert len(snap["identity_versions"]) == 2
    # fixed-length series, oldest→newest, today carries the activity
    assert len(snap["activity"]) == 14
    assert snap["activity"][-1]["date"] == today
    assert snap["activity"][-1]["memories"] == 3
    assert snap["activity"][-1]["reflections"] == 1


@pytest.mark.asyncio
async def test_development_timeline_degrades_when_collections_fail():
    profile = {"user_id": "u1", "created_at": datetime.utcnow().isoformat(), "identity": {"version": 1}}
    boom = AsyncMock()
    boom.find = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("no mongo"))
    boom.count_documents = AsyncMock(side_effect=RuntimeError("no mongo"))
    with patch.object(P, "get_or_create_profile", AsyncMock(return_value=profile)), \
         patch.object(P, "developmental_age_days", AsyncMock(return_value=0)), \
         patch.object(P, "andres_memories", boom), \
         patch.object(P, "andres_reflections", boom), \
         patch.object(P, "andres_identity_versions", boom), \
         patch.object(P, "andres_skills", boom), \
         patch.object(P, "andres_projects", boom), \
         patch.object(P, "andres_creative_artifacts", boom), \
         patch.object(P, "andres_curiosity_queue", boom), \
         patch.object(P, "andres_evolution_proposals", boom), \
         patch.object(P, "andres_conversations", boom):
        snap = await P.development_timeline("u1")
    assert snap["totals"]["memories"] == 0
    assert snap["totals"]["skills_total"] == 0
    assert len(snap["activity"]) == 14
