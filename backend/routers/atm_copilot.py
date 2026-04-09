"""
ATM V&V Test Copilot — Router
===============================
REST API endpoints for the ATM Verification & Validation Test Copilot.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from typing import List, Optional

try:
    from backend.services.atm_copilot import (
        ingest_requirement_bundle,
        generate_test_design,
        build_atm_scenario_matrix,
        analyze_test_run,
        list_requirement_bundles,
        get_requirement_bundle,
        list_test_designs,
        list_scenario_matrices,
        list_test_run_analyses,
        delete_document,
        get_stats,
        export_test_design_markdown,
        export_scenario_matrix_markdown,
        VALID_SOURCE_TYPES,
        VALID_SCENARIO_TYPES,
    )
except ImportError:
    from services.atm_copilot import (
        ingest_requirement_bundle,
        generate_test_design,
        build_atm_scenario_matrix,
        analyze_test_run,
        list_requirement_bundles,
        get_requirement_bundle,
        list_test_designs,
        list_scenario_matrices,
        list_test_run_analyses,
        delete_document,
        get_stats,
        export_test_design_markdown,
        export_scenario_matrix_markdown,
        VALID_SOURCE_TYPES,
        VALID_SCENARIO_TYPES,
    )

router = APIRouter(prefix="/api/atm-copilot", tags=["ATM V&V Test Copilot"])


# ── Request Models ──────────────────────────────────────────────────

class IngestRequirementRequest(BaseModel):
    title: str
    source_type: str = Field(default="requirement")
    content: str
    tags: Optional[List[str]] = []


class GenerateTestDesignRequest(BaseModel):
    requirement_bundle_id: str


class BuildScenarioRequest(BaseModel):
    scenario_type: str = Field(default="conflict_detection")
    risk_level: str = Field(default="medium")
    include_edge_cases: bool = True
    include_fallbacks: bool = True
    parameters: Optional[dict] = {}


class AnalyzeRunRequest(BaseModel):
    run_id: str
    artifacts: List[dict] = Field(default=[])


# ── Health ──────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    """Health check for ATM V&V Test Copilot."""
    return {
        "status": "ok",
        "service": "atm-vv-test-copilot",
        "validSourceTypes": VALID_SOURCE_TYPES,
        "validScenarioTypes": VALID_SCENARIO_TYPES,
    }


# ── Stats ───────────────────────────────────────────────────────────

@router.get("/stats")
async def stats():
    """Get collection counts."""
    return await get_stats()


# ── Tool 1: Requirements ────────────────────────────────────────────

@router.post("/requirements/ingest")
async def ingest_requirement(body: IngestRequirementRequest, request: Request):
    """Ingest and normalize a requirement bundle."""
    headers = dict(request.headers) if request else None
    result = await ingest_requirement_bundle(
        title=body.title,
        source_type=body.source_type,
        content=body.content,
        tags=body.tags,
        request_headers=headers,
    )
    return result


@router.get("/requirements")
async def list_requirements(limit: int = 50):
    """List recent requirement bundles."""
    return await list_requirement_bundles(limit=limit)


@router.get("/requirements/{bundle_id}")
async def get_requirement(bundle_id: str):
    """Get a single requirement bundle."""
    doc = await get_requirement_bundle(bundle_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Requirement bundle not found")
    return doc


@router.delete("/requirements/{bundle_id}")
async def delete_requirement(bundle_id: str):
    """Delete a requirement bundle."""
    ok = await delete_document("requirements", bundle_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Requirement bundle not found")
    return {"status": "deleted"}


# ── Tool 2: Test Designs ────────────────────────────────────────────

@router.post("/designs/generate")
async def generate_design(body: GenerateTestDesignRequest, request: Request):
    """Generate a test design from a requirement bundle."""
    headers = dict(request.headers) if request else None
    result = await generate_test_design(
        requirement_bundle_id=body.requirement_bundle_id,
        request_headers=headers,
    )
    return result


@router.get("/designs")
async def list_designs(requirement_id: Optional[str] = None, limit: int = 50):
    """List test designs, optionally filtered by requirement ID."""
    return await list_test_designs(requirement_id=requirement_id, limit=limit)


@router.get("/designs/{design_id}/export/markdown")
async def export_design_md(design_id: str):
    """Export a test design as Markdown."""
    from bson import ObjectId
    try:
        from backend.db import atm_test_designs_collection
    except ImportError:
        from db import atm_test_designs_collection

    try:
        doc = await atm_test_designs_collection.find_one({"_id": ObjectId(design_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid design ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Test design not found")

    doc["_id"] = str(doc["_id"])
    md = export_test_design_markdown(doc)
    return PlainTextResponse(content=md, media_type="text/markdown")


@router.delete("/designs/{design_id}")
async def delete_design(design_id: str):
    """Delete a test design."""
    ok = await delete_document("designs", design_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Test design not found")
    return {"status": "deleted"}


# ── Tool 3: Scenario Matrices ───────────────────────────────────────

@router.post("/scenarios/build")
async def build_scenario(body: BuildScenarioRequest, request: Request):
    """Build an ATM scenario matrix."""
    headers = dict(request.headers) if request else None
    result = await build_atm_scenario_matrix(
        scenario_type=body.scenario_type,
        risk_level=body.risk_level,
        include_edge_cases=body.include_edge_cases,
        include_fallbacks=body.include_fallbacks,
        parameters=body.parameters,
        request_headers=headers,
    )
    return result


@router.get("/scenarios")
async def list_scenarios(scenario_type: Optional[str] = None, limit: int = 50):
    """List scenario matrices, optionally filtered by type."""
    return await list_scenario_matrices(scenario_type=scenario_type, limit=limit)


@router.get("/scenarios/{scenario_id}/export/markdown")
async def export_scenario_md(scenario_id: str):
    """Export a scenario matrix as Markdown."""
    from bson import ObjectId
    try:
        from backend.db import atm_scenario_matrices_collection
    except ImportError:
        from db import atm_scenario_matrices_collection

    try:
        doc = await atm_scenario_matrices_collection.find_one({"_id": ObjectId(scenario_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scenario ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Scenario matrix not found")

    doc["_id"] = str(doc["_id"])
    md = export_scenario_matrix_markdown(doc)
    return PlainTextResponse(content=md, media_type="text/markdown")


@router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str):
    """Delete a scenario matrix."""
    ok = await delete_document("scenarios", scenario_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Scenario matrix not found")
    return {"status": "deleted"}


# ── Tool 4: Run Analysis ────────────────────────────────────────────

@router.post("/runs/analyze")
async def analyze_run(body: AnalyzeRunRequest, request: Request):
    """Analyze a test run from its artifacts."""
    headers = dict(request.headers) if request else None
    result = await analyze_test_run(
        run_id=body.run_id,
        artifacts=body.artifacts,
        request_headers=headers,
    )
    return result


@router.get("/runs")
async def list_runs(limit: int = 50):
    """List recent test run analyses."""
    return await list_test_run_analyses(limit=limit)


@router.delete("/runs/{run_id}")
async def delete_run(run_id: str):
    """Delete a test run analysis."""
    ok = await delete_document("runs", run_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Test run analysis not found")
    return {"status": "deleted"}
