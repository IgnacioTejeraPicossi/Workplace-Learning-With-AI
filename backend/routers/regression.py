"""
Regression Router — Visual UI Regression Testing via Playwright.

Base path: /api/regression/

Endpoints:
  POST /api/regression/capture-baselines   — Capture all module screenshots → MongoDB
  POST /api/regression/run                 — Compare current UI vs baselines → diff results
  GET  /api/regression/status              — List stored baselines + capture dates
  GET  /api/regression/image/{name}        — Serve a baseline PNG by module name
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import base64

try:
    from backend.db import client
    from backend.services.regression_service import (
        capture_baselines,
        run_regression,
        get_baseline_status,
        get_baseline_image,
    )
except ImportError:
    from db import client
    from services.regression_service import (
        capture_baselines,
        run_regression,
        get_baseline_status,
        get_baseline_image,
    )

router = APIRouter(prefix="/api/regression", tags=["Visual Regression"])

def _db():
    return client["ai_learning"]


# ── Capture baselines ─────────────────────────────────────────────────────────

@router.post("/capture-baselines")
async def api_capture_baselines(
    app_url: str = Query(default="http://localhost:3000",
                         description="Base URL of the running React app"),
):
    """
    Launch Playwright, screenshot every sidebar module, upsert into MongoDB.
    Takes ~90 seconds for 30 modules. The app must be running on the given port.
    """
    result = await capture_baselines(_db(), app_url)
    if "error" in result and result.get("captured", 0) == 0:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


# ── Run regression ────────────────────────────────────────────────────────────

@router.post("/run")
async def api_run_regression(
    app_url: str = Query(default="http://localhost:3000",
                         description="Base URL of the running React app"),
):
    """
    Compare current UI screenshots against stored MongoDB baselines.
    Returns per-module pass/fail with base64 diff images for failed modules.
    """
    result = await run_regression(_db(), app_url)
    if "error" in result and not result.get("modules"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def api_regression_status():
    """Return count and metadata of stored baselines."""
    return await get_baseline_status(_db())


# ── Serve a single baseline image ─────────────────────────────────────────────

@router.get("/image/{module_name}")
async def api_baseline_image(module_name: str):
    """Serve a stored baseline screenshot as PNG."""
    b64 = await get_baseline_image(_db(), module_name)
    if not b64:
        raise HTTPException(status_code=404, detail=f"No baseline stored for '{module_name}'")
    try:
        img_bytes = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=500, detail="Stored baseline is not valid base64")
    return Response(content=img_bytes, media_type="image/png")
