"""Smoke test for Red Cross QA service.
Covers: Phase A (Jira -> Azure DevOps rename, Sev/Kat, Sprint Report, Fundy)
        Phase B (DPIA, DoD verifier, Resilience, UAT-stotte, Risk Matrix).
"""
import asyncio
from backend.services.red_cross_qa import (
    generate_test_plan, get_ado_bundle_preview, generate_sprint_report,
    run_forms_qa, get_settings,
    run_dpia_check, verify_definition_of_done, run_resilience_check,
    generate_uat_support, analyze_risk_matrix,
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
    print(
        f"[OK] test plan ({len(p['ado_work_items'])} work items, test_level present)"
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
    print(
        f"[OK] Forms QA ({len(fundy_keys)} Fundy checks, all findings have Sev/Kat)"
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


if __name__ == "__main__":
    asyncio.run(main())
    print("\n[PASS] ALL SMOKE CHECKS PASSED")
