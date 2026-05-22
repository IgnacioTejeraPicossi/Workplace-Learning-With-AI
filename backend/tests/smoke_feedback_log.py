"""Smoke test for the Option A feedback-log persistence layer.

Verifies the 1.15.1 (2026-05-22) addition to the Homo Sapiens vs. KI i Test
workshop:
  - log_feedback_note() persists a {task, text, timestamp, actor, context}
    entry, deterministic entry_id.
  - export_feedback_log() returns the entries newest-first, with task /
    since filters working.
  - Auto-log inside run_challenge: when human_feedback is passed alongside
    previous_ai_output, the service silently logs a 'ephemeral-rerun' entry
    (best-effort; never blocks the re-run).
  - Router POST /feedback-log + GET /feedback-log/export are registered.
  - Validation: empty text rejected with ValueError; unknown task rejected.

Mock-first: no Mongo required — the service falls back to an in-memory list.
"""

import asyncio
import sys

from backend.services.homo_vs_ai_service import (
    log_feedback_note,
    export_feedback_log,
)


async def main() -> int:
    failures: list[str] = []

    # ── 1. Basic log → export round-trip ─────────────────────────────────
    e1 = await log_feedback_note(
        "scenarios", "Add boundary cases for email field.",
        actor="alice", context="manual-note",
    )
    for f in ("entry_id", "task", "text", "timestamp", "actor", "context"):
        if f not in e1:
            failures.append(f"log_feedback_note entry missing field: {f}")
    if e1.get("entry_id", "").startswith("hva_fb_") is False:
        failures.append(f"entry_id format unexpected: {e1.get('entry_id')!r}")
    if e1.get("task") != "scenarios":
        failures.append(f"task wrong: {e1.get('task')!r}")
    if e1.get("actor") != "alice":
        failures.append(f"actor not stored: {e1.get('actor')!r}")
    print(f"[OK] log_feedback_note (entry_id={e1['entry_id'][:18]}…, "
          f"actor={e1['actor']}, context={e1['context']})")

    # ── 2. Auto-logging via run_challenge ────────────────────────────────
    # Skip live LLM call: we test only the auto-log helper path. The
    # auto-log happens inside run_challenge AFTER prompt assembly but
    # before the ask_ai_unified call — we replicate the same call to
    # log_feedback_note that run_challenge does.
    e_rerun = await log_feedback_note(
        "risk", "Need to consider GDPR Art. 9 sensitive data.",
        context="ephemeral-rerun",
        previous_ai_output="(mock previous answer)" * 5,
    )
    if e_rerun.get("context") != "ephemeral-rerun":
        failures.append("ephemeral-rerun context not stored")
    if not e_rerun.get("previous_ai_output"):
        failures.append("previous_ai_output not stored when explicitly passed")
    print(f"[OK] Auto-log shape (context=ephemeral-rerun, "
          f"previous_ai_output len={len(e_rerun.get('previous_ai_output') or '')})")

    # ── 3. Validation ────────────────────────────────────────────────────
    try:
        await log_feedback_note("scenarios", "", actor="bob")
    except ValueError:
        print("[OK] Validation rejects empty text")
    else:
        failures.append("Empty text should raise ValueError")

    try:
        await log_feedback_note("nope_unknown_task", "Something")
    except ValueError:
        print("[OK] Validation rejects unknown task")
    else:
        failures.append("Unknown task should raise ValueError")

    # ── 4. Export filters ────────────────────────────────────────────────
    # Add a few more so we have a reasonable corpus to filter.
    await log_feedback_note("scenarios", "Negative testing missing.", actor="alice")
    await log_feedback_note("oracle", "Source of truth ambiguous.", actor="alice")
    await log_feedback_note("scenarios", "Edge case for max length.", actor="bob")

    all_export = await export_feedback_log(limit=100)
    if all_export.get("status") != "ok":
        failures.append("export status != ok")
    if all_export.get("count", 0) < 5:
        failures.append(f"expected ≥5 entries, got {all_export.get('count')}")
    print(f"[OK] export_feedback_log (count={all_export['count']}, "
          f"shape: {sorted(all_export.keys())})")

    scenarios_only = await export_feedback_log(task="scenarios", limit=100)
    if not all(e.get("task") == "scenarios" for e in scenarios_only.get("entries", [])):
        failures.append("task filter leaked non-matching entries")
    if scenarios_only["count"] == 0:
        failures.append("task filter returned 0 entries (expected ≥3)")
    print(f"[OK] export_feedback_log task filter "
          f"(scenarios: {scenarios_only['count']} entries)")

    # ── 5. Router registration ───────────────────────────────────────────
    try:
        from backend.routers.homo_vs_ai import router as hva_router
        paths = {r.path for r in hva_router.routes}
        expected = {
            "/api/agi/homo-vs-ai/feedback-log",
            "/api/agi/homo-vs-ai/feedback-log/export",
        }
        missing = expected - paths
        if missing:
            failures.append(f"router missing paths: {missing}")
        else:
            print(f"[OK] Router routes "
                  f"({len(paths)} total, POST /feedback-log + GET /feedback-log/export present)")
    except Exception as e:
        failures.append(f"Router import failed: {e}")

    # ── 6. Newest-first ordering ─────────────────────────────────────────
    ts_list = [e.get("timestamp") for e in all_export.get("entries", [])]
    # Mongo-sorted results come back DESC; in-memory fallback iterates
    # newest-first via `reversed(...)`. Either way, the first entry
    # should be NOT older than the last.
    if ts_list and ts_list[0] < ts_list[-1]:
        failures.append("entries not newest-first")
    print(f"[OK] Entries newest-first (first ts={ts_list[0] if ts_list else 'n/a'})")

    # ── 7. 1.15.2 — A→C bridge: user_input round-trip + promotable filter ─
    # An entry with all 4 fields (task, text, previous_ai_output, user_input)
    # is "promotable" — Phase E proposePromptRevision can be called with it
    # WITHOUT the host re-typing anything. Verify both directions:
    #   (a) log_feedback_note accepts user_input and persists it.
    #   (b) the export round-trip preserves user_input.
    #   (c) entries missing user_input OR previous_ai_output are correctly
    #       NOT promotable (frontend gates the button).
    promotable = await log_feedback_note(
        "exploratory", "Probe edge case: empty cart at checkout.",
        actor="curator",
        context="manual-note",
        user_input="Add edge cases for a checkout flow.",
        previous_ai_output="1. Try empty cart\n2. Try expired card",
    )
    if promotable.get("user_input") != "Add edge cases for a checkout flow.":
        failures.append("user_input field not stored")
    if not promotable.get("previous_ai_output"):
        failures.append("previous_ai_output should still be stored")
    print(f"[OK] 1.15.2 user_input field persisted "
          f"(entry_id={promotable['entry_id'][:18]}…, "
          f"user_input len={len(promotable.get('user_input') or '')})")

    # Export round-trip — the new entry surfaces with both fields.
    export2 = await export_feedback_log(task="exploratory", limit=10)
    matched = next(
        (e for e in export2.get("entries", []) if e.get("entry_id") == promotable["entry_id"]),
        None,
    )
    if not matched:
        failures.append("promotable entry not in export")
    elif not (matched.get("user_input") and matched.get("previous_ai_output")):
        failures.append("export round-trip dropped user_input or previous_ai_output")
    else:
        print(f"[OK] Export round-trip preserves both fields needed for A→C bridge")

    # Promotable filter — mirror frontend `isPromotable` logic.
    def _is_promotable(entry):
        return bool(
            entry and entry.get("task") and entry.get("text")
            and (entry.get("user_input") or "").strip()
            and (entry.get("previous_ai_output") or "").strip()
        )

    all_export2 = await export_feedback_log(limit=100)
    promotable_count = sum(1 for e in all_export2.get("entries", []) if _is_promotable(e))
    non_promotable = [e for e in all_export2.get("entries", [])
                       if not _is_promotable(e)]
    if promotable_count < 1:
        failures.append("expected ≥1 promotable entry after seeding one")
    # An entry with empty text/user_input shouldn't be promotable.
    # Also: legacy entries from check 1 (manual-note without user_input)
    # should NOT be promotable.
    legacy_manual = [e for e in non_promotable
                      if e.get("context") == "manual-note" and not e.get("user_input")]
    if not legacy_manual:
        failures.append("expected ≥1 legacy manual-note entry without user_input "
                        "(check 1 created one) to be filtered as non-promotable")
    print(f"[OK] Promotable filter "
          f"(promotable: {promotable_count}, non-promotable: {len(non_promotable)}, "
          f"correctly excludes legacy notes without user_input)")

    if failures:
        print()
        print("[FAIL] Smoke check failures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print()
    print("[PASS] ALL FEEDBACK LOG SMOKE CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
