from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import httpx, os, time, hmac, hashlib, json

router = APIRouter(prefix="/api/productivity", tags=["productivity"])

OUTSYSTEMS_ENDPOINT = os.getenv("OUTSYSTEMS_PRODUCTIVITY_URL")
HMAC_SECRET = os.getenv("AGENTOPS_HMAC_SECRET", "change-me")

def sign(b: bytes) -> str:
    import hashlib, hmac
    return hmac.new(HMAC_SECRET.encode(), b, hashlib.sha256).hexdigest()

class NextAction(BaseModel):
    title: str
    detail: Optional[str] = ""
    assignee: Optional[str] = None

class ProductivitySpec(BaseModel):
    brief_title: str
    primary_url: Optional[str] = None
    summary_md: str
    next_actions: List[NextAction] = []
    actions: List[Dict[str, Any]]  # same shape as in compliance
    metadata: Dict[str, Any] = {}

@router.post("/dispatch")
async def dispatch(spec: ProductivitySpec):
    if not OUTSYSTEMS_ENDPOINT:
        raise HTTPException(500, "OUTSYSTEMS_PRODUCTIVITY_URL not configured")

    run_id = f"prod-{int(time.time())}"
    bundle = {
        "run_id": run_id,
        "topic": f"[Productivity] {spec.brief_title}",
        "summary_md": spec.summary_md,
        "next_actions": [na.dict() for na in spec.next_actions],
        "primary_url": spec.primary_url,
        "actions": spec.actions,
        "callback_url": os.getenv("OUTSYSTEMS_CALLBACK_URL", "http://localhost:8000/api/agent-runs/callback")
    }
    body = json.dumps(bundle).encode()
    headers = {"X-Signature": sign(body), "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OUTSYSTEMS_ENDPOINT, content=body, headers=headers)
    if r.status_code >= 300:
        raise HTTPException(r.status_code, f"OutSystems error: {r.text}")
    return {"ok": True, "run_id": run_id}
