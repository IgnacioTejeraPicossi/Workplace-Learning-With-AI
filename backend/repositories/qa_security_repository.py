"""Persistence layer for the QA Security & Privacy workbench.

Phase H (Pack 2). Wraps the three Mongo collections and provides a
small in-memory cache so the module degrades gracefully when Mongo is
unavailable — the workshop demo must keep working even without a DB.

All public methods return plain dicts (never raw Mongo cursors / ObjectIds);
the service / router layers do not need to know about Mongo at all.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    from backend.db import (
        qa_security_scans_collection,
        qa_security_findings_collection,
        qa_security_dpia_collection,
    )
except ImportError:  # pragma: no cover
    from db import (  # type: ignore
        qa_security_scans_collection,
        qa_security_findings_collection,
        qa_security_dpia_collection,
    )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# In-memory fallback caches — keyed at module level so they survive across
# requests in a single backend process. They are intentionally small: scan
# runs are append-only, findings are by ID, DPIA is a singleton.
_mem_scans: List[Dict[str, Any]] = []
_mem_findings: Dict[str, Dict[str, Any]] = {}
_mem_dpia: Optional[Dict[str, Any]] = None


# ───────────────────────────────────────────────────────────────────────────
# Scan runs
# ───────────────────────────────────────────────────────────────────────────

async def insert_scan_run(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Append a scan-run document. Returns the same dict (no _id) regardless
    of whether Mongo accepted the insert."""
    safe = dict(doc)
    try:
        await qa_security_scans_collection.insert_one(dict(safe))
    except Exception:
        pass
    # Always also cache in memory so the most recent runs are queryable
    # even when Mongo write succeeded but we want to avoid a re-fetch.
    _mem_scans.append(safe)
    return safe


async def list_scan_runs(limit: int = 10,
                          environment: Optional[str] = None) -> List[Dict[str, Any]]:
    """Return the most recent scan runs (newest first), optionally filtered
    by environment."""
    out: List[Dict[str, Any]] = []
    try:
        query: Dict[str, Any] = {}
        if environment:
            query["environment"] = environment
        cursor = qa_security_scans_collection.find(query).sort(
            "started_at", -1
        ).limit(int(limit))
        async for doc in cursor:
            doc.pop("_id", None)
            out.append(doc)
    except Exception:
        out = []

    if not out:
        # Fall back to in-memory cache (most recent first).
        mem = [s for s in _mem_scans
                if not environment or s.get("environment") == environment]
        out = list(reversed(mem))[:limit]
    return out


async def latest_scan(environment: Optional[str] = None) -> Optional[Dict[str, Any]]:
    runs = await list_scan_runs(limit=1, environment=environment)
    return runs[0] if runs else None


# ───────────────────────────────────────────────────────────────────────────
# Findings — upsert by deterministic id; preserve user-set status across
# subsequent scans (don't overwrite 'fixed' or 'accepted_risk' just because
# the scanner re-detected the same issue).
# ───────────────────────────────────────────────────────────────────────────

# Statuses set by humans that the upsert must not clobber.
_PROTECTED_STATUSES = {"accepted_risk", "fixed", "verified"}


async def upsert_finding(finding: Dict[str, Any]) -> Dict[str, Any]:
    """Insert or update a finding. Preserves user-set status across scans.

    Strategy:
    - If a finding with this id already exists AND its status is one the
      human deliberately set (`accepted_risk`, `fixed`, `verified`), keep
      the existing status + owner + recommendation. Only refresh title /
      description / severity / evidence / updated_at.
    - Otherwise, write the new doc.
    """
    fid = finding.get("id")
    if not fid:
        return finding

    finding.setdefault("created_at", _now_iso())
    finding["updated_at"] = _now_iso()

    existing = await get_finding(fid)
    if existing and existing.get("status") in _PROTECTED_STATUSES:
        # Merge: keep human decisions, refresh facts from the scan.
        merged = {**existing}
        for key in ("title", "description", "severity", "evidence",
                    "gdpr_article", "updated_at"):
            if key in finding and finding[key] is not None:
                merged[key] = finding[key]
        finding = merged

    try:
        await qa_security_findings_collection.update_one(
            {"id": fid},
            {"$set": dict(finding)},
            upsert=True,
        )
    except Exception:
        pass
    _mem_findings[fid] = finding
    return finding


async def get_finding(finding_id: str) -> Optional[Dict[str, Any]]:
    try:
        doc = await qa_security_findings_collection.find_one({"id": finding_id})
        if doc:
            doc.pop("_id", None)
            return doc
    except Exception:
        pass
    return _mem_findings.get(finding_id)


async def list_findings(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    check_id: Optional[str] = None,
    limit: int = 200,
) -> List[Dict[str, Any]]:
    """Filter by any combo of status / severity / check_id. Newest first."""
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if check_id:
        query["check_id"] = check_id

    out: List[Dict[str, Any]] = []
    try:
        cursor = qa_security_findings_collection.find(query).sort(
            "updated_at", -1
        ).limit(int(limit))
        async for doc in cursor:
            doc.pop("_id", None)
            out.append(doc)
    except Exception:
        out = []

    if not out and _mem_findings:
        cand = list(_mem_findings.values())
        if status:
            cand = [f for f in cand if f.get("status") == status]
        if severity:
            cand = [f for f in cand if f.get("severity") == severity]
        if check_id:
            cand = [f for f in cand if f.get("check_id") == check_id]
        cand.sort(key=lambda f: f.get("updated_at", ""), reverse=True)
        out = cand[:limit]

    return out


async def patch_finding(finding_id: str, patch: Dict[str, Any],
                         actor: str = "anonymous") -> Optional[Dict[str, Any]]:
    """Update mutable fields on a finding. Returns the updated doc, or None
    if it doesn't exist."""
    existing = await get_finding(finding_id)
    if not existing:
        return None

    updated = {**existing}
    for key in ("status", "owner", "recommendation", "evidence"):
        if patch.get(key) is not None:
            updated[key] = patch[key]
    updated["updated_at"] = _now_iso()
    updated["updated_by"] = actor

    # Append an audit-style note if provided (kept inline; we don't add a
    # separate audit collection for findings — KISS for the workshop demo).
    note = (patch.get("note") or "").strip()
    if note:
        history = list(updated.get("history") or [])
        history.append({"at": updated["updated_at"], "actor": actor, "note": note,
                         "status": updated.get("status")})
        updated["history"] = history[-20:]  # keep last 20 audit entries

    try:
        await qa_security_findings_collection.update_one(
            {"id": finding_id},
            {"$set": dict(updated)},
        )
    except Exception:
        pass
    _mem_findings[finding_id] = updated
    return updated


async def count_open_findings() -> int:
    """Quick rollup for the status snapshot."""
    try:
        return int(await qa_security_findings_collection.count_documents(
            {"status": "open"}
        ))
    except Exception:
        return sum(1 for f in _mem_findings.values() if f.get("status") == "open")


# ───────────────────────────────────────────────────────────────────────────
# DPIA — singleton document keyed by id="dpia_main".
# ───────────────────────────────────────────────────────────────────────────

DEFAULT_DPIA_ID = "dpia_main"


async def get_dpia(dpia_id: str = DEFAULT_DPIA_ID) -> Optional[Dict[str, Any]]:
    try:
        doc = await qa_security_dpia_collection.find_one({"id": dpia_id})
        if doc:
            doc.pop("_id", None)
            return doc
    except Exception:
        pass
    global _mem_dpia
    if _mem_dpia and _mem_dpia.get("id") == dpia_id:
        return dict(_mem_dpia)
    return None


async def upsert_dpia(payload: Dict[str, Any]) -> Dict[str, Any]:
    doc = dict(payload)
    doc.setdefault("id", DEFAULT_DPIA_ID)
    doc["updated_at"] = _now_iso()
    try:
        await qa_security_dpia_collection.update_one(
            {"id": doc["id"]},
            {"$set": dict(doc)},
            upsert=True,
        )
    except Exception:
        pass
    global _mem_dpia
    _mem_dpia = doc
    return doc


async def patch_dpia(patch: Dict[str, Any],
                      dpia_id: str = DEFAULT_DPIA_ID) -> Optional[Dict[str, Any]]:
    existing = await get_dpia(dpia_id)
    if not existing:
        return None
    # Selective merge — only keys provided in the patch are updated.
    merged = {**existing}
    for k, v in patch.items():
        if v is not None:
            merged[k] = v
    return await upsert_dpia(merged)
