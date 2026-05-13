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
)


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
