"""
Andrés — evolution manager (V2).

The ONLY path by which Andrés' identity changes: propose → user approves/rejects →
a new versioned identity is created (or rolled back). The immutable constitution
is never touched here — only the *evolving* identity (self_description, interests,
numeric traits, preferred_expression). Every approval snapshots the previous
identity into andres_identity_versions, so every change is auditable and
reversible. See plan §2, §4, §7.

Guardrails:
- Trait deltas are bounded per proposal (|delta| ≤ TRAIT_DELTA_CAP) and clamped to
  [0, 100]. (Automatic drift would be ±2/week; a user-approved proposal may be
  larger but is still bounded to avoid wild swings.)
- Only known traits can change; unknown trait keys are rejected.
- Andrés can never approve his own proposal — approval is a user action.
"""
from copy import deepcopy
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import (
    andres_profiles, andres_evolution_proposals, andres_identity_versions,
)
from backend.services.andres.constitution import default_identity

TRAIT_DELTA_CAP = 20
_KNOWN_TRAITS = set(default_identity()["traits"].keys())


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid proposal id")


def _clamp(v: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, int(v)))


def _validate_changes(changes: dict) -> dict:
    """Return a sanitised changes dict or raise 400."""
    out = {}
    if not isinstance(changes, dict) or not changes:
        raise HTTPException(status_code=400, detail="Empty change set")

    if changes.get("self_description"):
        out["self_description"] = str(changes["self_description"]).strip()[:2000]

    if changes.get("add_interests"):
        out["add_interests"] = [str(x).strip()[:60] for x in changes["add_interests"] if str(x).strip()][:10]
    if changes.get("remove_interests"):
        out["remove_interests"] = [str(x).strip()[:60] for x in changes["remove_interests"] if str(x).strip()][:10]

    if changes.get("preferred_expression_add"):
        out["preferred_expression_add"] = [str(x).strip()[:120] for x in changes["preferred_expression_add"] if str(x).strip()][:10]

    deltas = changes.get("trait_deltas") or {}
    if deltas:
        clean = {}
        for k, v in deltas.items():
            if k not in _KNOWN_TRAITS:
                raise HTTPException(status_code=400, detail=f"Unknown trait: {k}")
            try:
                d = int(v)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail=f"Non-numeric trait delta: {k}")
            if abs(d) > TRAIT_DELTA_CAP:
                raise HTTPException(
                    status_code=400,
                    detail=f"Trait delta for {k} exceeds cap ±{TRAIT_DELTA_CAP}",
                )
            if d != 0:
                clean[k] = d
        if clean:
            out["trait_deltas"] = clean

    if not out:
        raise HTTPException(status_code=400, detail="No valid changes in proposal")
    return out


def _apply_changes(identity: dict, changes: dict) -> dict:
    """Return a NEW identity dict with changes applied and version bumped."""
    new = deepcopy(identity)

    if "self_description" in changes:
        new["self_description"] = changes["self_description"]

    interests = list(new.get("core_interests", []))
    for it in changes.get("add_interests", []):
        if it not in interests:
            interests.append(it)
    for it in changes.get("remove_interests", []):
        interests = [x for x in interests if x != it]
    new["core_interests"] = interests

    prefs = list(new.get("preferred_expression", []))
    for p in changes.get("preferred_expression_add", []):
        if p not in prefs:
            prefs.append(p)
    new["preferred_expression"] = prefs

    traits = dict(new.get("traits", {}))
    for k, d in changes.get("trait_deltas", {}).items():
        traits[k] = _clamp(traits.get(k, 50) + d)
    new["traits"] = traits

    new["version"] = int(identity.get("version", 1)) + 1
    new["approved_by_user"] = True
    return new


async def propose(user_id: str, profile: dict, rationale: str, changes: dict) -> dict:
    """Store a pending evolution proposal (does not change identity)."""
    clean = _validate_changes(changes)
    now = datetime.utcnow().isoformat()
    doc = {
        "user_id": user_id,
        "rationale": (rationale or "").strip()[:2000],
        "changes": clean,
        "status": "pending",
        "from_version": int(profile.get("identity", {}).get("version", 1)),
        "created_at": now,
    }
    res = await andres_evolution_proposals.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return doc


async def list_proposals(user_id: str, status: str = None, limit: int = 100) -> list:
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    out = []
    async for doc in andres_evolution_proposals.find(query).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def list_versions(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_identity_versions.find({"user_id": user_id}).sort("version", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def _snapshot_current(user_id: str, profile: dict, reason: str, proposal_id=None) -> None:
    identity = profile.get("identity", {})
    await andres_identity_versions.insert_one({
        "user_id": user_id,
        "version": int(identity.get("version", 1)),
        "identity": deepcopy(identity),
        "reason": reason,
        "proposal_id": proposal_id,
        "archived_at": datetime.utcnow().isoformat(),
    })


async def approve(user_id: str, profile: dict, proposal_id: str) -> dict:
    """Apply a pending proposal: snapshot current identity, then version up."""
    if profile.get("identity_frozen"):
        raise HTTPException(status_code=409, detail="Identity is frozen; unfreeze to evolve")

    prop = await andres_evolution_proposals.find_one(
        {"_id": _oid(proposal_id), "user_id": user_id}
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if prop.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Proposal already {prop.get('status')}")

    await _snapshot_current(user_id, profile, "pre-approval snapshot", proposal_id)
    new_identity = _apply_changes(profile.get("identity", {}), prop["changes"])
    now = datetime.utcnow().isoformat()
    await andres_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"identity": new_identity, "last_evolution": now}},
    )
    await andres_evolution_proposals.update_one(
        {"_id": _oid(proposal_id), "user_id": user_id},
        {"$set": {"status": "approved", "applied_at": now,
                  "to_version": new_identity["version"]}},
    )
    return {"ok": True, "identity": new_identity, "version": new_identity["version"]}


async def reject(user_id: str, proposal_id: str) -> dict:
    res = await andres_evolution_proposals.update_one(
        {"_id": _oid(proposal_id), "user_id": user_id, "status": "pending"},
        {"$set": {"status": "rejected", "rejected_at": datetime.utcnow().isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending proposal not found")
    return {"ok": True, "id": proposal_id, "status": "rejected"}


async def rollback(user_id: str, profile: dict, target_version: int) -> dict:
    """Restore a prior identity snapshot as a NEW version (reversible, auditable)."""
    snap = await andres_identity_versions.find_one(
        {"user_id": user_id, "version": int(target_version)}
    )
    if not snap:
        raise HTTPException(status_code=404, detail="Target version not found")

    # snapshot the current identity first so the rollback itself can be undone
    await _snapshot_current(user_id, profile, "pre-rollback snapshot")

    restored = deepcopy(snap["identity"])
    restored["version"] = int(profile.get("identity", {}).get("version", 1)) + 1
    restored["approved_by_user"] = True
    now = datetime.utcnow().isoformat()
    await andres_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"identity": restored, "last_evolution": now}},
    )
    return {"ok": True, "identity": restored, "version": restored["version"],
            "rolled_back_to": int(target_version)}
