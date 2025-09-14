from fastapi import APIRouter, HTTPException
from .models import CaseIntake, DiagnosisReport
from .service import diagnose_case, get_therapy_patches
from typing import Dict

router = APIRouter(prefix="/api/clinic", tags=["robomind-clinic"])

@router.post("/diagnose", response_model=DiagnosisReport)
async def post_diagnose(payload: CaseIntake):
    """Diagnose a case for Psychopathia Machinalis syndromes"""
    if not payload.turns:
        raise HTTPException(400, "turns are required")
    
    try:
        return await diagnose_case(payload)
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
