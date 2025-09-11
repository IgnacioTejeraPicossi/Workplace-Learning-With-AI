# AgentOps Studio - Runs Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from db import database
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["runs"])
COLL = "agent_runs"

def _oid(s):
    return ObjectId(s)

def _clean(d):
    d["_id"] = str(d["_id"])
    return d

@router.post("/start")
async def start_run(payload: Dict[str, Any]):
    """Start new workflow run"""
    if not payload.get("flow_id"):
        raise HTTPException(400, "flow_id required")
    
    run_doc = {
        "flow_id": payload["flow_id"],
        "status": "running",
        "started_at": datetime.utcnow(),
        "input": payload.get("input", {}),
        "output": None,
        "error": None
    }
    
    result = await database[COLL].insert_one(run_doc)
    run_doc["_id"] = str(result.inserted_id)
    return run_doc

@router.get("")
async def list_runs(limit: int = 25, status: Optional[str] = None):
    """List runs with filtering"""
    query = {}
    if status:
        query["status"] = status
    
    items = []
    async for doc in database[COLL].find(query).sort("started_at", -1).limit(limit):
        items.append(_clean(doc))
    return {"items": items}

@router.get("/summary")
async def runs_summary():
    """Get runs summary statistics"""
    total = await database[COLL].count_documents({})
    running = await database[COLL].count_documents({"status": "running"})
    completed = await database[COLL].count_documents({"status": "completed"})
    failed = await database[COLL].count_documents({"status": "failed"})
    
    # Count today's runs
    from datetime import datetime, timedelta
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_runs = await database[COLL].count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    return {
        "total_runs": total,
        "status_counts": {
            "running": running,
            "done": completed,
            "failed": failed
        },
        "recent_runs": today_runs,
        "success_rate": completed / total if total > 0 else 0
    }

@router.get("/export")
async def export_runs():
    """Export runs data"""
    items = []
    async for doc in database[COLL].find({}).sort("started_at", -1):
        items.append(_clean(doc))
    return {"runs": items}

@router.post("/callback/{flow_id}")
async def handle_callback(flow_id: str, payload: Dict[str, Any]):
    """Handle n8n webhook callback"""
    # Update run status based on callback
    update_data = {
        "status": payload.get("status", "completed"),
        "output": payload.get("output"),
        "error": payload.get("error"),
        "completed_at": datetime.utcnow()
    }
    
    await database[COLL].update_one(
        {"flow_id": flow_id, "status": "running"},
        {"$set": update_data}
    )
    
    return {"status": "callback_processed"}
