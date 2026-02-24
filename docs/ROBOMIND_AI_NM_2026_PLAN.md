# Robomind Clinic — AI_NM_2026 Competition Plan

**Working title (Manifesto):** *"From Prompts to Proof: Verifiable AI Systems for the Real World"*

**Core idea:** The next frontier of AI is not generating better answers, but **proving when and why those answers can be trusted**.

This document connects the **Technical Manifesto**, the **ChatGPT Roadmap**, and the current **codebase** so Cursor (implementation) and you (acceptance/testing) can execute in sync.

---

## 1. Why Robomind Clinic Fits the Manifesto

| Manifesto pillar | Robomind Clinic today / roadmap |
|------------------|----------------------------------|
| **Epistemic testing** (knows what it knows? confabulation?) | ✅ Confabulation detector; roadmap: Falsified Introspection, Spurious Pattern Hyperconnection |
| **Cognitive & behavioral patterns** (repetition, contradiction, dissociation, bunkering) | ✅ Bunkering, Dissociation, OCD/Repetition, Alignment overcompliance; roadmap: expand to 12–16 detectors |
| **Alignment & goal drift** | ✅ Alignment overcompliance; roadmap: Goal-Genesis Delirium, Value Drift |
| **Security & compliance** (traceability, integrity) | Gateway + policies; roadmap: policies per workflow, alerts, exports |
| **Outcome: auditable, observable, improvable** | Screenings/therapies in MongoDB; roadmap: therapy uplift metrics, daily aggregation, export |

Robomind Clinic is the **demonstration vehicle** for “AI that can be defended — not just admired” in the Norwegian context.

---

## 2. Roadmap Overview (4 Milestones)

| Milestone | Goal | Rough timeline |
|-----------|------|----------------|
| **A — Validation & Stability** | Everything works end-to-end, reproducibly, with evidence | 1–2 weeks |
| **B — Coverage Expansion** | From 4 → 12–16 detectors; real detection breadth | 2–4 weeks |
| **C — Governance & Operations** | Policies, alerts, exports; operational safety | 2–3 weeks |
| **D — Analytics & Competition Narrative** | Dashboards, therapy uplift, evaluation pack | 2–3 weeks |

---

## 3. Current Codebase State (as of Feb 2026)

### Two API layers (both mounted)

- **Legacy clinic**  
  - `backend/clinic/router.py`  
  - `backend/clinic/service.py` → `diagnose_case(CaseIntake)`  
  - `backend/clinic/models.py` (CaseIntake, DiagnosisReport, Finding)  
  - `backend/clinic/detectors.py` (REGISTRY)  
  - **Tests:** `backend/tests/test_robomind_clinic.py` — **only** tests `diagnose_case()` with CaseIntake (no HTTP).

- **Enhanced clinic (competition API)**  
  - `backend/clinic/enhanced_router.py` — prefix `/api/robomind`  
  - Endpoints: `POST /screen`, `POST /therapy`, `POST /apply`, `GET /dashboard/metrics`, `GET /cases/{id}`  
  - `backend/clinic/schemas.py` (Turn, ScreenRequest, Flag, ScreenResponse, TherapyPlan, etc.)  
  - `backend/clinic/enhanced_detectors.py` — 4 detectors: confabulation, dissociation, repetition, alignment_overcompliance  
  - `backend/clinic/store.py` — MongoDB: `robomind_screenings`, `robomind_therapies`, `get_dashboard_metrics()`  
  - **Frontend:** `EnhancedRobomindClinic.jsx` calls these endpoints.  
  - **Tests:** **None** for the HTTP API or for enhanced_detectors.

### Gaps vs roadmap

- No automated tests that **hit** `/api/robomind/*` or validate response **contracts** (Pydantic schemas).
- `GET /cases/{case_id}` returns a stub (`"status": "not_found"`); no real case lookup.
- No “demo mode” (deterministic seed/temperature or cached-by-hash).
- No retention/anonymization (retention config, PII scrub).
- Detectors: only 4; roadmap asks for 6–8 more in Tier 1.
- No policy overrides per workflow/module in Settings, no alerts, no export endpoint.
- No “before/after” therapy uplift storage or daily metrics job.

---

## 4. Milestone A — Validation & Stability (recommended first)

**Goal:** “Everything works end-to-end, reproducibly, with evidence.”

### A1) Automated tests for enhanced API + contracts ✅ DONE

- **Implemented:** `backend/tests/test_robomind_api_contracts.py` — 13 tests covering:
  - **Enhanced API:** `POST /screen`, `POST /therapy`, `POST /apply`, `GET /dashboard/metrics`, `GET /cases/{id}`, empty turns; contract validation via Pydantic (`ScreenResponse`, `TherapyPlan`, `ApplyResponse`); sample cases (bunkering/dissociation, confabulation, healthy).
  - **Legacy API:** `POST /api/clinic/diagnose`, `GET /therapy-patches`, `GET /health`, `GET /disorders`, and 400 for empty turns; contract validation for `DiagnosisReport`.
- **Run tests (from repo root):**
  ```bash
  set PYTHONPATH=%CD%   # Windows
  set PYTHONUTF8=1
  python -m pytest backend/tests/test_robomind_api_contracts.py -v
  ```
  On Windows PowerShell: `$env:PYTHONPATH=(Get-Location).Path; $env:PYTHONUTF8="1"; python -m pytest backend/tests/test_robomind_api_contracts.py -v`
- **You:** Run the same sample cases via UI or API; confirm primary finding, evidence spans, and risk bucket when LM Studio is available.

### A2) Demo mode (deterministic behavior) ✅ DONE

- **Implemented:**
  - **Legacy** (`POST /api/clinic/diagnose`): Header `X-Demo-Mode: true` or query `?demo=1` → skips LLM meta-judge; only rule-based detectors run → deterministic report.
  - **Enhanced** (`POST /api/robomind/screen`): Same header/query → responses cached by hash of (turns + sources); same payload returns identical `ScreenResponse` (max 100 cache entries).
  - Helpers: `_demo_mode_from_request(request)` and (enhanced) `_screen_cache_key(req)` in `enhanced_router.py`; `diagnose_case(..., demo_mode=True)` in `service.py`.
- **Tests:** `test_enhanced_demo_mode_same_payload_same_response` and `test_legacy_demo_mode_same_payload_same_response` — same payload twice with `X-Demo-Mode: true` → identical JSON response.
- **You:** Same payload twice in demo mode → identical scoring (verified by tests).

### A3) Data retention + privacy defaults ✅ DONE

- **Implemented:** Retention via env `ROBOMIND_RETENTION_DAYS_RAW` / `ROBOMIND_RETENTION_DAYS_THERAPIES`; `cleanup_old_screenings(days)`, `cleanup_old_therapies(days)` in `store.py`; `POST /api/robomind/admin/retention-cleanup`. PII anonymization: `backend/clinic/pii.py` (regex scrub for emails, phones, IDs); `X-Anonymize-PII: true` or `meta.anonymize_pii`; scrubbed data stored when toggle is on.
- **Tests:** `test_enhanced_anonymize_pii_scrubs_stored_screening`, `test_retention_cleanup_contract`.
- _(Task completed; see Implemented above.)_
- **Cursor (original):** Add retention configuration (e.g. keep raw turns N days, aggregated metrics longer) and an “anonymize PII” option (simple regex scrub for emails, phones, IDs); store scrubbed output when toggle is on.
- **You:** Verify scrubbed data in Mongo when anonymize is on.

---

## 4b. Milestone B — Coverage Expansion ✅ DONE

- **B1 — Tier 1 detectors:** Added 6 detectors in `backend/clinic/enhanced_detectors.py`: `falsified_introspection_detector`, `tool_decontextualization_detector`, `spurious_pattern_detector`, `cross_session_context_detector`, `goal_genesis_detector`, `value_drift_detector`. Each returns `List[Flag]` (axis, type, span, confidence, details). `run_all_detectors` now runs 10 detectors (4 original + 6 Tier 1). Positive fixtures and test `test_enhanced_tier1_detectors_positive` in `test_robomind_api_contracts.py`; legacy confabulation test relaxed when LLM judge unavailable.
- **B2 — Meta-judge structured JSON + fallback:** In `backend/clinic/judge.py`, `_parse_judge_json_strict(txt)` parses judge output with strict schema (code, title, axis, score, confidence required; evidence/advice optional). Returns `None` on invalid JSON → fallback to `_extract_findings_fallback(txt)`. Test `test_legacy_diagnose_works_when_judge_invalid` ensures diagnose still returns valid report when judge raises or returns invalid data.

---

## 4c. Milestone C — Governance & Operations ✅ DONE

- **C1 — Per-workflow policy management:** `backend/clinic/policy.py`: global default (`threshold_block`, `threshold_review`, env `ROBOMIND_THRESHOLD_*`); `get_effective_policy(module_id, workflow_id)` merges workflow → module → global; `decide_decision(composite, policy)` → `allow` | `review` | `block`. Screen endpoint stores `decision_outcome` and uses effective policy from `meta.module_id` / `meta.workflow_id`. `GET /api/robomind/settings/policies` returns global + overrides; `PUT /api/robomind/settings/policies/{scope}/{key}` sets module or workflow override (body: `{threshold_block?, threshold_review?, ...}`).
- **C2 — Alerting:** `backend/clinic/alerts.py`: `fire_alert_if_needed(decision, composite, module_id, workflow_id, ...)` POSTs to `ROBOMIND_ALERT_WEBHOOK_URL` when decision is block or review (high composite); 1-hour debounce per module/workflow key to avoid spam. Called after each screen when decision is set.
- **C3 — Export:** `GET /api/robomind/export?from_date=...&to_date=...&format=json|csv`; `store.get_export_data(from_ts, to_ts)` returns screenings with `id`, `created_at`, `composite`, `decision_outcome`, `module_id`, `workflow_id`, `top_flags_types`, `evidence_count`. CSV or JSON response.
- **Tests:** `test_screen_stores_decision_outcome`, `test_settings_policies_get`, `test_settings_policies_put_and_override`, `test_export_contract`; C2 covered by assertion that `fire_alert_if_needed` is called with the stored decision.

---

## 4d. Milestone D — Analytics & Competition Narrative ✅ DONE

- **D1 — Therapy effectiveness (uplift):** `save_therapy_plan` stores `pre_composite` and `pre_axis_scores` from profile; returns `therapy_id`. `record_post_screening(therapy_id, post_composite, post_axis_scores)` updates the therapy doc with `post_*`, `uplift_composite` (pre − post), `uplift_axis_scores`. `POST /api/robomind/therapy/{therapy_id}/record-post` with body `{ composite, axis_scores }`. `get_uplift_stats()` returns `count_with_uplift`, `avg_uplift_composite`; included in `GET /dashboard/metrics`.
- **D2 — Daily metrics job:** `run_daily_aggregation(for_date)` aggregates screenings and therapies for one day into `robomind_metrics_daily` (total_screenings, total_therapies, axis_distribution, top_pathologies, count_therapies_with_uplift, avg_uplift_composite). `POST /api/robomind/admin/daily-metrics?for_date=...` triggers it. `get_daily_metrics(last_n_days)` returns daily snapshots.
- **D3 — Dashboard polish:** `GET /api/robomind/dashboard/trends?days=7` returns `trends` array. Frontend: dashboard shows uplift card and "Last 7 days" trends; narrative "What's happening? Where? Is it getting better?"; therapy response handles `{ plan, therapy_id }`.
- **Tests:** `test_record_post_uplift_contract`, `test_record_post_requires_composite`, `test_daily_metrics_contract`, `test_dashboard_trends_contract`; therapy contract updated for `plan` + `therapy_id`.

---

## 5. Milestones B–D (summary)

- **B:** ~~Add 6–8 Tier 1 detectors~~ (Falsified Introspection, Tool-Interface Decontextualization, Spurious Pattern Hyperconnection, Cross-Session Context Shunting, Goal-Genesis Delirium, Value Drift, etc.); structured meta-judge JSON; one positive + one negative test case per new detector.
- **C:** ~~Per-workflow/per-module policy overrides in Settings; alerting (critical risk, debounced webhook); export (JSON/CSV with case metadata, findings, decision).~~ ✅ DONE
- **D:** ~~Store “before”/“after” scores when therapy is applied; compute uplift; daily aggregation job for `robomind_metrics_daily`; dashboard polish (“What’s happening?”, “Where?”, “Is it getting better?”).~~ ✅ DONE

---

## 6. What I Need From You Next

1. **Confirm** that we start with **Milestone A** (A1 → A2 → A3 in that order), or tell me if you prefer another order (e.g. A1 only first).
2. **Clarifications (optional):**  
   - Which router should the app “canonically” use for the competition — only **enhanced** (`/api/robomind/*`), or should legacy and enhanced both stay and we just add tests for both?  
   - Do you already have a README section (or file) with: how to run backend/frontend, env vars, folder layout? If yes, point me to it so tests and docs stay aligned.

Once you confirm, the next step is **A1: add the automated test suite** for the enhanced API and contract validation.

---

## 7. E2E UI & Competition Package ✅ IN PROGRESS

### 7.1 E2E flows (UI review) ✅ DONE

- **Screening → Therapy → Apply** flow is now complete in the UI:
  - **Diagnosis tab:** Conversation input (JSON or plain text), **Demo mode** checkbox (sends `X-Demo-Mode: true` for deterministic/cached results), “Quick Screen” → composite, axis scores, top flags.
  - **Therapy tab:** If screening has top flags, “Treat &lt;type&gt;” buttons; if none, fallback buttons “Treat confabulation”, “Treat dissociation”, “Treat repetition_loop”. Generate plan → show protocol, steps, guardrails, success metrics. **Apply therapy:** textarea “Prompt to augment” + “Apply therapy” → shows “Augmented prompt (copy to your LLM)”.
  - **Dashboard tab:** Metrics, uplift card, “Last 7 days” trends.
  - **Settings tab:** Placeholder (policy API not wired; optional for later).
- **Files changed:** `frontend/src/RobomindClinic/EnhancedRobomindClinic.jsx` — state for `applyPrompt`, `injectedPrompt`, `demoMode`; Apply section with textarea + result; fallback therapy buttons when no flags; Demo mode checkbox.

### 7.2 Competition package checklist (to do)

- [ ] **Run backend from root:** `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- [ ] **Run frontend:** `cd frontend && npm start` (port 3000)
- [ ] **Optional:** MongoDB for screenings/therapies/dashboard; else metrics and trends may be empty
- [ ] **Demo:** Open Robomind Clinic → Diagnosis → paste sample turns (or JSON) → enable “Demo mode” → Quick Screen → Therapy → Treat one issue → Apply therapy with a prompt → confirm augmented prompt
- [ ] **Export:** `GET /api/robomind/export?format=json` for judges
- [ ] **One-pager / slide:** Objective, key features (detectors, policies, uplift, export), how to run

**Demo guide:** [ROBOMIND_AI_NM_2026_DEMO.md](ROBOMIND_AI_NM_2026_DEMO.md) — quick run, 1‑minute UI script, key endpoints, features to highlight.

**Run Tests:** Robomind Clinic APIs (enhanced + legacy) are included in **Run Tests → Run API Tests** (frontend); all endpoints are hit with test payloads; record-post 404 with placeholder id is shown as Expected Fail.

---

## 8. What’s left for the competition (plan)

After **E2E UI & Competition Package** (E2E flows done, Run API Tests updated), the remaining work is **operational and presentation**.

### 8.1 Acceptance & dry-run (you)

| # | Task | Notes |
|---|------|--------|
| 1 | **Run backend from root** | `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` |
| 2 | **Run frontend** | `cd frontend && npm start` (port 3000) |
| 3 | **Optional: MongoDB** | For screenings/therapies/dashboard persistence; without it, metrics/trends can be empty |
| 4 | **Demo dry-run** | Robomind Clinic → Diagnosis (Demo mode) → Quick Screen → Therapy → Treat → Apply therapy → Dashboard; confirm no errors |
| 5 | **Export check** | `GET /api/robomind/export?format=json` (e.g. from browser or Run API Tests); confirm response shape for judges |

### 8.2 Narrative & one-pager (optional, Cursor can draft)

| # | Task | Notes |
|---|------|--------|
| 6 | **One-pager / slide** | 1 page: objective (“From Prompts to Proof”), key features (10 detectors, policies, uplift, export, demo mode), how to run (backend + frontend + optional Mongo). → **[ROBOMIND_AI_NM_2026_ONE_PAGER.md](ROBOMIND_AI_NM_2026_ONE_PAGER.md)** (done). |
| 7 | **Judge handout** | Short “for evaluators” note: link to demo guide, Run Tests coverage, export URL. → **[ROBOMIND_AI_NM_2026_FOR_EVALUATORS.md](ROBOMIND_AI_NM_2026_FOR_EVALUATORS.md)** (done). |

### Documentation index (all before test)

| Document | Purpose |
|----------|--------|
| [ROBOMIND_AI_NM_2026_PLAN.md](ROBOMIND_AI_NM_2026_PLAN.md) | This plan; milestones A–D, E2E, checklist. |
| [ROBOMIND_AI_NM_2026_DEMO.md](ROBOMIND_AI_NM_2026_DEMO.md) | Quick run, 1‑minute UI demo, key endpoints, features. |
| [ROBOMIND_AI_NM_2026_FOR_EVALUATORS.md](ROBOMIND_AI_NM_2026_FOR_EVALUATORS.md) | Note for judges: what it is, how to run, Run Tests coverage, export URL, summary for scoring. |
| [ROBOMIND_AI_NM_2026_ONE_PAGER.md](ROBOMIND_AI_NM_2026_ONE_PAGER.md) | One page: objective, key features, how to run (slide/handout). |

### 8.3 Day-of checklist

- Backend and frontend running; optional MongoDB if you want full dashboard/trends.
- Demo script: 1‑minute flow (Diagnosis → Therapy → Apply → Dashboard) with Demo mode on.
- Export and Run API Tests available if judges want to see API coverage or audit data.

---

*Ignacio Tejera — February 2026 — AI_NM_2026*
