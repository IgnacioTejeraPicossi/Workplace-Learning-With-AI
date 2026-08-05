"""
Andrés — project service (V2).

Andrés' own small projects (things he wants to build or explore with the user
over time). Projects are user-visible, editable and reversible. Active projects
are injected into the prompt's [CURRENT PROJECTS] layer so they shape how Andrés
shows up. Stored in andres_projects; counters.current_projects tracks the active
count. See plan §8 (prompt layering) and §11 (V2).
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_projects, andres_profiles

_STATUSES = {"active", "paused", "done", "abandoned"}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid project id")


async def _recount(user_id: str) -> None:
    active = await andres_projects.count_documents({"user_id": user_id, "status": "active"})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.current_projects": active}}
    )


async def list_projects(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_projects.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def create_project(user_id: str, data: dict) -> dict:
    now = datetime.utcnow().isoformat()
    status = data.get("status", "active")
    if status not in _STATUSES:
        status = "active"
    doc = {
        "user_id": user_id,
        "title": (data.get("title") or "").strip()[:200],
        "description": (data.get("description") or "").strip()[:2000],
        "status": status,
        "created_at": now,
        "updated_at": now,
    }
    res = await andres_projects.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    await _recount(user_id)
    return doc


async def update_project(user_id: str, project_id: str, patch: dict) -> dict:
    allowed = {k: v for k, v in patch.items()
               if k in {"title", "description", "status"} and v is not None}
    if "status" in allowed and allowed["status"] not in _STATUSES:
        allowed.pop("status")
    if not allowed:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    allowed["updated_at"] = datetime.utcnow().isoformat()
    res = await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id}, {"$set": allowed}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await _recount(user_id)
    doc = await andres_projects.find_one({"_id": _oid(project_id), "user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc or {"ok": True}


async def delete_project(user_id: str, project_id: str) -> dict:
    res = await andres_projects.delete_one({"_id": _oid(project_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await _recount(user_id)
    return {"ok": True, "deleted": project_id}
