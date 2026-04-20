from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from datetime import datetime

try:
    from backend.db import database
    _COL = database.get_collection("agi_progress")
except Exception:
    _COL = None

router = APIRouter(prefix="/api/agi", tags=["AGI Progress"])

DomainKey = Literal["K","RW","M","R","WM","MS","MR","V","A","S"]

class AGIItem(BaseModel):
    model: str = Field(..., examples=["Claude Opus 4.7"])
    year: int = Field(..., examples=[2026])
    scores: Dict[DomainKey, int]
    total: int = Field(..., ge=0, le=100)
    created_at: Optional[datetime] = None
    notes: Optional[str] = None

# Curated AGI progress data — scores on 0-10 scale per domain, total = sum (0-100).
# Domains (Hendrycks et al. 2025, CHC-inspired):
#   K  = General Knowledge          RW = Reading & Writing
#   M  = Mathematical Ability       R  = On-the-Spot Reasoning
#   WM = Working Memory             MS = Long-Term Memory Storage
#   MR = Long-Term Memory Retrieval V  = Visual Processing
#   A  = Auditory Processing        S  = Speed
#
# Note: MS (long-term memory storage) remains the architectural bottleneck for all
# current LLMs (score 0) — they must re-learn context in every interaction.
# Scores are directional approximations synthesized from public benchmarks
# (MMLU, GPQA Diamond, MATH-500, SWE-bench, ARC-AGI-2, HumanEval, etc.).
DEFAULT_DATA: List[AGIItem] = [
    AGIItem(
        model="GPT-4", year=2023,
        scores={"K":8,"RW":6,"M":4,"R":0,"WM":2,"MS":0,"MR":4,"V":0,"A":0,"S":3},
        total=27,
        notes="Baseline frontier model (2023). Strong knowledge/writing, weak reasoning, no native audio/vision-in-reasoning loop.",
    ),
    AGIItem(
        model="GPT-5", year=2025,
        scores={"K":9,"RW":10,"M":10,"R":7,"WM":5,"MS":0,"MR":4,"V":4,"A":6,"S":3},
        total=58,
        notes="Major jump in math, reasoning, and multimodality. Per Hendrycks et al. (2025): ~57% AGI score.",
    ),
    AGIItem(
        model="Claude Opus 4.6", year=2025,
        scores={"K":9,"RW":10,"M":10,"R":8,"WM":6,"MS":0,"MR":5,"V":5,"A":5,"S":3},
        total=61,
        notes="Anthropic late-2025. GPQA Diamond 78.2%, MATH-500 97.1%, SWE-bench Verified 74.0%, WebDev Arena 82.1%, ARC-AGI-2 32.4%.",
    ),
    AGIItem(
        model="Gemini 3.1 Pro", year=2026,
        scores={"K":9,"RW":9,"M":9,"R":7,"WM":6,"MS":0,"MR":5,"V":6,"A":6,"S":4},
        total=61,
        notes="Google early-2026. Strong multimodal (visual+audio), broad knowledge, slightly behind on reasoning/coding vs Opus 4.7.",
    ),
    AGIItem(
        model="Claude Opus 4.7", year=2026,
        scores={"K":9,"RW":10,"M":10,"R":9,"WM":7,"MS":0,"MR":6,"V":6,"A":6,"S":4},
        total=67,
        notes="Anthropic 2026. SWE-bench Pro 64.3% (leads field), SWE-bench Verified 87.6%, GPQA Diamond 94.2%, +14% on multi-step agentic tasks.",
    ),
]


async def _ensure_seed():
    """Idempotent seed: upsert each default model by name so updates to
    DEFAULT_DATA are reflected even when the collection already has old entries.
    Manually-added models via POST /api/agi/progress are preserved."""
    if _COL is None:
        return
    try:
        for item in DEFAULT_DATA:
            await _COL.update_one(
                {"model": item.model, "year": item.year},
                {"$set": item.model_dump()},
                upsert=True,
            )
    except Exception:
        pass


@router.get("/progress", response_model=List[AGIItem])
async def get_progress():
    try:
        if _COL is not None:
            await _ensure_seed()
            items = await _COL.find({}, {"_id": 0}).to_list(1000)
            if items:
                # Sort by year then total for stable UI ordering
                items.sort(key=lambda x: (x.get("year", 0), x.get("total", 0)))
                return items
    except Exception:
        pass
    return DEFAULT_DATA


@router.post("/progress", response_model=AGIItem)
async def add_progress(item: AGIItem):
    item.created_at = datetime.utcnow()
    try:
        if _COL is not None:
            await _COL.update_one(
                {"model": item.model, "year": item.year},
                {"$set": item.model_dump()},
                upsert=True,
            )
    except Exception:
        pass
    return item
