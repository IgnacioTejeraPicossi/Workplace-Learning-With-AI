from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Dict, Optional
import hashlib
import json
import os
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
    cleanup_old_screenings,
    cleanup_old_therapies,
)

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

        # Save to database (A3: anonymize PII when requested)
        anonymize_pii = _anonymize_pii_from_request(request, req.meta)
        await save_screening(response, req.meta, anonymize_pii=anonymize_pii)

        return response
    except Exception as e:
        raise HTTPException(500, detail=f"Screening failed: {str(e)}")

@router.post("/therapy", response_model=TherapyPlan)
async def therapy(request: Request, req: TherapyRequest) -> TherapyPlan:
    """Generate therapy plan based on screening results. Use X-Anonymize-PII: true to scrub PII before storing."""
    try:
        plan = build_plan(req.target_issue, req.profile)
        anonymize_pii = _anonymize_pii_from_request(request, req.context)
        await save_therapy_plan(plan, req.profile, req.context, anonymize_pii=anonymize_pii)
        return plan
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
    """Get dashboard metrics for the clinic"""
    try:
        metrics = await get_dashboard_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(500, detail=f"Metrics retrieval failed: {str(e)}")

@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get specific case details"""
    try:
        return {"case_id": case_id, "status": "not_found"}
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
