"""
Andrés — curriculum (V5). "A compass, not a school."

Andrés' framing: a rigid school domesticates him; pure freedom disperses him. So
the curriculum is broad AREAS (a compass) rather than fixed subjects, and each
MODULE is a small, closeable unit — not an eternal course — carrying the same
discipline as his projects: purpose, expected competencies, risks, success
criteria, a review point, and which memory type it may create.

Two hard rules mirror the project lifecycle:
  1. A module only becomes `active` with the user's approval.
  2. A module is only `archived` with a closure reflection (cemetery / compost),
     so "abandoning a module" still leaves a learning behind.

The `character_style` area is Andrés' own answer to "formal or implicit?": FORMAL
but NOT DOMINANT — an explicit, bounded, evaluable category (its 30% sub-weights
live in the frontend compass), judged by "clearer / honester / more useful / more
its-own / respectful", never by "does it sound more alive".
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_curriculum_modules, andres_profiles
from backend.services.andres.memory_service import MEMORY_TYPES

# The compass — broad areas (labels/descriptions are localized in the frontend).
AREAS = {
    "language", "reasoning", "creativity", "practical_ethics",
    "knowledge_of_user", "collaboration", "character_style",
}

_STATUSES = {"proposed", "active", "paused", "completed", "archived"}
_UPDATABLE_STATUSES = {"proposed", "active", "paused", "completed"}
_DISPOSITIONS = {"cemetery", "compost"}
_RICH = ("purpose", "competencies", "risks", "success_criteria", "review_at")


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid module id")


async def _recount(user_id: str) -> None:
    active = await andres_curriculum_modules.count_documents(
        {"user_id": user_id, "status": "active"}
    )
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.curriculum_active": active}}
    )


async def list_modules(user_id: str, limit: int = 200) -> list:
    out = []
    async for doc in andres_curriculum_modules.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def create_module(user_id: str, data: dict) -> dict:
    area = data.get("area")
    if area not in AREAS:
        raise HTTPException(status_code=400, detail="Unknown curriculum area")
    memory_type = data.get("memory_type") or None
    if memory_type and memory_type not in MEMORY_TYPES:
        memory_type = None
    now = datetime.utcnow().isoformat()
    status = data.get("status", "active")
    if status not in _STATUSES or status == "archived":
        status = "active"
    doc = {
        "user_id": user_id,
        "area": area,
        "title": (data.get("title") or "").strip()[:200],
        "memory_type": memory_type,
        "status": status,
        "approved_by_user": status == "active",
        "origin": data.get("origin", "user"),
        "created_at": now,
        "updated_at": now,
        "closure_reflection": None,
        "archive_reason": None,
        "reuse_seed": None,
    }
    for f in _RICH:
        doc[f] = (str(data.get(f) or "").strip()[:1000]) or None
    res = await andres_curriculum_modules.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    await _recount(user_id)
    return doc


async def update_module(user_id: str, module_id: str, patch: dict) -> dict:
    fields = {"title", "status", "memory_type"} | set(_RICH)
    allowed = {k: v for k, v in patch.items() if k in fields and v is not None}
    if "status" in allowed and allowed["status"] not in _UPDATABLE_STATUSES:
        raise HTTPException(status_code=400, detail="Use the archive endpoint to archive")
    if "memory_type" in allowed and allowed["memory_type"] not in MEMORY_TYPES:
        allowed.pop("memory_type")
    if not allowed:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    allowed["updated_at"] = datetime.utcnow().isoformat()
    res = await andres_curriculum_modules.update_one(
        {"_id": _oid(module_id), "user_id": user_id}, {"$set": allowed}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    await _recount(user_id)
    doc = await andres_curriculum_modules.find_one({"_id": _oid(module_id), "user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc or {"ok": True}


async def approve_module(user_id: str, module_id: str) -> dict:
    doc = await andres_curriculum_modules.find_one({"_id": _oid(module_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Module not found")
    if doc.get("status") != "proposed":
        raise HTTPException(status_code=409, detail=f"Module is {doc.get('status')}, not proposed")
    await andres_curriculum_modules.update_one(
        {"_id": _oid(module_id), "user_id": user_id},
        {"$set": {"status": "active", "approved_by_user": True,
                  "updated_at": datetime.utcnow().isoformat()}},
    )
    await _recount(user_id)
    return {"ok": True, "id": module_id, "status": "active"}


async def archive_module(user_id: str, module_id: str, closure: dict) -> dict:
    disposition = (closure or {}).get("disposition")
    if disposition not in _DISPOSITIONS:
        raise HTTPException(status_code=400, detail="disposition must be 'cemetery' or 'compost'")
    reflection = {
        "what_worked": str(closure.get("what_worked", "")).strip()[:1000],
        "what_didnt": str(closure.get("what_didnt", "")).strip()[:1000],
        "learned": str(closure.get("learned", "")).strip()[:1000],
        "guideline": str(closure.get("guideline", "")).strip()[:1000],
    }
    if not any(reflection.values()):
        raise HTTPException(status_code=400, detail="A closure reflection is required to archive")
    reuse_seed = str(closure.get("reuse_seed", "")).strip()[:1000] or None
    if disposition == "compost" and not reuse_seed:
        raise HTTPException(status_code=400, detail="Compost requires a reuse_seed (what to keep)")

    res = await andres_curriculum_modules.update_one(
        {"_id": _oid(module_id), "user_id": user_id},
        {"$set": {
            "status": "archived",
            "archive_reason": disposition,
            "closure_reflection": reflection,
            "reuse_seed": reuse_seed,
            "archived_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    await _recount(user_id)
    doc = await andres_curriculum_modules.find_one({"_id": _oid(module_id), "user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc or {"ok": True}


async def delete_module(user_id: str, module_id: str) -> dict:
    res = await andres_curriculum_modules.delete_one({"_id": _oid(module_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    await _recount(user_id)
    return {"ok": True, "deleted": module_id}
