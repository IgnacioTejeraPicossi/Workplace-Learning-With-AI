"""
Sales Assistant Agent Router
Handles sales action bundle execution
"""

from fastapi import APIRouter, Header, HTTPException
from backend.models.sales import SalesActionBundle, AgentCallback
from backend.security.hmac import verify, sign
from backend.store.runs import create_start, finish_success, finish_error
from backend.attestation.hash import compute_attestation
from backend.integrations.crm import create_case, update_case
from backend.integrations.m365 import create_draft
from backend.integrations.slack import post_message
import httpx
import uuid

router = APIRouter(prefix="/agents/sales", tags=["Sales Assistant"])

@router.post("/execute")
async def execute_sales_bundle(
    bundle: SalesActionBundle, 
    x_signature: str = Header(..., alias="X-Signature")
):
    """Execute sales action bundle with HMAC verification"""
    
    # Verify HMAC signature
    if not verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Create initial run record
    run_id = bundle.run_id
    run_data = {
        "run_id": run_id,
        "module": "sales",
        "topic": bundle.topic,
        "status": "RUNNING",
        "bundle": bundle.dict(),
        "created_at": None,  # Will be set by MongoDB
        "updated_at": None
    }
    
    await create_run(run_data)
    
    artifacts = {}
    
    try:
        # Execute each action
        for action in bundle.actions:
            if action.type == "crm.updateOpportunity":
                result = await update_case(action.payload.get("opportunity_id"), action.payload)
                artifacts.setdefault("crm_updates", []).append({
                    "action": "updateOpportunity",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "crm.createTask":
                result = await create_case(action.payload)
                artifacts.setdefault("crm_tasks", []).append({
                    "action": "createTask", 
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "email.createDraft":
                result = await create_draft(action.payload)
                artifacts.setdefault("email_drafts", []).append({
                    "action": "createDraft",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "slack.postMessage":
                result = await post_message(action.payload)
                artifacts["slack"] = {
                    "action": "postMessage",
                    "result": result,
                    "payload": action.payload
                }
        
        # Compute attestation hash
        attestation_hash = compute_attestation(bundle.dict(), artifacts)
        
        # Update run as successful
        await finish_success(run_record["_id"], artifacts, attestation_hash)
        
        return {
            "status": "success",
            "run_id": run_id,
            "artifacts": artifacts,
            "attestation_hash": attestation_hash
        }
        
    except Exception as e:
        # Update run as failed
        await finish_error(run_record["_id"], str(e))
        
        raise HTTPException(
            status_code=500, 
            detail=f"Sales bundle execution failed: {str(e)}"
        )

@router.get("/runs")
async def get_sales_runs(limit: int = 50):
    """Get sales agent runs"""
    from ..store.runs import get_runs_by_module
    
    runs = await get_runs_by_module("sales", limit)
    return runs

@router.post("/callback")
async def sales_callback(callback: AgentCallback):
    """Handle callback from external systems"""
    # Find the run by run_id
    from backend.store.runs import runs
    run = await runs.find_one({"run_id": callback.run_id})
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if callback.status == "DONE":
        await finish_success(run["_id"], callback.artifacts, None)
    elif callback.status == "FAILED":
        await finish_error(run["_id"], callback.error or "Unknown error")
    
    return {"status": "success", "message": "Callback processed"}

@router.get("/health")
async def health_check():
    """Health check for sales agent"""
    return {
        "status": "healthy",
        "agent": "Sales Assistant",
        "version": "1.0.0",
        "capabilities": [
            "crm.updateOpportunity",
            "crm.createTask", 
            "email.createDraft",
            "slack.postMessage"
        ]
    }
