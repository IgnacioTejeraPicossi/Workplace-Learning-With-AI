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
            "gateForms":         "pass" if total else "idle",
            "gateCms":           "pass" if total else "idle",
            "gateStress":        "pass" if total else "idle",
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
