"""
Andrés — development timeline / progress aggregation (P4).

A single read-only snapshot of how Andrés has grown for a given user: developmental
age, identity versions over time, memory counts by type, reflections, skills,
projects, creative artifacts, plus a day-bucketed recent-activity series. Meant to
let the owner (and a research collaborator) *measure and document* the biography's
growth over time.

Every section is best-effort: a collection that errors (e.g. Mongo unavailable)
contributes zeros/empties instead of failing the whole snapshot.
"""
from datetime import datetime, timedelta

from backend.db import (
    andres_memories, andres_reflections, andres_identity_versions, andres_skills,
    andres_projects, andres_creative_artifacts, andres_curiosity_queue,
    andres_evolution_proposals, andres_conversations,
)
from backend.services.andres.identity_service import (
    get_or_create_profile, developmental_age_days,
)
from backend.services.andres.memory_service import MEMORY_TYPES


def _day(iso: str):
    """YYYY-MM-DD from an ISO timestamp, or None."""
    if not iso or not isinstance(iso, str):
        return None
    return iso[:10] if len(iso) >= 10 else None


async def _count(coll, query):
    try:
        return await coll.count_documents(query)
    except Exception:
        return 0


async def development_timeline(user_id: str, activity_days: int = 14) -> dict:
    profile = await get_or_create_profile(user_id)
    age = await developmental_age_days(profile)

    # ── Memories: total, by type, and per-day activity ───────────────────────
    mem_by_type = {t: 0 for t in MEMORY_TYPES}
    activity = {}   # "YYYY-MM-DD" → {"memories": n, "reflections": n}
    total_mem = 0
    try:
        async for d in andres_memories.find({"user_id": user_id}).limit(3000):
            t = d.get("type", "episodic")
            mem_by_type[t] = mem_by_type.get(t, 0) + 1
            total_mem += 1
            day = _day(d.get("created_at"))
            if day:
                activity.setdefault(day, {"memories": 0, "reflections": 0})["memories"] += 1
    except Exception:
        pass

    # ── Reflections: total + per-day activity ────────────────────────────────
    total_refl = 0
    try:
        async for d in andres_reflections.find({"user_id": user_id}).limit(3000):
            total_refl += 1
            day = _day(d.get("created_at"))
            if day:
                activity.setdefault(day, {"memories": 0, "reflections": 0})["reflections"] += 1
    except Exception:
        pass

    # ── Identity versions over time ──────────────────────────────────────────
    versions = []
    try:
        async for d in andres_identity_versions.find({"user_id": user_id}).sort("version", -1).limit(50):
            versions.append({
                "version": d.get("version"),
                "created_at": d.get("created_at"),
                "summary": (d.get("self_description") or "")[:160],
            })
    except Exception:
        pass

    # ── Counts for the rest of the biography ─────────────────────────────────
    totals = {
        "memories": total_mem,
        "memories_by_type": mem_by_type,
        "reflections": total_refl,
        "identity_versions": (versions[0]["version"] if versions else profile.get("identity", {}).get("version", 1)),
        "skills_total": await _count(andres_skills, {"user_id": user_id}),
        "skills_active": await _count(andres_skills, {"user_id": user_id, "status": "active"}),
        "projects_total": await _count(andres_projects, {"user_id": user_id}),
        "projects_active": await _count(andres_projects, {"user_id": user_id, "status": "active"}),
        "creative_artifacts": await _count(andres_creative_artifacts, {"user_id": user_id}),
        "curiosity_items": await _count(andres_curiosity_queue, {"user_id": user_id}),
        "evolutions_approved": await _count(andres_evolution_proposals, {"user_id": user_id, "status": "approved"}),
        "conversations": await _count(andres_conversations, {"user_id": user_id}),
    }

    # ── Recent activity series: last `activity_days`, oldest → newest ────────
    today = datetime.utcnow().date()
    series = []
    for i in range(activity_days - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        cell = activity.get(d, {})
        series.append({"date": d, "memories": cell.get("memories", 0),
                       "reflections": cell.get("reflections", 0)})

    return {
        "user_id": user_id,
        "generated_at": datetime.utcnow().isoformat(),
        "age_days": age,
        "born_at": profile.get("created_at"),
        "autonomy_level": profile.get("autonomy_level", 2),
        "development_paused": bool(profile.get("development_paused", False)),
        "simulated_disposition": profile.get("simulated_disposition", {}),
        "totals": totals,
        "identity_versions": versions,
        "activity": series,
    }
