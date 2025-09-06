from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from backend.db import database as get_db

COLL = "agent_flows"

def _now():
    return datetime.utcnow()

def _oid(s: str) -> ObjectId:
    return ObjectId(s)

def _clean(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

async def insert_flow(flow: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new flow"""
    db = get_db()
    data = {
        "name": flow["name"].strip(),
        "n8n_webhook_url": flow["n8n_webhook_url"].strip(),
        "description": flow.get("description", ""),
        "version": flow.get("version", "1.0.0"),
        "input_schema": flow.get("input_schema", {}),
        "created_at": _now(),
        "updated_at": _now(),
    }
    res = await db[COLL].insert_one(data)
    data["_id"] = str(res.inserted_id)
    return data

async def list_flows() -> List[Dict[str, Any]]:
    """List all flows"""
    db = get_db()
    cur = db[COLL].find({}).sort("created_at", -1)
    items = []
    async for d in cur:
        items.append(_clean(d))
    return items

async def get_flow(flow_id: str) -> Optional[Dict[str, Any]]:
    """Get a flow by ID"""
    db = get_db()
    doc = await db[COLL].find_one({"_id": _oid(flow_id)})
    return _clean(doc)

async def update_flow(flow_id: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a flow"""
    db = get_db()
    patch["updated_at"] = _now()
    await db[COLL].update_one({"_id": _oid(flow_id)}, {"$set": patch})
    return await get_flow(flow_id)

async def delete_flow(flow_id: str) -> bool:
    """Delete a flow"""
    db = get_db()
    res = await db[COLL].delete_one({"_id": _oid(flow_id)})
    return res.deleted_count == 1
