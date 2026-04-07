"""
Babel Library Intelligence Router — Phase 1
Endpoints for AI classification, semantic search, and batch processing.
"""
from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, Field
from typing import List, Optional

from backend.services.babel_intelligence import (
    classify_and_tag,
    process_single_resource,
    process_all_resources,
    hybrid_search,
    semantic_search,
    get_batch_status,
    get_stats,
)

router = APIRouter(prefix="/api/babel/intelligence")

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ClassifyRequest(BaseModel):
    title: str
    description: str = ""
    resource_type: str = "article"
    resource_id: Optional[str] = None
    source_collection: Optional[str] = ""

class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=20, ge=1, le=100)
    mode: str = Field(default="hybrid", pattern="^(hybrid|semantic)$")
    resource_types: Optional[List[str]] = None

class BatchRequest(BaseModel):
    delay: float = Field(default=0.3, ge=0, le=5.0)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/classify")
async def classify_resource(body: ClassifyRequest, request: Request):
    """Classify, tag, and embed a single resource."""
    headers = dict(request.headers) if request else None

    # If resource_id provided, process fully (classify + embed + store)
    if body.resource_id:
        result = await process_single_resource(
            resource_id=body.resource_id,
            resource_type=body.resource_type,
            title=body.title,
            description=body.description,
            source_collection=body.source_collection or "",
            request_headers=headers
        )
        # Remove embedding from response (too large)
        result.pop("embedding", None)
        return {"status": "ok", "metadata": result}

    # Otherwise just classify + tag (no storage)
    classification = await classify_and_tag(
        title=body.title,
        description=body.description,
        resource_type=body.resource_type,
        request_headers=headers
    )

    if classification is None:
        return {
            "status": "fallback",
            "message": "LLM unavailable, classification skipped",
            "metadata": {"classification": None, "tags": []}
        }

    return {"status": "ok", "metadata": classification}


@router.post("/search")
async def search_resources(body: SearchRequest):
    """Semantic or hybrid search across all classified resources."""
    if body.mode == "semantic":
        results = await semantic_search(
            query=body.query,
            limit=body.limit,
            resource_types=body.resource_types
        )
        return {"results": results, "insights": {}, "mode": "semantic"}

    result = await hybrid_search(
        query=body.query,
        limit=body.limit,
        resource_types=body.resource_types
    )
    return result


@router.post("/batch")
async def start_batch(body: BatchRequest, background_tasks: BackgroundTasks, request: Request):
    """Start batch classification + embedding of all resources."""
    status = get_batch_status()
    if status["running"]:
        return {"status": "already_running", "progress": status}

    headers = dict(request.headers) if request else None
    background_tasks.add_task(process_all_resources, request_headers=headers, delay=body.delay)

    return {"status": "started", "message": "Batch processing started in background"}


@router.get("/batch/status")
async def batch_status():
    """Get current batch processing progress."""
    return get_batch_status()


@router.get("/stats")
async def intelligence_stats():
    """Get stats about classified/embedded resources."""
    return await get_stats()
