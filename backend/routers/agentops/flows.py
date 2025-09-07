# AgentOps Studio - Flow Catalog Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.db import database
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["flows"])
COLL = "agent_flows"

def _oid(s):
    return ObjectId(s)

def _clean(d):
    d["_id"] = str(d["_id"])
    return d

@router.post("")
async def upsert_flow(doc: Dict[str, Any]):
    """Register or update n8n flow"""
    if not doc.get("name") or not doc.get("n8n_webhook_url"):
        raise HTTPException(400, "name and n8n_webhook_url required")
    
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    result = await database[COLL].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.get("")
async def list_flows():
    """List all registered flows"""
    items = []
    async for doc in database[COLL].find({}).sort("created_at", -1):
        items.append(_clean(doc))
    return {"items": items}

@router.get("/{flow_id}")
async def get_flow(flow_id: str):
    """Get flow by ID"""
    doc = await database[COLL].find_one({"_id": _oid(flow_id)})
    if not doc:
        raise HTTPException(404, "flow not found")
    return _clean(doc)

@router.patch("/{flow_id}")
async def update_flow(flow_id: str, patch: Dict[str, Any]):
    """Update flow"""
    patch["updated_at"] = datetime.utcnow()
    await database[COLL].update_one(
        {"_id": _oid(flow_id)}, 
        {"$set": patch}
    )
    return await get_flow(flow_id)

@router.delete("/{flow_id}")
async def delete_flow(flow_id: str):
    """Delete flow"""
    result = await database[COLL].delete_one({"_id": _oid(flow_id)})
    return {"deleted": result.deleted_count == 1}

@router.get("/_ping")
def flows_ping():
    return {"ok": True, "module": "flows"}