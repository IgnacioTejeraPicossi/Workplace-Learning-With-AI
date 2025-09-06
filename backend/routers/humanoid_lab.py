# Human+Humanoid Lab Router - Completely Independent Module
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Dict, Optional, List, Any
import io, csv, json
from datetime import datetime

# Import services
from backend.services.humanoid import runs_repo
from backend.services.humanoid.schemas import PlanRequest, Twin, TaskSpec

router = APIRouter(prefix="/api/humanoid", tags=["Human+Humanoid Lab"])

# Helper function to build query filters
def _filters_from_query(
    start: Optional[str] = None,
    end: Optional[str] = None,
    min_score: Optional[float] = None,
    safety_ok: Optional[bool] = None,
    task: Optional[str] = None,
    min_time_ratio: Optional[float] = None,
    max_time_ratio: Optional[float] = None,
    only_minor_events: Optional[bool] = None,
) -> Dict:
    return {
        "start": start,
        "end": end,
        "min_score": min_score,
        "safety_ok": safety_ok,
        "task": task,
        "min_time_ratio": min_time_ratio,
        "max_time_ratio": max_time_ratio,
        "only_minor_events": only_minor_events,
    }

# Core Humanoid Lab endpoints
@router.post("/plan")
async def plan(req: PlanRequest):
    """Generate a task plan using AI planner agent"""
    try:
        from backend.services.humanoid.planner_agent import make_plan
        plan_result = await make_plan(req)
        return {"plan": plan_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planning failed: {str(e)}")

@router.post("/simulate")
async def simulate(payload: Dict):
    """Run simulation with the generated plan"""
    try:
        from backend.services.humanoid.simulator import run_sim
        result = await run_sim(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/safety-check")
async def safety_check(payload: Dict):
    """Perform safety evaluation of the plan"""
    try:
        from backend.services.humanoid.safety_agent import evaluate
        report = await evaluate(payload)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Safety check failed: {str(e)}")

@router.post("/judge")
async def judge(payload: Dict):
    """Judge the performance and quality of the run"""
    try:
        from backend.services.humanoid.judge_agent import score
        judge_res = await score(payload)
        
        # Persist full run (lightweight)
        run_doc = {
            "plan": payload.get("plan"),
            "sim": payload.get("sim"),
            "safety": payload.get("safety"),
            "judge": judge_res,
            "created_at": datetime.utcnow()
        }
        run_id = await runs_repo.insert_run(run_doc)
        return {"_id": run_id, **judge_res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Judging failed: {str(e)}")

@router.post("/teleop")
async def teleop(cmd: Dict):
    """Send teleoperation command to humanoid (mock)"""
    try:
        from backend.services.humanoid.humanoid_adapter import send_command
        ok = await send_command(cmd)
        if not ok:
            raise HTTPException(status_code=400, detail="Command rejected")
        return {"status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Teleop failed: {str(e)}")

# Data management endpoints
@router.get("/runs")
async def get_runs(
    limit: int = Query(20, ge=1, le=500),
    start: Optional[str] = None,
    end: Optional[str] = None,
    min_score: Optional[float] = None,
    safety_ok: Optional[bool] = None,
    task: Optional[str] = None,
    min_time_ratio: Optional[float] = None,
    max_time_ratio: Optional[float] = None,
    only_minor_events: Optional[bool] = None,
):
    """Get filtered list of runs"""
    try:
        filters = _filters_from_query(start, end, min_score, safety_ok, task, min_time_ratio, max_time_ratio, only_minor_events)
        items = await runs_repo.list_runs_filtered(filters=filters, limit=limit)
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch runs: {str(e)}")

@router.get("/runs/summary")
async def get_runs_summary(
    start: Optional[str] = None,
    end: Optional[str] = None,
    min_score: Optional[float] = None,
    safety_ok: Optional[bool] = None,
    task: Optional[str] = None,
    min_time_ratio: Optional[float] = None,
    max_time_ratio: Optional[float] = None,
    only_minor_events: Optional[bool] = None,
):
    """Get aggregated summary of runs"""
    try:
        filters = _filters_from_query(start, end, min_score, safety_ok, task, min_time_ratio, max_time_ratio, only_minor_events)
        return await runs_repo.get_summary_filtered(filters=filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")

@router.get("/runs/export")
async def export_runs(
    format: str = Query("csv", pattern="^(csv|json)$"),
    limit: int = Query(100, ge=1, le=5000),
    start: Optional[str] = None,
    end: Optional[str] = None,
    min_score: Optional[float] = None,
    safety_ok: Optional[bool] = None,
    task: Optional[str] = None,
    min_time_ratio: Optional[float] = None,
    max_time_ratio: Optional[float] = None,
    only_minor_events: Optional[bool] = None,
):
    """Export runs as CSV or JSON"""
    try:
        filters = _filters_from_query(start, end, min_score, safety_ok, task, min_time_ratio, max_time_ratio, only_minor_events)
        items = await runs_repo.list_runs_filtered(filters=filters, limit=limit)

        if format.lower() == "json":
            data = json.dumps(items, default=str).encode("utf-8")
            return StreamingResponse(
                io.BytesIO(data),
                media_type="application/json",
                headers={"Content-Disposition": 'attachment; filename="humanoid_runs.json"'}
            )

        # CSV export
        buf = io.StringIO()
        writer = csv.DictWriter(
            buf,
            fieldnames=[
                "_id", "created_at", "task_name",
                "plan_est_total_seconds", "sim_total_seconds",
                "safety_ok", "judge_score",
                "minor_events", "time_ratio"
            ],
            extrasaction="ignore"
        )
        writer.writeheader()
        for r in items:
            writer.writerow({
                "_id": r.get("_id"),
                "created_at": r.get("created_at"),
                "task_name": r.get("plan", {}).get("task_name"),
                "plan_est_total_seconds": r.get("plan", {}).get("est_total_seconds"),
                "sim_total_seconds": r.get("sim", {}).get("sim_total_seconds"),
                "safety_ok": r.get("safety", {}).get("ok"),
                "judge_score": r.get("judge", {}).get("score"),
                "minor_events": r.get("sim", {}).get("kpis", {}).get("minor_events", 0),
                "time_ratio": r.get("time_ratio"),
            })
        return StreamingResponse(
            io.BytesIO(buf.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="humanoid_runs.csv"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for Humanoid Lab module"""
    return {"status": "healthy", "module": "Human+Humanoid Lab", "version": "1.0.0"}
