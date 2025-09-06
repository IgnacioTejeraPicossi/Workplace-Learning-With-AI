from fastapi import APIRouter, Request, HTTPException, Query
from typing import Dict, Optional, List
import httpx
import os
import json
from datetime import datetime

from backend.services.agentops import flows_repo, runs_repo, security
from backend.db import database as get_db

router = APIRouter(prefix="/api/agentops", tags=["agentops"])
N8N_TIMEOUT = float(os.getenv("N8N_TIMEOUT", "60"))

# --- Flow Catalog CRUD ---

@router.post("/flows")
async def register_flow(flow: Dict):
    """Register a new flow"""
    if not flow.get("name") or not flow.get("n8n_webhook_url"):
        raise HTTPException(400, "name and n8n_webhook_url are required")
    return await flows_repo.insert_flow(flow)

@router.get("/flows")
async def list_flows():
    """List all flows"""
    return {"items": await flows_repo.list_flows()}

@router.get("/flows/{flow_id}")
async def read_flow(flow_id: str):
    """Get a specific flow"""
    f = await flows_repo.get_flow(flow_id)
    if not f:
        raise HTTPException(404, "flow not found")
    return f

@router.patch("/flows/{flow_id}")
async def patch_flow(flow_id: str, patch: Dict):
    """Update a flow"""
    f = await flows_repo.update_flow(flow_id, patch)
    if not f:
        raise HTTPException(404, "flow not found")
    return f

@router.delete("/flows/{flow_id}")
async def remove_flow(flow_id: str):
    """Delete a flow"""
    ok = await flows_repo.delete_flow(flow_id)
    if not ok:
        raise HTTPException(404, "flow not found")
    return {"deleted": True}

# --- Run lifecycle ---

@router.post("/runs/start")
async def start_run(payload: Dict):
    """
    Start a new run
    payload: { flow_id, input }
    """
    flow_id = payload.get("flow_id")
    if not flow_id:
        raise HTTPException(400, "flow_id required")
    
    flow = await flows_repo.get_flow(flow_id)
    if not flow:
        raise HTTPException(404, "flow not found")

    run_id = await runs_repo.create_run(flow_id=flow["_id"], input=payload.get("input", {}))

    # POST to n8n webhook
    data = {"run_id": run_id, "input": payload.get("input", {})}
    try:
        async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
            r = await client.post(flow["n8n_webhook_url"], json=data)
            r.raise_for_status()
    except Exception as e:
        await runs_repo.set_status(run_id, "error", {"error": str(e)})
        raise HTTPException(500, f"Failed to start n8n workflow: {e}")

    await runs_repo.set_status(run_id, "running")
    return {"run_id": run_id, "status": "running"}

@router.get("/runs")
async def list_runs(
    flow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50)
):
    """List runs with filters"""
    date_from_dt = None
    date_to_dt = None
    
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            raise HTTPException(400, "Invalid date_from format")
    
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            raise HTTPException(400, "Invalid date_to format")
    
    runs = await runs_repo.list_runs_filtered(
        flow_id=flow_id,
        status=status,
        date_from=date_from_dt,
        date_to=date_to_dt,
        limit=limit
    )
    return {"items": runs}

@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get a specific run"""
    d = await runs_repo.get_run(run_id)
    if not d:
        raise HTTPException(404, "run not found")
    return d

@router.get("/runs/summary")
async def get_runs_summary():
    """Get runs summary statistics"""
    db = get_db()
    
    # Get total runs
    total_runs = await db["agent_runs"].count_documents({})
    
    # Get runs by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = {}
    async for doc in db["agent_runs"].aggregate(status_pipeline):
        status_counts[doc["_id"]] = doc["count"]
    
    # Get recent runs (last 24h)
    from datetime import timedelta
    recent_cutoff = datetime.utcnow() - timedelta(hours=24)
    recent_runs = await db["agent_runs"].count_documents({
        "started_at": {"$gte": recent_cutoff}
    })
    
    return {
        "total_runs": total_runs,
        "status_counts": status_counts,
        "recent_runs_24h": recent_runs
    }

# --- Callback from n8n ---

@router.post("/callback/{flow_id}")
async def n8n_callback(flow_id: str, request: Request):
    """Callback endpoint for n8n workflows"""
    body = await request.body()
    sig = request.headers.get("X-Signature", "")
    ok = security.verify_hmac(sig, body)
    if not ok:
        raise HTTPException(401, "Invalid signature")

    data = await request.json()
    data["hmac_ok"] = True
    await runs_repo.update_from_callback(flow_id, data)
    return {"ok": True}

# --- Export functionality ---

@router.get("/runs/export")
async def export_runs(
    format: str = Query("json"),
    flow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Export runs in CSV or JSON format"""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Parse dates
    date_from_dt = None
    date_to_dt = None
    
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            raise HTTPException(400, "Invalid date_from format")
    
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            raise HTTPException(400, "Invalid date_to format")
    
    runs = await runs_repo.list_runs_filtered(
        flow_id=flow_id,
        status=status,
        date_from=date_from_dt,
        date_to=date_to_dt,
        limit=1000  # Export limit
    )
    
    if format.lower() == "csv":
        output = io.StringIO()
        if runs:
            writer = csv.DictWriter(output, fieldnames=runs[0].keys())
            writer.writeheader()
            for run in runs:
                writer.writerow(run)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=agentops_runs.csv"}
        )
    else:  # JSON
        return {"runs": runs}
