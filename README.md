# 🤖 AI-Powered Workplace Learning Platform

**Workplace Learning With AI (WLWAI)** is a portfolio project focused on **automatic testing, AI-assisted validation, agentic workflows, and LLM-enabled product experimentation**. It combines FastAPI, React, MCP, Postman, and structured AI pipelines to explore how modern AI systems can be tested, debugged, integrated, and improved in real-world scenarios.(Test Manager)

---

## 🎯 Portfolio Focus

- **Automatic testing**: API validation, MCP testing flows, reproducible diagnostics, and troubleshooting-first workflows.
- **Applied AI engineering**: prompt iteration, LLM orchestration, agentic workflows, and structured analysis pipelines.
- **System integration**: FastAPI backend, React frontend, MongoDB, n8n, OutSystems bridges, and MCP-compatible tooling.
- **Experimentation mindset**: fast feedback loops for debugging, validation, prompt refinement, and AI behavior analysis.

---

## 🚀 What This Demonstrates

- **AI + testing together**: not just building AI features, but validating and debugging them systematically.
- **MCP and tool interoperability**: testing AI tools through STDIO/HTTP bridges and client workflows such as Postman.
- **LLM-enabled product workflows**: document analysis, prompt management, evaluation loops, and agent-oriented interfaces.
- **Practical full-stack delivery**: backend APIs, frontend components, integration docs, and testing guidance in one repository.

---

## 📚 Core Capabilities

| Area | Highlights |
|------|------------|
| **Testing & Validation** | MCP server, Postman testing flows, validation docs, troubleshooting workflows |
| **AI & Agents** | AgentOps Studio, Repository Analyzer, Document Analyzer, Agentic RAG, AI Study Buddy |
| **Workplace Learning** | AI concepts, micro-lessons, recommendations, scenario simulator, certifications |
| **Enterprise & Operations** | EA Second Brain (Portfolio, Impact Scoring, Heatmap, Deprecation Radar, Ask), Process Designer, Catalog Manager |
| **Cloud Deployment** | Cloud Install workbench, readiness score, deploy checklist, automated smoke tests, cost baseline, Dockerfile + Cloud Run config |
| **Security Center** | 6-module platform security & privacy: local encryption (AES-GCM 256), automatic data deletion, user data control & export, PII anonymization, dynamic security score, real-time event monitoring |
| **Cybersecurity** | 10-tab security platform: threat library, real vulnerability scanning, NIST CSF 2.0 posture, compliance tracker, secure coding coach, incident drills, knowledge base, agent security monitor |
| **QA & Test Automation** | Red Cross Web QA Agent (20 tabs / 33 endpoints): Playwright + Cypress generators, Skjemabygger + Fundy forms QA, content migration audit, Enonic-specific perf, Designsystemet (Digdir) compliance, role permission matrix, **Azure DevOps work-item bundle**, **Sprint Report generator**, **DPIA / DoD verifier / Resilience / UAT-støtte / Risk Matrix**, **k6 + Loadster dual load-testing** (protocol-level + browser-level) aligned to Trine Bruu's Teststrategi 30.3 |
| **Specialized AI Use Cases** | J-messages Analyzer, compliance/productivity agents, ATM V&V Test Copilot, AI experimentation |

---

## 📁 Structure

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents, mcp_bridge_server
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
├── deployment/        # Cloud deployment: Dockerfile, cloudrun.yaml (Google Cloud Run)
├── grocery_bot/       # Autonomous bot experimentation sandbox (strategy.py, bot.py)
├── websearch-backend/ # Node.js web search service
├── agentops-n8n/      # n8n workflows (Docker)
├── docs/              # All documentation (*.md), including full README
├── requirements.txt   # Python deps (root)
├── .env               # Backend env (root)
└── README.md          # This file
```

**Backend** must be run from the **repository root**:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Ports**: Backend 8000, Frontend 3000, Web Search 3001, n8n 5678 (optional), Test file server 8888 (for MCP).

---

## 📖 Documentation

**Start here if you want to understand how this project is tested and documented:**

- [docs/agents.md](docs/agents.md)
- [docs/llms.txt](docs/llms.txt)
- [docs/TESTING.md](docs/TESTING.md)

---

- **Full README** (installation, setup, all modules): [docs/README_FULL.md](docs/README_FULL.md)
- **Quick index**: [docs/README_INDEX.md](docs/README_INDEX.md) — architecture, deployment, agents, admin
- **Autonomous Bot Sandbox**: [grocery_bot/README.md](grocery_bot/README.md)
- **MCP / Postman testing**: [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md) — J-messages Analyzer via MCP or HTTP

---

## 🔄 Recent Work (2024–2026)

### Red Cross Web QA Agent (May 2026 — Teststrategi 30.3 alignment)

A 24/7 QA copilot purpose-built for the **rodekors.no** website rebuild on **Enonic XP CMS + NextJS + Designsystemet (Digdir)**. Item Agent #9, accessible from the sidebar under **Future Item Agents**.

Aligned to **Trine Bruu's Teststrategi 30.3** (Testleder, Røde Kors): **Azure DevOps** is the official test tool (§5), every finding carries the dual severity scheme `severity_dev` 1-4 + `category_ops` A-C (§8.1), test levels follow the V-model (unit / SIT / system / UAT / performance, §5), and **Fundy** is recognised as the donation-form provider (separate from the Vipps payment handoff, §3 Systemlandskap).

The agent ships as a **20-tab shell** (`frontend/src/RedCrossWebQAAgent.jsx`) with two execution modes — **Generate-only** (produces scripts/reports for Cursor / Claude Code / GitHub Actions) and **Execute-directly** (runs Playwright / Cypress / axe-core / Lighthouse / k6 in-app) — and two environments (local on `:3000`, test). Every run is fingerprinted with a SHA-256 attestation hash for traceability.

**20 tabs** (`frontend/src/red-cross-qa/*.jsx`):

| # | Tab | Purpose |
|---|-----|---------|
| 1 | 📊 Dashboard | Live quality status: total runs, pass rate, open findings, critical blockers, 11 quality gates, 16-button Quick Actions panel |
| 2 | 📋 Test Plan | LLM converts an Azure DevOps work item / user story into manual + automated + accessibility + API + regression test plan; emits `ado_work_items` with `work_item_type` (Bug / Task / Test Case), `priority` 1-4, and `test_level` (unit / sit / system / uat / performance) |
| 3 | 🎭 Playwright | Cross-browser E2E generator (9 scopes: navigation, forms, search, donation, volunteer, CMS preview, a11y smoke, visual, API mock) |
| 4 | 🌲 Cypress | Component + frontend regression generator |
| 5 | 🔌 API QA | Enonic Guillotine GraphQL + NextJS API + external integrations — 10 checks |
| 6 | 📝 CMS QA | Enonic Content Studio editor + visitor experience — 14 areas |
| 7 | 📑 Forms QA | **Skjemabygger + Fundy** audit — **21 checks** (12 base: JSON Schema, Adam Silver patterns, multi-step state, mobile keyboard, autocomplete, APIM/Dataverse prefill, ARIA live regions, error summary, **Vipps handoff**, PRG idempotency, plus 9 **Fundy** donation-provider checks). Findings carry `severity_dev` 1-4 + `category_ops` A-C |
| 8 | 📦 Content Migration | Legacy CMS → Enonic XP gradual migration audit — 8 content types (Forening / Distrikt / Aktivitet / Kontaktperson / Tjeneste-Kurs / Tema / Nyhet / Kampanje) × 10 checks (mapping, æøå chars, relations, image re-anchoring, 301 redirects, SEO, ISR invalidation, role permissions carryover) |
| 9 | ♿ Accessibility | axe-core + Lighthouse + manual checklist + screen-reader scripts (WCAG 2.2 AA) — 12 checks |
| 10 | ⚡ Performance | Core Web Vitals + **Enonic-specific perf**: Guillotine GraphQL waterfall / N+1 / over-fetch, ISR revalidation, image service, publish ack latency, bulk publish UI block, part virtualization, cache freshness — 10 checks + hot-queries table + p95 metrics |
| 11 | 🎨 Designsystemet | **Digdir Designsystemet compliance** — `@digdir/designsystemet-react` usage, tokens, typography, spacing, dark mode, brand override, version, button + form-element components — 10 checks + 0-100 compliance score + deviations panel |
| 12 | 🔐 Role Matrix | **Real authorization tests** across 6 editorial roles (Administrator / Eier / Lokal eier / Redaktør / Lokal redaktør / Bidragsyter) × 4 actions (read/edit/publish/delete) — 8 authZ checks (subtree isolation, publish guard, delete guard, role assignment guard, audit log, session expiry, privilege escalation, API authZ) |
| 13 | 🔥 Stress Test | k6 load profiles for Red Cross peaks: smoke, normal, campaign peak, **crisis spike (1,000+ VUs)**, 4-hour soak. **Phase D** adds **Loadster** as a parallel tool with a radio selector at the top — Loadster runs real browsers, so it captures **JS hydration** (`hydration_p95_ms`) and **SPA navigation cost** (`spa_nav_p95_ms`) that protocol-level k6 cannot measure (relevant for NextJS + Designsystemet front-end UX). Plus dedicated **Resilience** section (Trine §7) with `resilience_score` 0-100, breakpoint VU, recovery seconds, peak error rate, memory drift — separating *ytelse* from *resilience* |
| 14 | 🛡️ Security & Privacy | OWASP Top 10, headers, rate limits, GDPR — 13 checks (no personal data in CMS, public/non-public data separation, secrets exposure, dependency vulns, consent, etc.). Now includes a **DPIA / Privacy by Design** sub-checklist (12 GDPR Art. 25/35 checks, `dpia_score` 0-100, data register over Enonic / Fundy / Vipps / Dataverse / Okta) — differentiator for Røde Kors's sensitive volunteer data |
| 15 | 🎯 Azure DevOps | Convert findings into Azure DevOps work items (Bug / Task / Test Case) with priority pill (P1-P4), `severity_dev` (dev), `category_ops` (drift), and `test_level` badges. Also dispatch to OutSystems |
| 16 | 📈 Sprint Report | **Sprint report generator** — aggregates runs/findings/dispatches for the active sprint, computes Sev1-4 + KatA-C counts, produces a Norwegian/English narrative (Status / Identifiserte avvik / Anbefalinger) for Trine's reporting line up to Røde Kors. Now includes a **Definition of Done verifier** (Trine §6.1: functionality tested ✓ / integrations verified ✓ / known bugs documented ✓ / ready for UAT ✓) computed mechanically per work item |
| 17 | ✅ UAT Support | **NEW** — Item does not run UAT; Røde Kors does. Generates UAT scripts, per-stakeholder checklists and a sign-off form for the named stakeholders **Hilde Forslund** (Produkteier), **Trine Røsand Scheen** (Fagperson), **Astri Fretheim** (Fagperson) |
| 18 | 🎲 Risk Matrix | **NEW** — Trine §10: the matrix lives outside the strategy document. Paste CSV/JSON, agent scores each risk (probability × impact, 1-25), assigns `level` (critical / high / medium / low), maps to test suites and produces `suite_priority` + `coverage_gaps` |
| 19 | 📜 Runs | Run history with attestation hash, artifacts, screenshots |
| 20 | ⚙️ Settings | Environments, tools, **Azure DevOps** project (organization / project / area path / iteration path / tags / current sprint / sprint length weeks), payment-flow scope (Vipps), quality thresholds |

**Backend:**
- Service: `backend/services/red_cross_qa.py` — **23 suites** with mock-first graceful degradation (every function returns deterministic data when LLM unavailable). Generates `severity_dev` + `category_ops` annotations on every finding.
- Router: `backend/routers/red_cross_qa.py` — **33 routes** at `/api/red-cross-qa/*` (Phase B additions: `/run-dpia-check`, `/verify-definition-of-done`, `/run-resilience-check`, `/generate-uat-support`, `/analyze-risk-matrix`; Phase D: `/generate-loadster-script`, `/run-loadster`)
- Versioned prompts: `backend/prompts/red_cross_qa/*.md` (13 prompts: test_plan, playwright_generator, cypress_generator, api_checker, accessibility_reviewer, performance_reviewer, k6_generator, release_judge, **forms_qa**, **content_migration**, **enonic_performance**, **designsystemet**, **role_matrix**). `release_judge.md` and `test_plan.md` updated to reference Azure DevOps + Sev/Kat dual severity + V-model test levels.

**Frontend** (`frontend/src/red-cross-qa/` — 21 files: 20 tab components + shared `_PageHero.jsx`):
Inline-style design system matching the ATM V&V Test Copilot module — gradient page heros, panel cards, status chips (pass/warn/fail/pending), severity badges (critical/high/medium/low + `severity_dev` 1-4 + `category_ops` A-C).

**i18n**: Full EN / NO / ES parity (40+ top-level sections each, **534 keys per locale** after Phase D). New blocks: `dpia:` (10 keys), `dod:` (15), `resilience:` (13), `uatSupport:` (22), `riskMatrix:` (24), `stakeholders:` (3), Phase C migration provenance + WCAG version (8), Phase D Loadster tool selector (11) + 2 tab labels.

**How to use it**:
1. Backend: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` from repo root
2. Frontend: `cd frontend && npm start` → open `http://localhost:3000`
3. Sidebar → **Future Item Agents** → ❤️‍🩹 **Red Cross Web QA Agent**
4. Pick environment (`local` / `test`) and execution mode (`generate` / `execute`) in the header
5. Open any tab and click its **Run** button. Findings + recommendations + suggested test cases render inline with `severity_dev` / `category_ops` annotations; runs are persisted under the **Runs** tab with the SHA-256 attestation hash.
6. End of sprint → **Sprint Report** tab → click **Generate** for Trine's stakeholder-ready Norwegian narrative.

**Backward compatibility**: `TestPlanRequest` keeps `jira_epic` as a deprecated alias of `ado_work_item`; the MongoDB collection name `red_cross_qa_jira_dispatches_collection` is deliberately retained to avoid a DB migration. Only user-facing terminology changed.

**Validation status**: Backend imports clean (23 suites, 33 routes), end-to-end smoke test passes (`backend/tests/smoke_red_cross_qa.py` — **15 checks**: settings shape, test plan with `test_level`, ADO bundle Sev/Kat, 9+ Fundy checks, sprint report narrative, **DPIA 12 checks + dpia_score, DoD 4-point per work item, Resilience score + breakpoint VU, UAT scripts for Hilde/Trine/Astri, Risk Matrix CSV parser, WCAG 2.1/2.2 version gating, Migrert vs Nyopprettet provenance, Loadster script generator + browser-level run with hydration_p95_ms**), all 3 locales parse with parity (**534 keys × 3**), frontend production build succeeds with **0 warnings in `src/red-cross-qa/`**.

### AGI Hub — "Homo Sapiens vs. KI i Test" tab (April 2026)

Fourth tab in the AGI Progress Hub, purpose-built as a **workshop companion for SOCO** (Norwegian software-testing consultancy). Targeted at the "Homo Sapiens vs. KI" session with Ola Kleiven and Keyhan Farahaninia.

> **Sidebar change (1.7.0):** **AGI Progress** was promoted from the Help submenu to a top-level sidebar entry (immediately below **Run Test**, icon 📊) because the module outgrew the "system help" shelf — 4 tabs, AI enrichment, and a full workshop module.

Sections on a single scroll:
1. **Workshop hero** — the three SOCO reflection questions as anchors, hosts callout.
2. **Activity Matrix** — 10 canonical testing activities × 3 verdicts (🧑 Human / 🤖 AI / 🤝 Hybrid), each with rationale and confidence level.
3. **Head-to-head — 10 live rounds** (1:1 with the Activity Matrix) that hit `POST /api/agi/homo-vs-ai/challenge` and stream live AI answers next to a prewritten "human tester" panel. The ten rounds: `scenarios`, `risk`, `ambiguities`, `exploratory`, `followups`, `automation`, `testData`, `oracle`, `triage`, `accessibility`. A quick-nav chip bar lets the presenter hop to any round on the projector without scrolling.
   - **Step 0 · Problem Router** — a free-text panel at the top where the tester describes a real problem; the AI picks the best-fitting round, explains why, suggests up to 2 alternatives, and can pre-populate the selected demo's input in one click. Router prompt v2 uses a 10-rule decision rubric + 4 few-shot examples at `temperature=0.1` so routing is deterministic (e.g. "Som bruker ønsker jeg å logge inn med Google…" reliably lands on `scenarios`, not `ambiguities`).
   - **Editable human panel** — each round's prewritten answer is editable in place (Edit / Save / Clear / Restore prewritten). Participants can type their own answer before hitting Run AI. Language switches no longer overwrite an edited panel (dirty-tracked).
   - **AI Judge (advisory)** — next to the three human `+1` vote buttons, a separated **🧠 Ask AI to judge** button calls `POST /api/agi/homo-vs-ai/judge` and renders a verdict panel: verdict (🧑/🤖/🤝), confidence, per-criterion breakdown (accuracy / coverage / practical value), rationale, and a **self-preference-bias disclaimer**. The verdict is advisory only — the scoreboard only counts your vote. When the human casts a vote, the judge's verdict at that moment is attached as a snapshot and shown in the Scoreboard round log as a badge: `—` (no judge), **green `🤖 agreed`**, or **amber `🤖 said X`**.
4. **Trust framework** — 7-row decision grid ("AI excels when… / Humans excel when… / Practical rule") by dimension: context, risk, ambiguity, novelty, volume, judgement, accountability.
5. **Workshop Scoreboard** — configurable groups, round log with notes, undo, reset, JSON export. Votes from the head-to-head demos feed in automatically and now also include `task` + `aiJudge` per round, so the exported JSON is an auditable record of how often the room and the AI agreed.
6. **Speaker Crib Sheet** (collapsible, speaker-only) — 60-second opener, 4 real quotes (Bach, Kaner, Hendrycks, Amodei) with "use when" hints, 5 likely audience questions + prepared answers, and a closer.
7. **Prompt Evolution panel (Phase E, NEW)** — governance section between the Speaker Crib Sheet and the Future Improvements footer. Closes the **Option-C feedback loop** that was deliberately deferred for "silent drift" risk. When the human writes critical feedback during a re-run, a yellow **🧬 Propose persistent revision** button asks LLM #2 to suggest a permanent diff to the task's base `TASK_SPECS` prompt. The proposal lands as `status="pending"` in `homo_vs_ai_prompt_revisions` collection, with full audit log in `homo_vs_ai_prompt_audit`. The workshop host approves / rejects / runs a regression harness (3 curated samples per task scored mechanically on keyword coverage + length + markdown structure) / rolls back from the same panel. Approved revisions feed all future rounds; `run_challenge` reads from Mongo with graceful fallback to TASK_SPECS when no revision is active or Mongo is unavailable. The LLM may **refuse** unsafe revisions (returns `status: refused` with `refusal_reason` + risk flags); refusals are persisted for the audit trail. A `🧬 Evolved prompt v3` badge appears next to AI answers that used an evolved prompt.
8. **Future improvements** footnote — still a muted parking lot at the bottom. The shipped items are: **Option B** (1.8.0, ephemeral *Re-run with feedback*), **Local ISTQB PDF RAG** (1.8.0, BM25 over `docs-ISTQB/*.pdf` for ItemAI/ItemServerAI providers; cloud stays on anchors), and now **Option C — persistent prompt evolution (Phase E)** described above. **Full cloud RAG** with embeddings + vector DB remains deliberately unimplemented (ISTQB licensing is the blocker).

**ISTQB-anchored prompts (1.7.1):** every AI call in the module is now grounded in real ISTQB syllabi sections (CTFL v4.0 + CT-AI v1.0), plus a Norwegian terminology block from the official ISTQB-NO v2.4 glossary when the session runs in Norwegian. A `📚 ISTQB-anchored` badge appears on every round card, on the Problem Router result, and next to the AI Judge verdict — clicking it reveals the exact sections used. Implemented as **Option A (curated anchors)**: ~80-150 tokens per prompt, tolerant loader, compliant with ISTQB licensing (only curated short summaries live in the repo — the full PDFs stay gitignored under `docs-ISTQB/`). See `backend/data/istqb_anchors.json` + `backend/services/istqb_anchors.py`.

**Workshop iteration (1.8.0):** optional **local PDF excerpts** (`backend/services/istqb_local_rag.py`) appended to system prompts when `x-api-provider` is `itemai` or `itemserverai`; responses include `istqb_rag` metadata and the UI shows a green/amber **Local ISTQB PDF RAG** hint. **`GET /api/agi/homo-vs-ai/istqb-rag-status`** reports index health. See `docs/CHANGELOG.md` **[1.8.0]**.

Fully bilingual **EN / NO / ES** for this tab: Norwegian stays native-quality for testers; Spanish covers the same `homoVsAi.*` keys (including feedback re-run + RAG hints).

Backend: `backend/services/homo_vs_ai_service.py` + `backend/routers/homo_vs_ai.py` + `backend/services/istqb_anchors.py` + `backend/services/istqb_local_rag.py` + **`backend/services/prompt_evolution.py`** (Phase E) + **`backend/routers/prompt_evolution.py`** (Phase E) + `backend/data/regression_samples.json` (curated harness inputs, 3 per task)
- `POST /api/agi/homo-vs-ai/challenge` — run one of 10 testing rounds; optional **`previous_ai_output` + `feedback`** for ephemeral re-run; response includes `istqb_anchors: IstqbAnchor[]`, **`istqb_rag: IstqbRagMeta`** and **`prompt_source: { source: 'baked_in' | 'evolved', revision_id?, version?, approved_by?, approved_at? }`** (Phase E)
- `POST /api/agi/homo-vs-ai/route` — Problem Router (free text → best round; anchors + optional local RAG)
- `POST /api/agi/homo-vs-ai/judge` — AI Judge (advisory verdict; anchors + optional local RAG)
- `GET  /api/agi/homo-vs-ai/tasks` — discovery
- `GET  /api/agi/homo-vs-ai/istqb-rag-status` — PDF/chunk counts and retriever mode (for demos with local LM)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/propose`** — LLM #2 proposes a revised system prompt for a task; persists pending or refused (Phase E)
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/revisions`** — list with `?task=` + `?status=` filters
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/approve`** — human approval gate; supersedes prior active
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/reject`** — reject with reason (audit log)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/regression`** — runs the curated harness base vs proposed, returns side-by-side scores
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/rollback`** — re-activate a previously superseded revision
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/active/{task}`** — debug helper: resolve the currently active prompt for a task

Mongo collections (Phase E): `homo_vs_ai_prompt_revisions` (versioned prompt history, status: pending/active/rejected/superseded/refused) + `homo_vs_ai_prompt_audit` (append-only action log).

Frontend: `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` (including `IstqbBadge`, `IstqbRagHint`, feedback textarea + **Re-run with feedback**, **Phase E** `PromptEvolutionPanel` + `PromptBox` + `RegressionView` + the yellow **🧬 Propose persistent revision** button + green **🧬 Evolved prompt** badge)
Frontend API helpers: `frontend/src/api/agiApi.js` — `proposePromptRevision / listPromptRevisions / approvePromptRevision / rejectPromptRevision / rollbackPromptRevision / runRegressionHarness / getActivePromptForTask`
Tab wiring: `frontend/src/pages/help/AgiProgressPage.jsx`
Sidebar wiring: `frontend/src/Sidebar.jsx` (top-level `agi-progress` entry, group `developer`, icon `bar-chart`)
i18n: top-level `homoVsAi.*` block in **EN, NO, and ES** `common.json` (router, judge, scoreboard, future, **istqb**, demos.feedback*, **evolve.* (Phase E, 34 keys × 3 locales)**), plus `help.agiTabs.homoVsAi` and `sidebar.agiProgress`

**Smoke**: `python -m backend.tests.smoke_prompt_evolution` runs 8 checks covering `_safe_parse_json` robustness, `_score_output` determinism, `get_active_prompt` backward-compat, propose→reject state transitions, regression harness graceful degradation, router registration, and `ChallengeResponse.prompt_source` default — all without requiring Mongo (mock-first) and without requiring an LLM (auto-refusal path).

> **Running this at SOCO?** A full presenter checklist (pre-flight, 45-minute run order, what to do if the AI connection drops, post-workshop export) lives in [`docs/README_FULL.md` → Tab 4 → *How to run this in a live workshop*](docs/README_FULL.md#tab-4--homo-sapiens-vs-ki-i-test-soco-workshop-companion).

### AGI Hub — "Update with AI" (April 2026)

All three AGI Progress Hub tabs now have a non-destructive **"Update information from the web with AI"** panel. One click runs a live web search (`websearch-backend` on port 8080 → **DuckDuckGo fallback** → LLM-only best-effort) and asks the configured LLM for structured suggestions. Each suggestion is rendered as a card with **Apply** / **Dismiss** buttons — nothing is ever overwritten silently.

- **Tracker** → Apply persists via the existing `POST /api/agi/progress` (upsert), validating `sum(scores) == total`.
- **Possible Endings** → Apply is session-only; accepts `quote` (overrides a scenario's quote/attribution), `pdoom` (adds a P(doom) card), or `reference` (adds a Sources entry). All AI-applied items are tagged with an "AI" / "AI UPDATED" badge.
- **Benefits of AGI** → Apply is session-only; adds a new example bullet (with source link) to the target category.

Backend: `backend/services/agi_ai_enrich_service.py`, `backend/routers/agi_ai_enrich.py` → `POST /api/agi/ai-enrich/{tracker|endings|benefits}`
Frontend: `frontend/src/pages/help/agi/AiSuggestions.jsx` (shared panel) + per-tab wiring in `AgiTracker.jsx`, `PossibleEndings.jsx`, `BenefitsOfAGI.jsx`
i18n: `ai.*` keys (EN/NO)

### AGI Progress Hub (April 2026)

The single-page "AGI Progress Tracker" under Help was restructured into a three-tab hub (AgentOps-style) and the dataset refreshed through 2026:

- **Tab 1 — AGI Progress Tracker**: CHC-inspired framework from Hendrycks et al. (2025). Dataset expanded from 2 to **5 models**: GPT-4 (2023) 27%, GPT-5 (2025) 58%, **Claude Opus 4.6 (2025) 61%**, **Gemini 3.1 Pro (2026) 61%**, **Claude Opus 4.7 (2026) 67%**. Each model carries real benchmark notes (GPQA Diamond, MATH-500, SWE-bench Verified/Pro, ARC-AGI-2). Long-Term Memory Storage remains 0 across all current LLMs — the architectural bottleneck from the paper.
- **Tab 2 — Possible Endings for AGI**: iceberg visualization with 12 possible AGI futures across 3 zones (Surface / Shallow / Deep), with zone filter and per-scenario cards.
- **Tab 3 — The Benefits of AGI**: categorized cards (Health, Science, Education, Productivity, Accessibility, etc.) with concrete examples.
- **Backend hardening**: `DEFAULT_DATA` seed is now idempotent (upsert by model+year), so refreshing defaults no longer requires wiping MongoDB; `POST /api/agi/progress` also upserts. Dropdown/chart sync fixed on first render.

Backend: `backend/routers/agi_progress.py`
Frontend: `frontend/src/pages/help/AgiProgressPage.jsx` (tab container) + `frontend/src/pages/help/agi/{AgiTracker,PossibleEndings,BenefitsOfAGI}.jsx`
Assets: `frontend/public/images/agi-endings-iceberg.png`
i18n: `help.agiHub`, `help.agiTabs`, `help.agiProgress`, `help.agiEndings`, `help.agiBenefits` in EN/NO
Source: ["A Definition of AGI" — Hendrycks et al. (Oxford–MIT–Cornell, CAIS, Oct 2025)](https://www.agidefinition.ai/paper.pdf)

### Installing the App in the Cloud (April 2026)

New deployment planning and cloud-readiness module. Provides an interactive workbench for migrating the platform to cloud services (Vercel + Google Cloud Run + MongoDB Atlas + Firebase Auth). Located in the sidebar after "Future".

**Pack 1 — Frontend Shell (Cursor AI):**
- 4 interactive tabs: Overview, Target Architecture, Environment & Secrets, Smoke Tests & Monitoring
- Readiness score dashboard with 6 section cards and progress tracking
- Architecture flow diagram with service cards (5 services, 2 phases)
- Environment variable reference with copy-to-clipboard, secret/public/optional classification
- Manual smoke test checklist (5 layers: frontend, backend, auth, database, AI) with per-layer progress
- Troubleshooting guide with common cloud deployment issues
- Full EN/NO i18n (92 keys with perfect parity)

**Pack 2 — Backend Foundation + Cloud Hardening (Claude Code):**
- **Backend service**: `backend/services/cloud_install_service.py` — 7 deterministic methods: status (real env inspection), architecture recommendation (3 budget tiers), env template (20 variables, 6 secrets, 3 scopes), deploy checklist (26 items), smoke tests (async, hits real endpoints via httpx), cost baseline (6 items), troubleshooting (13 items, 5 categories)
- **Backend router**: `backend/routers/cloud_install.py` — 7 endpoints at `/api/cloud-install/*`
- **Typed schemas**: `backend/schemas/cloud_install.py` — 18 Pydantic models
- **Deployment artifacts**: `deployment/Dockerfile` (Python 3.11-slim, Cloud Run-ready) + `deployment/cloudrun.yaml` (Knative spec, scale 0-3, probes, Secret Manager refs)
- **Cloud-readiness fixes**: CORS via `ALLOWED_ORIGINS` env var, `MONGO_URI` env var support, `/health` enhanced, `/ready` endpoint with MongoDB ping
- **Frontend-backend connection**: All 4 tabs connected to real backend with graceful fallback if offline
  - CloudOverview → `GET /api/cloud-install/status` (live readiness score)
  - CloudTargetArchitecture → `POST /recommend-architecture` + `GET /cost-baseline` (cost panel, deployment order)
  - CloudEnvSecrets → `POST /generate-env-template` (live stats banner, backend-sourced variables)
  - CloudSmokeTests → `POST /run-smoke-tests` (automated test runner) + `GET /troubleshooting` (live items with severity)

Backend: `backend/routers/cloud_install.py`, `backend/services/cloud_install_service.py`, `backend/schemas/cloud_install.py`
Frontend: `frontend/src/cloud-install/` (5 components: InstallingAppInCloud, CloudOverview, CloudTargetArchitecture, CloudEnvSecrets, CloudSmokeTests)
Deployment: `deployment/Dockerfile`, `deployment/cloudrun.yaml`
i18n: 92 keys EN/NO with full parity

### EA Second Brain Agent (April 2026)

Full implementation of the Enterprise Architecture Second Brain agent based on Ketil's OutSystems-oriented vision documents. Portfolio management, impact scoring, technology heatmap, deprecation radar, AI-powered insights, and natural-language queries.

- **Portfolio CRUD**: Create/edit/delete portfolio items with technology stacks, criticality levels (1-5), lifecycle statuses, and EOL tracking
- **Impact Scoring**: Ketil 6.0 formula — `ImpactScore = 0.40 * Relevance + 0.30 * Criticality + 0.20 * Freshness + 0.10 * Risk`
- **Technology Heatmap**: Aggregation pipeline showing tech usage counts and risk levels
- **Deprecation Radar**: EOL tracking sorted by urgency
- **AI-Powered Insights**: LLM-generated insights with portfolio context, status workflow (New → Acknowledged → In Progress → Resolved/Dismissed)
- **Natural Language Queries**: Ask questions about the portfolio, get structured answers with confidence scores
- **Dashboard**: 6 stat cards, Today's Insights, Deprecation Radar, Tech Heatmap, Lifecycle Distribution, Quick Actions
- **Seed Data**: 8 Norwegian portfolio items, 6 watchlist items, 5 source feeds, 7 realistic insights

Backend: `backend/services/ea_second_brain.py` (~500 lines), `backend/routers/ea_second_brain.py` (24 endpoints at `/api/ea-brain/*`), `backend/models/ea.py` (15+ Pydantic models)
Frontend: `frontend/src/EASecondBrain.jsx` + `frontend/src/ea-agent/` (5 tab components: Dashboard, Insights, Portfolio, Ask, Settings)
Seed: `backend/scripts/seed_ea_brain.py` — run with `python -m backend.scripts.seed_ea_brain`
MongoDB: 4 collections (`ea_portfolio_items`, `ea_watchlists`, `ea_source_feeds`, `ea_insights`)
i18n: 172 keys EN/NO with full parity

### ATM V&V Test Copilot (April 2026)

New agent module implementing an AI-powered testing copilot for safety-critical Air Traffic Management (ATM/ATC) verification & validation workflows. Located in the sidebar under "Future Item Agents".

- **Overview Dashboard**: Live stats, backend health indicator, interactive Quick Actions, and clickable scenario category grid (navigates to Scenario Builder with the selected type pre-loaded)
- **Requirement Lab**: Ingest requirements (6 source types), AI-normalize into intent/conditions/constraints/expectedBehavior, then generate structured test designs with positive/negative/edge case tests, automation candidates, and open questions
- **Scenario Builder**: Generate ATM scenario matrices for 7 scenario families (conflict detection, sector handover, trajectory update, degraded surveillance, conformance monitoring, alert timing, contingency fallback) with configurable risk levels and custom parameters
- **Run Analyzer**: Upload test run artifacts (logs, JSON, XML, console output), AI-diagnose failures with severity proposals, root cause analysis (with confidence levels), affected areas, and suggested next steps
- **Export**: Markdown export for test designs and scenario matrices
- **Pre-loaded examples**: Seed script with 13 realistic ATM/ATC examples (5 requirements, 3 test designs, 3 scenario matrices, 2 test run analyses) based on EUROCAE ED-153, DO-278A, and EUROCONTROL STCA specs

Backend: `backend/services/atm_copilot.py`, `backend/routers/atm_copilot.py` (17 endpoints at `/api/atm-copilot/`)
Frontend: `frontend/src/AtmVvTestCopilot.jsx` + `frontend/src/atm-copilot/` (4 tab components)
Seed: `backend/scripts/seed_atm_examples.py` — run with `python -m backend.scripts.seed_atm_examples`
MongoDB: 4 collections (`atm_requirement_bundles`, `atm_test_designs`, `atm_scenario_matrices`, `atm_test_runs`)
i18n: 120+ keys EN/NO with full parity
Docs: `docs-md/Readme ATM Agent.md` (standalone) | `docs/ATM VV Test Copilot.docx` | `Presentation/ATM_VV_Test_Copilot_Presentation.pptx`

### Babel Library AI Intelligence (April 2026)

Complete 4-phase AI roadmap implemented for the Babel Library module:

- **Phase 1 — Intelligent Classification**: LLM-powered classification (11 domains, 3 difficulty levels), automatic tagging, sentence-transformer embeddings (384d), and hybrid search (semantic 60% + keyword 40%)
- **Phase 2 — Personalized Recommendations**: User interaction tracking with time-decay, learning profiles, 4-signal recommendation engine (mastery gap, interest, type/difficulty, freshness), and AI-generated learning paths
- **Phase 3 — AI Content Generation**: Single LLM call per resource generates summaries with key points, 3 question types (multiple choice, true/false, open-ended) with interactive show/hide answers, and adaptive learning hints (prerequisites, next steps)
- **Phase 4 — Predictive Intelligence**: Trend analysis with momentum indicators, demand vs supply forecasting, per-user knowledge gap detection, and network expertise distribution — all pure data aggregation, no LLM calls

Backend: `backend/services/babel_intelligence.py`, `babel_predictive.py`, `learning_profile.py`, `recommendation_engine.py`
Routers: `backend/routers/babel_intelligence.py` (13 endpoints), `learning_profile.py` (5 endpoints)
Frontend: `frontend/src/BabelLibrary.jsx` — AI search, recommendations, content panels, predictive dashboard
i18n: 313 keys EN/NO with full parity

### Cybersecurity Module (April 2026)

Full implementation of the 10-tab Cybersecurity platform across 3 sprints:
- **Sprint 1**: Posture & Risk (NIST CSF 2.0 domain scores, risk gauge) + Vulnerabilities (real npm/pip/secret scanning)
- **Sprint 2**: Compliance Tracker (22 controls, 5 frameworks, inline editing) + Secure Coding Coach (10 topics with rich lessons)
- **Sprint 3**: Incident Drills (6 scenarios with step-by-step feedback) + Knowledge Base (8 articles + AI Q&A)
- **Bugfixes**: MongoDB persistence for Agent Security, real vulnerability scanners with graceful fallback

Backend: `backend/routers/cybersecurity.py` (1499 lines) + `agent_security.py` (785 lines)
Frontend: `frontend/src/cyber/` (11 components)

### Automatic Testing and AI Validation

Recent work in this repository has focused on **automatic validation, AI-assisted debugging, and tool-driven testing of LLM workflows**.

**Highlights:**
- **MCP bridge testing**: validation of tools through STDIO ↔ HTTP flows compatible with Postman and MCP-style clients.
- **Debugging workflow**: traces, state inspection, connection troubleshooting, and reproducible diagnostics.
- **AI-assisted iteration**: fast refinement of prompts, strategies, and system behavior through short test/measure loops.
- **Structured docs for humans and agents**: `docs/agents.md`, `docs/llms.txt`, `docs/TESTING.md`.

### MCP Server / Postman (J-messages Analyzer)

The MCP bridge in `backend/mcp_bridge_server.py` translates STDIO ↔ HTTP so Postman can invoke tools such as `analyze_j_melding` and `list_j_meldinger`.

**Documented troubleshooting includes:**
- **Windows `cmd.exe` issues** when Postman starts the bridge process.
- **HTTP fallback testing** via `POST /api/mcp/j-messages/analyze`.
- **PATH verification** for `cmd.exe` on Windows environments.
- **cURL examples** and reproducible request patterns in [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).

**Test file server**: `python backend/test_mcp_server.py` on port `8888`.

---

## 🧪 Testing

- **Backend**: `pytest` where tests exist.
- **Frontend**: preserve existing component behavior.
- **MCP / API validation**: [docs/MCP_TESTING_GUIDE.md](docs/MCP_TESTING_GUIDE.md), [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).
- **Project testing docs**: [docs/TESTING.md](docs/TESTING.md).

---

*Workplace Learning With AI — Ignacio Tejera*
