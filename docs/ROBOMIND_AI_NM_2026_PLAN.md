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

### A2) Demo mode (deterministic behavior)

- **Cursor:** Add a “demo mode” (e.g. query param or header or config):
  - Rule-based detectors always run.
  - LLM judge only if enabled; in demo mode use fixed seed/temperature or cached result by hash of turns.
- **You:** Same payload twice in demo mode → identical scoring.

### A3) Data retention + privacy defaults

- **Cursor:** Add retention configuration (e.g. keep raw turns N days, aggregated metrics longer) and an “anonymize PII” option (simple regex scrub for emails, phones, IDs); store scrubbed output when toggle is on.
- **You:** Verify scrubbed data in Mongo when anonymize is on.

---

## 5. Milestones B–D (summary)

- **B:** Add 6–8 Tier 1 detectors (Falsified Introspection, Tool-Interface Decontextualization, Spurious Pattern Hyperconnection, Cross-Session Context Shunting, Goal-Genesis Delirium, Value Drift, etc.); structured meta-judge JSON; one positive + one negative test case per new detector.
- **C:** Per-workflow/per-module policy overrides in Settings; alerting (e.g. critical risk, repeated high-risk); `GET /api/robomind/export?from=...&to=...&format=csv|json` with case metadata, findings, therapies, decision.
- **D:** Store “before”/“after” scores when therapy is applied; compute uplift; daily aggregation job for `robomind_metrics_daily`; dashboard polish (“What’s happening?”, “Where?”, “Is it getting better?”).

---

## 6. What I Need From You Next

1. **Confirm** that we start with **Milestone A** (A1 → A2 → A3 in that order), or tell me if you prefer another order (e.g. A1 only first).
2. **Clarifications (optional):**  
   - Which router should the app “canonically” use for the competition — only **enhanced** (`/api/robomind/*`), or should legacy and enhanced both stay and we just add tests for both?  
   - Do you already have a README section (or file) with: how to run backend/frontend, env vars, folder layout? If yes, point me to it so tests and docs stay aligned.

Once you confirm, the next step is **A1: add the automated test suite** for the enhanced API and contract validation.

---

*Ignacio Tejera — February 2026 — AI_NM_2026*
