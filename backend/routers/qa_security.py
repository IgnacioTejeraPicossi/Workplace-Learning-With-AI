"""Router for the QA Security & Privacy workbench.

Phase H · Pack 2. Mounted at `/api/qa/security` (separate namespace from
`/api/red-cross-qa/*` so the contract is reusable for other agents in the
future, but the only consumer today is the Red Cross Web QA agent's tab 14).

10 endpoints:

  GET    /status                              — rollup snapshot for the dashboard
  GET    /checks                              — list of all checks with status
  GET    /checks/{check_id}                   — full check detail incl. findings
  POST   /scan                                — run a new scan, persist results
  GET    /findings                            — filterable list (status / severity / check)
  PATCH  /findings/{finding_id}               — update status / owner / recommendation
  GET    /history                             — last N scan runs
  GET    /dpia                                — current DPIA form
  POST   /dpia                                — replace DPIA form
  PATCH  /dpia                                — partial update of DPIA form

Backward compatible — the legacy `/api/red-cross-qa/run-security-scan` and
`/api/red-cross-qa/run-dpia-check` endpoints remain untouched.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

try:
    from backend.schemas.qa_security import (
        ScanRequest, FindingPatch, DpiaForm,
        StatusSnapshot, FindingsList, ChecksList, HistoryList,
        ScanResponse, SecurityCheck, Finding, ScanRun,
    )
    from backend.services.qa_security_service import (
        perform_scan, get_status, get_checks, get_check_detail,
        get_findings, update_finding, get_history,
        get_dpia_form, save_dpia, patch_dpia_form, ensure_dpia_seed,
    )
except ImportError:  # pragma: no cover
    from schemas.qa_security import (  # type: ignore
        ScanRequest, FindingPatch, DpiaForm,
        StatusSnapshot, FindingsList, ChecksList, HistoryList,
        ScanResponse, SecurityCheck, Finding, ScanRun,
    )
    from services.qa_security_service import (  # type: ignore
        perform_scan, get_status, get_checks, get_check_detail,
        get_findings, update_finding, get_history,
        get_dpia_form, save_dpia, patch_dpia_form, ensure_dpia_seed,
    )


router = APIRouter(prefix="/api/qa/security",
                    tags=["QA · Security & Privacy"])


# ───────────────────────────────────────────────────────────────────────────
# Rollup + lists
# ───────────────────────────────────────────────────────────────────────────

@router.get("/status")
async def api_status(environment: str = Query("test")) -> Dict[str, Any]:
    """Top-level snapshot — pass/warn/fail counts, open findings, last scan."""
    try:
        return await get_status(environment=environment)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Status read failed: {e}")


@router.get("/checks")
async def api_checks(
    environment: str = Query("test"),
    lang: str = Query("en"),
) -> Dict[str, Any]:
    """All checks with status. If no scan has run yet, triggers one
    transparently so the UI never sees an empty board."""
    try:
        items = await get_checks(environment=environment, lang=lang)
        return {"items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Checks read failed: {e}")


@router.get("/checks/{check_id}")
async def api_check_detail(
    check_id: str,
    environment: str = Query("test"),
    lang: str = Query("en"),
) -> Dict[str, Any]:
    """Full detail for one check: summary, evidence, recommendations,
    findings (full objects, not just IDs)."""
    try:
        doc = await get_check_detail(check_id, environment=environment, lang=lang)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Check '{check_id}' not found")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Check detail read failed: {e}")


# ───────────────────────────────────────────────────────────────────────────
# Scan (POST)
# ───────────────────────────────────────────────────────────────────────────

@router.post("/scan")
async def api_scan(body: ScanRequest) -> Dict[str, Any]:
    """Run the security + DPIA scans, persist a ScanRun + the Findings
    (user-set finding status preserved across re-scans)."""
    try:
        return await perform_scan(
            environment=body.environment or "test",
            lang=body.lang or "en",
            actor=body.actor or "workshop-host",
            trigger=body.trigger or "manual",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scan failed: {e}")


# ───────────────────────────────────────────────────────────────────────────
# Findings (GET filterable + PATCH per finding)
# ───────────────────────────────────────────────────────────────────────────

@router.get("/findings")
async def api_findings(
    status: Optional[str] = Query(default=None,
                                   description="open / accepted_risk / fixed / verified"),
    severity: Optional[str] = Query(default=None),
    check_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
) -> Dict[str, Any]:
    try:
        items = await get_findings(status=status, severity=severity,
                                    check_id=check_id, limit=limit)
        return {"items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Findings read failed: {e}")


@router.patch("/findings/{finding_id}")
async def api_patch_finding(finding_id: str,
                              body: FindingPatch) -> Dict[str, Any]:
    """Update mutable fields on a finding — status, owner, recommendation,
    evidence. Returns 404 if the finding doesn't exist."""
    try:
        updated = await update_finding(
            finding_id,
            patch={
                "status": body.status,
                "owner": body.owner,
                "recommendation": body.recommendation,
                "evidence": body.evidence,
                "note": body.note,
            },
            actor=body.actor or "workshop-host",
        )
        if not updated:
            raise HTTPException(status_code=404,
                                 detail=f"Finding '{finding_id}' not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Finding patch failed: {e}")


# ───────────────────────────────────────────────────────────────────────────
# History
# ───────────────────────────────────────────────────────────────────────────

@router.get("/history")
async def api_history(
    limit: int = Query(default=5, ge=1, le=50),
    environment: Optional[str] = Query(default=None),
) -> Dict[str, Any]:
    try:
        items = await get_history(limit=limit, environment=environment)
        return {"items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"History read failed: {e}")


# ───────────────────────────────────────────────────────────────────────────
# DPIA (singleton)
# ───────────────────────────────────────────────────────────────────────────

@router.get("/dpia")
async def api_get_dpia() -> Dict[str, Any]:
    """Returns the structured DPIA form. Seeds a sensible default on first
    request so the form never loads empty."""
    try:
        existing = await get_dpia_form()
        if existing:
            return existing
        return await ensure_dpia_seed()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DPIA read failed: {e}")


@router.post("/dpia")
async def api_save_dpia(body: DpiaForm) -> Dict[str, Any]:
    """Replace the whole DPIA form."""
    try:
        # `populate_by_name=True` on the schema means callers may send
        # either snake_case or camelCase — pick the dump that matches Mongo.
        return await save_dpia(
            body.model_dump(by_alias=False),
            actor=body.updated_by or "workshop-host",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DPIA save failed: {e}")


@router.patch("/dpia")
async def api_patch_dpia(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Partial update — accepts any subset of DpiaForm fields."""
    try:
        actor = (payload or {}).pop("updated_by", "workshop-host")
        # Tolerate camelCase from the frontend by remapping common keys.
        remap = {
            "dataTypes": "data_types",
            "sensitiveData": "sensitive_data",
            "storageLocation": "storage_location",
            "accessRoles": "access_roles",
            "thirdParties": "third_parties",
            "legalBasis": "legal_basis",
            "riskNotes": "risk_notes",
        }
        clean: Dict[str, Any] = {}
        for k, v in (payload or {}).items():
            clean[remap.get(k, k)] = v
        updated = await patch_dpia_form(clean, actor=actor)
        if not updated:
            # If no DPIA exists yet, treat the patch as the initial save.
            return await save_dpia({**clean, "updated_by": actor},
                                    actor=actor)
        return updated
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DPIA patch failed: {e}")
