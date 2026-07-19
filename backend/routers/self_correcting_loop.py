"""
Self-Correcting AI Loop — Router
================================
REST API for the Loop Builder's "Customize with AI" feature. Takes a task type
+ the user's specific task and returns a tailored Builder/Judge/Manager/stop
scaffold. Degrades to a deterministic fallback when no LLM is available.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict

try:
    from backend.services.self_correcting_loop import customize_loop, health
except ImportError:  # pragma: no cover
    from services.self_correcting_loop import customize_loop, health  # type: ignore

router = APIRouter(prefix="/api/self-correcting-loop")


class CustomizeRequest(BaseModel):
    task_type: str = Field("custom", pattern=r"^(writing|code|research|custom)$")
    task_description: str = Field(..., min_length=1, max_length=2000,
                                  description="The user's specific task to tailor the loop for")
    lang: str = Field("en", pattern=r"^(en|es|no)$")


@router.get("/health", summary="Health probe")
def health_endpoint() -> Dict[str, Any]:
    return health()


@router.post("/customize", summary="Tailor a Builder/Judge/Manager scaffold to a specific task")
async def customize_endpoint(body: CustomizeRequest) -> Dict[str, Any]:
    return await customize_loop(body.task_type, body.task_description, body.lang)
