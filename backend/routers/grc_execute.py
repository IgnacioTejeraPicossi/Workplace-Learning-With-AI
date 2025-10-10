"""
GRC Agent Router
Responsible AI Ops for Finance/Procurement/Supply Chain/ESG
"""

from fastapi import APIRouter, Header, HTTPException
from backend.models.grc import GrcActionBundle, AgentCallback
from backend.security.hmac import verify, sign
from backend.store.runs import create_start, finish_success, finish_error
from backend.attestation.hash import compute_attestation
from backend.integrations import sap, esg, notify
import httpx
import uuid

router = APIRouter(prefix="/agents/grc", tags=["grc"])

@router.get("/stats")
async def get_stats():
    """Get GRC agent statistics"""
    return {
        "totalFindings": 2,
        "openFindings": 1,
        "resolvedFindings": 1,
        "totalActions": 5,
        "resolutionRate": 0.5
    }

@router.get("/findings")
async def get_findings():
    """Get GRC findings"""
    return [
        {
            "object_id": "PO-4500001234",
            "title": "Purchase Order Price Variance",
            "category": "Procurement",
            "severity": 0.8,
            "confidence": 0.9,
            "materiality": 0.7,
            "status": "Open"
        },
        {
            "object_id": "INV-51056001",
            "title": "Invoice Three-way Match Failed",
            "category": "Finance",
            "severity": 0.6,
            "confidence": 0.8,
            "materiality": 0.5,
            "status": "InProgress"
        }
    ]

@router.post("/execute")
async def execute(bundle: GrcActionBundle, x_signature: str = Header(...)):
    """Execute GRC action bundle with HMAC verification"""
    if not verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    run_id = bundle.run_id
    run_record = await create_start(run_id, "grc", bundle.dict())

    artifacts = {}
    
    try:
        # Execute each action
        for action in bundle.actions:
            if action.type == "erp.fix":
                result = await sap.apply_fix(action.payload)
                artifacts.setdefault("erp", []).append({
                    "action": "apply_fix",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "po.block":
                result = await sap.block_po(action.payload)
                artifacts.setdefault("erp", []).append({
                    "action": "block_po",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "invoice.hold":
                result = await sap.hold_invoice(action.payload)
                artifacts.setdefault("erp", []).append({
                    "action": "hold_invoice",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "esg.recalc":
                result = await esg.recalculate(action.payload)
                artifacts.setdefault("esg", []).append({
                    "action": "recalculate",
                    "result": result,
                    "payload": action.payload
                })
                
            elif action.type == "notify.slack":
                result = await notify.slack(action.payload)
                artifacts["slack"] = {
                    "action": "notify",
                    "result": result,
                    "payload": action.payload
                }
                
            elif action.type == "notify.teams":
                result = await notify.teams(action.payload)
                artifacts["teams"] = {
                    "action": "notify",
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
            detail=f"GRC bundle execution failed: {str(e)}"
        )

@router.post("/callback")
async def grc_callback(callback: AgentCallback):
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

@router.get("/runs")
async def get_grc_runs(limit: int = 50):
    """Get GRC agent runs"""
    from backend.store.runs import get_runs_by_module
    
    runs = await get_runs_by_module("grc", limit)
    return runs

@router.get("/health")
async def health_check():
    """Health check for GRC agent"""
    return {
        "status": "healthy",
        "agent": "Responsible AI Ops (GRC)",
        "version": "1.0.0",
        "capabilities": [
            "erp.fix",
            "po.block", 
            "invoice.hold",
            "esg.recalc",
            "notify.slack",
            "notify.teams"
        ]
    }

@router.post("/test")
async def test_execution():
    """Test GRC agent execution with sample data"""
    run_id = f"grc-test-{uuid.uuid4()}"
    
    bundle = GrcActionBundle(
        run_id=run_id,
        object_ref="PO 4500001234",
        topic="Three-way match failed",
        summary_md="Price variance > 10%; auto hold + notify.",
        evidence=[
            {
                "source": "SAP",
                "snippet": "PO vs Invoice mismatch detected"
            }
        ],
        actions=[
            {
                "type": "invoice.hold",
                "payload": {
                    "invoiceId": "51056001",
                    "reason": "Variance > 10%"
                },
                "mode": "Auto"
            },
            {
                "type": "notify.slack",
                "payload": {
                    "channel": "#grc",
                    "text": "Invoice 51056001 on hold due to price variance > 10%"
                },
                "mode": "Auto"
            }
        ],
        callback_url="http://localhost:8000/api/agent-runs/callback"
    )
    
    # Sign the bundle
    signature = sign(bundle.dict())
    
    # Execute the bundle
    return await execute(bundle, signature)
