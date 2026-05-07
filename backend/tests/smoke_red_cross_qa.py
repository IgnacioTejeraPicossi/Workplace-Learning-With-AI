"""Smoke test for Red Cross QA service after Jira -> Azure DevOps rename."""
import asyncio
from backend.services.red_cross_qa import (
    generate_test_plan, get_ado_bundle_preview, generate_sprint_report,
    run_forms_qa, get_settings,
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


if __name__ == "__main__":
    asyncio.run(main())
    print("\n[PASS] ALL SMOKE CHECKS PASSED")
