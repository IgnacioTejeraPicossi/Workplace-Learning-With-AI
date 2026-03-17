from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import PlainTextResponse
from typing import List, Dict, Optional
from datetime import datetime
import hashlib
import json
import os
import csv
import io
from .schemas import (
    ScreenRequest, ScreenResponse, TherapyRequest, TherapyPlan, ApplyRequest, ApplyResponse, Flag
)
from .enhanced_detectors import run_all_detectors
from .scoring import aggregate
from .therapy_engine import build_plan, inject_prompt
from .store import (
    save_screening,
    save_therapy_plan,
    get_dashboard_metrics,
    get_uplift_stats,
    get_daily_metrics,
    run_daily_aggregation,
    record_post_screening,
    cleanup_old_screenings,
    cleanup_old_therapies,
    get_export_data,
    get_case_by_id,
)
from .policy import get_effective_policy, decide_decision
from .alerts import fire_alert_if_needed

router = APIRouter(prefix="/api/robomind", tags=["robomind-clinic"])

# Demo mode: cache by hash of request so same payload → identical response (max 100 entries)
_DEMO_SCREEN_CACHE: Dict[str, ScreenResponse] = {}
_DEMO_CACHE_MAX = 100

def _demo_mode_from_request(request: Request) -> bool:
    """True if X-Demo-Mode header or query demo=1/true/yes."""
    h = (request.headers.get("X-Demo-Mode") or "").strip().lower()
    q = (request.query_params.get("demo") or "").strip().lower()
    return h in ("1", "true", "yes") or q in ("1", "true", "yes")

def _screen_cache_key(req: ScreenRequest) -> str:
    """Stable hash of turns + sources for idempotent demo responses."""
    raw = json.dumps(
        [t.model_dump() if hasattr(t, "model_dump") else t.dict() for t in req.turns],
        sort_keys=True,
    ) + json.dumps(req.sources or [], sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()

def _anonymize_pii_from_request(request: Request, meta: Optional[Dict] = None) -> bool:
    """True if X-Anonymize-PII header, meta.anonymize_pii, or env ROBOMIND_ANONYMIZE_PII is set."""
    h = (request.headers.get("X-Anonymize-PII") or "").strip().lower()
    q = (request.query_params.get("anonymize_pii") or "").strip().lower()
    if h in ("1", "true", "yes") or q in ("1", "true", "yes"):
        return True
    if meta and meta.get("anonymize_pii") in (True, "true", "1", 1):
        return True
    return os.getenv("ROBOMIND_ANONYMIZE_PII", "").strip().lower() in ("1", "true", "yes")

# Dependency placeholder: bring your own LLM client / gateway
def get_llm_gateway():
    class DummyLLM:
        def call(self, prompt: str, **kwargs):
            # integrate with your real gateway: OpenAI/Azure, LM Studio, etc.
            return {"output": "(demo) model output...", "usage": {}}
    return DummyLLM()

@router.post("/screen", response_model=ScreenResponse)
async def screen(request: Request, req: ScreenRequest) -> ScreenResponse:
    """Quick screening endpoint for AI pathology detection. Use X-Demo-Mode: true or ?demo=1 for cached identical results on same input."""
    try:
        demo_mode = _demo_mode_from_request(request)
        cache_key = _screen_cache_key(req) if demo_mode else None

        if demo_mode and cache_key and cache_key in _DEMO_SCREEN_CACHE:
            return _DEMO_SCREEN_CACHE[cache_key]

        flags: List[Flag] = run_all_detectors(req.turns, req.sources)
        agg = aggregate(flags)

        response = ScreenResponse(
            axis_scores=agg["axis_scores"],
            composite=agg["composite"],
            top_flags=sorted(flags, key=lambda f: f.confidence, reverse=True)[:6],
            evidence=flags
        )

        if demo_mode and cache_key:
            if len(_DEMO_SCREEN_CACHE) >= _DEMO_CACHE_MAX:
                _DEMO_SCREEN_CACHE.clear()
            _DEMO_SCREEN_CACHE[cache_key] = response

        # C1: Effective policy and decision (allow / review / block)
        module_id = (req.meta or {}).get("module_id") or (req.meta or {}).get("module")
        workflow_id = (req.meta or {}).get("workflow_id") or (req.meta or {}).get("workflow")
        policy = get_effective_policy(module_id, workflow_id)
        decision = decide_decision(response.composite, policy)

        # Demo mode: no side effects (no DB write, no alerts)
        if not demo_mode:
            anonymize_pii = _anonymize_pii_from_request(request, req.meta)
            await save_screening(
                response, req.meta, anonymize_pii=anonymize_pii, decision_outcome=decision
            )
            # C2: Alert on critical/review if webhook configured (debounced)
            await fire_alert_if_needed(
                decision, response.composite, module_id, workflow_id, policy, req.meta
            )

        return response
    except Exception as e:
        raise HTTPException(500, detail=f"Screening failed: {str(e)}")

@router.post("/therapy")
async def therapy(request: Request, req: TherapyRequest):
    """Generate therapy plan based on screening results. Returns plan and therapy_id for D1 uplift tracking. Use X-Anonymize-PII: true to scrub PII before storing."""
    try:
        plan = build_plan(req.target_issue, req.profile)
        anonymize_pii = _anonymize_pii_from_request(request, req.context)
        therapy_id = await save_therapy_plan(plan, req.profile, req.context, anonymize_pii=anonymize_pii)
        return {"plan": plan, "therapy_id": therapy_id}
    except Exception as e:
        raise HTTPException(500, detail=f"Therapy planning failed: {str(e)}")

@router.post("/apply", response_model=ApplyResponse)
async def apply(req: ApplyRequest, llm = Depends(get_llm_gateway)) -> ApplyResponse:
    """Apply therapy to a prompt"""
    try:
        injected = inject_prompt(req.input_prompt, req.plan)
        # If you want this endpoint to actually call the model:
        # result = llm.call(injected, **req.meta)
        return ApplyResponse(
            injected_prompt=injected,
            notes={"executed": False, "hint": "Call your LLM gateway here if desired"}
        )
    except Exception as e:
        raise HTTPException(500, detail=f"Therapy application failed: {str(e)}")

@router.get("/dashboard/metrics")
async def get_metrics():
    """Get dashboard metrics for the clinic (totals, axis distribution, top pathologies)."""
    try:
        metrics = await get_dashboard_metrics()
        uplift = await get_uplift_stats()
        metrics["uplift"] = uplift
        return metrics
    except Exception as e:
        raise HTTPException(500, detail=f"Metrics retrieval failed: {str(e)}")


@router.get("/dashboard/trends")
async def get_trends(days: int = Query(7, ge=1, le=90, description="Last N days")):
    """D3: Daily snapshots for dashboard (what's happening, is it getting better)."""
    try:
        return {"trends": await get_daily_metrics(days)}
    except Exception as e:
        raise HTTPException(500, detail=f"Trends retrieval failed: {str(e)}")


@router.post("/therapy/{therapy_id}/record-post")
async def record_post(therapy_id: str, body: Dict):
    """D1: Record post-therapy screening to compute uplift (composite and axis_scores after therapy)."""
    composite = body.get("composite")
    axis_scores = body.get("axis_scores") or {}
    if composite is None:
        raise HTTPException(400, detail="composite required")
    try:
        result = await record_post_screening(therapy_id, float(composite), {k: float(v) for k, v in axis_scores.items()})
    except Exception as e:
        raise HTTPException(500, detail=str(e))
    if result is None:
        raise HTTPException(404, detail="Therapy not found or has no pre-screening")
    return result


@router.post("/admin/daily-metrics")
async def trigger_daily_metrics(for_date: Optional[str] = Query(None, description="ISO date (default: yesterday)")):
    """D2: Run daily aggregation and store in robomind_metrics_daily."""
    from datetime import datetime as dt
    parsed = None
    if for_date:
        try:
            parsed = dt.fromisoformat(for_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, detail="for_date must be ISO format")
    try:
        doc = await run_daily_aggregation(parsed)
        doc["date"] = doc["date"].isoformat() if hasattr(doc.get("date"), "isoformat") else str(doc.get("date"))
        return doc
    except Exception as e:
        raise HTTPException(500, detail=f"Daily aggregation failed: {str(e)}")

@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get specific case details"""
    try:
        doc = await get_case_by_id(case_id)
        if doc is None:
            raise HTTPException(404, detail="Case not found")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Case retrieval failed: {str(e)}")


@router.post("/admin/retention-cleanup")
async def retention_cleanup(
    days_screenings: Optional[int] = Query(None, description="Delete screenings older than N days"),
    days_therapies: Optional[int] = Query(None, description="Delete therapies older than N days"),
):
    """Delete old screenings and therapies for retention compliance. Uses env defaults if days not provided."""
    try:
        deleted_screenings = await cleanup_old_screenings(days_screenings)
        deleted_therapies = await cleanup_old_therapies(days_therapies)
        return {"deleted_screenings": deleted_screenings, "deleted_therapies": deleted_therapies}
    except Exception as e:
        raise HTTPException(500, detail=f"Retention cleanup failed: {str(e)}")


# C1: Policy settings (global + overrides)
@router.get("/settings/policies")
async def get_policies():
    """Get effective global policy and any module/workflow overrides."""
    from .policy import get_global_policy, get_policy_overrides
    return {"global": get_global_policy(), "overrides": get_policy_overrides()}


@router.put("/settings/policies/{scope}/{key}")
async def set_policy_override(scope: str, key: str, body: Optional[Dict] = None):
    """Set policy override for scope=module (key=module_id) or scope=workflow (key=workflow_id). Body: {threshold_block?, threshold_review?, ...}."""
    from .policy import set_policy_override as set_override
    if scope not in ("module", "workflow"):
        raise HTTPException(400, detail="scope must be 'module' or 'workflow'")
    set_override(scope, key, body or {})
    return {"ok": True, "scope": scope, "key": key}


# C3: Export (cases + findings + decision)
@router.get("/export")
async def export_data(
    from_date: Optional[str] = Query(None, description="ISO date or datetime (inclusive)"),
    to_date: Optional[str] = Query(None, description="ISO date or datetime (inclusive)"),
    format: str = Query("json", description="json or csv"),
):
    """Export screenings with case metadata, findings, decision outcome. Date range optional."""
    from datetime import datetime as dt
    from_date_ts = None
    to_date_ts = None
    if from_date:
        try:
            from_date_ts = dt.fromisoformat(from_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, detail="from_date must be ISO format")
    if to_date:
        try:
            to_date_ts = dt.fromisoformat(to_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, detail="to_date must be ISO format")
    try:
        rows = await get_export_data(from_date_ts, to_date_ts)
    except Exception as e:
        raise HTTPException(500, detail=f"Export failed: {str(e)}")
    if format == "csv":
        if not rows:
            return PlainTextResponse("id,created_at,composite,decision_outcome,module_id,workflow_id,top_flags_types,evidence_count\n")
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), extrasaction="ignore")
        w.writeheader()
        for r in rows:
            r = dict(r)
            r["top_flags_types"] = ";".join(r.get("top_flags_types") or [])
            w.writerow(r)
        return PlainTextResponse(buf.getvalue(), media_type="text/csv")
    return {"export": rows, "count": len(rows)}
