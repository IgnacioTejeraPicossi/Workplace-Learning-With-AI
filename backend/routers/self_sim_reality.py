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
except ImportError:  # pragma: no cover
    from services.self_sim_reality_chat import answer, concepts, health  # type: ignore

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
