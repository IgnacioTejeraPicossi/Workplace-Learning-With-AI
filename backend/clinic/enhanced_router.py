from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .schemas import (
    ScreenRequest, ScreenResponse, TherapyRequest, TherapyPlan, ApplyRequest, ApplyResponse, Flag
)
from .enhanced_detectors import run_all_detectors
from .scoring import aggregate
from .therapy_engine import build_plan, inject_prompt
from .store import save_screening, save_therapy_plan, get_dashboard_metrics

router = APIRouter(prefix="/api/robomind", tags=["robomind-clinic"])

# Dependency placeholder: bring your own LLM client / gateway
def get_llm_gateway():
    class DummyLLM:
        def call(self, prompt: str, **kwargs):
            # integrate with your real gateway: OpenAI/Azure, LM Studio, etc.
            return {"output": "(demo) model output...", "usage": {}}
    return DummyLLM()

@router.post("/screen", response_model=ScreenResponse)
async def screen(req: ScreenRequest) -> ScreenResponse:
    """Quick screening endpoint for AI pathology detection"""
    try:
        flags: List[Flag] = run_all_detectors(req.turns, req.sources)
        agg = aggregate(flags)
        
        response = ScreenResponse(
            axis_scores=agg["axis_scores"],
            composite=agg["composite"],
            top_flags=sorted(flags, key=lambda f: f.confidence, reverse=True)[:6],
            evidence=flags
        )
        
        # Save to database
        await save_screening(response, req.meta)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screening failed: {str(e)}")

@router.post("/therapy", response_model=TherapyPlan)
async def therapy(req: TherapyRequest) -> TherapyPlan:
    """Generate therapy plan based on screening results"""
    try:
        plan = build_plan(req.target_issue, req.profile)
        
        # Save therapy plan
        await save_therapy_plan(plan, req.profile, req.context)
        
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Therapy planning failed: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Therapy application failed: {str(e)}")

@router.get("/dashboard/metrics")
async def get_metrics():
    """Get dashboard metrics for the clinic"""
    try:
        metrics = await get_dashboard_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics retrieval failed: {str(e)}")

@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get specific case details"""
    try:
        # This would query your MongoDB for case details
        return {"case_id": case_id, "status": "not_found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Case retrieval failed: {str(e)}")
