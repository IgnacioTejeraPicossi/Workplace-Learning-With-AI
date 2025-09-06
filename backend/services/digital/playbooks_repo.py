from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from backend.db import database as get_db

COLL = "digital_playbooks"

def _oid(s: str) -> ObjectId: 
    return ObjectId(s)

def _clean(d):
    if not d:
        return None
    d["_id"] = str(d["_id"])
    return d

async def insert_playbook(doc: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    res = await db[COLL].insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return doc

async def list_playbooks() -> List[Dict[str, Any]]:
    db = get_db()
    items = []
    async for d in db[COLL].find({}).sort("created_at", -1):
        items.append(_clean(d))
    return items

async def get_playbook(pid: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    d = await db[COLL].find_one({"_id": _oid(pid)})
    return _clean(d) if d else None

async def update_playbook(pid: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_db()
    patch["updated_at"] = datetime.utcnow()
    await db[COLL].update_one({"_id": _oid(pid)}, {"$set": patch})
    return await get_playbook(pid)

async def delete_playbook(pid: str) -> bool:
    db = get_db()
    res = await db[COLL].delete_one({"_id": _oid(pid)})
    return res.deleted_count == 1
