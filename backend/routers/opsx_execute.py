"""
Operations Efficiency Agent Router
Main execution endpoint for Ops Efficiency Agent
"""

from fastapi import APIRouter, Header, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Any, List
import uuid
from datetime import datetime

from ..models.opsx import OpsxBundle, OpsxStats, OpsxHealth
from ..integrations import erp, ats, notifier, sheets
from ..store import runs
from ..security.hmac import verify
from ..utils.attestation import compute_attestation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents/opsx", tags=["opsx"])

@router.post("/execute")
async def execute_opsx(
    bundle: Dict[str, Any],
    x_signature: str = Header(..., alias="X-Signature")
):
    """
    Execute Operations Efficiency Agent bundle
    """
    try:
        # Verify HMAC signature
        if not verify(bundle, x_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        run_id = bundle.get("run_id", f"opsx-{uuid.uuid4()}")
        topic = bundle.get("topic", "Unknown operation")
        actions = bundle.get("actions", [])
        
        logger.info(f"Executing Ops Efficiency Agent bundle: {run_id} - {topic}")
        
        # Create run record
        run_record = await runs.create_start(
            run_id=run_id,
            module="opsx",
            bundle=bundle
        )
        
        artifacts = {}
        executed_actions = []
        
        # Execute each action
        for action in actions:
            action_type = action.get("type")
            payload = action.get("payload", {})
            
            try:
                if action_type == "invoice.approve":
                    result = await erp.invoice_approve(payload)
                    artifacts.setdefault("invoice", []).append({
                        "action": "approve",
                        "invoice_id": result,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif action_type == "invoice.hold":
                    result = await erp.invoice_hold(payload)
                    artifacts.setdefault("invoice", []).append({
                        "action": "hold",
                        "invoice_id": result,
                        "reason": payload.get("reason", "Manual review"),
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif action_type == "cost.allocate":
                    result = await erp.post_allocation(payload)
                    artifacts.setdefault("allocation", []).append({
                        "allocation_id": result,
                        "document_id": payload.get("docId"),
                        "lines": payload.get("lines", []),
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif action_type == "ats.rank":
                    result = await ats.rank_candidates(payload)
                    artifacts["ats"] = {
                        "job_id": payload.get("jobId"),
                        "candidates": result,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                elif action_type == "notify.slack":
                    result = await notifier.slack_notification(payload)
                    artifacts.setdefault("notifications", []).append({
                        "type": "slack",
                        "channel": payload.get("channel"),
                        "message_id": result,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif action_type == "notify.email":
                    result = await notifier.email_notification(payload)
                    artifacts.setdefault("notifications", []).append({
                        "type": "email",
                        "recipients": payload.get("to", []),
                        "message_id": result,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif action_type == "sheets.appendRow":
                    result = await sheets.append_row(payload)
                    artifacts.setdefault("sheets", []).append({
                        "operation": "append",
                        "range": payload.get("range"),
                        "updated_range": result,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                else:
                    logger.warning(f"Unknown action type: {action_type}")
                    continue
                
                executed_actions.append({
                    "type": action_type,
                    "payload": payload,
                    "result": result,
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"Failed to execute action {action_type}: {e}")
                executed_actions.append({
                    "type": action_type,
                    "payload": payload,
                    "error": str(e),
                    "status": "failed"
                })
        
        # Compute attestation hash
        attestation_hash = compute_attestation(bundle, artifacts)
        
        # Update run record with results
        await runs.finish_success(
            run_id=run_record["_id"],
            artifacts=artifacts,
            attestation_hash=attestation_hash
        )
        
        logger.info(f"Ops Efficiency Agent bundle completed: {run_id}")
        
        return JSONResponse(content={
            "ok": True,
            "run_id": run_id,
            "topic": topic,
            "executed_actions": len(executed_actions),
            "artifacts": artifacts,
            "attestation_hash": attestation_hash,
            "timestamp": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ops Efficiency Agent execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@router.get("/stats")
async def get_opsx_stats():
    """
    Get Operations Efficiency Agent statistics
    """
    try:
        # Get recent runs
        recent_runs = await runs.get_recent_runs(module="opsx", limit=100)
        
        stats = {
            "total_runs": len(recent_runs),
            "successful_runs": len([r for r in recent_runs if r.get("status") == "SUCCESS"]),
            "failed_runs": len([r for r in recent_runs if r.get("status") == "FAILED"]),
            "total_invoices": 0,
            "auto_approved": 0,
            "manual_hold": 0,
            "total_allocations": 0,
            "posted_allocations": 0,
            "total_candidates": 0,
            "ranked_candidates": 0,
            "avg_confidence": 0.0
        }
        
        # Analyze artifacts
        for run in recent_runs:
            artifacts = run.get("artifacts", {})
            
            # Count invoices
            invoices = artifacts.get("invoice", [])
            stats["total_invoices"] += len(invoices)
            stats["auto_approved"] += len([i for i in invoices if i.get("action") == "approve"])
            stats["manual_hold"] += len([i for i in invoices if i.get("action") == "hold"])
            
            # Count allocations
            allocations = artifacts.get("allocation", [])
            stats["total_allocations"] += len(allocations)
            stats["posted_allocations"] += len(allocations)
            
            # Count candidates
            ats_data = artifacts.get("ats", {})
            candidates = ats_data.get("candidates", [])
            stats["total_candidates"] += len(candidates)
            stats["ranked_candidates"] += len(candidates)
        
        return OpsxStats(**stats)
        
    except Exception as e:
        logger.error(f"Failed to get Ops Efficiency stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_opsx_health():
    """
    Get Operations Efficiency Agent health status
    """
    try:
        # Check integrations
        erp_health = await erp.health_check()
        ats_health = await ats.health_check()
        notifier_health = await notifier.health_check()
        sheets_health = await sheets.health_check()
        
        # Get last run
        recent_runs = await runs.get_recent_runs(module="opsx", limit=1)
        last_run = recent_runs[0].get("created_at") if recent_runs else None
        
        # Determine overall status
        all_healthy = erp_health and ats_health and notifier_health["slack"] and sheets_health
        status = "healthy" if all_healthy else "degraded"
        
        errors = []
        if not erp_health:
            errors.append("ERP system unavailable")
        if not ats_health:
            errors.append("ATS system unavailable")
        if not notifier_health["slack"]:
            errors.append("Slack notifications unavailable")
        if not sheets_health:
            errors.append("Google Sheets unavailable")
        
        return OpsxHealth(
            status=status,
            erp_connected=erp_health,
            ats_connected=ats_health,
            slack_connected=notifier_health["slack"],
            sheets_connected=sheets_health,
            last_run=last_run,
            errors=errors
        )
        
    except Exception as e:
        logger.error(f"Failed to get Ops Efficiency health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback")
async def opsx_callback(callback_data: Dict[str, Any]):
    """
    Handle callback from external systems
    """
    try:
        run_id = callback_data.get("run_id")
        status = callback_data.get("status", "UNKNOWN")
        artifacts = callback_data.get("artifacts", {})
        
        logger.info(f"Received callback for run {run_id}: {status}")
        
        # Update run status
        if status == "SUCCESS":
            await runs.finish_success(run_id, artifacts)
        elif status == "FAILED":
            error_message = callback_data.get("error", "Unknown error")
            await runs.finish_error(run_id, error_message)
        
        return {"ok": True, "run_id": run_id, "status": status}
        
    except Exception as e:
        logger.error(f"Failed to handle Ops Efficiency callback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs")
async def get_opsx_runs(limit: int = 20):
    """
    Get recent Operations Efficiency Agent runs
    """
    try:
        runs_data = await runs.get_recent_runs(module="opsx", limit=limit)
        return {"runs": runs_data}
        
    except Exception as e:
        logger.error(f"Failed to get Ops Efficiency runs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
async def test_opsx():
    """
    Test Operations Efficiency Agent with sample data
    """
    try:
        test_bundle = {
            "run_id": f"opsx-test-{uuid.uuid4()}",
            "topic": "Test Operations Efficiency Agent",
            "summary_md": "Testing Ops Efficiency Agent functionality",
            "actions": [
                {
                    "type": "notify.slack",
                    "payload": {
                        "channel": "#general",
                        "text": "Ops Efficiency Agent test completed successfully"
                    }
                }
            ],
            "callback_url": "http://localhost:8000/api/agent-runs/callback"
        }
        
        # Execute test bundle
        result = await execute_opsx(test_bundle, "test-signature")
        
        return {
            "ok": True,
            "message": "Ops Efficiency Agent test completed",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Ops Efficiency Agent test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
