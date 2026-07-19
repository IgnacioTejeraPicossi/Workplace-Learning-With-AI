# Self-Correcting AI Loop — Agent Plan

**Status**: V0 shipped (1.26.0, 2026-07-19) — reference content + interactive Loop Builder.
**Sidebar**: Future Item Agents, after the Self-Simulating Reality Agent (`🔄 Self-Correcting AI Loop`).
**Route**: `App.jsx` section `self-correcting-loop` → `SelfCorrectingLoop.jsx`.

## Origin

Adapted and **paraphrased** from "How to Build a Self-Correcting AI Loop That
Catches Its Own Mistakes Before You See Them" by **@cyrilXBT** (X). The original
wording is not reproduced; concepts are summarized for learning. This was the
second of two X pieces the repo owner flagged (the first became the "Voices on
AGI" tab in the AGI Progress Hub, 1.25.0). The owner chose to make this one a
standalone agent rather than a tab, because it is an actionable methodology, not
a reading feed.

## Why an agent (not a tab)

The Builder / Judge / Manager pattern is a reusable engineering discipline. The
**Loop Builder** tab makes it interactive — the user picks a task type and gets
copyable scaffolds — which is what justifies a dedicated agent over static docs.
It also mirrors what the repo itself does during audits: generate → verify
against real ground truth → iterate → stop on hard logic.

## Structure (V0)

Shell `SelfCorrectingLoop.jsx` (teal/emerald hero to distinguish from the
purple Self-Sim agent) + 6 tabs under `frontend/src/self-correcting-loop/`:

1. **Overview** (`Overview.jsx`) — the shift from "you are the verification
   layer" to the system checking itself; why it isn't "just asking twice".
2. **The Three Roles** (`ThreeRoles.jsx`) — Builder / Judge / Manager, plus the
   core principle: verification must reference something outside the Builder.
3. **Handoffs & Stops** (`HandoffsStops.jsx`) — the 3 handoff properties, a
   structured handoff template, ground truth per domain, and the 3-part stop
   condition (max iterations / measurable threshold / cost ceiling).
4. **Worked Examples** (`WorkedExamples.jsx`) — content production + code loops
   side by side, and the shared skeleton.
5. **Test & Scale** (`TestAndScale.jsx`) — the 4 stress tests, 5 common
   mistakes, and sequential scaling guidance.
6. **Loop Builder** (`LoopBuilder.jsx`) — **interactive**. Task-type selector
   (writing / code / research / custom) → generated Builder / Judge / Manager
   scaffolds + a shared stop-condition block, each copy-to-clipboard. Plus a
   "where to start this week" checklist.

Scaffold templates live in `_templates.js` as English constants (prompt
artifacts with `[PLACEHOLDERS]` the user edits — English is intentional). All
UI chrome is localized.

## i18n

New namespace `selfCorrectingLoopModule.json` (registered in `i18n/index.js`,
merged into `common`). **123 keys × 3 locales (EN/NO/ES) at exact parity.**
Sidebar label `sidebar.selfCorrectingLoop` in `common.json` ×3.

## Constraints honored

- **Copyright**: content paraphrased, not reproduced; clear source note crediting
  @cyrilXBT in the footer of every tab view.
- **No backend / CI-safe**: entirely client-side (the Loop Builder uses only the
  browser clipboard API), so nothing to test server-side and no CI impact.

## V1 (shipped 1.26.1) — "Customize with AI"

The Loop Builder can now tailor the scaffold to a specific task:
- Backend `services/self_correcting_loop.py` + `routers/self_correcting_loop.py`
  → `POST /api/self-correcting-loop/customize` (task_type, task_description, lang).
- `ask_ai_unified` with JSON output; deterministic fallback injects the user's
  task into a generic scaffold (`is_mock: true`) when no LLM. System prompt steers
  the Judge to the correct ground truth per task type; stop block forced to hard
  logic.
- Frontend: task textarea + "Customize with AI" button + result panel with
  AI-tailored / Generic-fallback badge; degrades to the local generic scaffold if
  the backend is unreachable.
- 4 offline contract tests, added to CI (now 5 files / 74 tests).

## Possible V2+ (not built)

- A **saved loops** library (Mongo), same best-effort pattern as the Cybersecurity
  persistence (1.24.1).
- A **live demo**: run a toy Builder/Judge/Manager loop against a sample task in
  the browser to show the cycle and a stop condition firing.
