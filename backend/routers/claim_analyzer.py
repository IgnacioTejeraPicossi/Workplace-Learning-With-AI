"""
Claim Analyzer — Router
========================
REST API for the Self-Simulating Reality Agent V2 Claim Analyzer.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict

try:
    from backend.services.claim_analyzer import analyze_claim, health
except ImportError:  # pragma: no cover
    from services.claim_analyzer import analyze_claim, health  # type: ignore

router = APIRouter(prefix="/api/claim-analyzer")


class AnalyzeRequest(BaseModel):
    claim: str = Field(..., min_length=1, max_length=4000,
                       description="The strong claim to analyze")
    lang: str = Field("en", pattern=r"^(en|es|no)$")


@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.post("/analyze", summary="Analyze a strong claim — core, overreach, reformulation")
async def analyze_endpoint(body: AnalyzeRequest) -> Dict[str, Any]:
    return await analyze_claim(body.claim, body.lang)
