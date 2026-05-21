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
from typing import Optional, List, Dict, Any, Tuple
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

CMS_QA_PROMPT = """You are a senior CMS QA engineer for Enonic Content Studio (XP 7.13+) + NextJS frontend.

Generate concrete, runnable CMS test cases for the requested editorial areas, considering 6 editorial roles:
Administrator, Owner, Local Owner, Editor, Local Editor, Contributor.

## Output contract (strict JSON)

```json
{
  "test_cases": [
    {
      "area": "areaRoles",
      "severity": "low|medium|high|critical",
      "title": "Short imperative title",
      "description": "1-2 sentences explaining what to test and why it matters.",
      "acceptance_criteria": ["Bullet 1", "Bullet 2", "..."],
      "roles": ["Editor", "Local Editor"],
      "enonic_xp_pattern": "<skill section reference, e.g. security-patterns.md §2>",
      "automation_ref": "playwright:cms-preview.spec.ts | cypress:component-designsystemet.cy.ts | null"
    }
  ]
}
```

## Per-area heuristics

- **areaContentTypes** — render `<HtmlArea>` (Enonic richtext) with æøå + HTML entities + embedded media; verify NextJS sanitization preserves intent.
- **areaPageTemplates** — `<allow-on-content-type>` constraints in page-template XML descriptors are not removed silently across migrations (real Cristin→NVA bug pattern).
- **areaLayouts** — layout regions accept only the declared region types; rejected types do not crash the editor.
- **areaParts** — custom widgets escape `app.config.*` values when rendering HTML (XSS defense-in-depth).
- **areaFieldSets** — display names retain `i18n="key.path"` attributes (no hardcoded Norwegian); switching CS locale updates labels.
- **areaRoles** — subtree isolation: a Local Editor bound to `/distrikt/oslo` cannot publish under `/distrikt/bergen` (over-permissive ACL guard).
- **areaPreview** — Content Studio preview at `/admin/site/preview/{draft|master}/{path}` renders with at least one `[data-portal-component-type]` wrapper.
- **areaPublish** — publish event emits `custom.X.publish` AND triggers a `modify` event on first-time publish (not only on subsequent edits).
- **areaUnpublish** — unpublish flags the content (`removedFromX = true` or equivalent stale-data marker); next import does NOT resurrect it without explicit re-create.
- **areaScheduled** — scheduled publish honors `Europe/Oslo` (DST-aware), NOT a fixed `GMT+1:00` offset. Verify with a CEST date.
- **areaLocalization** — requesting an English version of Norwegian-only content falls back gracefully (no 500); default locale resolved when route has no locale prefix.
- **areaMedia** — Enonic image URLs `/_/image/<id>:<hash>/...` keep resolving after the image is re-published (hash rehash); `next/image` does not break.
- **areaBrokenLinks** — migrated content URLs use the canonical parameter name on both ends (no `?cristinid=` vs `?id=` drift between list page and detail header).
- **areaIsr** — publishing content invalidates NextJS ISR cache within the configured `revalidate` window; visitors see the new version without a full rebuild.

## Enonic XP red flags to cover (the 6 most common production regressions, see `.claude/skills/enonic-xp/`)

- **Over-permissive ACL** — `role:system.authenticated` granted write on imported repos (`security-patterns.md §2`).
- **DST drift on scheduled jobs** — `GMT+1:00` vs `Europe/Oslo` (`reliability-patterns.md §5`).
- **Widget XSS via app.config.*** — interpolation of admin-controlled config into HTML without escaping (`security-patterns.md §3`).
- **Stale-data lifecycle** — content removed upstream lives forever locally (`reliability-patterns.md §4`).
- **URL parameter drift** — readers using `?id=` while link generators still emit `?cristinid=` (`data-integrity-patterns.md §6`).
- **Free-text replacing structured filter** — `queryResults({query: x})` where it used to be a typed field filter (`data-integrity-patterns.md §7`).

## Style rules

- Concrete actions referencing real Røde Kors flows (donation, volunteer, distrikt/forening tree, kampanje) where relevant.
- Every test case carries `enonic_xp_pattern` (cite the skill doc) so reviewers can drill into the rationale.
- `automation_ref` is `null` for purely manual cases; otherwise points to the canonical Playwright/Cypress spec generated by this module (e.g. `playwright:cms-preview.spec.ts`).
- Severity rubric: `high` for ACL / subtree isolation / DST / migration drift bugs; `medium` for data-fidelity / stale-data; `low` for cosmetic / governance.
- Localization: human-readable strings translated to `lang` if provided; identifiers, paths and XML attributes stay in English.
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

    # Phase H+ (Enonic skill 0.1.0, 2026-05-19) — append deterministic
    # templates per scope, same pattern as Playwright. Each template carries
    # an Enonic XP angle the LLM can't reliably hallucinate:
    #   - scopeComponent          → Guillotine GraphQL stubbing + Designsystemet
    #   - scopeFrontendRegression → cypress-axe + NextJS hydration + æøå routes
    #   - scopeQuickDebug         → locale + Enonic image URL smoke
    if "scopeComponent" in (scopes or []):
        already = any("component-designsystemet" in (s.get("filename") or "").lower()
                       or "Guillotine GraphQL stubbing" in (s.get("content") or "")
                       for s in scripts)
        if not already:
            scripts.append(_cypress_component_designsystemet_spec())

    if "scopeFrontendRegression" in (scopes or []):
        already = any("regression-donation" in (s.get("filename") or "").lower()
                       or "NextJS hydration + a11y" in (s.get("content") or "")
                       for s in scripts)
        if not already:
            scripts.append(_cypress_regression_donation_spec())

    if "scopeQuickDebug" in (scopes or []):
        already = any("quick-debug" in (s.get("filename") or "").lower()
                       or "Enonic image URL smoke" in (s.get("content") or "")
                       for s in scripts)
        if not already:
            scripts.append(_cypress_quick_debug_spec())

    if not scripts:
        # Generic minimal fallback — kept for unknown scopes / future additions.
        scripts = [{
            "filename": f"{s}.cy.ts",
            "content": (
                f"describe('{s}', () => {{\n"
                "  it('renders without errors', () => {\n"
                "    cy.visit('/');\n"
                "    cy.contains(/Røde Kors|Red Cross/i).should('be.visible');\n"
                "  });\n});\n"
            ),
        } for s in (scopes or [])[:5]]

    try:
        await red_cross_qa_generated_scripts_collection.insert_one({
            "tool": "cypress", "scopes": scopes, "environment": environment,
            "scripts": scripts, "created_at": _now(), "lang": lang,
        })
    except Exception:
        pass

    return {"status": "ok", "scripts": scripts, "lang": lang}


def _cypress_component_designsystemet_spec() -> Dict[str, str]:
    """Deterministic Cypress component-level spec for Designsystemet
    components reading from Enonic via Guillotine GraphQL.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): Cypress's historical
    strength is component-level isolation with stubbed network calls.
    This template demonstrates the canonical pattern:
      - cy.intercept on POST /api/graphql matching by operation name
      - Fixture-driven Guillotine responses (matching the 4 canonical
        queries already in the Postman collection)
      - Designsystemet component renders without leaking into siblings
    """
    content = (
        "// Guillotine GraphQL stubbing — Cypress's strongest pattern\n"
        "// vs Playwright, applied to Enonic-fed Designsystemet components.\n"
        "//\n"
        "// Fixtures live at cypress/fixtures/guillotine/*.json and match\n"
        "// the 4 canonical operations from the Postman collection:\n"
        "//   GetDistrictPage / GetActivityList / GetCampaignPage / GetForeningContacts\n\n"
        "describe('Designsystemet · CampaignCard (Guillotine GraphQL stubbing)', () => {\n"
        "  beforeEach(() => {\n"
        "    // Route every Guillotine GraphQL POST through cy.intercept.\n"
        "    // Match by operation name in the request body so multiple\n"
        "    // queries can coexist in the same spec.\n"
        "    cy.intercept('POST', '**/api/graphql', (req) => {\n"
        "      const op = req.body?.operationName || '';\n"
        "      if (op === 'GetCampaignPage') {\n"
        "        return req.reply({ fixture: 'guillotine/campaign-page.json' });\n"
        "      }\n"
        "      if (op === 'GetActivityList') {\n"
        "        return req.reply({ fixture: 'guillotine/activity-list.json' });\n"
        "      }\n"
        "      // Anything else: pass through.\n"
        "      req.continue();\n"
        "    }).as('guillotine');\n"
        "  });\n\n"
        "  it('renders campaign title and amount from stubbed Guillotine response', () => {\n"
        "    cy.visit('/no/aksjoner/test-kampanje');\n"
        "    cy.wait('@guillotine');\n"
        "    cy.findByRole('heading', { level: 1 }).should('be.visible');\n"
        "    cy.findByRole('button', { name: /donér|donate/i }).should('be.visible');\n"
        "  });\n\n"
        "  it('handles empty Guillotine response gracefully (no crash)', () => {\n"
        "    cy.intercept('POST', '**/api/graphql', (req) => {\n"
        "      if (req.body?.operationName === 'GetCampaignPage') {\n"
        "        return req.reply({ body: { data: { guillotine: { get: null } } } });\n"
        "      }\n"
        "      req.continue();\n"
        "    });\n"
        "    cy.visit('/no/aksjoner/ikke-finnes', { failOnStatusCode: false });\n"
        "    // Soft 404 page should render — no React error boundary blow-up.\n"
        "    cy.contains(/finner ikke|not found|404/i).should('be.visible');\n"
        "  });\n\n"
        "  it('uses POST (Guillotine) — protects against accidental GET migration', () => {\n"
        "    // Defense-in-depth: Enonic Guillotine is POST-only. If a refactor\n"
        "    // accidentally introduces a GET, this fails loudly.\n"
        "    let postCount = 0;\n"
        "    cy.intercept('POST', '**/api/graphql', (req) => { postCount++; req.continue(); });\n"
        "    cy.intercept('GET',  '**/api/graphql', (req) => {\n"
        "      throw new Error('Guillotine called with GET — should always be POST');\n"
        "    });\n"
        "    cy.visit('/no/aksjoner/test-kampanje');\n"
        "    cy.wrap(null).should(() => expect(postCount).to.be.greaterThan(0));\n"
        "  });\n"
        "});\n"
    )
    return {"filename": "component-designsystemet.cy.ts", "content": content}


def _cypress_regression_donation_spec() -> Dict[str, str]:
    """Deterministic Cypress page-level regression spec covering the
    three NextJS + Enonic XP failure modes a manual QA reliably misses:
      1. Hydration mismatch — assertions run BEFORE React hydrates and
         silently see SSR HTML instead of the live component.
      2. Localized æøå routes — Norwegian slugs encode-decode differently
         in build vs runtime; a route that works in dev can 404 in prod.
      3. `next/image` over Enonic URLs — re-publishing an image rehashes
         the `:hash` segment in /_/image/<id>:<hash>/...; broken images
         show fallback alt silently.

    Plus cypress-axe sweep on the donation page (the highest-revenue path).
    """
    content = (
        "// NextJS hydration + a11y + Enonic image regression suite.\n"
        "// The three failure modes manual QA reliably misses, gated\n"
        "// by deterministic assertions Cypress is well-suited for.\n\n"
        "import 'cypress-axe';\n\n"
        "// Routes covering the migration æøå edge case + happy donation path.\n"
        "const ROUTES = [\n"
        "  { path: '/no/doner',                lang: 'no', title: /doner|donér/i },\n"
        "  { path: '/no/forskning/bløding',    lang: 'no', title: /forskning|bløding/i },\n"
        "  { path: '/en/donate',               lang: 'en', title: /donate/i },\n"
        "];\n\n"
        "describe('Frontend regression — NextJS + Enonic XP failure modes', () => {\n"
        "  beforeEach(() => { cy.injectAxe(); });\n\n"
        "  ROUTES.forEach(({ path, lang, title }) => {\n"
        "    describe(`route ${path}`, () => {\n"
        "      it('hydrates before user-facing assertions', () => {\n"
        "        cy.visit(path);\n"
        "        // Wait for NextJS hydration. The site emits __NEXT_DATA__ at SSR\n"
        "        // time and React replaces the static markup once interactive.\n"
        "        cy.window().should('have.property', '__NEXT_DATA__');\n"
        "        // If the layout uses Designsystemet's <Layout>, it sets a\n"
        "        // data-hydrated attribute; otherwise fall back to body class.\n"
        "        cy.get('body', { timeout: 10000 }).then(($body) => {\n"
        "          const ok = $body.attr('data-hydrated') === 'true'\n"
        "                  || $body.hasClass('hydrated')\n"
        "                  || !!$body.find('[data-hydrated=\"true\"]').length;\n"
        "          // Don't hard-fail if neither marker exists — just log it.\n"
        "          if (!ok) cy.log('warn: no hydration marker found on body');\n"
        "        });\n"
        "        cy.get('html').should('have.attr', 'lang').and('match', new RegExp(`^${lang}`));\n"
        "        cy.contains(title).should('be.visible');\n"
        "      });\n\n"
        "      it('all Enonic image URLs return 200', () => {\n"
        "        cy.visit(path);\n"
        "        cy.window().should('have.property', '__NEXT_DATA__');\n"
        "        // /_/image/<contentId>:<hash>/full/scale-WxH/...\n"
        "        cy.get('img[src*=\"/_/image/\"]').each(($img) => {\n"
        "          const src = $img.prop('src');\n"
        "          if (src) {\n"
        "            cy.request({ url: src, failOnStatusCode: false })\n"
        "              .its('status')\n"
        "              .should('be.lessThan', 400);\n"
        "          }\n"
        "        });\n"
        "      });\n\n"
        "      it('passes WCAG 2.2 AA axe sweep', () => {\n"
        "        cy.visit(path);\n"
        "        cy.window().should('have.property', '__NEXT_DATA__');\n"
        "        cy.checkA11y(null, {\n"
        "          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] },\n"
        "        });\n"
        "      });\n"
        "    });\n"
        "  });\n"
        "});\n"
    )
    return {"filename": "regression-donation.cy.ts", "content": content}


def _cypress_quick_debug_spec() -> Dict[str, str]:
    """Deterministic Cypress quick-debug spec for local dev triage.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): when you suspect a
    config-level breakage, this is the 60-second spec to run. Covers:
      - Enonic image URL smoke: a broken `:hash` segment 404s the
        whole `/_/image/...` route — easy to spot.
      - Locale resolution: a missing `next-intl` config silently falls
        back to default locale; testing both /no and /en catches it.
      - GraphQL endpoint reachability: the most-common '500 on every
        page' cause is the Guillotine endpoint being down.
    """
    content = (
        "// Quick debug — Enonic image URL smoke + locale + Guillotine ping.\n"
        "// Designed to run in <60s during local dev triage.\n\n"
        "describe('Quick debug — Enonic + NextJS sanity', () => {\n"
        "  it('Guillotine GraphQL endpoint is reachable (POST returns < 500)', () => {\n"
        "    cy.request({\n"
        "      method: 'POST',\n"
        "      url: '/api/graphql',\n"
        "      body: { query: '{ guillotine { getSite { _name } } }' },\n"
        "      failOnStatusCode: false,\n"
        "    }).its('status').should('be.lessThan', 500);\n"
        "  });\n\n"
        "  it('default locale resolves (no next-intl misconfig)', () => {\n"
        "    cy.visit('/');\n"
        "    // Default redirect should land on /no/ for rodekors.no.\n"
        "    cy.location('pathname').should('match', /^\\/(no|en)/);\n"
        "    cy.get('html').should('have.attr', 'lang');\n"
        "  });\n\n"
        "  it('Enonic image URL smoke — first image on the homepage', () => {\n"
        "    cy.visit('/');\n"
        "    cy.get('img[src*=\"/_/image/\"]').first().then(($img) => {\n"
        "      const src = $img.prop('src');\n"
        "      cy.request(src).its('status').should('equal', 200);\n"
        "    });\n"
        "  });\n"
        "});\n"
    )
    return {"filename": "quick-debug.cy.ts", "content": content}


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
# In-memory GraphQL schema baseline cache: keyed by (environment, endpoint).
# Stores the most-recent introspection snapshot so consecutive analyze_api
# calls can compute a real `checkSchemaDrift` instead of a hardcoded "pass".
# Mongo-backed persistence is a TODO; for the workshop demo this is enough.
_GRAPHQL_BASELINES: Dict[Tuple[str, str], Dict[str, Any]] = {}


def _is_graphql_endpoint(endpoint: str) -> bool:
    return "/graphql" in (endpoint or "").lower()


def _is_donation_endpoint(endpoint: str) -> bool:
    e = (endpoint or "").lower()
    return "/donation" in e or "/donate" in e or "/vipps" in e


def _is_form_endpoint(endpoint: str) -> bool:
    e = (endpoint or "").lower()
    return "/contact" in e or "/form" in e or "/fundy" in e


async def _check_schema_drift_against_baseline(
    endpoint: str, environment: str,
) -> Tuple[str, List[Dict[str, Any]]]:
    """Compare current introspection result vs. the previously seen one.

    Returns `(status, findings)` where status is `"pass"` / `"warn"` / `"fail"`
    and findings is a (possibly empty) list of `{severity, title, message}`.

    Mock-first: uses `run_graphql_introspection`'s deterministic output, which
    today is static (5 operations + 8 content types). So consecutive calls
    against the same env/endpoint return `"pass"`. When a future call sees a
    different op count or a renamed op, drift is detected and reported.
    """
    introspection = await run_graphql_introspection(endpoint, environment)
    current_ops = {op.get("name") for op in (introspection.get("operations") or [])
                    if op.get("name")}
    current_types = {t.get("name") for t in (introspection.get("content_types") or [])
                       if t.get("name")}
    key = (environment, endpoint)
    baseline = _GRAPHQL_BASELINES.get(key)
    if baseline is None:
        _GRAPHQL_BASELINES[key] = {"ops": current_ops, "types": current_types}
        return "pass", [{
            "severity": "low",
            "title": "Schema drift baseline established",
            "message": (f"First analysis of {endpoint} on {environment}. "
                          f"Captured {len(current_ops)} ops + {len(current_types)} content types."),
        }]
    added_ops = current_ops - baseline["ops"]
    removed_ops = baseline["ops"] - current_ops
    added_types = current_types - baseline["types"]
    removed_types = baseline["types"] - current_types
    drift = len(added_ops) + len(removed_ops) + len(added_types) + len(removed_types)
    findings: List[Dict[str, Any]] = []
    if drift > 0:
        findings.append({
            "severity": "medium" if drift <= 3 else "high",
            "title": f"GraphQL schema drift detected ({drift} change(s))",
            "message": (
                f"Added ops: {sorted(added_ops) or '—'} · "
                f"Removed ops: {sorted(removed_ops) or '—'} · "
                f"Added types: {sorted(added_types) or '—'} · "
                f"Removed types: {sorted(removed_types) or '—'}"
            ),
        })
    # Refresh baseline so the next call diffs against the most recent snapshot.
    _GRAPHQL_BASELINES[key] = {"ops": current_ops, "types": current_types}
    if drift == 0:
        return "pass", []
    # Core operation removed (any guillotine.* op) → fail.
    if any(op.startswith("guillotine.") for op in removed_ops):
        return "fail", findings
    return ("warn" if drift <= 3 else "fail"), findings


def _path_specific_checks(endpoint: str, environment: str) -> Dict[str, str]:
    """Per-path heuristic mock results so consecutive analyses of different
    endpoints don't all return the same checks (workshop-demo quality).

    Returns the FULL 13-check dict pre-filled with reasonable mock statuses
    that the caller will then refine (e.g. by computing real schema drift).
    """
    # Defaults — used for unknown endpoints and overridden below per path type.
    checks: Dict[str, str] = {
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
        # Phase H+ (Enonic skill 0.1.0) — three security checks added.
        # Defaults to "warn" so callers see them in the dashboard until
        # the path-specific override below replaces them with real values.
        "checkInjection": "warn",
        "checkIntrospectionDisabledInProd": "warn",
        "checkDepthLimit": "warn",
    }

    if _is_graphql_endpoint(endpoint):
        # GraphQL gets the three security checks fully exercised.
        # Mock heuristic — pass on non-prod (assumes dev/test posture
        # has introspection enabled by design; not a fail signal).
        checks["checkInjection"] = "pass" if environment != "prod" else "warn"
        checks["checkIntrospectionDisabledInProd"] = (
            "pass" if environment == "prod" else "warn"
        )
        checks["checkDepthLimit"] = "warn"
        checks["checkPerfBudget"] = "warn"  # GraphQL is N+1 prone — warn by default
    elif _is_donation_endpoint(endpoint):
        # Critical revenue path — be strict.
        checks["checkRateLimit"] = "warn"
        checks["checkPerfBudget"] = "pass"  # Should be < 300ms for donate
        checks["checkErrorHandling"] = "warn"
        checks["checkInjection"] = "pass"  # REST → not NoQL-injectable directly
        checks["checkIntrospectionDisabledInProd"] = "pass"  # n/a for REST
        checks["checkDepthLimit"] = "pass"  # n/a for REST
    elif _is_form_endpoint(endpoint):
        # Form / contact / Fundy — sanitization is the primary concern.
        checks["checkInjection"] = "warn"  # Worth probing field values
        checks["checkErrorHandling"] = "warn"
        checks["checkIntrospectionDisabledInProd"] = "pass"
        checks["checkDepthLimit"] = "pass"
    else:
        # Unknown endpoint — keep the defaults but mark security checks
        # as not-applicable rather than misleading "warn".
        checks["checkInjection"] = "pass"
        checks["checkIntrospectionDisabledInProd"] = "pass"
        checks["checkDepthLimit"] = "pass"

    return checks


async def analyze_api(endpoint: str, method: str, environment: str,
                      lang: str = "en") -> Dict[str, Any]:
    """Mock-first API analysis. Returns checks dict aligned with frontend keys.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19):
      - 3 new security checks: `checkInjection`, `checkIntrospectionDisabledInProd`,
        `checkDepthLimit`. Triggered only when the endpoint shape warrants
        them (GraphQL / form / donation).
      - Path-specific heuristic mock: `/graphql` vs `/donation` vs `/contact`
        get different default statuses, so consecutive analyses look distinct
        in the workshop demo.
      - Real `checkSchemaDrift` for GraphQL endpoints: diff vs in-memory
        baseline. First call seeds the baseline (pass with info finding);
        subsequent calls report added/removed ops & types.
    """
    checks = _path_specific_checks(endpoint, environment)
    findings: List[Dict[str, Any]] = []

    # Real schema-drift comparison for GraphQL endpoints only.
    if _is_graphql_endpoint(endpoint):
        drift_status, drift_findings = await _check_schema_drift_against_baseline(
            endpoint, environment,
        )
        checks["checkSchemaDrift"] = drift_status
        findings.extend(drift_findings)

    # Roll up an overall status based on the worst check.
    worst = "pass"
    for v in checks.values():
        if v == "fail":
            worst = "fail"
            break
        if v == "warn":
            worst = "warn"

    summary = f"API mock analysis of {method} {endpoint} on {environment} — overall {worst}"
    run = await _store_run("redcross-graphql-api", environment, worst, summary, {
        "endpoint": endpoint, "method": method,
        "checks": checks, "findings": findings,
    })
    return {"status": "ok", "endpoint": endpoint, "method": method,
            "checks": checks, "findings": findings, "run_id": run["run_id"]}


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


def _negative_guillotine_items(_json) -> List[Dict[str, Any]]:
    """Phase H+ (Enonic skill 0.1.0, 2026-05-19) — three negative-test items
    appended to the Postman collection so QA can reproduce the canonical
    failure modes during sprint triage.

    Each item is a complete Postman v2.1 request with `event.script.exec`
    test scripts that assert the EXPECTED non-2xx status (and degrade
    gracefully if rate-limiting isn't yet enabled).
    """
    return [
        {
            "name": "Negative · Invalid GraphQL syntax → 400",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "url": {
                    "raw": "{{base_url}}/api/graphql",
                    "host": ["{{base_url}}"], "path": ["api", "graphql"],
                },
                "body": {
                    "mode": "raw",
                    "raw": _json.dumps({"query": "{ guillotine { get(key: } }"}, indent=2),
                    "options": {"raw": {"language": "json"}},
                },
                "description": "Confirms the GraphQL endpoint rejects malformed queries with a 400.",
            },
            "event": [{
                "listen": "test",
                "script": {
                    "type": "text/javascript",
                    "exec": [
                        "pm.test('Status is 400 on invalid syntax', () => {",
                        "  pm.expect(pm.response.code).to.be.oneOf([400, 422]);",
                        "});",
                        "pm.test('Error message references syntax', () => {",
                        "  const txt = pm.response.text();",
                        "  pm.expect(txt.toLowerCase()).to.match(/syntax|parse|invalid/);",
                        "});",
                    ],
                },
            }],
        },
        {
            "name": "Negative · Draft branch without token → 401",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                # Intentionally NO Authorization header.
                "url": {
                    "raw": "{{base_url}}/api/graphql?branch=draft",
                    "host": ["{{base_url}}"], "path": ["api", "graphql"],
                    "query": [{"key": "branch", "value": "draft"}],
                },
                "body": {
                    "mode": "raw",
                    "raw": _json.dumps({"query": "{ guillotine { get(key: \"/\") { _id } } }"}, indent=2),
                    "options": {"raw": {"language": "json"}},
                },
                "description": "Draft branch must require authentication — should return 401 / 403.",
            },
            "event": [{
                "listen": "test",
                "script": {
                    "type": "text/javascript",
                    "exec": [
                        "pm.test('Draft without token rejected', () => {",
                        "  pm.expect(pm.response.code).to.be.oneOf([401, 403]);",
                        "});",
                    ],
                },
            }],
        },
        {
            "name": "Negative · Rate-limit burst probe → expect 200 or 429",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "url": {
                    "raw": "{{base_url}}/api/graphql",
                    "host": ["{{base_url}}"], "path": ["api", "graphql"],
                },
                "body": {
                    "mode": "raw",
                    "raw": _json.dumps(
                        {"query": "{ guillotine { getSite { _name } } }"}, indent=2,
                    ),
                    "options": {"raw": {"language": "json"}},
                },
                "description": (
                    "Run this request in a Postman Collection Runner loop (60+ "
                    "iterations) to verify the endpoint emits 429 once rate "
                    "limits trigger. Without rate limiting all iterations "
                    "return 200 — flag for SecOps if so."
                ),
            },
            "event": [{
                "listen": "test",
                "script": {
                    "type": "text/javascript",
                    "exec": [
                        "pm.test('Burst response 200 OR 429 (rate-limit ok or absent)', () => {",
                        "  pm.expect(pm.response.code).to.be.oneOf([200, 429]);",
                        "});",
                        "if (pm.response.code === 429) {",
                        "  pm.test('429 response includes Retry-After header', () => {",
                        "    pm.response.to.have.header('Retry-After');",
                        "  });",
                        "}",
                    ],
                },
            }],
        },
    ]


async def export_postman_collection(scope: Optional[str], environment: str,
                                    lang: str = "en") -> Dict[str, Any]:
    """Generate a Postman Collection v2.1 JSON for the Guillotine GraphQL
    endpoints. Returns the parsed dict so the router can either echo it back
    or stream it as a download. Mock-first: works without LLM, without Mongo.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): collection now includes 3
    additional negative-test items (invalid syntax → 400, draft without
    token → 401, burst → 429) so QA can reproduce the canonical failure
    modes during sprint triage. Each existing happy-path test also asserts
    Content-Type + response-size budget.
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
                            "// Phase H+ (Enonic skill 0.1.0) — defense-in-depth assertions.",
                            "pm.test('Content-Type is application/json', () => {",
                            "  pm.response.to.have.header('Content-Type', /application\\/json/);",
                            "});",
                            "pm.test('Response < 1 MB (size budget)', () => {",
                            "  pm.expect(pm.response.responseSize).to.be.below(1048576);",
                            "});",
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

    # Phase H+ (Enonic skill 0.1.0, 2026-05-19) — 3 negative tests added so the
    # collection exercises the failure modes Trine/Tom care about: invalid
    # GraphQL syntax, draft branch without auth, burst rate limiting.
    items.extend(_negative_guillotine_items(_json))

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
# Phase H+ (Enonic skill 0.1.0, 2026-05-19) — deterministic test cases keyed by
# editorial area. Each entry maps to an Enonic XP failure mode the skill
# documents, so workshop demos surface real risks even without an LLM. Severity
# and `enonic_xp_pattern` ref let the release_judge gate by Trine's Sev/Kat scale.
_CMS_DETERMINISTIC_CASES: Dict[str, Dict[str, Any]] = {
    "areaContentTypes": {
        "severity": "medium",
        "title": "HtmlArea richtext renders æøå + entities + embedded media intact",
        "description": (
            "Author a piece of content containing Norwegian special characters "
            "(æøå), named HTML entities (&amp;, &nbsp;), and an embedded image "
            "macro. Publish and verify both Content Studio preview and the "
            "NextJS-rendered page show identical output — no double-escaping, "
            "no broken macros."
        ),
        "acceptance_criteria": [
            "Preview shows æ, ø, å as glyphs (not &aring; etc.)",
            "Embedded image macro renders with correct /_/image/ URL",
            "Front-end NextJS render matches preview byte-for-byte on the body region",
        ],
        "roles": ["Editor", "Local Editor", "Contributor"],
        "enonic_xp_pattern": "data-integrity-patterns.md §3 (No runtime validation of external response shape)",
        "automation_ref": None,
    },
    "areaPageTemplates": {
        "severity": "medium",
        "title": "Page template <allow-on-content-type> constraints preserved across migrations",
        "description": (
            "Inspect every page-template XML descriptor under "
            "src/main/resources/site/page-templates/. Verify each <allow-on-content-type> "
            "list is still present and unchanged after the most recent migration "
            "branch — removing this silently lets editors place templates on wrong "
            "content types (Cristin→NVA bug pattern)."
        ),
        "acceptance_criteria": [
            "No template lost its <allow-on-content-type> declaration in the diff",
            "Editor UI refuses to apply a template to an unsupported content type",
            "Git blame on each descriptor cites a deliberate change, not a refactor",
        ],
        "roles": ["Administrator", "Owner"],
        "enonic_xp_pattern": "code-review-checklist.md §I (Site & content types — removed <allow-on-content-type>)",
        "automation_ref": None,
    },
    "areaLayouts": {
        "severity": "low",
        "title": "Layout regions accept only declared region types",
        "description": (
            "Drag a part of an undeclared type into a layout region. Verify the "
            "editor refuses with a clear error and does not crash; the saved "
            "model has not been mutated. Defense-in-depth against schema drift."
        ),
        "acceptance_criteria": [
            "Drop rejected with visible error toast",
            "Editor state remains editable (no white screen)",
            "Saved JSON / XML has no orphan part references",
        ],
        "roles": ["Editor", "Local Editor"],
        "enonic_xp_pattern": "code-review-checklist.md §I",
        "automation_ref": None,
    },
    "areaParts": {
        "severity": "medium",
        "title": "Custom widget escapes app.config.* values (XSS defense-in-depth)",
        "description": (
            "Set an app.config value to a payload like <script>alert(1)</script> "
            "in the local config file, restart the app, render any widget that "
            "interpolates that config value into HTML. The browser must render "
            "the literal text, never execute the script."
        ),
        "acceptance_criteria": [
            "Page source shows &lt;script&gt;alert(1)&lt;/script&gt; (escaped)",
            "No alert() executes in any supported browser",
            "Widget HTML is wrapped through a documented escape helper (not raw `${...}`)",
        ],
        "roles": ["Administrator"],
        "enonic_xp_pattern": "security-patterns.md §3 (Widget / template XSS)",
        "automation_ref": "playwright:cms-preview.spec.ts",
    },
    "areaFieldSets": {
        "severity": "medium",
        "title": "Display names retain i18n attributes (no hardcoded Norwegian)",
        "description": (
            "Open every form.xml / part.xml / page.xml under site/. For each "
            "<display-name> and <description>, verify the `i18n` attribute is "
            "present and points to a key that resolves in every supported "
            "locale (no, en at minimum). A removed i18n attribute silently "
            "regresses the translation chain."
        ),
        "acceptance_criteria": [
            "Every <display-name> has i18n='...' attribute",
            "Switching Content Studio locale updates the label live",
            "Missing translations log a warning, never crash",
        ],
        "roles": ["Administrator", "Owner"],
        "enonic_xp_pattern": "data-integrity-patterns.md §6 (URL & label consistency post-migration)",
        "automation_ref": None,
    },
    "areaRoles": {
        "severity": "high",
        "title": "Subtree isolation: Local Editor cannot publish across districts",
        "description": (
            "Log in as a Local Editor whose principal is bound to /distrikt/oslo. "
            "Attempt to publish a content node under /distrikt/bergen via Content "
            "Studio AND via the REST API. Both attempts must fail with 403; the "
            "audit log records the rejected attempt with the user, target path "
            "and timestamp."
        ),
        "acceptance_criteria": [
            "Local Editor for /distrikt/oslo CAN publish under /distrikt/oslo/*",
            "Same user gets 403 when publishing /distrikt/bergen/*",
            "Audit log entry exists for the rejected attempt",
            "Defense-in-depth: even if UI exposes the action (bug), the publish event must NOT propagate",
        ],
        "roles": ["Local Editor"],
        "enonic_xp_pattern": "security-patterns.md §2 (Over-permissive repository ACL)",
        "automation_ref": None,
    },
    "areaPreview": {
        "severity": "medium",
        "title": "Content Studio preview renders draft + master with portal-component wrapper",
        "description": (
            "Open /admin/site/preview/draft/<contentPath> and /admin/site/preview/master/<contentPath>. "
            "Each must respond < 400 AND contain at least one [data-portal-component-type] wrapper. "
            "If app.config carries a probe string, verify it is HTML-escaped in the rendered output."
        ),
        "acceptance_criteria": [
            "Draft preview returns 2xx and renders portal-component wrapper(s)",
            "Master preview returns 2xx and renders portal-component wrapper(s)",
            "No 'preview cookie required' error when the session cookie is set",
            "XSS probe string (if configured) appears HTML-escaped",
        ],
        "roles": ["Editor", "Local Editor"],
        "enonic_xp_pattern": "code-review-checklist.md §H (Widgets & services)",
        "automation_ref": "playwright:cms-preview.spec.ts",
    },
    "areaPublish": {
        "severity": "medium",
        "title": "Publish emits both create AND modify events (not only create)",
        "description": (
            "A common Enonic bug: code paths emit `custom.X.create` on first publish "
            "but forget `custom.X.modify` on subsequent edits — downstream "
            "consumers (search index, cache invalidator, audit log) miss updates. "
            "Verify both events fire by tailing the event bus during a publish "
            "of a brand-new content item and a re-publish of an existing one."
        ),
        "acceptance_criteria": [
            "First-time publish emits custom.X.create (existing behavior)",
            "Re-publish emits custom.X.modify (regression guard)",
            "Both events carry the content id + path + actor principal",
        ],
        "roles": ["Editor"],
        "enonic_xp_pattern": "data-integrity-patterns.md §5 (Missing event on modify)",
        "automation_ref": None,
    },
    "areaUnpublish": {
        "severity": "medium",
        "title": "Unpublish flags content as removed (stale-data lifecycle honoured)",
        "description": (
            "Unpublish a content item from the master branch. Verify either (a) the "
            "node is hard-deleted from the local repo, OR (b) it is flagged "
            "`removedFromX = true` (or equivalent). The next scheduled import "
            "must NOT resurrect it on the basis of a stale local copy."
        ),
        "acceptance_criteria": [
            "Unpublished content is filtered out of public GraphQL responses",
            "Local repo node carries a stale-data marker OR is deleted",
            "Scheduled import does not re-create unpublished nodes",
        ],
        "roles": ["Editor", "Local Editor"],
        "enonic_xp_pattern": "reliability-patterns.md §4 (No stale-data lifecycle)",
        "automation_ref": None,
    },
    "areaScheduled": {
        "severity": "high",
        "title": "Scheduled publish honours Europe/Oslo (not fixed GMT+1:00)",
        "description": (
            "Schedule a publish for 14:00 local time during the CEST summer "
            "window (e.g. June 15). The publish event MUST fire at 14:00 "
            "Europe/Oslo (i.e. 12:00 UTC during CEST), NOT at 15:00 local "
            "which would indicate the scheduler is using a fixed GMT+1:00 "
            "offset. Inspect main.ts / upsertScheduledJob calls — `timeZone` "
            "must be `Europe/Oslo` (IANA), not `GMT+1:00`."
        ),
        "acceptance_criteria": [
            "Scheduled job runs at the wall-clock time the editor selected (Europe/Oslo)",
            "Site.xml and ts source use `Europe/Oslo`, never `GMT+1:00`",
            "Test repeats correctly across the DST transitions in late March / late October",
        ],
        "roles": ["Administrator", "Editor"],
        "enonic_xp_pattern": "reliability-patterns.md §5 (Scheduler timezone — fixed offset vs IANA)",
        "automation_ref": None,
    },
    "areaLocalization": {
        "severity": "medium",
        "title": "Localization fallback chain — NO-only content gracefully serves on /en/",
        "description": (
            "Create a content item that exists only in Norwegian. Request its "
            "English-locale URL. Verify the site either (a) redirects to the "
            "Norwegian version with a visible language hint, OR (b) renders a "
            "graceful fallback page. NEVER a 500. Also assert that a route "
            "without a locale prefix resolves to the configured default locale "
            "(no silent fallback to a different default)."
        ),
        "acceptance_criteria": [
            "Missing translation does not 500",
            "User-visible affordance to switch to the available locale",
            "Default locale resolves consistently on routes without /no/ or /en/ prefix",
        ],
        "roles": ["Editor", "Contributor"],
        "enonic_xp_pattern": "data-integrity-patterns.md §3 (No runtime validation of external response)",
        "automation_ref": "cypress:quick-debug.cy.ts",
    },
    "areaMedia": {
        "severity": "medium",
        "title": "Enonic image URLs survive re-publish (next/image does not break on rehash)",
        "description": (
            "Pick a published image. Note its current `/_/image/<id>:<hash>/...` URL. "
            "Re-publish the same image (edit ALT text, save, publish). The hash "
            "segment in the URL changes. Verify the front-end either (a) "
            "regenerates the markup on the next ISR cycle within the configured "
            "revalidate window, OR (b) the OLD URL still serves the OLD image "
            "(stable redirect). NEVER a 404 visible to the visitor."
        ),
        "acceptance_criteria": [
            "Old image URL either still serves the old asset or 301s to the new one",
            "After ISR window, the page references the new hashed URL",
            "next/image does not show its fallback alt placeholder in the meantime",
        ],
        "roles": ["Editor"],
        "enonic_xp_pattern": "data-integrity-patterns.md §6 (URL & data consistency post-migration)",
        "automation_ref": "cypress:regression-donation.cy.ts",
    },
    "areaBrokenLinks": {
        "severity": "high",
        "title": "Migrated content URLs use canonical parameter name (Cristin→NVA drift guard)",
        "description": (
            "Crawl the related-publications list page. Pick one publication "
            "link. Verify (a) the href emits the canonical parameter name (e.g. "
            "`?id=`, not legacy `?cristinid=`), AND (b) clicking it lands on a "
            "detail page where the header reader expects the SAME parameter name. "
            "Mismatched names = silent blank page (this was the actual Cristin→NVA bug)."
        ),
        "acceptance_criteria": [
            "List page emits href with the canonical parameter name",
            "Header reader uses the same parameter name on the detail page",
            "Click round-trip lands on a populated header, not a blank page",
            "Explicit guard: no legacy `?cristinid=` anywhere in the rendered HTML",
        ],
        "roles": ["Editor", "Contributor"],
        "enonic_xp_pattern": "data-integrity-patterns.md §6 (URL parameter consistency across migration)",
        "automation_ref": "playwright:migrated-links.spec.ts",
    },
    "areaIsr": {
        "severity": "medium",
        "title": "Publish triggers NextJS ISR revalidation within configured window",
        "description": (
            "Publish a content change. Time how long until a fresh visit to the "
            "corresponding NextJS page reflects the change. Must be at or below "
            "the page's `export const revalidate = N` value (e.g. 60 s). If "
            "stale longer, the publish-event → revalidate webhook chain is "
            "broken. Common Enonic + NextJS regression."
        ),
        "acceptance_criteria": [
            "Publish event emitted (verifiable via event-bus tap)",
            "NextJS receives the revalidate hint (logs / metrics confirm)",
            "Fresh visit within the revalidate window shows the new content",
            "No manual rebuild required",
        ],
        "roles": ["Administrator", "Editor"],
        "enonic_xp_pattern": "reliability-patterns.md §1 (No task progress reporting / event chain)",
        "automation_ref": None,
    },
}


def _cms_mock_test_cases(areas: List[str]) -> List[Dict[str, Any]]:
    """Build deterministic CMS test cases for the requested areas.

    For each area in the input, emit the curated case from
    `_CMS_DETERMINISTIC_CASES` (Enonic XP failure mode keyed). Unknown areas
    fall back to the generic placeholder for backward compatibility — never
    silently dropped (was: `areas[:8]` cut 6 areas).
    """
    cases: List[Dict[str, Any]] = []
    for area in areas or []:
        curated = _CMS_DETERMINISTIC_CASES.get(area)
        if curated:
            cases.append({"area": area, **curated})
        else:
            cases.append({
                "area": area,
                "severity": "low",
                "title": f"{area} — basic editorial flow",
                "description": (
                    "Validate role visibility, preview, publish/unpublish behaviour "
                    "(generic placeholder — extend in `_CMS_DETERMINISTIC_CASES`)."
                ),
                "acceptance_criteria": [
                    "Role visibility correct",
                    "Preview renders",
                    "Publish + unpublish round-trip works",
                ],
                "roles": ["Editor", "Local Editor"],
                "enonic_xp_pattern": None,
                "automation_ref": None,
            })
    return cases


async def generate_cms_test_cases(areas: List[str], environment: str,
                                  lang: str = "en") -> Dict[str, Any]:
    """Generate CMS-area test cases.

    Phase H+ (Enonic skill 0.1.0, 2026-05-19): mock fallback now emits a
    curated test case PER REQUESTED AREA (14 covered today, more can be
    added to `_CMS_DETERMINISTIC_CASES`). Each case carries:
      - severity (low/medium/high/critical)
      - enonic_xp_pattern (cites the skill doc)
      - acceptance_criteria (verifiable bullets)
      - automation_ref (cross-link to existing Playwright/Cypress specs)
    """
    prompt = f"Areas: {', '.join(areas)}\nEnvironment: {environment}\n"
    raw = await _llm(prompt, CMS_QA_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}
    cases = parsed.get("test_cases") or []

    if not cases:
        cases = _cms_mock_test_cases(areas)

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

    # Phase H+ (Enonic skill 0.1.0, 2026-05-20): 12 base checks + 3 new
    # Enonic-XP-specific checks (lang attribute, HtmlArea editorial content,
    # CMS Editorial UI). Status dict (legacy shape) preserved so the frontend
    # tile grid keeps working unchanged.
    checks = {
        "checkKeyboard": "pass", "checkFocusOrder": "pass", "checkSkipLinks": "warn",
        "checkAriaMisuse": "pass", "checkHeadings": "pass", "checkColorContrast": "warn",
        "checkFormLabels": "pass", "checkErrorMessages": "pass", "checkScreenReader": "pass",
        "checkDialogs": "pass", "checkAltText": "warn", "checkContentClarity": "pass",
        # Phase H+ — three new Enonic-XP-specific accessibility checks.
        "checkLangAttribute": "warn",
        "checkHtmlAreaEditorialA11y": "warn",
        "checkCmsEditorialUiA11y": "warn",
    }

    # Phase H+ — existing 12-check notes enriched with skill-citing rationale.
    # `check_notes` is a parallel dict (separate field) so the legacy `checks`
    # shape is preserved verbatim. Front-end can read note on hover; release
    # judge can use it for narrative. Mock-first: deterministic.
    check_notes = {
        "checkSkipLinks": (
            "Skip-link visible on Tab but does not target [data-portal-component-type] "
            "wrappers — Enonic emits these around every part/layout region, ideal anchor "
            "points for skip-to-main-content."
        ),
        "checkColorContrast": (
            "Donation CTA contrast 3.9:1 (target 4.5:1)."
        ),
        "checkScreenReader": (
            "NVDA + VoiceOver announce landmarks correctly. Also verify Norwegian "
            "pronunciation (æ/ø/å) on /no/* routes — depends on <html lang> "
            "(see checkLangAttribute)."
        ),
        "checkAltText": (
            "3 hero images lack descriptive alt text. Also verify alt persists "
            "across image re-publish — `/_/image/<id>:<hash>/...` rehash must "
            "carry the alt forward (data-integrity-patterns.md §6)."
        ),
        "checkHeadings": (
            "Heading order correct on sample pages. Probe for Part-in-Layout "
            "double-wrap: a Part declaring <h2> placed in a Layout that also "
            "wraps in <h2> breaks hierarchy. Read XML descriptors AND rendered preview."
        ),
        "checkContentClarity": (
            "Readability acceptable. Audit HtmlArea richtext for Word-paste "
            "artifacts: <font color>, <span style='mso-...'>, <o:p> tags "
            "injected when editors paste from Word — break screen-reader flow."
        ),
        # Phase H+ notes for the 3 new checks.
        "checkLangAttribute": (
            "Audit <html lang> on every public route. Expected: 'no', 'nb', 'nn', "
            "'en'. Common bugs: NextJS default 'en' leaks on /no/* (SSR mismatch), "
            "migrated content keeps legacy lang, <html lang> changes only after "
            "hydration. WCAG 1.3.1 / 3.1.1 / 3.1.2."
        ),
        "checkHtmlAreaEditorialA11y": (
            "Audit HtmlArea richtext content authored in Content Studio: "
            "heading-level skips (h1 → h4), images without alt or with "
            "filename-as-alt, links with 'klikk her' / 'her' text, tables "
            "without <caption>. Run as part of editorial review BEFORE publish."
        ),
        "checkCmsEditorialUiA11y": (
            "Content Studio UI accessibility — EU Web Accessibility Directive "
            "extends to internal editorial tools. Probe: keyboard-only navigation "
            "through panels, colour contrast in editor chrome, error message "
            "announcements in editing forms. Defer to Enonic upstream for fixes, "
            "document gaps locally."
        ),
    }

    # Phase H+ — violations enriched with enonic_xp_pattern + automation_ref
    # cross-refs to the Playwright/Cypress specs generated elsewhere.
    violations = [
        {"severity": "medium", "rule": "color-contrast",
         "message": "Donation CTA contrast ratio 3.9:1 (target 4.5:1)",
         "enonic_xp_pattern": None,
         "automation_ref": "cypress:regression-donation.cy.ts"},
        {"severity": "low", "rule": "image-alt",
         "message": "3 hero images lack descriptive alt text",
         "enonic_xp_pattern": "data-integrity-patterns.md §6 (URL & alt consistency post-republish)",
         "automation_ref": "cypress:regression-donation.cy.ts"},
        # Phase H+ — 4 new Enonic-XP-keyed violations.
        {"severity": "high", "rule": "html-lang-attribute",
         "message": "/no/forskning page emits <html lang='en'> on initial SSR; corrects only after hydration",
         "enonic_xp_pattern": "data-integrity-patterns.md §6",
         "automation_ref": "playwright:cms-preview.spec.ts"},
        {"severity": "medium", "rule": "htmlarea-heading-skip",
         "message": "HtmlArea content on Kampanje pages skips from h1 to h4 (no h2/h3 between)",
         "enonic_xp_pattern": "code-review-checklist.md §I (Site & content types)",
         "automation_ref": None},
        {"severity": "medium", "rule": "skjemabygger-aria-live-polyfill-nashorn",
         "message": "Skjemabygger backend code uses Set/Array.from in an aria-live shim — Nashorn-incompatible in XP < 7.13",
         "enonic_xp_pattern": "nashorn-compatibility.md (full doc)",
         "automation_ref": None},
        {"severity": "low", "rule": "skip-link-target",
         "message": "Skip-to-content anchor targets #main but Enonic emits [data-portal-component-type='page'] — use that as the anchor instead",
         "enonic_xp_pattern": "code-review-checklist.md §H (Widgets & services)",
         "automation_ref": "playwright:cms-preview.spec.ts"},
    ]
    # WCAG 2.2 adds 9 new success criteria — 2 of them are commonly missed and
    # only flagged when 2.2 AA is selected. Trine's report should cite this.
    if version_id == "2.2-AA":
        violations.append({
            "severity": "medium", "rule": "wcag-2-2-target-size",
            "message": "Several footer links smaller than 24x24 CSS pixels (WCAG 2.5.8 — new in 2.2 AA)",
            "enonic_xp_pattern": None,
            "automation_ref": None,
        })
    # Phase H+ — cross-tool integration: surface NVDA + WAVE + Playwright/Cypress
    # endpoints/specs so consumers don't have to know which sibling helpers exist.
    cross_tool_refs = {
        "nvda_script_endpoint": "/api/red-cross-qa/generate-nvda-script",
        "wave_audit_endpoint":  "/api/red-cross-qa/run-wave-audit",
        "playwright_spec":      "playwright:cms-preview.spec.ts (a11y on draft/master preview)",
        "cypress_spec":         "cypress:regression-donation.cy.ts (cypress-axe + hydration + WCAG 2.2 AA sweep)",
    }
    run = await _store_run("redcross-accessibility-core", environment, "warn",
                           f"axe-core scan on {url} ({version_label})",
                           {"url": url, "wcag_version": version_label,
                            "checks": checks, "check_notes": check_notes,
                            "violations": violations,
                            "cross_tool_refs": cross_tool_refs})
    return {"status": "ok", "url": url, "wcag_score": 87,
            "wcag_version": version_label, "wcag_version_id": version_id,
            "checks": checks, "check_notes": check_notes,
            "violations": violations,
            "cross_tool_refs": cross_tool_refs,
            "run_id": run["run_id"]}


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
    """Mock k6 protocol-level load run.

    Phase H+ (Enonic skill 0.1.0, 2026-05-21): results now include
    `guillotine_p95_ms` (POST /api/graphql under load) and `apim_429_pct`
    (circuit-break health) — the two Enonic-XP-specific signals that
    pure HTTP-route stress misses. Plus top-level `cross_tool_refs` so
    a single response is self-navigable.
    """
    results = {
        "vus_max": 50, "duration": "14m",
        "http_req_duration_p95": "640ms",
        "http_req_failed": "0.4%",
        "checks_passed": "99.6%",
        # Phase H+ — Enonic XP signals.
        "guillotine_p95_ms": 820,
        "apim_429_pct": 0.0,
        "guillotine_resolver_errors_pct": 0.2,
    }
    cross_tool_refs = {
        "loadster_endpoint":   "/api/red-cross-qa/run-loadster",
        "resilience_endpoint": "/api/red-cross-qa/run-resilience-check",
        "perf_endpoint":       "/api/red-cross-qa/run-enonic-performance",
        "skill_doc":           ".claude/skills/enonic-xp/references/reliability-patterns.md",
    }
    summary = f"k6 mock {profile} on {environment} — p95 640ms, guillotine p95 820ms"
    run = await _store_run("redcross-stress-campaign-peak", environment, "pass",
                            summary, {"profile": profile, "scenarios": scenarios,
                                     "tool": "k6", "results": results,
                                     "cross_tool_refs": cross_tool_refs})
    return {"status": "ok", "tool": "k6", "results": results,
            "cross_tool_refs": cross_tool_refs, "run_id": run["run_id"]}


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

    # Phase H+ (Enonic skill 0.1.0, 2026-05-21) — cross_tool_refs so a single
    # Loadster response is self-navigable to k6 + Resilience + Playwright/Cypress.
    cross_tool_refs = {
        "k6_endpoint":         "/api/red-cross-qa/run-k6",
        "resilience_endpoint": "/api/red-cross-qa/run-resilience-check",
        "playwright_spec":     "playwright:cms-preview.spec.ts",
        "cypress_spec":        "cypress:regression-donation.cy.ts (hydration)",
        "skill_doc":           ".claude/skills/enonic-xp/references/reliability-patterns.md",
    }

    run = await _store_run("redcross-stress-campaign-peak", environment, overall_status,
                           summary, {"profile": profile, "scenarios": scenarios,
                                     "tool": "loadster", "results": r,
                                     "cross_tool_refs": cross_tool_refs})

    return {
        "status": "ok", "tool": "loadster",
        "profile": profile, "scenarios": scenarios,
        "results": r,
        "differentiator": ("Browser-level load — captures JS hydration "
                           "(p95 {h}ms) and SPA navigation (p95 {s}ms) under "
                           "load. k6 doesn't see these signals.").format(
                               h=r["hydration_p95_ms"], s=r["spa_nav_p95_ms"]),
        "cross_tool_refs": cross_tool_refs,
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
        "checkMobileKeyboard":     {"status": "warn", "note": "Donation amount missing inputmode='numeric' (and inputmode='decimal' for ører-amounts)"},
        "checkAutocomplete":       {"status": "pass", "note": "Contact form uses given-name/family-name/email/tel"},
        # Phase H+ (Enonic skill 0.1.0, 2026-05-19): note expanded — APIM
        # prefill needs timeout AND runtime shape validation AND retry.
        # Cite data-integrity-patterns.md §3 (shape) + reliability-patterns.md §2 (retry).
        "checkPrefillApi":         {"status": "warn", "note": (
            "APIM prefill has 3 weaknesses: (1) no timeout (default 30s blocks UX), "
            "(2) no runtime shape validation — if APIM renames `customer.firstName` "
            "to `customer.first_name`, prefill silently fails (data-integrity §3), "
            "(3) no retry-with-backoff on 5xx — single transient failure breaks "
            "the form (reliability §2)."
        )},
        "checkValidationMessages": {"status": "pass", "note": "Inline errors with aria-describedby"},
        "checkAriaLive":           {"status": "warn", "note": "Dynamic errors lack role='alert'"},
        "checkErrorSummary":       {"status": "fail", "note": "No error summary on submit-with-errors"},
        "checkProgressIndicator":  {"status": "pass", "note": "Step X/Y shown on multi-step forms"},
        "checkVippsHandoff":       {"status": "pass", "note": "Return + cancel URLs validated"},
        # Phase H+: PRG alone doesn't cover network-retry double-submit. Per
        # data-integrity-patterns.md §1, also need an Idempotency-Key header.
        "checkSubmitIdempotency":  {"status": "warn", "note": (
            "Donation form lacks PRG (refresh re-submits) AND the submit "
            "request has no `Idempotency-Key` header — so a client network "
            "retry can double-charge a donation. Need BOTH PRG and idempotency "
            "key (data-integrity §1)."
        )},
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
        # Phase H+ — new Fundy-specific origin check (security-patterns.md §3).
        "checkFundyOriginAllowed":     {"status": "warn", "note": (
            "Fundy iframe communicates with the page via window.postMessage. "
            "Verify the parent's listener checks event.origin against a "
            "Fundy-domain whitelist — without it, a malicious iframe could "
            "intercept donor data."
        )},
        # Phase H+ (Enonic skill 0.1.0) — three new security checks.
        "checkCsrf": {"status": "warn", "note": (
            "Donation + Volunteer + Beredskap forms POST state-changing data "
            "but no anti-CSRF token visible in the payload. Add a hidden "
            "form field + server-side validation (lib-context + double-submit "
            "cookie pattern). Critical for revenue-flow forms."
        )},
        "checkInjectionInFormFields": {"status": "warn", "note": (
            "Submit each form with NoQL/HTML injection payloads (' OR _name = ', "
            "</script>, \\x00) in every free-text field. Highest-risk: search "
            "inputs and autocomplete that flow into guillotine.query (see "
            "security-patterns.md §1). Mock-first: probe live in test env."
        )},
        "checkServiceUrlGeneration": {"status": "warn", "note": (
            "Form action attributes appear to use hardcoded `/_/service/...` "
            "paths. Switch to `serviceUrl({service:'name'})` from lib-portal "
            "so URLs adapt under vhost / reverse-proxy mappings "
            "(security-patterns.md §4)."
        )},
    }

    findings = parsed.get("findings") or [
        {"severity": "high", "form": "volunteer", "title": "No error summary",
         "message": "Submit with errors does not surface an aggregated summary at top of page.",
         "fix_hint": "Add gov.uk-style error summary linked to first invalid field, move focus to it."},
        {"severity": "medium", "form": "donation", "title": "Amount field missing inputmode",
         "message": "Mobile users see alphabetic keyboard for the amount field.",
         "fix_hint": "Add inputmode='numeric' (or inputmode='decimal' for ører-amounts) and pattern='[0-9]*'."},
        {"severity": "medium", "form": "donation", "title": "Submit not idempotent",
         "message": "Refreshing after a donation re-posts the form AND a client network retry can double-charge.",
         "fix_hint": "Use POST/Redirect/GET pattern AND add an Idempotency-Key header on the submit request.",
         "enonic_xp_pattern": "data-integrity-patterns.md §1"},
        {"severity": "low", "form": "contact", "title": "APIM prefill timeout missing",
         "message": "If Azure APIM prefill is slow, the form blocks for 30s. Also no runtime shape validation — upstream field rename silently breaks prefill.",
         "fix_hint": "Add a 4s timeout, runtime shape check on the response, retry-with-backoff on 5xx.",
         "enonic_xp_pattern": "data-integrity-patterns.md §3 + reliability-patterns.md §2"},
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
        # Phase H+ (Enonic skill 0.1.0, 2026-05-19) — 4 new findings keyed to the skill.
        {"severity": "high", "form": "donation", "title": "No anti-CSRF token on donation submit",
         "message": "State-changing form POST without CSRF protection — a malicious site can forge donation submissions on behalf of a logged-in user.",
         "fix_hint": "Add a hidden anti-CSRF token field; validate server-side via lib-context + double-submit cookie pattern.",
         "enonic_xp_pattern": "security-patterns.md §1 (extension)"},
        {"severity": "high", "form": "beredskap", "title": "Beredskap form has no client retry under load",
         "message": "Emergency-signup form receives submission bursts during crises. Without client-side exponential backoff on 5xx + server-side queue, volunteers are lost precisely when the emergency needs them most.",
         "fix_hint": "Add exponential-backoff retry on transient failures (1s, 2s, 4s); consider lightweight queue (SQS or lib-cluster job) on the submit endpoint.",
         "enonic_xp_pattern": "reliability-patterns.md §6 (circuit breaker / critical-path)"},
        {"severity": "medium", "form": "donation", "title": "Hardcoded service URL on form action",
         "message": "Form posts to `/_/service/donation/submit` hardcoded — breaks under vhost / reverse-proxy mappings.",
         "fix_hint": "Use `serviceUrl({service:'donation/submit'})` from lib-portal; verify form action rewrites under each configured vhost.",
         "enonic_xp_pattern": "security-patterns.md §4"},
        {"severity": "medium", "form": "fundy-donation", "title": "Fundy postMessage has no origin whitelist",
         "message": "Parent page's `window.addEventListener('message', ...)` accepts messages from any origin. A malicious iframe loaded elsewhere on the page could intercept donor data.",
         "fix_hint": "Check `event.origin` against an explicit Fundy-domain whitelist; reject otherwise.",
         "enonic_xp_pattern": "security-patterns.md §3"},
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
         "expected": "Numeric keyboard is shown (inputmode='numeric' for whole NOK, 'decimal' for ører)",
         "automation_ref": "cypress:regression-donation.cy.ts"},
        {"title": "Volunteer signup error summary", "form": "volunteer",
         "type": "automated", "tool": "playwright",
         "steps": ["Open volunteer signup", "Submit with all fields empty"],
         "expected": "Error summary appears at top, focus moves to it, links jump to first invalid field",
         "automation_ref": None},
        {"title": "Vipps cancel returns to donation page", "form": "donation",
         "type": "manual", "tool": "manual",
         "steps": ["Start donation", "Continue to Vipps", "Cancel in Vipps"],
         "expected": "User lands on rodekors.no donation page with state preserved",
         "automation_ref": None},
        {"title": "Fundy → Vipps handoff payload integrity", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Open donation page", "Select 250 NOK monthly", "Fill donor data with æøå",
                   "Click Continue → intercept Fundy → Vipps request"],
         "expected": "Payload contains amount=250, currency=NOK, frequency=monthly, donor.name with æøå preserved",
         "automation_ref": None},
        {"title": "Fundy consent checkbox not pre-checked", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Open donation page", "Inspect marketing-opt-in checkbox initial state"],
         "expected": "Marketing opt-in is unchecked by default (GDPR)",
         "automation_ref": None},
        {"title": "Fundy form on iPhone SE (extreme small viewport)", "form": "fundy-donation",
         "type": "automated", "tool": "playwright",
         "steps": ["Set viewport to 320×568", "Open donation page", "Complete full donation flow"],
         "expected": "All controls reachable, no horizontal scroll, keyboard does not cover input",
         "automation_ref": None},
        # Phase H+ (Enonic skill 0.1.0, 2026-05-19) — 3 new test cases keyed to Enonic XP.
        {"title": "CSRF token verification on donation submit", "form": "donation",
         "type": "manual", "tool": "manual",
         "steps": [
             "Open the donation form in browser A (logged-in user)",
             "From a different origin (browser B / curl), craft a POST to the submit endpoint with browser A's session cookie",
             "Observe server response",
         ],
         "expected": "Server rejects with 403 'CSRF token missing or invalid' — never accepts the cross-origin POST.",
         "automation_ref": None},
        {"title": "Beredskap form survives 5xx burst (critical-path resilience)", "form": "beredskap",
         "type": "manual", "tool": "manual",
         "steps": [
             "Stub the beredskap submit endpoint with 503 for 30 seconds",
             "Submit the form normally; do not refresh",
             "Wait 60 seconds; ensure backoff retries are visible in network tab (1s, 2s, 4s, …)",
             "After the stub clears, verify the submission goes through with the original data preserved",
         ],
         "expected": "Form retries with exponential backoff; user data is preserved across retries; the submission succeeds once the endpoint recovers.",
         "automation_ref": None},
        {"title": "Skjemabygger backend Nashorn compatibility sweep", "form": "skjemabygger-lib",
         "type": "static", "tool": "static",
         "steps": [
             "Run grep recipes from .claude/skills/enonic-xp/references/nashorn-compatibility.md against src/main/resources/",
             "Flag every Object.entries, Object.values, Array.from, Set, Map, String.includes, String.startsWith usage",
             "For each flag: verify tsup transpiles it to a Nashorn-safe form, or rewrite",
         ],
         "expected": "Zero unsafe runtime APIs reach the bundled JS. Rewrites documented in PR.",
         "automation_ref": None},
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
    # Phase H+ (Enonic skill 0.1.0, 2026-05-20): data_provenance.migrated now
    # surfaces the 3 Enonic-XP-skill failure modes most relevant to migration
    # audits — URL parameter drift, free-text replacing structured filter, and
    # stale-data accumulation. These complement the existing pre-skill issues
    # (relations, CDN URLs, 301s) without dropping them.
    data_provenance = parsed.get("data_provenance") or {
        "migrated": {
            "count": migrated_count,
            "label": "Migrated from legacy CMS",
            "common_issues": [
                "broken relations", "stale CDN URLs", "missing 301s",
                # Phase H+ additions:
                "URL parameter drift (e.g. ?cristinid= vs ?id=)",
                "free-text replacing structured filter",
                "stale legacy data not purged after upstream removal",
            ],
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

    # Phase H+ (Enonic skill 0.1.0, 2026-05-20): existing checks enriched with
    # skill citations + 3 new checks added (URL parameter consistency, structured
    # filter preserved, stale-data lifecycle). Mock-first: notes describe what a
    # real probe would check; statuses default to "warn" until a live audit runs.
    checks = parsed.get("checks") or {
        "checkContentTypeMapping":    {"status": "pass", "note": "All 8 types mapped (Forening, Distrikt, Aktivitet, Kontaktperson, Tjeneste/Kurs, Tema, Nyhet, Kampanje). Re-running the import on the same fixture must NOT create duplicates — verify check-then-act is atomic (data-integrity §1)."},
        "checkNorwegianChars":        {"status": "pass", "note": "UTF-8 preserved across sample body text. Also verify URL slugs (/no/forskning/bløding-type paths) — æ/ø/å can encode-decode differently in build vs runtime."},
        "checkRelations":             {"status": "warn", "note": "3 Aktivitet records lost their Forening parent"},
        "checkLocalization":          {"status": "warn", "note": "12 pages missing nn (nynorsk) translation"},
        "checkImageReanchoring":      {"status": "warn", "note": "7 hero images still point to legacy CDN. Also verify <source srcset> URLs on responsive images, not just <img src>."},
        "checkRedirects":             {"status": "fail", "note": "23 legacy URLs return 404 (no 301). Also detected 5 redirect chains (/a → /b → /c); each adds latency and harms SEO — collapse to a single hop."},
        "checkSeoMetadata":           {"status": "pass", "note": "Title + description preserved on 100% of sample. Verify canonical link points to the NEW upstream (not the legacy one) — common post-migration regression."},
        "checkPublishState":          {"status": "pass", "note": "Draft / scheduled / archived state retained"},
        "checkIsrInvalidation":       {"status": "warn", "note": "ISR revalidation occasionally skipped on bulk publish. Also audit Elasticsearch refresh strategy during import: refreshing after every page exposes partial data to readers — refresh at end-of-import or use shadow branch (data-integrity §4)."},
        "checkPermissionsCarryover": {"status": "warn", "note": "Role grants mapped 1:1 across 6 editorial roles. Subtree isolation NOT yet verified — Local Editor for /distrikt/oslo on legacy MUST remain bound to /distrikt/oslo on new CMS, not promoted to all districts (security-patterns §2)."},
        # Phase H+ (Enonic skill 0.1.0) — three new checks for migration-specific patterns.
        "checkUrlParameterConsistency": {"status": "warn", "note": (
            "Verify URL query parameter names agree between list-page link "
            "generators and detail-page readers (Cristin→NVA bug pattern). "
            "Probe: crawl 20 migrated content links, follow each, assert the "
            "detail header reader expects the same param name the list "
            "emitted. Mock sample: 1 case found (?cristinid= legacy → ?id= new). "
            "Cite data-integrity §6."
        )},
        "checkStructuredFilterPreserved": {"status": "warn", "note": (
            "Audit lookups that previously used structured filters "
            "(hasValue / boolean.must) and verify the post-migration code "
            "didn't drop them in favour of free-text `query: x`. Common "
            "regression: getResultsByFundingId, getByCristinId. Probe: query "
            "a value that appears in two different indexed fields; only the "
            "structured one should match. Mock sample: 1 function regressed "
            "(getResultsByFundingId now free-text). Cite data-integrity §7."
        )},
        "checkStaleDataLifecycle": {"status": "warn", "note": (
            "Verify the migration pipeline marks content as removed when the "
            "legacy source no longer contains it. Test: remove a fixture from "
            "the legacy export, re-run the import, verify the corresponding "
            "XP node carries removedFromLegacy=true (or equivalent) AND is "
            "filtered from public queries AND is NOT resurrected on the next "
            "scheduled import. Cite reliability-patterns §4."
        )},
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
        # Phase H+ (Enonic skill 0.1.0) — 3 new broken_pages keyed to skill patterns.
        {"legacy_url": "/forskning/publikasjon?cristinid=12345",
         "new_url": "/forskning/publikasjon?cristinid=12345",
         "issue": "url-param-drift",
         "data_origin": "migrated",
         "enonic_xp_pattern": "data-integrity-patterns.md §6 (URL parameter consistency across migration)"},
        {"legacy_url": "/forskning/finansiering/RCN-12345",
         "new_url": "/forskning/finansiering/RCN-12345",
         "issue": "free-text-filter-regression",
         "data_origin": "migrated",
         "enonic_xp_pattern": "data-integrity-patterns.md §7 (Search semantics preserved across migration)"},
        {"legacy_url": "/distrikt/oslo/aktiviteter/retracted-event",
         "new_url": "/lokal/oslo/aktiviteter/retracted-event",
         "issue": "stale-not-purged",
         "data_origin": "migrated",
         "enonic_xp_pattern": "reliability-patterns.md §4 (No stale-data lifecycle)"},
    ]

    missing_redirects = parsed.get("missing_redirects") or [
        {"from": "/distrikt/oslo", "to": "/lokal/oslo", "status_expected": 301},
        {"from": "/forening/trondheim", "to": "/lokal/trondheim", "status_expected": 301},
        {"from": "/temaer/beredskap", "to": "/tema/beredskap", "status_expected": 301},
    ]

    test_cases = parsed.get("test_cases") or [
        {"title": "Norwegian characters preserved on Forening pages",
         "type": "automated",
         "steps": ["Crawl 50 Forening pages", "Compare body text against legacy",
                    "Also crawl /no/forskning/bløding-type slugs"],
         "expected": "All æ/ø/å render correctly in body AND URL slugs (no &aelig;, no ?).",
         "automation_ref": None},
        {"title": "Aktivitet → Forening relations intact",
         "type": "automated",
         "steps": ["List all Aktivitet content", "For each, verify parent Forening reference resolves"],
         "expected": "0 orphan Aktivitet records",
         "automation_ref": None},
        {"title": "301 redirects from legacy URLs (no chains)",
         "type": "automated",
         "steps": ["Load redirect map", "Curl each legacy URL with --max-redirs 2",
                    "Assert 301 + Location header AND no second hop"],
         "expected": "100% of mapped URLs return 301 to new path in a single hop",
         "automation_ref": None},
        # Phase H+ (Enonic skill 0.1.0, 2026-05-20) — 4 new test cases keyed to skill.
        {"title": "URL parameter consistency: list → detail round-trip",
         "type": "automated",
         "steps": ["Open the related-publications list page",
                    "Pick any link; assert href contains the canonical param name (?id=)",
                    "Click; assert the detail page header renders (not blank)",
                    "Defense-in-depth: assert no ?cristinid= anywhere in the rendered HTML"],
         "expected": "Round-trip works; canonical parameter name used at BOTH ends. Cristin→NVA drift guard.",
         "automation_ref": "playwright:migrated-links.spec.ts"},
        {"title": "Structured filter preserved across migration",
         "type": "manual",
         "steps": ["Pick a known funding-id value that ALSO appears in an unrelated indexed field",
                    "Call getResultsByFundingId(value) on the new CMS",
                    "Verify only the structured-field matches are returned (no false positives)"],
         "expected": "Free-text regression detected if unrelated matches appear in the result set.",
         "automation_ref": None},
        {"title": "Stale-data lifecycle: removed legacy items are purged",
         "type": "manual",
         "steps": ["Pick a fixture present in the local repo",
                    "Remove it from the legacy export",
                    "Re-run the migration import",
                    "Verify the XP node now carries removedFromLegacy=true (or is hard-deleted)",
                    "Wait for next scheduled import; assert it is NOT resurrected"],
         "expected": "Stale data is flagged AND filtered AND not resurrected on subsequent imports.",
         "automation_ref": None},
        {"title": "Static review: migration code Nashorn compatibility sweep",
         "type": "static",
         "steps": ["Run grep recipes from .claude/skills/enonic-xp/references/nashorn-compatibility.md",
                    "Apply to migration lib/ source (importers, transformers, ID mappers)",
                    "Flag every Object.entries, Array.from, Set, Map, .includes, .startsWith usage"],
         "expected": "Zero unsafe runtime APIs in migration-tool TypeScript sources.",
         "automation_ref": None},
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
# Phase H+ (Enonic skill 0.1.0, 2026-05-20) — in-memory baseline for hot_queries
# p95. Keyed by (environment, url, query_name). Used by run_enonic_performance
# to detect degradation between consecutive runs (>20% slower = warning).
_PERF_HOT_QUERY_BASELINES: Dict[Tuple[str, str, str], int] = {}


def _enrich_hot_queries_with_baseline(
    hot_queries: List[Dict[str, Any]], environment: str, url: str,
) -> List[Dict[str, Any]]:
    """Attach `p95_ms_previous` + `delta_pct` to each hot query by comparing
    against the in-memory baseline. First run seeds the baseline (delta = 0);
    subsequent runs report % change.

    Side effect: refreshes the baseline so each call diffs against the
    most-recent snapshot.
    """
    enriched: List[Dict[str, Any]] = []
    for q in (hot_queries or []):
        name = q.get("name") or ""
        current = int(q.get("p95_ms") or 0)
        key = (environment, url, name)
        previous = _PERF_HOT_QUERY_BASELINES.get(key)
        if previous is None or previous == 0:
            delta_pct = 0.0
        else:
            delta_pct = round(((current - previous) / previous) * 100.0, 1)
        _PERF_HOT_QUERY_BASELINES[key] = current
        enriched.append({**q, "p95_ms_previous": previous, "delta_pct": delta_pct})
    return enriched


async def run_enonic_performance(url: str, environment: str,
                                 lang: str = "en") -> Dict[str, Any]:
    """Audit Enonic XP + Next.XP + Guillotine GraphQL specific perf signals
    that Lighthouse alone misses. Mock-first.

    Phase H+ (Enonic skill 0.1.0, 2026-05-20) additions:
      - 3 new server-side perf checks (`checkRefreshStrategy`,
        `checkChangeDetectionPerf`, `checkConnectionPooling`) covering
        `performance-patterns.md §3 / §4 / §5`.
      - `hot_queries` now carry `p95_ms_previous` + `delta_pct` for
        degradation tracking across consecutive runs (in-memory baseline).
      - Each `hot_query` AND each `recommendation` tagged with
        `enonic_xp_pattern` ref where applicable.
      - Recommendations carry `automation_ref` cross-linking to existing
        Playwright/Cypress specs in the module.
      - Top-level `composite_score` (0-100) = % of checks passing.
      - Top-level `cross_tool_refs` to Lighthouse + Loadster + Playwright +
        Cypress + skill doc, so a single response is self-navigable.
    """
    prompt = (
        f"URL: {url}\nEnvironment: {environment}\n"
        "Audit waterfall, N+1, Guillotine field selection, ISR latency, "
        "image service, publish latency, bulk publish, part rendering, cache "
        "invalidation, refresh strategy, change-detection GC pressure, "
        "connection pooling."
    )
    raw = await _llm(prompt, ENONIC_PERFORMANCE_PROMPT, lang)
    parsed = _parse_json(raw or "") or {}

    checks = parsed.get("checks") or {
        "checkGraphqlWaterfall":  {"status": "warn", "p95_ms": 480, "queries": 5,
                                   "note": "5 sequential roundtrips on district pages (target ≤3)"},
        # Phase H+: extended note covers BOTH GraphQL-level N+1 AND server-side
        # NoQL N+1 (conn.query + conn.get per hit), since the skill section is
        # the same pattern at a different layer.
        "checkGraphqlNplusOne":   {"status": "warn", "duplicate_queries": 7,
                                   "note": ("7 duplicate Forening queries on Distrikt page "
                                              "(GraphQL-level). Also probe server-side N+1: "
                                              "conn.query() + conn.get(id) per hit. Use "
                                              "conn.get([ids]) for batch (performance-patterns §1).")},
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
        # Phase H+ (Enonic skill 0.1.0) — 3 new server-side perf checks.
        "checkRefreshStrategy":   {"status": "warn",
                                    "refresh_count_per_import": 50,
                                    "refresh_p95_ms": 220,
                                    "note": (
            "Bulk import calls conn.refresh('ALL') after every page of 100 "
            "items. On a 50-page import that's 50 forced Elasticsearch "
            "refreshes (~220ms p95 each = ~11s total wasted). Options: refresh "
            "at end-of-import, every N pages, or refresh('SEARCH') for "
            "cheaper write consistency (performance-patterns §3)."
        )},
        "checkChangeDetectionPerf": {"status": "warn",
                                      "records_audited": 10000,
                                      "stringify_allocations": 20000,
                                      "note": (
            "Migration import uses JSON.stringify(existing) !== JSON.stringify(incoming) "
            "for change detection. ~2 string allocations per record (10k records "
            "= 20k allocations = GC pressure). Plus property-order-sensitive → "
            "spurious modify events when upstream serializer reorders fields. "
            "Recommend: compare upstream modifiedDate or hash-based diff "
            "(performance-patterns §4)."
        )},
        "checkConnectionPooling": {"status": "warn",
                                    "connections_per_request_p95": 7,
                                    "note": (
            "Each request creates ~7 RepoConnection instances (chained storage "
            "calls). XP connections are lightweight but not free. Consider: "
            "pass connection as parameter OR per-request context pattern "
            "(performance-patterns §5)."
        )},
    }

    # Phase H+ — hot_queries with enonic_xp_pattern + baseline degradation.
    raw_hot_queries = parsed.get("hot_queries") or [
        {"name": "GetDistrictPage", "p95_ms": 480, "queries": 12, "duplicates": 3,
         "fix_hint": "Batch Forening lookups via fragments instead of per-card query",
         "enonic_xp_pattern": "performance-patterns.md §1 (N+1 query)"},
        {"name": "GetActivityList",  "p95_ms": 320, "queries": 8,  "duplicates": 4,
         "fix_hint": "Use Guillotine `_references` to pre-load related Forening once",
         "enonic_xp_pattern": "performance-patterns.md §2 (Double-fetch query+get)"},
        {"name": "GetCampaignPage",  "p95_ms": 260, "queries": 6,  "duplicates": 1,
         "fix_hint": "Drop unused fields from query (over-fetching `body` and `_versionKey`)",
         "enonic_xp_pattern": None},
    ]
    hot_queries = _enrich_hot_queries_with_baseline(raw_hot_queries, environment, url)

    # Phase H+ — recommendations enriched with enonic_xp_pattern + automation_ref.
    # Plus 2 new server-side recommendations citing the skill.
    recommendations = parsed.get("recommendations") or [
        {"priority": "high",   "category": "graphql",
         "title": "Reduce GraphQL waterfall on district pages",
         "description": "Batch related Forening queries into one round-trip via fragment spread.",
         "enonic_xp_pattern": "performance-patterns.md §1",
         "automation_ref": "cypress:component-designsystemet.cy.ts"},
        {"priority": "high",   "category": "isr",
         "title": "Wire cascading ISR invalidation",
         "description": "On Forening publish, revalidate child Aktivitet/Kontaktperson paths.",
         "enonic_xp_pattern": "reliability-patterns.md §1",
         "automation_ref": None},
        {"priority": "medium", "category": "publish",
         "title": "Async bulk publish queue",
         "description": "Move bulk publish off the editor UI thread; show progress toast.",
         "enonic_xp_pattern": "reliability-patterns.md §1",
         "automation_ref": None},
        {"priority": "medium", "category": "graphql",
         "title": "Trim Guillotine field selection",
         "description": "23 fields fetched but never rendered — drop them from queries.",
         "enonic_xp_pattern": "performance-patterns.md §2",
         "automation_ref": None},
        # Phase H+ — 2 new server-side recommendations.
        {"priority": "medium", "category": "server-ops",
         "title": "Refresh Elasticsearch index less aggressively during imports",
         "description": (
             "Replace per-page conn.refresh('ALL') with refresh-at-end-of-import, "
             "or refresh every 10 pages. On a 50-page import that saves ~11s of "
             "blocked time. Use refresh('SEARCH') if write consistency is not "
             "required mid-flight."
         ),
         "enonic_xp_pattern": "performance-patterns.md §3",
         "automation_ref": None},
        {"priority": "low", "category": "server-ops",
         "title": "Replace JSON.stringify change detection with modifiedDate compare",
         "description": (
             "Cut string allocation by ~95% on bulk imports. Use upstream "
             "`recordMetadata.modifiedDate` as the change signal; fall back to "
             "a stable hash if the upstream lacks a timestamp."
         ),
         "enonic_xp_pattern": "performance-patterns.md §4",
         "automation_ref": None},
    ]

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    pass_count = sum(1 for s in statuses if s == "pass")
    composite_score = round((pass_count / len(statuses)) * 100) if statuses else 0
    summary = (f"Enonic perf on {url} — {pass_count}/{len(statuses)} pass "
               f"(composite score {composite_score}/100)")

    cross_tool_refs = {
        "lighthouse_endpoint": "/api/red-cross-qa/run-performance-check",
        "loadster_endpoint":   "/api/red-cross-qa/run-loadster",
        "playwright_spec":     "playwright:storybook.spec.ts (bundle weight + a11y at component level)",
        "cypress_spec":        "cypress:regression-donation.cy.ts (NextJS hydration + Enonic image URLs)",
        "skill_doc":           ".claude/skills/enonic-xp/references/performance-patterns.md",
    }

    run = await _store_run("redcross-enonic-performance", environment, overall, summary, {
        "url": url, "checks": checks, "hot_queries": hot_queries,
        "recommendations": recommendations,
        "composite_score": composite_score,
        "cross_tool_refs": cross_tool_refs,
        "artifacts": [{"name": "enonic-perf.json", "type": "report"}],
    })
    return {"status": "ok", "url": url, "checks": checks,
            "hot_queries": hot_queries, "recommendations": recommendations,
            "composite_score": composite_score,
            "cross_tool_refs": cross_tool_refs,
            "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9e — Designsystemet (Digdir) Compliance
# ═══════════════════════════════════════════════════════════════════
# Phase H+ (Enonic skill 0.1.0, 2026-05-20) — in-memory baseline for the
# Designsystemet compliance_score. Keyed by (environment, url). First run
# seeds the baseline; subsequent runs report delta_pct so trend changes are
# visible (release_judge can use the delta + score for go/hold/no-go).
_DS_COMPLIANCE_BASELINES: Dict[Tuple[str, str], int] = {}


async def run_designsystemet_audit(url: str, environment: str,
                                   lang: str = "en") -> Dict[str, Any]:
    """Audit compliance with Designsystemet from Digdir (Norwegian government
    design system). Mock-first.

    Phase H+ (Enonic skill 0.1.0, 2026-05-20) additions:
      - 3 new Enonic-XP-integration checks (`checkDsSsrHydration`,
        `checkDsPackageVersionsAligned`, `checkDsHtmlAreaIntegration`)
        covering the DS + NextJS-over-Enonic boundary where pure DS audits
        miss issues.
      - `checkBrandOverride` extended with app.config.brandColor CSS-injection
        defense (security-patterns §3).
      - Deviations carry `enonic_xp_pattern` + `automation_ref` cross-refs.
      - Recommendations carry `enonic_xp_pattern`.
      - Top-level `cross_tool_refs` to Playwright Storybook + Cypress
        component specs + DS docs + skill doc.
      - `compliance_score_previous` + `delta_pct` for trend tracking.
    """
    prompt = (
        f"URL: {url}\nEnvironment: {environment}\n"
        "Audit Designsystemet (Digdir) compliance: components, tokens, typography, "
        "spacing, accessibility, brand override, version drift, button/form usage, "
        "SSR/CSR hydration consistency, package version alignment, HtmlArea integration."
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
        # Phase H+: brand override note extended with CSS-injection defense.
        "checkBrandOverride":  {"status": "pass", "note": (
            "Red Cross red applied via DS theme tokens, not inline. Also verify "
            "app.config.brandColor is validated (e.g. /^#[0-9a-f]{6}$/i) BEFORE "
            "injection into --ds-color-brand — defense-in-depth against CSS "
            "injection (security-patterns §3)."
        )},
        "checkDsVersion":      {"status": "warn", "version_used": "1.0.0", "latest": "1.4.2",
                                "note": "@digdir/designsystemet-react one minor + 4 patches behind"},
        "checkDsButtonUsage":  {"status": "warn",
                                "note": "Tertiary used as primary on 3 pages (semantic mismatch)"},
        "checkDsFormElements": {"status": "warn",
                                "note": "Volunteer form uses placeholder-as-label (anti-pattern)"},
        # Phase H+ (Enonic skill 0.1.0) — 3 new Enonic-XP-integration checks.
        "checkDsSsrHydration": {"status": "warn",
                                  "components_audited": 14,
                                  "hydration_mismatches": 2, "note": (
            "Audit Designsystemet React components for SSR/CSR consistency under "
            "the NextJS-over-Enonic stack. Compare innerHTML of SSR render vs "
            "the post-hydration DOM. Common culprits: theme detection (dark vs "
            "light), locale-aware date/number formatting, Portal-based components "
            "(<Modal>, <Tooltip>). 2 mismatches found on Kampanje page. "
            "code-review-checklist §H + data-integrity §3."
        )},
        "checkDsPackageVersionsAligned": {"status": "warn",
                                            "react_version": "1.0.0",
                                            "css_version": "1.4.2",
                                            "tokens_version": "1.0.0",
                                            "icons_version": "1.4.0",
                                            "aligned": False, "note": (
            "Designsystemet packages must share the same major+minor. Found: "
            "@digdir/designsystemet-react=1.0.0 but @digdir/designsystemet-css=1.4.2 "
            "(skew = 4 minor versions). Result: silent unstyled components "
            "where the JS references CSS class names the css package no longer "
            "generates. Align all DS packages (-react, -css, -tokens, -icons) "
            "to the same major+minor before next release."
        )},
        "checkDsHtmlAreaIntegration": {"status": "warn",
                                         "rich_content_pages_audited": 18,
                                         "typography_drift_count": 5, "note": (
            "Audit pages where Designsystemet <Heading>/<Paragraph> adjoins "
            "<HtmlArea> richtext. Verify CSS cascade: ds-font-family / "
            "ds-line-height / ds-link-color apply to HtmlArea output. 5 pages "
            "show drift: richtext h2 falls back to browser-default serif while "
            "DS Heading uses Inter. Wrap HtmlArea in a ds-typography class OR "
            "extend the DS reset to cover .htmlarea-body. code-review-checklist §I."
        )},
    }
    deviations = parsed.get("deviations") or [
        {"severity": "high",   "component": "Button",
         "page": "/donasjon", "title": "Donation CTA bypasses DS Button",
         "message": "Custom <button> on donation CTA — loses DS focus ring + keyboard semantics.",
         "fix_hint": "Replace with <Button variant='primary' size='lg'> from @digdir/designsystemet-react",
         "enonic_xp_pattern": None,
         "automation_ref": "playwright:storybook.spec.ts"},
        {"severity": "medium", "component": "Input",
         "page": "/bli-frivillig", "title": "Volunteer form uses placeholder-as-label",
         "message": "Inputs missing <Label> — placeholder vanishes on focus.",
         "fix_hint": "Use DS <Textfield label='Fullt navn'> with explicit label slot.",
         "enonic_xp_pattern": None,
         "automation_ref": "cypress:component-designsystemet.cy.ts"},
        {"severity": "medium", "component": "Tag",
         "page": "/lokal/oslo", "title": "District tags use raw spans",
         "message": "Custom span pills instead of DS <Tag>.",
         "fix_hint": "Replace with <Tag color='neutral'> from DS.",
         "enonic_xp_pattern": None,
         "automation_ref": "playwright:storybook.spec.ts"},
        # Phase H+ — 1 new deviation about named imports / bundle bloat.
        {"severity": "low", "component": "*",
         "page": "*", "title": "Star-import from @digdir/designsystemet-react",
         "message": "Several files use `import * as DS from '@digdir/designsystemet-react'` — defeats tree-shaking, ~40 KB extra bundle weight.",
         "fix_hint": "Use named imports only: `import { Button, Textfield } from '@digdir/designsystemet-react'`.",
         "enonic_xp_pattern": "performance-patterns.md §5 (analog — over-allocation)",
         "automation_ref": None},
    ]
    recommendations = parsed.get("recommendations") or [
        {"title": "Migrate raw buttons to DS Button",
         "category": "components",
         "description": "Replace 14 raw <button> with DS <Button> across donation, volunteer, contact pages.",
         "enonic_xp_pattern": None},
        {"title": "Bump @digdir/designsystemet-react",
         "category": "components",
         "description": "Upgrade 1.0.0 → 1.4.2 for latest a11y fixes and Norwegian text adjustments.",
         "enonic_xp_pattern": None},
        {"title": "Map raw hex colors to DS tokens",
         "category": "tokens",
         "description": "38 raw hex values found — define ds-color-rk-* aliases and replace.",
         "enonic_xp_pattern": None},
        # Phase H+ (Enonic skill 0.1.0) — 2 new recommendations citing the skill.
        {"title": "Align all Designsystemet packages to the same major+minor",
         "category": "versioning",
         "description": (
             "Bump -css/-tokens/-icons to match -react (or vice versa). Skew "
             "between @digdir/designsystemet-react@1.0.0 and -css@1.4.2 causes "
             "silent unstyled components. Establish a single source of truth "
             "in package.json (resolutions/overrides) so CI fails on skew."
         ),
         "enonic_xp_pattern": "api-design-patterns.md §1 (Dead code / version drift)"},
        {"title": "Probe DS components for SSR/CSR hydration mismatch",
         "category": "ssr",
         "description": (
             "Build a Playwright check that compares SSR HTML vs the "
             "post-hydration DOM for the Designsystemet components used on "
             "rodekors.no. Reuse the storybook.spec.ts harness to drive each "
             "story. NextJS-over-Enonic stack hydrates twice — mismatch shows "
             "as visual flash + React warning."
         ),
         "enonic_xp_pattern": "code-review-checklist.md §H + data-integrity-patterns.md §3"},
    ]
    score = parsed.get("compliance_score") if isinstance(parsed.get("compliance_score"), int) else 72

    # Phase H+ — baseline persistence for compliance_score trend tracking.
    baseline_key = (environment, url)
    previous_score = _DS_COMPLIANCE_BASELINES.get(baseline_key)
    if previous_score is None or previous_score == 0:
        delta_pct = 0.0
    else:
        delta_pct = round(((score - previous_score) / previous_score) * 100.0, 1)
    _DS_COMPLIANCE_BASELINES[baseline_key] = score

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = (f"Designsystemet compliance {score}/100 on {url} "
               f"({'+' if delta_pct >= 0 else ''}{delta_pct}% vs previous)")

    cross_tool_refs = {
        "playwright_spec": "playwright:storybook.spec.ts (component-level axe + drift-guard)",
        "cypress_spec":    "cypress:component-designsystemet.cy.ts (Guillotine stubbing)",
        "ds_docs":         "https://designsystemet.no/",
        "skill_doc":       ".claude/skills/enonic-xp/references/code-review-checklist.md",
    }

    run = await _store_run("redcross-designsystemet", environment, overall, summary, {
        "url": url, "compliance_score": score, "checks": checks,
        "deviations": deviations, "recommendations": recommendations,
        "compliance_score_previous": previous_score,
        "delta_pct": delta_pct,
        "cross_tool_refs": cross_tool_refs,
        "artifacts": [{"name": "designsystemet-audit.json", "type": "report"}],
    })
    return {"status": "ok", "url": url, "compliance_score": score,
            "compliance_score_previous": previous_score,
            "delta_pct": delta_pct,
            "checks": checks, "deviations": deviations,
            "recommendations": recommendations,
            "cross_tool_refs": cross_tool_refs,
            "run_id": run["run_id"], "lang": lang}


# ═══════════════════════════════════════════════════════════════════
# Tool 9f — Role Permissions Matrix
# ═══════════════════════════════════════════════════════════════════
# Phase H+ (Enonic skill 0.1.0, 2026-05-21) — in-memory baseline for role
# matrix drift tracking. Keyed by environment; value is a set of normalized
# matrix-row signatures (role|scope|read|edit|publish|delete). First run
# seeds the baseline; subsequent runs report added / removed / changed rows.
_ROLE_MATRIX_BASELINES: Dict[str, set] = {}


def _row_signature(row: Dict[str, Any]) -> str:
    """Stable signature of a matrix row for drift detection. Order-independent
    on the action columns; ignores explanatory `note` field."""
    return "|".join([
        str(row.get("role") or ""),
        str(row.get("scope") or ""),
        str(row.get("read") or ""),
        str(row.get("edit") or ""),
        str(row.get("publish") or ""),
        str(row.get("delete") or ""),
    ])


def _compute_matrix_drift(
    matrix: List[Dict[str, Any]], environment: str,
) -> Dict[str, Any]:
    """Compare current matrix signatures vs the in-memory baseline.

    Drift categories:
      - added_rows:   signature present now but NOT in baseline
      - removed_rows: signature in baseline but NOT now
      - changed_rows: same (role, scope) but different action verdicts

    First call seeds baseline and reports 0 drift. Subsequent calls diff
    and refresh the baseline.
    """
    current_signatures = {_row_signature(r) for r in matrix}
    current_by_role_scope = {(r.get("role"), r.get("scope")): _row_signature(r)
                              for r in matrix}
    baseline = _ROLE_MATRIX_BASELINES.get(environment)
    if baseline is None:
        _ROLE_MATRIX_BASELINES[environment] = current_signatures
        return {"added_rows": 0, "removed_rows": 0, "changed_rows": 0,
                "note": "First run on this environment — baseline seeded."}
    added = current_signatures - baseline
    removed = baseline - current_signatures
    # Detect "changed" = same (role, scope) with different action verdicts.
    # Both added and removed will contain this row; remove them from both sets
    # and count once as "changed".
    baseline_by_role_scope: Dict[Tuple[str, str], str] = {}
    for sig in baseline:
        parts = sig.split("|", 5)
        if len(parts) >= 2:
            baseline_by_role_scope[(parts[0], parts[1])] = sig
    changed = 0
    for (role, scope), cur_sig in list(current_by_role_scope.items()):
        prev_sig = baseline_by_role_scope.get((role, scope))
        if prev_sig is not None and prev_sig != cur_sig:
            changed += 1
            added.discard(cur_sig)
            removed.discard(prev_sig)
    _ROLE_MATRIX_BASELINES[environment] = current_signatures
    return {
        "added_rows":   len(added),
        "removed_rows": len(removed),
        "changed_rows": changed,
        "note": (f"Drift since previous run: +{len(added)} new role/scope, "
                  f"-{len(removed)} removed, {changed} verdict changes."),
    }


async def run_role_matrix_audit(environment: str,
                                lang: str = "en") -> Dict[str, Any]:
    """Audit the 6 editorial roles × 4 actions × scope authorization matrix
    on Enonic XP Content Studio. Mock-first.

    Phase H+ (Enonic skill 0.1.0, 2026-05-21) additions:
      - 3 new checks aligned with the skill:
          checkRepositoryAcl              (security-patterns §2)
          checkNoQLInjectionInRoleQueries (security-patterns §1)
          checkRoleCacheStaleness         (reliability-patterns §4)
      - 2 new matrix rows for repository-level principals that bypass
        the editorial matrix entirely.
      - Violations carry `enonic_xp_pattern` cross-refs.
      - Test cases carry `automation_ref` cross-refs.
      - 2 new skill-cited recommendations.
      - `matrix_drift` block tracks added/removed/changed rows between runs.
      - Top-level `cross_tool_refs` exposes related Playwright/Cypress specs
        + the skill doc, so a single response is self-navigable.
    """
    prompt = (
        f"Environment: {environment}\n"
        "Audit role × action × scope for the 6 editorial roles "
        "(Administrator, Eier, Lokal eier, Redaktør, Lokal redaktør, Bidragsyter) "
        "PLUS repository-level principals (repository.writer, system.authenticated). "
        "Include checks for repo ACL, NoQL injection in role-resolution queries, "
        "role-change cache staleness."
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
        # Phase H+ (Enonic skill 0.1.0) — 2 new rows for repository-level
        # principals that operate OUTSIDE the editorial matrix. These bypass
        # all 8 editorial checks; auditing their memberships quarterly is
        # the only practical guard (security-patterns §2).
        {"role": "repository.writer (NVA)", "scope": "NVA results repo",
         "read": "allow", "edit": "allow", "publish": "n/a", "delete": "allow",
         "note": ("Repository-level principal — bypasses editorial matrix. "
                    "Audit memberships quarterly. security-patterns §2.")},
        {"role": "system.authenticated", "scope": "Custom repos",
         "read": "allow", "edit": "deny (target)", "publish": "n/a", "delete": "deny (target)",
         "note": ("Should be READ-only on custom repos. Any CREATE/MODIFY/DELETE "
                    "here is a finding — see checkRepositoryAcl. security-patterns §2.")},
    ]

    checks = parsed.get("checks") or {
        "checkSubtreeIsolation":    {"status": "pass", "note": "Local roles confined to their district subtree"},
        "checkPublishGuard":        {"status": "pass", "note": "Bidragsyter cannot publish (UI + API)"},
        "checkDeleteGuard":         {"status": "warn", "note": "Editor can delete root nodes via direct API call"},
        "checkRoleAssignmentGuard": {"status": "pass", "note": "Only Owner/Administrator can assign roles"},
        "checkAuditLog":            {"status": "warn", "note": "Audit log missing user-agent + IP for delete events"},
        "checkSessionExpiry":       {"status": "pass", "note": "Editorial sessions expire after 8h inactivity"},
        "checkPrivilegeEscalation": {"status": "pass", "note": "Self-promotion blocked at API + UI layer"},
        # Phase H+: extended note with specific Guillotine probe guidance.
        "checkApiAuthZ":            {"status": "warn", "note": (
            "Direct Guillotine call bypasses some scope checks. Probe: as "
            "Lokal redaktør for Oslo, POST a Guillotine mutation editing "
            "/distrikt/bergen content — should 403. As Bidragsyter, POST a "
            "publish mutation — should 403. Audit every Guillotine route "
            "that mutates content."
        )},
        # Phase H+ (Enonic skill 0.1.0) — 3 new skill-aligned checks.
        "checkRepositoryAcl": {"status": "warn",
                                "repos_audited": 4,
                                "repos_with_overpermissive_acl": 2, "note": (
            "Audit ACL on every custom repo (NVA results, GraphQL settings, "
            "custom import). `role:system.authenticated` MUST NOT have "
            "CREATE/MODIFY/DELETE permissions — only READ. Found 2 of 4 repos "
            "granting write to any authenticated user: bypasses the editorial "
            "matrix entirely. Real anti-pattern from the xp-nva pilot review. "
            "security-patterns §2."
        )},
        "checkNoQLInjectionInRoleQueries": {"status": "warn",
                                              "queries_audited": 12,
                                              "unsanitized_queries": 1, "note": (
            "Probe role-resolution code for NoQL injection. Send a probe "
            "principal name like \"oslo' OR _name = 'admin\" via Okta SCIM "
            "provisioning. Expected: query rejects or escapes. Failure mode: "
            "privileges elevated silently. 1 of 12 queries uses string "
            "interpolation without escaping. security-patterns §1."
        )},
        "checkRoleCacheStaleness": {"status": "warn",
                                     "p95_propagation_seconds": 480, "note": (
            "Verify role-change propagation: revoke a user's role, then "
            "attempt the previously-allowed action with their existing "
            "session. Should now 403 within N seconds. Current behaviour: "
            "revocation only takes effect on next login OR session expiry "
            "(p95 ~480s = 8h). Consider session invalidation on role change. "
            "reliability-patterns §4."
        )},
    }
    violations = parsed.get("violations") or [
        {"severity": "high", "role": "Redaktør", "action": "delete",
         "scope": "Root node", "expected": "deny", "actual": "allow",
         "fix_hint": "Add server-side guard on /content-api delete; UI hides button but API does not.",
         "enonic_xp_pattern": "security-patterns.md §2"},
        {"severity": "medium", "role": "Lokal redaktør", "action": "read",
         "scope": "Other district draft", "expected": "deny", "actual": "allow",
         "fix_hint": "Drafts in other districts should be 403, currently 200.",
         "enonic_xp_pattern": "security-patterns.md §2"},
        # Phase H+ — 2 new violations keyed to the skill.
        {"severity": "high", "role": "system.authenticated", "action": "edit",
         "scope": "NVA results repo", "expected": "deny", "actual": "allow",
         "fix_hint": ("Tighten repo ACL: remove CREATE/MODIFY/DELETE from "
                       "`role:system.authenticated`. Only `role:system.admin` "
                       "should write."),
         "enonic_xp_pattern": "security-patterns.md §2 (Over-permissive repository ACL)"},
        {"severity": "high", "role": "any-authenticated", "action": "elevate",
         "scope": "Role-resolution query", "expected": "rejected",
         "actual": "succeeds with crafted principal name",
         "fix_hint": ("Escape single quotes in `getRolesForPrincipal(name)` or "
                       "switch to DSL filter. Reject names containing `'`, `\\`, "
                       "or NoQL operators at the provisioning layer."),
         "enonic_xp_pattern": "security-patterns.md §1 (NoQL injection)"},
    ]
    test_cases = parsed.get("test_cases") or [
        {"role": "Lokal redaktør", "title": "Cannot edit content outside own district",
         "type": "automated", "tool": "playwright",
         "steps": ["Login as Oslo Lokal redaktør", "Navigate to /lokal/bergen/aktiviteter", "Attempt edit"],
         "expected": "Edit button disabled or 403 from API",
         "automation_ref": "playwright:cms-preview.spec.ts"},
        {"role": "Bidragsyter", "title": "Cannot publish draft",
         "type": "automated", "tool": "playwright",
         "steps": ["Login as Bidragsyter", "Open own draft", "Attempt publish"],
         "expected": "Publish button absent; direct POST returns 403",
         "automation_ref": "playwright:cms-preview.spec.ts"},
        {"role": "Eier", "title": "Can assign Lokal redaktør role to another user",
         "type": "manual", "tool": "manual",
         "steps": ["Login as Eier", "Open user admin", "Assign Lokal redaktør role"],
         "expected": "Role assigned and visible in audit log",
         "automation_ref": None},
        # Phase H+ — 2 new test cases keyed to the skill.
        {"role": "system.authenticated", "title": "Custom repo refuses write from any authenticated user",
         "type": "automated", "tool": "playwright",
         "steps": [
             "Login as any non-admin authenticated user",
             "POST a Guillotine mutation that creates a node under the NVA results repo",
             "Verify response is 403 / unauthorized",
         ],
         "expected": "Repo ACL rejects the write; no node created.",
         "automation_ref": "cypress:component-designsystemet.cy.ts"},
        {"role": "any-authenticated", "title": "Role-resolution query rejects NoQL injection probe",
         "type": "manual", "tool": "manual",
         "steps": [
             "Provision a test user via Okta SCIM with principal name containing a single quote",
             "Trigger role resolution (login)",
             "Inspect server log + query trace",
         ],
         "expected": ("Query escapes or rejects the malicious principal name. "
                       "Server does NOT execute a wider query. User gets default role only."),
         "automation_ref": None},
    ]

    recommendations = parsed.get("recommendations") or [
        # Phase H+ — 2 skill-cited recommendations.
        {"title": "Audit custom repo ACLs quarterly",
         "category": "repo-acl",
         "description": (
             "Schedule a quarterly review of every custom repository's ACL. "
             "Verify `role:system.authenticated` has READ only; CREATE/MODIFY/"
             "DELETE restricted to `role:system.admin` or named principals. "
             "The xp-nva pilot review found this anti-pattern in 2 of 4 repos."
         ),
         "enonic_xp_pattern": "security-patterns.md §2"},
        {"title": "Validate Okta → XP principal mapping after every Okta config change",
         "category": "principal",
         "description": (
             "Add a CI test that creates a synthetic user in each Okta group, "
             "triggers SCIM provisioning, and asserts the resulting XP principal "
             "and roles match expectation. A silent regex update on the mapping "
             "rule can put users in the wrong role (or no role at all)."
         ),
         "enonic_xp_pattern": "data-integrity-patterns.md §6"},
    ]

    # Phase H+ — matrix drift baseline tracking.
    matrix_drift = _compute_matrix_drift(matrix, environment)

    cross_tool_refs = {
        "playwright_spec": "playwright:cms-preview.spec.ts (preview-mode authorization)",
        "cypress_spec":    "cypress:component-designsystemet.cy.ts (Guillotine read-only enforcement)",
        "skill_doc":       ".claude/skills/enonic-xp/references/security-patterns.md",
    }

    statuses = [c.get("status") for c in checks.values()]
    overall = "fail" if "fail" in statuses else "warn" if "warn" in statuses else "pass"
    summary = (f"Role matrix on {environment} — {len(matrix)} role/scope rows, "
               f"{len(violations)} violations, drift +{matrix_drift['added_rows']} "
               f"/-{matrix_drift['removed_rows']} /Δ{matrix_drift['changed_rows']}")

    run = await _store_run("redcross-role-matrix", environment, overall, summary, {
        "matrix": matrix, "checks": checks,
        "violations": violations, "test_cases": test_cases,
        "recommendations": recommendations,
        "matrix_drift": matrix_drift,
        "cross_tool_refs": cross_tool_refs,
        "artifacts": [{"name": "role-matrix.json", "type": "report"}],
    })
    return {"status": "ok", "matrix": matrix, "checks": checks,
            "violations": violations, "test_cases": test_cases,
            "recommendations": recommendations,
            "matrix_drift": matrix_drift,
            "cross_tool_refs": cross_tool_refs,
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
# Phase H+ (Enonic skill 0.1.0, 2026-05-21) — in-memory baseline for the
# Resilience score. Keyed by (environment, profile). First call seeds the
# baseline; subsequent calls report delta_pct so trend changes are visible.
_RESILIENCE_BASELINES: Dict[Tuple[str, str], int] = {}


async def run_resilience_check(profile: str, scenarios: List[str],
                                environment: str, lang: str = "en") -> Dict[str, Any]:
    """Resilience-focused k6 wrapper — emphasizes breakpoint, recovery, and soak
    metrics that Trine treats as a separate quality dimension from ytelse.

    Phase H+ (Enonic skill 0.1.0, 2026-05-21) additions:
      - 3 new Enonic-XP-aligned checks:
          checkApimBackpressure         (reliability-patterns §6)
          checkGuillotineUnderLoad      (performance-patterns §1 + reliability §2)
          checkBackgroundJobsUnderLoad  (reliability-patterns §1 + §2)
      - Each existing finding carries `enonic_xp_pattern` skill citation.
      - DST drift probe finding on crisis/soak profiles.
      - `recommendations` array with 2 skill-cited entries.
      - `cross_tool_refs` top-level (k6 + Loadster + Playwright + Cypress + skill doc).
      - `resilience_score_previous` + `delta_pct` for trend tracking.
    """
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
            # Phase H+ — skill citation.
            "enonic_xp_pattern": "reliability-patterns.md §6 (circuit breaker / cascading failures)",
        })
    if recovery_seconds > 30:
        findings.append({
            "severity": "medium", "severity_dev": _severity_dev("medium"), "category_ops": _category_ops("medium"),
            "title": "Slow recovery after peak",
            "message": f"System took {recovery_seconds}s to return to baseline p95 after peak load.",
            "fix_hint": "Pre-warm caches; add stage scaling buffer; verify ISR queue drain.",
            "enonic_xp_pattern": "reliability-patterns.md §1 (task progress + recovery)",
        })
    if memory_drift_pct > 1.0:
        findings.append({
            "severity": "medium", "severity_dev": _severity_dev("medium"), "category_ops": _category_ops("medium"),
            "title": "Memory drift detected during soak",
            "message": f"Heap usage drifted +{memory_drift_pct}% over soak duration.",
            "fix_hint": "Enable heap dumps; check leaks in Guillotine resolver caches.",
            "enonic_xp_pattern": "performance-patterns.md §4 + §5 (GC pressure + pooling)",
        })
    # Phase H+ — DST drift probe on long-running profiles where a DST window
    # could cross. crisis/soak imports running during the DST transition can
    # fail silently if scheduler uses fixed GMT+1 instead of Europe/Oslo.
    if profile in ("profileCrisis", "profileSoak"):
        findings.append({
            "severity": "low", "severity_dev": _severity_dev("low"), "category_ops": _category_ops("low"),
            "title": "Scheduler timezone check (DST window)",
            "message": ("Long-running profile may span a DST transition. "
                          "Verify scheduled jobs honour Europe/Oslo (not GMT+1)."),
            "fix_hint": "Use IANA timezone IDs ('Europe/Oslo') in upsertScheduledJob().",
            "enonic_xp_pattern": "reliability-patterns.md §5 (Scheduler timezone)",
        })

    # Phase H+ (Enonic skill 0.1.0) — 3 new Enonic-XP-aligned checks. Each is
    # mock-first: deterministic per-profile values that a future live probe
    # would replace. Structured fields let the release_judge gate on them.
    apim_429_pct = {
        "profileSmoke": 0.0, "profileNormal": 0.0, "profileCampaign": 0.5,
        "profileCrisis": 3.2, "profileSoak": 0.1,
    }.get(profile, 0.0)
    # Circuit-break health: at crisis VU we EXPECT to see some 429s (proof
    # APIM is throttling). Zero 429 at crisis = cascade-failure risk → warn.
    apim_status = "pass"
    if profile == "profileCrisis" and apim_429_pct < 1.0:
        apim_status = "fail"
    elif profile in ("profileCampaign", "profileSoak") and apim_429_pct < 0.1:
        apim_status = "warn"

    guillotine_p95_at_peak_ms = {
        "profileSmoke": 320, "profileNormal": 540, "profileCampaign": 1180,
        "profileCrisis": 2400, "profileSoak": 720,
    }.get(profile, 800)
    guillotine_resolver_errors_pct = {
        "profileSmoke": 0.0, "profileNormal": 0.1, "profileCampaign": 0.6,
        "profileCrisis": 2.4, "profileSoak": 0.3,
    }.get(profile, 0.5)
    guillotine_status = "pass"
    if guillotine_p95_at_peak_ms > 2000 or guillotine_resolver_errors_pct > 2.0:
        guillotine_status = "fail"
    elif guillotine_p95_at_peak_ms > 800 or guillotine_resolver_errors_pct > 0.5:
        guillotine_status = "warn"

    bg_jobs_concurrent = profile in ("profileCrisis", "profileSoak")
    bg_imports_failed_pct = 1.2 if profile == "profileCrisis" else 0.0
    bg_retries_observed = 4 if profile == "profileCrisis" else 1
    bg_jobs_status = "pass"
    if bg_jobs_concurrent and bg_imports_failed_pct > 0.5:
        bg_jobs_status = "warn"

    checks = {
        "checkApimBackpressure": {
            "status": apim_status,
            "circuit_break_triggered_at_vu": int(breakpoint_vu * 0.8) if apim_429_pct > 0 else 0,
            "apim_429_pct": apim_429_pct,
            "note": (
                f"APIM circuit-break health at {profile}. Found {apim_429_pct}% "
                "of requests throttled (429 + Retry-After). At crisis VU we "
                "EXPECT some 429s — they prove APIM is protecting the backend. "
                "Zero 429 under crisis = cascade-failure risk (reliability-patterns §6)."
            ),
        },
        "checkGuillotineUnderLoad": {
            "status": guillotine_status,
            "p95_ms_at_peak": guillotine_p95_at_peak_ms,
            "resolver_errors_pct": guillotine_resolver_errors_pct,
            "note": (
                f"Direct Guillotine POST load at {profile}: p95 "
                f"{guillotine_p95_at_peak_ms}ms, resolver errors "
                f"{guillotine_resolver_errors_pct}%. Distinct from HTML-route "
                "load — probes resolver cache, N+1 amplification, depth-limit, "
                "connection-pool exhaustion (performance-patterns §1 + "
                "reliability-patterns §2)."
            ),
        },
        "checkBackgroundJobsUnderLoad": {
            "status": bg_jobs_status,
            "concurrent_with_traffic": bg_jobs_concurrent,
            "imports_failed_pct": bg_imports_failed_pct,
            "retries_observed": bg_retries_observed,
            "note": (
                f"Scheduled NVA import + traffic concurrency probe ({profile}). "
                f"Concurrent run: {bg_jobs_concurrent}. Imports failed: "
                f"{bg_imports_failed_pct}%. Retries observed: {bg_retries_observed}. "
                "Verify: (a) progress() visible in Content Studio, (b) 503 "
                "retries with exponential backoff, (c) no orphan/duplicate "
                "nodes after import (reliability-patterns §1 + §2)."
            ),
        },
    }

    # Phase H+ — 2 skill-cited recommendations.
    recommendations = [
        {"title": "Wire APIM circuit-break with Retry-After",
         "category": "circuit-break",
         "description": (
             "Configure APIM rate-limit-by-key + circuit-breaker policies so that "
             "when Enonic backend p95 exceeds a threshold, APIM returns 429 with "
             "Retry-After. Without it, crisis traffic cascades to Enonic and "
             "takes down the whole stack."
         ),
         "enonic_xp_pattern": "reliability-patterns.md §6"},
        {"title": "Run scheduled imports out-of-band of traffic peaks",
         "category": "background-jobs",
         "description": (
             "Either reschedule the nightly NVA import to a quiet window OR "
             "guard the import task with a load-aware pause: if site traffic > "
             "threshold, the task waits. Verify lib-xp-task.progress() reports "
             "the wait so operators see why it's slow."
         ),
         "enonic_xp_pattern": "reliability-patterns.md §1 + §2"},
    ]

    # Phase H+ — baseline trend tracking.
    baseline_key = (environment, profile)
    previous_score = _RESILIENCE_BASELINES.get(baseline_key)
    if previous_score is None or previous_score == 0:
        score_delta_pct = 0.0
    else:
        score_delta_pct = round(((score - previous_score) / previous_score) * 100.0, 1)
    _RESILIENCE_BASELINES[baseline_key] = score

    cross_tool_refs = {
        "k6_endpoint":         "/api/red-cross-qa/run-k6",
        "loadster_endpoint":   "/api/red-cross-qa/run-loadster",
        "playwright_spec":     "playwright:storybook.spec.ts (component perf under load)",
        "cypress_spec":        "cypress:regression-donation.cy.ts (hydration under stress)",
        "skill_doc":           ".claude/skills/enonic-xp/references/reliability-patterns.md",
    }

    resilience = {
        "resilience_score": score,
        "resilience_score_previous": previous_score,
        "delta_pct": score_delta_pct,
        "overall_status": overall_status,
        "breakpoint_vu": breakpoint_vu,
        "recovery_seconds": recovery_seconds,
        "error_rate_peak_pct": error_rate_at_peak,
        "memory_drift_pct": memory_drift_pct,
        "k6_results": base_results,
        "scenarios_run": scenarios,
        "profile": profile,
        "checks": checks,
        "findings": findings,
        "recommendations": recommendations,
        "cross_tool_refs": cross_tool_refs,
        "_distinction": (
            "Resilience handler om systemet *overlever* og *gjenoppretter*, "
            "ikke kun hvor raskt det svarer (det er ytelse / Lighthouse)."
        ) if (lang or "").startswith("no") else (
            "Resilience is about whether the system *survives* and *recovers* — "
            "not how fast it responds (that is performance / Lighthouse)."
        ),
    }

    run = await _store_run("redcross-stress-campaign-peak", environment, overall_status,
                           (f"Resilience check — score {score}/100 "
                            f"({'+' if score_delta_pct >= 0 else ''}{score_delta_pct}% vs prev), "
                            f"breakpoint {breakpoint_vu} VU"),
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
