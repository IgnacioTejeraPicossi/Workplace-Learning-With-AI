"""Smoke test for Red Cross QA service.
Covers: Phase A (Jira -> Azure DevOps rename, Sev/Kat, Sprint Report, Fundy)
        Phase B (DPIA, DoD verifier, Resilience, UAT-stotte, Risk Matrix)
        Phase C (WCAG 2.1/2.2 explicit, Migrert vs Nyopprettet data)
        Phase D (Loadster browser-level load testing)
        Phase F (Tom's tips: Storybook scope + Postman export + GraphQL introspection)
        Phase G (NVDA script generator + WAVE WebAIM audit).
"""
import asyncio
from backend.services.red_cross_qa import (
    generate_test_plan, get_ado_bundle_preview, generate_sprint_report,
    run_forms_qa, get_settings,
    run_dpia_check, verify_definition_of_done, run_resilience_check,
    generate_uat_support, analyze_risk_matrix,
    run_accessibility_check, run_content_migration_audit,
    generate_loadster_script, run_loadster,
    generate_playwright_tests, generate_cypress_tests, export_postman_collection, run_graphql_introspection,
    analyze_api, generate_cms_test_cases,
    generate_nvda_script, run_wave_audit,
)


async def main():
    s = await get_settings()
    settings = s["settings"]
    assert "ado_organization" in settings, "ado_organization missing"
    assert "current_sprint" in settings, "current_sprint missing"
    assert "jira_project" not in settings, "jira_project should be gone"
    print("[OK] settings shape")

    plan = await generate_test_plan(
        "ADO-123 demo", "AC1: works", "", "medium", "test", "en"
    )
    assert plan["status"] == "ok"
    p = plan["plan"]
    assert "ado_work_items" in p, "ado_work_items missing in plan"
    assert "jira_subtasks" not in p, "old jira_subtasks key still present"
    has_test_level = any("test_level" in wi for wi in p["ado_work_items"])
    assert has_test_level, "test_level missing on ado_work_items"
    # Phase H+ (Enonic skill 0.1.0) — mock fallback must include at least one
    # static-review work item (covers NoQL / stale-data / Nashorn audits).
    static_review_items = [wi for wi in p["ado_work_items"]
                            if wi.get("test_level") == "static-review"]
    assert static_review_items, \
        "expected at least one static-review work item in the test plan mock fallback"
    print(
        f"[OK] test plan ({len(p['ado_work_items'])} work items, test_level present, "
        f"{len(static_review_items)} static-review)"
    )

    bundle = await get_ado_bundle_preview("test")
    assert bundle["status"] == "ok"
    b = bundle["bundle"]
    assert "work_items" in b, "work_items missing"
    assert "organization" in b
    sample = b["work_items"][0]
    assert "severity_dev" in sample, "severity_dev missing"
    assert "category_ops" in sample, "category_ops missing"
    print(
        f"[OK] ADO bundle ({len(b['work_items'])} items, Sev1-4/KatA-C present)"
    )

    forms = await run_forms_qa(["donation"], "test", "en")
    assert forms["status"] == "ok"
    fundy_keys = [k for k in forms["checks"].keys() if k.startswith("checkFundy")]
    assert len(fundy_keys) >= 9, f"expected 9+ Fundy checks, got {len(fundy_keys)}"
    findings = forms["findings"]
    assert all("severity_dev" in f for f in findings), "severity_dev missing"
    assert all("category_ops" in f for f in findings), "category_ops missing"
    # Phase H+ (Enonic skill 0.1.0) — 3 new security checks must be present.
    new_security_checks = ("checkCsrf", "checkInjectionInFormFields", "checkServiceUrlGeneration")
    for ck in new_security_checks:
        assert ck in forms["checks"], f"Forms QA missing new security check: {ck}"
    # Phase H+ — checkFundyOriginAllowed added to Fundy sub-checks.
    assert "checkFundyOriginAllowed" in forms["checks"], "Forms QA missing checkFundyOriginAllowed"
    fundy_keys_after = [k for k in forms["checks"].keys() if k.startswith("checkFundy")]
    assert len(fundy_keys_after) >= 10, \
        f"expected 10+ Fundy checks after Phase H+, got {len(fundy_keys_after)}"
    # Phase H+ — 4 new Enonic-XP-keyed findings present.
    finding_titles = [f.get("title", "").lower() for f in findings]
    assert any("anti-csrf" in t for t in finding_titles), "missing CSRF finding"
    assert any("beredskap" in (f.get("form") or "").lower() and "retry" in (f.get("title") or "").lower()
                for f in findings), "missing Beredskap critical-path finding"
    assert any("hardcoded service url" in t for t in finding_titles), "missing serviceUrl finding"
    assert any("postmessage" in t and "origin" in t for t in finding_titles), "missing Fundy origin finding"
    # Phase H+ — automation_ref field on test_cases + Nashorn static review case.
    test_cases = forms["test_cases"]
    assert all("automation_ref" in tc for tc in test_cases), \
        "test_cases missing automation_ref field"
    nashorn_case = next((tc for tc in test_cases if "nashorn" in tc.get("title", "").lower()), None)
    assert nashorn_case is not None, "missing Skjemabygger Nashorn compatibility test case"
    assert nashorn_case.get("type") == "static" and nashorn_case.get("tool") == "static"
    print(
        f"[OK] Forms QA ({len(fundy_keys_after)} Fundy checks + 3 new security checks, "
        f"all findings have Sev/Kat, {len(test_cases)} test cases incl. Nashorn static review)"
    )

    rep = await generate_sprint_report(None, "test", "no")
    assert rep["status"] == "ok"
    r = rep["report"]
    assert "severity_dev" in r["stats"]
    assert "category_ops" in r["stats"]
    assert r["narrative"]
    print(
        f"[OK] Sprint report ({r['sprint_name']}, narrative={len(r['narrative'])} chars)"
    )

    # ── Phase B: 5 medium-value items ──────────────────────────────
    dpia = await run_dpia_check("test", "no")
    assert dpia["status"] == "ok"
    assert "dpia_score" in dpia and 0 <= dpia["dpia_score"] <= 100
    assert len(dpia["checks"]) >= 12, "expected 12+ DPIA checks"
    assert any(f.get("gdpr_article") for f in dpia["findings"]), "expected gdpr_article on findings"
    assert any("Fundy" in (r.get("system") or "") for r in dpia["data_register"]), "Fundy should be in data register"
    print(
        f"[OK] DPIA ({len(dpia['checks'])} checks, score={dpia['dpia_score']}, "
        f"{len(dpia['data_register'])} systems in data register)"
    )

    dod = await verify_definition_of_done("test", "Sprint 1", "no")
    assert dod["status"] == "ok"
    assert "summary" in dod and "items" in dod
    sample_item = dod["items"][0]
    assert set(sample_item["checklist"].keys()) == {
        "functionality_tested", "integrations_verified",
        "known_bugs_documented", "ready_for_uat",
    }, "DoD checklist must have all 4 Trine §6.1 keys"
    assert dod["narrative"]
    print(
        f"[OK] DoD verifier ({dod['summary']['dod_pass']}/{dod['summary']['total_work_items']} pass, "
        f"ready_for_uat={dod['summary']['ready_for_uat']})"
    )

    resi = await run_resilience_check("profileCampaign", ["scenarioDonation"], "test", "no")
    assert resi["status"] == "ok"
    r = resi["resilience"]
    assert "resilience_score" in r and 0 <= r["resilience_score"] <= 100
    assert "breakpoint_vu" in r and "recovery_seconds" in r and "memory_drift_pct" in r
    assert r["_distinction"], "missing ytelse-vs-resilience distinction text"
    print(
        f"[OK] Resilience (score={r['resilience_score']}, "
        f"breakpoint={r['breakpoint_vu']} VU, recovery={r['recovery_seconds']}s)"
    )

    uat = await generate_uat_support([], [], "Sprint 1", "test", "no")
    assert uat["status"] == "ok"
    assert len(uat["uat_scripts"]) >= 3, "expected 3+ UAT scripts"
    sample_script = uat["uat_scripts"][0]
    assert sample_script["stakeholder"] in {
        "Hilde Forslund", "Trine Røsand Scheen", "Astri Fretheim",
    }, "stakeholder must be a named Røde Kors person"
    signoff_names = [ln["name"] for ln in uat["signoff_form"]["lines"]]
    assert "Hilde Forslund" in signoff_names, "Hilde must be on sign-off form"
    print(
        f"[OK] UAT support ({len(uat['uat_scripts'])} scripts, "
        f"{len(uat['signoff_form']['lines'])} sign-off lines)"
    )

    rm = await analyze_risk_matrix(None, None, "test", "no")
    assert rm["status"] == "ok"
    assert rm["risk_count"] >= 5, "expected mock fallback with 5+ risks"
    assert rm["suite_priority"], "expected suite_priority list"
    sample_risk = rm["risks"][0]
    assert "score" in sample_risk and "level" in sample_risk and "suite" in sample_risk
    assert rm["summary_narrative"]
    print(
        f"[OK] Risk matrix ({rm['risk_count']} risks, "
        f"top suite={rm['suite_priority'][0]['suite']} prio={rm['suite_priority'][0]['priority']})"
    )

    # CSV input variant
    csv_text = (
        "id,description,probability,impact,area\n"
        "R-100,Fundy Vipps handoff feiler,4,5,donation\n"
        "R-101,Helse-data lekkasje,2,5,personvern\n"
    )
    rm_csv = await analyze_risk_matrix(csv_text, None, "test", "no")
    assert rm_csv["risk_count"] == 2, f"expected 2 risks from CSV, got {rm_csv['risk_count']}"
    print(f"[OK] Risk matrix CSV parser ({rm_csv['risk_count']} risks parsed)")

    # ── Phase C: 3 low-value items ──────────────────────────────────
    # WCAG 2.2 AA (default) and WCAG 2.1 AA explicit selector
    a22 = await run_accessibility_check(
        "https://www.rodekors.no/", "test", "en", wcag_version="2.2-AA"
    )
    assert a22["status"] == "ok"
    assert a22["wcag_version_id"] == "2.2-AA", f"expected 2.2-AA, got {a22.get('wcag_version_id')}"
    assert any("wcag-2-2-target-size" == v.get("rule") for v in a22["violations"]), \
        "expected WCAG 2.2-only target-size violation when 2.2 AA selected"
    a21 = await run_accessibility_check(
        "https://www.rodekors.no/", "test", "en", wcag_version="2.1-AA"
    )
    assert a21["wcag_version_id"] == "2.1-AA", f"expected 2.1-AA, got {a21.get('wcag_version_id')}"
    assert not any("wcag-2-2-target-size" == v.get("rule") for v in a21["violations"]), \
        "WCAG 2.2-only violation should NOT appear when 2.1 AA selected"
    print(
        f"[OK] WCAG version selector (2.2 AA: {a22['wcag_version']} / "
        f"2.1 AA: {a21['wcag_version']}, 2.2-only target-size correctly gated)"
    )

    # Migrert vs Nyopprettet data — explicit cohort split
    mig = await run_content_migration_audit(
        ["typeForening", "typeAktivitet"], "test", 100, "no"
    )
    assert mig["status"] == "ok"
    dp = mig.get("data_provenance") or {}
    assert "migrated" in dp and "newly_created" in dp, "missing data_provenance.migrated/newly_created"
    assert dp["migrated"]["count"] > 0
    assert dp["newly_created"]["count"] >= 0
    assert any(p.get("data_origin") == "migrated" for p in mig["broken_pages"]), \
        "expected at least one migrated broken page"
    assert any(p.get("data_origin") == "newly_created" for p in mig["broken_pages"]), \
        "expected at least one newly_created broken page"
    print(
        f"[OK] Migrert vs Nyopprettet ({dp['migrated']['count']} migrert, "
        f"{dp['newly_created']['count']} nyopprettet, broken_pages tagged)"
    )

    # Phase H+ (Enonic skill 0.1.0, 2026-05-20) — 3 new migration checks + new
    # broken_page issue types + test_case cross-ref to playwright:migrated-links.
    new_mig_checks = ("checkUrlParameterConsistency",
                       "checkStructuredFilterPreserved",
                       "checkStaleDataLifecycle")
    for ck in new_mig_checks:
        assert ck in mig["checks"], f"Migration missing new check: {ck}"
    # Each new check should reference the relevant skill section in its note.
    skill_refs = {
        "checkUrlParameterConsistency":  "data-integrity",
        "checkStructuredFilterPreserved": "data-integrity",
        "checkStaleDataLifecycle":       "reliability-patterns",
    }
    for ck, expected_ref in skill_refs.items():
        note = (mig["checks"][ck].get("note") or "").lower()
        assert expected_ref in note, \
            f"Migration {ck} note must cite '{expected_ref}': got {note[:120]!r}"
    # Broken pages must include the 3 new Enonic-XP issue types, each with
    # an enonic_xp_pattern reference.
    new_issue_types = {"url-param-drift", "free-text-filter-regression", "stale-not-purged"}
    seen_issues = {p.get("issue") for p in mig["broken_pages"]}
    missing_issues = new_issue_types - seen_issues
    assert not missing_issues, \
        f"Migration broken_pages missing new issue types: {missing_issues}"
    for p in mig["broken_pages"]:
        if p.get("issue") in new_issue_types:
            assert p.get("enonic_xp_pattern"), \
                f"new broken_page issue {p['issue']} must carry enonic_xp_pattern"
    # data_provenance.migrated.common_issues now lists the 3 new failure modes.
    mig_issues = " ".join(dp["migrated"]["common_issues"]).lower()
    for token in ("url parameter drift", "free-text", "stale legacy data"):
        assert token in mig_issues, \
            f"data_provenance.migrated.common_issues missing token: {token}"
    # Test cases include automation_ref AND at least one cross-refs migrated-links.
    test_cases_mig = mig["test_cases"]
    assert all("automation_ref" in tc for tc in test_cases_mig), \
        "all migration test_cases must carry automation_ref field"
    migrated_links_refs = [tc for tc in test_cases_mig
                           if tc.get("automation_ref") == "playwright:migrated-links.spec.ts"]
    assert migrated_links_refs, \
        "expected at least one test_case cross-referencing playwright:migrated-links.spec.ts"
    # Nashorn static-review case present.
    nashorn_mig_case = next((tc for tc in test_cases_mig
                              if "nashorn" in (tc.get("title") or "").lower()), None)
    assert nashorn_mig_case and nashorn_mig_case.get("type") == "static", \
        "expected a Nashorn static-review test_case in migration audit"
    print(
        f"[OK] Migration Phase H+ checks ({len(new_mig_checks)} new checks all skill-cited, "
        f"{len(new_issue_types)} new broken_page issue types, "
        f"{len(migrated_links_refs)} cross-ref to migrated-links spec, "
        f"Nashorn static review present)"
    )

    # ── Phase D: Loadster (browser-level load testing) ─────────────────
    # Differentiator vs k6: real-browser metrics — hydration_p95_ms, spa_nav_p95_ms.
    ls_script = await generate_loadster_script("profileCampaign", ["scenarioDonation"], "test", "en")
    assert ls_script["status"] == "ok"
    assert ls_script["tool"] == "loadster"
    assert ls_script["filename"].endswith(".lhx.json") or ls_script["filename"].endswith(".json")
    assert ls_script["engines"] >= 1, "expected at least 1 engine"
    assert "${BASE_URL}" in ls_script["script"], "scenario should template BASE_URL"
    print(
        f"[OK] Loadster script generator ({ls_script['filename']}, "
        f"{ls_script['engines']} engines)"
    )

    ls_run = await run_loadster("profileCampaign", ["scenarioDonation"], "test", "en")
    assert ls_run["status"] == "ok"
    assert ls_run["tool"] == "loadster"
    res = ls_run["results"]
    assert "hydration_p95_ms" in res, "loadster must report hydration_p95_ms (browser-only)"
    assert "spa_nav_p95_ms" in res, "loadster must report spa_nav_p95_ms (browser-only)"
    assert res["engines"] >= 1
    assert res["avg_response_ms"] > 0
    assert ls_run["differentiator"], "expected differentiator text vs k6"
    print(
        f"[OK] Loadster run (campaign: avg {res['avg_response_ms']}ms, "
        f"p95 {res['p95_response_ms']}ms, hydration p95 {res['hydration_p95_ms']}ms, "
        f"err {res['error_rate_pct']}%)"
    )

    # ── Phase F: Tom's tooling tips (Storybook + Postman + GraphQL introspection)
    # 1. Playwright generator must include a deterministic Storybook spec when
    #    'scenarioStorybook' is in the requested scopes.
    pw = await generate_playwright_tests(
        ["scenarioPublic", "scenarioStorybook"], "test", "en"
    )
    assert pw["status"] == "ok"
    storybook_scripts = [
        s for s in pw["scripts"]
        if "storybook" in (s.get("filename") or "").lower()
           or "storybook" in (s.get("content") or "").lower()
    ]
    assert storybook_scripts, "expected at least one Storybook spec when scenarioStorybook is requested"
    sb = storybook_scripts[0]
    sb_content = sb["content"]
    assert "axe-playwright" in sb_content, "Storybook spec must inject axe-core"
    assert "iframe.html" in sb_content, "Storybook spec must use Storybook iframe URL pattern"
    assert "storybook-root" in sb_content, "Storybook spec must wait for #storybook-root"
    assert "wcag22aa" in sb_content, "Storybook spec must run WCAG 2.2 AA axe profile"
    # Phase H+ (Enonic skill 0.1.0) — Storybook spec must also guard against
    # silent drift on renamed/removed stories. Both checks must be present.
    assert "toBeLessThan(400)" in sb_content, \
        "Storybook spec must assert HTTP status < 400 (drift guard)"
    assert "#storybook-root *" in sb_content, \
        "Storybook spec must check the storybook-root has real children"
    print(f"[OK] Playwright Storybook scope ({sb['filename']}, "
          f"axe + iframe.html + storybook-root + wcag22aa + drift-guard all present)")

    # Phase H+ — scopeCmsPreview must emit a deterministic cms-preview.spec.ts
    # covering draft/master + the data-portal-component-type wrapper.
    pw_cms = await generate_playwright_tests(["scopeCmsPreview"], "test", "en")
    cms_scripts = [s for s in pw_cms["scripts"]
                    if "cms-preview" in (s.get("filename") or "").lower()]
    assert cms_scripts, "scopeCmsPreview must produce cms-preview.spec.ts"
    cms_c = cms_scripts[0]["content"]
    for needle in ("data-portal-component-type", "draft", "master",
                     "admin/site/preview"):
        assert needle in cms_c, f"cms-preview.spec.ts missing required marker: {needle}"
    print(f"[OK] Playwright CMS Preview scope ({cms_scripts[0]['filename']}, "
          f"draft + master + portal-component-type all present)")

    # Phase H+ — scopeNavigation must emit a deterministic migrated-links.spec.ts
    # guarding against Cristin → NVA URL parameter drift.
    pw_nav = await generate_playwright_tests(["scopeNavigation"], "test", "en")
    ml_scripts = [s for s in pw_nav["scripts"]
                   if "migrated-links" in (s.get("filename") or "").lower()]
    assert ml_scripts, "scopeNavigation must produce migrated-links.spec.ts"
    ml_c = ml_scripts[0]["content"]
    for needle in ("MIGRATED_PARAM", "cristinid", "round-trip"):
        assert needle in ml_c, f"migrated-links.spec.ts missing required marker: {needle}"
    print(f"[OK] Playwright Migrated-links scope ({ml_scripts[0]['filename']}, "
          f"param + cristinid-guard + round-trip all present)")

    # Phase H+ — Cypress deterministic templates per scope.
    # 1. scopeComponent → Guillotine GraphQL stubbing + Designsystemet
    cy_comp = await generate_cypress_tests(["scopeComponent"], "test", "en")
    comp_scripts = [s for s in cy_comp["scripts"]
                     if "component-designsystemet" in (s.get("filename") or "").lower()]
    assert comp_scripts, "scopeComponent must produce component-designsystemet.cy.ts"
    cc = comp_scripts[0]["content"]
    for needle in ("cy.intercept", "GetCampaignPage", "operationName", "Guillotine"):
        assert needle in cc, f"component spec missing required marker: {needle}"
    print(f"[OK] Cypress Component scope ({comp_scripts[0]['filename']}, "
          f"cy.intercept + Guillotine + GetCampaignPage + operationName all present)")

    # 2. scopeFrontendRegression → cypress-axe + hydration + æøå
    cy_reg = await generate_cypress_tests(["scopeFrontendRegression"], "test", "en")
    reg_scripts = [s for s in cy_reg["scripts"]
                    if "regression-donation" in (s.get("filename") or "").lower()]
    assert reg_scripts, "scopeFrontendRegression must produce regression-donation.cy.ts"
    rc = reg_scripts[0]["content"]
    for needle in ("cypress-axe", "__NEXT_DATA__", "bløding", "wcag22aa", "/_/image/"):
        assert needle in rc, f"regression spec missing required marker: {needle}"
    print(f"[OK] Cypress Regression scope ({reg_scripts[0]['filename']}, "
          f"cypress-axe + hydration + bløding + wcag22aa + Enonic-image all present)")

    # 3. scopeQuickDebug → locale + Enonic image + Guillotine ping
    cy_dbg = await generate_cypress_tests(["scopeQuickDebug"], "test", "en")
    dbg_scripts = [s for s in cy_dbg["scripts"]
                    if "quick-debug" in (s.get("filename") or "").lower()]
    assert dbg_scripts, "scopeQuickDebug must produce quick-debug.cy.ts"
    dc = dbg_scripts[0]["content"]
    for needle in ("/api/graphql", "/_/image/", "next-intl"):
        assert needle in dc, f"quick-debug spec missing required marker: {needle}"
    print(f"[OK] Cypress QuickDebug scope ({dbg_scripts[0]['filename']}, "
          f"graphql-ping + Enonic-image + next-intl all present)")

    # 2. Postman Collection v2.1 JSON must be valid + carry the 4 canonical queries.
    pm = await export_postman_collection(None, "test", "en")
    assert pm["status"] == "ok"
    coll = pm["collection"]
    assert coll["info"]["schema"].endswith("v2.1.0/collection.json"), \
        f"Postman schema must be v2.1.0, got {coll['info']['schema']}"
    op_names = [it["name"] for it in coll["item"]]
    expected_ops = {"GetDistrictPage", "GetActivityList", "GetCampaignPage", "GetForeningContacts"}
    assert set(op_names) >= expected_ops, \
        f"Expected ops {expected_ops}, got {set(op_names)}"
    # Canonical happy-path items must assert no GraphQL errors. Negative items
    # (Phase H+) test for non-2xx status instead — handled in the next block.
    canonical_items = [it for it in coll["item"] if it["name"] in expected_ops]
    for it in canonical_items:
        scripts = it.get("event", [])
        test_scripts = [e for e in scripts if e.get("listen") == "test"]
        assert test_scripts, f"{it['name']} has no test script"
        exec_body = "\n".join(test_scripts[0]["script"]["exec"])
        assert "errors" in exec_body, f"{it['name']} test script missing GraphQL errors assertion"
        # Phase H+ — every happy-path item asserts Content-Type + size budget.
        assert "Content-Type" in exec_body, \
            f"{it['name']} test script missing Content-Type assertion"
        assert "responseSize" in exec_body, \
            f"{it['name']} test script missing response-size budget assertion"
    # Variables must include base_url + token placeholders.
    var_keys = {v["key"] for v in coll.get("variable", [])}
    assert "base_url" in var_keys and "token" in var_keys, \
        f"Postman collection missing variables: {var_keys}"
    print(f"[OK] Postman collection export ({pm['operation_count']} ops, "
          f"v2.1 schema, 4 canonical Guillotine queries + Content-Type + size budget, "
          f"base_url + token vars)")

    # Phase H+ (Enonic skill 0.1.0) — collection must also include 3 negative items.
    negative_item_names = [n for n in op_names if n.lower().startswith("negative")]
    assert len(negative_item_names) >= 3, \
        f"expected ≥3 negative items in Postman collection, got: {negative_item_names}"
    # Each negative item must assert the EXPECTED non-2xx status code.
    negative_items = [it for it in coll["item"] if it["name"].lower().startswith("negative")]
    expected_status_codes = ["400", "401", "429"]
    found_codes = set()
    for it in negative_items:
        exec_body = "\n".join(it["event"][0]["script"]["exec"])
        for code in expected_status_codes:
            if code in exec_body:
                found_codes.add(code)
    assert set(expected_status_codes).issubset(found_codes), \
        f"negative items missing assertions for codes {set(expected_status_codes) - found_codes}"
    print(f"[OK] Postman negative tests ({len(negative_items)} items, "
          f"covering status codes {sorted(found_codes)})")

    # Phase H+ — analyze_api emits 3 new security checks for GraphQL endpoints.
    api = await analyze_api("/site/api/graphql", "POST", "test", "en")
    for ck in ("checkInjection", "checkIntrospectionDisabledInProd", "checkDepthLimit"):
        assert ck in api["checks"], f"analyze_api missing new check: {ck}"
    # Path-specific heuristics: donation endpoint should NOT have GraphQL-only
    # checks at warn (they're n/a for REST). Run a 2nd analysis to verify.
    api_don = await analyze_api("/api/donation/process", "POST", "test", "en")
    assert api_don["checks"]["checkIntrospectionDisabledInProd"] == "pass", \
        "donation endpoint should treat introspection check as n/a (pass)"
    print(f"[OK] analyze_api Phase H+ checks "
          f"(GraphQL: 3 security checks present, donation: introspection n/a)")

    # Phase H+ — checkSchemaDrift is now REAL: first call seeds baseline (pass),
    # subsequent identical call returns pass too. Drift only fires on changes.
    api_2nd = await analyze_api("/site/api/graphql", "POST", "test", "en")
    assert api_2nd["checks"]["checkSchemaDrift"] in ("pass", "warn"), \
        f"checkSchemaDrift unexpected: {api_2nd['checks']['checkSchemaDrift']}"
    print(f"[OK] analyze_api Schema drift baseline "
          f"(2nd call status={api_2nd['checks']['checkSchemaDrift']}, "
          f"{len(api_2nd['findings'])} finding(s))")

    # Phase H+ (Enonic skill 0.1.0) — CMS QA mock fallback now emits a curated
    # test case PER REQUESTED AREA, each carrying severity + enonic_xp_pattern
    # + acceptance_criteria + automation_ref.
    all_areas = [
        "areaContentTypes", "areaPageTemplates", "areaLayouts", "areaParts",
        "areaFieldSets", "areaRoles", "areaPreview", "areaPublish",
        "areaUnpublish", "areaScheduled", "areaLocalization", "areaMedia",
        "areaBrokenLinks", "areaIsr",
    ]
    cms = await generate_cms_test_cases(all_areas, "test", "en")
    cases = cms["test_cases"]
    # 1. All 14 areas covered (was capped at 8 before).
    assert len(cases) == 14, \
        f"expected 14 CMS test cases (one per area), got {len(cases)}"
    # 2. Every case has the new enriched fields.
    for c in cases:
        for field in ("area", "severity", "title", "description",
                       "acceptance_criteria", "roles", "enonic_xp_pattern"):
            assert field in c, f"CMS case for '{c.get('area')}' missing field: {field}"
        assert c["severity"] in ("low", "medium", "high", "critical"), \
            f"bad severity on '{c['area']}': {c['severity']}"
        assert isinstance(c["acceptance_criteria"], list) and c["acceptance_criteria"], \
            f"acceptance_criteria empty/missing on '{c['area']}'"
    # 3. High-severity Enonic XP patterns specifically asserted.
    role_case = next(c for c in cases if c["area"] == "areaRoles")
    assert role_case["severity"] == "high", "areaRoles must be high severity"
    assert "subtree isolation" in role_case["title"].lower(), \
        "areaRoles must cover subtree isolation"
    sched_case = next(c for c in cases if c["area"] == "areaScheduled")
    assert sched_case["severity"] == "high", "areaScheduled must be high severity"
    assert "Europe/Oslo" in sched_case["description"], \
        "areaScheduled must reference Europe/Oslo IANA timezone"
    links_case = next(c for c in cases if c["area"] == "areaBrokenLinks")
    assert links_case["severity"] == "high", "areaBrokenLinks must be high severity"
    assert links_case["automation_ref"] == "playwright:migrated-links.spec.ts", \
        f"areaBrokenLinks must cross-ref playwright:migrated-links.spec.ts, got {links_case['automation_ref']}"
    # 4. enonic_xp_pattern references must cite a real skill section.
    pattern_refs = {c.get("enonic_xp_pattern") for c in cases
                     if c.get("enonic_xp_pattern")}
    expected_skill_docs = {"security-patterns", "reliability-patterns",
                            "data-integrity-patterns", "code-review-checklist"}
    cited_docs = {ref.split(".md")[0] for ref in pattern_refs if ".md" in ref}
    missing_cites = expected_skill_docs - cited_docs
    assert not missing_cites, \
        f"CMS cases should cite all 4 main skill docs, missing: {missing_cites}"
    # 5. Backward compat: unknown areas still get a generic case.
    cms_unknown = await generate_cms_test_cases(["areaFoobar"], "test", "en")
    assert len(cms_unknown["test_cases"]) == 1, \
        "unknown area should still produce 1 generic test case"
    assert cms_unknown["test_cases"][0]["area"] == "areaFoobar"
    print(f"[OK] CMS QA test cases "
          f"({len(cases)} curated + 1 generic fallback, "
          f"{sum(1 for c in cases if c['severity'] == 'high')} high-severity, "
          f"{len(cited_docs)}/4 skill docs cited)")

    # 3. GraphQL introspection mock returns operations + content_types.
    ix = await run_graphql_introspection(None, "test", "en")
    assert ix["status"] == "ok"
    assert len(ix["operations"]) >= 5, f"expected >=5 ops, got {len(ix['operations'])}"
    op_names_ix = [o["name"] for o in ix["operations"]]
    assert "guillotine.get" in op_names_ix and "guillotine.query" in op_names_ix
    ct_names = [c["name"] for c in ix["content_types"]]
    assert any("Distrikt" in n for n in ct_names), "Distrikt content type missing"
    assert any("Aktivitet" in n for n in ct_names), "Aktivitet content type missing"
    assert any("Kampanje" in n for n in ct_names), "Kampanje content type missing"
    assert "__schema" in ix["introspection_query"], "introspection_query missing __schema"
    print(f"[OK] GraphQL introspection ({len(ix['operations'])} ops, "
          f"{len(ix['content_types'])} content types incl. Distrikt/Aktivitet/Kampanje)")

    # ── Phase G: Universell utforming-pilot extras (NVDA + WAVE) ─────────
    # 1. NVDA script generator must produce a deterministic markdown
    #    checklist with NVDA keyboard shortcuts + expected announcements
    #    per step + WCAG SC mapping.
    nvda = await generate_nvda_script(
        "https://test.rodekors.no/giverstotte", "donation", "test", "en"
    )
    assert nvda["status"] == "ok"
    assert nvda["tool"] == "nvda"
    md = nvda["script_md"]
    assert "Insert + Ctrl + N" in md, "NVDA setup keystroke missing"
    assert "Insert + T" in md, "NVDA page-title keystroke missing"
    assert "Insert + F7" in md, "NVDA elements-list keystroke missing"
    assert "Tab" in md, "NVDA Tab navigation step missing"
    assert "Expected announcement" in md, "NVDA expected-announcement labels missing"
    assert "WCAG SC" in md, "NVDA per-step WCAG mapping missing"
    assert "1.3.1" in md, "WCAG 1.3.1 must appear at least once"
    assert nvda["step_count"] >= 8, f"expected ≥8 steps, got {nvda['step_count']}"
    assert len(nvda["wcag_sc_covered"]) >= 5, \
        f"expected ≥5 WCAG SCs covered, got {nvda['wcag_sc_covered']}"
    print(f"[OK] NVDA script generator ({nvda['filename']}, "
          f"{nvda['step_count']} steps, {len(nvda['wcag_sc_covered'])} WCAG SC)")

    # 2. WAVE (WebAIM) report must carry the canonical category counts +
    #    deep link to the public report.
    wave = await run_wave_audit("https://test.rodekors.no/", "test", "en")
    assert wave["status"] == "ok"
    assert wave["tool"] == "wave"
    cats = wave["categories"]
    for k in ("errors", "contrast_errors", "alerts", "features",
              "structural_elements", "aria"):
        assert k in cats, f"WAVE categories missing '{k}'"
    assert wave["wave_report_url"].startswith("https://wave.webaim.org/report#/"), \
        "WAVE deep link wrong"
    assert isinstance(wave["errors_detail"], list)
    assert isinstance(wave["contrast_detail"], list)
    assert isinstance(wave["alerts_detail"], list)
    # mock-first guarantee
    assert wave["used_api"] is False, "expected mock path (no live API call)"
    print(f"[OK] WAVE audit ({cats['errors']} errors, "
          f"{cats['contrast_errors']} contrast, {cats['alerts']} alerts, "
          f"deep link present)")


if __name__ == "__main__":
    asyncio.run(main())
    print("\n[PASS] ALL SMOKE CHECKS PASSED")
