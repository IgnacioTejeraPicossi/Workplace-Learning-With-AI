"""
Andrés — project service (V2 core + V5 lifecycle).

Andrés' own small projects. Active projects are injected into the prompt's
[CURRENT PROJECTS] layer, so they shape how he shows up. Stored in andres_projects;
counters.current_projects tracks the *active* count.

V5 lifecycle (Andrés' own design): a project moves
`proposed → active → paused → completed | abandoned → archived`, with two hard
rules he asked for:
  1. Nothing becomes `active` without the user's approval.
  2. Nothing is `archived` without a brief **closure reflection**.

Archiving isn't failure — it's disposal with dignity, and it distinguishes:
  • **cemetery** — the project didn't work / was vague / too costly; nothing to keep.
  • **compost** — it shouldn't continue now, but it left a reusable seed (a
    guideline, a phrase, a preference, a useful constraint). Compost MUST carry a
    `reuse_seed`, so a dead project can still feed the next one.

Each project also carries the same discipline as Andrés' suggestions — rationale,
benefit, risk, success_criteria, attention_budget — so initiative never becomes a
"more, more, more" shelf of half-breathing prototypes.
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_projects, andres_profiles

_STATUSES = {"proposed", "active", "paused", "completed", "abandoned", "archived"}
# statuses a plain update may set (archiving has its own closure-gated endpoint)
_UPDATABLE_STATUSES = {"proposed", "active", "paused", "completed", "abandoned"}
_DISPOSITIONS = {"cemetery", "compost"}
_RICH_FIELDS = ("rationale", "benefit", "risk", "success_criteria", "attention_budget", "review_at")


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
    if status not in _STATUSES or status == "archived":
        status = "active"
    doc = {
        "user_id": user_id,
        "title": (data.get("title") or "").strip()[:200],
        "description": (data.get("description") or "").strip()[:2000],
        "status": status,
        # a user-created project is approved by the act of creating it; a project
        # proposed by Andrés' initiative starts unapproved and must be approved.
        "approved_by_user": status == "active",
        "origin": data.get("origin", "user"),
        "created_at": now,
        "updated_at": now,
        "closure_reflection": None,
        "archive_reason": None,
        "reuse_seed": None,
    }
    for f in _RICH_FIELDS:
        doc[f] = (str(data.get(f) or "").strip()[:1000]) or None
    res = await andres_projects.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    await _recount(user_id)
    return doc


async def update_project(user_id: str, project_id: str, patch: dict) -> dict:
    fields = {"title", "description", "status"} | set(_RICH_FIELDS)
    allowed = {k: v for k, v in patch.items() if k in fields and v is not None}
    if "status" in allowed and allowed["status"] not in _UPDATABLE_STATUSES:
        # archiving must go through archive_project (needs a closure reflection)
        raise HTTPException(status_code=400, detail="Use the archive endpoint to archive")
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


async def approve_project(user_id: str, project_id: str) -> dict:
    """Rule 1: a proposed project only becomes active with the user's approval."""
    doc = await andres_projects.find_one({"_id": _oid(project_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    if doc.get("status") != "proposed":
        raise HTTPException(status_code=409, detail=f"Project is {doc.get('status')}, not proposed")
    await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id},
        {"$set": {"status": "active", "approved_by_user": True,
                  "updated_at": datetime.utcnow().isoformat()}},
    )
    await _recount(user_id)
    return {"ok": True, "id": project_id, "status": "active"}


async def archive_project(user_id: str, project_id: str, closure: dict) -> dict:
    """Rule 2: archiving requires a closure reflection; compost must carry a seed."""
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

    res = await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id},
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
