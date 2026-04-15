"""
Cloud Install Module — Router
Deployment planning, readiness, and validation endpoints.

Base path: /api/cloud-install/

Endpoints:
  GET  /api/cloud-install/status               — Overall readiness status
  POST /api/cloud-install/recommend-architecture — Architecture recommendation
  POST /api/cloud-install/generate-env-template  — Environment variable templates
  POST /api/cloud-install/generate-deploy-checklist — Deployment checklist
  POST /api/cloud-install/run-smoke-tests       — Run smoke tests
  GET  /api/cloud-install/cost-baseline         — Cost estimates
  GET  /api/cloud-install/troubleshooting       — Troubleshooting guidance
"""

from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel

from backend.services.cloud_install_service import (
    get_cloud_install_status,
    recommend_architecture,
    generate_env_template,
    generate_deploy_checklist,
    run_smoke_tests,
    get_cost_baseline,
    get_troubleshooting,
)

router = APIRouter(prefix="/api/cloud-install", tags=["Cloud Install"])


# ─── Request Models ─────────────────────────────────────────────────────────

class ArchitectureRequest(BaseModel):
    include_optional: bool = False
    budget_tier: str = "starter"

class EnvTemplateRequest(BaseModel):
    scope: str = "all"
    include_optional: bool = True

class ChecklistRequest(BaseModel):
    scope: str = "all"

class SmokeTestRequest(BaseModel):
    layers: list = ["backend"]
    backend_url: Optional[str] = None
    frontend_url: Optional[str] = None


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/status")
async def status():
    """Overall deployment readiness status"""
    return get_cloud_install_status()


@router.post("/recommend-architecture")
async def architecture(body: ArchitectureRequest):
    """Get recommended cloud architecture"""
    return recommend_architecture(
        include_optional=body.include_optional,
        budget_tier=body.budget_tier,
    )


@router.post("/generate-env-template")
async def env_template(body: EnvTemplateRequest):
    """Generate environment variable templates for cloud deployment"""
    return generate_env_template(
        scope=body.scope,
        include_optional=body.include_optional,
    )


@router.post("/generate-deploy-checklist")
async def deploy_checklist(body: ChecklistRequest):
    """Generate deployment checklist"""
    return generate_deploy_checklist(scope=body.scope)


@router.post("/run-smoke-tests")
async def smoke_tests(body: SmokeTestRequest):
    """Run smoke tests against deployment endpoints"""
    return await run_smoke_tests(
        layers=body.layers,
        backend_url=body.backend_url,
        frontend_url=body.frontend_url,
    )


@router.get("/cost-baseline")
async def cost_baseline():
    """Get cost estimates for the recommended architecture"""
    return get_cost_baseline()


@router.get("/troubleshooting")
async def troubleshooting(category: Optional[str] = Query(None)):
    """Get troubleshooting guidance, optionally filtered by category"""
    return get_troubleshooting(category=category)
