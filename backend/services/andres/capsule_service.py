"""
Andrés — Personality Capsule + identity history (V5, "reflective assistant under
the user's initiative" track).

Guiding rule for V5 (Andrés' own phrasing): "can develop, but not rewrite itself
in silence." So this module gives the user two things, both user-initiated and
fully auditable:

1. **Personality Capsule** — a portable snapshot of *who Andrés is* (identity,
   traits, interests) plus a manifest of what else he carries (memory / project /
   skill counts, with provenance). Export is read-only. Import is a two-step,
   reversible operation: `preview` returns a **legible diff** and changes nothing;
   `apply` snapshots the current identity into andres_identity_versions first (so
   it can be rolled back) and then applies ONLY the identity fields. Memories,
   projects and skills in a capsule are reported but never silently injected — and
   skills would still have to pass the V4 safety gate separately.

2. **Identity history** — the version timeline (populated by V2 evolution) with a
   readable diff between each version and the previous one.

This is the "minimal but safe" capsule Andrés asked to build first. No autonomous
initiative is introduced here.
"""
from copy import deepcopy
from datetime import datetime

from fastapi import HTTPException

from backend.db import (
    andres_profiles, andres_identity_versions, andres_memories,
    andres_projects, andres_skills,
)
from backend.services.andres.constitution import default_identity

CAPSULE_VERSION = 1
_TRAIT_KEYS = list(default_identity()["traits"].keys())


async def export_capsule(user_id: str, profile: dict) -> dict:
    """A portable, read-only snapshot of Andrés' personality + a content manifest."""
    identity = profile.get("identity", {})
    mem_total = await andres_memories.count_documents({"user_id": user_id})
    mem_verified = await andres_memories.count_documents({"user_id": user_id, "user_verified": True})
    proj_active = await andres_projects.count_documents({"user_id": user_id, "status": "active"})
    skills_active = await andres_skills.count_documents({"user_id": user_id, "status": "active"})
    return {
        "capsule_version": CAPSULE_VERSION,
        "exported_at": datetime.utcnow().isoformat(),
        "identity": {
            "name": identity.get("name", "Andrés"),
            "version": identity.get("version", 1),
            "self_description": identity.get("self_description", ""),
            "core_interests": list(identity.get("core_interests", [])),
            "traits": dict(identity.get("traits", {})),
            "preferred_expression": list(identity.get("preferred_expression", [])),
        },
        "manifest": {
            "memories_total": mem_total,
            "memories_verified": mem_verified,
            "projects_active": proj_active,
            "skills_active": skills_active,
        },
        "provenance": (
            "Exported from Andrés the Robot. Identity is user-approved; the manifest "
            "counts describe what this instance carries. Importing applies identity "
            "only, reversibly."
        ),
    }


def _validate_capsule(capsule: dict) -> dict:
    if not isinstance(capsule, dict):
        raise HTTPException(status_code=400, detail="Capsule must be an object")
    identity = capsule.get("identity")
    if not isinstance(identity, dict) or not isinstance(identity.get("traits"), dict):
        raise HTTPException(status_code=400, detail="Capsule is missing a valid identity/traits")
    return identity


def diff_capsule(profile: dict, capsule: dict) -> dict:
    """Return a legible diff of what importing this capsule's IDENTITY would change.

    Changes nothing. Memory/project/skill manifest counts are reported as
    informational only (they are never auto-imported)."""
    incoming = _validate_capsule(capsule)
    current = profile.get("identity", {})

    # trait deltas
    cur_traits = current.get("traits", {})
    new_traits = incoming.get("traits", {})
    trait_changes = []
    for k in sorted(set(list(cur_traits.keys()) + list(new_traits.keys()))):
        old = cur_traits.get(k)
        new = new_traits.get(k)
        if old != new and new is not None:
            trait_changes.append({"trait": k, "from": old, "to": new})

    # interests
    cur_int = set(current.get("core_interests", []))
    new_int = set(incoming.get("core_interests", []))
    interests_added = sorted(new_int - cur_int)
    interests_removed = sorted(cur_int - new_int)

    self_changed = (
        bool(incoming.get("self_description"))
        and incoming.get("self_description") != current.get("self_description")
    )

    return {
        "self_description_changes": bool(self_changed),
        "self_description_from": current.get("self_description", ""),
        "self_description_to": incoming.get("self_description", "") if self_changed else None,
        "trait_changes": trait_changes,
        "interests_added": interests_added,
        "interests_removed": interests_removed,
        "manifest": capsule.get("manifest", {}),
        "note": (
            "Importing applies identity only (self-description, interests, traits, "
            "preferred expression) and is reversible via version history. Memories, "
            "projects and skills listed in the manifest are NOT imported here."
        ),
    }


async def import_capsule(user_id: str, profile: dict, capsule: dict) -> dict:
    """Apply the capsule's identity, reversibly. Snapshots the current identity first."""
    if profile.get("identity_frozen"):
        raise HTTPException(status_code=409, detail="Identity is frozen; unfreeze to import")
    incoming = _validate_capsule(capsule)
    current = profile.get("identity", {})

    # snapshot current identity → history (so the import can be rolled back)
    await andres_identity_versions.insert_one({
        "user_id": user_id,
        "version": int(current.get("version", 1)),
        "identity": deepcopy(current),
        "reason": "pre-capsule-import snapshot",
        "archived_at": datetime.utcnow().isoformat(),
    })

    new_identity = deepcopy(current)
    if incoming.get("self_description"):
        new_identity["self_description"] = str(incoming["self_description"])[:2000]
    if isinstance(incoming.get("core_interests"), list):
        new_identity["core_interests"] = [str(x)[:60] for x in incoming["core_interests"]][:30]
    if isinstance(incoming.get("preferred_expression"), list):
        new_identity["preferred_expression"] = [str(x)[:120] for x in incoming["preferred_expression"]][:30]
    # only known traits, clamped
    merged = dict(new_identity.get("traits", {}))
    for k, v in incoming.get("traits", {}).items():
        if k in _TRAIT_KEYS:
            try:
                merged[k] = max(0, min(100, int(v)))
            except (TypeError, ValueError):
                pass
    new_identity["traits"] = merged
    new_identity["version"] = int(current.get("version", 1)) + 1
    new_identity["approved_by_user"] = True

    now = datetime.utcnow().isoformat()
    await andres_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"identity": new_identity, "last_evolution": now}},
    )
    return {"ok": True, "identity": new_identity, "version": new_identity["version"]}


def _identity_diff(newer: dict, older: dict) -> dict:
    """Small readable diff between two identity snapshots (older → newer)."""
    changes = []
    n_tr, o_tr = newer.get("traits", {}), older.get("traits", {})
    for k in sorted(set(list(n_tr.keys()) + list(o_tr.keys()))):
        if n_tr.get(k) != o_tr.get(k):
            changes.append(f"{k}: {o_tr.get(k)}→{n_tr.get(k)}")
    n_int, o_int = set(newer.get("core_interests", [])), set(older.get("core_interests", []))
    for it in sorted(n_int - o_int):
        changes.append(f"+interest {it}")
    for it in sorted(o_int - n_int):
        changes.append(f"-interest {it}")
    if newer.get("self_description") != older.get("self_description"):
        changes.append("self-description changed")
    return {"changes": changes}


async def identity_history(user_id: str, profile: dict, limit: int = 100) -> list:
    """Version timeline (newest first) with a diff vs the previous version."""
    snaps = []
    async for doc in andres_identity_versions.find({"user_id": user_id}).sort("version", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        snaps.append(doc)

    # prepend the *current* live identity as the head of the timeline
    current = profile.get("identity", {})
    timeline = [{
        "version": current.get("version", 1),
        "identity": current,
        "reason": "current",
        "archived_at": None,
        "current": True,
    }] + snaps

    # attach a diff of each entry vs the next-older one
    out = []
    for i, entry in enumerate(timeline):
        older = timeline[i + 1]["identity"] if i + 1 < len(timeline) else None
        diff = _identity_diff(entry["identity"], older) if older else {"changes": []}
        out.append({
            "version": entry["version"],
            "reason": entry.get("reason"),
            "archived_at": entry.get("archived_at"),
            "current": entry.get("current", False),
            "self_description": entry["identity"].get("self_description", ""),
            "diff": diff,
        })
    return out
