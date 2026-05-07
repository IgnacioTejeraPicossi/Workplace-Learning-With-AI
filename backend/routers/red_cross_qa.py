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
        generate_playwright_tests,
        run_playwright,
        generate_cypress_tests,
        run_cypress,
        analyze_api,
        generate_cms_test_cases,
        run_accessibility_check,
        run_lighthouse,
        generate_k6_script,
        run_k6,
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
        generate_playwright_tests,
        run_playwright,
        generate_cypress_tests,
        run_cypress,
        analyze_api,
        generate_cms_test_cases,
        run_accessibility_check,
        run_lighthouse,
        generate_k6_script,
        run_k6,
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


class CmsRequest(BaseModel):
    areas: List[str] = Field(default_factory=list)
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class UrlRequest(BaseModel):
    url: str
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class K6Request(BaseModel):
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


# ── CMS QA ────────────────────────────────────────────────────────
@router.post("/generate-cms-test-cases")
async def api_generate_cms(body: CmsRequest):
    env = _check_env(body.environment)
    return await generate_cms_test_cases(body.areas, env, body.lang or "en")


# ── Accessibility ─────────────────────────────────────────────────
@router.post("/run-accessibility-check")
async def api_run_accessibility(body: UrlRequest):
    env = _check_env(body.environment)
    return await run_accessibility_check(body.url, env, body.lang or "en")


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
