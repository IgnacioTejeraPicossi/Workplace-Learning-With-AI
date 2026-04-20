"""AI enrichment endpoints for the AGI Progress Hub.

Three POST endpoints, one per Hub tab. Each accepts the CURRENT panel data
sent from the frontend and returns a list of non-destructive suggestions
enriched with live web results. Nothing is persisted here — the Tracker
frontend applies suggestions through the existing POST /api/agi/progress
endpoint; Endings and Benefits suggestions are session-only by design.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.services.agi_ai_enrich_service import (
    enrich_benefits,
    enrich_endings,
    enrich_tracker,
)

router = APIRouter(prefix="/api/agi/ai-enrich", tags=["AGI AI Enrich"])


# ---------------------------------------------------------------------------
# Request / response models (kept permissive with Dict[str, Any] because the
# frontend sends already-typed current state and we don't want to re-validate
# Hendrycks domain scores here — the service layer cares about shape.)
# ---------------------------------------------------------------------------

class TrackerEnrichRequest(BaseModel):
    current_models: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Existing AGIItem rows as currently displayed in the tracker.",
    )


class EndingsEnrichRequest(BaseModel):
    endings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Array of {id, title, quote, attribution} for the 12 endings.",
    )
    pdoom_estimates: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Existing P(doom) estimates currently shown on the page.",
    )


class BenefitsEnrichRequest(BaseModel):
    benefits: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Array of {id, title, examples[]} for each benefit category.",
    )


class EnrichResponse(BaseModel):
    source: str = Field(
        ...,
        description="Which web backend produced context: websearch_backend | duckduckgo | none.",
    )
    suggestions: List[Dict[str, Any]] = Field(default_factory=list)
    raw: Optional[str] = Field(
        default=None,
        description="Raw LLM output when JSON parsing failed (debug aid).",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

def _forward_headers(request: Request) -> Dict[str, str]:
    """Forward the API-config headers used by ask_ai_unified (case-insensitive)."""
    keys = (
        "x-api-provider", "x-openai-key", "x-openrouter-key",
        "x-itemai-endpoint", "x-itemai-model",
    )
    hdrs: Dict[str, str] = {}
    for k in keys:
        v = request.headers.get(k)
        if v:
            hdrs[k] = v
    return hdrs


@router.post("/tracker", response_model=EnrichResponse)
async def enrich_tracker_endpoint(body: TrackerEnrichRequest, request: Request):
    try:
        result = await enrich_tracker(
            current_models=body.current_models,
            request_headers=_forward_headers(request),
        )
        return EnrichResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI enrichment failed: {e}")


@router.post("/endings", response_model=EnrichResponse)
async def enrich_endings_endpoint(body: EndingsEnrichRequest, request: Request):
    try:
        result = await enrich_endings(
            endings=body.endings,
            pdoom_estimates=body.pdoom_estimates,
            request_headers=_forward_headers(request),
        )
        return EnrichResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI enrichment failed: {e}")


@router.post("/benefits", response_model=EnrichResponse)
async def enrich_benefits_endpoint(body: BenefitsEnrichRequest, request: Request):
    try:
        result = await enrich_benefits(
            benefits=body.benefits,
            request_headers=_forward_headers(request),
        )
        return EnrichResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI enrichment failed: {e}")
