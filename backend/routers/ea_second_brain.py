"""
EA Second Brain Agent — Router
Ketil's 24/7 Enterprise Architecture Watcher

Endpoints:
  /api/ea-brain/health              GET    — Health check
  /api/ea-brain/stats               GET    — Dashboard statistics
  /api/ea-brain/portfolio           GET    — List portfolio items
  /api/ea-brain/portfolio           POST   — Create portfolio item
  /api/ea-brain/portfolio/{id}      GET    — Get single portfolio item
  /api/ea-brain/portfolio/{id}      PUT    — Update portfolio item
  /api/ea-brain/portfolio/{id}      DELETE — Delete portfolio item
  /api/ea-brain/portfolio/heatmap   GET    — Technology heatmap
  /api/ea-brain/portfolio/deprecations GET — Deprecation radar
  /api/ea-brain/insights            GET    — List insights
  /api/ea-brain/insights/{id}       GET    — Get single insight
  /api/ea-brain/insights/{id}/status PATCH — Update insight status
  /api/ea-brain/insights/generate   POST   — Generate insight via LLM
  /api/ea-brain/watchlist           GET    — List watchlist items
  /api/ea-brain/watchlist           POST   — Create watchlist item
  /api/ea-brain/watchlist/{id}      PUT    — Update watchlist item
  /api/ea-brain/watchlist/{id}      DELETE — Delete watchlist item
  /api/ea-brain/feeds               GET    — List source feeds
  /api/ea-brain/feeds               POST   — Create source feed
  /api/ea-brain/feeds/{id}          PUT    — Update source feed
  /api/ea-brain/feeds/{id}          DELETE — Delete source feed
  /api/ea-brain/ask                 POST   — Natural language query
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from pydantic import BaseModel
from backend.services.ea_second_brain import (
    # Portfolio
    create_portfolio_item,
    get_portfolio_items,
    get_portfolio_item,
    update_portfolio_item,
    delete_portfolio_item,
    get_technology_heatmap,
    get_deprecation_radar,
    # Insights
    get_insights,
    get_insight,
    update_insight_status,
    generate_insight,
    # Watchlist
    create_watchlist_item,
    get_watchlist_items,
    update_watchlist_item,
    delete_watchlist_item,
    # Source feeds
    create_source_feed,
    get_source_feeds,
    update_source_feed,
    delete_source_feed,
    # Ask
    ask_portfolio,
    # Dashboard
    get_dashboard_stats,
)

router = APIRouter(prefix="/api/ea-brain", tags=["EA Second Brain"])


# ─── Request Models ─────────────────────────────────────────────────────────

class GenerateInsightRequest(BaseModel):
    topic: str
    context: Optional[str] = None

class UpdateInsightStatusRequest(BaseModel):
    status: str  # pending, acknowledged, in_progress, resolved, dismissed
    resolved_by: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    context: Optional[str] = None
    include_insights: bool = True
    include_portfolio: bool = True


# ─── Health ─────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ea-second-brain", "version": "1.0.0"}


# ─── Dashboard Stats ────────────────────────────────────────────────────────

@router.get("/stats")
async def stats():
    """Full dashboard statistics"""
    return await get_dashboard_stats()


# ─── Portfolio CRUD ─────────────────────────────────────────────────────────

@router.get("/portfolio/heatmap")
async def portfolio_heatmap():
    """Technology usage heatmap across portfolio"""
    return await get_technology_heatmap()


@router.get("/portfolio/deprecations")
async def portfolio_deprecations():
    """Technologies approaching or past EOL"""
    return await get_deprecation_radar()


@router.get("/portfolio")
async def list_portfolio(
    lifecycle: Optional[str] = None,
    criticality_min: Optional[int] = None,
    criticality_max: Optional[int] = None,
    owner: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List portfolio items with filters"""
    return await get_portfolio_items(
        lifecycle=lifecycle,
        criticality_min=criticality_min,
        criticality_max=criticality_max,
        owner=owner,
        tag=tag,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("/portfolio")
async def create_portfolio(request: Request):
    """Create a new portfolio item"""
    data = await request.json()
    return await create_portfolio_item(data)


@router.get("/portfolio/{item_id}")
async def get_portfolio(item_id: str):
    """Get a single portfolio item"""
    item = await get_portfolio_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return item


@router.put("/portfolio/{item_id}")
async def update_portfolio(item_id: str, request: Request):
    """Update a portfolio item"""
    data = await request.json()
    result = await update_portfolio_item(item_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return result


@router.delete("/portfolio/{item_id}")
async def delete_portfolio(item_id: str):
    """Delete a portfolio item"""
    deleted = await delete_portfolio_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return {"ok": True, "deleted": item_id}


# ─── Insights ───────────────────────────────────────────────────────────────

@router.get("/insights")
async def list_insights(
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """List insights with filters"""
    return await get_insights(
        status=status, category=category, urgency=urgency,
        limit=limit, skip=skip,
    )


@router.get("/insights/{insight_id}")
async def get_single_insight(insight_id: str):
    """Get a single insight by ID"""
    ins = await get_insight(insight_id)
    if not ins:
        raise HTTPException(status_code=404, detail="Insight not found")
    return ins


@router.patch("/insights/{insight_id}/status")
async def patch_insight_status(insight_id: str, body: UpdateInsightStatusRequest):
    """Update insight status"""
    allowed = ["pending", "acknowledged", "in_progress", "resolved", "dismissed"]
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")
    result = await update_insight_status(insight_id, body.status, body.resolved_by)
    if not result:
        raise HTTPException(status_code=404, detail="Insight not found")
    return result


@router.post("/insights/generate")
async def generate_new_insight(body: GenerateInsightRequest, request: Request):
    """Generate a new insight using LLM analysis"""
    headers = dict(request.headers) if request else None
    return await generate_insight(body.topic, body.context, request_headers=headers)


# ─── Watchlist ──────────────────────────────────────────────────────────────

@router.get("/watchlist")
async def list_watchlist(active_only: bool = False):
    """List watchlist items"""
    return await get_watchlist_items(active_only=active_only)


@router.post("/watchlist")
async def create_watchlist(request: Request):
    """Create a watchlist item"""
    data = await request.json()
    return await create_watchlist_item(data)


@router.put("/watchlist/{item_id}")
async def update_watchlist(item_id: str, request: Request):
    """Update a watchlist item"""
    data = await request.json()
    result = await update_watchlist_item(item_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return result


@router.delete("/watchlist/{item_id}")
async def delete_watchlist(item_id: str):
    """Delete a watchlist item"""
    deleted = await delete_watchlist_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return {"ok": True, "deleted": item_id}


# ─── Source Feeds ───────────────────────────────────────────────────────────

@router.get("/feeds")
async def list_feeds(active_only: bool = False):
    """List source feeds"""
    return await get_source_feeds(active_only=active_only)


@router.post("/feeds")
async def create_feed(request: Request):
    """Create a source feed"""
    data = await request.json()
    return await create_source_feed(data)


@router.put("/feeds/{feed_id}")
async def update_feed(feed_id: str, request: Request):
    """Update a source feed"""
    data = await request.json()
    result = await update_source_feed(feed_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Feed not found")
    return result


@router.delete("/feeds/{feed_id}")
async def delete_feed(feed_id: str):
    """Delete a source feed"""
    deleted = await delete_source_feed(feed_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Feed not found")
    return {"ok": True, "deleted": feed_id}


# ─── Ask (Natural Language Query) ───────────────────────────────────────────

@router.post("/ask")
async def ask(body: AskRequest, request: Request):
    """Ask a natural language question about the EA portfolio"""
    headers = dict(request.headers) if request else None
    return await ask_portfolio(
        question=body.question,
        context=body.context,
        include_insights=body.include_insights,
        include_portfolio=body.include_portfolio,
        request_headers=headers,
    )
