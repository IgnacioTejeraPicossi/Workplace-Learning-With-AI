"""
Personal Attention Agent Router
Handles attention action bundle execution
"""

from fastapi import APIRouter, Header, HTTPException
from backend.models.attention import AttentionActionBundle
from backend.security.hmac import verify, sign
from backend.store.runs import create_start, finish_success, finish_error
from backend.attestation.hash import compute_attestation
from backend.integrations.slack import post_message
from backend.integrations.teams import send_card
from backend.integrations.calendar import create_event
from backend.integrations.mailer import send_digest
import httpx
import uuid

router = APIRouter(prefix="/agents/attention", tags=["Personal Attention Agent"])

@router.post("/execute")
async def execute_attention_bundle(
    bundle: AttentionActionBundle, 
    x_signature: str = Header(..., alias="X-Signature")
):
    """Execute attention action bundle with HMAC verification"""
    if not verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Create initial run record
    run = await create_start(
        bundle.run_id, 
        module="attention", 
        bundle=bundle.dict()
    )
    
    artifacts = {}
    
    try:
        # Execute each action
        for action in bundle.actions:
            if action.type == "slack.postMessage":
                artifacts["slack"] = await post_message(action.payload)
            elif action.type == "teams.sendCard":
                artifacts["teams"] = await send_card(action.payload)
            elif action.type == "calendar.createEvent":
                artifacts["calendar"] = await create_event(action.payload)
            elif action.type == "email.sendDigest":
                artifacts["email"] = await send_digest(action.payload)
        
        # Compute attestation hash
        attestation_hash = compute_attestation(bundle.dict(), artifacts)
        
        # Mark as successful
        await finish_success(run["_id"], artifacts, attestation_hash)
        
        return {
            "ok": True, 
            "run_id": bundle.run_id, 
            "artifacts": artifacts, 
            "attestation_hash": attestation_hash
        }
        
    except Exception as e:
        # Mark as failed
        await finish_error(run["_id"], str(e))
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "module": "attention"}

@router.post("/test")
async def test_execution():
    """Test endpoint for manual execution"""
    run_id = f"attn-test-{int(uuid.uuid4().hex[:8], 16)}"
    
    bundle = AttentionActionBundle(
        run_id=run_id,
        topic="Test Alert - Vendor Outage",
        summary_md="This is a test alert for the Personal Attention Agent",
        evidence=[
            {
                "url": "https://status.example.com",
                "source": "Status Page",
                "snippet": "Service degradation detected",
                "published_at": "2025-01-10T10:00:00Z"
            }
        ],
        recommended_actions=[
            {
                "title": "Post status update",
                "detail": "Inform team about the outage",
                "assignee": "oncall@telenor.com",
                "due_date": "2025-01-10T11:00:00Z"
            }
        ],
        actions=[
            {
                "type": "slack.postMessage",
                "payload": {
                    "channel": "#cto-brief",
                    "text": "🚨 Test Alert: Vendor outage detected. Please check status page."
                }
            }
        ],
        callback_url=__import__("backend.config").config.CALLBACK_URL_DEFAULT
    )
    
    # Sign the bundle
    signature = sign(bundle.dict())
    
    # Execute via internal call
    return await execute_attention_bundle(bundle, signature)
