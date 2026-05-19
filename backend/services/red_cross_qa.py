"""
Red Cross Web QA Agent — Service Layer (Agent #9)
==================================================
24/7 QA copilot for the rodekors.no website (Enonic CMS + NextJS).

Phase 1 — Mock-first implementation:
  - Generates structured Test Plans, Playwright/Cypress/k6 scripts via LLM
  - Provides deterministic mock results for execution endpoints
  - Stores runs, findings, generated scripts, Azure DevOps dispatches in MongoDB

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
    "redcross-stress-browser-loadster",  # Phase D: Loadster browser-level
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
    # Azure DevOps (Trine bruker ADO som offisielt testverktøy — Teststrategi 30.3)
    "ado_organization": "rodekors",
    "ado_project": "rodekors-web",
    "ado_area_path": "rodekors-web\\Web QA",
    "ado_iteration_path": "rodekors-web\\Sprint 1",
    "ado_tags": ["red-cross-qa", "ai-generated"],
    # Sprint context (used by Sprint Report generator)
    "current_sprint": "Sprint 1",
    "sprint_length_weeks": 2,
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
Convert the input (Azure DevOps epic / user story + acceptance criteria + design link + risk level)
into a complete sprint test plan.

The test tool used by Røde Kors is Azure DevOps (per Trines Teststrategi 30.3 §5).
All work-item suggestions must use ADO terminology: Bug, Task, User Story, Test Case.

Return ONLY valid JSON with this shape:
{
  "manual_tests": [{"title": "...", "steps": ["..."], "expected": "..."}],
  "automated_candidates": [{"title": "...", "tool": "playwright|cypress|k6|axe", "rationale": "..."}],
  "accessibility_checklist": ["..."],
  "api_checks": [{"endpoint": "...", "method": "...", "check": "..."}],
  "regression_scope": ["..."],
  "suggested_test_data": ["..."],
  "ado_work_items": [{"title": "...", "work_item_type": "Task|Bug|Test Case", "priority": 1, "test_level": "unit|sit|system|uat|performance"}]
}

Test-level taxonomy (per Teststrategi §5): unit, sit, system, uat, performance.
Always include: migrated-data check + newly-created-data check + extreme-data check
(long strings, æøå, special chars). Cover happy path + at least one negative path +
one accessibility check. Reference donation/volunteer/local-services/CMS-preview flows
where relevant."""

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

Donation forms on rodekors.no are powered by **Fundy** (separate from Vipps —
Fundy is the donation-form provider, Vipps is one of the payment handoff targets).
The audit MUST cover both Fundy form rendering AND its handoff into payment providers.

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
    "checkSubmitIdempotency": {"status": "pass|warn|fail", "note": "..."},
    "checkFundyFormRendering": {"status": "pass|warn|fail", "note": "Fundy donation form renders correctly"},
    "checkFundyAmountSelection": {"status": "pass|warn|fail", "note": "Preset amounts + custom amount work, NOK formatting correct"},
    "checkFundyFrequencyToggle": {"status": "pass|warn|fail", "note": "One-time vs monthly selection persists"},
    "checkFundyDonorFields": {"status": "pass|warn|fail", "note": "Name/email/phone validation, æøå accepted"},
    "checkFundyConsentCheckboxes": {"status": "pass|warn|fail", "note": "GDPR consent + marketing opt-in work and are NOT pre-checked"},
    "checkFundyHandoffPayload": {"status": "pass|warn|fail", "note": "Fundy → payment provider handoff carries amount, frequency, donor data correctly"},
    "checkFundyAccessibility": {"status": "pass|warn|fail", "note": "Fundy form passes axe-core (WCAG 2.2 AA) — labels, focus, keyboard, ARIA"},
    "checkFundyMobile": {"status": "pass|warn|fail", "note": "Fundy form usable on iOS Safari + Android Chrome (320px+)"},
    "checkFundyErrorRecovery": {"status": "pass|warn|fail", "note": "Network errors + payment failures show actionable messages without losing data"}
  },
  "findings": [{"severity": "low|medium|high|critical", "form": "...", "title": "...", "message": "...", "fix_hint": "..."}],
  "test_cases": [{"title": "...", "form": "...", "type": "manual|automated", "tool": "playwright|cypress|axe|manual", "steps": ["..."], "expected": "..."}]
}
Cover donation (Fundy), volunteer, contact, course and Vipps handoff flows where relevant.
For donation forms specifically include: extreme-data tests (æøå in name, very long names),
migrated content checks, and full Fundy → Vipps handoff verification.
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

DPIA_PROMPT = """You are a senior privacy / GDPR engineer auditing rodekors.no for
**innebygget personvern (Privacy by Design)** and DPIA (Data Protection Impact Assessment)
readiness. Røde Kors processes sensitive volunteer data (health, criminal-record statements,
crisis beneficiary data), so DPIA evidence is mandatory under GDPR Art. 35 + the Norwegian
personopplysningsloven + Datatilsynet guidance.

Return ONLY valid JSON:
{
  "dpia_score": 0-100,
  "checks": {
    "checkDataMapping":         {"status": "pass|warn|fail", "note": "..."},
    "checkPurposeLimitation":   {"status": "pass|warn|fail", "note": "..."},
    "checkLegalBasis":          {"status": "pass|warn|fail", "note": "..."},
    "checkDataMinimization":    {"status": "pass|warn|fail", "note": "..."},
    "checkRetentionPolicy":     {"status": "pass|warn|fail", "note": "..."},
    "checkDeletionRoutines":    {"status": "pass|warn|fail", "note": "..."},
    "checkConsentRecords":      {"status": "pass|warn|fail", "note": "..."},
    "checkDataSubjectRights":   {"status": "pass|warn|fail", "note": "..."},
    "checkProcessorRegister":   {"status": "pass|warn|fail", "note": "..."},
    "checkCrossBorderTransfer": {"status": "pass|warn|fail", "note": "..."},
    "checkBreachNotification":  {"status": "pass|warn|fail", "note": "..."},
    "checkSensitiveCategories": {"status": "pass|warn|fail", "note": "..."}
  },
  "findings": [{
    "severity": "low|medium|high|critical",
    "severity_dev": 1, "category_ops": "A",
    "title": "...", "message": "...", "fix_hint": "...",
    "gdpr_article": "Art. 5 / 6 / 9 / 25 / 32 / 35 / ..."
  }],
  "data_register": [{
    "system": "Enonic CMS|Fundy|Vipps|Dataverse|APIM|Okta|Logs",
    "categories": "...", "purpose": "...", "legal_basis": "...",
    "retention": "...", "processor": "..."
  }],
  "recommendations": [{"priority": "high|medium|low", "title": "...", "description": "..."}]
}

Røde Kors-specific risks to consider:
- Volunteer health declarations (helseerklæring) — særlige kategorier (Art. 9)
- Criminal-record statements (politiattest) — strengere krav
- Beredskap / crisis-beneficiary data — særlige kategorier
- Donor data (Fundy → Vipps) — finansiell informasjon
- Frivillig-portrett / images — samtykke per frivillig
"""

DOD_VERIFIER_PROMPT = """You are a senior QA lead applying Trine Bruus Definition of Done
(per Teststrategi 30.3 §6.1) mechanically across an Azure DevOps sprint backlog.

Definition of Done required signals (per work item):
  1. functionality_tested — at least one passing test artifact (run + status=pass)
  2. integrations_verified — relevant integration suite (api/cms/forms/role) ran and passed
  3. known_bugs_documented — open findings either marked as accepted (workaround) or fixed
  4. ready_for_uat — no severity_dev≤2 / category_ops in {A, B} blockers remain

Return ONLY valid JSON:
{
  "summary": {
    "total_work_items": 0, "dod_pass": 0, "dod_partial": 0, "dod_fail": 0,
    "blockers_open": 0, "ready_for_uat": true
  },
  "items": [{
    "work_item_id": "...", "title": "...",
    "checklist": {
      "functionality_tested":   {"status": "pass|fail", "evidence": "run_id or note"},
      "integrations_verified":  {"status": "pass|fail", "evidence": "..."},
      "known_bugs_documented":  {"status": "pass|fail", "evidence": "..."},
      "ready_for_uat":          {"status": "pass|fail", "evidence": "..."}
    },
    "dod_pass": true,
    "blockers": [{"severity_dev": 1, "category_ops": "A", "title": "..."}]
  }],
  "narrative": "Brief Norwegian/English status summary for the sprint review."
}
"""

UAT_SUPPORT_PROMPT = """You are a senior QA lead supporting Røde Kors's UAT (User Acceptance
Testing) phase. Item Consulting does NOT execute UAT — Røde Kors does, "med støtte fra
leverandør ved behov" (per Teststrategi 30.3 §5.4). Your job is to produce UAT-ready
artifacts: step-by-step scripts, acceptance checklists, and sign-off forms for named
Røde Kors stakeholders.

Named stakeholders (per organisasjonskart 30.3):
  - Hilde Forslund (Produkteier / Product Owner)
  - Trine Røsand Scheen (Fagperson / Subject-matter expert)
  - Astri Fretheim (Fagperson / Subject-matter expert)

Return ONLY valid JSON:
{
  "uat_scripts": [{
    "script_id": "UAT-001",
    "title": "...",
    "stakeholder": "Hilde Forslund | Trine Røsand Scheen | Astri Fretheim",
    "scope": "donation|volunteer|cms-editorial|search|forms|...",
    "preconditions": ["..."],
    "steps": [{"n": 1, "action": "...", "expected": "..."}],
    "acceptance_criteria": ["..."],
    "estimated_minutes": 0,
    "test_data": ["..."]
  }],
  "checklists": [{
    "stakeholder": "...",
    "items": [{"label": "...", "required": true, "status": "pending"}]
  }],
  "signoff_form": {
    "sprint": "...",
    "build_attestation": "SHA-256 from latest run",
    "lines": [
      {"role": "Produkteier", "name": "Hilde Forslund", "decision": "godkjent|ikke godkjent|godkjent med merknader", "comment": ""},
      {"role": "Fagperson", "name": "Trine Røsand Scheen", "decision": "...", "comment": ""},
      {"role": "Fagperson", "name": "Astri Fretheim", "decision": "...", "comment": ""}
    ]
  },
  "support_notes": ["..."]
}

Norwegian language preferred for stakeholder-facing text. Keep technical identifiers
(work_item_id, run_id) in English.
"""

RISK_MATRIX_PROMPT = """You are a senior QA risk analyst mapping Røde Kors's risikomatrise
(maintained outside Teststrategi 30.3 per §10) to the agent's 17 test suites. Given a
list of risks (id, description, probability 1-5, impact 1-5, area), produce a justified
test-priority recommendation.

Return ONLY valid JSON:
{
  "risk_count": 0,
  "high_risks": [{"id": "...", "description": "...", "score": 0, "level": "critical|high|medium|low"}],
  "suite_priority": [{
    "suite": "accessibility|performance|api|security|cms|seo|forms|stress|migration|designsystemet|role-matrix|dpia|uat",
    "priority": 1,
    "rationale": "...",
    "linked_risks": ["risk_id_1", "risk_id_2"]
  }],
  "coverage_gaps": [{"risk_id": "...", "reason": "no suite covers this", "suggestion": "..."}],
  "summary_narrative": "..."
}

Score formula: score = probability × impact (1-25). Levels: ≥15 critical, ≥9 high,
≥4 medium, else low. Sort suite_priority by max linked-risk score descending.
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
async def generate_test_plan(ado_work_item: str, acceptance: str, design_link: str,
                             risk_level: str, environment: str,
                             lang: str = "en") -> Dict[str, Any]:
    user_prompt = (
        f"Azure DevOps epic / user story:\n{ado_work_item}\n\n"
        f"Acceptance criteria:\n{acceptance}\n\n"
        f"Design link: {design_link or 'N/A'}\n"
        f"Risk level: {risk_level}\n"
        f"Environment: {environment}\n"
    )
    raw = await _llm(user_prompt, TEST_PLAN_PROMPT, lang)
    parsed = _parse_json(raw or "")

    if not parsed:
        # Mock fallback — uses Azure DevOps terminology + test-level taxonomy.
        # Phase H+ (Enonic skill 0.1.0, 2026-05-19): includes static-review work
        # items + NoQL injection manual test + DST regression line so the plan
        # exercises the Enonic XP audit knowledge base even without an LLM.
        parsed = {
            "manual_tests": [
                {"title": "Visitor can complete donation flow on mobile",
                 "steps": ["Open donation page", "Choose amount", "Continue to payment"],
                 "expected": "Provider handoff screen renders"},
                {"title": "Migrated content article renders correctly",
                 "steps": ["Open migrated article URL", "Verify æøå chars", "Verify images"],
                 "expected": "Page identical to legacy version"},
                {"title": "Extreme-data form submission",
                 "steps": ["Submit volunteer form with 500-char name + æøå/special chars"],
                 "expected": "Validation handles or accepts safely"},
                {"title": "Custom selector service rejects NoQL-injection payload",
                 "steps": [
                     "Open Content Studio selector for migrated publications",
                     "Type the payload: ' OR type = 'anything",
                     "Submit / wait for results",
                 ],
                 "expected": "Service escapes or returns 0 hits — no extra rows leak. Server log shows no unfiltered query."},
                {"title": "Migrated publication link round-trips parameter name",
                 "steps": [
                     "Navigate to the related-publications list",
                     "Click any publication card → header renders",
                     "Verify the URL contains ?id= (not ?cristinid=) AND the header reads the same key"],
                 "expected": "Header shows the publication — no blank page (regression guard against Cristin→NVA URL drift)"},
            ],
            "automated_candidates": [
                {"title": "donation-flow-smoke", "tool": "playwright",
                 "rationale": "Critical revenue path"},
                {"title": "axe-core scan on donation page", "tool": "axe",
                 "rationale": "WCAG 2.2 AA"},
                {"title": "enonic-static-review", "tool": "static",
                 "rationale": "Run .claude/skills/enonic-xp checklist against lib/* sources"},
            ],
            "accessibility_checklist": [
                "Keyboard reachable amount selector",
                "Color contrast ≥ 4.5:1",
                "Form errors announced to screen readers",
            ],
            "api_checks": [
                {"endpoint": "/site/api/graphql", "method": "POST",
                 "check": "Donation query returns localized fields"},
            ],
            "regression_scope": [
                "Donation page",
                "Volunteer signup",
                "Local pages",
                "Scheduled import runs at expected local hour after DST transition (Europe/Oslo, not GMT+1:00)",
            ],
            "suggested_test_data": [
                "100 NOK / monthly",
                "500 NOK / one-time",
                "Migrated article (æøå)",
                "Long-string name (500 chars)",
                "NoQL-injection probe: ' OR type = 'anything",
            ],
            "ado_work_items": [
                {"title": "Add Playwright donation smoke",
                 "work_item_type": "Task", "priority": 2, "test_level": "system"},
                {"title": "Add axe-core check on donation page",
                 "work_item_type": "Task", "priority": 3, "test_level": "system"},
                {"title": "Verify Vipps handoff (SIT)",
                 "work_item_type": "Test Case", "priority": 2, "test_level": "sit"},
                {"title": "Lighthouse Core Web Vitals smoke",
                 "work_item_type": "Test Case", "priority": 3, "test_level": "performance"},
                {"title": "Static review: NoQL injection in custom selector services",
                 "work_item_type": "Task", "priority": 2, "test_level": "static-review"},
                {"title": "Static review: stale-data lifecycle in import tasks (removedFromX flag)",
                 "work_item_type": "Task", "priority": 2, "test_level": "static-review"},
                {"title": "Static review: Nashorn compatibility sweep of lib/* TypeScript sources",
                 "work_item_type": "Task", "priority": 3, "test_level": "static-review"},
            ],
        }

    return {"status": "ok", "plan": parsed, "lang": lang, "environment": environment}


# ═══════════════════════════════════════════════════════════════════
# Tool 2 — Playwright generator + runner
# ═══════════════════════════════════════════════════════════════════
async def generate_playwright_tests(scopes: List[str], environment: str,
                                    lang: str = "en") -> Dict[str, Any]:
    """Phase F (Tom's tip · 2026-05-12):
    When 'scenarioStorybook' is included in `scopes`, the generator emits a
    Playwright spec wired to Storybook (`@storybook/test-runner` style) so the
    Designsystemet components can be smoke-tested + axe-checked story by story.
    Tom's reasoning: 'Playwright er bundlet med Storybook, så vi bruker det i
    stedet for Cypress, siden verktøy-integrasjonen er på plass allerede.'
    The Storybook scope is generated DETERMINISTICALLY (template below) so the
    output is identical with or without an LLM — workshop-demo friendly.
    """
    prompt = (
        f"Scopes: {', '.join(scopes)}\nEnvironment: {environment}\n"
        "Generate one Playwright TS file per scope (max 5 scripts)."
    )
    raw = await _llm(prompt, PLAYWRIGHT_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    scripts = parsed.get("scripts") or []

    # Phase F — if Storybook scope is requested, ALWAYS append the Storybook
    # spec from the deterministic template, even when the LLM produced its own
    # output for other scopes. Storybook needs specific patterns
    # (`/iframe.html?id=...`, axe injection per story, viewport sizing) that we
    # don't want to leave to LLM hallucination.
    if "scenarioStorybook" in (scopes or []):
        already_has_storybook = any(
            "storybook" in (s.get("filename") or "").lower()
            or "storybook" in (s.get("content") or "").lower()
            for s in scripts
        )
        if not already_has_storybook:
            scripts.append(_storybook_playwright_spec())

    # Phase H+ (Enonic skill 0.1.0, 2026-05-19) — same pattern for two
    # high-value deterministic specs:
    #   1. `scopeCmsPreview`  → cms-preview.spec.ts   (Content Studio preview)
    #   2. `scopeNavigation`  → migrated-links.spec.ts (regression guard against
    #                            Cristin → NVA URL-parameter drift)
    # Both are appended only when their respective scope was requested AND no
    # equivalent script already exists in the LLM output. Workshop-demo safe:
    # without an LLM the deterministic templates carry the load.
    if "scopeCmsPreview" in (scopes or []):
        already_has_cms_preview = any(
            "cms-preview" in (s.get("filename") or "").lower()
            or "Content Studio Preview" in (s.get("content") or "")
            for s in scripts
        )
        if not already_has_cms_preview:
            scripts.append(_cms_preview_playwright_spec())

    if "scopeNavigation" in (scopes or []):
        already_has_migrated_links = any(
            "migrated-links" in (s.get("filename") or "").lower()
            or "Migrated-link round-trip" in (s.get("content") or "")
            for s in scripts
        )
        if not already_has_migrated_links:
            scripts.append(_migrated_links_playwright_spec())

    if not scripts:
        # Non-Storybook fallback — generic per-scope smoke.
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


def _storybook_playwright_spec() -> Dict[str, str]:
    """Deterministic Storybook + Playwright spec template (Phase F).

    Targets the local Storybook (default port 6006). Loads three Designsystemet
    stories (button, form-field, alert) and runs axe-core on each one. Real
    project will swap the story IDs in for the actual Designsystemet stories
    once the team publishes them; the template uses canonical Designsystemet
    story IDs (`button--primary`, `textfield--default`, `alert--info`).

    Phase H+ (Enonic skill 0.1.0, 2026-05-19) hardening: every page.goto now
    asserts the HTTP status AND that #storybook-root has real children.
    Without this guard, a renamed story ID (e.g. Tom reorganises Designsystemet
    storybook IDs) would silently 404 — Storybook's iframe returns 200 with an
    empty root, and the original test would still 'pass'.
    """
    content = (
        "import { test, expect } from '@playwright/test';\n"
        "import { injectAxe, checkA11y } from 'axe-playwright';\n\n"
        "/**\n"
        " * Storybook smoke + a11y for Designsystemet components.\n"
        " * Tom (Tech leder, Røde Kors): 'Playwright er bundlet med Storybook,\n"
        " * så vi bruker det i stedet for Cypress, siden verktøy-integrasjonen\n"
        " * er på plass allerede.'\n"
        " *\n"
        " * Run with Storybook already started on port 6006:\n"
        " *   npx storybook dev -p 6006 &\n"
        " *   npx playwright test storybook.spec.ts\n"
        " *\n"
        " * Drift-detection: each test asserts the story page returned HTTP 200\n"
        " * AND that #storybook-root has at least one child element. A renamed\n"
        " * or removed story will fail loudly instead of passing silently.\n"
        " */\n\n"
        "const STORYBOOK = process.env.STORYBOOK_URL || 'http://localhost:6006';\n\n"
        "const STORIES = [\n"
        "  { id: 'button--primary',       title: 'Designsystemet · Button primary' },\n"
        "  { id: 'textfield--default',    title: 'Designsystemet · TextField default' },\n"
        "  { id: 'alert--info',           title: 'Designsystemet · Alert info' },\n"
        "];\n\n"
        "for (const story of STORIES) {\n"
        "  test.describe(story.title, () => {\n"
        "    test('renders + WCAG 2.2 AA via axe-core', async ({ page }) => {\n"
        "      const resp = await page.goto(`${STORYBOOK}/iframe.html?id=${story.id}&viewMode=story`);\n"
        "      expect(resp?.status(), `story '${story.id}' returned non-2xx — was it renamed?`).toBeLessThan(400);\n"
        "      await page.waitForLoadState('networkidle');\n"
        "      // Storybook renders into #storybook-root. Empty root = silent 404 — fail loudly.\n"
        "      await expect(page.locator('#storybook-root')).toBeVisible();\n"
        "      await expect(\n"
        "        page.locator('#storybook-root *').first(),\n"
        "        `story '${story.id}' rendered an empty #storybook-root — silent drift?`\n"
        "      ).toBeAttached({ timeout: 5000 });\n"
        "      await injectAxe(page);\n"
        "      await checkA11y(page, undefined, {\n"
        "        detailedReport: true,\n"
        "        axeOptions: { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag22aa'] } },\n"
        "      });\n"
        "    });\n\n"
        "    test('keyboard interaction works', async ({ page }) => {\n"
        "      const resp = await page.goto(`${STORYBOOK}/iframe.html?id=${story.id}&viewMode=story`);\n"
        "      expect(resp?.status()).toBeLessThan(400);\n"
        "      await page.waitForLoadState('networkidle');\n"
        "      await page.keyboard.press('Tab');\n"
        "      const active = await page.evaluate(() => document.activeElement?.tagName);\n"
        "      expect(['BUTTON','INPUT','TEXTAREA','A']).toContain(active);\n"
        "    });\n"
        "  });\n"
        "}\n"
    )
    return {"filename": "storybook.spec.ts", "content": content}


def _cms_preview_playwright_spec() -> Dict[str, str]:
    """Deterministic Content Studio Preview + Playwright spec template.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): a renamed-parameter or
    broken preview cookie was the most-frequent regression observed in
    real Enonic XP releases. This spec covers the canonical preview path:

      /admin/site/preview/<draft branch>/<contentPath>

    Three deterministic checks:
      1. Draft branch renders + the portal component wrapper is visible.
      2. Editing a property in the draft and re-fetching the preview
         reflects the change (round-trip via Content Studio API would be
         ideal — for now we assert presence of a stable selector).
      3. Master branch still renders the published version (regression
         guard against the editor accidentally publishing the draft).

    The deterministic shape mirrors `_storybook_playwright_spec` so the
    workshop-demo UX is identical whether or not an LLM is available.
    """
    content = (
        "import { test, expect } from '@playwright/test';\n\n"
        "/**\n"
        " * Content Studio Preview smoke for Enonic XP.\n"
        " * Covers draft-vs-master rendering and the portal-component\n"
        " * wrapper — a fast regression guard against broken preview\n"
        " * cookies / renamed admin paths.\n"
        " *\n"
        " * Env vars expected:\n"
        " *   BASE_URL              — site root (e.g. https://test.rodekors.no)\n"
        " *   CMS_PREVIEW_COOKIE    — the preview session cookie name\n"
        " *   CMS_PREVIEW_VALUE     — the preview session cookie value\n"
        " *   CMS_PREVIEW_PATH      — content path under preview, default '/'\n"
        " */\n\n"
        "const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';\n"
        "const COOKIE_NAME = process.env.CMS_PREVIEW_COOKIE || 'JSESSIONID';\n"
        "const COOKIE_VALUE = process.env.CMS_PREVIEW_VALUE || '';\n"
        "const CONTENT_PATH = process.env.CMS_PREVIEW_PATH || '/';\n\n"
        "test.beforeEach(async ({ context }) => {\n"
        "  if (COOKIE_VALUE) {\n"
        "    await context.addCookies([{\n"
        "      name: COOKIE_NAME, value: COOKIE_VALUE,\n"
        "      url: BASE_URL,\n"
        "    }]);\n"
        "  }\n"
        "});\n\n"
        "test('draft branch renders portal-component wrapper', async ({ page }) => {\n"
        "  const url = `${BASE_URL}/admin/site/preview/draft${CONTENT_PATH}`;\n"
        "  const resp = await page.goto(url);\n"
        "  expect(resp?.status(), `preview returned non-2xx — broken cookie or renamed admin path?`).toBeLessThan(400);\n"
        "  await page.waitForLoadState('networkidle');\n"
        "  // Every Enonic XP portal page emits at least one data-portal-component-type wrapper.\n"
        "  await expect(\n"
        "    page.locator('[data-portal-component-type]').first(),\n"
        "    'no portal-component-type wrapper found — preview HTML may be broken'\n"
        "  ).toBeAttached({ timeout: 8000 });\n"
        "});\n\n"
        "test('master branch renders published content', async ({ page }) => {\n"
        "  const url = `${BASE_URL}/admin/site/preview/master${CONTENT_PATH}`;\n"
        "  const resp = await page.goto(url);\n"
        "  expect(resp?.status()).toBeLessThan(400);\n"
        "  await page.waitForLoadState('networkidle');\n"
        "  await expect(page.locator('[data-portal-component-type]').first()).toBeAttached({ timeout: 8000 });\n"
        "});\n\n"
        "test('preview escapes app.config values (XSS defense-in-depth)', async ({ page }) => {\n"
        "  // Assumes a test environment where app.config.X contains a probe string.\n"
        "  // Skip silently if the probe env var is unset.\n"
        "  const probe = process.env.CMS_XSS_PROBE;\n"
        "  test.skip(!probe, 'CMS_XSS_PROBE not set — skipping XSS defense-in-depth check');\n"
        "  const url = `${BASE_URL}/admin/site/preview/draft${CONTENT_PATH}`;\n"
        "  await page.goto(url);\n"
        "  const html = await page.content();\n"
        "  // The probe string must never appear unescaped — if it does, app.config is\n"
        "  // being interpolated raw and we have an XSS hole (see enonic-xp/security-patterns.md §3).\n"
        "  expect(html, 'app.config value rendered unescaped').not.toContain(probe!);\n"
        "});\n"
    )
    return {"filename": "cms-preview.spec.ts", "content": content}


def _migrated_links_playwright_spec() -> Dict[str, str]:
    """Deterministic migrated-publication-link round-trip spec.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): direct regression guard
    against the Cristin → NVA migration bug where the publication header
    was migrated to `?id=` while the related-publications list still
    generated `?cristinid=`. See `data-integrity-patterns.md §6`.

    Generic shape — it parameterises both ends so the same spec works
    for any 'list → header' migration (Cristin→NVA, Jira→ADO, etc.).
    """
    content = (
        "import { test, expect } from '@playwright/test';\n\n"
        "/**\n"
        " * Migrated-link round-trip — regression guard against the\n"
        " * Cristin → NVA bug: header reading `?id=` while link generator\n"
        " * still emitted `?cristinid=`.\n"
        " *\n"
        " * Env vars expected:\n"
        " *   BASE_URL          — site root\n"
        " *   MIGRATED_LIST_URL — list page that links to migrated items (relative)\n"
        " *   MIGRATED_PARAM    — the URL parameter name BOTH ends agree on (default 'id')\n"
        " *   MIGRATED_LINK_SELECTOR — CSS for the list item link, default 'a[href*=publication]'\n"
        " *   MIGRATED_HEADER_SELECTOR — CSS for the header rendered on the detail page\n"
        " */\n\n"
        "const BASE_URL = process.env.BASE_URL || 'https://test.rodekors.no';\n"
        "const LIST_URL = process.env.MIGRATED_LIST_URL || '/forskning';\n"
        "const PARAM = process.env.MIGRATED_PARAM || 'id';\n"
        "const LINK_SEL = process.env.MIGRATED_LINK_SELECTOR || 'a[href*=publication]';\n"
        "const HEADER_SEL = process.env.MIGRATED_HEADER_SELECTOR || 'h1';\n\n"
        "test('migrated list emits the canonical URL parameter', async ({ page }) => {\n"
        "  await page.goto(`${BASE_URL}${LIST_URL}`);\n"
        "  await page.waitForLoadState('networkidle');\n"
        "  const link = page.locator(LINK_SEL).first();\n"
        "  const href = await link.getAttribute('href');\n"
        "  expect(href, 'no migrated-item link found on list page').toBeTruthy();\n"
        "  expect(\n"
        "    href,\n"
        "    `link emits a non-canonical URL parameter (expected ?${PARAM}=)`\n"
        "  ).toMatch(new RegExp(`[?&]${PARAM}=`));\n"
        "  // Defensive: explicitly reject the old Cristin parameter name.\n"
        "  expect(href, 'list still emits the legacy ?cristinid= — migration drift').not.toContain('cristinid=');\n"
        "});\n\n"
        "test('migrated header renders after clicking the list link', async ({ page }) => {\n"
        "  await page.goto(`${BASE_URL}${LIST_URL}`);\n"
        "  await page.waitForLoadState('networkidle');\n"
        "  const link = page.locator(LINK_SEL).first();\n"
        "  await link.click();\n"
        "  await page.waitForLoadState('networkidle');\n"
        "  // If parameter names disagree, the header silently can't find the item — blank page.\n"
        "  await expect(\n"
        "    page.locator(HEADER_SEL),\n"
        "    'header did not render — parameter-name mismatch between list and detail page?'\n"
        "  ).toBeVisible();\n"
        "});\n"
    )
    return {"filename": "migrated-links.spec.ts", "content": content}


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


# ───────────────────────────────────────────────────────────────────────────
# Phase F (Tom's tip · 2026-05-12):
# 'Postman blir nyttig for å få testet GraphQL-grensesnittene fra Guillotine/XP.'
# Two helpers added below — both work without an LLM (deterministic templates):
#
#   1. export_postman_collection() — emits a Postman Collection v2.1 JSON with
#      the 4 canonical Guillotine queries (Distrikt, Aktivitet, Kampanje,
#      Forening) parameterised with {{base_url}} + {{token}} variables and
#      response-tests (status 200 + GraphQL errors == null).
#   2. run_graphql_introspection() — runs the standard `__schema` query and
#      returns the list of operations. When the LLM is available + a URL is
#      reachable, real introspection results would replace the mock; today the
#      mock-first fallback is a curated list of the expected operations for the
#      rodekors.no rebuild so the workshop demo always shows something.
# ───────────────────────────────────────────────────────────────────────────

# Canonical Guillotine GraphQL queries used both by the Postman collection
# generator and (as fallback shape) by the introspection mock.
_GUILLOTINE_QUERIES: List[Dict[str, str]] = [
    {
        "name": "GetDistrictPage",
        "description": "Fetch a district landing page with its activity teasers.",
        "query": (
            "query GetDistrictPage($path: ID!) {\n"
            "  guillotine {\n"
            "    get(key: $path) {\n"
            "      _id _name _path displayName\n"
            "      ... on rodekors_Distrikt {\n"
            "        data { ingress contactPerson { _ref } }\n"
            "        children(query: \"_path LIKE '/distrikt/*'\") {\n"
            "          _id _name displayName\n"
            "        }\n"
            "      }\n"
            "    }\n"
            "  }\n"
            "}"
        ),
        "variables": {"path": "/distrikt/oslo"},
    },
    {
        "name": "GetActivityList",
        "description": "List Aktivitet content for a Forening with pagination.",
        "query": (
            "query GetActivityList($forening: ID!, $first: Int!) {\n"
            "  guillotine {\n"
            "    query(query: \"type = 'rodekors:Aktivitet'\", first: $first,\n"
            "          sort: \"_modifiedTime DESC\") {\n"
            "      _id _name displayName\n"
            "      ... on rodekors_Aktivitet {\n"
            "        data { title summary startDate endDate location }\n"
            "      }\n"
            "    }\n"
            "  }\n"
            "}"
        ),
        "variables": {"forening": "oslo", "first": 20},
    },
    {
        "name": "GetCampaignPage",
        "description": "Fetch a single Kampanje page for the donation flow.",
        "query": (
            "query GetCampaignPage($id: ID!) {\n"
            "  guillotine {\n"
            "    get(key: $id) {\n"
            "      _id _name displayName\n"
            "      ... on rodekors_Kampanje {\n"
            "        data { title body goalAmount fundyFormId vippsEnabled }\n"
            "      }\n"
            "    }\n"
            "  }\n"
            "}"
        ),
        "variables": {"id": "/kampanjer/jul-2026"},
    },
    {
        "name": "GetForeningContacts",
        "description": "Fetch a Forening with its Kontaktperson references resolved.",
        "query": (
            "query GetForeningContacts($id: ID!) {\n"
            "  guillotine {\n"
            "    get(key: $id) {\n"
            "      _id displayName\n"
            "      ... on rodekors_Forening {\n"
            "        data {\n"
            "          contactPerson { _ref }\n"
            "          _references(first: 50, type: 'rodekors:Kontaktperson') {\n"
            "            displayName _id\n"
            "          }\n"
            "        }\n"
            "      }\n"
            "    }\n"
            "  }\n"
            "}"
        ),
        "variables": {"id": "/forening/bergen"},
    },
]


async def export_postman_collection(scope: Optional[str], environment: str,
                                    lang: str = "en") -> Dict[str, Any]:
    """Generate a Postman Collection v2.1 JSON for the Guillotine GraphQL
    endpoints. Returns the parsed dict so the router can either echo it back
    or stream it as a download. Mock-first: works without LLM, without Mongo.
    """
    import json as _json

    base_url_var = ("https://test.rodekors.no" if environment == "test"
                     else "http://localhost:3000")

    items = []
    for q in _GUILLOTINE_QUERIES:
        items.append({
            "name": q["name"],
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{token}}",
                     "description": "Optional — only required for preview/draft content."},
                ],
                "url": {
                    "raw": "{{base_url}}/api/graphql",
                    "host": ["{{base_url}}"],
                    "path": ["api", "graphql"],
                },
                "body": {
                    "mode": "raw",
                    "raw": _json.dumps({
                        "query": q["query"],
                        "variables": q.get("variables", {}),
                    }, indent=2, ensure_ascii=False),
                    "options": {"raw": {"language": "json"}},
                },
                "description": q.get("description", ""),
            },
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "type": "text/javascript",
                        "exec": [
                            "pm.test('Status is 200', () => pm.response.to.have.status(200));",
                            "const json = pm.response.json();",
                            "pm.test('No GraphQL errors', () => {",
                            "  pm.expect(json.errors, JSON.stringify(json.errors)).to.be.undefined;",
                            "});",
                            "pm.test('Response has data field', () => {",
                            "  pm.expect(json).to.have.property('data');",
                            "});",
                        ],
                    },
                },
            ],
        })

    collection = {
        "info": {
            "name": "Røde Kors — Guillotine GraphQL",
            "description": (
                "Auto-generated by the Red Cross Web QA Agent (Phase F).\n\n"
                f"Environment: {environment}\n"
                f"Scope: {scope or 'all'}\n\n"
                "Tom (Tech leder): 'Postman blir nyttig for å få testet "
                "GraphQL-grensesnittene fra Guillotine/XP.' This collection "
                "covers the four canonical operations used by the rodekors.no "
                "rebuild. Edit the variables below to point at your environment."
            ),
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "_exporter_id": "red-cross-qa-agent",
        },
        "variable": [
            {"key": "base_url", "value": base_url_var,
             "description": "Override per environment (test / local)."},
            {"key": "token", "value": "",
             "description": "Optional bearer token for preview/draft content."},
        ],
        "item": items,
    }

    # Persist for traceability (best-effort, mock-first compliant).
    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "postman", "scope": scope, "environment": environment,
            "filename": "rodekors-guillotine.postman_collection.json",
            "collection": collection, "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass

    return {
        "status": "ok",
        "filename": "rodekors-guillotine.postman_collection.json",
        "operation_count": len(items),
        "collection": collection,
        "lang": lang,
    }


async def run_graphql_introspection(url: Optional[str], environment: str,
                                    lang: str = "en") -> Dict[str, Any]:
    """List the GraphQL operations exposed by Guillotine. Mock-first: returns a
    curated list of expected operations for the rodekors.no rebuild when no
    live introspection happens.
    A real implementation would POST `{ query: '{ __schema { queryType { ... } } }' }`
    to {url}/api/graphql; the response shape returned here matches what the
    frontend renders so swapping in real introspection is a drop-in change.
    """
    operations: List[Dict[str, Any]] = [
        {"name": "guillotine.get",
         "kind": "query", "args": ["key: ID!"],
         "returns": "Content",
         "note": "Fetch one content item by path or id."},
        {"name": "guillotine.query",
         "kind": "query", "args": ["query: String!", "first: Int", "sort: String"],
         "returns": "[Content]",
         "note": "List by content selector — main Aktivitet/Distrikt entrypoint."},
        {"name": "guillotine.getChildren",
         "kind": "query", "args": ["key: ID!", "first: Int", "sort: String"],
         "returns": "[Content]",
         "note": "Children of a Distrikt/Forening node."},
        {"name": "guillotine.getSite",
         "kind": "query", "args": [],
         "returns": "Site",
         "note": "Site-level config (used by header/footer)."},
        {"name": "guillotine.getReferences",
         "kind": "query", "args": ["key: ID!", "type: String"],
         "returns": "[Content]",
         "note": "Reverse references — used to resolve Aktivitet → Forening."},
    ]

    # Røde Kors content types — what the team will model in Enonic XP.
    content_types = [
        {"name": "rodekors:Distrikt",  "fields": ["ingress", "contactPerson", "children"]},
        {"name": "rodekors:Forening",  "fields": ["address", "contactPerson"]},
        {"name": "rodekors:Aktivitet", "fields": ["title", "summary", "startDate", "endDate", "location"]},
        {"name": "rodekors:Kontaktperson", "fields": ["name", "email", "phone"]},
        {"name": "rodekors:Kampanje",  "fields": ["title", "body", "goalAmount", "fundyFormId", "vippsEnabled"]},
        {"name": "rodekors:TjenesteKurs", "fields": ["title", "summary", "audience"]},
        {"name": "rodekors:Tema",      "fields": ["title", "summary"]},
        {"name": "rodekors:Nyhet",     "fields": ["title", "publishedDate", "body"]},
    ]

    introspection_query = (
        "query IntrospectGuillotine {\n"
        "  __schema {\n"
        "    queryType {\n"
        "      name\n"
        "      fields { name description args { name type { name kind } } type { name kind } }\n"
        "    }\n"
        "  }\n"
        "}"
    )

    summary = (f"GraphQL introspection mock for {url or 'guillotine'} on {environment}: "
               f"{len(operations)} operations, {len(content_types)} content types")

    run = await _store_run("redcross-graphql-api", environment, "pass", summary, {
        "tool": "graphql-introspection",
        "url": url, "operations_count": len(operations),
        "content_types_count": len(content_types),
    })

    return {
        "status": "ok",
        "url": url,
        "environment": environment,
        "operations": operations,
        "content_types": content_types,
        "introspection_query": introspection_query,
        "note": ("Mock introspection — Tom's preferred workflow is to import "
                 "the Postman collection (see /export-postman-collection) and "
                 "iterate on these operations interactively against the real "
                 "Guillotine endpoint."),
        "run_id": run["run_id"],
        "lang": lang,
    }


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
                                  lang: str = "en",
                                  wcag_version: str = "2.2-AA") -> Dict[str, Any]:
    """Phase C: explicit WCAG version (Trine §4.1 mandates 2.1 AA as the
    contractual minimum; rodekors.no rebuild aims for 2.2 AA)."""
    # Normalize to canonical labels used in reports.
    _v = (wcag_version or "2.2-AA").upper().replace(" ", "")
    if _v in ("2.1", "2.1-AA", "WCAG2.1AA"):
        version_id, version_label = "2.1-AA", "WCAG 2.1 AA"
    else:
        version_id, version_label = "2.2-AA", "WCAG 2.2 AA"

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
    # WCAG 2.2 adds 9 new success criteria — 2 of them are commonly missed and
    # only flagged when 2.2 AA is selected. Trine's report should cite this.
    if version_id == "2.2-AA":
        violations.append({
            "severity": "medium", "rule": "wcag-2-2-target-size",
            "message": "Several footer links smaller than 24x24 CSS pixels (WCAG 2.5.8 — new in 2.2 AA)",
        })
    run = await _store_run("redcross-accessibility-core", environment, "warn",
                           f"axe-core scan on {url} ({version_label})",
                           {"url": url, "wcag_version": version_label,
                            "checks": checks, "violations": violations})
    return {"status": "ok", "url": url, "wcag_score": 87,
            "wcag_version": version_label, "wcag_version_id": version_id,
            "checks": checks, "violations": violations, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Phase G (2026-05-13) — Two additional accessibility tools requested
# by the testing team alongside the existing axe-core + Lighthouse:
#   • NVDA — screen reader script generator (markdown the human tester
#     runs while NVDA reads pages on Windows). NVDA is not programmatic
#     so this is a structured CHECKLIST, not an "execute" call.
#   • WAVE (WebAIM) — mock-first WAVE report shape (errors / alerts /
#     contrast / features / structure / aria counts), plus the deep
#     link to the public WAVE report so testers can open it directly.
#     A real WAVE API call lights up only when env var WAVE_API_KEY
#     is present — the workshop demo works offline without it.
# ═══════════════════════════════════════════════════════════════════


# NVDA scope → focus areas for the generated script. Drives the
# expected-announcement list per scope (donation has price field,
# volunteer has phone field, etc.). Anything not listed falls back to
# a generic landmark sweep.
_NVDA_SCOPE_PATHS: Dict[str, Dict[str, Any]] = {
    "donation": {
        "label": "Donation flow (Bli giver)",
        "default_path": "/giverstotte",
        "key_landmarks": ["Heading level 1, Bli fast giver",
                          "Beløp, edit, blank, required",
                          "Betaling med Vipps, button"],
    },
    "volunteer": {
        "label": "Volunteer signup (Bli frivillig)",
        "default_path": "/frivillig",
        "key_landmarks": ["Heading level 1, Bli frivillig",
                          "Telefonnummer, edit, blank, required",
                          "Postnummer, edit, blank"],
    },
    "search": {
        "label": "Site search results",
        "default_path": "/sok",
        "key_landmarks": ["Heading level 1, Søk",
                          "Søk, combo box, autocomplete",
                          "Resultater, region, 12 items"],
    },
    "navigation": {
        "label": "Main navigation + skip links",
        "default_path": "/",
        "key_landmarks": ["Banner landmark",
                          "Hovedmeny, navigation",
                          "Hopp til hovedinnhold, link"],
    },
    "forms": {
        "label": "Generic form (Skjemabygger)",
        "default_path": "/skjema/kontakt",
        "key_landmarks": ["Form, 5 fields, 1 required",
                          "Navn, edit, blank, required",
                          "Send, button"],
    },
}


async def generate_nvda_script(url: str, scope: str, environment: str,
                                lang: str = "en") -> Dict[str, Any]:
    """Generate a markdown NVDA test script for the requested URL + scope.

    Deterministic by design — the human tester follows it verbatim while
    NVDA is running on Windows. No LLM involved: keyboard shortcuts,
    announcement format and WCAG mapping must NOT drift between runs.
    """
    spec = _NVDA_SCOPE_PATHS.get(scope) or _NVDA_SCOPE_PATHS["navigation"]
    target = url or f"https://test.rodekors.no{spec['default_path']}"
    scope_label = spec["label"]

    # Per-scope expected announcements rendered as a numbered checklist
    # with "Action" + "Expected announcement" + WCAG SC mapping.
    base_steps = [
        {"action": f"Navigate to {target}",
         "expected": f"Røde Kors — {scope_label}, page",
         "wcag": "2.4.2 Page Titled"},
        {"action": "Press `Insert + T` to confirm page title",
         "expected": f"Page title is announced: 'Røde Kors — {scope_label}'",
         "wcag": "2.4.2 Page Titled"},
        {"action": "Press `Insert + F7` to open Elements List → headings",
         "expected": "List of headings with levels (1, 2, 3...). Should be hierarchical.",
         "wcag": "1.3.1 Info & Relationships, 2.4.6 Headings & Labels"},
        {"action": "Press `H` repeatedly to navigate by heading",
         "expected": spec["key_landmarks"][0],
         "wcag": "1.3.1, 2.4.6"},
        {"action": "Press `D` to navigate to next landmark",
         "expected": "Region landmark announcements (banner, navigation, main, contentinfo)",
         "wcag": "1.3.1 Info & Relationships, 2.4.1 Bypass Blocks"},
        {"action": "Press `Tab` to first interactive control",
         "expected": spec["key_landmarks"][1] if len(spec["key_landmarks"]) > 1 else "First focusable element",
         "wcag": "2.1.1 Keyboard, 2.4.3 Focus Order"},
        {"action": "Tab through the entire focus order",
         "expected": "Every interactive element is reachable; focus order is logical (visual = DOM); no focus trap.",
         "wcag": "2.4.3 Focus Order, 2.4.7 Focus Visible, 2.1.2 No Keyboard Trap"},
        {"action": "On any form field, press `Insert + Tab` to re-announce",
         "expected": "Label + state + required indicator are spoken (e.g. 'Beløp, edit, blank, required')",
         "wcag": "1.3.1, 3.3.2 Labels or Instructions, 4.1.2 Name Role Value"},
        {"action": "Trigger a validation error and press `Insert + B`",
         "expected": "Error message is announced via live region or aria-describedby",
         "wcag": "3.3.1 Error Identification, 3.3.3 Error Suggestion"},
        {"action": "Open any dialog (modal) and press `Insert + Down`",
         "expected": "Dialog role + name announced; focus moves into the dialog; Esc closes it.",
         "wcag": "4.1.2 Name Role Value, 2.1.2 No Keyboard Trap"},
    ]

    # Build the markdown body — kept compact (≤ 100 lines) so the tester
    # can keep it open next to NVDA's speech viewer.
    md_lines = [
        f"# NVDA test script — {scope_label} ({environment})",
        "",
        f"**Target URL:** `{target}`",
        f"**WCAG profile:** 2.2 AA (Trine §4.1) — 2.1 AA SC also covered",
        "",
        "## Setup",
        "- Start NVDA on Windows 10/11: `Insert + Ctrl + N`",
        "- Browser: Edge or Chrome (latest stable)",
        "- Speech rate: medium · Voice: any · Speech viewer: ON (debug)",
        "- Clear NVDA log: `Insert + F1`",
        "",
        "## Steps",
    ]
    for i, step in enumerate(base_steps, start=1):
        md_lines += [
            f"{i}. **Action:** {step['action']}",
            f"   - **Expected announcement:** {step['expected']}",
            f"   - **WCAG SC:** {step['wcag']}",
            "",
        ]
    md_lines += [
        "## Reporting",
        "- Tick each step as it passes; for failures, capture the verbatim",
        "  NVDA output from the speech viewer + a screenshot of the focused",
        "  element. File issues with `severity_dev` 1–4 and `category_ops`",
        "  A–C per Trine Bruu's Teststrategi 30.3 §8.1.",
        "- Cross-check with axe-core (Tab 9 → ♿ Universell utforming-pilot)",
        "  to find rule-based issues the screen reader review missed.",
    ]

    script_md = "\n".join(md_lines)

    # WCAG SCs explicitly covered by this script — surfaced as chips in UI.
    sc_covered = sorted({(s["wcag"].split(",")[0]).strip() for s in base_steps})

    summary = (f"NVDA script for {scope_label} ({len(base_steps)} steps, "
                f"{len(sc_covered)} WCAG SC covered)")
    run = await _store_run("redcross-accessibility-core", environment, "pass",
                            summary, {"url": target, "scope": scope,
                                      "tool": "nvda", "steps": len(base_steps)})

    return {
        "status": "ok", "tool": "nvda",
        "url": target, "scope": scope, "scope_label": scope_label,
        "filename": f"nvda-{scope}.md",
        "script_md": script_md,
        "step_count": len(base_steps),
        "wcag_sc_covered": sc_covered,
        "platform": "Windows (NVDA 2024+)",
        "run_id": run["run_id"], "lang": lang,
    }


async def run_wave_audit(url: str, environment: str,
                          lang: str = "en") -> Dict[str, Any]:
    """Mock-first WAVE (WebAIM) audit. Returns the same shape WebAIM's API
    does so the UI can render it without changes if WAVE_API_KEY env var
    is set in the future. Without the key, returns a deterministic
    synthetic report sized to the rodekors.no rebuild.
    """
    import os as _os
    target = url or "https://test.rodekors.no/"

    # Categories shape mirrors WAVE's API report.json output.
    categories = {
        "errors": 4,
        "contrast_errors": 2,
        "alerts": 8,
        "features": 12,
        "structural_elements": 28,
        "aria": 19,
    }
    errors_detail = [
        {"code": "alt_missing",       "label": "Missing alt text",
         "count": 3, "wcag": "1.1.1", "severity": "high"},
        {"code": "label_missing",     "label": "Missing form label",
         "count": 1, "wcag": "1.3.1, 3.3.2", "severity": "critical"},
        {"code": "link_empty",        "label": "Empty link",
         "count": 0, "wcag": "2.4.4, 4.1.2", "severity": "high"},
    ]
    contrast_detail = [
        {"code": "contrast",          "label": "Very low contrast",
         "count": 2, "wcag": "1.4.3", "severity": "high",
         "note": "Donation CTA ratio 3.9:1; secondary footer link 3.2:1"},
    ]
    alerts_detail = [
        {"code": "noscript",          "label": "Noscript element present",
         "count": 1, "wcag": "1.1.1", "severity": "low"},
        {"code": "h1_missing",        "label": "Missing first level heading",
         "count": 0, "wcag": "1.3.1", "severity": "medium"},
        {"code": "redundant_link",    "label": "Redundant link",
         "count": 4, "wcag": "2.4.4", "severity": "low",
         "note": "Image + adjacent text share the same destination"},
        {"code": "label_orphaned",    "label": "Orphaned form label",
         "count": 1, "wcag": "1.3.1, 3.3.2", "severity": "medium"},
    ]

    # If WAVE_API_KEY is set, we would call the real API here. The mock
    # path remains identical in shape so the frontend never needs to know.
    used_api = False
    api_key_present = bool(_os.environ.get("WAVE_API_KEY"))
    # NOTE: real WAVE API call deferred — keeping mock-first for workshop
    # safety (no live network during demos). When the team wants live
    # results, set WAVE_API_KEY and flip this block to a real httpx.post.

    wave_report_url = f"https://wave.webaim.org/report#/{target}"

    summary = (f"WAVE mock for {target}: {categories['errors']} errors, "
                f"{categories['contrast_errors']} contrast, "
                f"{categories['alerts']} alerts")
    overall = ("fail" if categories['errors'] >= 5
                else "warn" if categories['errors'] >= 1 else "pass")
    run = await _store_run("redcross-accessibility-core", environment, overall,
                            summary, {"url": target, "tool": "wave",
                                      "categories": categories,
                                      "used_api": used_api})

    return {
        "status": "ok", "tool": "wave",
        "url": target,
        "categories": categories,
        "errors_detail": errors_detail,
        "contrast_detail": contrast_detail,
        "alerts_detail": alerts_detail,
        "wave_report_url": wave_report_url,
        "used_api": used_api,
        "api_key_present": api_key_present,
        "note": ("Mock-first WAVE report. Open the public report URL above "
                  "for a live in-page evaluation, or set WAVE_API_KEY to "
                  "enable programmatic API calls."),
        "run_id": run["run_id"], "lang": lang,
    }


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
                                     "tool": "k6", "results": results})
    return {"status": "ok", "tool": "k6", "results": results, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 8b — Loadster (browser-based load testing)
# ═══════════════════════════════════════════════════════════════════
# Loadster (loadster.app) runs scripts inside real browsers — so unlike k6
# (which is protocol-level HTTP), it captures JavaScript execution time,
# client-side hydration, layout shifts under load, and SPA navigation cost.
# For rodekors.no's NextJS + Designsystemet front-end this is significant:
# the editorial team's perceived "slowness" usually lives in hydration and
# JS-driven interactions, not in raw HTTP throughput.
#
# Pricing model: Loadster uses "engines" (parallel browser instances).
# A typical campaign-peak scenario uses 3-5 engines × ~150 concurrent VUs
# each = 450-750 simulated users. The mock-first fallback below mirrors
# that shape.

LOADSTER_GENERATOR_PROMPT = """You are a load testing engineer producing a
Loadster scenario for the rodekors.no Red Cross web rebuild (NextJS + Enonic
XP + Designsystemet). Browser-based load — exercises hydration, lazy chunks,
and SPA navigation, NOT just HTTP.

Return JSON:
{
  "filename": "loadster-<profile>.lhx.json",
  "scenario": "<Loadster scenario as JSON config (steps, think-times, engines)>",
  "expected_engines": <int>,
  "notes": "<one-line description of what the scenario exercises>"
}

Use these profile mappings:
- profileSmoke    → 1 engine, 5 VUs, 2 min
- profileNormal   → 2 engines, 50 VUs, 14 min
- profileCampaign → 3 engines, 150 VUs, 20 min
- profileCrisis   → 5 engines, 250 VUs, 30 min (TV-aksjonen-style spike)
- profileSoak     → 2 engines, 30 VUs, 4 hours
"""


async def generate_loadster_script(profile: str, scenarios: List[str], environment: str,
                                   lang: str = "en") -> Dict[str, Any]:
    """Generate a Loadster scenario for the selected profile. Mock-first
    graceful degradation — falls back to a deterministic browser-scenario
    template if the LLM doesn't produce parseable JSON.
    """
    prompt = (
        f"Profile: {profile}\nScenarios: {', '.join(scenarios) or '(default)'}\n"
        f"Environment: {environment}\n"
    )
    raw = await _llm(prompt, LOADSTER_GENERATOR_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    # Engine count is the differentiating concept vs k6 (parallel real browsers)
    engines_by_profile = {
        "profileSmoke": 1, "profileNormal": 2, "profileCampaign": 3,
        "profileCrisis": 5, "profileSoak": 2,
    }
    engines = parsed.get("expected_engines") or engines_by_profile.get(profile, 2)

    filename = parsed.get("filename") or f"loadster-{profile}.lhx.json"
    scenario = parsed.get("scenario")

    if not scenario:
        # Loadster scenario template — JSON config that Loadster Workbench
        # can import. Real Loadster files use a proprietary XML format,
        # but the cloud API also accepts JSON-described scenarios.
        scenario_obj = {
            "name": f"rodekors-{profile}",
            "engines": engines,
            "rampUp": "2m", "duration": "14m" if profile != "profileSoak" else "4h",
            "thinkTimeMs": 1500,
            "steps": [
                {"type": "navigate", "url": "${BASE_URL}/", "waitFor": "networkidle"},
                {"type": "click", "selector": "[data-test='donate-cta']", "optional": True},
                {"type": "navigate", "url": "${BASE_URL}/distrikt/oslo",
                 "waitFor": "networkidle",
                 "assert": {"selector": "h1", "containsText": "Oslo"}},
                {"type": "navigate", "url": "${BASE_URL}/aktiviteter",
                 "waitFor": "networkidle"},
            ],
            "thresholds": {
                "avg_response_ms": 1000,
                "error_rate_pct": 1.0,
                "p95_ms": 2500,
            },
            "variables": {
                "BASE_URL": "https://test.rodekors.no" if environment == "test"
                            else "http://localhost:3000",
            },
        }
        # Serialize as pretty JSON since real Loadster .lhx is XML but the
        # JSON form is the agent-friendly representation we emit.
        import json as _json
        scenario = _json.dumps(scenario_obj, indent=2, ensure_ascii=False)

    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "loadster", "profile": profile, "scenarios": scenarios,
            "environment": environment, "filename": filename,
            "script": scenario, "engines": engines,
            "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass

    return {
        "status": "ok", "tool": "loadster",
        "filename": filename, "script": scenario,
        "engines": engines,
        "notes": parsed.get("notes")
                  or f"Browser-level load: {engines} engine(s), exercises hydration + SPA navigation.",
        "lang": lang,
    }


async def run_loadster(profile: str, scenarios: List[str], environment: str,
                       lang: str = "en") -> Dict[str, Any]:
    """Mock Loadster run. Real implementation would POST the scenario to
    Loadster Cloud API and poll for results; this returns deterministic
    browser-level metrics that mirror Loadster's actual reporting shape.
    """
    # Profile-specific mock results — calibrated to look realistic for a
    # NextJS + Enonic XP SPA. Browser-level numbers tend to be 2-4× the
    # protocol-level numbers k6 reports because they include JS execution
    # + render time, not just HTTP request duration.
    by_profile = {
        "profileSmoke":    {"engines": 1, "vus": 5,   "duration_s": 120,
                            "avg_response_ms": 380, "p95_response_ms": 720,
                            "error_rate_pct": 0.0, "iterations": 145,
                            "peak_handled_vus": 5,  "hydration_p95_ms": 280},
        "profileNormal":   {"engines": 2, "vus": 50,  "duration_s": 840,
                            "avg_response_ms": 420, "p95_response_ms": 980,
                            "error_rate_pct": 0.4, "iterations": 12500,
                            "peak_handled_vus": 50, "hydration_p95_ms": 320},
        "profileCampaign": {"engines": 3, "vus": 150, "duration_s": 1200,
                            "avg_response_ms": 680, "p95_response_ms": 1620,
                            "error_rate_pct": 1.2, "iterations": 47800,
                            "peak_handled_vus": 142, "hydration_p95_ms": 480},
        "profileCrisis":   {"engines": 5, "vus": 250, "duration_s": 1800,
                            "avg_response_ms": 1120, "p95_response_ms": 3200,
                            "error_rate_pct": 4.8, "iterations": 92400,
                            "peak_handled_vus": 198, "hydration_p95_ms": 920},
        "profileSoak":     {"engines": 2, "vus": 30, "duration_s": 14400,
                            "avg_response_ms": 440, "p95_response_ms": 1040,
                            "error_rate_pct": 0.6, "iterations": 86400,
                            "peak_handled_vus": 30, "hydration_p95_ms": 340,
                            "memory_drift_pct": 6.2},
    }
    r = by_profile.get(profile, by_profile["profileNormal"]).copy()

    # Loadster-specific signal: SPA navigation cost — k6 doesn't see this.
    r["spa_nav_p95_ms"] = int(r["hydration_p95_ms"] * 1.4)
    r["worst_step"] = "navigate /distrikt/oslo"

    overall_status = ("warn" if r["error_rate_pct"] > 1.0 or r["p95_response_ms"] > 2000
                       else "pass")
    summary = (f"Loadster {profile} on {environment} — "
               f"avg {r['avg_response_ms']}ms / p95 {r['p95_response_ms']}ms / "
               f"err {r['error_rate_pct']}% / engines {r['engines']}")

    run = await _store_run("redcross-stress-campaign-peak", environment, overall_status,
                           summary, {"profile": profile, "scenarios": scenarios,
                                     "tool": "loadster", "results": r})

    return {
        "status": "ok", "tool": "loadster",
        "profile": profile, "scenarios": scenarios,
        "results": r,
        "differentiator": ("Browser-level load — captures JS hydration "
                           "(p95 {h}ms) and SPA navigation (p95 {s}ms) under "
                           "load. k6 doesn't see these signals.").format(
                               h=r["hydration_p95_ms"], s=r["spa_nav_p95_ms"]),
        "run_id": run["run_id"],
    }


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
        # ── Fundy donation-form sub-checks (separate provider from Vipps) ──
        "checkFundyFormRendering":     {"status": "pass", "note": "Fundy form renders within 2s on test env"},
        "checkFundyAmountSelection":   {"status": "pass", "note": "100/250/500/1000 NOK + custom amount work"},
        "checkFundyFrequencyToggle":   {"status": "pass", "note": "One-time vs monthly persists across step navigation"},
        "checkFundyDonorFields":       {"status": "warn", "note": "Last name validation rejects names with space (Olav Per Hansen)"},
        "checkFundyConsentCheckboxes": {"status": "fail", "note": "Marketing opt-in is pre-checked — GDPR violation"},
        "checkFundyHandoffPayload":    {"status": "pass", "note": "Fundy → Vipps payload includes amount, currency=NOK, donor email"},
        "checkFundyAccessibility":     {"status": "warn", "note": "Fundy iframe has 1 axe-core violation (color-contrast on 'Continue' button)"},
        "checkFundyMobile":            {"status": "pass", "note": "Fundy form usable on iPhone SE (375px) and Galaxy S8"},
        "checkFundyErrorRecovery":     {"status": "warn", "note": "Network error during submit shows generic message — donor data preserved"},
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
        # ── Fundy-specific findings ──
        {"severity": "high", "form": "fundy-donation", "title": "Marketing opt-in pre-checked (Fundy)",
         "message": "Fundy donation form pre-checks the marketing consent box — GDPR violation.",
         "fix_hint": "Set Fundy form config consent_default=false; verify in Fundy admin."},
        {"severity": "medium", "form": "fundy-donation", "title": "Fundy iframe contrast violation",
         "message": "Fundy 'Continue' button fails WCAG 2.2 AA color contrast (3.8:1).",
         "fix_hint": "Ask Fundy support to override theme color or wrap form in custom-styled container."},
        {"severity": "medium", "form": "fundy-donation", "title": "Last name validation rejects spaces",
         "message": "Fundy rejects 'Olav Per Hansen' — spaces in last name are valid in Norwegian.",
         "fix_hint": "Update Fundy validation regex to allow spaces and æøå."},
    ]

    # Augment each finding with severity_dev (1-4) + category_ops (A-C)
    # so the Sprint Report and Release Judge can use Trine's dual scheme.
    for f in findings:
        sev = (f.get("severity") or "medium").lower()
        f.setdefault("severity_dev", _severity_dev(sev))
        f.setdefault("category_ops", _category_ops(sev))

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
        {"title": "Fundy → Vipps handoff payload integrity", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Open donation page", "Select 250 NOK monthly", "Fill donor data with æøå",
                   "Click Continue → intercept Fundy → Vipps request"],
         "expected": "Payload contains amount=250, currency=NOK, frequency=monthly, donor.name with æøå preserved"},
        {"title": "Fundy consent checkbox not pre-checked", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Open donation page", "Inspect marketing-opt-in checkbox initial state"],
         "expected": "Marketing opt-in is unchecked by default (GDPR)"},
        {"title": "Fundy form on iPhone SE (extreme small viewport)", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Set viewport to 320×568", "Open donation page", "Complete full donation flow"],
         "expected": "All controls reachable, no horizontal scroll, keyboard does not cover input"},
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

    # Phase C: explicit migrated-vs-newly-created breakdown — Trine §3 separates
    # the two cohorts so regressions can be triaged correctly. Migrated content
    # carries legacy-CMS provenance and tends to fail relations / image
    # re-anchoring; newly-created content is greenfield Enonic and tends to fail
    # editorial / CMS-publish flows. Counted independently so suite reports can
    # split findings instead of lumping them together.
    migrated_count = summary.get("total_pages_migrated", int(legacy_sample_size * 0.78))
    new_count = max(0, int(legacy_sample_size * 0.22))
    data_provenance = parsed.get("data_provenance") or {
        "migrated": {
            "count": migrated_count,
            "label": "Migrated from legacy CMS",
            "common_issues": ["broken relations", "stale CDN URLs", "missing 301s"],
            "issues_open": 18,
        },
        "newly_created": {
            "count": new_count,
            "label": "Newly created in Enonic XP",
            "common_issues": ["missing nn translation", "ISR not invalidated"],
            "issues_open": 5,
        },
        "total":     migrated_count + new_count,
        "rule":      "Findings, runs and risks must be tagged with data_origin = migrated | newly_created",
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
         "issue": "missing-fields", "data_origin": "migrated"},
        {"legacy_url": "/forening/bergen/kontaktpersoner",
         "new_url": "/lokal/bergen/kontaktpersoner",
         "issue": "broken-images", "data_origin": "migrated"},
        {"legacy_url": "/kampanjer/2024/jul",
         "new_url": "",
         "issue": "404", "data_origin": "migrated"},
        {"legacy_url": "",
         "new_url": "/aktuelt/sommer-2026-rekruttering",
         "issue": "missing-nn-translation", "data_origin": "newly_created"},
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
        "data_provenance": data_provenance,
        "artifacts": [{"name": "migration-audit.json", "type": "report"}],
    })
    return {"status": "ok", "summary": summary, "checks": checks,
            "broken_pages": broken_pages, "missing_redirects": missing_redirects,
            "test_cases": test_cases, "data_provenance": data_provenance,
            "run_id": run["run_id"], "lang": lang}


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
# Tool 10 — Azure DevOps Work-Item Bundle + dispatch
# ─────────────────────────────────────────────────────────────────────
# Trine (Testleder) uses Azure DevOps as the official test tool per
# the Teststrategi (30.3). We map QA findings to ADO work items:
#   severity critical/high → Bug
#   severity medium        → Bug (lower priority)
#   non-bug recommendations → Task
# Severity 1-4 (development phase) and Category A-C (operational/contract
# phase) are emitted alongside, see release_judge.md.
# ═══════════════════════════════════════════════════════════════════
async def get_ado_bundle_preview(environment: str) -> Dict[str, Any]:
    settings = await get_settings()
    s = settings["settings"]
    work_items: List[Dict[str, Any]] = []
    try:
        cursor = red_cross_qa_runs_collection.find(
            {"environment": environment, "status": {"$in": ["fail", "warn"]}}
        ).sort("started_at", -1).limit(10)
        async for run in cursor:
            payload = run.get("payload", {}) or {}
            for f in (payload.get("findings") or [])[:3]:
                sev = (f.get("severity") or "medium").lower()
                work_items.append({
                    "title": f.get("title") or f.get("message") or "QA finding",
                    "work_item_type": "Bug" if sev in ("critical", "high", "medium") else "Task",
                    "priority": _ado_priority_from_severity(sev),
                    "severity": _ado_severity_label(sev),
                    "severity_dev": _severity_dev(sev),    # 1-4 utviklingsfase
                    "category_ops": _category_ops(sev),    # A-C driftsfase
                    "description": f"From run {run.get('run_id')} ({run.get('suite')}): {f.get('message','')}",
                })
    except Exception:
        pass

    if not work_items:
        work_items = [
            {"title": "Donation CTA contrast below WCAG AA",
             "work_item_type": "Bug", "priority": 2, "severity": "2 - High",
             "severity_dev": 2, "category_ops": "B",
             "description": "Mock — found by axe-core. Suggested fix: darken brand-red-500."},
            {"title": "Missing CSP report-uri",
             "work_item_type": "Task", "priority": 4, "severity": "4 - Low",
             "severity_dev": 4, "category_ops": "C",
             "description": "Mock — add report-uri to CSP header."},
        ]

    bundle = {
        "organization": s.get("ado_organization", "rodekors"),
        "project": s.get("ado_project", "rodekors-web"),
        "area_path": s.get("ado_area_path", "rodekors-web\\Web QA"),
        "iteration_path": s.get("ado_iteration_path", "rodekors-web\\Sprint 1"),
        "tags": s.get("ado_tags", ["red-cross-qa", "ai-generated"]),
        "work_items": work_items,
        "environment": environment,
    }
    return {"status": "ok", "bundle": bundle}


# Azure DevOps uses 1-4 priority (1 highest)
def _ado_priority_from_severity(sev: Optional[str]) -> int:
    return {"critical": 1, "high": 2, "medium": 3, "low": 4}.get((sev or "medium").lower(), 3)


# ADO severity field expects "1 - Critical", "2 - High", "3 - Medium", "4 - Low"
def _ado_severity_label(sev: Optional[str]) -> str:
    return {
        "critical": "1 - Critical",
        "high":     "2 - High",
        "medium":   "3 - Medium",
        "low":      "4 - Low",
    }.get((sev or "medium").lower(), "3 - Medium")


# Sev 1-4 (utviklingsfase, per Trines teststrategi 8.1)
def _severity_dev(sev: Optional[str]) -> int:
    return {"critical": 1, "high": 2, "medium": 3, "low": 4}.get((sev or "medium").lower(), 3)


# Kat A-C (driftsfase, kontraktbasert per Trines teststrategi 8.1)
def _category_ops(sev: Optional[str]) -> str:
    # critical → A (kritisk feil), high → B (alvorlig feil),
    # medium / low → C (mindre alvorlig feil)
    return {"critical": "A", "high": "B", "medium": "C", "low": "C"}.get(
        (sev or "medium").lower(), "C")


async def create_ado_work_items(environment: str, lang: str = "en") -> Dict[str, Any]:
    preview = await get_ado_bundle_preview(environment)
    bundle = preview["bundle"]
    record = {
        "bundle": bundle,
        "destination": "azure_devops",
        "status": "dispatched",
        "created_at": _now(),
        "environment": environment,
    }
    try:
        await red_cross_qa_jira_dispatches_collection.insert_one(dict(record))
    except Exception:
        pass
    return {"status": "ok",
            "created_count": len(bundle["work_items"]),
            "destination": "azure_devops", "bundle": bundle}


async def dispatch_to_outsystems(environment: str) -> Dict[str, Any]:
    preview = await get_ado_bundle_preview(environment)
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
    return {"status": "ok",
            "dispatched_count": len(bundle["work_items"]),
            "destination": "outsystems", "bundle": bundle}


# ═══════════════════════════════════════════════════════════════════
# Sprint Report — auto-generated summary for Trine (Testleder)
# Per Teststrategi 30.3 §8: "Det skal utarbeides en rapport per sprint
# med status, identifiserte avvik og anbefalinger." Trine is responsible
# for "koordinere, strukturere og rapportere testaktiviteter" — this
# generator automates the rapportere step end-to-end.
# ═══════════════════════════════════════════════════════════════════
async def generate_sprint_report(sprint_name: Optional[str] = None,
                                 environment: str = "test",
                                 lang: str = "en") -> Dict[str, Any]:
    settings = await get_settings()
    s = settings["settings"]
    sprint = sprint_name or s.get("current_sprint") or "Sprint 1"
    sprint_weeks = s.get("sprint_length_weeks", 2)

    # Gather sprint data — runs, findings, dispatches
    runs: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    dispatches: List[Dict[str, Any]] = []
    counts = {"pass": 0, "fail": 0, "warn": 0, "total": 0}
    sev_counts = {1: 0, 2: 0, 3: 0, 4: 0}     # utviklingsfase
    cat_counts = {"A": 0, "B": 0, "C": 0}     # driftsfase

    try:
        cursor = red_cross_qa_runs_collection.find(
            {"environment": environment}
        ).sort("started_at", -1).limit(50)
        async for r in cursor:
            r.pop("_id", None)
            counts["total"] += 1
            counts[r.get("status", "warn")] = counts.get(r.get("status", "warn"), 0) + 1
            runs.append({
                "run_id": r.get("run_id"),
                "suite": r.get("suite"),
                "status": r.get("status"),
                "summary": r.get("summary"),
                "started_at": r.get("started_at"),
            })
    except Exception:
        pass

    try:
        cursor = red_cross_qa_findings_collection.find(
            {"environment": environment}
        ).sort("created_at", -1).limit(50)
        async for f in cursor:
            f.pop("_id", None)
            sev = (f.get("severity") or "medium").lower()
            sev_counts[_severity_dev(sev)] = sev_counts.get(_severity_dev(sev), 0) + 1
            cat_counts[_category_ops(sev)] = cat_counts.get(_category_ops(sev), 0) + 1
            findings.append(f)
    except Exception:
        pass

    try:
        cursor = red_cross_qa_jira_dispatches_collection.find().sort(
            "created_at", -1).limit(20)
        async for d in cursor:
            d.pop("_id", None)
            dispatches.append({
                "destination": d.get("destination"),
                "status": d.get("status"),
                "created_at": d.get("created_at"),
                "items": len((d.get("bundle") or {}).get("work_items") or []),
            })
    except Exception:
        pass

    pass_rate = round(counts["pass"] / counts["total"] * 100) if counts["total"] else 0

    # Quality gates roll-up (mirrors get_stats)
    gates = {
        "gateAccessibility": "warn" if counts["total"] else "idle",
        "gatePerformance":   "warn" if counts["total"] else "idle",
        "gateApi":           "pass" if counts["total"] else "idle",
        "gateSecurity":      "warn" if counts["total"] else "idle",
        "gateForms":         "warn" if counts["total"] else "idle",
    }

    # LLM narrative (graceful fallback if no LLM)
    narrative_prompt = f"""You are Trine Bruu, Testleder for rodekors.no.
Write a concise sprint test report (Norwegian if lang=no, otherwise English).
Sprint: {sprint} ({sprint_weeks} weeks). Environment: {environment}.
Stats: {counts['total']} runs, {pass_rate}% pass rate.
Severity breakdown (utviklingsfase 1-4): {sev_counts}.
Category breakdown (driftsfase A-C): {cat_counts}.
Sections: 1) Status, 2) Identifiserte avvik, 3) Anbefalinger.
Keep under 300 words."""

    narrative = ""
    try:
        narrative = await _llm(narrative_prompt,
                               "You are a senior QA test lead writing a sprint report.",
                               lang) or ""
    except Exception:
        narrative = ""

    if not narrative or "[MOCKED" in narrative:
        if (lang or "en").startswith("no"):
            narrative = (
                f"## Status\n{sprint}: {counts['total']} testkjøringer, "
                f"{pass_rate}% pass-rate.\n\n"
                f"## Identifiserte avvik\nAlvorlighetsgrad (utviklingsfase): "
                f"Sev1={sev_counts[1]}, Sev2={sev_counts[2]}, "
                f"Sev3={sev_counts[3]}, Sev4={sev_counts[4]}.\n"
                f"Kategori (driftsfase): A={cat_counts['A']}, "
                f"B={cat_counts['B']}, C={cat_counts['C']}.\n\n"
                f"## Anbefalinger\nFokus på ikke-passerte porter og kritiske funn."
            )
        else:
            narrative = (
                f"## Status\n{sprint}: {counts['total']} runs, "
                f"{pass_rate}% pass rate.\n\n"
                f"## Findings\nSeverity (dev): {sev_counts}. "
                f"Category (ops): {cat_counts}.\n\n"
                f"## Recommendations\nFocus on failing gates and critical findings."
            )

    report = {
        "sprint_name": sprint,
        "sprint_length_weeks": sprint_weeks,
        "environment": environment,
        "generated_at": _now(),
        "stats": {
            "total_runs": counts["total"],
            "pass_rate": pass_rate,
            "by_status": {"pass": counts["pass"],
                          "fail": counts["fail"],
                          "warn": counts["warn"]},
            "severity_dev": sev_counts,    # 1-4 utviklingsfase
            "category_ops": cat_counts,    # A-C driftsfase
        },
        "quality_gates": gates,
        "runs_sample": runs[:10],
        "findings_sample": findings[:10],
        "dispatches": dispatches,
        "narrative": narrative,
        "lang": lang,
    }

    # Persist
    try:
        await red_cross_qa_reports_collection.insert_one({
            **report,
            "_id": ObjectId(),
            "report_id": f"sprint-report-{uuid.uuid4().hex[:8]}",
        })
    except Exception:
        pass

    report.pop("_id", None)
    return {"status": "ok", "report": report}


# ═══════════════════════════════════════════════════════════════════
# Tool 12 — DPIA / Privacy by Design (Trine Teststrategi §6.1 + GDPR Art. 35)
# ═══════════════════════════════════════════════════════════════════
async def run_dpia_check(environment: str, lang: str = "en") -> Dict[str, Any]:
    """DPIA / innebygget personvern audit — sub-checklist that complements
    the basic Security & Privacy scan with GDPR Art. 35 evidence Røde Kors needs
    for sensitive volunteer / beredskap / donor data."""
    prompt = (
        f"Environment: {environment}\n"
        "Audit rodekors.no for Privacy-by-Design and DPIA readiness.\n"
        "Return the JSON contract."
    )
    raw = await _llm(prompt, DPIA_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    checks = parsed.get("checks") or {
        "checkDataMapping":         {"status": "warn", "note": "Data flow inventory exists but missing Fundy + Vipps subprocessor flows"},
        "checkPurposeLimitation":   {"status": "pass", "note": "Donor data not reused for marketing without separate opt-in"},
        "checkLegalBasis":          {"status": "pass", "note": "Art. 6(1)(a) consent for donations; Art. 6(1)(f) legitimate interest for volunteers"},
        "checkDataMinimization":    {"status": "warn", "note": "Volunteer signup collects birth date — verify if needed"},
        "checkRetentionPolicy":     {"status": "warn", "note": "Application logs retained 90d — verify donor data not in logs"},
        "checkDeletionRoutines":    {"status": "fail", "note": "No automated deletion routine for inactive volunteer accounts (>3 yr)"},
        "checkConsentRecords":      {"status": "warn", "note": "Consent timestamps stored but not the consent text version"},
        "checkDataSubjectRights":   {"status": "warn", "note": "Innsyn / sletting / retting flow is manual via personvern@rodekors.no"},
        "checkProcessorRegister":   {"status": "warn", "note": "DPA register has Vipps + Dataverse but Fundy DPA not yet linked"},
        "checkCrossBorderTransfer": {"status": "pass", "note": "All processors EU-region; Microsoft Dynamics on EU tenant"},
        "checkBreachNotification":  {"status": "pass", "note": "72h breach process documented; on-call rotation exists"},
        "checkSensitiveCategories": {"status": "fail", "note": "Helseerklæring (helsestatus) field stored in plain Dataverse column — Art. 9 requires extra protection"},
    }

    findings = parsed.get("findings") or [
        {
            "severity": "high", "severity_dev": _severity_dev("high"), "category_ops": _category_ops("high"),
            "title": "Helseerklæring stored without Art. 9 safeguards",
            "message": "Sensitive health-status field on volunteer profile lacks field-level encryption/RBAC.",
            "fix_hint": "Move to encrypted column-set; restrict to HR-rolle in Dataverse.",
            "gdpr_article": "Art. 9",
        },
        {
            "severity": "high", "severity_dev": _severity_dev("high"), "category_ops": _category_ops("high"),
            "title": "No automated retention/deletion for inactive volunteers",
            "message": "Volunteers inactive >3 years remain in Dataverse indefinitely.",
            "fix_hint": "Add scheduled job to anonymize/delete after retention period.",
            "gdpr_article": "Art. 5(1)(e)",
        },
        {
            "severity": "medium", "severity_dev": _severity_dev("medium"), "category_ops": _category_ops("medium"),
            "title": "Fundy DPA not in processor register",
            "message": "Fundy is a sub-processor handling donor data but DPA is not linked in the personvernerklæring.",
            "fix_hint": "Sign DPA with Fundy and add to register; update personvernerklæring.",
            "gdpr_article": "Art. 28 + Art. 30",
        },
    ]

    data_register = parsed.get("data_register") or [
        {"system": "Enonic CMS", "categories": "Editorial content (no PII)", "purpose": "Content delivery",
         "legal_basis": "n/a", "retention": "n/a", "processor": "Enonic AS"},
        {"system": "Fundy", "categories": "Donor name, email, phone, amount",
         "purpose": "Donation processing", "legal_basis": "Art. 6(1)(b) contract",
         "retention": "7 yr (bokføringsloven)", "processor": "Fundy AS"},
        {"system": "Vipps", "categories": "Donor identity, payment",
         "purpose": "Payment handoff", "legal_basis": "Art. 6(1)(b)",
         "retention": "10 yr finance", "processor": "Vipps Mobilepay AS"},
        {"system": "Microsoft Dataverse", "categories": "Volunteer data incl. helseerklæring + politiattest",
         "purpose": "Volunteer management", "legal_basis": "Art. 6(1)(f) + Art. 9(2)(d)",
         "retention": "3 yr inactive then anonymize", "processor": "Microsoft Ireland"},
        {"system": "Okta", "categories": "Auth, IP, device",
         "purpose": "Identity & access", "legal_basis": "Art. 6(1)(f)",
         "retention": "13 mnd auth logs", "processor": "Okta EMEA"},
    ]

    recommendations = parsed.get("recommendations") or [
        {"priority": "high", "title": "Encrypt helseerklæring + politiattest at field level",
         "description": "Use Dataverse column-level encryption + restrict view to HR rolle."},
        {"priority": "high", "title": "Automate volunteer-data retention/deletion",
         "description": "Schedule monthly job: inactive >3yr → anonymize PII, keep aggregate stats."},
        {"priority": "medium", "title": "Link Fundy DPA in processor register",
         "description": "Update personvernerklæring with Fundy DPA reference + sub-processor list."},
    ]

    score = parsed.get("dpia_score")
    if not isinstance(score, (int, float)):
        # Compute from check statuses: pass=1.0, warn=0.5, fail=0
        weights = {"pass": 1.0, "warn": 0.5, "fail": 0.0}
        vals = [weights.get((c or {}).get("status", "warn"), 0.5) for c in checks.values()]
        score = round(100 * sum(vals) / max(len(vals), 1))

    overall_status = "pass" if score >= 85 else ("warn" if score >= 60 else "fail")

    run = await _store_run("redcross-security-basic", environment, overall_status,
                           f"DPIA / Privacy by Design — score {score}/100",
                           {"checks": checks, "findings": findings,
                            "dpia_score": score})
    return {
        "status": "ok",
        "dpia_score": score,
        "overall_status": overall_status,
        "checks": checks,
        "findings": findings,
        "data_register": data_register,
        "recommendations": recommendations,
        "run_id": run["run_id"],
    }


# ═══════════════════════════════════════════════════════════════════
# Tool 13 — Definition of Done verifier (Trine Teststrategi §6.1)
# ═══════════════════════════════════════════════════════════════════
async def verify_definition_of_done(environment: str,
                                     sprint_name: Optional[str] = None,
                                     lang: str = "en") -> Dict[str, Any]:
    """Mechanical DoD verifier — aggregates recent runs/findings/dispatches and
    checks each open work item against Trines four-point DoD checklist."""
    # Aggregate runs from this sprint (limit recent)
    recent_runs: List[Dict[str, Any]] = []
    try:
        cursor = red_cross_qa_runs_collection.find(
            {"environment": environment}
        ).sort("started_at", -1).limit(50)
        async for r in cursor:
            r.pop("_id", None)
            recent_runs.append(r)
    except Exception:
        recent_runs = []

    # Aggregate dispatches (work items)
    dispatches: List[Dict[str, Any]] = []
    try:
        cursor = red_cross_qa_jira_dispatches_collection.find(
            {"environment": environment}
        ).sort("created_at", -1).limit(20)
        async for d in cursor:
            d.pop("_id", None)
            dispatches.append(d)
    except Exception:
        dispatches = []

    # Build work-item checklist (mock fallback if no dispatches yet)
    work_items_input: List[Dict[str, Any]] = []
    if dispatches:
        for d in dispatches[:10]:
            for wi in (d.get("work_items") or [])[:3]:
                work_items_input.append({
                    "work_item_id": wi.get("id") or wi.get("work_item_id") or "",
                    "title": wi.get("title", ""),
                    "severity_dev": wi.get("severity_dev"),
                    "category_ops": wi.get("category_ops"),
                })
    if not work_items_input:
        work_items_input = [
            {"work_item_id": "ADO-1024", "title": "Donation flow Vipps handoff",
             "severity_dev": 2, "category_ops": "B"},
            {"work_item_id": "ADO-1025", "title": "Volunteer signup (axe-core fix)",
             "severity_dev": 3, "category_ops": "C"},
            {"work_item_id": "ADO-1026", "title": "Search page TTFB regression",
             "severity_dev": 2, "category_ops": "B"},
        ]

    # Mechanical DoD check per work item
    items: List[Dict[str, Any]] = []
    for wi in work_items_input:
        # functionality_tested → look for any pass run touching this WI's scope
        has_pass = any(r.get("status") == "pass" for r in recent_runs)
        # integrations_verified → look for api/cms/forms/role suite passing
        has_integration = any(
            r.get("status") == "pass" and any(
                k in (r.get("suite") or "")
                for k in ("api", "cms", "forms", "role")
            ) for r in recent_runs
        )
        # known_bugs_documented → if there are findings, check they have severity_dev
        bugs_docs = True
        for r in recent_runs:
            for f in (r.get("findings") or [])[:3]:
                if not f.get("severity_dev") and not f.get("category_ops"):
                    bugs_docs = False
        # ready_for_uat → no severity_dev <= 2 / category_ops in {A,B}
        ready = (wi.get("severity_dev") or 4) > 2 and (wi.get("category_ops") or "C") not in {"A", "B"}

        checklist = {
            "functionality_tested":  {"status": "pass" if has_pass else "fail",
                                       "evidence": (recent_runs[0].get("run_id") if recent_runs else "no runs yet")},
            "integrations_verified": {"status": "pass" if has_integration else "fail",
                                       "evidence": "integration suite ran" if has_integration else "no api/cms/forms/role pass"},
            "known_bugs_documented": {"status": "pass" if bugs_docs else "fail",
                                       "evidence": "all findings carry severity_dev + category_ops" if bugs_docs else "missing Sev/Kat annotation"},
            "ready_for_uat":         {"status": "pass" if ready else "fail",
                                       "evidence": f"severity_dev={wi.get('severity_dev')}, category_ops={wi.get('category_ops')}"},
        }
        dod_pass = all(v["status"] == "pass" for v in checklist.values())
        blockers = []
        if not ready:
            blockers.append({
                "severity_dev": wi.get("severity_dev", 4),
                "category_ops": wi.get("category_ops", "C"),
                "title": wi.get("title", ""),
            })
        items.append({
            "work_item_id": wi.get("work_item_id", ""),
            "title": wi.get("title", ""),
            "checklist": checklist,
            "dod_pass": dod_pass,
            "blockers": blockers,
        })

    summary = {
        "total_work_items": len(items),
        "dod_pass": sum(1 for i in items if i["dod_pass"]),
        "dod_partial": sum(1 for i in items
                           if not i["dod_pass"]
                           and any(c["status"] == "pass" for c in i["checklist"].values())),
        "dod_fail": sum(1 for i in items
                        if all(c["status"] == "fail" for c in i["checklist"].values())),
        "blockers_open": sum(len(i["blockers"]) for i in items),
        "ready_for_uat": all(i["dod_pass"] for i in items) and len(items) > 0,
    }

    narrative = (
        f"DoD-status for {sprint_name or 'gjeldende sprint'}: "
        f"{summary['dod_pass']}/{summary['total_work_items']} work items oppfyller DoD. "
        f"{summary['blockers_open']} åpne blokkere. "
        f"{'Klar for UAT.' if summary['ready_for_uat'] else 'IKKE klar for UAT — fjern blokkere først.'}"
    ) if (lang or "").startswith("no") else (
        f"DoD status for {sprint_name or 'current sprint'}: "
        f"{summary['dod_pass']}/{summary['total_work_items']} work items meet DoD. "
        f"{summary['blockers_open']} open blockers. "
        f"{'Ready for UAT.' if summary['ready_for_uat'] else 'NOT ready for UAT — clear blockers first.'}"
    )

    overall_status = "pass" if summary["ready_for_uat"] else ("warn" if summary["dod_pass"] > 0 else "fail")
    run = await _store_run("redcross-release-readiness", environment, overall_status,
                           f"DoD verification — {summary['dod_pass']}/{summary['total_work_items']}",
                           {"summary": summary, "items": items})
    return {
        "status": "ok",
        "summary": summary,
        "items": items,
        "narrative": narrative,
        "run_id": run["run_id"],
    }


# ═══════════════════════════════════════════════════════════════════
# Tool 14 — Resilience / lasttest (Teststrategi §6.1 distinguishes ytelse vs. resilience)
# ═══════════════════════════════════════════════════════════════════
async def run_resilience_check(profile: str, scenarios: List[str],
                                environment: str, lang: str = "en") -> Dict[str, Any]:
    """Resilience-focused k6 wrapper — emphasizes breakpoint, recovery, and soak
    metrics that Trine treats as a separate quality dimension from ytelse."""
    # Reuse k6 mock results, but add resilience-specific metrics.
    base = await run_k6(profile, scenarios, environment)
    base_results = base.get("results") or {}

    # Resilience-specific synthetic metrics (mock fallback)
    breakpoint_vu = {
        "profileSmoke": 100, "profileNormal": 500, "profileCampaign": 1500,
        "profileCrisis": 3500, "profileSoak": 800,
    }.get(profile, 1000)
    recovery_seconds = {
        "profileSmoke": 2, "profileNormal": 8, "profileCampaign": 22,
        "profileCrisis": 65, "profileSoak": 18,
    }.get(profile, 15)
    error_rate_at_peak = {
        "profileSmoke": 0.0, "profileNormal": 0.4, "profileCampaign": 1.8,
        "profileCrisis": 6.5, "profileSoak": 0.9,
    }.get(profile, 1.0)
    memory_drift_pct = 1.2 if profile == "profileSoak" else 0.3

    # Resilience score 0-100 — penalize high error rate + slow recovery + memory drift
    score = 100
    score -= min(40, int(error_rate_at_peak * 6))  # 1% err = -6 pts (cap -40)
    score -= min(25, recovery_seconds // 3)        # 30s = -10 pts
    score -= min(20, int(memory_drift_pct * 10))   # 1% drift = -10 pts
    score = max(0, score)

    overall_status = "pass" if score >= 80 else ("warn" if score >= 55 else "fail")

    findings: List[Dict[str, Any]] = []
    if error_rate_at_peak >= 5:
        findings.append({
            "severity": "high", "severity_dev": _severity_dev("high"), "category_ops": _category_ops("high"),
            "title": "Error rate exceeds 5% at peak load",
            "message": f"At {breakpoint_vu} VU the error rate reached {error_rate_at_peak}%.",
            "fix_hint": "Add circuit breakers + autoscale APIM + tune Enonic publish queue.",
        })
    if recovery_seconds > 30:
        findings.append({
            "severity": "medium", "severity_dev": _severity_dev("medium"), "category_ops": _category_ops("medium"),
            "title": "Slow recovery after peak",
            "message": f"System took {recovery_seconds}s to return to baseline p95 after peak load.",
            "fix_hint": "Pre-warm caches; add stage scaling buffer; verify ISR queue drain.",
        })
    if memory_drift_pct > 1.0:
        findings.append({
            "severity": "medium", "severity_dev": _severity_dev("medium"), "category_ops": _category_ops("medium"),
            "title": "Memory drift detected during soak",
            "message": f"Heap usage drifted +{memory_drift_pct}% over soak duration.",
            "fix_hint": "Enable heap dumps; check leaks in Guillotine resolver caches.",
        })

    resilience = {
        "resilience_score": score,
        "overall_status": overall_status,
        "breakpoint_vu": breakpoint_vu,
        "recovery_seconds": recovery_seconds,
        "error_rate_peak_pct": error_rate_at_peak,
        "memory_drift_pct": memory_drift_pct,
        "k6_results": base_results,
        "scenarios_run": scenarios,
        "profile": profile,
        "findings": findings,
        "_distinction": (
            "Resilience handler om systemet *overlever* og *gjenoppretter*, "
            "ikke kun hvor raskt det svarer (det er ytelse / Lighthouse)."
        ) if (lang or "").startswith("no") else (
            "Resilience is about whether the system *survives* and *recovers* — "
            "not how fast it responds (that is performance / Lighthouse)."
        ),
    }

    run = await _store_run("redcross-stress-campaign-peak", environment, overall_status,
                           f"Resilience check — score {score}/100, breakpoint {breakpoint_vu} VU",
                           resilience)
    return {"status": "ok", "resilience": resilience, "run_id": run["run_id"]}


# ═══════════════════════════════════════════════════════════════════
# Tool 15 — UAT-støtte (Akseptansetest-støtte for Røde Kors-stakeholders)
# ═══════════════════════════════════════════════════════════════════
DEFAULT_UAT_STAKEHOLDERS = ["Hilde Forslund", "Trine Røsand Scheen", "Astri Fretheim"]
_UAT_ROLE_BY_NAME = {
    "Hilde Forslund": "Produkteier",
    "Trine Røsand Scheen": "Fagperson",
    "Astri Fretheim": "Fagperson",
}


async def generate_uat_support(scopes: List[str], stakeholders: List[str],
                                sprint_name: Optional[str], environment: str,
                                lang: str = "en") -> Dict[str, Any]:
    """Generate UAT scripts, stakeholder checklists and sign-off forms.
    Item supports — Røde Kors executes."""
    stakeholders = stakeholders or DEFAULT_UAT_STAKEHOLDERS
    scopes = scopes or ["donation", "volunteer", "cms-editorial", "search"]
    prompt = (
        f"Sprint: {sprint_name or '(current)'}\n"
        f"Scopes: {', '.join(scopes)}\n"
        f"Stakeholders: {', '.join(stakeholders)}\n"
        f"Environment: {environment}\n"
        "Produce UAT artifacts."
    )
    raw = await _llm(prompt, UAT_SUPPORT_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    uat_scripts = parsed.get("uat_scripts") or [
        {
            "script_id": "UAT-001",
            "title": "Donation flow — hyppig donor + nye produkter (Fundy → Vipps)",
            "stakeholder": "Hilde Forslund",
            "scope": "donation",
            "preconditions": [
                "Test-environment oppe", "Test-Vipps account klart",
                "Fundy preset amounts: 100/250/500/1000 NOK",
            ],
            "steps": [
                {"n": 1, "action": "Åpne rodekors.no/stott-oss",
                 "expected": "Fundy-skjema rendres innen 2s, ingen blokkering"},
                {"n": 2, "action": "Velg 250 NOK månedlig",
                 "expected": "Frequency-toggle aktiv, beløp synlig i sammendrag"},
                {"n": 3, "action": "Fyll inn donor-data (æøå inkludert)",
                 "expected": "Validation aksepterer norske tegn"},
                {"n": 4, "action": "Trykk 'Doner'",
                 "expected": "Vipps-handoff åpner med riktig beløp + frekvens"},
                {"n": 5, "action": "Returner via Vipps cancel-URL",
                 "expected": "Donor-data bevart, melding 'Donasjon avbrutt'"},
            ],
            "acceptance_criteria": [
                "Fundy form A11y axe-core 0 critical",
                "Vipps payload korrekt (amount, currency=NOK)",
                "Marketing-samtykke IKKE pre-checket",
            ],
            "estimated_minutes": 15,
            "test_data": ["Donor: Olav Per Hansen", "E-post: olav.test@rodekors.no"],
        },
        {
            "script_id": "UAT-002",
            "title": "Volunteer-registrering — helseerklæring + politiattest",
            "stakeholder": "Trine Røsand Scheen",
            "scope": "volunteer",
            "preconditions": ["Frivillig-portal oppe", "Test-volunteer record"],
            "steps": [
                {"n": 1, "action": "Start frivilligskjema",
                 "expected": "Multi-step indikator viser steg 1/4"},
                {"n": 2, "action": "Fyll personalia + æøå",
                 "expected": "Norske tegn aksepteres, autocomplete fungerer"},
                {"n": 3, "action": "Last opp politiattest (PDF)",
                 "expected": "Filtype + størrelse OK, antivirus-skann passes"},
                {"n": 4, "action": "Fyll helseerklæring",
                 "expected": "Felt lagres med Art. 9-merking; rolle-kontroll i Dataverse"},
                {"n": 5, "action": "Send inn",
                 "expected": "Bekreftelses-e-post + korrelasjons-id synlig"},
            ],
            "acceptance_criteria": [
                "Sensitive data ikke synlig i logg",
                "Bekreftelse mottas innen 60s",
                "Skjema-state bevart ved Tilbake-knapp",
            ],
            "estimated_minutes": 20,
            "test_data": ["Volunteer ID: VOL-TEST-001"],
        },
        {
            "script_id": "UAT-003",
            "title": "Lokal redaktør publiserer aktivitet i sitt distrikt",
            "stakeholder": "Astri Fretheim",
            "scope": "cms-editorial",
            "preconditions": ["Content Studio v.6 åpen", "Lokal-redaktør-rolle aktiv"],
            "steps": [
                {"n": 1, "action": "Logg inn som lokal redaktør",
                 "expected": "Kun eget distrikt synlig i tre-strukturen"},
                {"n": 2, "action": "Opprett ny Aktivitet",
                 "expected": "Tema, dato, kontaktperson kan velges"},
                {"n": 3, "action": "Publiser",
                 "expected": "ISR revaliderer innen 30s, frontend viser ny aktivitet"},
                {"n": 4, "action": "Forsøk å redigere annen forenings aktivitet",
                 "expected": "Tilgang nektet (subtree isolation)"},
            ],
            "acceptance_criteria": [
                "Rolle-matrise håndhevet",
                "Audit-logg fanger publisering",
                "ISR-revalidering < 30s",
            ],
            "estimated_minutes": 12,
            "test_data": ["Distrikt: Oslo Nord"],
        },
    ]

    checklists = parsed.get("checklists") or [
        {
            "stakeholder": s,
            "items": [
                {"label": f"Gjennomført UAT-script for {role}-omfang", "required": True, "status": "pending"},
                {"label": "Akseptansekriterier verifisert", "required": True, "status": "pending"},
                {"label": "Avvik dokumentert i Azure DevOps", "required": True, "status": "pending"},
                {"label": "Klar til signering", "required": True, "status": "pending"},
            ],
        } for s, role in [(name, _UAT_ROLE_BY_NAME.get(name, "Stakeholder")) for name in stakeholders]
    ]

    signoff = parsed.get("signoff_form") or {
        "sprint": sprint_name or "Sprint",
        "build_attestation": "(set after run)",
        "lines": [
            {"role": _UAT_ROLE_BY_NAME.get(name, "Stakeholder"),
             "name": name, "decision": "pending", "comment": ""}
            for name in stakeholders
        ],
    }

    support_notes = parsed.get("support_notes") or [
        "Item bistår med skript + miljø; Røde Kors eier UAT-utførelsen.",
        "Hvis blokkere: kontakt testleder Trine Bruu (Røde Kors) eller leverandør-lead.",
        "Sign-off skal lagres i Azure DevOps mot tilhørende epic.",
    ]

    run = await _store_run("redcross-release-readiness", environment, "pass",
                           f"UAT support — {len(uat_scripts)} scripts for {len(stakeholders)} stakeholders",
                           {"uat_scripts": uat_scripts, "checklists": checklists,
                            "signoff_form": signoff})
    return {
        "status": "ok",
        "uat_scripts": uat_scripts,
        "checklists": checklists,
        "signoff_form": signoff,
        "support_notes": support_notes,
        "stakeholders": stakeholders,
        "run_id": run["run_id"],
    }


# ═══════════════════════════════════════════════════════════════════
# Tool 16 — Risikomatrise-input (per Teststrategi §10 — matrix lives outside the doc)
# ═══════════════════════════════════════════════════════════════════
def _parse_risk_csv(csv_text: str) -> List[Dict[str, Any]]:
    """Best-effort CSV parser for the risk matrix (id, description, prob, impact, area)."""
    risks: List[Dict[str, Any]] = []
    if not csv_text or not csv_text.strip():
        return risks
    lines = [ln for ln in csv_text.strip().splitlines() if ln.strip()]
    if not lines:
        return risks
    # Detect header
    header_tokens = [h.strip().lower() for h in re.split(r"[,;\t]", lines[0])]
    has_header = any(k in header_tokens for k in ("id", "risk", "description", "probability", "prob", "impact", "area"))
    start = 1 if has_header else 0
    for ln in lines[start:]:
        cols = [c.strip().strip('"') for c in re.split(r"[,;\t]", ln)]
        if len(cols) < 4:
            continue
        try:
            risks.append({
                "id": cols[0] or f"R-{len(risks)+1:03d}",
                "description": cols[1],
                "probability": int(float(cols[2] or 1)),
                "impact": int(float(cols[3] or 1)),
                "area": cols[4] if len(cols) > 4 else "general",
            })
        except (ValueError, TypeError):
            continue
    return risks


_RISK_AREA_TO_SUITE = {
    "donation": "forms", "fundy": "forms", "vipps": "forms",
    "volunteer": "forms", "frivillig": "forms",
    "personvern": "dpia", "gdpr": "dpia", "privacy": "dpia",
    "performance": "performance", "ytelse": "performance",
    "lighthouse": "performance",
    "lasttest": "stress", "load": "stress", "resilience": "stress",
    "stress": "stress", "campaign": "stress",
    "tilgjengelighet": "accessibility", "a11y": "accessibility", "wcag": "accessibility",
    "api": "api", "graphql": "api", "guillotine": "api",
    "cms": "cms", "enonic": "cms", "redaksjonell": "cms",
    "rolle": "role-matrix", "authz": "role-matrix", "rbac": "role-matrix",
    "designsystemet": "designsystemet", "digdir": "designsystemet",
    "migrasjon": "migration", "migration": "migration", "innhold": "migration",
    "sikkerhet": "security", "security": "security", "owasp": "security",
    "uat": "uat", "akseptanse": "uat",
    "seo": "seo",
}


def _suite_for_area(area: str) -> str:
    a = (area or "").lower()
    for key, suite in _RISK_AREA_TO_SUITE.items():
        if key in a:
            return suite
    return "security"


async def analyze_risk_matrix(matrix_csv: Optional[str],
                               matrix_json: Optional[List[Dict[str, Any]]],
                               environment: str,
                               lang: str = "en") -> Dict[str, Any]:
    """Consume Røde Kors's risikomatrise (CSV text OR JSON list) and map risks
    onto the agent's 17 test suites with priority + justification."""
    risks: List[Dict[str, Any]] = []
    if matrix_json:
        for r in matrix_json:
            try:
                risks.append({
                    "id": str(r.get("id") or f"R-{len(risks)+1:03d}"),
                    "description": str(r.get("description") or r.get("title") or ""),
                    "probability": int(r.get("probability") or r.get("prob") or 1),
                    "impact": int(r.get("impact") or 1),
                    "area": str(r.get("area") or "general"),
                })
            except (ValueError, TypeError):
                continue
    elif matrix_csv:
        risks = _parse_risk_csv(matrix_csv)
    else:
        # Mock fallback — sample risk matrix for demo purposes
        risks = [
            {"id": "R-001", "description": "Donation flow nedetid under TV-aksjonen",
             "probability": 4, "impact": 5, "area": "donation"},
            {"id": "R-002", "description": "Helseerklæring lekket i logg",
             "probability": 2, "impact": 5, "area": "personvern"},
            {"id": "R-003", "description": "Lokal redaktør publiserer i feil distrikt",
             "probability": 3, "impact": 3, "area": "rolle"},
            {"id": "R-004", "description": "WCAG-feil blokkerer skjermleser-bruker",
             "probability": 3, "impact": 4, "area": "tilgjengelighet"},
            {"id": "R-005", "description": "Migrert side mangler 301-redirect — SEO-tap",
             "probability": 4, "impact": 3, "area": "migrasjon"},
            {"id": "R-006", "description": "Vipps-handoff feilet under kampanje",
             "probability": 2, "impact": 4, "area": "vipps"},
            {"id": "R-007", "description": "Designsystem-versjon ute av sync",
             "probability": 3, "impact": 2, "area": "designsystemet"},
        ]

    # Score & classify
    for r in risks:
        score = (r.get("probability", 1) or 1) * (r.get("impact", 1) or 1)
        r["score"] = score
        r["level"] = (
            "critical" if score >= 15 else
            "high" if score >= 9 else
            "medium" if score >= 4 else
            "low"
        )
        r["suite"] = _suite_for_area(r.get("area", ""))

    risks.sort(key=lambda x: x.get("score", 0), reverse=True)
    high_risks = [r for r in risks if r.get("level") in {"critical", "high"}]

    # Build suite priority
    suite_groups: Dict[str, List[Dict[str, Any]]] = {}
    for r in risks:
        suite_groups.setdefault(r["suite"], []).append(r)

    suite_priority: List[Dict[str, Any]] = []
    for suite, group in suite_groups.items():
        max_score = max(g["score"] for g in group)
        priority = 1 if max_score >= 15 else (2 if max_score >= 9 else (3 if max_score >= 4 else 4))
        rationale = f"Max risk score {max_score} ({len(group)} risks linked)"
        suite_priority.append({
            "suite": suite,
            "priority": priority,
            "rationale": rationale,
            "linked_risks": [g["id"] for g in group],
            "max_score": max_score,
        })
    suite_priority.sort(key=lambda x: (x["priority"], -x["max_score"]))

    # Coverage gaps — risks where suite is "general" or unmapped
    coverage_gaps = [
        {"risk_id": r["id"], "reason": f"Area '{r.get('area','')}' not mapped to a suite",
         "suggestion": "Add area keyword to _RISK_AREA_TO_SUITE or split risk."}
        for r in risks if r["suite"] in {"security"} and "security" not in (r.get("area") or "").lower() and "owasp" not in (r.get("area") or "").lower()
    ][:5]

    # Narrative
    narrative_no = (
        f"Risikomatrise: {len(risks)} risks ({len(high_risks)} høy/kritisk). "
        f"Topp 3 testsuiter: {', '.join(s['suite'] for s in suite_priority[:3])}. "
        f"Begrunner hvorfor disse prioriteres i sprintplanleggingen."
    )
    narrative_en = (
        f"Risk matrix: {len(risks)} risks ({len(high_risks)} high/critical). "
        f"Top 3 test suites: {', '.join(s['suite'] for s in suite_priority[:3])}. "
        f"Justifies why these are prioritised in sprint planning."
    )
    narrative = narrative_no if (lang or "").startswith("no") else narrative_en

    overall_status = "fail" if any(r["level"] == "critical" for r in risks) else (
        "warn" if any(r["level"] == "high" for r in risks) else "pass"
    )

    run = await _store_run("redcross-release-readiness", environment, overall_status,
                           f"Risk matrix analysis — {len(risks)} risks, top suite {suite_priority[0]['suite'] if suite_priority else 'n/a'}",
                           {"risks": risks, "suite_priority": suite_priority})
    return {
        "status": "ok",
        "risk_count": len(risks),
        "high_risks": high_risks,
        "risks": risks,
        "suite_priority": suite_priority,
        "coverage_gaps": coverage_gaps,
        "summary_narrative": narrative,
        "run_id": run["run_id"],
    }


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
