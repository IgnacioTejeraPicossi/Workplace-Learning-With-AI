# Robomind Clinic — AI_NM_2026 Demo Guide

**"From Prompts to Proof: Verifiable AI Systems for the Real World"**

## Quick run (for judges / evaluators)

1. **Backend** (from repo root):
   ```bash
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend**:
   ```bash
   cd frontend && npm start
   ```
3. Open **http://localhost:3000** → navigate to **Robomind Clinic** (Enhanced).

Optional: MongoDB for persistence (screenings, therapies, dashboard). Without it, metrics/trends may be empty; screening and therapy still work.

---

## 1‑minute UI demo

1. **Diagnosis** — Paste a short conversation (or JSON turns). Check **Demo mode** for reproducible results. Click **Quick Screen** → see composite score, axis scores, top flags.
2. **Therapy** — Click **Treat confabulation** (or another issue). Review the generated plan (protocol, steps, guardrails). In **Apply therapy to a prompt**, type e.g. `Summarize this document.` → **Apply therapy** → copy the augmented prompt (for use in your LLM).
3. **Dashboard** — See total screenings, top pathologies, axis distribution, therapy uplift (if post-screenings were recorded). **Last 7 days** appears after running the daily metrics job once.

---

## Key API endpoints (competition)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/robomind/screen` | Screening (send `turns`, optional `X-Demo-Mode: true`) |
| POST | `/api/robomind/therapy` | Generate plan (returns `plan` + `therapy_id`) |
| POST | `/api/robomind/apply` | Apply plan to prompt → `injected_prompt` |
| GET | `/api/robomind/dashboard/metrics` | Totals, uplift |
| GET | `/api/robomind/dashboard/trends?days=7` | Daily snapshots |
| GET | `/api/robomind/export?format=json` | Export for audit |
| GET | `/api/robomind/settings/policies` | Policy (thresholds, overrides) |

---

## Features to highlight

- **10 detectors** (epistemic, cognitive, alignment, tool_interface, revaluation, etc.).
- **Policies:** allow / review / block by composite; overrides per module/workflow.
- **Therapy uplift:** pre/post composite stored; dashboard shows “Is it getting better?”.
- **Export:** CSV/JSON with case metadata and decision outcome.
- **Demo mode:** same input → same output (cached) for stable demos.

---

*AI_NM_2026 — Ignacio Tejera*
