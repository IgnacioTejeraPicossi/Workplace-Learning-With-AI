"""
Agent runs storage (MongoDB)
"""

from datetime import datetime
from backend.db import database

# Agent runs collection
agent_runs_collection = database.get_collection("agent_runs")

async def create_start(run_id: str, module: str, bundle: dict):
    """Create a new agent run in RUNNING state"""
    doc = {
        "run_id": run_id,
        "module": module,
        "status": "RUNNING",
        "bundle": bundle,
        "artifacts": {},
        "created_at": datetime.utcnow(),
    }
    res = await agent_runs_collection.insert_one(doc)
    return {"_id": str(res.inserted_id), **doc}

async def finish_success(_id: str, artifacts: dict, attestation_hash: str):
    """Mark run as DONE with artifacts and attestation"""
    await agent_runs_collection.update_one(
        {"_id": _id},
        {
            "$set": {
                "status": "DONE",
                "artifacts": artifacts,
                "attestation_hash": attestation_hash,
                "ended_at": datetime.utcnow()
            }
        }
    )

async def finish_error(_id: str, error: str):
    """Mark run as FAILED with error message"""
    await agent_runs_collection.update_one(
        {"_id": _id},
        {
            "$set": {
                "status": "FAILED",
                "error": error,
                "ended_at": datetime.utcnow()
            }
        }
    )

async def upsert_callback(cb: dict):
    """Update run with callback data"""
    return await agent_runs_collection.update_one(
        {"run_id": cb["run_id"]},
        {"$set": {"callback": cb}}
    )

async def get_runs(module: str = None, limit: int = 50):
    """Get recent runs, optionally filtered by module"""
    query = {"module": module} if module else {}
    cursor = agent_runs_collection.find(query).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

