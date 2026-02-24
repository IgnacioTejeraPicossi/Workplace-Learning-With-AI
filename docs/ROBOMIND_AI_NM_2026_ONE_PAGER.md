# Robomind Clinic — One-pager (AI_NM_2026)

**"From Prompts to Proof: Verifiable AI Systems for the Real World"**

---

## Objective

The next frontier of AI is not generating better answers, but **proving when and why those answers can be trusted**. Robomind Clinic is a module that **diagnoses and treats AI pathologies** (confabulation, dissociation, repetition, alignment drift, etc.) so that AI systems can be **audited, observed, and improved** — not just used.

---

## Key features

- **10 detectors** across epistemic, cognitive, alignment, tool_interface, and revaluation axes (e.g. confabulation, dissociation, repetition loops, falsified introspection, value drift).
- **Policies:** allow / review / block by composite score; overrides per module and workflow.
- **Therapy engine:** generates plans (Reality-Anchor, Memory-Stitch, Goal-Reframe) and **augments prompts** before they are sent to the LLM.
- **Therapy uplift:** stores pre/post composite when post-screening is recorded; dashboard answers “Is it getting better?”.
- **Export:** CSV/JSON with case metadata and decision outcome for auditors and judges.
- **Demo mode:** same input → same output (cached) for stable, reproducible demos.

---

## How to run

1. **Backend** (from repo root): `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
2. **Frontend:** `cd frontend && npm start` → open http://localhost:3000 → **Robomind Clinic** (Enhanced).
3. **MongoDB** optional (for persistence and dashboard trends).

**Demo:** Diagnosis → paste conversation (or JSON) → enable **Demo mode** → Quick Screen → Therapy → Treat one issue → Apply therapy to a prompt → see augmented prompt. **Export:** `GET /api/robomind/export?format=json`. **API coverage:** Run Tests → Run API Tests (all Robomind endpoints).

---

*Workplace Learning With AI — Ignacio Tejera — AI_NM_2026*
