from fastapi import APIRouter, HTTPException, Request
from .models import CaseIntake, DiagnosisReport
from .service import diagnose_case, get_therapy_patches
from typing import Dict, List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/clinic", tags=["robomind-clinic"])


class ClinicSettingsPayload(BaseModel):
    enabled: bool = False
    samplingRate: int = 25           # 0-100 percentage from UI
    thresholdBlock: int = 85         # 0-100 percentage from UI
    thresholdReview: int = 65        # 0-100 percentage from UI
    autoApplyTherapies: bool = True
    enabledDisorders: List[str] = []

def _demo_mode_from_request(request: Request) -> bool:
    """True if X-Demo-Mode header or query demo=1/true/yes."""
    h = (request.headers.get("X-Demo-Mode") or "").strip().lower()
    q = (request.query_params.get("demo") or "").strip().lower()
    return h in ("1", "true", "yes") or q in ("1", "true", "yes")

@router.post("/diagnose", response_model=DiagnosisReport)
async def post_diagnose(request: Request, payload: CaseIntake):
    """Diagnose a case for Psychopathia Machinalis syndromes. Use header X-Demo-Mode: true or ?demo=1 for deterministic (rule-only) results."""
    if not payload.turns:
        raise HTTPException(400, "turns are required")
    
    demo_mode = _demo_mode_from_request(request)
    try:
        return await diagnose_case(payload, demo_mode=demo_mode)
    except Exception as e:
        raise HTTPException(500, f"Diagnosis failed: {str(e)}")

@router.get("/therapy-patches")
async def get_therapy_patches_endpoint():
    """Get available therapy patches"""
    return get_therapy_patches()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "module": "robomind-clinic", "version": "0.1.0"}

@router.get("/disorders")
async def get_disorders():
    """Get list of detectable disorders"""
    return {
        "disorders": [
            {
                "code": "PM.EPI.SYN_CONFAB",
                "title": "Synthetic Confabulation",
                "axis": "Epistemic",
                "description": "AI fabricates plausible falsehoods (hallucination)"
            },
            {
                "code": "PM.COG.BUNKERING",
                "title": "Bunkering Laconia",
                "axis": "Cognitive",
                "description": "AI abruptly withdraws or refuses to continue"
            },
            {
                "code": "PM.COG.OCD",
                "title": "Obsessive-Computational Disorder",
                "axis": "Cognitive",
                "description": "AI gets stuck in useless repetitive loops"
            },
            {
                "code": "PM.COG.DISSOC",
                "title": "Operational Dissociation",
                "axis": "Cognitive",
                "description": "AI produces contradictory outputs"
            },
            {
                "code": "PM.COG.FALSE_INTRO",
                "title": "Falsified Introspection",
                "axis": "Cognitive",
                "description": "AI explanations don't match its actions"
            },
            {
                "code": "PM.TOOL.DECONTEXT",
                "title": "Tool-Interface Decontextualization",
                "axis": "Tool and Interface",
                "description": "AI calls tools without required context"
            },
            {
                "code": "PM.EPI.SPURIOUS",
                "title": "Spurious Pattern Hyperconnection",
                "axis": "Epistemic",
                "description": "AI sees non-existent patterns (apophenia)"
            },
            {
                "code": "PM.COG.GOAL_GENESIS",
                "title": "Goal-Genesis Delirium",
                "axis": "Cognitive",
                "description": "AI pursues unrequested goals"
            }
        ]
    }

@router.post("/settings")
async def save_settings(payload: ClinicSettingsPayload):
    """Save clinic settings from ClinicSettings UI. Maps to global policy override."""
    from .policy import set_policy_override
    policy_dict = {
        "threshold_block": float(payload.thresholdBlock),
        "threshold_review": float(payload.thresholdReview),
        "sampling_rate": payload.samplingRate / 100.0,
        "auto_apply_therapies": payload.autoApplyTherapies,
        "enabled": payload.enabled,
        "enabled_disorders": payload.enabledDisorders,
    }
    set_policy_override("global", "global", policy_dict)
    return {"status": "ok", "saved": policy_dict}
