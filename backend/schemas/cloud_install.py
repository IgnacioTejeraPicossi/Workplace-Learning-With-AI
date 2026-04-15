"""
Cloud Install Module — Typed Request/Response Schemas
Pydantic models for deployment planning, readiness, and smoke tests.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


# ─── Shared Types ───────────────────────────────────────────────────────────

class SectionStatus(BaseModel):
    id: str
    label: str
    status: Literal["ready", "partial", "pending", "not_started", "error"]
    progress: int = Field(ge=0, le=100, default=0)
    details: Optional[str] = None


class StackInfo(BaseModel):
    frontend: str = "react"
    backend: str = "fastapi"
    database: str = "mongodb"
    auth: str = "firebase"
    dns: Optional[str] = "cloudflare"
    monitoring: Optional[str] = None


# ─── Status ─────────────────────────────────────────────────────────────────

class CloudInstallStatusResponse(BaseModel):
    ok: bool = True
    module: str = "cloud_install"
    readinessScore: int = Field(ge=0, le=100)
    sections: List[SectionStatus]
    stack: StackInfo
    lastChecked: Optional[str] = None


# ─── Architecture Recommendation ────────────────────────────────────────────

class ArchitectureRecommendationRequest(BaseModel):
    include_optional: bool = False
    budget_tier: Literal["free", "starter", "professional"] = "starter"


class ServiceRecommendation(BaseModel):
    id: str
    name: str
    provider: str
    role: str
    phase: int = 1
    tier: str = "free"
    estimated_monthly_cost: str = "$0"
    why: str = ""
    key_features: List[str] = []
    alternatives: List[str] = []


class ArchitectureRecommendationResponse(BaseModel):
    ok: bool = True
    strategy: str
    services: List[ServiceRecommendation]
    total_estimated_monthly: str
    deployment_order: List[str]
    notes: List[str] = []


# ─── Environment Template ──────────────────────────────────────────────────

class EnvTemplateRequest(BaseModel):
    scope: Literal["backend", "frontend", "websearch", "all"] = "all"
    include_optional: bool = True


class EnvVariable(BaseModel):
    name: str
    value_hint: str
    type: Literal["secret", "public", "optional"]
    description: str
    cloud_note: Optional[str] = None
    required: bool = True


class EnvGroupTemplate(BaseModel):
    scope: str
    filename: str
    variables: List[EnvVariable]
    cloud_storage_note: str


class EnvTemplateResponse(BaseModel):
    ok: bool = True
    groups: List[EnvGroupTemplate]
    total_variables: int
    required_count: int
    secret_count: int


# ─── Deploy Checklist ───────────────────────────────────────────────────────

class DeployChecklistRequest(BaseModel):
    scope: Literal["frontend", "backend", "database", "auth", "all"] = "all"


class ChecklistItem(BaseModel):
    id: str
    label: str
    category: str
    required: bool = True
    done: bool = False
    help_text: Optional[str] = None
    command: Optional[str] = None


class DeployChecklistResponse(BaseModel):
    ok: bool = True
    scope: str
    items: List[ChecklistItem]
    total: int
    completed: int
    progress_pct: int


# ─── Smoke Tests ────────────────────────────────────────────────────────────

class SmokeTestRequest(BaseModel):
    layers: List[str] = ["frontend", "backend", "auth", "database", "ai"]
    backend_url: Optional[str] = None
    frontend_url: Optional[str] = None


class SmokeTestCheck(BaseModel):
    id: str
    layer: str
    name: str
    status: Literal["pass", "fail", "skip", "pending"]
    message: Optional[str] = None
    duration_ms: Optional[int] = None


class SmokeTestResponse(BaseModel):
    ok: bool = True
    total_checks: int
    passed: int
    failed: int
    skipped: int
    checks: List[SmokeTestCheck]
    summary: str


# ─── Cost Baseline ──────────────────────────────────────────────────────────

class CostItem(BaseModel):
    service: str
    provider: str
    tier: str
    monthly_estimate: str
    notes: str
    phase: int = 1


class CostBaselineResponse(BaseModel):
    ok: bool = True
    currency: str = "USD"
    items: List[CostItem]
    total_monthly: str
    total_yearly: str
    assumptions: List[str]
    budget_tiers: Dict[str, str]


# ─── Troubleshooting ───────────────────────────────────────────────────────

class TroubleshootingItem(BaseModel):
    id: str
    category: str
    symptom: str
    probable_cause: str
    fix: str
    severity: Literal["critical", "high", "medium", "low"] = "medium"


class TroubleshootingResponse(BaseModel):
    ok: bool = True
    category: Optional[str] = None
    items: List[TroubleshootingItem]
    total: int


# ─── Health / Ready ─────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    ok: bool = True
    service: str = "wlwai-backend"
    status: str = "healthy"
    timestamp: Optional[str] = None
    version: str = "1.0.0"


class ReadyResponse(BaseModel):
    ok: bool = True
    service: str = "wlwai-backend"
    status: str = "ready"
    checks: Dict[str, bool] = {}
