# For evaluators — Robomind Clinic (AI_NM_2026)

**Project:** Workplace Learning With AI — Robomind Clinic  
**Competition:** AI_NM_2026  
**Working title:** *"From Prompts to Proof: Verifiable AI Systems for the Real World"*

---

## What this is

Robomind Clinic is a module for **diagnosing and treating AI pathologies** (confabulation, dissociation, repetition, alignment drift, etc.). It screens conversation turns, computes risk scores and flags, generates therapy plans, and can augment prompts before they are sent to an LLM. It supports policies (allow / review / block), export for audit, and therapy uplift tracking.

---

## How to run (quick)

1. **Backend** (from repository root):  
   `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
2. **Frontend:**  
   `cd frontend && npm start`  
   Then open **http://localhost:3000** and go to **Robomind Clinic** (Enhanced).
3. **MongoDB** is optional; without it, screening and therapy work, but dashboard metrics/trends may be empty.

Full step-by-step and 1‑minute demo script: **[ROBOMIND_AI_NM_2026_DEMO.md](ROBOMIND_AI_NM_2026_DEMO.md)**.

---

## API coverage (Run Tests)

The app includes **Run Tests → Run API Tests**, which hits all Robomind Clinic endpoints (enhanced and legacy):

- **Enhanced:** `POST /screen`, `POST /therapy`, `POST /apply`, `GET /dashboard/metrics`, `GET /dashboard/trends`, `GET /settings/policies`, `GET /export`, `POST /therapy/{id}/record-post`, `POST /admin/daily-metrics`, `POST /admin/retention-cleanup`, `PUT /settings/policies/workflow/{key}`, `GET /cases/{id}`.
- **Legacy clinic:** `GET /health`, `GET /disorders`, `GET /therapy-patches`, `POST /diagnose`.

From the UI: **Run Tests** in the sidebar → select **Run API Tests** → **Start API Tests**. Results show Passed / Expected Fail (e.g. record-post with placeholder id) / Failed.

---

## Export (for audit)

- **JSON:**  
  `GET http://localhost:8000/api/robomind/export?format=json`  
  Returns screenings with `id`, `created_at`, `composite`, `decision_outcome`, `module_id`, `workflow_id`, `top_flags_types`, `evidence_count`.
- **CSV:**  
  `GET http://localhost:8000/api/robomind/export?format=csv`  
  Same data in CSV. Optional query: `from_date=...&to_date=...` (ISO format).

---

## Summary for scoring

| Aspect | What we offer |
|--------|----------------|
| **Verifiability** | Demo mode (same input → same output); export with case metadata and decision outcome. |
| **Detection** | 10 rule-based detectors across epistemic, cognitive, alignment, tool_interface, revaluation axes. |
| **Governance** | Policies (allow/review/block by composite); overrides per module/workflow; optional webhook alerts. |
| **Improvement** | Therapy uplift: pre/post composite stored; dashboard “Is it getting better?”. |
| **Testing** | Automated contract tests (pytest); Run API Tests in UI; deterministic demo flow. |

---

*Ignacio Tejera — AI_NM_2026*
