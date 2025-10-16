from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import httpx, os, time, hmac, hashlib, json
from backend.utils.attestation import compute_bundle_hash

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

OUTSYSTEMS_ENDPOINT = os.getenv("OUTSYSTEMS_COMPLIANCE_URL")  # e.g. https://.../agents/compliance/execute
HMAC_SECRET = os.getenv("AGENTOPS_HMAC_SECRET", "change-me")

# Fallback to n8n webhook when OutSystems URL is not configured
if not OUTSYSTEMS_ENDPOINT:
    n8n_url = os.getenv("N8N_COMPLIANCE_WEBHOOK", "http://localhost:5678/webhook/compliance-agent")
    OUTSYSTEMS_ENDPOINT = n8n_url
    print(
        f"[ComplianceAgent] OUTSYSTEMS_COMPLIANCE_URL not set. Falling back to n8n webhook: {n8n_url}"
    )

def sign(body: bytes) -> str:
    return hmac.new(HMAC_SECRET.encode(), body, hashlib.sha256).hexdigest()

class Action(BaseModel):
    type: str  # "jira.createIssue" | "slack.postMessage" | "sheets.appendRow"
    payload: Dict[str, Any]

class ComplianceSpec(BaseModel):
    doc_title: str
    doc_url: Optional[str] = None
    summary_md: str
    key_risks: List[str] = []
    due: Optional[str] = None
    actions: List[Action]
    metadata: Dict[str, Any] = {}

@router.post("/dispatch")
async def dispatch(spec: ComplianceSpec):
    if not OUTSYSTEMS_ENDPOINT:
        raise HTTPException(500, "OUTSYSTEMS_COMPLIANCE_URL not configured")

    run_id = f"comp-{int(time.time())}"
    
    bundle = {
        "run_id": run_id,
        "topic": f"[Compliance] {spec.doc_title}",
        "summary_md": spec.summary_md,
        "key_risks": spec.key_risks,
        "doc_url": spec.doc_url,
        "due": spec.due,
        "actions": [a.dict() for a in spec.actions],
        "callback_url": os.getenv("OUTSYSTEMS_CALLBACK_URL", "http://localhost:8000/api/agent-runs/callback")
    }
    
    # Compute bundle hash for attestation
    bundle_hash = compute_bundle_hash(bundle)
    
    # Create initial run record in database with bundle hash
    from backend.models.agent_runs import AgentRun, save_run
    initial_run = AgentRun(
        run_id=run_id,
        module="compliance",
        topic=f"[Compliance] {spec.doc_title}",
        status="RUNNING",
        bundle_hash=bundle_hash
    )
    await save_run(initial_run)
    
    body = json.dumps(bundle).encode()
    headers = {"X-Signature": sign(body), "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OUTSYSTEMS_ENDPOINT, content=body, headers=headers)
    if r.status_code >= 300:
        # Update status to FAILED if OutSystems call fails
        from backend.models.agent_runs import update_run
        await update_run(run_id, status="FAILED", error=f"OutSystems error: {r.text}")
        raise HTTPException(r.status_code, f"OutSystems error: {r.text}")
    return {"ok": True, "run_id": run_id, "bundle_hash": bundle_hash}
