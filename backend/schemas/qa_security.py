"""Pydantic models for the Sikkerhet og personvern (Security & Privacy)
workbench in the Red Cross Web QA Agent.

Phase H (Pack 2, 2026-05-13) — promotes the existing scan dashboard into a
backend-driven QA surface with stable contracts, persistence and
actionable findings.

Design notes
------------
- Frontend-friendly: every field is a primitive or a list of primitives /
  small objects; no recursive nesting.
- Deterministic IDs: `check_id` is a stable slug (e.g. `security_headers`),
  `finding_id` is derived from `check_id + slugged title` so the same
  finding from the same check yields the same ID across scans (lets the UI
  track status transitions over time).
- Bilingual-aware: `title` and `summary` fields accept either English or
  Norwegian text — the layer above (service) picks based on the `lang`
  parameter when it calls the underlying scan functions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


CheckStatus = Literal["pass", "warn", "fail", "pending"]
Severity = Literal["critical", "high", "medium", "low", "info"]
ScanType = Literal["automatic", "semi-automatic", "manual"]
FindingStatus = Literal["open", "accepted_risk", "fixed", "verified"]
Environment = Literal["local", "test", "staging", "prod"]


def _now_iso() -> str:
    """UTC ISO-8601 timestamp — used everywhere a `*_at` field is written."""
    return datetime.now(timezone.utc).isoformat()


# ───────────────────────────────────────────────────────────────────────────
# Security check (one card on the frontend, one row in the checks list)
# ───────────────────────────────────────────────────────────────────────────

class SecurityCheck(BaseModel):
    """A single security/privacy control, e.g. 'Security headers' or 'GDPR'."""

    id: str = Field(..., description="Stable slug (e.g. 'security_headers').")
    title: str = Field(..., description="Human-readable title in the active language.")
    description: str = Field("", description="One-paragraph context for the operator.")
    category: Literal["security", "privacy", "dpia"] = "security"
    status: CheckStatus = "pending"
    severity: Severity = "low"
    scan_type: ScanType = Field("automatic", alias="scanType")
    summary: str = ""
    findings: List[str] = Field(default_factory=list,
                                 description="List of finding IDs linked to this check.")
    evidence: List[str] = Field(default_factory=list,
                                 description="Short factual statements that backed the verdict.")
    recommendations: List[str] = Field(default_factory=list,
                                        description="Action items if status is WARN/FAIL.")
    source: str = Field("mock", description="Where the check ran (runtime_scan / static / manual).")
    last_run_at: Optional[str] = Field(default=None, alias="lastRunAt")

    class Config:
        populate_by_name = True


# ───────────────────────────────────────────────────────────────────────────
# Finding (one expandable row on the frontend)
# ───────────────────────────────────────────────────────────────────────────

class Finding(BaseModel):
    """A specific, actionable issue. Lives inside one or more checks via
    `check_id`. Findings persist across scan runs so a status change
    (e.g. open → fixed) survives the next scan that re-detects the same issue.
    """

    id: str = Field(..., description="Deterministic ID: '<check_id>::<slug-of-title>'.")
    check_id: str = Field(..., alias="checkId")
    title: str
    severity: Severity = "medium"
    description: str = ""
    recommendation: str = ""
    owner: str = Field("",
                       description="Free-text suggested owner ('frontend', 'devops', "
                                    "'personvernombud', etc.).")
    status: FindingStatus = "open"
    evidence: List[str] = Field(default_factory=list)
    gdpr_article: Optional[str] = Field(default=None, alias="gdprArticle",
                                          description="GDPR article number if relevant (Art. 5, 9, 25, 30, 35...).")
    created_at: str = Field(default_factory=_now_iso, alias="createdAt")
    updated_at: str = Field(default_factory=_now_iso, alias="updatedAt")

    class Config:
        populate_by_name = True


# ───────────────────────────────────────────────────────────────────────────
# Scan run (one row in the scan history panel)
# ───────────────────────────────────────────────────────────────────────────

class ScanRun(BaseModel):
    id: str
    started_at: str = Field(..., alias="startedAt")
    finished_at: str = Field(..., alias="finishedAt")
    pass_count: int = Field(0, alias="passCount")
    warn_count: int = Field(0, alias="warnCount")
    fail_count: int = Field(0, alias="failCount")
    total_checks: int = Field(0, alias="totalChecks")
    environment: Environment = "test"
    trigger: str = Field("manual", description="How the scan was started ('manual', 'ci', 'scheduled').")
    actor: str = Field("anonymous", description="Who triggered the scan.")

    class Config:
        populate_by_name = True


# ───────────────────────────────────────────────────────────────────────────
# DPIA (structured editable form)
# ───────────────────────────────────────────────────────────────────────────

class DpiaForm(BaseModel):
    """Lightweight DPIA model — the Sikkerhet og personvern tab persists this
    once and edits it incrementally. Designed for the rodekors.no rebuild
    context (sensitive volunteer / beredskap / donor data)."""

    id: str = Field("dpia_main", description="Singleton id by default.")
    purpose: str = ""
    data_types: List[str] = Field(default_factory=list, alias="dataTypes")
    sensitive_data: bool = Field(False, alias="sensitiveData")
    storage_location: str = Field("", alias="storageLocation")
    access_roles: List[str] = Field(default_factory=list, alias="accessRoles")
    retention: str = ""
    third_parties: List[str] = Field(default_factory=list, alias="thirdParties")
    legal_basis: str = Field("", alias="legalBasis")
    risk_notes: str = Field("", alias="riskNotes")
    mitigations: List[str] = Field(default_factory=list)
    updated_at: str = Field(default_factory=_now_iso, alias="updatedAt")
    updated_by: str = Field("anonymous", alias="updatedBy")

    class Config:
        populate_by_name = True


# ───────────────────────────────────────────────────────────────────────────
# Request / response wrappers for the router
# ───────────────────────────────────────────────────────────────────────────

class StatusSnapshot(BaseModel):
    """Top-level rollup the frontend shows above the check cards."""

    environment: Environment = "test"
    last_scan_at: Optional[str] = Field(default=None, alias="lastScanAt")
    total_checks: int = Field(0, alias="totalChecks")
    pass_count: int = Field(0, alias="passCount")
    warn_count: int = Field(0, alias="warnCount")
    fail_count: int = Field(0, alias="failCount")
    open_findings: int = Field(0, alias="openFindings")
    overall_status: CheckStatus = Field("pending", alias="overallStatus")
    dpia_present: bool = Field(False, alias="dpiaPresent")

    class Config:
        populate_by_name = True


class ScanRequest(BaseModel):
    environment: Environment = "test"
    lang: Optional[str] = "en"
    actor: Optional[str] = "workshop-host"
    trigger: Optional[str] = "manual"


class FindingPatch(BaseModel):
    """PATCH body for /findings/{id} — every field optional."""

    status: Optional[FindingStatus] = None
    owner: Optional[str] = None
    recommendation: Optional[str] = None
    evidence: Optional[List[str]] = None
    note: Optional[str] = Field(default=None, description="Free-text note added to audit log.")
    actor: Optional[str] = "workshop-host"


class FindingsList(BaseModel):
    items: List[Finding]
    count: int


class ChecksList(BaseModel):
    items: List[SecurityCheck]
    count: int


class HistoryList(BaseModel):
    items: List[ScanRun]
    count: int


class ScanResponse(BaseModel):
    """What POST /scan returns — the run id + a snapshot the UI can render
    without a second roundtrip."""

    scan: ScanRun
    checks: List[SecurityCheck]
    findings: List[Finding]
    snapshot: StatusSnapshot
