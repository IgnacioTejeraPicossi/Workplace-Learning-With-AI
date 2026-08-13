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
    # Optional month (1–12) — when present the frontend renders the release as
    # "<month-name>-<year>" (e.g. "juni-2026") locale-aware, otherwise just the year.
    month: Optional[int] = Field(None, ge=1, le=12, examples=[6])
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
        model="Gemini 3.1 Pro", year=2026, month=2,
        scores={"K":9,"RW":9,"M":9,"R":7,"WM":6,"MS":0,"MR":5,"V":6,"A":6,"S":4},
        total=61,
        notes="Google, flagship Gemini Pro line (last major update Feb 2026). By mid-2026 it leads several reasoning benchmarks (GPQA Diamond ~94%). Strong multimodal (visual+audio) and broad knowledge; this breadth score is its early-2026 snapshot.",
    ),
    AGIItem(
        model="Claude Opus 4.7", year=2026, month=3,
        scores={"K":9,"RW":10,"M":10,"R":9,"WM":7,"MS":0,"MR":6,"V":6,"A":6,"S":4},
        total=67,
        notes="Anthropic 2026. SWE-bench Pro 64.3% (leads field), SWE-bench Verified 87.6%, GPQA Diamond 94.2%, +14% on multi-step agentic tasks.",
    ),
    AGIItem(
        model="Claude Opus 4.8", year=2026, month=5,
        scores={"K":9,"RW":10,"M":10,"R":9,"WM":8,"MS":0,"MR":7,"V":7,"A":7,"S":4},
        total=71,
        notes="Anthropic mid-2026. Incremental refinement of Opus 4.7. Improvements in long-context working memory and multimodal (vision + audio) integration. Estimated SWE-bench Verified ~89%, GPQA Diamond ~95%, ARC-AGI-2 ~38%. Reasoning depth and tool-use chains both extended.",
    ),
    AGIItem(
        model="Claude Fable 5", year=2026, month=6,
        scores={"K":10,"RW":10,"M":10,"R":10,"WM":9,"MS":0,"MR":8,"V":9,"A":9,"S":5},
        total=80,
        notes="Anthropic juni-2026. Available, but gated behind a special access tier that requires usage credits (not a default/free model). Now publicly ranked on Artificial Analysis (Intelligence Index ~60, Agentic ~52.8). Estimates: ARC-AGI-2 ~55%, near-human multi-step agentic performance, breakthroughs on cross-modal reasoning. Long-term memory storage (MS) remains the unresolved architectural bottleneck for all LLMs of this generation — Fable 5 sits at the upper bound of what is achievable without solving persistent online memory.",
    ),
    # ── Refresh through August 2026 (added 2026-08-13, web-sourced). Scores are
    # CHC-breadth approximations mapped from public benchmarks + leaderboards —
    # a directional indicator, NOT a task-benchmark ranking. Note the deliberate
    # divergence for text-first open-weight models (Kimi): they can lead coding /
    # reasoning benchmarks yet score lower HERE because this metric weights native
    # vision (V) and audio (A) equally with the other domains.
    AGIItem(
        model="Kimi K2.6", year=2026, month=4,
        scores={"K":9,"RW":9,"M":10,"R":9,"WM":6,"MS":0,"MR":5,"V":3,"A":2,"S":6},
        total=59,
        notes="Moonshot AI (China), April 2026. 1T-parameter open-weight MoE — the most famous Chinese frontier model. Benchmark-competitive with the proprietary frontier on text tasks: SWE-bench Pro 58.6% (ahead of GPT-5.4 and Opus 4.6), SWE-bench Verified 80.2%, GPQA-Diamond 90.5%, AIME 2026 96.4%. Ranked #4 of 346 models and #1 open-weight on Artificial Analysis. Text-first: limited native vision/audio keeps its CHC-breadth score below the multimodal frontier despite elite coding/reasoning.",
    ),
    AGIItem(
        model="Kimi K3", year=2026, month=7,
        scores={"K":10,"RW":10,"M":10,"R":10,"WM":7,"MS":0,"MR":6,"V":4,"A":3,"S":6},
        total=66,
        notes="Moonshot AI (China), mid-2026. 2.8T-parameter open-weight MoE — #3 overall on the Artificial Analysis Intelligence Index, ahead of every proprietary model except Claude Fable 5 and GPT-5.6 Sol, and the top open-weight model. Frontier-level knowledge and reasoning; still text-centric, so native vision/audio breadth trails the fully-multimodal leaders.",
    ),
    AGIItem(
        model="GPT-5.6 Sol", year=2026, month=7,
        scores={"K":10,"RW":10,"M":10,"R":9,"WM":8,"MS":0,"MR":7,"V":8,"A":7,"S":6},
        total=75,
        notes="OpenAI, general availability 9 July 2026. Top overall on the LLM Stats snapshot (57.2); Artificial Analysis Intelligence 59 / Agentic 54.0. Its sibling GPT-5.5 Pro leads FrontierMath Tier 4 (39.6%). Strong across reasoning, coding and multimodality.",
    ),
    AGIItem(
        model="Claude Opus 5", year=2026, month=7,
        scores={"K":10,"RW":10,"M":10,"R":10,"WM":8,"MS":0,"MR":7,"V":8,"A":8,"S":5},
        total=76,
        notes="Anthropic, 24 July 2026. Top model overall on Artificial Analysis's rebased leaderboard (Intelligence Index 61) and leads the Agentic Index (55.3). Frontier reasoning + agentic tool-use with strong multimodal (vision + audio). MS (persistent long-term memory) remains the shared architectural bottleneck for this LLM generation.",
    ),
    AGIItem(
        model="Gemini 3.6 Flash", year=2026, month=7,
        scores={"K":9,"RW":9,"M":9,"R":8,"WM":6,"MS":0,"MR":5,"V":7,"A":6,"S":7},
        total=66,
        notes="Google DeepMind, 21 July 2026. The newest Gemini release — a fast, low-cost 'workhorse' model with improved coding, knowledge and multimodal performance and ~17% lower token use than 3.5 Flash. Not the flagship (the Gemini Pro line was last updated Feb 2026). High Speed (S) is its distinguishing strength.",
    ),
    AGIItem(
        model="Grok 4.5", year=2026,
        scores={"K":9,"RW":9,"M":10,"R":9,"WM":7,"MS":0,"MR":6,"V":7,"A":5,"S":6},
        total=68,
        notes="xAI, 2026. Strong agentic/coding: SWE-bench Pro 64.7% and leads Humanity's Last Exam (50.7%). Notably did NOT publish the classic academic benchmarks (GPQA/MMLU/AIME/SWE-bench Verified/ARC-AGI-2) at launch, reporting agentic/coding evals instead. Real-time knowledge via X integration; multimodal vision.",
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
