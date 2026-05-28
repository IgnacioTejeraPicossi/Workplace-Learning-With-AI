"""
Red Cross Web QA Agent — Router (Agent #9)
============================================
REST API endpoints for the Red Cross Web QA Agent (rodekors.no).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

try:
    from backend.services.red_cross_qa import (
        generate_test_plan,
        generate_test_plan_from_ado_item,
        parse_ado_pasted_text,
        fetch_ado_sprint_items,
        format_ado_item_as_paste_text,
        _baseline_list,
        _baseline_reset,
        BASELINE_TYPES,
        generate_playwright_tests,
        run_playwright,
        generate_cypress_tests,
        run_cypress,
        analyze_api,
        export_postman_collection,
        run_graphql_introspection,
        generate_cms_test_cases,
        run_accessibility_check,
        generate_nvda_script,
        run_wave_audit,
        run_lighthouse,
        generate_k6_script,
        run_k6,
        generate_loadster_script,
        run_loadster,
        run_security_scan,
        run_forms_qa,
        run_content_migration_audit,
        run_enonic_performance,
        run_designsystemet_audit,
        run_role_matrix_audit,
        get_ado_bundle_preview,
        create_ado_work_items,
        dispatch_to_outsystems,
        generate_sprint_report,
        run_dpia_check,
        verify_definition_of_done,
        run_resilience_check,
        generate_uat_support,
        analyze_risk_matrix,
        list_runs,
        get_run,
        get_stats,
        get_settings,
        save_settings,
        VALID_ENVIRONMENTS,
    )
except ImportError:  # pragma: no cover
    from services.red_cross_qa import (  # type: ignore
        generate_test_plan,
        generate_test_plan_from_ado_item,
        parse_ado_pasted_text,
        fetch_ado_sprint_items,
        format_ado_item_as_paste_text,
        _baseline_list,
        _baseline_reset,
        BASELINE_TYPES,
        generate_playwright_tests,
        run_playwright,
        generate_cypress_tests,
        run_cypress,
        analyze_api,
        export_postman_collection,
        run_graphql_introspection,
        generate_cms_test_cases,
        run_accessibility_check,
        generate_nvda_script,
        run_wave_audit,
        run_lighthouse,
        generate_k6_script,
        run_k6,
        generate_loadster_script,
        run_loadster,
        run_security_scan,
        run_forms_qa,
        run_content_migration_audit,
        run_enonic_performance,
        run_designsystemet_audit,
        run_role_matrix_audit,
        get_ado_bundle_preview,
        create_ado_work_items,
        dispatch_to_outsystems,
        generate_sprint_report,
        run_dpia_check,
        verify_definition_of_done,
        run_resilience_check,
        generate_uat_support,
        analyze_risk_matrix,
        list_runs,
        get_run,
        get_stats,
        get_settings,
        save_settings,
        VALID_ENVIRONMENTS,
    )

router = APIRouter(prefix="/api/red-cross-qa", tags=["Red Cross Web QA Agent"])


# ── Request Models ──────────────────────────────────────────────────
class TestPlanRequest(BaseModel):
    # Azure DevOps work item (epic / user story) — replaces former jira_epic.
    # Keep `jira_epic` as an alias for one release so old clients don't break.
    ado_work_item: str = ""
    jira_epic: Optional[str] = None  # deprecated alias
    acceptance_criteria: str = ""
    design_link: Optional[str] = ""
    risk_level: Optional[str] = "medium"
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class PlaywrightRequest(BaseModel):
    scopes: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class CypressRequest(BaseModel):
    scopes: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class ApiAnalyzeRequest(BaseModel):
    endpoint: str
    method: str = "POST"
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


# Phase F (Tom's tip · 2026-05-12) — Postman + GraphQL introspection.
class PostmanExportRequest(BaseModel):
    scope: Optional[str] = Field(
        default=None,
        description="Optional sub-set tag ('donation', 'distrikt', ...). None = full collection.",
    )
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class GraphqlIntrospectionRequest(BaseModel):
    url: Optional[str] = Field(
        default=None,
        description="Guillotine GraphQL endpoint URL. Optional; mock-first when omitted.",
    )
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class CmsRequest(BaseModel):
    areas: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class UrlRequest(BaseModel):
    url: str
    wcag_version: Optional[str] = "2.2-AA"  # Phase C: explicit WCAG version (Trine §4.1)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


# Phase G (2026-05-13) — NVDA + WAVE additions to the Accessibility tab.
class NvdaScriptRequest(BaseModel):
    url: Optional[str] = Field(default=None, description="Target URL. Defaults to a per-scope path.")
    scope: str = Field(default="navigation",
                       description="One of: donation / volunteer / search / navigation / forms.")
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class WaveAuditRequest(BaseModel):
    url: Optional[str] = Field(default=None, description="Target URL. Mock-first when omitted.")
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class K6Request(BaseModel):
    profile: str = "profileNormal"
    scenarios: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


# Phase D — Loadster (browser-based load testing). Same shape as K6Request
# kept identical on purpose so frontend can switch tools without re-mapping.
class LoadsterRequest(BaseModel):
    profile: str = "profileNormal"
    scenarios: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class SecurityRequest(BaseModel):
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class FormsQaRequest(BaseModel):
    scopes: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class ContentMigrationRequest(BaseModel):
    scopes: List[str] = Field(default_factory=list)
    legacy_sample_size: Optional[int] = 100
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class RoleMatrixRequest(BaseModel):
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class AdoDispatchRequest(BaseModel):
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


# Phase H+ (2026-05-27) — Paste-and-Generate: user copies a Sprint item
# from the live Azure DevOps Board and the agent emits a Røde Kors-aware
# test plan. No PAT required (parsing is heuristic).
class AdoPasteToPlanRequest(BaseModel):
    pasted_text: str = Field(..., description="Raw text copied from an ADO User Story / Task.")
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


# Phase H+ (2026-05-28) — Fetch-from-ADO: pull the live Sprint backlog
# via WIQL when ADO_PAT is set in the server environment. Falls back to
# a curated mock list when PAT is absent. PAT is NEVER sent in the body —
# only read from process env (ADO_PAT / AZURE_DEVOPS_PAT).
class AdoFetchSprintRequest(BaseModel):
    iteration_path: Optional[str] = Field(default=None,
        description="Override iteration path. Defaults to settings.ado_iteration_path.")
    area_path: Optional[str] = Field(default=None,
        description="Override area path. Defaults to settings.ado_area_path.")
    organization: Optional[str] = Field(default=None,
        description="Override ADO organization. Defaults to settings.ado_organization.")
    project: Optional[str] = Field(default=None,
        description="Override ADO project. Defaults to settings.ado_project.")
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class SprintReportRequest(BaseModel):
    sprint_name: Optional[str] = None  # defaults to settings.current_sprint
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class DpiaRequest(BaseModel):
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class DodRequest(BaseModel):
    sprint_name: Optional[str] = None
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class ResilienceRequest(BaseModel):
    profile: str = "profileNormal"
    scenarios: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class UatRequest(BaseModel):
    scopes: List[str] = Field(default_factory=list)
    stakeholders: List[str] = Field(default_factory=list)
    sprint_name: Optional[str] = None
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class RiskMatrixRequest(BaseModel):
    matrix_csv: Optional[str] = None
    matrix_json: Optional[List[Dict[str, Any]]] = None
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class SettingsRequest(BaseModel):
    env_local_url: Optional[str] = None
    env_test_url: Optional[str] = None
    env_default: Optional[str] = None
    execution_mode: Optional[str] = None
    # Azure DevOps settings (replaces former Jira fields)
    ado_organization: Optional[str] = None
    ado_project: Optional[str] = None
    ado_area_path: Optional[str] = None
    ado_iteration_path: Optional[str] = None
    ado_tags: Optional[List[str]] = None
    current_sprint: Optional[str] = None
    sprint_length_weeks: Optional[int] = None
    payment_flow: Optional[str] = None
    threshold_perf: Optional[int] = None
    threshold_seo: Optional[int] = None
    threshold_axe_critical: Optional[int] = None
    outsystems_url: Optional[str] = None


# ── Validation helper ──────────────────────────────────────────────
def _check_env(env: Optional[str]) -> str:
    env = env or "test"
    if env not in VALID_ENVIRONMENTS:
        raise HTTPException(status_code=400, detail=f"Invalid environment: {env}")
    return env


# ── Test Plan ─────────────────────────────────────────────────────
@router.post("/generate-test-plan")
async def api_generate_test_plan(body: TestPlanRequest):
    env = _check_env(body.environment)
    work_item = body.ado_work_item or body.jira_epic or ""
    return await generate_test_plan(
        work_item, body.acceptance_criteria, body.design_link or "",
        body.risk_level or "medium", env, body.lang or "en",
    )


# ── Playwright ────────────────────────────────────────────────────
@router.post("/generate-playwright-tests")
async def api_generate_playwright(body: PlaywrightRequest):
    env = _check_env(body.environment)
    return await generate_playwright_tests(body.scopes, env, body.lang or "en")


@router.post("/run-playwright")
async def api_run_playwright(body: PlaywrightRequest):
    env = _check_env(body.environment)
    return await run_playwright(body.scopes, env)


# ── Cypress ───────────────────────────────────────────────────────
@router.post("/generate-cypress-tests")
async def api_generate_cypress(body: CypressRequest):
    env = _check_env(body.environment)
    return await generate_cypress_tests(body.scopes, env, body.lang or "en")


@router.post("/run-cypress")
async def api_run_cypress(body: CypressRequest):
    env = _check_env(body.environment)
    return await run_cypress(body.scopes, env)


# ── API QA ────────────────────────────────────────────────────────
@router.post("/analyze-api")
async def api_analyze_api(body: ApiAnalyzeRequest):
    env = _check_env(body.environment)
    return await analyze_api(body.endpoint, body.method, env, body.lang or "en")


# Phase F (Tom's tip) — Postman export + GraphQL introspection for Guillotine/XP
@router.post("/export-postman-collection")
async def api_export_postman(body: PostmanExportRequest):
    """Generate a Postman Collection v2.1 JSON for the canonical Guillotine
    GraphQL operations. The frontend offers it as a download so the team can
    import directly into Postman (Tom's preferred workflow for poking at the
    XP backend during the rebuild)."""
    env = _check_env(body.environment)
    return await export_postman_collection(body.scope, env, body.lang or "en")


@router.post("/run-graphql-introspection")
async def api_run_graphql_introspection(body: GraphqlIntrospectionRequest):
    """Return the list of GraphQL operations + content types exposed by
    Guillotine. Mock-first: when no live URL is reachable, returns a curated
    list of the operations expected for the rodekors.no rebuild so the
    workshop demo always renders."""
    env = _check_env(body.environment)
    return await run_graphql_introspection(body.url, env, body.lang or "en")


# ── CMS QA ────────────────────────────────────────────────────────
@router.post("/generate-cms-test-cases")
async def api_generate_cms(body: CmsRequest):
    env = _check_env(body.environment)
    return await generate_cms_test_cases(body.areas, env, body.lang or "en")


# ── Accessibility ─────────────────────────────────────────────────
@router.post("/run-accessibility-check")
async def api_run_accessibility(body: UrlRequest):
    env = _check_env(body.environment)
    return await run_accessibility_check(
        body.url, env, body.lang or "en",
        wcag_version=body.wcag_version or "2.2-AA",
    )


# Phase G — NVDA screen-reader script + WAVE (WebAIM) audit. Both live
# inside the Universell utforming-pilot tab alongside the existing
# axe-core + Lighthouse runner.
@router.post("/generate-nvda-script")
async def api_generate_nvda_script(body: NvdaScriptRequest):
    env = _check_env(body.environment)
    return await generate_nvda_script(
        body.url or "", body.scope or "navigation", env, body.lang or "en"
    )


@router.post("/run-wave-audit")
async def api_run_wave_audit(body: WaveAuditRequest):
    env = _check_env(body.environment)
    return await run_wave_audit(body.url or "", env, body.lang or "en")


# ── Performance ───────────────────────────────────────────────────
@router.post("/run-lighthouse")
async def api_run_lighthouse(body: UrlRequest):
    env = _check_env(body.environment)
    return await run_lighthouse(body.url, env, body.lang or "en")


# ── Stress Test ───────────────────────────────────────────────────
@router.post("/generate-k6-script")
async def api_generate_k6(body: K6Request):
    env = _check_env(body.environment)
    return await generate_k6_script(body.profile, body.scenarios, env, body.lang or "en")


@router.post("/run-k6")
async def api_run_k6(body: K6Request):
    env = _check_env(body.environment)
    return await run_k6(body.profile, body.scenarios, env)


# Phase D — Loadster (browser-level). Lives alongside k6 in the same tab;
# differentiator is that Loadster runs real browsers, so the report carries
# hydration_p95_ms and spa_nav_p95_ms which k6 cannot measure.
@router.post("/generate-loadster-script")
async def api_generate_loadster(body: LoadsterRequest):
    env = _check_env(body.environment)
    return await generate_loadster_script(body.profile, body.scenarios, env, body.lang or "en")


@router.post("/run-loadster")
async def api_run_loadster(body: LoadsterRequest):
    env = _check_env(body.environment)
    return await run_loadster(body.profile, body.scenarios, env, body.lang or "en")


# ── Security & Privacy ────────────────────────────────────────────
@router.post("/run-security-scan")
async def api_run_security(body: SecurityRequest):
    env = _check_env(body.environment)
    return await run_security_scan(env, body.lang or "en")


# ── Forms QA (Skjemabygger / Adam Silver / JSON Schema) ───────────
@router.post("/run-forms-qa")
async def api_run_forms_qa(body: FormsQaRequest):
    env = _check_env(body.environment)
    return await run_forms_qa(body.scopes, env, body.lang or "en")


# ── Content Migration Audit ───────────────────────────────────────
@router.post("/run-content-migration-audit")
async def api_run_content_migration(body: ContentMigrationRequest):
    env = _check_env(body.environment)
    return await run_content_migration_audit(
        body.scopes, env, body.legacy_sample_size or 100, body.lang or "en",
    )


# ── Enonic-specific Performance ───────────────────────────────────
@router.post("/run-enonic-performance")
async def api_run_enonic_performance(body: UrlRequest):
    env = _check_env(body.environment)
    return await run_enonic_performance(body.url, env, body.lang or "en")


# ── Designsystemet (Digdir) Compliance ────────────────────────────
@router.post("/run-designsystemet-audit")
async def api_run_designsystemet(body: UrlRequest):
    env = _check_env(body.environment)
    return await run_designsystemet_audit(body.url, env, body.lang or "en")


# ── Role Permissions Matrix ───────────────────────────────────────
@router.post("/run-role-matrix-audit")
async def api_run_role_matrix(body: RoleMatrixRequest):
    env = _check_env(body.environment)
    return await run_role_matrix_audit(env, body.lang or "en")


# ── Azure DevOps / OutSystems ─────────────────────────────────────
@router.get("/ado-bundle-preview")
async def api_ado_preview(environment: Optional[str] = "test"):
    env = _check_env(environment)
    return await get_ado_bundle_preview(env)


# Phase H+ — Paste-and-Generate: user pastes a Sprint item; agent emits
# the parsed structure + a Røde Kors-aware test plan. Mirror endpoint
# for parser-only (parse without generating the plan, useful for the
# UI's "preview parse" hint).
@router.post("/ado/parse-pasted")
async def api_ado_parse_pasted(body: AdoPasteToPlanRequest):
    parsed = parse_ado_pasted_text(body.pasted_text or "")
    return {"status": "ok", "parsed": parsed}


@router.post("/ado/paste-to-plan")
async def api_ado_paste_to_plan(body: AdoPasteToPlanRequest):
    env = _check_env(body.environment)
    if not (body.pasted_text or "").strip():
        raise HTTPException(status_code=400, detail="pasted_text is required")
    return await generate_test_plan_from_ado_item(
        body.pasted_text, env, body.lang or "en",
    )


# Phase H+ (2026-05-28) — Fetch live Sprint items from ADO REST.
# Companion to /ado/paste-to-plan: instead of pasting, pull directly.
@router.post("/ado/fetch-sprint")
async def api_ado_fetch_sprint(body: AdoFetchSprintRequest):
    env = _check_env(body.environment)
    return await fetch_ado_sprint_items(
        iteration_path=body.iteration_path,
        area_path=body.area_path,
        organization=body.organization,
        project=body.project,
        environment=env,
        lang=body.lang or "en",
    )


# Format a single fetched ADO item as paste-parser-compatible text. The
# frontend's "Use this item" button POSTs the item dict here and pipes
# the response into the existing paste-to-plan textarea.
class AdoFormatItemRequest(BaseModel):
    item: Dict[str, Any] = Field(..., description="Single ADO work item as returned by /ado/fetch-sprint.")


@router.post("/ado/format-item")
async def api_ado_format_item(body: AdoFormatItemRequest):
    if not body.item or not isinstance(body.item, dict):
        raise HTTPException(status_code=400, detail="item is required")
    return {"status": "ok", "pasted_text": format_ado_item_as_paste_text(body.item)}


@router.post("/create-ado-work-items")
async def api_create_ado(body: AdoDispatchRequest):
    env = _check_env(body.environment)
    return await create_ado_work_items(env, body.lang or "en")


@router.post("/dispatch-to-outsystems")
async def api_dispatch_outsystems(body: AdoDispatchRequest):
    env = _check_env(body.environment)
    return await dispatch_to_outsystems(env)


# ── Sprint Report (regalo for Trine — automated sprint summary) ────
@router.post("/generate-sprint-report")
async def api_generate_sprint_report(body: SprintReportRequest):
    env = _check_env(body.environment)
    return await generate_sprint_report(
        sprint_name=body.sprint_name,
        environment=env,
        lang=body.lang or "en",
    )


# ── DPIA / Privacy by Design (Trine §6.1 + GDPR Art. 35) ──────────
@router.post("/run-dpia-check")
async def api_run_dpia(body: DpiaRequest):
    env = _check_env(body.environment)
    return await run_dpia_check(env, body.lang or "en")


# ── Definition of Done verifier (Trine §6.1) ─────────────────────
@router.post("/verify-definition-of-done")
async def api_verify_dod(body: DodRequest):
    env = _check_env(body.environment)
    return await verify_definition_of_done(env, body.sprint_name, body.lang or "en")


# ── Resilience / lasttest (separate from ytelse per Trine §6.1) ───
@router.post("/run-resilience-check")
async def api_run_resilience(body: ResilienceRequest):
    env = _check_env(body.environment)
    return await run_resilience_check(body.profile, body.scenarios, env, body.lang or "en")


# ── UAT-støtte (Akseptansetest-støtte for Røde Kors-stakeholders) ─
@router.post("/generate-uat-support")
async def api_generate_uat(body: UatRequest):
    env = _check_env(body.environment)
    return await generate_uat_support(
        body.scopes, body.stakeholders, body.sprint_name, env, body.lang or "en",
    )


# ── Risikomatrise-input (per Teststrategi §10) ────────────────────
@router.post("/analyze-risk-matrix")
async def api_analyze_risk_matrix(body: RiskMatrixRequest):
    env = _check_env(body.environment)
    return await analyze_risk_matrix(body.matrix_csv, body.matrix_json, env, body.lang or "en")


# ── Runs / Stats / Settings ───────────────────────────────────────
@router.get("/runs")
async def api_list_runs(environment: Optional[str] = None, limit: int = 50):
    if environment:
        environment = _check_env(environment)
    return await list_runs(environment, limit)


@router.get("/runs/{run_id}")
async def api_get_run(run_id: str):
    return await get_run(run_id)


@router.get("/stats")
async def api_stats(environment: Optional[str] = None):
    if environment:
        environment = _check_env(environment)
    return await get_stats(environment)


@router.get("/settings")
async def api_get_settings():
    return await get_settings()


@router.post("/settings")
async def api_save_settings(body: SettingsRequest):
    payload = body.dict(exclude_unset=True)
    return await save_settings(payload)


# ── Baselines admin (Phase H+ · 1.15.8) ───────────────────────────
# Inspect / reset the 5 persisted baselines. Useful for debugging drift
# detection or resetting an environment after a planned schema/role
# change. Mongo-backed; never raises (graceful when Mongo offline).
@router.get("/baselines")
async def api_baselines_list(baseline_type: Optional[str] = None):
    """List persisted baselines. Optional `baseline_type` filter (graphql /
    perf_hot_query / ds_compliance / role_matrix / resilience)."""
    if baseline_type and baseline_type not in BASELINE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid baseline_type. Valid: {sorted(BASELINE_TYPES)}",
        )
    entries = await _baseline_list(baseline_type)
    return {
        "status": "ok",
        "baseline_type": baseline_type,
        "count": len(entries),
        "entries": entries,
    }


@router.delete("/baselines/{baseline_type}")
async def api_baselines_reset(baseline_type: str):
    """Reset a specific baseline type — clears the in-memory cache AND
    deletes persisted Mongo docs. Use `all` to clear every baseline type."""
    if baseline_type == "all":
        result = await _baseline_reset(None)
        return {"status": "ok", "baseline_type": "all", **result}
    if baseline_type not in BASELINE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid baseline_type. Valid: {sorted(BASELINE_TYPES)} or 'all'",
        )
    result = await _baseline_reset(baseline_type)
    return {"status": "ok", "baseline_type": baseline_type, **result}
