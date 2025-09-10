# AgentOps Studio - Playbook Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.db import database
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["playbooks"])
COLL = "digital_playbooks"

def _oid(s):
    return ObjectId(s)

def _clean(d):
    d["_id"] = str(d["_id"])
    return d

@router.post("")
async def create_playbook(doc: Dict[str, Any]):
    """Create new playbook"""
    if not doc.get("name"):
        raise HTTPException(400, "name required")
    
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    result = await database[COLL].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.get("")
async def list_playbooks():
    """List all playbooks"""
    items = []
    async for doc in database[COLL].find({}).sort("created_at", -1):
        items.append(_clean(doc))
    return {"items": items}

@router.get("/_ping")
async def ping_playbooks():
    """Ping playbooks service"""
    return {"status": "ok", "service": "playbooks"}

@router.get("/{playbook_id}")
async def get_playbook(playbook_id: str):
    """Get playbook by ID"""
    doc = await database[COLL].find_one({"_id": _oid(playbook_id)})
    if not doc:
        raise HTTPException(404, "playbook not found")
    return _clean(doc)

@router.patch("/{playbook_id}")
async def update_playbook(playbook_id: str, patch: Dict[str, Any]):
    """Update playbook"""
    patch["updated_at"] = datetime.utcnow()
    await database[COLL].update_one(
        {"_id": _oid(playbook_id)}, 
        {"$set": patch}
    )
    return await get_playbook(playbook_id)

@router.delete("/{playbook_id}")
async def delete_playbook(playbook_id: str):
    """Delete playbook"""
    result = await database[COLL].delete_one({"_id": _oid(playbook_id)})
    return {"deleted": result.deleted_count == 1}

@router.get("/_ping")
def playbooks_ping():
    return {"ok": True, "module": "playbooks"}
