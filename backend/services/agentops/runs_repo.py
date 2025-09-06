from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from backend.db import database as get_db

COLL = "agent_runs"

def _now():
    return datetime.utcnow()

def _oid(s: str) -> ObjectId:
    return ObjectId(s)

async def create_run(flow_id: str, input: Dict[str, Any]) -> str:
    """Create a new run"""
    db = get_db()
    doc = {
        "flow_id": flow_id,
        "status": "queued",
        "input": input,
        "output": None,
        "logs": [],
        "started_at": _now(),
        "finished_at": None,
        "n8n_exec_id": None,
        "hmac_ok": None,
    }
    res = await db[COLL].insert_one(doc)
    return str(res.inserted_id)

async def set_status(run_id: str, status: str, patch: Dict[str, Any] = None):
    """Update run status"""
    db = get_db()
    upd = {"status": status}
    if patch:
        upd.update(patch)
    if status in ("done", "error", "safety_failed"):
        upd["finished_at"] = _now()
    await db[COLL].update_one({"_id": _oid(run_id)}, {"$set": upd})

async def update_from_callback(flow_id: str, data: Dict[str, Any]):
    """
    Update run from n8n callback
    data: { run_id, kind: 'progress'|'result', payload, n8n_exec_id?, hmac_ok? }
    """
    db = get_db()
    run_id = data.get("run_id")
    if not run_id:
        return
    
    if data.get("kind") == "progress":
        await db[COLL].update_one({"_id": _oid(run_id)}, {
            "$push": {
                "logs": {
                    "ts": _now(),
                    "event": data.get("stage") or "progress",
                    "meta": data.get("meta")
                }
            },
            "$set": {
                "hmac_ok": data.get("hmac_ok", True),
                "n8n_exec_id": data.get("n8n_exec_id")
            }
        })
    else:
        await db[COLL].update_one({"_id": _oid(run_id)}, {
            "$set": {
                "output": data.get("payload"),
                "status": "done",
                "finished_at": _now(),
                "hmac_ok": data.get("hmac_ok", True),
                "n8n_exec_id": data.get("n8n_exec_id")
            }
        })

async def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    """Get a run by ID"""
    db = get_db()
    d = await db[COLL].find_one({"_id": _oid(run_id)})
    if not d:
        return None
    d["_id"] = str(d["_id"])
    return d

async def list_runs_filtered(
    flow_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List runs with filters"""
    db = get_db()
    query = {}
    
    if flow_id:
        query["flow_id"] = flow_id
    if status:
        query["status"] = status
    if date_from or date_to:
        query["started_at"] = {}
        if date_from:
            query["started_at"]["$gte"] = date_from
        if date_to:
            query["started_at"]["$lte"] = date_to
    
    cur = db[COLL].find(query).sort("started_at", -1).limit(limit)
    items = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        items.append(d)
    return items
