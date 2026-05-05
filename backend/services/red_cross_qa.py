"""
Red Cross Web QA Agent — Service Layer (Agent #9)
==================================================
24/7 QA copilot for the rodekors.no website (Enonic CMS + NextJS).

Phase 1 — Mock-first implementation:
  - Generates structured Test Plans, Playwright/Cypress/k6 scripts via LLM
  - Provides deterministic mock results for execution endpoints
  - Stores runs, findings, generated scripts, Jira dispatches in MongoDB

The service intentionally degrades gracefully when LLM, MongoDB or external
tools are unavailable so the UI shell remains usable.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
import hashlib
import json
import re
import uuid

# ── DB imports ──────────────────────────────────────────────────────
try:
    from backend.db import (
        red_cross_qa_runs_collection,
        red_cross_qa_findings_collection,
        red_cross_qa_test_cases_collection,
        red_cross_qa_generated_scripts_collection,
        red_cross_qa_jira_dispatches_collection,
        red_cross_qa_settings_collection,
        red_cross_qa_reports_collection,
    )
except ImportError:  # pragma: no cover
    from db import (  # type: ignore
        red_cross_qa_runs_collection,
        red_cross_qa_findings_collection,
        red_cross_qa_test_cases_collection,
        red_cross_qa_generated_scripts_collection,
        red_cross_qa_jira_dispatches_collection,
        red_cross_qa_settings_collection,
        red_cross_qa_reports_collection,
    )

# ── LLM import (graceful fallback) ──────────────────────────────────
try:
    from backend.llm import ask_ai_unified
except ImportError:  # pragma: no cover
    try:
        from llm import ask_ai_unified  # type: ignore
    except ImportError:
        ask_ai_unified = None  # type: ignore

# ═══════════════════════════════════════════════════════════════════
# Language helpers
# ═══════════════════════════════════════════════════════════════════
_LANG_NAMES = {
    "es": "Spanish", "no": "Norwegian", "fr": "French",
    "de": "German",  "pt": "Portuguese",
}

def _lang_instruction(lang: Optional[str]) -> str:
    if not lang or lang.startswith("en"):
        return ""
    name = _LANG_NAMES.get(lang[:2], lang)
    return (
        f"\n\nIMPORTANT: Generate ALL text content — titles, descriptions, "
        f"steps, expected outcomes, notes — in {name}. "
        f"Keep code identifiers (functions, selectors) in English."
    )

# ═══════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════
VALID_ENVIRONMENTS = {"local", "test"}
SUITE_NAMES = [
    "redcross-smoke-public", "redcross-donation-flow", "redcross-volunteer-flow",
    "redcross-local-services-search", "redcross-cms-preview-publish",
    "redcross-accessibility-core", "redcross-seo-core", "redcross-graphql-api",
    "redcross-performance-core-web-vitals", "redcross-stress-campaign-peak",
    "redcross-security-basic", "redcross-release-readiness",
    "redcross-forms-qa", "redcross-content-migration",
    "redcross-enonic-performance", "redcross-designsystemet",
    "redcross-role-matrix",
]

DEFAULT_SETTINGS = {
    "env_local_url": "http://localhost:3000",
    "env_test_url": "https://test.rodekors.no",
    "env_default": "test",
    "execution_mode": "generate",
    "jira_project": "ITEM",
    "jira_component": "Web QA",
    "jira_labels": ["red-cross-qa", "ai-generated"],
    "payment_flow": "handoff",
    "threshold_perf": 85,
    "threshold_seo": 90,
    "threshold_axe_critical": 0,
    "outsystems_url": "",
}

# ═══════════════════════════════════════════════════════════════════
# Prompt templates
# ═══════════════════════════════════════════════════════════════════
TEST_PLAN_PROMPT = """You are a senior QA engineer for the rodekors.no website (Enonic CMS + NextJS).
Convert the following Jira epic / user story into a complete sprint test plan.

Return ONLY valid JSON with this shape:
{
  "manual_tests": [{"title": "...", "steps": ["..."], "expected": "..."}],
  "automated_candidates": [{"title": "...", "tool": "playwright|cypress|k6|axe", "rationale": "..."}],
  "accessibility_checklist": ["..."],
  "api_checks": [{"endpoint": "...", "method": "...", "check": "..."}],
  "regression_scope": ["..."],
  "suggested_test_data": ["..."],
  "jira_subtasks": [{"title": "...", "type": "Task", "priority": "Medium"}]
}

Be concrete, reference donation/volunteer/CMS-preview flows where relevant."""

PLAYWRIGHT_PROMPT = """You are a senior QA automation engineer.
Generate Playwright TypeScript tests for the rodekors.no website covering the requested scopes.

Return ONLY valid JSON with this shape:
{
  "scripts": [
    {"filename": "donation.spec.ts", "content": "import { test, expect } ..."}
  ]
}

Keep selectors resilient (role/text-based), include axe-core where requested,
and respect the configured payment_flow scope."""

CYPRESS_PROMPT = """You are a senior frontend QA engineer.
Generate Cypress tests for the rodekors.no NextJS frontend covering the requested scopes.

Return ONLY valid JSON with this shape:
{ "scripts": [ {"filename": "search.cy.ts", "content": "describe('search', () => {...})"} ] }
"""

K6_PROMPT = """You are a senior performance engineer.
Generate a k6 JavaScript load-test script for the rodekors.no website using the requested
profile and scenarios. Include thresholds and stages aligned with the profile.

Return ONLY valid JSON: {"filename": "k6-script.js", "script": "import http from 'k6/http' ..."}
"""

CMS_QA_PROMPT = """You are a senior CMS QA engineer for Enonic Content Studio.
Generate concrete CMS test cases for the requested areas, considering 6 editorial roles
(Administrator, Owner, Local Owner, Editor, Local Editor, Contributor).

Return ONLY valid JSON: {"test_cases": [{"area": "...", "title": "...", "description": "...", "roles": ["..."]}]}
"""

FORMS_QA_PROMPT = """You are a senior QA engineer for Item Consulting's Skjemabygger
(Enonic XP form-builder, JSON Schema, Adam Silver / gov.uk patterns) on rodekors.no.
Audit the requested forms and produce a quality report.

Return ONLY valid JSON with this shape:
{
  "checks": {
    "checkJsonSchema": {"status": "pass|warn|fail", "note": "..."},
    "checkAdamSilverPatterns": {"status": "pass|warn|fail", "note": "..."},
    "checkMultiStep": {"status": "pass|warn|fail", "note": "..."},
    "checkMobileKeyboard": {"status": "pass|warn|fail", "note": "..."},
    "checkAutocomplete": {"status": "pass|warn|fail", "note": "..."},
    "checkPrefillApi": {"status": "pass|warn|fail", "note": "..."},
    "checkValidationMessages": {"status": "pass|warn|fail", "note": "..."},
    "checkAriaLive": {"status": "pass|warn|fail", "note": "..."},
    "checkErrorSummary": {"status": "pass|warn|fail", "note": "..."},
    "checkProgressIndicator": {"status": "pass|warn|fail", "note": "..."},
    "checkVippsHandoff": {"status": "pass|warn|fail", "note": "..."},
    "checkSubmitIdempotency": {"status": "pass|warn|fail", "note": "..."}
  },
  "findings": [{"severity": "low|medium|high|critical", "form": "...", "title": "...", "message": "...", "fix_hint": "..."}],
  "test_cases": [{"title": "...", "form": "...", "type": "manual|automated", "tool": "playwright|cypress|axe|manual", "steps": ["..."], "expected": "..."}]
}
Cover donation, volunteer, contact, course and Vipps handoff flows where relevant.
"""

ENONIC_PERFORMANCE_PROMPT = """You are a senior performance engineer for Enonic XP +
Next.XP + Guillotine GraphQL on the rodekors.no website. Audit Enonic-specific perf
signals (waterfall, N+1, Guillotine field selection, ISR latency, image service,
publish latency, bulk publish, part rendering, cache invalidation).

Return ONLY valid JSON: {
  "checks": {
    "checkGraphqlWaterfall": {"status": "...", "p95_ms": 0, "queries": 0, "note": "..."},
    "checkGraphqlNplusOne": {"status": "...", "duplicate_queries": 0, "note": "..."},
    "checkGuillotineFields": {"status": "...", "overfetched_fields": 0, "note": "..."},
    "checkIsrLatency": {"status": "...", "p95_seconds": 0, "note": "..."},
    "checkIsrCascading": {"status": "...", "note": "..."},
    "checkImageService": {"status": "...", "p95_ms": 0, "note": "..."},
    "checkPublishLatency": {"status": "...", "p95_seconds": 0, "note": "..."},
    "checkBulkPublish": {"status": "...", "note": "..."},
    "checkPartRender": {"status": "...", "note": "..."},
    "checkCacheInvalidation": {"status": "...", "note": "..."}
  },
  "hot_queries": [{"name": "...", "p95_ms": 0, "queries": 0, "duplicates": 0, "fix_hint": "..."}],
  "recommendations": [{"priority": "high|medium|low", "title": "...", "description": "...", "category": "graphql|isr|image|publish|cache"}]
}
"""

DESIGNSYSTEMET_PROMPT = """You are a senior frontend / a11y QA engineer auditing
rodekors.no compliance with Designsystemet from Digdir (@digdir/designsystemet-react +
@digdir/designsystemet-css). Verify components, tokens, typography, spacing, brand
overrides and version drift.

Return ONLY valid JSON: {
  "compliance_score": 0-100,
  "checks": {
    "checkDsComponents": {"status": "...", "non_ds_count": 0, "note": "..."},
    "checkDsTokens": {"status": "...", "non_token_colors": 0, "note": "..."},
    "checkDsTypography": {"status": "...", "note": "..."},
    "checkDsSpacing": {"status": "...", "note": "..."},
    "checkDsAccessibility": {"status": "...", "note": "..."},
    "checkDsDarkMode": {"status": "...", "note": "..."},
    "checkBrandOverride": {"status": "...", "note": "..."},
    "checkDsVersion": {"status": "...", "version_used": "...", "latest": "...", "note": "..."},
    "checkDsButtonUsage": {"status": "...", "note": "..."},
    "checkDsFormElements": {"status": "...", "note": "..."}
  },
  "deviations": [{"severity": "...", "component": "...", "page": "...", "title": "...", "message": "...", "fix_hint": "..."}],
  "recommendations": [{"title": "...", "category": "...", "description": "..."}]
}
"""

ROLE_MATRIX_PROMPT = """You are a senior CMS authorization QA engineer auditing 6
editorial roles on Enonic XP Content Studio for rodekors.no:
Administrator, Eier (Owner), Lokal eier (Local Owner), Redaktør (Editor),
Lokal redaktør (Local Editor), Bidragsyter (Contributor).

Audit role × action × scope (read, edit, publish, delete) and authorization checks.

Return ONLY valid JSON: {
  "matrix": [{"role": "...", "scope": "...", "read": "allow|deny", "edit": "...", "publish": "...", "delete": "..."}],
  "checks": {
    "checkSubtreeIsolation": {"status": "...", "note": "..."},
    "checkPublishGuard": {"status": "...", "note": "..."},
    "checkDeleteGuard": {"status": "...", "note": "..."},
    "checkRoleAssignmentGuard": {"status": "...", "note": "..."},
    "checkAuditLog": {"status": "...", "note": "..."},
    "checkSessionExpiry": {"status": "...", "note": "..."},
    "checkPrivilegeEscalation": {"status": "...", "note": "..."},
    "checkApiAuthZ": {"status": "...", "note": "..."}
  },
  "violations": [{"severity": "...", "role": "...", "action": "...", "scope": "...", "expected": "...", "actual": "...", "fix_hint": "..."}],
  "test_cases": [{"role": "...", "title": "...", "type": "manual|automated", "tool": "...", "steps": ["..."], "expected": "..."}]
}
"""

CONTENT_MIGRATION_PROMPT = """You are a senior content-migration QA engineer for the
rodekors.no relaunch on Enonic XP / Content Studio v.6. The tender explicitly mandates
"gradvis migrering av innhold" (gradual content migration) from the legacy CMS.

Audit the migration scope provided and return ONLY valid JSON:
{
  "summary": {
    "total_pages_legacy": 0, "total_pages_migrated": 0,
    "coverage_percent": 0, "broken_links": 0,
    "missing_redirects": 0, "orphan_assets": 0
  },
  "checks": {
    "checkContentTypeMapping": {"status": "pass|warn|fail", "note": "..."},
    "checkNorwegianChars": {"status": "pass|warn|fail", "note": "..."},
    "checkRelations": {"status": "pass|warn|fail", "note": "..."},
    "checkLocalization": {"status": "pass|warn|fail", "note": "..."},
    "checkImageReanchoring": {"status": "pass|warn|fail", "note": "..."},
    "checkRedirects": {"status": "pass|warn|fail", "note": "..."},
    "checkSeoMetadata": {"status": "pass|warn|fail", "note": "..."},
    "checkPublishState": {"status": "pass|warn|fail", "note": "..."},
    "checkIsrInvalidation": {"status": "pass|warn|fail", "note": "..."},
    "checkPermissionsCarryover": {"status": "pass|warn|fail", "note": "..."}
  },
  "broken_pages": [{"legacy_url": "...", "new_url": "...", "issue": "..."}],
  "missing_redirects": [{"from": "...", "to": "...", "status_expected": 301}],
  "test_cases": [{"title": "...", "type": "manual|automated", "steps": ["..."], "expected": "..."}]
}
Cover content types: Forening, Distrikt, Aktivitet, Kontaktperson, Tjeneste/Kurs, Tema, Nyhet, Kampanje.
"""


# ═══════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_json(raw: str) -> Optional[Any]:
    """Best-effort JSON parser — direct → fenced → first balanced object."""
    if not raw:
        return None
    raw = raw.strip()
    try:
        return json.loads(raw)
    except Exception:
        pass
    m = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    m = re.search(r"(\{.*\}|\[.*\])", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            return None
    return None


async def _llm(prompt: str, system: str, lang: Optional[str]) -> Optional[str]:
    """Call LLM with graceful fallback. Returns raw text or None."""
    if ask_ai_unified is None:
        return None
    try:
        result = ask_ai_unified(prompt=prompt, system_prompt=system + _lang_instruction(lang))
        if isinstance(result, dict):
            return result.get("response") or result.get("text") or result.get("content")
        return result if isinstance(result, str) else None
    except Exception:
        return None


def _new_run_id() -> str:
    return f"rcqa-{uuid.uuid4().hex[:10]}"


def _attestation_hash(payload: Dict[str, Any]) -> str:
    blob = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()[:32]


async def _store_run(suite: str, environment: str, status: str,
                     summary: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    run = {
        "run_id": _new_run_id(),
        "suite": suite,
        "environment": environment,
        "status": status,
        "summary": summary,
        "started_at": _now(),
        "ended_at": _now(),
        "attestation_hash": _attestation_hash(payload),
        "artifacts": payload.get("artifacts", []),
        "payload": payload,
    }
    try:
        await red_cross_qa_runs_collection.insert_one(dict(run))
    except Exception:
        pass
    run.pop("_id", None)
    return run


# ═══════════════════════════════════════════════════════════════════
# Tool 1 — Test Plan
# ═══════════════════════════════════════════════════════════════════
async def generate_test_plan(jira_epic: str, acceptance: str, design_link: str,
                             risk_level: str, environment: str,
                             lang: str = "en") -> Dict[str, Any]:
    user_prompt = (
        f"Jira epic / user story:\n{jira_epic}\n\n"
        f"Acceptance criteria:\n{acceptance}\n\n"
        f"Design link: {design_link or 'N/A'}\n"
        f"Risk level: {risk_level}\n"
        f"Environment: {environment}\n"
    )
    raw = await _llm(user_prompt, TEST_PLAN_PROMPT, lang)
    parsed = _parse_json(raw or "")

    if not parsed:
        # Mock fallback
        parsed = {
            "manual_tests": [
                {"title": "Visitor can complete donation flow on mobile",
                 "steps": ["Open donation page", "Choose amount", "Continue to payment"],
                 "expected": "Provider handoff screen renders"},
            ],
            "automated_candidates": [
                {"title": "donation-flow-smoke", "tool": "playwright", "rationale": "Critical revenue path"},
                {"title": "axe-core scan on donation page", "tool": "axe", "rationale": "WCAG 2.2 AA"},
            ],
            "accessibility_checklist": [
                "Keyboard reachable amount selector",
                "Color contrast ≥ 4.5:1",
                "Form errors announced to screen readers",
            ],
            "api_checks": [
                {"endpoint": "/site/api/graphql", "method": "POST", "check": "Donation query returns localized fields"},
            ],
            "regression_scope": ["Donation page", "Volunteer signup", "Local pages"],
            "suggested_test_data": ["100 NOK / monthly", "500 NOK / one-time"],
            "jira_subtasks": [
                {"title": "Add Playwright donation smoke", "type": "Task", "priority": "High"},
                {"title": "Add axe-core check", "type": "Task", "priority": "Medium"},
            ],
        }

    return {"status": "ok", "plan": parsed, "lang": lang, "environment": environment}


# ═══════════════════════════════════════════════════════════════════
# Tool 2 — Playwright generator + runner
# ═══════════════════════════════════════════════════════════════════
async def generate_playwright_tests(scopes: List[str], environment: str,
                                    lang: str = "en") -> Dict[str, Any]:
    prompt = (
        f"Scopes: {', '.join(scopes)}\nEnvironment: {environment}\n"
        "Generate one Playwright TS file per scope (max 5 scripts)."
    )
    raw = await _llm(prompt, PLAYWRIGHT_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    scripts = parsed.get("scripts") or []

    if not scripts:
        scripts = [{
            "filename": f"{s}.spec.ts",
            "content": (
                "import { test, expect } from '@playwright/test';\n\n"
                f"test('{s} smoke', async ({{ page }}) => {{\n"
                "  await page.goto(process.env.BASE_URL || 'https://test.rodekors.no');\n"
                "  await expect(page).toHaveTitle(/Røde Kors|Red Cross/);\n"
                "});\n"
            ),
        } for s in scopes[:5]]

    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "playwright", "scopes": scopes, "environment": environment,
            "scripts": scripts, "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass

    return {"status": "ok", "scripts": scripts, "lang": lang}


async def run_playwright(scopes: List[str], environment: str) -> Dict[str, Any]:
    """Phase 1: deterministic mock execution."""
    summary = f"Mock run on {environment}: {len(scopes)} scope(s) — 0 fail, 0 warn"
    run = await _store_run("redcross-playwright", environment, "pass", summary, {
        "scopes": scopes, "passed": len(scopes), "failed": 0,
        "artifacts": [{"name": "trace.zip", "type": "trace"}],
    })
    return {"status": "ok", "run": run}


# ═══════════════════════════════════════════════════════════════════
# Tool 3 — Cypress generator + runner
# ═══════════════════════════════════════════════════════════════════
async def generate_cypress_tests(scopes: List[str], environment: str,
                                 lang: str = "en") -> Dict[str, Any]:
    prompt = f"Scopes: {', '.join(scopes)}\nEnvironment: {environment}\n"
    raw = await _llm(prompt, CYPRESS_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    scripts = parsed.get("scripts") or []

    if not scripts:
        scripts = [{
            "filename": f"{s}.cy.ts",
            "content": (
                f"describe('{s}', () => {{\n"
                "  it('renders without errors', () => {\n"
                "    cy.visit('/');\n"
                "    cy.contains(/Røde Kors|Red Cross/i).should('be.visible');\n"
                "  });\n});\n"
            ),
        } for s in scopes[:3]]

    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "cypress", "scopes": scopes, "environment": environment,
            "scripts": scripts, "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass

    return {"status": "ok", "scripts": scripts, "lang": lang}


async def run_cypress(scopes: List[str], environment: str) -> Dict[str, Any]:
    summary = f"Mock Cypress run on {environment}: {len(scopes)} scope(s) — passed"
    run = await _store_run("redcross-cypress", environment, "pass", summary, {
        "scopes": scopes, "passed": len(scopes), "failed": 0,
        "artifacts": [{"name": "cypress-screenshots", "type": "screenshots"}],
    })
    return {"status": "ok", "run": run}


# ═══════════════════════════════════════════════════════════════════
# Tool 4 — API QA
# ═══════════════════════════════════════════════════════════════════
async def analyze_api(endpoint: str, method: str, environment: str,
                      lang: str = "en") -> Dict[str, Any]:
    """Mock-first API analysis. Returns checks dict aligned with frontend keys."""
    checks = {
        "checkQueryCorrectness": "pass",
        "checkPagination": "pass",
        "checkFiltering": "pass",
        "checkLocalization": "warn",
        "checkPreviewVsPublished": "pass",
        "checkCaching": "pass",
        "checkPerfBudget": "warn",
        "checkSchemaDrift": "pass",
        "checkRateLimit": "pass",
        "checkErrorHandling": "pass",
    }
    summary = f"API mock analysis of {method} {endpoint} on {environment}"
    run = await _store_run("redcross-graphql-api", environment, "warn", summary, {
        "endpoint": endpoint, "method": method, "checks": checks,
    })
    return {"status": "ok", "endpoint": endpoint, "method": method,
            "checks": checks, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 5 — CMS QA
# ═══════════════════════════════════════════════════════════════════
async def generate_cms_test_cases(areas: List[str], environment: str,
                                  lang: str = "en") -> Dict[str, Any]:
    prompt = f"Areas: {', '.join(areas)}\nEnvironment: {environment}\n"
    raw = await _llm(prompt, CMS_QA_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    cases = parsed.get("test_cases") or []

    if not cases:
        cases = [{
            "area": a,
            "title": f"{a} — basic editorial flow",
            "description": "Validate role visibility, preview, publish/unpublish behaviour.",
            "roles": ["Editor", "Local Editor"],
        } for a in areas[:8]]

    try:
        await red_cross_qa_test_cases_collection.insert_one({
            "areas": areas, "test_cases": cases, "environment": environment,
            "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass
    return {"status": "ok", "test_cases": cases, "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 6 — Accessibility
# ═══════════════════════════════════════════════════════════════════
async def run_accessibility_check(url: str, environment: str,
                                  lang: str = "en") -> Dict[str, Any]:
    checks = {
        "checkKeyboard": "pass", "checkFocusOrder": "pass", "checkSkipLinks": "warn",
        "checkAriaMisuse": "pass", "checkHeadings": "pass", "checkColorContrast": "warn",
        "checkFormLabels": "pass", "checkErrorMessages": "pass", "checkScreenReader": "pass",
        "checkDialogs": "pass", "checkAltText": "warn", "checkContentClarity": "pass",
    }
    violations = [
        {"severity": "medium", "rule": "color-contrast", "message": "Donation CTA contrast ratio 3.9:1 (target 4.5:1)"},
        {"severity": "low", "rule": "image-alt", "message": "3 hero images lack descriptive alt text"},
    ]
    run = await _store_run("redcross-accessibility-core", environment, "warn",
                            f"axe-core scan on {url}",
                            {"url": url, "checks": checks, "violations": violations})
    return {"status": "ok", "url": url, "wcag_score": 87,
            "checks": checks, "violations": violations, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 7 — Performance / Lighthouse
# ═══════════════════════════════════════════════════════════════════
async def run_lighthouse(url: str, environment: str,
                         lang: str = "en") -> Dict[str, Any]:
    metrics = {
        "metricLcp":         {"value": "2.4s", "status": "pass"},
        "metricCls":         {"value": "0.06", "status": "pass"},
        "metricInp":         {"value": "180ms", "status": "pass"},
        "metricTtfb":        {"value": "320ms", "status": "warn"},
        "metricBundleSize":  {"value": "412kb", "status": "warn"},
        "metricImageOpt":    {"value": "OK", "status": "pass"},
        "metricFontLoad":    {"value": "OK", "status": "pass"},
        "metricServerResp":  {"value": "OK", "status": "pass"},
        "metricGraphQL":     {"value": "240ms", "status": "pass"},
        "metricCacheHit":    {"value": "78%", "status": "warn"},
    }
    bottlenecks = ["TTFB above 300ms on cold cache", "Bundle size over 400kb on home page"]
    optimizations = [
        "Enable ISR on local pages",
        "Defer non-critical scripts on donation page",
        "Use AVIF for hero images",
    ]
    run = await _store_run("redcross-performance-core-web-vitals", environment, "warn",
                            f"Lighthouse on {url}",
                            {"url": url, "metrics": metrics})
    return {"status": "ok", "url": url, "lighthouse_score": 86,
            "metrics": metrics, "bottlenecks": bottlenecks,
            "optimizations": optimizations, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 8 — k6 generator + runner
# ═══════════════════════════════════════════════════════════════════
async def generate_k6_script(profile: str, scenarios: List[str], environment: str,
                             lang: str = "en") -> Dict[str, Any]:
    prompt = (
        f"Profile: {profile}\nScenarios: {', '.join(scenarios)}\n"
        f"Environment: {environment}\n"
    )
    raw = await _llm(prompt, K6_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    script = parsed.get("script")
    filename = parsed.get("filename") or f"k6-{profile}.js"

    if not script:
        script = (
            "import http from 'k6/http';\n"
            "import { sleep, check } from 'k6';\n\n"
            "export const options = {\n"
            "  stages: [\n"
            "    { duration: '2m', target: 50 },\n"
            "    { duration: '10m', target: 50 },\n"
            "    { duration: '2m', target: 0 },\n"
            "  ],\n"
            "  thresholds: { http_req_duration: ['p(95)<800'] },\n"
            "};\n\n"
            "export default function () {\n"
            "  const res = http.get(__ENV.BASE_URL || 'https://test.rodekors.no');\n"
            "  check(res, { 'status 200': (r) => r.status === 200 });\n"
            "  sleep(1);\n"
            "}\n"
        )

    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "k6", "profile": profile, "scenarios": scenarios,
            "environment": environment, "filename": filename,
            "script": script, "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass
    return {"status": "ok", "filename": filename, "script": script, "lang": lang}


async def run_k6(profile: str, scenarios: List[str], environment: str) -> Dict[str, Any]:
    results = {
        "vus_max": 50, "duration": "14m",
        "http_req_duration_p95": "640ms",
        "http_req_failed": "0.4%",
        "checks_passed": "99.6%",
    }
    summary = f"k6 mock {profile} on {environment} — p95 640ms"
    run = await _store_run("redcross-stress-campaign-peak", environment, "pass",
                            summary, {"profile": profile, "scenarios": scenarios,
                                     "results": results})
    return {"status": "ok", "results": results, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 9 — Security & Privacy
# ═══════════════════════════════════════════════════════════════════
async def run_security_scan(environment: str, lang: str = "en") -> Dict[str, Any]:
    checks = {
        "checkPersonalData":   {"status": "pass", "note": "No PII in CMS content samples"},
        "checkDataSeparation": {"status": "pass"},
        "checkAuth":           {"status": "pass"},
        "checkHeaders":        {"status": "warn", "note": "CSP missing report-uri"},
        "checkOwasp":          {"status": "pass"},
        "checkFormAbuse":      {"status": "pass"},
        "checkApiAbuse":       {"status": "pass"},
        "checkRateLimit":      {"status": "warn", "note": "Donation API: 60 req/min — verify quota"},
        "checkSecrets":        {"status": "pass"},
        "checkDeps":           {"status": "warn", "note": "2 transitive deps with known CVEs"},
        "checkLogging":        {"status": "pass"},
        "checkConsent":        {"status": "pass"},
        "checkGdpr":           {"status": "pass"},
    }
    findings = [
        {"severity": "medium", "title": "Missing CSP report-uri",
         "message": "Add CSP report-uri to capture violations in production"},
        {"severity": "low", "title": "Outdated transitive dependency",
         "message": "Update lodash >= 4.17.21"},
    ]
    run = await _store_run("redcross-security-basic", environment, "warn",
                            "Security baseline scan",
                            {"checks": checks, "findings": findings})
    return {"status": "ok", "checks": checks, "findings": findings,
            "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 9b — Forms QA (Skjemabygger / Adam Silver / JSON Schema)
# ═══════════════════════════════════════════════════════════════════
async def run_forms_qa(scopes: List[str], environment: str,
                       lang: str = "en") -> Dict[str, Any]:
    """Audit Skjemabygger forms across the requested scopes (donation,
    volunteer, contact, course, beredskap, vipps-handoff). Mock-first."""
    prompt = (
        f"Forms in scope: {', '.join(scopes) if scopes else 'donation, volunteer, contact, course'}\n"
        f"Environment: {environment}\n"
        "Audit each scope and return the JSON contract."
    )
    raw = await _llm(prompt, FORMS_QA_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    checks = parsed.get("checks") or {
        "checkJsonSchema":         {"status": "pass", "note": "JSON Schema validation present on all reviewed forms"},
        "checkAdamSilverPatterns": {"status": "pass", "note": "Plain labels above inputs, no placeholder-as-label"},
        "checkMultiStep":          {"status": "warn", "note": "Volunteer signup loses state on browser back"},
        "checkMobileKeyboard":     {"status": "warn", "note": "Donation amount missing inputmode='numeric'"},
        "checkAutocomplete":       {"status": "pass", "note": "Contact form uses given-name/family-name/email/tel"},
        "checkPrefillApi":         {"status": "warn", "note": "APIM prefill has no timeout (default 30s)"},
        "checkValidationMessages": {"status": "pass", "note": "Inline errors with aria-describedby"},
        "checkAriaLive":           {"status": "warn", "note": "Dynamic errors lack role='alert'"},
        "checkErrorSummary":       {"status": "fail", "note": "No error summary on submit-with-errors"},
        "checkProgressIndicator":  {"status": "pass", "note": "Step X/Y shown on multi-step forms"},
        "checkVippsHandoff":       {"status": "pass", "note": "Return + cancel URLs validated"},
        "checkSubmitIdempotency":  {"status": "warn", "note": "Donation form lacks PRG token — refresh re-submits"},
    }

    findings = parsed.get("findings") or [
        {"severity": "high", "form": "volunteer", "title": "No error summary",
         "message": "Submit with errors does not surface an aggregated summary at top of page.",
         "fix_hint": "Add gov.uk-style error summary linked to first invalid field, move focus to it."},
        {"severity": "medium", "form": "donation", "title": "Amount field missing inputmode",
         "message": "Mobile users see alphabetic keyboard for the amount field.",
         "fix_hint": "Add inputmode='numeric' and pattern='[0-9]*'."},
        {"severity": "medium", "form": "donation", "title": "Submit not idempotent",
         "message": "Refreshing after a donation re-posts the form.",
         "fix_hint": "Use POST/Redirect/GET pattern or single-use submit token."},
        {"severity": "low", "form": "contact", "title": "APIM prefill timeout missing",
         "message": "If Azure APIM prefill is slow, the form blocks for 30s.",
         "fix_hint": "Add a 4s timeout with a graceful fallback to an empty form."},
    ]

    test_cases = parsed.get("test_cases") or [
        {"title": "Donation amount mobile keyboard", "form": "donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Open donation page on iPhone viewport", "Tap amount field"],
         "expected": "Numeric keyboard is shown (inputmode='numeric')"},
        {"title": "Volunteer signup error summary", "form": "volunteer",
         "type": "automated", "tool": "playwright",
         "steps": ["Open volunteer signup", "Submit with all fields empty"],
         "expected": "Error summary appears at top, focus moves to it, links jump to first invalid field"},
        {"title": "Vipps cancel returns to donation page", "form": "donation",
         "type": "manual", "tool": "manual",
         "steps": ["Start donation", "Continue to Vipps", "Cancel in Vipps"],
         "expected": "User lands on rodekors.no donation page with state preserved"},
    ]

    # status: fail if any fail, warn if any warn, else pass
    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = f"Forms QA on {environment} — {sum(1 for s in statuses if s=='pass')}/{len(statuses)} pass"

    run = await _store_run("redcross-forms-qa", environment, overall, summary, {
        "scopes": scopes, "checks": checks, "findings": findings,
        "test_cases": test_cases,
        "artifacts": [{"name": "forms-audit.json", "type": "report"}],
    })
    return {"status": "ok", "checks": checks, "findings": findings,
            "test_cases": test_cases, "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9c — Content Migration QA (gradvis migrering av innhold)
# ═══════════════════════════════════════════════════════════════════
async def run_content_migration_audit(scopes: List[str], environment: str,
                                      legacy_sample_size: int = 100,
                                      lang: str = "en") -> Dict[str, Any]:
    """Audit gradual content migration from legacy CMS to Enonic XP.
    Mock-first; in production would query Enonic XP API + crawl legacy URLs."""
    prompt = (
        f"Scopes / content types: {', '.join(scopes) if scopes else 'all'}\n"
        f"Environment: {environment}\n"
        f"Legacy sample size: {legacy_sample_size}\n"
        "Audit migration coverage and return the JSON contract."
    )
    raw = await _llm(prompt, CONTENT_MIGRATION_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    summary = parsed.get("summary") or {
        "total_pages_legacy":  legacy_sample_size,
        "total_pages_migrated": int(legacy_sample_size * 0.78),
        "coverage_percent":    78,
        "broken_links":        12,
        "missing_redirects":   23,
        "orphan_assets":       7,
    }

    checks = parsed.get("checks") or {
        "checkContentTypeMapping":    {"status": "pass", "note": "All 8 types mapped (Forening, Distrikt, Aktivitet, Kontaktperson, Tjeneste/Kurs, Tema, Nyhet, Kampanje)"},
        "checkNorwegianChars":        {"status": "pass", "note": "UTF-8 preserved across sample"},
        "checkRelations":             {"status": "warn", "note": "3 Aktivitet records lost their Forening parent"},
        "checkLocalization":          {"status": "warn", "note": "12 pages missing nn (nynorsk) translation"},
        "checkImageReanchoring":      {"status": "warn", "note": "7 hero images still point to legacy CDN"},
        "checkRedirects":             {"status": "fail", "note": "23 legacy URLs return 404 (no 301)"},
        "checkSeoMetadata":           {"status": "pass", "note": "Title + description preserved on 100% of sample"},
        "checkPublishState":          {"status": "pass", "note": "Draft / scheduled / archived state retained"},
        "checkIsrInvalidation":       {"status": "warn", "note": "ISR revalidation occasionally skipped on bulk publish"},
        "checkPermissionsCarryover": {"status": "pass", "note": "Role grants mapped 1:1 across 6 editorial roles"},
    }

    broken_pages = parsed.get("broken_pages") or [
        {"legacy_url": "/distrikt/oslo/aktiviteter/leksehjelp",
         "new_url": "/lokal/oslo/aktiviteter/leksehjelp",
         "issue": "missing-fields"},
        {"legacy_url": "/forening/bergen/kontaktpersoner",
         "new_url": "/lokal/bergen/kontaktpersoner",
         "issue": "broken-images"},
        {"legacy_url": "/kampanjer/2024/jul",
         "new_url": "",
         "issue": "404"},
    ]

    missing_redirects = parsed.get("missing_redirects") or [
        {"from": "/distrikt/oslo", "to": "/lokal/oslo", "status_expected": 301},
        {"from": "/forening/trondheim", "to": "/lokal/trondheim", "status_expected": 301},
        {"from": "/temaer/beredskap", "to": "/tema/beredskap", "status_expected": 301},
    ]

    test_cases = parsed.get("test_cases") or [
        {"title": "Norwegian characters preserved on Forening pages",
         "type": "automated",
         "steps": ["Crawl 50 Forening pages", "Compare body text against legacy"],
         "expected": "All æ/ø/å render correctly (no &aelig;, no ?)."},
        {"title": "Aktivitet → Forening relations intact",
         "type": "automated",
         "steps": ["List all Aktivitet content", "For each, verify parent Forening reference resolves"],
         "expected": "0 orphan Aktivitet records"},
        {"title": "301 redirects from legacy URLs",
         "type": "automated",
         "steps": ["Load redirect map", "Curl each legacy URL", "Assert 301 + Location header"],
         "expected": "100% of mapped URLs return 301 to new path"},
    ]

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    text_summary = (
        f"Migration audit on {environment} — coverage {summary['coverage_percent']}%, "
        f"{summary['broken_links']} broken, {summary['missing_redirects']} redirects missing"
    )

    run = await _store_run("redcross-content-migration", environment, overall,
                           text_summary, {
        "scopes": scopes, "summary": summary, "checks": checks,
        "broken_pages": broken_pages, "missing_redirects": missing_redirects,
        "test_cases": test_cases,
        "artifacts": [{"name": "migration-audit.json", "type": "report"}],
    })
    return {"status": "ok", "summary": summary, "checks": checks,
            "broken_pages": broken_pages, "missing_redirects": missing_redirects,
            "test_cases": test_cases, "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9d — Enonic-specific Performance
# ═══════════════════════════════════════════════════════════════════
async def run_enonic_performance(url: str, environment: str,
                                 lang: str = "en") -> Dict[str, Any]:
    """Audit Enonic XP + Next.XP + Guillotine GraphQL specific perf signals
    that Lighthouse alone misses. Mock-first."""
    prompt = (
        f"URL: {url}\nEnvironment: {environment}\n"
        "Audit waterfall, N+1, Guillotine field selection, ISR latency, "
        "image service, publish latency, bulk publish, part rendering, cache invalidation."
    )
    raw = await _llm(prompt, ENONIC_PERFORMANCE_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    checks = parsed.get("checks") or {
        "checkGraphqlWaterfall":  {"status": "warn", "p95_ms": 480, "queries": 5,
                                   "note": "5 sequential roundtrips on district pages (target ≤3)"},
        "checkGraphqlNplusOne":   {"status": "warn", "duplicate_queries": 7,
                                   "note": "7 duplicate Forening queries on Distrikt page"},
        "checkGuillotineFields":  {"status": "warn", "overfetched_fields": 23,
                                   "note": "23 Guillotine fields fetched but not rendered"},
        "checkIsrLatency":        {"status": "pass", "p95_seconds": 12,
                                   "note": "ISR revalidation p95 12s (target <30s)"},
        "checkIsrCascading":      {"status": "warn",
                                   "note": "Forening publish doesn't invalidate child Aktivitet pages"},
        "checkImageService":      {"status": "pass", "p95_ms": 420,
                                   "note": "image:// scaling p95 420ms"},
        "checkPublishLatency":    {"status": "pass", "p95_seconds": 3,
                                   "note": "Content Studio publish ack p95 3s"},
        "checkBulkPublish":       {"status": "warn",
                                   "note": "Bulk publish of 50 items blocks editor UI ~14s"},
        "checkPartRender":        {"status": "pass",
                                   "note": "Event list virtualizes after 100 rows"},
        "checkCacheInvalidation": {"status": "warn",
                                   "note": "Stale content occasionally served up to 90s after publish"},
    }
    hot_queries = parsed.get("hot_queries") or [
        {"name": "GetDistrictPage", "p95_ms": 480, "queries": 12, "duplicates": 3,
         "fix_hint": "Batch Forening lookups via fragments instead of per-card query"},
        {"name": "GetActivityList",  "p95_ms": 320, "queries": 8,  "duplicates": 4,
         "fix_hint": "Use Guillotine `_references` to pre-load related Forening once"},
        {"name": "GetCampaignPage",  "p95_ms": 260, "queries": 6,  "duplicates": 1,
         "fix_hint": "Drop unused fields from query (over-fetching `body` and `_versionKey`)"},
    ]
    recommendations = parsed.get("recommendations") or [
        {"priority": "high",   "category": "graphql",
         "title": "Reduce GraphQL waterfall on district pages",
         "description": "Batch related Forening queries into one round-trip via fragment spread."},
        {"priority": "high",   "category": "isr",
         "title": "Wire cascading ISR invalidation",
         "description": "On Forening publish, revalidate child Aktivitet/Kontaktperson paths."},
        {"priority": "medium", "category": "publish",
         "title": "Async bulk publish queue",
         "description": "Move bulk publish off the editor UI thread; show progress toast."},
        {"priority": "medium", "category": "graphql",
         "title": "Trim Guillotine field selection",
         "description": "23 fields fetched but never rendered — drop them from queries."},
    ]

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = f"Enonic perf on {url} — {sum(1 for s in statuses if s=='pass')}/{len(statuses)} pass"

    run = await _store_run("redcross-enonic-performance", environment, overall, summary, {
        "url": url, "checks": checks, "hot_queries": hot_queries,
        "recommendations": recommendations,
        "artifacts": [{"name": "enonic-perf.json", "type": "report"}],
    })
    return {"status": "ok", "url": url, "checks": checks,
            "hot_queries": hot_queries, "recommendations": recommendations,
            "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9e — Designsystemet (Digdir) Compliance
# ═══════════════════════════════════════════════════════════════════
async def run_designsystemet_audit(url: str, environment: str,
                                   lang: str = "en") -> Dict[str, Any]:
    """Audit compliance with Designsystemet from Digdir (Norwegian government
    design system). Mock-first."""
    prompt = (
        f"URL: {url}\nEnvironment: {environment}\n"
        "Audit Designsystemet (Digdir) compliance: components, tokens, typography, "
        "spacing, accessibility, brand override, version drift, button/form usage."
    )
    raw = await _llm(prompt, DESIGNSYSTEMET_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    checks = parsed.get("checks") or {
        "checkDsComponents":   {"status": "warn", "non_ds_count": 14,
                                "note": "14 buttons + inputs use raw <button>/<input> instead of @digdir/designsystemet-react"},
        "checkDsTokens":       {"status": "warn", "non_token_colors": 38,
                                "note": "38 hex colors not mapped to ds-color-* tokens"},
        "checkDsTypography":   {"status": "pass",
                                "note": "Font scale uses ds-font-size-* tokens"},
        "checkDsSpacing":      {"status": "pass",
                                "note": "Spacing aligned with ds-spacing-* (multiples of 4)"},
        "checkDsAccessibility":{"status": "pass",
                                "note": "DS focus rings retained, no aria overrides"},
        "checkDsDarkMode":     {"status": "warn",
                                "note": "Dark mode supported by DS but not exposed to users"},
        "checkBrandOverride":  {"status": "pass",
                                "note": "Red Cross red applied via DS theme tokens, not inline"},
        "checkDsVersion":      {"status": "warn", "version_used": "1.0.0", "latest": "1.4.2",
                                "note": "@digdir/designsystemet-react one minor + 4 patches behind"},
        "checkDsButtonUsage":  {"status": "warn",
                                "note": "Tertiary used as primary on 3 pages (semantic mismatch)"},
        "checkDsFormElements": {"status": "warn",
                                "note": "Volunteer form uses placeholder-as-label (anti-pattern)"},
    }
    deviations = parsed.get("deviations") or [
        {"severity": "high",   "component": "Button",
         "page": "/donasjon", "title": "Donation CTA bypasses DS Button",
         "message": "Custom <button> on donation CTA — loses DS focus ring + keyboard semantics.",
         "fix_hint": "Replace with <Button variant='primary' size='lg'> from @digdir/designsystemet-react"},
        {"severity": "medium", "component": "Input",
         "page": "/bli-frivillig", "title": "Volunteer form uses placeholder-as-label",
         "message": "Inputs missing <Label> — placeholder vanishes on focus.",
         "fix_hint": "Use DS <Textfield label='Fullt navn'> with explicit label slot."},
        {"severity": "medium", "component": "Tag",
         "page": "/lokal/oslo", "title": "District tags use raw spans",
         "message": "Custom span pills instead of DS <Tag>.",
         "fix_hint": "Replace with <Tag color='neutral'> from DS."},
    ]
    recommendations = parsed.get("recommendations") or [
        {"title": "Migrate raw buttons to DS Button",
         "category": "components",
         "description": "Replace 14 raw <button> with DS <Button> across donation, volunteer, contact pages."},
        {"title": "Bump @digdir/designsystemet-react",
         "category": "components",
         "description": "Upgrade 1.0.0 → 1.4.2 for latest a11y fixes and Norwegian text adjustments."},
        {"title": "Map raw hex colors to DS tokens",
         "category": "tokens",
         "description": "38 raw hex values found — define ds-color-rk-* aliases and replace."},
    ]
    score = parsed.get("compliance_score") if isinstance(parsed.get("compliance_score"), int) else 72

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = f"Designsystemet compliance {score}/100 on {url}"

    run = await _store_run("redcross-designsystemet", environment, overall, summary, {
        "url": url, "compliance_score": score, "checks": checks,
        "deviations": deviations, "recommendations": recommendations,
        "artifacts": [{"name": "designsystemet-audit.json", "type": "report"}],
    })
    return {"status": "ok", "url": url, "compliance_score": score,
            "checks": checks, "deviations": deviations,
            "recommendations": recommendations, "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9f — Role Permissions Matrix
# ═══════════════════════════════════════════════════════════════════
async def run_role_matrix_audit(environment: str,
                                lang: str = "en") -> Dict[str, Any]:
    """Audit the 6 editorial roles × 4 actions × scope authorization matrix
    on Enonic XP Content Studio. Mock-first."""
    prompt = (
        f"Environment: {environment}\n"
        "Audit role × action × scope for the 6 editorial roles "
        "(Administrator, Eier, Lokal eier, Redaktør, Lokal redaktør, Bidragsyter)."
    )
    raw = await _llm(prompt, ROLE_MATRIX_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    matrix = parsed.get("matrix") or [
        {"role": "Administrator",  "scope": "Global",
         "read": "allow", "edit": "allow", "publish": "allow", "delete": "allow"},
        {"role": "Eier",           "scope": "Global",
         "read": "allow", "edit": "allow", "publish": "allow", "delete": "allow"},
        {"role": "Lokal eier",     "scope": "Own district",
         "read": "allow", "edit": "allow", "publish": "allow", "delete": "allow"},
        {"role": "Lokal eier",     "scope": "Other district",
         "read": "allow", "edit": "deny",  "publish": "deny",  "delete": "deny"},
        {"role": "Redaktør",       "scope": "Global",
         "read": "allow", "edit": "allow", "publish": "allow", "delete": "deny"},
        {"role": "Lokal redaktør", "scope": "Own district",
         "read": "allow", "edit": "allow", "publish": "allow", "delete": "deny"},
        {"role": "Lokal redaktør", "scope": "Other district",
         "read": "allow", "edit": "deny",  "publish": "deny",  "delete": "deny"},
        {"role": "Bidragsyter",    "scope": "Own drafts",
         "read": "allow", "edit": "allow", "publish": "deny",  "delete": "deny"},
        {"role": "Bidragsyter",    "scope": "Published content",
         "read": "allow", "edit": "deny",  "publish": "deny",  "delete": "deny"},
    ]

    checks = parsed.get("checks") or {
        "checkSubtreeIsolation":    {"status": "pass", "note": "Local roles confined to their district subtree"},
        "checkPublishGuard":        {"status": "pass", "note": "Bidragsyter cannot publish (UI + API)"},
        "checkDeleteGuard":         {"status": "warn", "note": "Editor can delete root nodes via direct API call"},
        "checkRoleAssignmentGuard": {"status": "pass", "note": "Only Owner/Administrator can assign roles"},
        "checkAuditLog":            {"status": "warn", "note": "Audit log missing user-agent + IP for delete events"},
        "checkSessionExpiry":       {"status": "pass", "note": "Editorial sessions expire after 8h inactivity"},
        "checkPrivilegeEscalation": {"status": "pass", "note": "Self-promotion blocked at API + UI layer"},
        "checkApiAuthZ":            {"status": "warn", "note": "Direct Guillotine call bypasses some scope checks"},
    }
    violations = parsed.get("violations") or [
        {"severity": "high", "role": "Redaktør", "action": "delete",
         "scope": "Root node", "expected": "deny", "actual": "allow",
         "fix_hint": "Add server-side guard on /content-api delete; UI hides button but API does not."},
        {"severity": "medium", "role": "Lokal redaktør", "action": "read",
         "scope": "Other district draft", "expected": "deny", "actual": "allow",
         "fix_hint": "Drafts in other districts should be 403, currently 200."},
    ]
    test_cases = parsed.get("test_cases") or [
        {"role": "Lokal redaktør", "title": "Cannot edit content outside own district",
         "type": "automated", "tool": "playwright",
         "steps": ["Login as Oslo Lokal redaktør", "Navigate to /lokal/bergen/aktiviteter", "Attempt edit"],
         "expected": "Edit button disabled or 403 from API"},
        {"role": "Bidragsyter", "title": "Cannot publish draft",
         "type": "automated", "tool": "playwright",
         "steps": ["Login as Bidragsyter", "Open own draft", "Attempt publish"],
         "expected": "Publish button absent; direct POST returns 403"},
        {"role": "Eier", "title": "Can assign Lokal redaktør role to another user",
         "type": "manual", "tool": "manual",
         "steps": ["Login as Eier", "Open user admin", "Assign Lokal redaktør role"],
         "expected": "Role assigned and visible in audit log"},
    ]

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = f"Role matrix on {environment} — {len(matrix)} role/scope rows, {len(violations)} violations"

    run = await _store_run("redcross-role-matrix", environment, overall, summary, {
        "matrix": matrix, "checks": checks,
        "violations": violations, "test_cases": test_cases,
        "artifacts": [{"name": "role-matrix.json", "type": "report"}],
    })
    return {"status": "ok", "matrix": matrix, "checks": checks,
            "violations": violations, "test_cases": test_cases,
            "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 10 — Jira Action Bundle + dispatch
# ═══════════════════════════════════════════════════════════════════
async def get_jira_bundle_preview(environment: str) -> Dict[str, Any]:
    settings = await get_settings()
    s = settings["settings"]
    issues: List[Dict[str, Any]] = []
    try:
        cursor = red_cross_qa_runs_collection.find(
            {"environment": environment, "status": {"$in": ["fail", "warn"]}}
        ).sort("started_at", -1).limit(10)
        async for run in cursor:
            payload = run.get("payload", {}) or {}
            for f in (payload.get("findings") or [])[:3]:
                issues.append({
                    "title": f.get("title") or f.get("message") or "QA finding",
                    "type": "Bug",
                    "priority": _priority_from_severity(f.get("severity")),
                    "description": f"From run {run.get('run_id')} ({run.get('suite')}): {f.get('message','')}",
                })
    except Exception:
        pass

    if not issues:
        issues = [
            {"title": "Donation CTA contrast below WCAG AA",
             "type": "Bug", "priority": "Medium",
             "description": "Mock — found by axe-core. Suggested fix: darken brand-red-500."},
            {"title": "Missing CSP report-uri",
             "type": "Task", "priority": "Low",
             "description": "Mock — add report-uri to CSP header."},
        ]

    bundle = {
        "project_key": s["jira_project"],
        "component": s["jira_component"],
        "labels": s["jira_labels"],
        "issues": issues,
        "environment": environment,
    }
    return {"status": "ok", "bundle": bundle}


def _priority_from_severity(sev: Optional[str]) -> str:
    return {"critical": "Critical", "high": "High",
            "medium": "Medium", "low": "Low"}.get((sev or "medium").lower(), "Medium")


async def create_jira_issues(environment: str, lang: str = "en") -> Dict[str, Any]:
    preview = await get_jira_bundle_preview(environment)
    bundle = preview["bundle"]
    record = {
        "bundle": bundle,
        "destination": "jira",
        "status": "dispatched",
        "created_at": _now(),
        "environment": environment,
    }
    try:
        await red_cross_qa_jira_dispatches_collection.insert_one(dict(record))
    except Exception:
        pass
    return {"status": "ok", "created_count": len(bundle["issues"]),
            "destination": "jira", "bundle": bundle}


async def dispatch_to_outsystems(environment: str) -> Dict[str, Any]:
    preview = await get_jira_bundle_preview(environment)
    bundle = preview["bundle"]
    record = {
        "bundle": bundle, "destination": "outsystems",
        "status": "dispatched", "created_at": _now(),
        "environment": environment,
    }
    try:
        await red_cross_qa_jira_dispatches_collection.insert_one(dict(record))
    except Exception:
        pass
    return {"status": "ok", "dispatched_count": len(bundle["issues"]),
            "destination": "outsystems", "bundle": bundle}


# ═══════════════════════════════════════════════════════════════════
# Runs / Stats / Settings
# ═══════════════════════════════════════════════════════════════════
async def list_runs(environment: Optional[str] = None,
                    limit: int = 50) -> Dict[str, Any]:
    runs: List[Dict[str, Any]] = []
    try:
        query = {"environment": environment} if environment else {}
        cursor = red_cross_qa_runs_collection.find(query).sort("started_at", -1).limit(limit)
        async for r in cursor:
            r.pop("_id", None)
            r.pop("payload", None)  # keep list lightweight
            runs.append(r)
    except Exception:
        pass

    if not runs:
        # Mock fallback so the runs tab is not empty in fresh installs
        runs = [{
            "run_id": "rcqa-demo-0001", "suite": "redcross-smoke-public",
            "environment": environment or "test", "status": "pass",
            "started_at": _now(), "ended_at": _now(),
            "summary": "Mock smoke run — 12 checks passed",
            "attestation_hash": "demo" + "0" * 28,
            "artifacts": [{"name": "report.html"}],
        }]
    return {"status": "ok", "runs": runs}


async def get_run(run_id: str) -> Dict[str, Any]:
    try:
        run = await red_cross_qa_runs_collection.find_one({"run_id": run_id})
        if run:
            run.pop("_id", None)
            return {"status": "ok", "run": run}
    except Exception:
        pass
    return {"status": "error", "message": f"Run {run_id} not found"}


async def get_stats(environment: Optional[str] = None) -> Dict[str, Any]:
    total = 0
    pass_ct = 0
    fail_ct = 0
    warn_ct = 0
    findings = 0
    critical = 0
    try:
        query = {"environment": environment} if environment else {}
        total = await red_cross_qa_runs_collection.count_documents(query)
        pass_ct = await red_cross_qa_runs_collection.count_documents({**query, "status": "pass"})
        fail_ct = await red_cross_qa_runs_collection.count_documents({**query, "status": "fail"})
        warn_ct = await red_cross_qa_runs_collection.count_documents({**query, "status": "warn"})
        findings = await red_cross_qa_findings_collection.count_documents(query)
        critical = await red_cross_qa_findings_collection.count_documents({**query, "severity": "critical"})
    except Exception:
        pass

    pass_rate = round((pass_ct / total) * 100) if total else 0
    return {
        "status": "ok",
        "total_runs": total,
        "pass_rate": pass_rate,
        "open_findings": findings,
        "critical_blockers": critical,
        "by_status": {"pass": pass_ct, "fail": fail_ct, "warn": warn_ct},
        "quality_gates": {
            "gateAccessibility": "warn" if total else "idle",
            "gatePerformance":   "warn" if total else "idle",
            "gateApi":           "pass" if total else "idle",
            "gateSecurity":      "warn" if total else "idle",
            "gateSeo":           "pass" if total else "idle",
            "gateForms":         "warn" if total else "idle",
            "gateCms":           "pass" if total else "idle",
            "gateStress":        "pass" if total else "idle",
            "gateMigration":     "warn" if total else "idle",
            "gateDesignsystemet":"warn" if total else "idle",
            "gateRoleMatrix":    "warn" if total else "idle",
        },
    }


async def get_settings() -> Dict[str, Any]:
    try:
        doc = await red_cross_qa_settings_collection.find_one({"_singleton": "main"})
        if doc:
            doc.pop("_id", None)
            doc.pop("_singleton", None)
            merged = {**DEFAULT_SETTINGS, **doc}
            return {"status": "ok", "settings": merged}
    except Exception:
        pass
    return {"status": "ok", "settings": dict(DEFAULT_SETTINGS)}


async def save_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    safe = {k: v for k, v in payload.items() if k in DEFAULT_SETTINGS}
    try:
        await red_cross_qa_settings_collection.update_one(
            {"_singleton": "main"},
            {"$set": {**safe, "_singleton": "main", "updated_at": _now()}},
            upsert=True,
        )
        return {"status": "ok", "settings": {**DEFAULT_SETTINGS, **safe}}
    except Exception as e:
        return {"status": "error", "message": f"Could not save settings: {e}"}
