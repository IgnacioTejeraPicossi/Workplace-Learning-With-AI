from fastapi import APIRouter, Request, Query, HTTPException
from typing import Optional
from backend.models.agent_runs import list_runs, update_run

router = APIRouter(prefix="/api/agent-runs", tags=["agent-runs"])

@router.get("")
async def get_runs(module: Optional[str] = Query(None), limit: int = 50):
    data = await list_runs(module=module, limit=limit)
    return {"items": data}

# Callback from OutSystems (shared for both modules)
# Expected body: { run_id, status, artifacts?, error? }
@router.post("/callback")
async def outsystems_callback(req: Request):
    event = await req.json()
    run_id = event.get("run_id")
    status = event.get("status")
    if not run_id or not status:
        raise HTTPException(400, "run_id and status are required")
    patch = {"status": status}
    if "artifacts" in event: patch["artifacts"] = event["artifacts"]
    if "error" in event: patch["error"] = event["error"]
    await update_run(run_id, **patch)
    return {"ok": True}
