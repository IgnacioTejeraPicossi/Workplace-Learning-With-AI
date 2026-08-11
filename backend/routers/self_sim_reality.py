"""
Self-Simulating Reality Agent — Router (V1)
===========================================
REST API for the conversational, epistemically-disciplined agent.

Endpoints (plan §8):
  POST /api/self-sim-reality/chat      — one tagged conversational turn
  GET  /api/self-sim-reality/concepts  — the curated OPH/science knowledge base
  GET  /api/self-sim-reality/health    — health probe
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

try:
    from backend.services.self_sim_reality_chat import answer, concepts, health
    from backend.services import self_sim_reality_vectorstore as vectorstore
    from backend.services.self_sim_reality_compare import compare as compare_theories
    from backend.services.self_sim_reality_redteam import red_team as red_team_claim
except ImportError:  # pragma: no cover
    from services.self_sim_reality_chat import answer, concepts, health  # type: ignore
    from services import self_sim_reality_vectorstore as vectorstore  # type: ignore
    from services.self_sim_reality_compare import compare as compare_theories  # type: ignore
    from services.self_sim_reality_redteam import red_team as red_team_claim  # type: ignore

router = APIRouter(prefix="/api/self-sim-reality")


class ChatTurn(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000,
                         description="The user's question about observers, minds, "
                                     "consciousness, simulation, holography or OPH")
    lang: str = Field("en", pattern=r"^(en|es|no)$")
    history: Optional[List[ChatTurn]] = Field(default=None,
                         description="Prior turns for conversational context")


@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.get("/concepts", summary="Curated OPH + science knowledge base")
def concepts_endpoint() -> Dict[str, Any]:
    items = concepts()
    return {"count": len(items), "concepts": items}


@router.post("/chat", summary="One epistemically-tagged conversational turn")
async def chat_endpoint(body: ChatRequest) -> Dict[str, Any]:
    hist = [t.model_dump() for t in body.history] if body.history else None
    return await answer(body.message, body.lang, hist)


class SourceMapRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500,
                       description="A topic or question to map to source chunks")
    k: int = Field(5, ge=1, le=12, description="How many sources to return")
    backend: str = Field("auto", pattern=r"^(auto|embeddings|tfidf)$")


@router.get("/vectorstore/health", summary="Vector store health (backend, KB size)")
def vectorstore_health() -> Dict[str, Any]:
    return vectorstore.health()


@router.post("/source-map", summary="Map a topic to ranked, epistemically-tagged sources")
def source_map_endpoint(body: SourceMapRequest) -> Dict[str, Any]:
    res = vectorstore.search(body.topic, k=body.k, backend=body.backend)
    return {"topic": body.topic, **res}


class CompareRequest(BaseModel):
    a: str = Field(..., min_length=1, max_length=200, description="First theory / position")
    b: str = Field(..., min_length=1, max_length=200, description="Second theory / position")
    lang: str = Field("en", pattern=r"^(en|es|no)$")


@router.post("/compare-theories", summary="Structured, epistemically-tagged comparison of two theories")
async def compare_theories_endpoint(body: CompareRequest) -> Dict[str, Any]:
    return await compare_theories(body.a, body.b, body.lang)


class RedTeamRequest(BaseModel):
    claim: str = Field(..., min_length=1, max_length=2000,
                       description="A claim to stress-test in good faith")
    lang: str = Field("en", pattern=r"^(en|es|no)$")


@router.post("/red-team", summary="Good-faith adversarial critique of a claim (steelman + objections + verdict)")
async def red_team_endpoint(body: RedTeamRequest) -> Dict[str, Any]:
    return await red_team_claim(body.claim, body.lang)
