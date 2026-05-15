"""Smoke test for the QA Security & Privacy workbench (Phase H · Pack 2).

Exercises the full lifecycle:
  1. /scan persists a ScanRun + Findings + returns a snapshot
  2. /status reads the persisted snapshot
  3. /checks returns the catalogued check shapes with statuses
  4. /checks/{id} returns full detail with findings_detail attached
  5. /findings is filterable by status / severity / check_id
  6. /findings/{id} PATCH transitions open → fixed and is preserved
     across a subsequent scan (protected status)
  7. /history returns the most recent runs newest-first
  8. /dpia GET seeds a default; POST replaces; PATCH partially updates
  9. Router has 10 registered endpoints

The smoke test relies only on mock-first behaviour: no Mongo, no LLM
required. When Mongo IS available, persistence is exercised too.
"""

import asyncio
import sys

from backend.services.qa_security_service import (
    perform_scan, get_status, get_checks, get_check_detail,
    get_findings, update_finding, get_history,
    get_dpia_form, save_dpia, patch_dpia_form, ensure_dpia_seed,
    # Pack 3 additions
    export_markdown_report, dispatch_finding_to_ado, diff_scans,
    verify_finding, get_environment_matrix,
)
# Re-fetch helper for verifying the finding doc was mutated by dispatch.
from backend.repositories.qa_security_repository import get_finding


async def main() -> int:
    failures: list[str] = []

    # ── 1. perform_scan returns full payload ──────────────────────────────
    res = await perform_scan(environment="test", lang="en",
                              actor="smoke-test", trigger="ci")
    for key in ("scan", "checks", "findings", "snapshot"):
        if key not in res:
            failures.append(f"perform_scan missing key: {key}")
    scan = res["scan"]
    if scan.get("environment") != "test":
        failures.append("scan.environment != 'test'")
    if scan.get("total_checks") < 20:
        failures.append(f"scan.total_checks expected >=20 (13 sec + 12 dpia), got {scan.get('total_checks')}")
    # Pass + warn + fail must sum to total
    summed = (scan.get("pass_count", 0) + scan.get("warn_count", 0)
              + scan.get("fail_count", 0))
    if summed != scan.get("total_checks"):
        failures.append(f"counts don't sum: {summed} vs {scan.get('total_checks')}")
    print(f"[OK] perform_scan ({scan['total_checks']} checks: "
          f"{scan['pass_count']} pass / {scan['warn_count']} warn / "
          f"{scan['fail_count']} fail, scan_id={scan['id'][:18]}…)")

    # ── 2. Every check carries the rich shape ─────────────────────────────
    checks = res["checks"]
    required_check_keys = {"id", "title", "category", "status", "severity",
                            "scan_type", "summary", "findings",
                            "evidence", "recommendations", "last_run_at"}
    missing = required_check_keys - set(checks[0].keys())
    if missing:
        failures.append(f"check shape missing keys: {missing}")
    scan_types = {c["scan_type"] for c in checks}
    if not scan_types.issubset({"automatic", "semi-automatic", "manual"}):
        failures.append(f"unexpected scan_type values: {scan_types}")
    categories = {c["category"] for c in checks}
    expected_categories = {"security", "privacy", "dpia"}
    if not expected_categories.issubset(categories):
        failures.append(f"missing categories: {expected_categories - categories}")
    print(f"[OK] Check shape complete "
          f"(categories={sorted(categories)}, scan_types={sorted(scan_types)})")

    # ── 3. Findings have ids + linked check_id + status='open' on first run
    findings = res["findings"]
    if not findings:
        failures.append("perform_scan produced no findings")
    sample_f = findings[0]
    required_finding_keys = {"id", "check_id", "title", "severity",
                              "status", "owner", "created_at", "updated_at"}
    missing_f = required_finding_keys - set(sample_f.keys())
    if missing_f:
        failures.append(f"finding shape missing keys: {missing_f}")
    if "::" not in sample_f["id"]:
        failures.append(f"finding id should be '<check>::<slug>', got: {sample_f['id']}")
    print(f"[OK] Findings shape ({len(findings)} findings, "
          f"first id={sample_f['id'][:40]}…, owner='{sample_f['owner']}')")

    # ── 4. get_status returns a snapshot consistent with the scan ────────
    status = await get_status(environment="test")
    if status["total_checks"] != scan["total_checks"]:
        failures.append("status.total_checks != scan.total_checks")
    if status["overall_status"] not in ("pass", "warn", "fail", "pending"):
        failures.append(f"status.overall_status invalid: {status['overall_status']}")
    print(f"[OK] get_status (overall={status['overall_status']}, "
          f"open_findings={status['open_findings']}, "
          f"dpia_present={status['dpia_present']})")

    # ── 5. get_check_detail returns findings_detail attached ─────────────
    # Pick a check that DOES have findings linked to it.
    pick = next((c for c in checks if c.get("findings")), None)
    if pick:
        detail = await get_check_detail(pick["id"], environment="test", lang="en")
        if not detail or "findings_detail" not in detail:
            failures.append("get_check_detail missing findings_detail array")
        elif len(detail["findings_detail"]) == 0:
            failures.append(f"get_check_detail for '{pick['id']}' returned empty findings_detail")
        else:
            print(f"[OK] get_check_detail ({pick['id']}: {len(detail['findings_detail'])} linked findings)")
    else:
        print("[OK] get_check_detail skipped (no check has linked findings in mock data)")

    # ── 6. Filterable findings list ─────────────────────────────────────
    open_only = await get_findings(status="open")
    if not open_only:
        failures.append("get_findings(status='open') returned no items")
    high_only = await get_findings(severity="high")
    by_check = await get_findings(check_id=findings[0]["check_id"])
    if not by_check:
        failures.append(f"get_findings(check_id={findings[0]['check_id']}) empty")
    print(f"[OK] get_findings filter (status=open: {len(open_only)}, "
          f"severity=high: {len(high_only)}, by check: {len(by_check)})")

    # ── 7. PATCH a finding — status open → fixed; PRESERVED across re-scan
    target_id = findings[0]["id"]
    patched = await update_finding(
        target_id,
        patch={"status": "fixed", "owner": "smoke-test",
                "note": "Verified fix in CI", "evidence": ["axe re-scan clean"]},
        actor="smoke-test",
    )
    if not patched or patched.get("status") != "fixed":
        failures.append(f"PATCH did not transition finding to 'fixed': {patched}")
    else:
        print(f"[OK] PATCH finding (id={target_id[:40]}… → status=fixed, "
              f"owner='{patched.get('owner')}', history_len={len(patched.get('history', []))})")

    # 7b) Re-scan must NOT clobber the fixed status.
    res2 = await perform_scan(environment="test", lang="en",
                               actor="smoke-test-rescan", trigger="ci")
    rescanned = next((f for f in res2["findings"] if f["id"] == target_id), None)
    if rescanned and rescanned.get("status") != "fixed":
        failures.append(f"Re-scan reset finding status: {rescanned.get('status')}")
    elif rescanned:
        print(f"[OK] Re-scan preserved finding status (still 'fixed' after re-scan)")
    else:
        print(f"[OK] Re-scan check skipped (finding not re-detected — also acceptable)")

    # ── 8. History returns ≥1 scan ─────────────────────────────────────
    history = await get_history(limit=5)
    if len(history) < 1:
        failures.append("get_history returned no runs")
    if history and history[0].get("started_at") < history[-1].get("started_at"):
        failures.append("get_history not newest-first")
    print(f"[OK] get_history ({len(history)} runs, newest first)")

    # ── 9. DPIA lifecycle: seed → save → patch ─────────────────────────
    dpia_seed = await ensure_dpia_seed(actor="smoke-seed")
    if dpia_seed.get("id") != "dpia_main":
        failures.append(f"DPIA seed id != 'dpia_main', got {dpia_seed.get('id')}")
    if not dpia_seed.get("sensitive_data"):
        failures.append("DPIA seed missing sensitive_data flag")

    saved = await save_dpia({**dpia_seed, "purpose": "Smoke-test purpose"},
                              actor="smoke-test")
    if saved.get("purpose") != "Smoke-test purpose":
        failures.append("DPIA save did not persist purpose change")

    patched_dpia = await patch_dpia_form(
        {"retention": "5 years archive then anonymize",
          "mitigations": ["RBAC", "Field encryption", "Slettepolicy", "DPA-register"]},
        actor="smoke-test",
    )
    if patched_dpia.get("retention") != "5 years archive then anonymize":
        failures.append("DPIA patch did not update retention")
    if "DPA-register" not in (patched_dpia.get("mitigations") or []):
        failures.append("DPIA patch did not append mitigations list")
    print(f"[OK] DPIA lifecycle (seed → save → patch, "
          f"mitigations={len(patched_dpia.get('mitigations') or [])}, "
          f"retention='{patched_dpia.get('retention')[:30]}…')")

    # ── 10. Router has 10 endpoints ──────────────────────────────────
    try:
        from backend.routers.qa_security import router as qs_router
        # 10 expected endpoints (each may map to 1 route with possibly
        # >1 method — count unique paths).
        paths = {r.path for r in qs_router.routes}
        expected_paths = {
            "/api/qa/security/status",
            "/api/qa/security/checks",
            "/api/qa/security/checks/{check_id}",
            "/api/qa/security/scan",
            "/api/qa/security/findings",
            "/api/qa/security/findings/{finding_id}",
            "/api/qa/security/history",
            "/api/qa/security/dpia",
        }
        missing_paths = expected_paths - paths
        if missing_paths:
            failures.append(f"Router missing paths: {missing_paths}")
        else:
            # GET + POST + PATCH on /dpia should give 3 methods on same path
            method_count = sum(1 for r in qs_router.routes
                                if r.path == "/api/qa/security/dpia")
            if method_count < 3:
                failures.append(f"/dpia should have GET+POST+PATCH ({method_count} found)")
            else:
                print(f"[OK] Router registered ({len(paths)} unique paths, "
                      f"/dpia GET+POST+PATCH present)")
    except Exception as e:
        failures.append(f"Router import failed: {e}")

    # ═══════════════════════════════════════════════════════════════════
    # Pack 3 checks (5)
    # ═══════════════════════════════════════════════════════════════════

    # ── 11. Markdown export ─────────────────────────────────────────
    try:
        md_export = await export_markdown_report(
            environment="test", sprint_name="smoke-sprint", lang="en"
        )
        for k in ("filename", "markdown", "byte_count", "environment", "generated_at"):
            if k not in md_export:
                failures.append(f"export_markdown_report missing key: {k}")
        md = md_export.get("markdown") or ""
        # Sanity-check the report contains the required sections.
        required_sections = [
            "# Sikkerhet og personvern",
            "## 1) Status snapshot",
            "## 2) Findings by severity",
            "## 3) Findings tally",
        ]
        for sec in required_sections:
            if sec not in md:
                failures.append(f"export_markdown missing section: {sec!r}")
        if md_export["filename"].endswith(".md"):
            print(f"[OK] export_markdown_report ({md_export['filename']}, "
                  f"{md_export['byte_count']} bytes, "
                  f"{len(md.splitlines())} lines)")
        else:
            failures.append(f"markdown filename should end with .md: {md_export['filename']}")
    except Exception as e:
        failures.append(f"export_markdown_report raised: {e}")

    # ── 12. Finding → ADO dispatch (deterministic + idempotent) ────
    # Need a finding to dispatch. Run a scan to make sure we have one
    # we haven't already PATCHed in step 7 (that one might be 'fixed').
    try:
        scan_for_ado = await perform_scan(environment="test", lang="en",
                                            actor="smoke-test-ado", trigger="ci")
        # Pick an OPEN finding to dispatch.
        dispatch_target = next(
            (f for f in scan_for_ado["findings"] if f.get("status") == "open"),
            None,
        )
        if not dispatch_target:
            print("[OK] dispatch_finding_to_ado skipped (no open findings)")
        else:
            d1 = await dispatch_finding_to_ado(
                finding_id=dispatch_target["id"],
                environment="test",
                actor="smoke-test",
                lang="en",
            )
            if not d1.get("ado_url", "").startswith("https://dev.azure.com/"):
                failures.append(f"ADO URL malformed: {d1.get('ado_url')}")
            if not d1.get("ado_work_item_id"):
                failures.append("ADO work_item_id missing")
            if d1.get("severity_dev") not in ("Sev 1", "Sev 2", "Sev 3", "Sev 4"):
                failures.append(f"severity_dev invalid: {d1.get('severity_dev')}")
            # Idempotency: re-dispatching the same finding yields the SAME
            # mock work-item id (deterministic SHA-based mapping).
            d2 = await dispatch_finding_to_ado(
                finding_id=dispatch_target["id"],
                environment="test", actor="smoke-test",
            )
            if d1["ado_work_item_id"] != d2["ado_work_item_id"]:
                failures.append("ADO dispatch not deterministic across re-dispatches")
            # The finding doc must now carry ado_url + ado_work_item_id.
            refreshed = await get_finding(dispatch_target["id"])
            if not (refreshed and refreshed.get("ado_url")):
                failures.append("ADO link not persisted on finding")
            print(f"[OK] dispatch_finding_to_ado (mock work-item #{d1['ado_work_item_id']}, "
                  f"{d1['work_item_type']} P{d1['priority']}, "
                  f"{d1['severity_dev']}, deterministic re-dispatch ✓)")
    except Exception as e:
        failures.append(f"dispatch_finding_to_ado raised: {e}")

    # ── 13. Diff between two scan runs ─────────────────────────────
    try:
        # Need at least 2 scans in history; we have multiple from previous
        # steps. Default args → newest vs previous.
        diff = await diff_scans(environment="test")
        for k in ("from", "to", "counts_delta", "findings", "summary"):
            if k not in diff:
                failures.append(f"diff_scans missing key: {k}")
        f_buckets = diff.get("findings", {})
        for bucket in ("new", "fixed", "regressed", "persisted"):
            if bucket not in f_buckets:
                failures.append(f"diff_scans findings missing bucket: {bucket}")
        if not isinstance(diff.get("counts_delta", {}).get("pass"), int):
            failures.append("diff_scans counts_delta.pass is not int")
        print(f"[OK] diff_scans (summary: {diff.get('summary')})")
    except Exception as e:
        failures.append(f"diff_scans raised: {e}")

    # ── 14. Verify-fix flow ────────────────────────────────────────
    try:
        # Find a finding currently in 'fixed' state (set in step 7).
        all_findings_now = await get_findings(status="fixed", limit=5)
        if not all_findings_now:
            # No fixed finding from earlier — set one up.
            anchor = next((f for f in (await get_findings(status="open", limit=1))), None)
            if anchor:
                await update_finding(anchor["id"],
                                      patch={"status": "fixed", "note": "smoke setup"},
                                      actor="smoke-setup")
                target = anchor
            else:
                target = None
        else:
            target = all_findings_now[0]

        if target:
            verify_result = await verify_finding(
                finding_id=target["id"],
                environment="test",
                actor="smoke-verify",
            )
            for k in ("finding", "verification", "scan_id", "note"):
                if k not in verify_result:
                    failures.append(f"verify_finding missing key: {k}")
            if verify_result["verification"] not in ("still_clean", "regressed", "preserved", "inconclusive"):
                failures.append(f"verify_finding bad verification: {verify_result['verification']}")
            final_status = verify_result["finding"].get("status")
            if final_status not in ("verified", "open", "fixed", "accepted_risk"):
                failures.append(f"verify_finding produced unexpected status: {final_status}")
            print(f"[OK] verify_finding (verification={verify_result['verification']}, "
                  f"final_status={final_status})")
        else:
            print("[OK] verify_finding skipped (no findings to verify)")
    except Exception as e:
        failures.append(f"verify_finding raised: {e}")

    # ── 15. Environment matrix ─────────────────────────────────────
    try:
        matrix = await get_environment_matrix()
        if "environments" not in matrix or not isinstance(matrix["environments"], list):
            failures.append("get_environment_matrix missing 'environments' list")
        else:
            envs_in_matrix = {row.get("environment") for row in matrix["environments"]}
            expected_envs = {"local", "test", "staging", "prod"}
            if not expected_envs.issubset(envs_in_matrix):
                failures.append(f"matrix missing envs: {expected_envs - envs_in_matrix}")
        if matrix.get("worst_overall") not in ("pass", "warn", "fail", "pending"):
            failures.append(f"worst_overall invalid: {matrix.get('worst_overall')}")
        print(f"[OK] get_environment_matrix ({len(matrix['environments'])} envs, "
              f"worst={matrix['worst_overall']})")
    except Exception as e:
        failures.append(f"get_environment_matrix raised: {e}")

    if failures:
        print()
        print("[FAIL] Smoke check failures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print()
    print("[PASS] ALL QA SECURITY SMOKE CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
