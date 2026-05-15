"""Service layer for the QA Security & Privacy workbench (Phase H · Pack 2).

Sits on top of the existing `run_security_scan` + `run_dpia_check` raw
scanners in `red_cross_qa.py`. The new service:

  1. Calls the raw scanners to get the latest check + finding data.
  2. Maps that data into the stable SecurityCheck / Finding shapes
     defined in `backend/schemas/qa_security.py`.
  3. Persists a ScanRun document plus one Finding doc per actionable
     issue via `backend/repositories/qa_security_repository.py`.
  4. Preserves user-set finding status (`accepted_risk`, `fixed`,
     `verified`) across re-scans via the repository's protected-status
     logic.

Why a separate service?
-----------------------
- `red_cross_qa_service` is huge and stateless. Pack 2 adds persistence
  and a stable contract that other parts of the system (Sprint Report,
  ADO dispatch) can consume. Keeping it in its own module keeps the
  responsibilities clean.
- The legacy `/api/red-cross-qa/run-security-scan` and
  `/api/red-cross-qa/run-dpia-check` endpoints remain untouched —
  backward compatible.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from backend.repositories.qa_security_repository import (
        insert_scan_run, list_scan_runs, latest_scan,
        upsert_finding, get_finding, list_findings, patch_finding,
        count_open_findings,
        get_dpia, upsert_dpia, patch_dpia, DEFAULT_DPIA_ID,
    )
    from backend.services.red_cross_qa import (
        run_security_scan as _raw_security_scan,
        run_dpia_check as _raw_dpia_check,
    )
except ImportError:  # pragma: no cover
    from repositories.qa_security_repository import (  # type: ignore
        insert_scan_run, list_scan_runs, latest_scan,
        upsert_finding, get_finding, list_findings, patch_finding,
        count_open_findings,
        get_dpia, upsert_dpia, patch_dpia, DEFAULT_DPIA_ID,
    )
    from services.red_cross_qa import (  # type: ignore
        run_security_scan as _raw_security_scan,
        run_dpia_check as _raw_dpia_check,
    )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ───────────────────────────────────────────────────────────────────────────
# Static catalogue of checks. Maps the raw `checkXxx` keys returned by the
# legacy scanners to the rich SecurityCheck shape. Keeping this static
# (instead of LLM-generated) means the catalogue is deterministic, the
# UI knows exactly which cards exist before any scan has run, and we can
# tag scan_type / category per check.
# ───────────────────────────────────────────────────────────────────────────

_SECURITY_CHECK_CATALOGUE: Dict[str, Dict[str, Any]] = {
    # ── 13 baseline security/privacy checks (existing in `run_security_scan`) ──
    "checkPersonalData": {
        "id": "personal_data",
        "title": "PII in CMS content",
        "description": "Verifies that editorial CMS content does not contain personally identifiable information by mistake.",
        "category": "privacy",
        "scan_type": "automatic",
    },
    "checkDataSeparation": {
        "id": "data_separation",
        "title": "Public vs non-public data separation",
        "description": "Public CMS data must never leak into authenticated APIs or vice versa.",
        "category": "security",
        "scan_type": "semi-automatic",
    },
    "checkAuth": {
        "id": "auth",
        "title": "Authentication flow",
        "description": "Login + SSO + session lifecycle for the 6 editorial roles.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkHeaders": {
        "id": "security_headers",
        "title": "Security headers",
        "description": "CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkOwasp": {
        "id": "owasp_top10",
        "title": "OWASP Top 10",
        "description": "Spot-checks against OWASP Top 10 2021 (injection, broken access, etc.).",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkFormAbuse": {
        "id": "form_abuse",
        "title": "Form abuse / bot protection",
        "description": "Captcha, rate limit, honeypot on contact / donation / volunteer forms.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkApiAbuse": {
        "id": "api_abuse",
        "title": "API abuse",
        "description": "Open APIs without auth, mass scraping, parameter tampering.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkRateLimit": {
        "id": "rate_limit",
        "title": "Rate limits",
        "description": "Per-endpoint quotas; donation API must withstand campaign peaks.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkSecrets": {
        "id": "secrets",
        "title": "Secrets exposure",
        "description": "API keys, tokens, connection strings exposed in code, env or response headers.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkDeps": {
        "id": "deps_vulnerabilities",
        "title": "Dependency vulnerabilities",
        "description": "Known CVEs in npm / pip / Maven / Gradle dependency trees.",
        "category": "security",
        "scan_type": "automatic",
    },
    "checkLogging": {
        "id": "logging",
        "title": "Logging hygiene",
        "description": "No PII / secrets in logs; correlation IDs present; retention enforced.",
        "category": "security",
        "scan_type": "semi-automatic",
    },
    "checkConsent": {
        "id": "consent_cookies",
        "title": "Consent & cookies",
        "description": "Cookie banner behaviour, granular consent, no tracking before opt-in.",
        "category": "privacy",
        "scan_type": "semi-automatic",
    },
    "checkGdpr": {
        "id": "gdpr_baseline",
        "title": "GDPR baseline",
        "description": "Personvernerklæring up to date, data subject rights flow exists, breach notification ready.",
        "category": "privacy",
        "scan_type": "manual",
    },

    # ── 12 DPIA checks (existing in `run_dpia_check`) ──
    "checkDataMapping": {
        "id": "dpia_data_mapping",
        "title": "Data mapping",
        "description": "All flows of personal data are documented (Art. 30).",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkPurposeLimitation": {
        "id": "dpia_purpose",
        "title": "Purpose limitation",
        "description": "Personal data is not reused for incompatible purposes (Art. 5(1)(b)).",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkLegalBasis": {
        "id": "dpia_legal_basis",
        "title": "Legal basis",
        "description": "Each processing has a documented Art. 6 (and Art. 9 for sensitive) basis.",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkDataMinimization": {
        "id": "dpia_minimization",
        "title": "Data minimization",
        "description": "Only data necessary for the purpose is collected (Art. 5(1)(c)).",
        "category": "dpia",
        "scan_type": "semi-automatic",
    },
    "checkRetentionPolicy": {
        "id": "dpia_retention",
        "title": "Retention policy",
        "description": "Documented retention periods per category (Art. 5(1)(e)).",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkDeletionRoutines": {
        "id": "dpia_deletion",
        "title": "Automated deletion routines",
        "description": "Scheduled deletion / anonymization at end of retention.",
        "category": "dpia",
        "scan_type": "semi-automatic",
    },
    "checkConsentRecords": {
        "id": "dpia_consent_records",
        "title": "Consent records",
        "description": "Timestamp + consent text version + scope stored per data subject.",
        "category": "dpia",
        "scan_type": "semi-automatic",
    },
    "checkDataSubjectRights": {
        "id": "dpia_subject_rights",
        "title": "Data subject rights",
        "description": "Innsyn / sletting / retting / dataportabilitet — documented flow.",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkProcessorRegister": {
        "id": "dpia_processor_register",
        "title": "Processor register",
        "description": "DPA register lists every processor / sub-processor (Art. 28 + 30).",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkCrossBorderTransfer": {
        "id": "dpia_cross_border",
        "title": "Cross-border transfers",
        "description": "Any transfer outside EU/EEA has SCC / adequacy decision.",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkBreachNotification": {
        "id": "dpia_breach_notif",
        "title": "Breach notification readiness",
        "description": "72h Datatilsynet notification process + on-call documented (Art. 33).",
        "category": "dpia",
        "scan_type": "manual",
    },
    "checkSensitiveCategories": {
        "id": "dpia_sensitive_art9",
        "title": "Sensitive categories (Art. 9)",
        "description": "Helseerklæring, politiattest, beredskap data — extra protection.",
        "category": "dpia",
        "scan_type": "semi-automatic",
    },
}


def _slug(text: str) -> str:
    """Lowercased ascii slug for IDs."""
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or "item"


def _build_check(raw_key: str, raw_value: Dict[str, Any],
                 lang: str = "en") -> Dict[str, Any]:
    """Map a (`checkHeaders`, {status, note}) pair to the rich SecurityCheck."""
    cat = _SECURITY_CHECK_CATALOGUE.get(raw_key, {})
    status = (raw_value or {}).get("status", "pending")
    note = (raw_value or {}).get("note", "")
    # Severity defaults per status — service can refine per check later.
    sev_map = {"fail": "high", "warn": "medium", "pass": "low",
                "pending": "info"}
    severity = (raw_value or {}).get("severity") or sev_map.get(status, "low")

    return {
        "id": cat.get("id") or _slug(raw_key),
        "title": cat.get("title") or raw_key,
        "description": cat.get("description", ""),
        "category": cat.get("category", "security"),
        "status": status,
        "severity": severity,
        "scan_type": cat.get("scan_type", "automatic"),
        "summary": note,
        "findings": [],   # populated after finding mapping
        "evidence": [note] if note else [],
        "recommendations": [],  # populated below if WARN/FAIL
        "source": cat.get("source", "mock_scan"),
        "last_run_at": _now_iso(),
    }


def _finding_id(check_id: str, title: str) -> str:
    """Deterministic so that re-detecting the same issue updates the SAME
    finding row (not a new one each scan)."""
    return f"{check_id}::{_slug(title)}"


def _map_raw_findings_to_findings(
    raw_findings: List[Dict[str, Any]],
    checks_by_id: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Convert raw `findings: [{severity, title, message, ...}]` into the
    rich Finding shape, attaching them to the right check by matching
    against the check's `summary` / id heuristically."""

    out: List[Dict[str, Any]] = []
    for raw in raw_findings or []:
        title = (raw.get("title") or "").strip() or "Untitled finding"
        severity = raw.get("severity") or "medium"
        message = raw.get("message") or ""
        fix_hint = raw.get("fix_hint") or raw.get("recommendation") or ""

        # Best-effort linking: match against any check whose summary contains
        # the first 2 words of the finding title; otherwise generic bucket.
        target_check_id = _guess_check_for_finding(title, message, checks_by_id)

        fid = _finding_id(target_check_id, title)
        finding = {
            "id": fid,
            "check_id": target_check_id,
            "title": title,
            "severity": severity,
            "description": message,
            "recommendation": fix_hint,
            "owner": raw.get("owner") or _suggest_owner(severity, target_check_id),
            "status": "open",
            "evidence": list(raw.get("evidence") or ([message] if message else [])),
            "gdpr_article": raw.get("gdpr_article"),
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }
        out.append(finding)
    return out


def _guess_check_for_finding(title: str, message: str,
                              checks_by_id: Dict[str, Dict[str, Any]]) -> str:
    """Very simple keyword routing — covers the canonical cases."""
    text = f"{title} {message}".lower()
    rules = [
        ("csp", "security_headers"),
        ("header", "security_headers"),
        ("rate", "rate_limit"),
        ("rate limit", "rate_limit"),
        ("dependency", "deps_vulnerabilities"),
        ("lodash", "deps_vulnerabilities"),
        ("cve", "deps_vulnerabilities"),
        ("secret", "secrets"),
        ("api key", "secrets"),
        ("cookie", "consent_cookies"),
        ("consent", "consent_cookies"),
        ("personal data", "personal_data"),
        ("pii", "personal_data"),
        ("auth", "auth"),
        ("login", "auth"),
        ("form", "form_abuse"),
        ("captcha", "form_abuse"),
        ("helseerkl", "dpia_sensitive_art9"),
        ("politi", "dpia_sensitive_art9"),
        ("art. 9", "dpia_sensitive_art9"),
        ("art. 30", "dpia_processor_register"),
        ("art. 28", "dpia_processor_register"),
        ("dpa", "dpia_processor_register"),
        ("retention", "dpia_retention"),
        ("deletion", "dpia_deletion"),
        ("art. 5", "dpia_minimization"),
        ("breach", "dpia_breach_notif"),
        ("cross-border", "dpia_cross_border"),
        ("transfer", "dpia_cross_border"),
        ("consent record", "dpia_consent_records"),
        ("innsyn", "dpia_subject_rights"),
        ("sletting", "dpia_subject_rights"),
        ("legal basis", "dpia_legal_basis"),
        ("purpose", "dpia_purpose"),
        ("data mapping", "dpia_data_mapping"),
    ]
    for kw, target in rules:
        if kw in text and target in checks_by_id:
            return target
    # Fallback: first check in the catalogue.
    return next(iter(checks_by_id.keys()), "security_headers")


def _suggest_owner(severity: str, check_id: str) -> str:
    """Cheap default — better than empty. The human can override via PATCH."""
    if check_id.startswith("dpia_"):
        return "personvernombud"
    if check_id in ("security_headers", "auth", "secrets",
                    "deps_vulnerabilities"):
        return "devops"
    if check_id in ("form_abuse", "rate_limit", "api_abuse"):
        return "backend"
    if check_id in ("consent_cookies", "personal_data"):
        return "redaksjon"
    return severity == "high" and "devops" or "frontend"


# ───────────────────────────────────────────────────────────────────────────
# Public API
# ───────────────────────────────────────────────────────────────────────────

async def perform_scan(environment: str = "test", lang: str = "en",
                        actor: str = "anonymous",
                        trigger: str = "manual") -> Dict[str, Any]:
    """Run the security + DPIA scans, build SecurityChecks + Findings,
    persist a ScanRun + the Findings (preserving user-set statuses)."""

    started_at = _now_iso()

    # 1) Call existing scanners — these are mock-first and never raise.
    sec = await _raw_security_scan(environment, lang)
    dpia = await _raw_dpia_check(environment, lang)

    # 2) Merge raw checks into the rich shape.
    raw_checks: Dict[str, Dict[str, Any]] = {}
    raw_checks.update(sec.get("checks") or {})
    raw_checks.update(dpia.get("checks") or {})

    rich_checks: List[Dict[str, Any]] = []
    rich_by_id: Dict[str, Dict[str, Any]] = {}
    for raw_key, raw_value in raw_checks.items():
        c = _build_check(raw_key, raw_value, lang)
        rich_checks.append(c)
        rich_by_id[c["id"]] = c

    # 3) Map raw findings → rich Findings, attach to their checks.
    raw_findings: List[Dict[str, Any]] = []
    raw_findings.extend(sec.get("findings") or [])
    raw_findings.extend(dpia.get("findings") or [])
    rich_findings = _map_raw_findings_to_findings(raw_findings, rich_by_id)

    # 3b) Synthesize a generic finding for every WARN/FAIL check that didn't
    # produce one explicitly — keeps the findings list aligned with the
    # status board so nothing is "invisible".
    explicit_check_ids = {f["check_id"] for f in rich_findings}
    for c in rich_checks:
        if c["status"] in ("warn", "fail") and c["id"] not in explicit_check_ids:
            title = c["summary"] or c["title"]
            fid = _finding_id(c["id"], title)
            rich_findings.append({
                "id": fid,
                "check_id": c["id"],
                "title": title,
                "severity": c["severity"],
                "description": c["summary"] or "",
                "recommendation": "",
                "owner": _suggest_owner(c["severity"], c["id"]),
                "status": "open",
                "evidence": list(c["evidence"]),
                "gdpr_article": None,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            })

    # 3c) Walk findings → upsert via repo so user-set status is preserved.
    persisted_findings: List[Dict[str, Any]] = []
    for f in rich_findings:
        saved = await upsert_finding(dict(f))
        persisted_findings.append(saved)

    # 3d) Backfill each check's `findings` list + `recommendations` from
    # whichever findings just got persisted.
    for c in rich_checks:
        c["findings"] = [f["id"] for f in persisted_findings
                          if f.get("check_id") == c["id"]]
        recs = [f.get("recommendation") for f in persisted_findings
                if f.get("check_id") == c["id"] and f.get("recommendation")]
        c["recommendations"] = list(dict.fromkeys([r for r in recs if r]))[:5]

    # 4) Build & persist a ScanRun row.
    finished_at = _now_iso()
    counts = _tally(rich_checks)
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"

    # Pack 4.1 — capture a minimal snapshot of every finding's state at
    # this exact scan boundary. `diff_scans` will use it for precise
    # set-difference + status-transition logic instead of timestamp
    # approximation. Kept small (5 fields per row) so 50 findings ≈ 5KB.
    findings_snapshot = [
        {
            "id": f.get("id"),
            "check_id": f.get("check_id"),
            "title": (f.get("title") or "")[:200],
            "severity": f.get("severity") or "info",
            "status": f.get("status") or "open",
        }
        for f in persisted_findings
        if f.get("id")
    ]

    run_doc = {
        "id": scan_id,
        "started_at": started_at,
        "finished_at": finished_at,
        "pass_count": counts["pass"],
        "warn_count": counts["warn"],
        "fail_count": counts["fail"],
        "total_checks": len(rich_checks),
        "environment": environment,
        "trigger": trigger,
        "actor": actor,
        "findings_snapshot": findings_snapshot,
    }
    await insert_scan_run(run_doc)

    # 5) Build a status snapshot the UI can render without a 2nd call.
    snapshot = await _build_snapshot(environment, rich_checks, run_doc)

    return {
        "scan": run_doc,
        "checks": rich_checks,
        "findings": persisted_findings,
        "snapshot": snapshot,
    }


async def get_status(environment: str = "test") -> Dict[str, Any]:
    """Top-level rollup for the dashboard. Reads from persisted data only;
    does NOT trigger a scan."""
    latest = await latest_scan(environment)
    if not latest:
        # No scans yet — return an empty-but-valid snapshot.
        return {
            "environment": environment,
            "last_scan_at": None,
            "total_checks": 0,
            "pass_count": 0,
            "warn_count": 0,
            "fail_count": 0,
            "open_findings": 0,
            "overall_status": "pending",
            "dpia_present": (await get_dpia()) is not None,
        }
    return {
        "environment": environment,
        "last_scan_at": latest.get("finished_at"),
        "total_checks": int(latest.get("total_checks") or 0),
        "pass_count": int(latest.get("pass_count") or 0),
        "warn_count": int(latest.get("warn_count") or 0),
        "fail_count": int(latest.get("fail_count") or 0),
        "open_findings": await count_open_findings(),
        "overall_status": _overall_status(latest),
        "dpia_present": (await get_dpia()) is not None,
    }


async def get_checks(environment: str = "test",
                      lang: str = "en") -> List[Dict[str, Any]]:
    """Returns the latest known shape of every check. If no scan has run,
    performs one transparently so the UI never sees an empty list."""
    latest = await latest_scan(environment)
    if not latest:
        out = await perform_scan(environment=environment, lang=lang,
                                  actor="auto", trigger="auto-warmup")
        return out["checks"]
    # We don't store the full checks-snapshot on the scan run yet (would
    # bloat the doc). Re-derive from the raw scanners — they're mock-first
    # and fast.
    sec = await _raw_security_scan(environment, lang)
    dpia = await _raw_dpia_check(environment, lang)
    raw_checks = {**(sec.get("checks") or {}), **(dpia.get("checks") or {})}

    rich = []
    by_id = {}
    for k, v in raw_checks.items():
        c = _build_check(k, v, lang)
        rich.append(c)
        by_id[c["id"]] = c
    # Backfill findings list per check from persisted data.
    all_findings = await list_findings(limit=500)
    for c in rich:
        c["findings"] = [f["id"] for f in all_findings
                          if f.get("check_id") == c["id"]]
    return rich


async def get_check_detail(check_id: str, environment: str = "test",
                            lang: str = "en") -> Optional[Dict[str, Any]]:
    checks = await get_checks(environment, lang)
    found = next((c for c in checks if c.get("id") == check_id), None)
    if not found:
        return None
    related = await list_findings(check_id=check_id, limit=50)
    found["findings_detail"] = related
    return found


async def get_findings(status: Optional[str] = None,
                        severity: Optional[str] = None,
                        check_id: Optional[str] = None,
                        limit: int = 200) -> List[Dict[str, Any]]:
    return await list_findings(status=status, severity=severity,
                                check_id=check_id, limit=limit)


async def update_finding(finding_id: str, patch: Dict[str, Any],
                          actor: str = "anonymous") -> Optional[Dict[str, Any]]:
    return await patch_finding(finding_id, patch, actor=actor)


async def get_history(limit: int = 5,
                       environment: Optional[str] = None) -> List[Dict[str, Any]]:
    return await list_scan_runs(limit=limit, environment=environment)


# ── DPIA -------------------------------------------------------------------

async def get_dpia_form() -> Optional[Dict[str, Any]]:
    return await get_dpia()


async def save_dpia(payload: Dict[str, Any],
                     actor: str = "anonymous") -> Dict[str, Any]:
    payload = dict(payload)
    payload["updated_by"] = actor
    return await upsert_dpia(payload)


async def patch_dpia_form(payload: Dict[str, Any],
                           actor: str = "anonymous") -> Optional[Dict[str, Any]]:
    payload = dict(payload)
    payload["updated_by"] = actor
    return await patch_dpia(payload)


# Bootstrap default DPIA seed when none exists — lets the form load
# something non-empty on first visit. Called by the router on GET /dpia
# when the collection is empty.
async def ensure_dpia_seed(actor: str = "system") -> Dict[str, Any]:
    existing = await get_dpia()
    if existing:
        return existing
    seed = {
        "id": DEFAULT_DPIA_ID,
        "purpose": "Informasjon, kontakt og støttefunksjoner for rodekors.no",
        "data_types": ["navn", "epost", "telefon", "fritekst", "donasjon"],
        "sensitive_data": True,
        "storage_location": "Enonic XP + Fundy + Vipps + Microsoft Dataverse + Okta",
        "access_roles": ["redaktør", "admin", "systemforvalter", "personvernombud"],
        "retention": "Per skjema/formål — donor 7 år (bokføringsloven); volontør 3 år inaktiv → anonymiser",
        "third_parties": ["Fundy", "Vipps", "Microsoft", "Okta", "Enonic"],
        "legal_basis": "Art. 6(1)(a) samtykke (donasjon) + Art. 6(1)(f) berettiget interesse (frivillig) + Art. 9(2)(d) helsedata",
        "risk_notes": "Helseerklæring + politiattest = Art. 9-data. Krever ekstra beskyttelse.",
        "mitigations": ["Dataminimering", "Tilgangsstyring (RBAC)",
                         "Slettepolicy (automatisert)",
                         "Ingen PII i logger",
                         "DPA med alle databehandlere (Fundy DPA mangler — åpen finding)"],
        "updated_by": actor,
    }
    return await upsert_dpia(seed)


# ───────────────────────────────────────────────────────────────────────────
# Internals
# ───────────────────────────────────────────────────────────────────────────

def _tally(checks: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = {"pass": 0, "warn": 0, "fail": 0, "pending": 0}
    for c in checks:
        st = (c or {}).get("status", "pending")
        counts[st] = counts.get(st, 0) + 1
    return counts


def _overall_status(run: Dict[str, Any]) -> str:
    if int(run.get("fail_count") or 0) > 0:
        return "fail"
    if int(run.get("warn_count") or 0) > 0:
        return "warn"
    if int(run.get("pass_count") or 0) > 0:
        return "pass"
    return "pending"


async def _build_snapshot(environment: str, checks: List[Dict[str, Any]],
                           run: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "environment": environment,
        "last_scan_at": run.get("finished_at"),
        "total_checks": len(checks),
        "pass_count": int(run.get("pass_count") or 0),
        "warn_count": int(run.get("warn_count") or 0),
        "fail_count": int(run.get("fail_count") or 0),
        "open_findings": await count_open_findings(),
        "overall_status": _overall_status(run),
        "dpia_present": (await get_dpia()) is not None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Pack 3 (Phase H+) — five workflow extensions on top of Pack 2:
#   1. export_markdown_report  — sprint-ready markdown of findings + DPIA
#   2. dispatch_finding_to_ado — single-finding ADO work item creation
#   3. diff_scans              — {new, fixed, regressed, persisted} diff
#   4. verify_finding          — re-run linked check, transition status
#   5. get_environment_matrix  — status across local / test / staging / prod
# ═══════════════════════════════════════════════════════════════════════════


# ───────────────────────────────────────────────────────────────────────────
# 1) Markdown export — composes a structured sprint-ready report.
# ───────────────────────────────────────────────────────────────────────────

async def export_markdown_report(
    environment: str = "test",
    include_dpia: bool = True,
    include_history: bool = True,
    sprint_name: Optional[str] = None,
    lang: str = "en",
) -> Dict[str, Any]:
    """Generate a Markdown report covering: snapshot, open findings grouped
    by severity, all findings table, last 5 scan runs, DPIA snapshot.
    Returns {filename, markdown, byte_count}."""

    status = await get_status(environment=environment)
    findings = await list_findings(limit=500)
    history = await list_scan_runs(limit=5, environment=environment)
    dpia = await get_dpia() if include_dpia else None

    sprint_label = sprint_name or environment or "current"
    title = f"Sikkerhet og personvern — sprint report · {sprint_label}"
    lines: List[str] = [
        f"# {title}",
        "",
        f"_Generated {_now_iso()} · environment: **{environment}**_",
        "",
        "## 1) Status snapshot",
        "",
        f"- Last scan: **{status.get('last_scan_at') or 'never'}**",
        f"- Overall status: **{status.get('overall_status', 'pending').upper()}**",
        f"- Total checks: **{status.get('total_checks', 0)}**",
        f"- PASS: {status.get('pass_count', 0)} · WARN: {status.get('warn_count', 0)} · FAIL: {status.get('fail_count', 0)}",
        f"- Open findings: **{status.get('open_findings', 0)}**",
        f"- DPIA present: **{'yes' if status.get('dpia_present') else 'no'}**",
        "",
    ]

    # ── Findings grouped by severity (critical → low) ─────────────────
    lines.append("## 2) Findings by severity")
    lines.append("")
    severity_order = ["critical", "high", "medium", "low", "info"]
    by_sev = {s: [] for s in severity_order}
    for f in findings:
        s = f.get("severity") or "info"
        by_sev.setdefault(s, []).append(f)
    for sev in severity_order:
        items = by_sev.get(sev) or []
        if not items:
            continue
        lines.append(f"### {sev.upper()} ({len(items)})")
        lines.append("")
        for f in items:
            status_lbl = (f.get("status") or "open").replace("_", " ")
            lines.append(f"- **{f.get('title','-')}** — `{f.get('check_id','-')}` · "
                          f"status: _{status_lbl}_ · owner: {f.get('owner') or '_unassigned_'}")
            if f.get("description"):
                lines.append(f"  - {f['description']}")
            if f.get("recommendation"):
                lines.append(f"  - **Recommendation:** {f['recommendation']}")
            if f.get("gdpr_article"):
                lines.append(f"  - GDPR: {f['gdpr_article']}")
        lines.append("")

    # ── Compact tally table ──────────────────────────────────────────
    lines.append("## 3) Findings tally (all statuses)")
    lines.append("")
    lines.append("| Status | Count |")
    lines.append("|---|---|")
    by_status: Dict[str, int] = {}
    for f in findings:
        s = f.get("status") or "open"
        by_status[s] = by_status.get(s, 0) + 1
    for s, c in sorted(by_status.items(), key=lambda x: -x[1]):
        lines.append(f"| {s.replace('_', ' ')} | {c} |")
    lines.append("")

    if include_history and history:
        lines.append("## 4) Scan history (last 5)")
        lines.append("")
        lines.append("| Started | Pass | Warn | Fail | Env | Trigger |")
        lines.append("|---|---|---|---|---|---|")
        for r in history:
            lines.append(f"| {r.get('started_at','')} | {r.get('pass_count', 0)} | "
                          f"{r.get('warn_count', 0)} | {r.get('fail_count', 0)} | "
                          f"{r.get('environment','')} | {r.get('trigger','')} |")
        lines.append("")

    if include_dpia and dpia:
        lines.append("## 5) DPIA snapshot")
        lines.append("")
        lines.append(f"- **Purpose:** {dpia.get('purpose') or '_(not set)_'}")
        lines.append(f"- **Sensitive data (Art. 9):** {'yes' if dpia.get('sensitive_data') else 'no'}")
        lines.append(f"- **Storage location:** {dpia.get('storage_location') or '—'}")
        lines.append(f"- **Retention:** {dpia.get('retention') or '—'}")
        lines.append(f"- **Legal basis:** {dpia.get('legal_basis') or '—'}")
        for label, key in [
            ("Data types",     "data_types"),
            ("Access roles",   "access_roles"),
            ("Third parties",  "third_parties"),
            ("Mitigations",    "mitigations"),
        ]:
            vals = dpia.get(key) or []
            if vals:
                lines.append(f"- **{label}:** {', '.join(vals)}")
        if dpia.get("risk_notes"):
            lines.append("")
            lines.append(f"> **Risk notes:** {dpia['risk_notes']}")
        lines.append("")
        lines.append(f"_DPIA last updated: {dpia.get('updated_at','—')} · "
                      f"by: {dpia.get('updated_by','—')}_")
        lines.append("")

    lines.append("---")
    lines.append("_Generated by Red Cross Web QA Agent · Sikkerhet og personvern · Pack 3 · markdown export_")

    markdown = "\n".join(lines)
    filename = f"sikkerhet-personvern-{environment}-{_slug(sprint_label)}.md"

    return {
        "filename": filename,
        "markdown": markdown,
        "byte_count": len(markdown.encode("utf-8")),
        "environment": environment,
        "generated_at": _now_iso(),
    }


# ───────────────────────────────────────────────────────────────────────────
# 2) Single-finding ADO dispatch — reuses existing red_cross_qa dispatcher.
# ───────────────────────────────────────────────────────────────────────────

# Severity → ADO priority + work_item_type mapping (Trine §8.1).
_SEV_TO_ADO = {
    "critical": {"priority": 1, "work_item_type": "Bug",       "severity_dev": "Sev 1"},
    "high":     {"priority": 2, "work_item_type": "Bug",       "severity_dev": "Sev 2"},
    "medium":   {"priority": 3, "work_item_type": "Task",      "severity_dev": "Sev 3"},
    "low":      {"priority": 4, "work_item_type": "Task",      "severity_dev": "Sev 4"},
    "info":     {"priority": 4, "work_item_type": "Task",      "severity_dev": "Sev 4"},
}


def _build_ado_description_md(finding: Dict[str, Any], finding_id: str) -> str:
    """Compose the Markdown body used in BOTH the mock and the real ADO
    work-item payload. Keeping a single source of truth makes the mock
    indistinguishable from the live dispatch for review purposes."""
    parts = [
        f"**Finding ID:** `{finding_id}`",
        f"**Check:** `{finding.get('check_id', '—')}`",
        f"**Description:** {finding.get('description', '')}",
        f"**Recommendation:** {finding.get('recommendation', '')}",
        "**Evidence:**\n" + "\n".join(
            [f"- {e}" for e in (finding.get('evidence') or [])]
        ),
    ]
    if finding.get("gdpr_article"):
        parts.append(f"**GDPR article:** {finding['gdpr_article']}")
    return "\n\n".join(parts)


def _build_ado_json_patch(
    finding: Dict[str, Any],
    finding_id: str,
    ado_meta: Dict[str, Any],
    area_path: Optional[str],
    iteration_path: Optional[str],
    tags: List[str],
) -> List[Dict[str, Any]]:
    """Build the JSON-Patch document the ADO REST API expects on
    `POST /_apis/wit/workitems/${type}`. Each operation targets a single
    work-item field — same shape `az boards work-item create` produces.
    """
    title = f"[QA Security] {finding.get('title', 'Untitled finding')}"
    desc_md = _build_ado_description_md(finding, finding_id)
    patch: List[Dict[str, Any]] = [
        {"op": "add", "path": "/fields/System.Title", "value": title},
        {"op": "add", "path": "/fields/System.Description",
          "value": desc_md.replace("\n", "<br/>")},
        {"op": "add", "path": "/fields/Microsoft.VSTS.Common.Priority",
          "value": ado_meta["priority"]},
        {"op": "add", "path": "/fields/Microsoft.VSTS.Common.Severity",
          "value": ado_meta["severity_dev"]},
        {"op": "add", "path": "/fields/System.Tags",
          "value": "; ".join(tags)},
    ]
    if area_path:
        patch.append({"op": "add", "path": "/fields/System.AreaPath",
                       "value": area_path})
    if iteration_path:
        patch.append({"op": "add", "path": "/fields/System.IterationPath",
                       "value": iteration_path})
    return patch


async def _dispatch_via_ado_rest(
    pat: str,
    org: str,
    project: str,
    work_item_type: str,
    json_patch: List[Dict[str, Any]],
) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """Pack 4.2 — call the real ADO REST API to create a work item.

    Returns `(work_item_id, work_item_url, error_message)`. On any
    exception or non-2xx response, `work_item_id` is None and
    `error_message` is set; the caller falls back to the deterministic
    mock path so the UX never breaks.

    Auth: HTTP Basic with empty user + PAT as password
          (`Authorization: Basic base64(":<PAT>")`).
    Endpoint:
        POST https://dev.azure.com/{org}/{project}/_apis/wit/workitems/${type}
             ?api-version=7.0
    Content-Type: application/json-patch+json
    """
    import base64

    try:
        import httpx  # httpx==0.25.2 is already in backend/requirements.txt
    except ImportError:
        return None, None, "httpx not installed"

    # Empty user, PAT as password — same format `az` and `curl --user :PAT` use.
    token_bytes = f":{pat}".encode("utf-8")
    basic_auth = base64.b64encode(token_bytes).decode("ascii")
    # ADO requires the work item type prefixed with `$` (URL-encoded `%24`).
    from urllib.parse import quote
    safe_type = quote(work_item_type, safe="")
    endpoint = (f"https://dev.azure.com/{org}/{project}"
                  f"/_apis/wit/workitems/${safe_type}?api-version=7.0")

    headers = {
        "Authorization": f"Basic {basic_auth}",
        "Content-Type": "application/json-patch+json",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, headers=headers,
                                       json=json_patch)
        if resp.status_code < 200 or resp.status_code >= 300:
            return None, None, (f"ADO REST returned {resp.status_code}: "
                                  f"{resp.text[:200]}")
        body = resp.json()
        wi_id = body.get("id")
        wi_url = (body.get("_links") or {}).get("html", {}).get("href")
        return wi_id, wi_url, None
    except Exception as exc:  # pragma: no cover — defensive
        return None, None, f"{type(exc).__name__}: {exc}"


async def dispatch_finding_to_ado(
    finding_id: str,
    environment: str = "test",
    actor: str = "workshop-host",
    lang: str = "en",
) -> Dict[str, Any]:
    """Push a single finding to Azure DevOps as a work item.

    Pack 4.2 — when the `ADO_PAT` environment variable is set, this
    function POSTs a JSON-Patch document to the real ADO REST API
    (`POST /_apis/wit/workitems/${type}?api-version=7.0`). The returned
    `is_mock` flag is `False` on success.

    When `ADO_PAT` is NOT set, OR the live call fails for any reason
    (network, 401, missing project, etc.), the function falls back to
    the deterministic mock used since Pack 3: a SHA-derived work-item id
    keyed on `finding_id` so the same finding always lands on the same
    mock work item across re-dispatches. The fallback path keeps the
    workshop / demo UX green even when no ADO tenant is wired up.

    Persists the resulting ADO URL + work_item_id on the finding so the
    UI can surface "Already in ADO" instead of duplicating dispatches.
    """
    import hashlib
    import os

    finding = await get_finding(finding_id)
    if not finding:
        raise ValueError(f"Finding '{finding_id}' not found")

    sev = finding.get("severity") or "medium"
    ado_meta = _SEV_TO_ADO.get(sev, _SEV_TO_ADO["medium"])

    # Pull ADO settings from the existing red_cross_qa settings collection
    # (organization / project / area_path / iteration_path / tags).
    ado_org = "rodekors"
    ado_project = "rodekors-web"
    ado_area_path: Optional[str] = None
    ado_iteration_path: Optional[str] = None
    extra_tags: List[str] = []
    try:
        from backend.services.red_cross_qa import get_settings as _get_rcqa_settings
        rcqa = await _get_rcqa_settings()
        rcqa_settings = (rcqa or {}).get("settings") or {}
        ado_org = rcqa_settings.get("ado_organization") or ado_org
        ado_project = rcqa_settings.get("ado_project") or ado_project
        ado_area_path = rcqa_settings.get("ado_area_path") or None
        ado_iteration_path = rcqa_settings.get("ado_iteration_path") or None
        extra_tags = list(rcqa_settings.get("ado_tags") or [])
    except Exception:
        pass

    base_tags = ["qa-security", f"check:{finding.get('check_id')}",
                  f"finding:{finding_id}"]
    all_tags = base_tags + [t for t in extra_tags if t and t not in base_tags]

    # Build the JSON-Patch ONCE — used by both the live ADO REST call and
    # left attached to the response for traceability.
    json_patch = _build_ado_json_patch(
        finding, finding_id, ado_meta,
        ado_area_path, ado_iteration_path, all_tags,
    )

    # ─── Try the real ADO REST path when ADO_PAT is in env ───────────
    pat = os.environ.get("ADO_PAT") or os.environ.get("AZURE_DEVOPS_PAT")
    live_id: Optional[int] = None
    live_url: Optional[str] = None
    live_error: Optional[str] = None
    if pat:
        live_id, live_url, live_error = await _dispatch_via_ado_rest(
            pat=pat,
            org=ado_org,
            project=ado_project,
            work_item_type=ado_meta["work_item_type"],
            json_patch=json_patch,
        )

    is_mock = (live_id is None)

    if not is_mock:
        wi_id = live_id
        ado_url = live_url or (f"https://dev.azure.com/{ado_org}/{ado_project}"
                                 f"/_workitems/edit/{live_id}")
    else:
        # Deterministic mock work-item id derived from the finding id.
        # A finding always lands on the same mock work item across re-dispatches.
        digest = hashlib.sha1(finding_id.encode("utf-8")).hexdigest()
        wi_id = 10000 + (int(digest[:6], 16) % 90000)
        ado_url = (f"https://dev.azure.com/{ado_org}/{ado_project}"
                    f"/_workitems/edit/{wi_id}")

    description_md = _build_ado_description_md(finding, finding_id)
    work_item_payload = {
        "id": wi_id,
        "url": ado_url,
        "title": f"[QA Security] {finding.get('title', 'Untitled finding')}",
        "work_item_type": ado_meta["work_item_type"],
        "priority": ado_meta["priority"],
        "severity_dev": ado_meta["severity_dev"],
        "category_ops": "Kat A" if sev in ("critical", "high")
                          else "Kat B" if sev == "medium" else "Kat C",
        "test_level": "system",
        "tags": all_tags,
        "owner_hint": finding.get("owner"),
        "description_md": description_md,
        "area_path": ado_area_path,
        "iteration_path": ado_iteration_path,
        "json_patch": json_patch,
    }

    # Persist the ADO link on the finding so the UI can show
    # "Already in ADO (#1234)" next time without re-dispatching.
    dispatch_note = (
        f"Dispatched to ADO as {ado_meta['work_item_type']} "
        f"#{wi_id} (priority {ado_meta['priority']}, "
        f"{ado_meta['severity_dev']}, "
        f"{'LIVE' if not is_mock else 'MOCK'})"
    )
    if is_mock and live_error:
        dispatch_note += f" — live attempt failed: {live_error}"

    patch_payload = {
        "ado_dispatched_at": _now_iso(),
        "ado_url": ado_url,
        "ado_work_item_id": wi_id,
        "ado_work_item_type": ado_meta["work_item_type"],
        "ado_is_mock": is_mock,
        "history": list(finding.get("history") or []) + [{
            "at": _now_iso(),
            "actor": actor,
            "note": dispatch_note,
            "status": finding.get("status"),
        }],
    }
    try:
        from backend.repositories.qa_security_repository import (
            qa_security_findings_collection as _findings_coll,
        )
    except ImportError:  # pragma: no cover
        _findings_coll = None

    if _findings_coll is not None:
        try:
            await _findings_coll.update_one(
                {"id": finding_id},
                {"$set": patch_payload},
            )
        except Exception:
            pass
    # Refresh local in-memory cache too.
    refreshed = {**finding, **patch_payload}
    try:
        from backend.repositories import qa_security_repository as _repo
        _repo._mem_findings[finding_id] = refreshed
    except Exception:
        pass

    return {
        "finding_id": finding_id,
        "ado_url": ado_url,
        "ado_work_item_id": wi_id,
        "work_item_type": ado_meta["work_item_type"],
        "priority": ado_meta["priority"],
        "severity_dev": ado_meta["severity_dev"],
        "category_ops": work_item_payload["category_ops"],
        "dispatched_at": patch_payload["ado_dispatched_at"],
        "work_item": work_item_payload,
        "is_mock": is_mock,
        "live_error": live_error,  # None on success or when no PAT
    }


# ───────────────────────────────────────────────────────────────────────────
# 3) Diff between two scan runs.
# ───────────────────────────────────────────────────────────────────────────

async def diff_scans(from_scan_id: Optional[str] = None,
                      to_scan_id: Optional[str] = None,
                      environment: Optional[str] = None) -> Dict[str, Any]:
    """Compare two scan runs by ID. If `from_scan_id` is omitted, use the
    second-most-recent run; if `to_scan_id` is omitted, use the newest.

    Pack 4.1 — when BOTH scan run docs carry a `findings_snapshot`, uses
    precise set-difference + status-transition logic. When either run
    lacks a snapshot (pre-Pack-4.1 scan docs), falls back to the
    timestamp-based approximation used in Pack 3.

    Returns:
      {
        from: {...},          # scan run doc
        to: {...},            # scan run doc
        counts_delta: { pass, warn, fail },
        findings: {
          new: [...]          # in `to.snapshot` but not in `from.snapshot`
          fixed: [...]        # open in `from`, closed in `to` (or absent in `to`)
          regressed: [...]    # closed in `from`, open in `to`
          persisted: [...]    # open in both
        },
        diff_mode: "precise" | "timestamp_fallback",
        summary: "..."
      }
    """
    runs = await list_scan_runs(limit=20, environment=environment)
    if len(runs) < 1:
        return {"from": None, "to": None,
                "counts_delta": {"pass": 0, "warn": 0, "fail": 0},
                "findings": {"new": [], "fixed": [], "regressed": [], "persisted": []},
                "diff_mode": "no_scans",
                "summary": "no_scans"}

    # Newest first. Resolve IDs.
    def _find(run_id):
        return next((r for r in runs if r.get("id") == run_id), None)

    to_run = _find(to_scan_id) if to_scan_id else runs[0]
    if not to_run:
        raise ValueError(f"to_scan_id '{to_scan_id}' not found")
    if from_scan_id:
        from_run = _find(from_scan_id)
        if not from_run:
            raise ValueError(f"from_scan_id '{from_scan_id}' not found")
    else:
        # Default: the scan immediately before `to_run`.
        try:
            idx = runs.index(to_run)
        except ValueError:
            idx = -1
        from_run = runs[idx + 1] if 0 <= idx + 1 < len(runs) else None

    counts_delta = {
        "pass": int((to_run.get("pass_count") or 0)
                     - ((from_run or {}).get("pass_count") or 0)),
        "warn": int((to_run.get("warn_count") or 0)
                     - ((from_run or {}).get("warn_count") or 0)),
        "fail": int((to_run.get("fail_count") or 0)
                     - ((from_run or {}).get("fail_count") or 0)),
    }

    from_snapshot = (from_run or {}).get("findings_snapshot")
    to_snapshot = to_run.get("findings_snapshot")
    has_precise = bool(from_snapshot is not None and to_snapshot is not None)

    if has_precise:
        bucket, diff_mode = _diff_via_snapshots(from_snapshot, to_snapshot)
    else:
        bucket = await _diff_via_timestamps(from_run, to_run)
        diff_mode = "timestamp_fallback"

    summary = (
        f"{len(bucket['new'])} new · "
        f"{len(bucket['fixed'])} fixed · "
        f"{len(bucket['regressed'])} regressed · "
        f"{len(bucket['persisted'])} persisted"
    )

    return {
        "from": from_run,
        "to": to_run,
        "counts_delta": counts_delta,
        "findings": bucket,
        "diff_mode": diff_mode,
        "summary": summary,
    }


# Statuses that count as "closed" for diff purposes — they are no longer
# operationally open, regardless of why (fixed, signed-off as accepted
# risk, or independently verified).
_CLOSED_STATUSES = frozenset(("fixed", "verified", "accepted_risk"))


def _diff_via_snapshots(
    from_snapshot: List[Dict[str, Any]],
    to_snapshot: List[Dict[str, Any]],
) -> tuple[Dict[str, List[Dict[str, Any]]], str]:
    """Precise diff using Pack 4.1 per-scan finding snapshots."""
    from_by_id = {(e or {}).get("id"): e for e in (from_snapshot or [])
                   if (e or {}).get("id")}
    to_by_id = {(e or {}).get("id"): e for e in (to_snapshot or [])
                 if (e or {}).get("id")}

    bucket = {"new": [], "fixed": [], "regressed": [], "persisted": []}

    # Walk every finding seen in at least one of the two snapshots.
    for fid in (set(from_by_id) | set(to_by_id)):
        from_entry = from_by_id.get(fid)
        to_entry = to_by_id.get(fid)
        from_status = (from_entry or {}).get("status") or "open"
        to_status = (to_entry or {}).get("status") or "open"
        # Pick the more informative entry for display.
        display = to_entry or from_entry or {"id": fid}

        in_from = from_entry is not None
        in_to = to_entry is not None
        from_open = (from_status == "open")
        from_closed = (from_status in _CLOSED_STATUSES)
        to_open = (to_status == "open")
        to_closed = (to_status in _CLOSED_STATUSES)

        if not in_from and in_to and to_open:
            # Appeared in `to` for the first time (open).
            bucket["new"].append(_diff_row_from_snapshot(display))
        elif in_from and from_open and not in_to:
            # Was open in `from`, completely gone in `to` — treat as fixed.
            bucket["fixed"].append(_diff_row_from_snapshot(display))
        elif in_from and from_open and to_closed:
            # Open → closed.
            bucket["fixed"].append(_diff_row_from_snapshot(display))
        elif in_from and from_closed and to_open:
            # Closed → open again.
            bucket["regressed"].append(_diff_row_from_snapshot(display))
        elif in_from and from_open and to_open:
            # Still open in both runs.
            bucket["persisted"].append(_diff_row_from_snapshot(display))
        # All other combinations (closed→closed, new but already closed, etc.)
        # are not interesting for the diff view; intentionally not bucketed.

    return bucket, "precise"


async def _diff_via_timestamps(
    from_run: Optional[Dict[str, Any]],
    to_run: Dict[str, Any],
) -> Dict[str, List[Dict[str, Any]]]:
    """Legacy timestamp-based diff. Kept as fallback for scan docs that
    pre-date Pack 4.1 (no findings_snapshot)."""
    all_findings = await list_findings(limit=500)
    from_t = (from_run or {}).get("finished_at") or "1970"
    to_t = to_run.get("finished_at") or _now_iso()

    bucket = {"new": [], "fixed": [], "regressed": [], "persisted": []}
    for f in all_findings:
        created = f.get("created_at") or ""
        updated = f.get("updated_at") or ""
        status = f.get("status") or "open"
        if from_t < created <= to_t and status == "open":
            bucket["new"].append(_diff_row(f))
            continue
        if status in _CLOSED_STATUSES and from_t < updated <= to_t:
            bucket["fixed"].append(_diff_row(f))
            continue
        if status == "open" and updated > from_t and any(
            (h or {}).get("status") in _CLOSED_STATUSES
            for h in (f.get("history") or [])
        ):
            bucket["regressed"].append(_diff_row(f))
            continue
        if status == "open" and created <= from_t:
            bucket["persisted"].append(_diff_row(f))
    return bucket


def _diff_row(f: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": f.get("id"),
        "check_id": f.get("check_id"),
        "title": f.get("title"),
        "severity": f.get("severity"),
        "status": f.get("status"),
        "owner": f.get("owner"),
        "updated_at": f.get("updated_at"),
    }


def _diff_row_from_snapshot(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Build a diff row from a per-scan snapshot entry (no owner / no
    updated_at fields are in the snapshot — they live on the finding doc,
    not the scan run doc). Callers that want owner/timestamp can join
    against `list_findings` separately."""
    return {
        "id": entry.get("id"),
        "check_id": entry.get("check_id"),
        "title": entry.get("title"),
        "severity": entry.get("severity"),
        "status": entry.get("status"),
    }


# ───────────────────────────────────────────────────────────────────────────
# 4) Verify-fix flow.
# ───────────────────────────────────────────────────────────────────────────

async def verify_finding(finding_id: str,
                          environment: str = "test",
                          lang: str = "en",
                          actor: str = "workshop-host") -> Dict[str, Any]:
    """Re-run the scan that owns this finding, then:
      • if the same finding is no longer detected → transition to 'verified'
      • if it's detected again with same severity → transition back to 'open'
      • else (different severity etc.) → keep current status, append audit note

    Returns {finding, verification, scan_id}.
    """
    finding = await get_finding(finding_id)
    if not finding:
        raise ValueError(f"Finding '{finding_id}' not found")

    # We don't have per-check re-run today (run_security_scan runs all 13).
    # Pragmatic: re-run the whole scan, then look up the finding by ID.
    scan_payload = await perform_scan(environment=environment, lang=lang,
                                       actor=actor, trigger="verify-fix")
    rescanned = next((f for f in scan_payload["findings"]
                       if f.get("id") == finding_id), None)

    new_status = finding.get("status") or "fixed"
    note = ""
    verification = "inconclusive"

    if not rescanned:
        # Scanner didn't re-detect the issue → verified.
        new_status = "verified"
        verification = "still_clean"
        note = "Re-scan did not detect this finding. Auto-transitioned to verified."
    elif rescanned.get("status") == "open":
        # The protected-status logic kept it on `fixed`, but the scanner
        # would have re-detected it if status had been `open`. Reopen it.
        new_status = "open"
        verification = "regressed"
        note = "Re-scan detected the issue again. Auto-reopened."
    else:
        # Status was preserved (was fixed/accepted_risk and is now same).
        # Leave alone but record the verification attempt.
        verification = "preserved"
        note = f"Re-scan re-detected the issue but kept user status ({new_status})."

    patched = await patch_finding(
        finding_id,
        patch={
            "status": new_status,
            "note": note,
        },
        actor=actor,
    )

    return {
        "finding": patched or finding,
        "verification": verification,
        "scan_id": scan_payload["scan"]["id"],
        "note": note,
    }


# ───────────────────────────────────────────────────────────────────────────
# 5) Environment matrix.
# ───────────────────────────────────────────────────────────────────────────

_KNOWN_ENVIRONMENTS = ("local", "test", "staging", "prod")


async def get_environment_matrix() -> Dict[str, Any]:
    """Return the most recent snapshot per environment. The frontend
    renders a 4-column matrix with PASS/WARN/FAIL + open_findings per env.

    Environments that have never had a scan show overall_status='pending'.
    """
    rows = []
    for env in _KNOWN_ENVIRONMENTS:
        snapshot = await get_status(environment=env)
        rows.append({"environment": env, **snapshot})

    # Aggregate worst-status across envs to help the dashboard chip.
    worst = "pending"
    rank = {"fail": 3, "warn": 2, "pass": 1, "pending": 0}
    for r in rows:
        if rank.get(r.get("overall_status"), 0) > rank.get(worst, 0):
            worst = r.get("overall_status")

    return {
        "environments": rows,
        "worst_overall": worst,
        "generated_at": _now_iso(),
    }
