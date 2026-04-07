"""
Learning Profile Router — Phase 2
Endpoints for user interaction tracking, recommendations, and learning paths.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional

from backend.services.learning_profile import (
    record_interaction,
    record_search,
    get_profile_summary,
)
from backend.services.recommendation_engine import (
    get_recommendations,
    generate_learning_path,
)

router = APIRouter(prefix="/api/babel/profile")


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class InteractionRequest(BaseModel):
    user_id: str
    resource_id: str
    resource_type: str = "article"
    action: str = "view"
    topic: Optional[str] = None
    domain: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None


class SearchEventRequest(BaseModel):
    user_id: str
    query: str


class LearningPathRequest(BaseModel):
    goal_topic: str
    max_steps: int = Field(default=8, ge=3, le=20)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/interaction")
async def track_interaction(body: InteractionRequest):
    """Record a resource interaction (fire-and-forget from frontend)."""
    interaction = body.model_dump(exclude={"user_id"}, exclude_none=True)
    return await record_interaction(body.user_id, interaction)


@router.post("/search")
async def track_search(body: SearchEventRequest):
    """Record a search event."""
    return await record_search(body.user_id, body.query)


@router.get("/{user_id}/summary")
async def profile_summary(user_id: str):
    """Get derived profile summary."""
    return await get_profile_summary(user_id)


@router.get("/{user_id}/recommendations")
async def recommendations(user_id: str, limit: int = 12):
    """Get personalized recommendations."""
    return await get_recommendations(user_id, limit=min(limit, 30))


@router.post("/{user_id}/learning-path")
async def learning_path(user_id: str, body: LearningPathRequest):
    """Generate a learning path for a goal topic."""
    return await generate_learning_path(user_id, body.goal_topic, body.max_steps)
