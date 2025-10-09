"""
Telco Ops Decisioning Agent Router
Handles action bundle execution with HMAC verification
"""

from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Dict, Any
import httpx
import os
from ..models.telco_ops import ActionBundle, AgentCallback
from ..security.hmac import sign, verify
from ..store.runs import create_start, finish_success, finish_error
from ..attestation.hash import compute_attestation
from ..integrations import tmf622, tmf679, appoint, comms, crm

router = APIRouter(prefix="/agents/ops", tags=["telco-ops"])

@router.post("/execute")
async def execute_action_bundle(
    bundle: ActionBundle, 
    x_signature: str = Header(..., alias="X-Signature")
):
    """
    Execute a telco operations action bundle with HMAC verification
    """
    # Verify HMAC signature
    if not verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Create initial run record
    run_id = bundle.run_id
    run_data = {
        "run_id": run_id,
        "module": "ops",
        "status": "RUNNING",
        "bundle": bundle.dict(),
        "started_at": None,
        "ended_at": None,
        "artifacts": {},
        "attestation_hash": None,
        "error": None
    }
    
    try:
        # Create run in database
        run_record = await create_start(run_id, "ops", bundle.dict())
        
        artifacts = {}
        
        # Execute each action in the bundle
        for action in bundle.actions:
            try:
                if action.type == "tmf622.order.create":
                    result = await tmf622.create_order(action.payload)
                    artifacts.setdefault("orders", []).append(result)
                    
                elif action.type == "tmf622.order.change":
                    result = await tmf622.change_order(action.payload)
                    artifacts.setdefault("orders", []).append(result)
                    
                elif action.type == "subscription.change":
                    result = await tmf622.change_subscription(action.payload)
                    artifacts.setdefault("subscriptions", []).append(result)
                    
                elif action.type == "appointment.schedule":
                    result = await appoint.schedule(action.payload)
                    artifacts.setdefault("appointments", []).append(result)
                    
                elif action.type == "comm.send":
                    result = await comms.send(action.payload)
                    artifacts.setdefault("communications", []).append(result)
                    
                elif action.type == "crm.case.create":
                    result = await crm.create_case(action.payload)
                    artifacts.setdefault("cases", []).append(result)
                    
            except Exception as e:
                print(f"Error executing action {action.type}: {str(e)}")
                artifacts.setdefault("errors", []).append({
                    "action_type": action.type,
                    "error": str(e)
                })
        
        # Compute attestation hash
        attestation_hash = compute_attestation(bundle.dict(), artifacts)
        
        # Update run with success
        await finish_success(
            run_record["_id"], 
            artifacts, 
            attestation_hash
        )
        
        return {
            "ok": True,
            "run_id": run_id,
            "artifacts": artifacts,
            "attestation_hash": attestation_hash
        }
        
    except Exception as e:
        # Update run with error
        await finish_error(run_record["_id"], str(e))
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the Telco Ops Agent"""
    return {
        "status": "healthy",
        "module": "ops",
        "version": "1.0.0",
        "capabilities": [
            "tmf622.order.create",
            "tmf622.order.change", 
            "subscription.change",
            "appointment.schedule",
            "comm.send",
            "crm.case.create"
        ]
    }

@router.post("/test")
async def test_execution():
    """Test endpoint for development"""
    import uuid
    
    run_id = f"ops-test-{uuid.uuid4()}"
    test_bundle = ActionBundle(
        run_id=run_id,
        customer_id="TELIA-123",
        topic="Test Order Creation",
        summary_md="Testing telco ops agent functionality",
        recommendations=[],
        actions=[
            {
                "type": "tmf622.order.create",
                "payload": {
                    "externalId": run_id,
                    "customerId": "TELIA-123",
                    "offeringId": "5G-UNLTD"
                }
            },
            {
                "type": "comm.send",
                "payload": {
                    "channel": "email",
                    "to": "test@example.com",
                    "subject": "Test Order",
                    "html": "<p>This is a test order.</p>"
                }
            }
        ],
        callback_url="http://localhost:8000/api/agent-runs/callback"
    )
    
    # Sign the bundle
    signature = sign(test_bundle.dict())
    
    # Execute with signature
    return await execute_action_bundle(test_bundle, signature)

@router.get("/recommendations")
async def get_recommendations():
    """Get pending recommendations"""
    # TODO: Implement recommendation fetching from database
    return {
        "recommendations": [
            {
                "customer_id": "TELIA-123",
                "title": "Upgrade to 5G Unlimited",
                "reason": "High usage detected, eligible for upgrade",
                "offering_id": "5G-UNLTD",
                "price_impact": 8.0,
                "expected_value": 15.0,
                "confidence": 0.85,
                "mode": "one_click"
            }
        ]
    }

@router.post("/recommendations/{recommendation_id}/approve")
async def approve_recommendation(recommendation_id: str):
    """Approve and dispatch a recommendation"""
    # TODO: Implement recommendation approval logic
    return {"status": "approved", "recommendation_id": recommendation_id}
