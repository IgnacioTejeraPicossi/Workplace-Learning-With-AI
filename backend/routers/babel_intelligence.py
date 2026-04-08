"""
Babel Library Intelligence Router — Phases 1-4
Endpoints for AI classification, semantic search, batch processing,
AI content generation, and predictive intelligence.
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
    process_content_for_resource,
    generate_all_content,
    get_content_batch_status,
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

class ContentGenRequest(BaseModel):
    resource_id: str
    resource_type: str = "article"

class ContentBatchRequest(BaseModel):
    delay: float = Field(default=1.0, ge=0, le=10.0)


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
    """Get stats about classified/embedded/content-generated resources."""
    return await get_stats()


# ---------------------------------------------------------------------------
# Phase 3 — Content Generation Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate-content")
async def generate_content_endpoint(body: ContentGenRequest, request: Request):
    """Generate AI content (summary, questions, hints) for a single resource."""
    headers = dict(request.headers) if request else None
    result = await process_content_for_resource(
        resource_id=body.resource_id,
        resource_type=body.resource_type,
        request_headers=headers
    )
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "ok", "content": result}


@router.post("/generate-content/batch")
async def start_content_batch(body: ContentBatchRequest, background_tasks: BackgroundTasks, request: Request):
    """Start batch content generation for all classified resources missing content."""
    status = get_content_batch_status()
    if status["running"]:
        return {"status": "already_running", "progress": status}

    headers = dict(request.headers) if request else None
    background_tasks.add_task(generate_all_content, request_headers=headers, delay=body.delay)

    return {"status": "started", "message": "Content generation batch started in background"}


@router.get("/generate-content/batch/status")
async def content_batch_status():
    """Get current content generation batch progress."""
    return get_content_batch_status()


# ---------------------------------------------------------------------------
# Phase 4 — Predictive Intelligence Endpoints
# ---------------------------------------------------------------------------

from backend.services.babel_predictive import (
    get_trend_analysis,
    get_demand_forecast,
    get_knowledge_gaps,
    get_expertise_distribution,
    get_predictive_dashboard,
)


@router.get("/predictive/trends")
async def trends():
    """Get trend analysis — rising/declining topics over time windows."""
    return await get_trend_analysis()


@router.get("/predictive/demand")
async def demand():
    """Get demand vs supply forecast per domain."""
    return await get_demand_forecast()


@router.get("/predictive/gaps")
async def gaps(user_id: str = None):
    """Get knowledge gap analysis (platform-wide + optional per-user)."""
    return await get_knowledge_gaps(user_id)


@router.get("/predictive/expertise")
async def expertise():
    """Get network expertise distribution across domains."""
    return await get_expertise_distribution()


@router.get("/predictive/dashboard")
async def predictive_dashboard(user_id: str = None):
    """Get full predictive intelligence dashboard (all 4 analyses)."""
    return await get_predictive_dashboard(user_id)
