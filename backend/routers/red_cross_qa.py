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
        get_jira_bundle_preview,
        create_jira_issues,
        dispatch_to_outsystems,
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
        get_jira_bundle_preview,
        create_jira_issues,
        dispatch_to_outsystems,
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
    jira_epic: str = ""
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


class JiraDispatchRequest(BaseModel):
    environment: Optional[str] = "test"
    lang: Optional[str] = "en"


class SettingsRequest(BaseModel):
    env_local_url: Optional[str] = None
    env_test_url: Optional[str] = None
    env_default: Optional[str] = None
    execution_mode: Optional[str] = None
    jira_project: Optional[str] = None
    jira_component: Optional[str] = None
    jira_labels: Optional[List[str]] = None
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
    return await generate_test_plan(
        body.jira_epic, body.acceptance_criteria, body.design_link or "",
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


# ── Jira / OutSystems ─────────────────────────────────────────────
@router.get("/jira-bundle-preview")
async def api_jira_preview(environment: Optional[str] = "test"):
    env = _check_env(environment)
    return await get_jira_bundle_preview(env)


@router.post("/create-jira-issues")
async def api_create_jira(body: JiraDispatchRequest):
    env = _check_env(body.environment)
    return await create_jira_issues(env, body.lang or "en")


@router.post("/dispatch-to-outsystems")
async def api_dispatch_outsystems(body: JiraDispatchRequest):
    env = _check_env(body.environment)
    return await dispatch_to_outsystems(env)


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
