"""
EA Second Brain Agent - Execute endpoint
"""

from fastapi import APIRouter, Header, HTTPException
from backend.models.ea import InsightBundle, AgentCallback
from backend.security import hmac as hmacsec
from backend.store import runs
from backend.attestation.hash import compute_attestation
from backend.integrations import jira, slack, confluence, sheets

router = APIRouter(prefix="/agents/ea", tags=["ea"])

@router.post("/execute")
async def execute(bundle: InsightBundle, x_signature: str = Header(...)):
    """
    Execute an EA insight bundle
    Dispatches actions to Jira, Slack, Confluence, and Google Sheets
    Returns attestation hash for trust receipt
    """
    # Verify HMAC signature
    if not hmacsec.verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Create run in RUNNING state
    run = await runs.create_start(bundle.run_id, module="ea", bundle=bundle.dict())
    
    artifacts = {"errors": []}
    try:
        # Execute actions (tolerant to individual failures)
        for action in bundle.actions:
            try:
                if action.type == "jira.createIssue":
                    artifacts.setdefault("jira", []).append(
                        await jira.create_issue(action.payload)
                    )
                elif action.type == "slack.postMessage":
                    artifacts["slack"] = await slack.post_message(action.payload)
                elif action.type == "confluence.updatePage":
                    artifacts["confluence"] = await confluence.update_page(action.payload)
                elif action.type == "sheets.appendRow":
                    artifacts["sheets"] = await sheets.append_row(action.payload)
            except Exception as action_e:
                # Collect error but continue
                artifacts["errors"].append(f"{action.type} failed: {str(action_e)}")
        
        # Compute attestation hash
        att_hash = compute_attestation(bundle.dict(), artifacts)
        
        # Mark run as DONE
        await runs.finish_success(run["_id"], artifacts, att_hash)
        
        return {
            "ok": True,
            "run_id": bundle.run_id,
            "artifacts": artifacts,
            "attestation_hash": att_hash
        }
    except Exception as e:
        # Final safety: mark error but return graceful payload to preserve CORS headers
        await runs.finish_error(run["_id"], str(e))
        return {
            "ok": False,
            "run_id": bundle.run_id,
            "error": str(e),
            "artifacts": artifacts
        }

@router.get("/runs")
async def get_runs(limit: int = 50):
    """Get recent EA agent runs"""
    return await runs.get_runs(module="ea", limit=limit)

