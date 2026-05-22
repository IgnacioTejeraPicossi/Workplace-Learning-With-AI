# AGI Progress · Homo Sapiens vs. KI i Test — Feedback Trilogy Roundup

**Date**: 2026-05-22
**Versions covered**: 1.15.1 (Option A · log-only feedback) + 1.15.2 (A → C bridge)
**Module**: AGI Progress Hub, 4th tab "Homo Sapiens vs. KI i Test"
**Outcome**: Three feedback flavours (A + B + C) are now shipped AND interconnected. No remaining items on the "Future improvements" parking lot for this module.

---

## Why this document exists

The workshop's `Future improvements` footer parked three design flavours for a per-round feedback loop since Pack 3. Two were shipped progressively (B in Pack 3, C as Phase E in 1.9.0). The third (A) and the bridge between A and C landed in two consecutive releases on 2026-05-22. This document records the closure of that parking lot so future contributors don't re-open the design discussion.

It also documents the **interconnection** between A + B + C — which is non-obvious from reading the code alone.

---

## What was deferred · what shipped · what stays deferred

| Item | Status | Where |
|------|--------|-------|
| **A · Log-only feedback** — `{task, text, timestamp, actor, context}` entries persisted; no prompt change. Exported with the round log for manual review after the workshop. | ✅ **Shipped 1.15.1** | `homo_vs_ai_feedback_log_collection` + `log_feedback_note(...)` + JSON export endpoint + UI panel |
| **B · Ephemeral injection** — "Re-run with feedback" button sends previous answer + critique back to the model for a second attempt, same round only. Base prompt untouched. | ✅ Shipped Pack 3 (pre-1.15) | `run_challenge(previous_ai_output, human_feedback)` |
| **C · Persistent prompt evolution** — Feedback drives LLM #2 proposing a system-prompt diff; human approves in governance panel; revisions versioned in Mongo with audit log + rollback + regression harness. | ✅ Shipped Phase E (1.9.0) | `backend/services/prompt_evolution.py` + `/prompt-evolution/*` routes |
| **A → C bridge** — promote a historical log entry directly to a Phase E revision proposal, no re-typing. | ✅ **Shipped 1.15.2** | `user_input` field in log entries + Review & promote panel + reuses `/prompt-evolution/propose` |
| Full ISTQB cloud RAG (Option B for the RAG design) | ❌ Rejected (legal) | Per Item tender — ISTQB syllabi distribution license is restrictive; cloud chunks would be murky |
| Embedding-based local RAG upgrade | ⏸ Deferred (deliberate) | Current BM25 design favours fewer moving parts + deterministic offline index |

---

## The trilogy, interconnected

```
                       Workshop host writes feedback
                                 │
                                 ▼
                ┌─────────────────────────────────┐
                │  Three operator-driven actions  │
                └─────────────────────────────────┘
                          │      │      │
            ┌─────────────┘      │      └────────────────┐
            ▼                    ▼                       ▼
   📝 Save as note      🔁 Re-run with feedback    🧬 Propose revision
       (Option A)             (Option B)              (Option C)
            │                    │                       │
            │   auto-log         │  auto-log             │
            └─►─ context:        ├─►─ context:           ├─►─ context:
                "manual-note"    │   "ephemeral-rerun"   │   "proposal-trigger"
                                 │                       │
                                 ▼                       ▼
                       LLM (ephemeral re-run)   LLM #2 (meta-prompt)
                                                         │
                                                         ▼
                                               status=pending revision
                                                         │
                                              ┌──────────┴──────────┐
                                              │  Phase E governance │
                                              │  panel: human gate  │
                                              └──────────┬──────────┘
                                                         │
                                                ┌────────┴────────┐
                                                ▼                 ▼
                                            approve            reject
                                          (active)           (archived)


           ┌───────────────────────────────────────────────────┐
           │   Workshop end (or any time later):               │
           │     export JSON / Review & promote panel          │
           └───────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │  homo_vs_ai_feedback_log │
                  │  (Mongo + in-memory      │
                  │   fallback)              │
                  └─────────────┬───────────┘
                                │
                  Curator picks a great note (cold review):
                                │
                                ▼
                  🧬 Promote to revision (1.15.2 BRIDGE)
                                │
                                ▼
                       Identical to live C path
```

---

## Implementation summary

### 1.15.1 — Option A · Log-only feedback

**Files**: 8 modified, 1 created.

**Backend**:
- `backend/db.py` — new `homo_vs_ai_feedback_log_collection`.
- `backend/services/homo_vs_ai_service.py` — `log_feedback_note(...)` + `export_feedback_log(...)` with Mongo + in-memory fallback (5000 cap, sliding-window trim). SHA-1 deterministic `entry_id`. Auto-log inside `run_challenge` when `human_feedback` present.
- `backend/routers/homo_vs_ai.py` — 2 new routes: `POST /feedback-log` + `GET /feedback-log/export`.

**Frontend** (`frontend/src/pages/help/agi/HomoSapiensVsAI.jsx`):
- 📝 **Save as note** button beside Re-run + Propose. Inline toast confirm; clears on textarea edit.
- Auto-log inside `proposeRevision()` (`context="proposal-trigger"`, best-effort).
- New `FeedbackLogExportPanel` near the bottom of the page — JSON download via Blob URL.
- `frontend/src/api/agiApi.js` — `logHomoVsAiFeedback` + `exportHomoVsAiFeedbackLog` helpers.

**i18n**: 9 keys × 3 locales (EN/NO/ES) under `homoVsAi.feedbackLog.*`.

**Smoke**: `backend/tests/smoke_feedback_log.py` — 8 checks.

### 1.15.2 — A → C bridge

**Files**: 7 modified.

**Backend** (additive, backward-compatible):
- `log_feedback_note(...)` gains `user_input: Optional[str]` parameter (4 KB cap).
- `FeedbackLogRequest` + `FeedbackLogEntry` Pydantic models add `user_input`.
- Auto-log in `run_challenge` now also captures `user_input`.

**Frontend**:
- `logHomoVsAiFeedback(...)` accepts `userInput`.
- `saveAsNote` + `proposeRevision` auto-log calls pass `input.trim()`.
- `FeedbackLogExportPanel` rewritten: lazy-loaded review list with per-entry 🧬 **Promote to revision** buttons. Calls `proposePromptRevision(...)` with the entry's stored fields. Per-row state machine: `idle → promoting → promoted (revision_id) | error`. Legacy entries lacking `user_input` show ⊘ Not promotable chip.

**i18n**: +13 keys × 3 locales (panel sums to 22 in `feedbackLog.*`).

**Smoke**: `smoke_feedback_log.py` extended 8 → 11 checks (user_input round-trip + promotable filter + export preserves both fields).

---

## Validation snapshot

| Gate | Before 1.15.1 | After 1.15.2 |
|------|---------------|--------------|
| `smoke_feedback_log.py` | (didn't exist) | **11/11 PASS** |
| `smoke_prompt_evolution.py` (Phase E) | 3/3 PASS | **3/3 PASS** (unchanged) |
| `/homo-vs-ai/*` routes registered | 12 | **14** (5 core + 7 Phase E + 2 feedback-log) |
| Mongo collections (workshop) | 2 (`prompt_revisions`, `prompt_audit`) | **3** (+ `feedback_log`) |
| i18n `homoVsAi.feedbackLog` keys × 3 | (didn't exist) | **22 × 3 identical** |

---

## In-memory fallback design

The `_FEEDBACK_LOG_MEM` list provides graceful degradation when Mongo is unavailable (workshop demos on a fresh laptop). Capped at 5000 entries with sliding-window trim. The export endpoint reads from BOTH Mongo and the in-memory list transparently and de-duplicates by `entry_id`.

**Trade-off**: in-memory entries evaporate on process restart. This is **by design** — the export endpoint encourages downloading the log at the end of each workshop. If a future use case requires resilient persistence without Mongo, the fallback could be a file (`/var/lib/.../workshop-feedback.jsonl`) — adding ~20 lines.

---

## Edge cases handled

1. **Empty feedback text** → `ValueError("Feedback text is empty")` from `log_feedback_note`. Route returns 400.
2. **Unknown task** → `ValueError("Unknown task '{task}'")`. Route returns 400.
3. **Duplicate (task, text, timestamp)** → same `entry_id`; safe to retry.
4. **Mongo down** → silent fallback to in-memory. No exception propagated.
5. **Legacy entry without `user_input`** (pre-1.15.2) → frontend filter classifies as non-promotable; backend `proposePromptRevision` would 400 if called anyway, so the gate is safe.
6. **Auto-log failure inside `run_challenge`** → caught + ignored. The re-run/proposal must succeed even if logging fails.
7. **In-memory cap exceeded** → trim from head (oldest first). The most recent 5000 always survive.

---

## What's NOT in scope (deferred follow-ups)

1. **Frontend filters in the review panel** — task / context / date range. The export endpoint supports filters; the panel currently loads top 200 newest. Could be added if workshops produce many entries.

2. **Bulk promote** — pick N entries → propose N revisions at once. Currently one-by-one. Phase E governance panel handles the queue afterwards.

3. **In-app revision diff preview** — clicking "Promote to revision" currently just fires-and-forgets. Could show a side-by-side preview before the propose call.

4. **Feedback log analytics dashboard** — aggregates by task / context / actor / time. Useful once N workshops produce data; not justified pre-workshop.

5. **Resilient persistence without Mongo** — file-backed in-memory fallback. ~20 lines if needed.

6. **Embedding-based RAG upgrade** — explicitly deferred since the original "Future improvements" parking lot. BM25 stays.

---

## Quick reference for future contributors

**Adding a new context tag** (e.g. `"workshop-debrief-note"`): no schema change required — `context` is free-text. Add a const to the frontend if it should appear as a tile.

**Adding a new field to log entries** (e.g. `round_id`, `judge_verdict_at_save`): extend `log_feedback_note(...)` signature, `FeedbackLogRequest` + `FeedbackLogEntry` Pydantic models, and the smoke test. Field should be Optional + default to None for backward compat with existing entries.

**Triggering an auto-log from a new code path**: import `log_feedback_note` and call it inside a `try / except: pass` block. Pass at minimum `task` and `text`; populate `user_input` + `previous_ai_output` whenever you have them (otherwise the entry won't be promotable to Phase E).

**Reading the log programmatically**: `await export_feedback_log(task=..., since=..., limit=...)` returns the canonical shape.

**The skill section that informed this work**: none — the AGI Progress module pre-dates the `enonic-xp` skill. The trilogy A+B+C design is documented in the workshop's own `Future improvements` footer (now updated in 1.15.1 to mark Option A as shipped).
