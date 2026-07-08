# WLWAI — Module Reference

## Module Index

| # | Module | Status | Test Coverage | Risk Level |
|---|--------|--------|---------------|------------|
| 1 | [J-messages Analyzer](#1-j-messages-analyzer) | Production | None (smoke only) | High |
| 2 | [Robomind Clinic](#2-robomind-clinic) | Production | 27/27 contract tests | Medium |
| 3 | [AgentOps Studio](#3-agentops-studio) | Active | 4/4 MCP smoke tests | Medium |
| 4 | [Prompt Manager](#4-prompt-manager) | Active | None | Medium |
| 5 | [Repo Analyzer Cursor AI](#5-repo-analyzer-cursor-ai) | Active | None | Low |
| 6 | [Enterprise Agents](#6-enterprise-agents) | Active | None | Medium |
| 7 | [Hologram Agent](#7-hologram-agent) | Experimental | None | Low |
| 8 | [Grocery Bot](#8-grocery-bot) | Sandbox | None | Low |
| 9 | [Websearch Backend](#9-websearch-backend) | Active | None | Low |
| 10 | [n8n Workflows](#10-n8n-workflows) | Optional | None | Low |
| 11 | [Installing the App in the Cloud](#11-installing-the-app-in-the-cloud) | Active | None (smoke via endpoints) | Medium |
| 12 | [EA Second Brain Agent](#12-ea-second-brain-agent) | Active | None | Medium |
| 13 | [Red Cross Web QA Agent](#13-red-cross-web-qa-agent) | Active | None (smoke via endpoints) | Medium |
| 14 | [AGI Progress Hub + Homo vs. AI Workshop](#14-agi-progress-hub--homo-vs-ai-workshop) | Active | 3/3 prompt-evolution + 11/11 feedback-log smoke | Low |
| 15 | Web Lab (1.16.0 · V0 structure only) | Active (placeholder) | None yet (V1+) | Low (V0 frontend-only) |
| 16 | Self-Simulating Reality Agent (1.18.4 · V0+V1+V2+V3) | Active (curated content + backend claim analyzer + live physics search + interactive playground) | Backend `/api/claim-analyzer/analyze` smoke via TestClient (mock + LLM paths) | Medium — philosophical/scientific companion for Observer Patch Holography; **10 tabs**: Overview · Core Concepts · OPH Mechanics · Theory Tour (8 theories incl. **Celestial Holography** + **Featured Voice Sabrina Gonzalez Pasterski**, Perimeter Institute · Simons Collaboration Deputy Director) · WiPhy Search (live queries against `wiphy.org/api/search`, Pasterski's public physics-claims corpus) · Claim Analyzer (backend LLM decomposes strong claims into scientific core / overreach / reformulation with 5 overreach types; cross-tab bridge to WiPhy) · AI as Observer · Substrate Question · Playground (SVG Theory Map with 8 nodes + 9 typed edges, HTML5 Canvas Observer Patch simulator with brownian motion + overlap consensus metric) · Roadmap. EpistemicBadge enforces 5-level discipline (`established/mainstream/speculative/philosophy/metaphor/unsupported`). See `docs/self-sim-reality-agent-plan.md` |
| 17 | Language Agents | Active | 42 contract tests (`test_language_agents_contracts.py`) + 10 voice-examples tests | Low-Medium — 6 tutors (🇯🇵 Japanese · 🇨🇳 Chinese · 🇰🇷 Korean · 🇬🇧 English Mastery · 🇳🇴 Norwegian · 🇪🇸 Spanish). **[1.19.0]** Spanish native **cloned-voice** examples via local **Voicebox** (pre-generated + cached WAVs, instant playback; async proxy `backend/routers/voicebox.py`). **[1.20.0]** English **🎙 Conversation Audio** — spoken loop (Web Speech ASR + browser TTS) + optional web-research (Node `websearch-backend`). **No Docker dependency** for the agents; Voicebox is optional and degrades to browser voice |

---

## 1) J-messages Analyzer

**Purpose**: Processes J-meldinger (Norwegian fisheries regulatory documents) with structured AI analysis.

**Backend:**
- Router: `backend/routers/j_messages_analyzer.py` (1909 lines)
- Training: `backend/routers/j_messages_training.py` (867 lines)
- Service: `backend/services/j_messages_evaluator.py` (379 lines)
- Prompts: `backend/prompts/j_messages/v1.0.0/` (versioned)

**Frontend:**
- `frontend/src/JMessagesAnalyzer.jsx`
- `frontend/src/JMessagesLibrary.jsx`
- `frontend/src/JMessagesPairsLibrary.jsx`

**MCP tools** (via AgentOps router):
- Manifest: `GET /api/mcp/manifest`
- Tools list: `POST /api/mcp/tools/list`
- Bridge: `backend/mcp_bridge_server.py`

**Critical constraints:**
- Preserve structured analysis output fields (traced to frontend + exports)
- Maintain prompt version awareness (`ACTIVE_VERSION` file)
- Do not casually change storage/output fields
- If touching MCP: validate manifest + `tools/list` after change

**Docs**: `docs/J-messages_Analyzer.md`, `docs/MCP_TESTING_GUIDE.md`

---

## 2) Robomind Clinic

**Purpose**: AI-powered diagnostic clinic for LLM behavior issues. Competition module for NMiAI 2026.

**Backend** (`backend/clinic/` — 15 files):
- `router.py` — main API endpoints
- `enhanced_router.py` — competition API
- `service.py` — core logic
- `detectors.py` / `enhanced_detectors.py` — issue detection
- `judge.py` — LLM evaluation
- `therapy_engine.py` — therapy sessions
- `scoring.py` — scoring system
- `pii.py` — PII detection
- `models.py` + `schemas.py` — Pydantic schemas

**Frontend**: `frontend/src/RobomindClinic/`

**Tests** (only module with contract tests):
```bash
python -m pytest backend/tests/test_robomind_api_contracts.py -v  # 27/27
python -m pytest backend/tests/test_robomind_clinic.py -v
```

**Critical constraints:**
- Run contract tests before ANY change to clinic module
- Preserve Pydantic request/response schema stability
- Do not change diagnostic semantics without documenting
- Maintain request/response contract with frontend

**Docs**: `docs/ROBOMIND_CLINIC_README.md`, `docs/ROBOMIND_CLINIC_ENHANCEMENT_PLAN.md`

---

## 3) AgentOps Studio

**Purpose**: Workflow orchestration studio with MCP integration for tool discovery and execution.

**Backend** (`backend/routers/agentops/`):
- `__init__.py` — MCP manifest + `tools/list` (extracted `_resolve_api_headers()` helper, ~150 lines removed)
- `digital.py`, `flows.py`, `playbooks.py`, `prompt.py`, `runs.py`, `settings.py`

**Frontend** (`frontend/src/AgentOpsStudio/`):
- `AgentOpsStudio.jsx` — main view
- `PromptLab.jsx` — prompt management
- `FlowCatalog.jsx`, `Playbook.jsx`, `Runs.jsx`, `Settings.jsx`
- `agentopsApi.js` — API client

**MCP endpoints:**
- `GET /api/mcp/manifest` — tool manifest
- `POST /api/mcp/tools/list` — discover tools
- `POST /api/mcp/invoke` — invoke tool

**Tests:**
```bash
python -m pytest backend/tests/test_mcp_smoke.py -v  # 4/4
```

**Docs**: `docs/MCP_TESTING_GUIDE.md`, `docs/POSTMAN_MCP_TESTING.md`

---

## 4) Prompt Manager

**Purpose**: CRUD management for versioned AI prompts used across modules.

**Backend**: `backend/routers/prompts_editor.py` (213 lines)
**AgentOps prompt sub-router**: `backend/routers/agentops/prompt.py`

**Critical constraints:**
- Keep Mongo storage fields stable
- Preserve CRUD + test-preview flows
- Do not mutate live analysis prompts without versioning

---

## 5) Repo Analyzer Cursor AI

**Purpose**: AI-assisted repository analysis and README generation for Cursor AI workflows.

**Backend files:**
- `backend/repo_analysis.py` — analysis logic
- `backend/repo_storage.py` — storage
- `backend/readme_generator.py` — README auto-generation
- `backend/cursor_ai_integration.py` — Cursor AI bridge
- `backend/cursor_readme_routes.py` — README API routes
- `backend/cursor_agent_routes.py` — agent routes
- `backend/cursor_ai_automation.py` — automation

**Critical constraints:**
- Preserve upload/generate/save/list flows
- Do not break Cursor AI integration points

**Docs**: `docs/Repo-Analyzer-Cursor-AI-Implementation.md`

---

## 6) Enterprise Agents

**Purpose**: Domain-specific AI agents for enterprise use cases.

| Agent | Router | Frontend | Description |
|-------|--------|----------|-------------|
| Council | `council_execute.py` (319L) | `council-agent/` | Multi-agent council debate |
| EA | `ea_execute.py` (73L) | `ea/` (6 components) | Enterprise architecture tools |
| GRC | `grc_execute.py` (219L) | `grc-agent/` | Governance/risk/compliance |
| OpsX | `opsx_execute.py` (332L) | `ops-efficiency-agent/` | Operations excellence |
| Sales | `sales_agent.py` (141L) | `sales-agent/` | Sales assistant |
| Attention | `attention_agent.py` | `attention-agent/` | Attention management |
| Telco | `telco_ops.py` (186L) | `telco-ops-agent/` | Telecom operations |
| Productivity | `productivity_agent.py` (246L) | `AIProductivityAgent.jsx` | Productivity workflows |
| Compliance | `compliance_agent.py` | `AIComplianceAgent.jsx` | Compliance checking |
| Security Center | (frontend-only) | `security/` (7 components) | Platform security & privacy |
| Cybersecurity | `cybersecurity.py` (1499L) | `cyber/` (11 components) | Full security platform |

**Shared backend models**: `backend/models/` (13 files for each domain)

---

### Security Center (detailed)

The Security Center is the platform-level security and privacy module. Fully frontend-only (no backend endpoints).

**Frontend**: `frontend/src/security/` (7 components)
**Utilities**: `frontend/src/utils/` (4 shared modules)
**i18n**: 279 keys in full EN/NO parity

**6 Sub-modules (all implemented):**

| Sub-module | Component | Description |
|------------|-----------|-------------|
| Local Installation | `LocalInstallation.jsx` | AES-GCM 256 encryption toggle for localStorage |
| Automatic Data Deletion | `AutomaticDataDeletion.jsx` | Retention policies, auto-purge, audit trail |
| Your Data | `YourData.jsx` | Profile, export (JSON/CSV), stats, account deletion |
| Data Anonymization | `DataAnonymization.jsx` | PII masking (8 regex rules), live preview |
| Security Information | `SecurityInformation.jsx` | Dynamic score (0-100, A-F), 7 checks, compliance mapping |
| Real-time Monitoring | `RealTimeMonitoring.jsx` | Live event log, KPIs, filters, auto-refresh |

**Shared Utilities:**

| Utility | File | Purpose |
|---------|------|---------|
| Event Log | `securityEventLog.js` | Circular buffer (200 max), used by all sub-modules |
| Data Retention | `dataRetention.js` | localStorage scanner, purge engine, category detection |
| Anonymizer | `anonymizer.js` | PII detection/masking (email, phone, CC, IP, API key, SSN, fødselsnummer, URL) |
| Security Score | `securityScore.js` | Reads state from all modules, computes weighted score |

**Critical constraints:**
- All data in localStorage (no backend persistence)
- Encryption passphrase not stored (re-activation per session)
- No contract tests yet (validation: frontend build + visual inspection)

---

### Cybersecurity Module (detailed)

The Cybersecurity module is the largest Enterprise Agent, with its own dedicated section due to scope.

**Backend**: `backend/routers/cybersecurity.py` (1499 lines), `backend/routers/agent_security.py` (785 lines)
**Models**: `backend/models/cyber_models.py` (13 models + enums)
**Frontend**: `frontend/src/cyber/` (11 components)

**10 Sub-tabs (all implemented):**

| Sub-tab | Component | Backend endpoints | Description |
|---------|-----------|-------------------|-------------|
| Dashboard | `CyberDashboard.jsx` | `/risk/score`, `/posture/kpis` | Risk score gauge, KPIs, vulnerability overview |
| Agent Security | `AgentSecurity.jsx` | `/api/agent-security/*` | Real-time agent monitoring, Zero Trust, scans |
| Threat Library | `ThreatLibrary.jsx` | `/threats`, `/controls` | 4 threats, 22 controls across 5 frameworks |
| Tools & Frameworks | `ToolsFrameworks.jsx` | (static reference) | NIST CSF, ISO 27001, CIS, OWASP reference |
| Posture & Risk | `PostureRisk.jsx` | `/posture/nist-domains`, `/risk/score` | NIST CSF 2.0 domain scores, risk gauge, KPIs |
| Vulnerabilities | `Vulnerabilities.jsx` | `/vulnerabilities/*`, `/vulnerabilities/scan` | Real npm/pip/secret scanning, filters, detail modal |
| Secure Coding Coach | `SecureCodingCoach.jsx` | `/coach/topics`, `/coach/lesson/topic/{id}` | 10 topics, lesson generator with markdown, history |
| Compliance Tracker | `ComplianceTracker.jsx` | `/compliance/*` | 22 controls, inline edit, progress per framework |
| Incident Drills | `IncidentDrills.jsx` | `/drills/*` | 6 scenarios, step-by-step with feedback, scoring |
| Knowledge Base | `KnowledgeBase.jsx` | `/knowledge/*`, `/rag/ask` | 8 articles, reader, AI Q&A |

**Key API endpoints (`/api/cyber/`):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/threats` | GET | List threats (4 items) |
| `/controls` | GET | List controls (22 across 5 frameworks), filter by `?framework=` |
| `/vulnerabilities` | GET | List vulns, filter by `?severity=` |
| `/vulnerabilities/scan` | POST | Real scans: npm audit, pip-audit, secret regex scan |
| `/vulnerabilities/summary` | GET | Severity counts and open/fixed totals |
| `/posture/kpis` | GET | Security KPIs with targets |
| `/posture/nist-domains` | GET | NIST CSF 2.0 six domain scores |
| `/risk/score` | GET | Overall risk score 0-100 with factors |
| `/compliance/status` | GET | All compliance statuses, filter by `?framework=` |
| `/compliance/{fw}/{ctrl}` | PUT | Update status, evidence, reviewer |
| `/compliance/summary` | GET | Counts per framework, overall completion % |
| `/coach/topics` | GET | 10 topics catalog, filter by `?category=&difficulty=` |
| `/coach/lesson/topic/{id}` | POST | Generate rich markdown lesson |
| `/coach/history` | GET | Lesson generation history |
| `/drills/scenarios` | GET | 6 drill scenarios, filter by `?category=&difficulty=` |
| `/drills/start/{id}` | POST | Start drill session, returns first step |
| `/drills/{session}/action` | POST | Submit answer, get feedback + next step |
| `/drills/history/list` | GET | Completed drill history |
| `/knowledge/articles` | GET | 8 articles, filter by `?category=&difficulty=&search=` |
| `/knowledge/articles/{id}` | GET | Full article content |
| `/knowledge/categories` | GET | Category list with counts |
| `/rag/ask` | POST | Cybersecurity Q&A (keyword-based) |
| `/health` | GET | Module health check |

**Frameworks tracked**: NIST-CSF (6 controls), ISO-27001 (4), CIS (4), OWASP-ASVS (3), OWASP-TOP10 (5)

**Drill scenarios**: Ransomware (4 steps), Phishing (4 steps), Data Breach (5 steps), DDoS (4 steps generic), Insider Threat (4 steps generic), Supply Chain (4 steps generic)

**Knowledge articles**: CIA Triad, NIST CSF 2.0, OWASP Top 10, Zero Trust, Incident Response Lifecycle, SDL, GDPR, Supply Chain Security

**Critical constraints:**
- Real scanners (npm audit, pip-audit, git secret scan) with graceful fallback to mock
- Agent Security uses MongoDB (`security_events`, `agent_security_status`) with mock fallback
- All other data is in-memory (resets on restart) — compliance statuses, drill sessions, coach history
- No contract tests yet (smoke test recommended: `curl http://localhost:8000/api/cyber/health`)

---

## 7) Hologram Agent

**Purpose**: 3D avatar with voice interaction for immersive AI experiences.

**Backend**: `backend/routers/hologram_agent.py` (233 lines)
**Frontend** (`frontend/src/components/hologram/`):
- `HologramAgentChat.jsx`
- `HologramAgentLauncher.jsx`
- `useAudioRecorder.js`, `useSpeechCapture.js`, `useSpeechOutput.js`
- `useHologramAgent.js`, `VoiceSettingsPanel.jsx`

**Backend STT**: `backend/routers/stt.py` (51 lines)

---

## 8) Grocery Bot

**Purpose**: Autonomous competition bot (NMiAI challenge). Strategy-based AI agent navigating complex maze-like environments.

**Location**: `grocery_bot/`
**Key files:**
- `bot.py` — main bot logic
- `strategy.py` — strategy implementation (fixes applied 2026-03-14)
- `config.py` — configuration

**Recent fixes** (2026-03-14):
- Removed `best_from_pool` fallback (was causing deadlocks)
- Simplified `_nearest_zone` method

**Docs**: `memory/grocery_bot_discoveries.md`, `docs/NMiAI_2026_GROCERY_BOT_PLAN.md`

---

## 9) Websearch Backend

**Purpose**: Standalone Node.js service providing web search capabilities to the platform.

**Location**: `websearch-backend/`
**Port**: 8080 (override with `WEBSEARCH_PORT`; consumed by callers via `WEBSEARCH_URL`, default `http://localhost:8080`)
**Entry point**: `index.js`
**Start**: `cd websearch-backend && node index.js`

Treat as a **separate service boundary** — keep API stable, do not couple to Python backend internals.

---

## 10) n8n Workflows

**Purpose**: Optional workflow automation layer for AgentOps Studio orchestration.

**Location**: `agentops-n8n/`
**Port**: 5678 (Docker)
**Start**: `cd agentops-n8n && docker-compose up`

**Workflows:**
- `software-planning-workflow.json`
- `web-research-workflow.json`

**Start script**: `start-n8n.ps1`

---

## 11) Installing the App in the Cloud

**Purpose**: Interactive deployment planning workbench for migrating WLWAI to cloud services (Vercel + Cloud Run + MongoDB Atlas + Firebase Auth).

**Backend:**
- Router: `backend/routers/cloud_install.py` — 7 endpoints at `/api/cloud-install/*`
- Service: `backend/services/cloud_install_service.py` (~540 lines) — 7 deterministic methods
- Schemas: `backend/schemas/cloud_install.py` — 18 Pydantic models

**API endpoints (`/api/cloud-install/`):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Overall readiness score + section statuses (real env inspection) |
| `/recommend-architecture` | POST | Architecture recommendation with 3 budget tiers |
| `/generate-env-template` | POST | Environment variable templates (20 vars, 6 secrets, 3 scopes) |
| `/generate-deploy-checklist` | POST | Deployment checklist (26 items across 4 categories) |
| `/run-smoke-tests` | POST | Async smoke tests against real endpoints via httpx |
| `/cost-baseline` | GET | Cost estimates (6 items, 3 budget tiers) |
| `/troubleshooting` | GET | Troubleshooting guidance (13 items, 5 categories) |

**Frontend** (`frontend/src/cloud-install/` — 5 components):
- `InstallingAppInCloud.jsx` — Tab container (4 tabs)
- `CloudOverview.jsx` — Readiness score, section cards, architecture summary, workflow steps
- `CloudTargetArchitecture.jsx` — Service cards, flow diagram, cost baseline, deployment order
- `CloudEnvSecrets.jsx` — Environment variable table with secret/public/optional classification
- `CloudSmokeTests.jsx` — Automated test runner + manual checklist + troubleshooting

**Deployment artifacts:**
- `deployment/Dockerfile` — Python 3.11-slim, WORKDIR /app (repo root), PORT env var
- `deployment/cloudrun.yaml` — Knative spec, europe-north1, scale 0-3, startup/liveness/readiness probes

**Cloud-readiness fixes applied:**
- CORS reads `ALLOWED_ORIGINS` env var (comma-separated)
- MongoDB reads `MONGO_URI` env var (falls back to `MONGO_DETAILS` then localhost)
- `/health` enhanced with ok, service, version, timestamp
- `/ready` endpoint added with MongoDB ping check

**Frontend-backend connection:**
All 4 tabs fetch from backend with graceful fallback to static data if backend is offline.

**i18n**: 92 keys EN/NO with full parity

**Critical constraints:**
- Do not introduce new cloud providers (Supabase, Clerk, etc.)
- Keep existing architecture unchanged (React + FastAPI + MongoDB + Firebase)
- Deployment artifacts are functional but not auto-provisioning
- No contract tests yet (validate via: `curl http://localhost:8000/api/cloud-install/status`)

**Docs**: `docs/installing_the_app_in_the_cloud_plan.md` (Pack 1), `docs/installing_app_cloud_pack2_claude_code.md` (Pack 2)

---

## 12) EA Second Brain Agent

**Purpose**: Enterprise Architecture portfolio management with AI-powered insights, impact scoring, and natural-language queries. Based on Ketil's OutSystems-oriented vision documents.

**Backend:**
- Service: `backend/services/ea_second_brain.py` (~500 lines) — Portfolio CRUD, Impact Scoring (Ketil 6.0 formula), Tech Heatmap, Deprecation Radar, Insights, Watchlist, Source Feeds, Ask, Dashboard Stats
- Router: `backend/routers/ea_second_brain.py` — 24 endpoints at `/api/ea-brain/*`
- Models: `backend/models/ea.py` — 15+ Pydantic models (Criticality enum 1-5, LifecycleStatus, InsightCategory, InsightUrgency, ImpactScore, etc.)
- Seed: `backend/scripts/seed_ea_brain.py` (~580 lines) — 8 Norwegian portfolio items, 6 watchlist items, 5 source feeds, 7 insights

**API endpoints (`/api/ea-brain/`):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Module health check |
| `/stats` | GET | Dashboard stats aggregation |
| `/portfolio` | GET/POST | List/create portfolio items |
| `/portfolio/{id}` | GET/PUT/DELETE | CRUD for individual items |
| `/portfolio/heatmap` | GET | Technology heatmap (aggregation pipeline) |
| `/portfolio/deprecations` | GET | Deprecation radar sorted by urgency |
| `/insights` | GET | List insights (filter by status/category/urgency) |
| `/insights/{id}` | GET/PUT | Get/update insight status |
| `/insights/generate` | POST | Generate AI-powered insight with portfolio context |
| `/watchlist` | GET/POST | List/create watchlist items |
| `/watchlist/{id}` | PUT/DELETE | Update/delete watchlist item |
| `/feeds` | GET/POST | List/create source feeds |
| `/feeds/{id}` | PUT/DELETE | Update/delete source feed |
| `/ask` | POST | Natural language query against portfolio (LLM-powered) |

**Frontend** (`frontend/src/ea-agent/` — 5 tab components + parent):
- `EASecondBrain.jsx` — 6-tab container (Dashboard, Insights, Portfolio, Ask, Runs, Settings)
- `Dashboard.jsx` — Stat cards, Today's Insights, Deprecation Radar, Tech Heatmap, Lifecycle Distribution
- `Insights.jsx` — Generate AI insights, filter/search, expandable cards with impact scores, status workflow
- `Portfolio.jsx` — Full CRUD with tech stack builder, criticality colors, lifecycle badges
- `Ask.jsx` — NL queries, confidence meter, related items, sample questions, query history
- `Settings.jsx` — Integration status, Watchlist CRUD, Source Feeds CRUD, Execution Policies

**MongoDB collections**: `ea_portfolio_items`, `ea_watchlists`, `ea_source_feeds`, `ea_insights`

**i18n**: 172 keys EN/NO with full parity

**Critical constraints:**
- Impact Score formula must match Ketil 6.0: `0.40*Relevance + 0.30*Criticality + 0.20*Freshness + 0.10*Risk`
- Insights use LLM (`ask_ai_unified`) — graceful fallback if AI unavailable
- No contract tests yet (validate via: `curl http://localhost:8000/api/ea-brain/health`)

**Docs**: `docs/EA_SECOND_BRAIN_AGENT.md`

---

## 13) Red Cross Web QA Agent

**Purpose**: 24/7 QA copilot for the **rodekors.no** website rebuild on Enonic XP CMS + NextJS + Designsystemet (Digdir). Item Agent #9. Two execution modes (Generate-only for Cursor / Claude Code / GitHub Actions, Execute-directly in-app), two environments (local on `:3000`, test). Every run carries a SHA-256 attestation hash.

**Backend:**
- Service: `backend/services/red_cross_qa.py` — 23 suites, mock-first graceful degradation (deterministic fallback when LLM unavailable). Aligned to **Trine Bruu's Teststrategi 30.3** (Azure DevOps as official test tool, Sev 1-4 / Kat A-C dual severity scheme, V-model test levels, Fundy donation-form provider as separate scope from Vipps). Phase B adds DPIA / DoD verifier / Resilience / UAT-støtte / Risk Matrix. **Phase D** adds Loadster as a parallel browser-level load testing tool alongside k6. **Phase F** (Tom's tooling tips for the NextJS rebuild) adds: Storybook scope in the Playwright generator, Postman Collection v2.1 export, and GraphQL introspection for Guillotine/XP. **Phase G** (2026-05-13) adds NVDA screen-reader script generator + WAVE (WebAIM) audit as parallel tools inside the Accessibility tab. **Phase H · Pack 2** (2026-05-13) promotes the Sikkerhet og personvern tab into a backend-driven workbench with stable contracts, MongoDB persistence, scan history, and a structured DPIA editor — served by a dedicated `/api/qa/security/*` namespace (new files: `backend/schemas/qa_security.py`, `backend/repositories/qa_security_repository.py`, `backend/services/qa_security_service.py`, `backend/routers/qa_security.py`).
- Router: `backend/routers/red_cross_qa.py` — **43 routes** at `/api/red-cross-qa/*` (1.15.4 added `/ado/parse-pasted` + `/ado/paste-to-plan`; 1.15.7 added `/ado/fetch-sprint` + `/ado/format-item`; **1.15.8** added `GET /baselines` + `DELETE /baselines/{type}` for the new persisted-baselines admin)
- **Baselines persistence (1.15.8)**: the 5 drift-detection baselines (`_GRAPHQL_BASELINES`, `_PERF_HOT_QUERY_BASELINES`, `_DS_COMPLIANCE_BASELINES`, `_ROLE_MATRIX_BASELINES`, `_RESILIENCE_BASELINES`) are now Mongo-backed write-through caches via `red_cross_qa_baselines_collection` (`backend/db.py`). Helpers `_baseline_load / _baseline_save / _baseline_list / _baseline_reset` in `red_cross_qa.py`. Single collection, `_id="{type}::{key}"`, sets ↔ sorted-lists for GRAPHQL ops/types + ROLE_MATRIX signatures. Graceful fallback to in-memory-only when Mongo unreachable
- **Phase H router**: `backend/routers/qa_security.py` — **8 paths / 10 method bindings** at `/api/qa/security/*`
- Prompts: `backend/prompts/red_cross_qa/*.md` (13 versioned prompts; `release_judge.md` and `test_plan.md` updated for Azure DevOps + Sev/Kat dual severity + test-level taxonomy)

**API endpoints (`/api/red-cross-qa/`):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-test-plan` | POST | Sprint test plan from Azure DevOps work item / user story (emits `ado_work_items` with `work_item_type`, `priority` 1-4, `test_level` unit/sit/system/uat/performance) |
| `/generate-playwright-tests` | POST | Cross-browser E2E generator (9 scopes) |
| `/run-playwright` | POST | Execute Playwright (execute mode) |
| `/generate-cypress-tests` | POST | Component + frontend regression generator |
| `/run-cypress` | POST | Execute Cypress (execute mode) |
| `/analyze-api` | POST | Guillotine GraphQL + NextJS API + integrations (10 checks) |
| `/generate-cms-test-cases` | POST | Enonic Content Studio editor + visitor flows |
| `/run-accessibility-check` | POST | axe-core + Lighthouse + manual checklist (WCAG 2.2 AA, 12 checks) |
| `/run-lighthouse` | POST | Core Web Vitals (10 metrics) |
| `/run-forms-qa` | POST | Skjemabygger audit (21 checks: 12 base + 9 Fundy donation-provider checks; Vipps handoff, PRG idempotency, Adam Silver, JSON Schema, etc.). Findings carry `severity_dev` 1-4 + `category_ops` A-C |
| `/run-content-migration-audit` | POST | Legacy CMS → Enonic XP migration (8 content types × 10 checks) |
| `/run-enonic-performance` | POST | Enonic-specific perf: Guillotine waterfall / N+1, ISR latency, image service, publish ack (10 checks + hot queries) |
| `/run-designsystemet-audit` | POST | Digdir Designsystemet compliance (10 checks + 0-100 compliance score + deviations) |
| `/run-role-matrix-audit` | POST | Real authZ tests across 6 editorial roles × 4 actions + 8 authZ checks |
| `/generate-k6-script` | POST | k6 load script (5 profiles: smoke, normal, campaign peak, crisis spike, soak) |
| `/run-k6` | POST | Execute k6 (execute mode) |
| `/generate-loadster-script` | POST | **Phase D** — Loadster scenario JSON for browser-level load testing (parallel to k6). Maps each profile to a number of Loadster "engines" (1–5 parallel browser instances). Template includes hydration-aware steps + thresholds |
| `/run-loadster` | POST | **Phase D** — Mock Loadster run returning browser-level metrics k6 cannot measure: `hydration_p95_ms`, `spa_nav_p95_ms`, `peak_handled_vus`, `engines`, plus standard `avg_response_ms / p95_response_ms / error_rate_pct`. Differentiator text auto-generated |
| `/export-postman-collection` | POST | **Phase F** (Tom's tip) — Generates a Postman Collection v2.1 JSON for the 4 canonical Guillotine GraphQL operations (`GetDistrictPage`, `GetActivityList`, `GetCampaignPage`, `GetForeningContacts`). Variables: `base_url` + `token`. Per-request tests: status 200 + no GraphQL errors. Frontend triggers browser download |
| `/run-graphql-introspection` | POST | **Phase F** (Tom's tip) — Mock-first introspection of the Guillotine schema. Returns 5 canonical operations + 8 Røde Kors content types (Distrikt / Forening / Aktivitet / Kontaktperson / Kampanje / TjenesteKurs / Tema / Nyhet). Also returns the canonical `__schema` query as docs |
| `/generate-nvda-script` | POST | **Phase G** — Deterministic markdown NVDA test script for the manual tester on Windows. Per-scope expected announcements (donation/volunteer/search/navigation/forms). Keystrokes: `Insert+Ctrl+N`, `Insert+T`, `Insert+F7`, `Tab`, `H`, `D`. Each step carries WCAG SC mapping. Returns `script_md` + `step_count` + `wcag_sc_covered` + `filename` for `.md` download |
| `/run-wave-audit` | POST | **Phase G** — Mock-first WAVE (WebAIM) audit. Returns 6 category counts (errors / contrast_errors / alerts / features / structural_elements / aria) + 3 detail tables + deep link `https://wave.webaim.org/report#/{url}`. Real API call gated behind `WAVE_API_KEY` env var (workshop safety: mock-first by default) |

**Phase H · Pack 2 endpoints at `/api/qa/security/*`**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Top-level snapshot (pass/warn/fail/openFindings/lastScanAt/overallStatus/dpiaPresent) |
| `/checks` | GET | List all 25 checks (13 sec/priv + 12 DPIA) with status; auto-triggers a scan if none have run yet |
| `/checks/{id}` | GET | Full check detail with `findings_detail[]` attached |
| `/scan` | POST | Run security + DPIA scans, persist ScanRun + Findings, return snapshot. User-set statuses preserved |
| `/findings` | GET | Filterable by status / severity / check_id, newest first |
| `/findings/{id}` | PATCH | Update status / owner / recommendation / evidence; appends to audit history |
| `/history` | GET | Last N scan runs (default 5), newest first, with environment filter |
| `/dpia` | GET | Load DPIA singleton; seeds a Røde Kors-specific default if none exists |
| `/dpia` | POST | Replace full DPIA form |
| `/dpia` | PATCH | Partial update (any subset of fields) |

**Pack 3 additions (Phase H+, 2026-05-15)** at `/api/qa/security/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/export/markdown` | POST | Sprint-ready Markdown report (snapshot + findings by severity + tally + history + DPIA snapshot). Frontend downloads via Blob URL |
| `/findings/{id}/dispatch-ado` | POST | Push single finding to ADO. Mock-first: deterministic SHA-derived work-item ID. Idempotent (same finding → same mock work item). Persists `ado_url` + `ado_work_item_id` on finding. **Pack 4.2 (2026-05-15)**: when `ADO_PAT` (or `AZURE_DEVOPS_PAT`) env var is set, posts a JSON-Patch document to the real ADO REST API (`POST /_apis/wit/workitems/${type}?api-version=7.0`, Basic auth) and returns `is_mock=False`. Graceful fallback to mock on any failure; `live_error` surfaces the reason. UI renders a MOCK / LIVE badge accordingly. |
| `/diff` | GET | Compare two scan runs. Returns `{from, to, counts_delta, findings: {new, fixed, regressed, persisted}, diff_mode, summary}`. **Pack 4.1 (2026-05-15)**: `diff_mode` is `"precise"` when both `ScanRun` docs carry `findings_snapshot` (Pack 4.1 set-difference + status-transition logic), `"timestamp_fallback"` for pre-Pack-4.1 scans, `"no_scans"` when history is empty. |
| `/findings/{id}/verify` | POST | Re-runs scan, auto-transitions finding: not re-detected → `verified`; re-detected → reopened (`open`); else preserved |
| `/environments` | GET | Latest snapshot per env (local/test/staging/prod) + `worst_overall` aggregate. Powers governance matrix |
| `/run-security-scan` | POST | OWASP Top 10, headers, rate limits, GDPR (13 checks) |
| `/ado-bundle-preview` | GET | Preview Azure DevOps work-item bundle from latest findings (Sev1-4 / KatA-C annotated) |
| `/create-ado-work-items` | POST | Dispatch findings as Azure DevOps work items (Bug / Task / Test Case with priority + severity + test_level) |
| `/generate-sprint-report` | POST | **Sprint report generator** — aggregates runs/findings/dispatches for active sprint, computes Sev1-4 + KatA-C counts, produces Norwegian/English narrative (Status / Identifiserte avvik / Anbefalinger) for Trine's reporting line |
| `/run-dpia-check` | POST | **Phase B** — DPIA / Privacy by Design (Trine §6.x + GDPR Art. 25/35): 12 checks, `dpia_score` 0-100, data register (Enonic / Fundy / Vipps / Dataverse / Okta) with legal_basis + retention; findings tagged with `gdpr_article` |
| `/verify-definition-of-done` | POST | **Phase B** — Trine §6.1 mechanical DoD verifier: per work item checks `functionality_tested` / `integrations_verified` / `known_bugs_documented` / `ready_for_uat`; aggregates last 50 runs + 20 dispatches; emits summary {dod_pass, dod_partial, dod_fail, blockers_open, ready_for_uat} + narrative |
| `/run-resilience-check` | POST | **Phase B** — Resilience (Trine §7, separate from ytelse): wraps `run_k6` and exposes `resilience_score` 0-100, `breakpoint_vu`, `recovery_seconds`, `error_rate_peak_pct`, `memory_drift_pct` + `_distinction` text |
| `/generate-uat-support` | POST | **Phase B** — UAT-støtte: generates UAT scripts + per-stakeholder checklists + sign-off form for the named Røde Kors stakeholders (default: Hilde Forslund / Trine Røsand Scheen / Astri Fretheim) |
| `/analyze-risk-matrix` | POST | **Phase B** — Trine §10 risk matrix consumer: accepts CSV (`id,description,probability,impact,area`) or JSON, scores each risk (probability × impact, 1-25), assigns level (critical/high/medium/low), maps to test suites and produces `suite_priority` + `coverage_gaps` |
| `/dispatch-to-outsystems` | POST | Send action bundle to OutSystems |
| `/runs` | GET | List runs with attestation hashes |
| `/runs/{run_id}` | GET | Run detail (logs, artifacts) |
| `/stats` | GET | Dashboard stats aggregation |
| `/settings` | GET/POST | Get/save agent settings (now ado_organization, ado_project, ado_area_path, ado_iteration_path, ado_tags, current_sprint, sprint_length_weeks) |

**Frontend** (`frontend/src/red-cross-qa/` — 20 tab components + shared `_PageHero.jsx`):

| Tab | Component | Highlights |
|-----|-----------|-----------|
| Dashboard | `Dashboard.jsx` | Total runs, pass rate, open findings, blockers, 11 quality gates, 16-button Quick Actions panel covering full tab navigation (incl. Sprint Report) |
| Test Plan | `TestPlan.jsx` | Manual + automated + accessibility + API + regression + test data + ADO work items with priority/work_item_type/test_level badges |
| Playwright | `Playwright.jsx` | 9 scopes, generate or run |
| Cypress | `Cypress.jsx` | Component + frontend regression |
| API QA | `ApiQA.jsx` | 10 checks (query correctness, pagination, schema drift, rate limit) |
| CMS QA | `CmsQA.jsx` | 14 areas (content types, page templates, layouts, parts, roles, scheduling, ISR) |
| Forms QA | `FormsQA.jsx` | 6 form scopes × 21 checks (12 base + 9 Fundy), Vipps handoff, findings with Sev/Kat |
| Migration | `ContentMigration.jsx` | 8 content types, broken pages table, missing 301 redirects |
| Accessibility | `Accessibility.jsx` | WCAG 2.2 AA score + violations |
| Performance | `Performance.jsx` | Lighthouse panel + Enonic panel (10 Enonic checks, hot GraphQL queries with p95) |
| Designsystemet | `Designsystemet.jsx` | 0-100 compliance score, 10 checks, deviations panel with severity+component+page+fix_hint |
| Role Matrix | `RoleMatrix.jsx` | 6 colored role chips, full role × action matrix (allow/deny cells), 8 authZ checks, violations expected vs actual |
| Stress Test | `StressTest.jsx` | **Phase D tool selector** at top (k6 vs Loadster radio chips) → k6 profiles + scenarios (national crisis, donation peak, volunteer peak, search-heavy, etc.). Generate/Run buttons + result panel auto-switch endpoints + colors per tool. Loadster panel shows engines pill + browser-level metrics (`hydration_p95_ms`, `spa_nav_p95_ms`). **Phase B Resilience section**: `resilience_score` 0-100, breakpoint VU, recovery seconds, peak error rate, memory drift, plus *ytelse vs resilience* distinction text |
| Security & Privacy | `SecurityPrivacy.jsx` | 13 checks (OWASP, GDPR, secrets, dependencies) **+ Phase B DPIA / Privacy by Design panel**: 12 GDPR Art. 25/35 checks, `dpia_score` 0-100, data register table over Enonic / Fundy / Vipps / Dataverse / Okta, GDPR-tagged findings |
| Azure DevOps | `AzureDevOps.jsx` | Work-item bundle preview, dispatch to ADO/OutSystems, priority pill (P1-P4), work_item_type, severity_dev, category_ops, test_level pill. **[1.15.4]** Paste-and-Generate panel: paste any Story/Task → heuristic parser (NO + EN headers) detects RK content-type (Distrikt/Aktivitet/Kampanje/…) → emits structured test plan. **[1.15.7]** Fetch-from-ADO panel: live WIQL pull when `ADO_PAT` is in `.env` (else MOCK badge + curated 4-item list); "↓ Use this item" pipes a fetched item into the paste textarea for the same plan generator. See `docs/red-cross-qa-azure-devops-guide.md` |
| Sprint Report | `SprintReport.jsx` | Sprint name input + StatCards (total/pass/warn/fail) + Sev1-4 panels + KatA-C panels + Trine-narrative + runs/dispatches summaries **+ Phase B DoD verifier panel**: per-work-item 4-point checklist (Trine §6.1) + DodStat row (pass/partial/fail/ready_for_uat/blockers) |
| **UAT Support** | `UatSupport.jsx` | **NEW (Phase B)** — scopes selector (donation/volunteer/cms-editorial/search/forms/beredskap), stakeholder selector (Hilde Forslund / Trine Røsand Scheen / Astri Fretheim) with role labels, UAT scripts (script_id + meta pills + steps + acceptance), checklists, sign-off form table with decision color, support notes |
| **Risk Matrix** | `RiskMatrix.jsx` | **NEW (Phase B)** — CSV/JSON textarea with sample loader, level counts (critical/high/medium/low), suite_priority table sorted by max risk score, full risks table (P × I → score → level → suite), coverage_gaps panel, narrative section |
| Runs | `Runs.jsx` | Run history with SHA-256 attestation hash |
| Settings | `Settings.jsx` | Environments, tools, Azure DevOps project (organization / project / area path / iteration path / tags / current sprint / sprint length weeks), payment-flow scope, quality thresholds. **[1.15.5]** Stakeholders panel rebuilt from the official "Roller og ansvar" doc: 10 named people (Gry Rønjum / Terje Christensen / Tom Arild Jakobsen / Jah Langleite / Hilde Forslund / Trine Røsand Scheen / Astri M.M. Fretheim / Thomas Augestad / Trine Bruu / Ignacio Tejera Picossi) with scope-specific role labels via i18n. **`DEFAULT_SETTINGS` ADO defaults updated to `RedCrossNorway / rkdotno / rkdotno\Web QA / rkdotno\Sprint 2`** |

**Shell**: `frontend/src/RedCrossWebQAAgent.jsx` — 20-tab horizontal nav, header with environment + execution-mode quick selectors, gradient red/rose/pink theme.

**i18n**: 40+ top-level sections × 3 locales (EN / NO / ES), **721 keys per locale** (after Phase H+ Enonic-skill integration cycle, 1.15.0), full parity. Phase B added: `dpia:` (10 keys), `dod:` (15), `resilience:` (13), `uatSupport:` (22), `riskMatrix:` (24) + 2 tab labels. Phase C: `stakeholders:` (3), provenance + WCAG version (8). Phase D: Loadster tool selector (11). Phase F (27 keys). Phase G (29 keys). **Phase H · Pack 2 (82 keys)**: full Sikkerhet og personvern workbench labels under `securityPrivacy.*` — snapshot, runScan, statTotal/statOpenFindings, checksTitle/checksHint, scanType_*, category_*, detail* (Summary/Evidence/Recommendations/LinkedFindings), findingStatus_* (open/accepted_risk/fixed/verified), filter* (Status/ScanType/Category/FindingStatus/Severity), historyTitle/historyHint/trend* (Improving/Regressing/Flat), and full structured DPIA editor (`dpiaField_*` + `dpiaPlaceholder_*` for purpose, dataTypes, sensitiveData, storageLocation, accessRoles, retention, thirdParties, legalBasis, riskNotes, mitigations).

**Critical constraints:**
- Mock-first graceful degradation: every async function returns deterministic data when `ask_ai_unified` is unavailable — preserve this pattern
- 37 routes registered at `/api/red-cross-qa/*` — do not break path naming
- Backward compatibility: `TestPlanRequest` keeps `jira_epic` as deprecated alias of `ado_work_item`; MongoDB collection name `red_cross_qa_jira_dispatches_collection` deliberately retained to avoid DB migration
- Trine's Teststrategi 30.3 alignment: every finding/work-item must carry **both** `severity_dev` (1-4, dev phase) **and** `category_ops` (A-C, post-handover contract phase) per §8.1
- 11 quality gates rendered on the Dashboard: `gateAccessibility`, `gatePerformance`, `gateApi`, `gateSecurity`, `gateSeo`, `gateForms`, `gateCms`, `gateStress`, `gateMigration`, `gateDesignsystemet`, `gateRoleMatrix` — all keys present in EN/NO/ES i18n
- Smoke test: `backend/tests/smoke_red_cross_qa.py` — **37 checks** after Phase H+ Enonic-skill integration cycle (1.15.0). Validates settings shape, test plan with `test_level` (incl. `static-review`), ADO bundle Sev/Kat annotation, Forms QA Fundy checks (≥9) + 3 new security checks + Nashorn static review, sprint report narrative, Migration Phase H+ (URL param drift / structured filter / stale-data), Accessibility Phase H+ (lang / HtmlArea / CMS UI), Performance Phase H+ (refresh / change-detection / pooling + composite score), Designsystemet Phase H+ (SSR hydration / package alignment / HtmlArea typography), Role Matrix Phase H+ (repository ACL / NoQL in role queries / cache staleness), Stress Test Phase H+ (APIM backpressure / Guillotine under load / background jobs + DST probe), Security & Privacy Phase H+ legacy bridge (Nashorn safety / response size / repo ACL). Run via: `python -m backend.tests.smoke_red_cross_qa`. See `docs/audits/red-cross-qa-enonic-xp-roundup.md` for the full retrospective.
- **In-memory baselines** introduced in Phase H+ (5 dicts in `backend/services/red_cross_qa.py`): `_GRAPHQL_BASELINES` (schema drift, API & GraphQL area), `_PERF_HOT_QUERY_BASELINES` (hot-query p95 trend, Performance area), `_DS_COMPLIANCE_BASELINES` (Designsystemet score trend), `_ROLE_MATRIX_BASELINES` (role matrix drift), `_RESILIENCE_BASELINES` (resilience score trend). All evaporate on process restart — workshop/CI friendly. Mongo persistence is a documented follow-up.
- **`cross_tool_refs` pattern**: 9 area responses carry a top-level `cross_tool_refs` dict making each result self-navigable to sibling endpoints + Playwright/Cypress specs + the relevant skill section.
- **Phase H `Finding` schema**: as of 1.15.0 carries Optional `enonic_xp_pattern` + `automation_ref` fields (auto-populated by `_suggest_enonic_xp_pattern` + `_suggest_automation_ref` routers in `qa_security_service.py`). Backward compatible — legacy findings default to None.

**Run / smoke commands:**
```bash
# Backend import smoke (PowerShell on Windows: set $env:PYTHONUTF8="1" first if needed)
python -c "from backend.services.red_cross_qa import SUITE_NAMES; print(len(SUITE_NAMES))"   # → 18 (Phase D: 17 + redcross-stress-browser-loadster)
python -c "from backend.routers.red_cross_qa import router; print(len(router.routes))"      # → 37 (Phase G: +2 /generate-nvda-script + /run-wave-audit)
python -c "from backend.routers.qa_security import router; print(len(router.routes))"      # → 15 method bindings on 13 paths (Phase H · Pack 3+)

# Phase H smoke (16 checks): perform_scan, check shape, finding shape,
# status snapshot, check detail, filters, PATCH, RE-SCAN PRESERVES STATUS,
# history newest-first, DPIA lifecycle, router registration, Markdown
# export, ADO dispatch (mock + Pack 4.2 is_mock / live_error / JSON-Patch
# shape), diff_scans + Pack 4.1 precise-diff path, verify-fix, env matrix.
python -m backend.tests.smoke_qa_security

# Optional: real ADO dispatch path — set ADO_PAT in env to flip the
# dispatcher from mock to live REST. The smoke test stays green either
# way; without a PAT the mock path is asserted.
#   $env:ADO_PAT = "<your-personal-access-token>"   # PowerShell
#   export ADO_PAT="<your-personal-access-token>"    # bash

# End-to-end smoke — 37 checks after Phase H+ Enonic-skill integration (1.15.0).
# Covers Phases A→G + 13 Phase H+ areas (skill-cited checks, baseline trackers,
# cross_tool_refs, deterministic Playwright/Cypress specs).
python -m backend.tests.smoke_red_cross_qa

# Frontend production build
cd frontend && CI=true npm run build      # exit 0, 0 warnings in src/red-cross-qa/

# Endpoint smoke
curl http://localhost:8000/api/red-cross-qa/stats
curl http://localhost:8000/api/red-cross-qa/runs
curl -X POST http://localhost:8000/api/red-cross-qa/generate-sprint-report -H "Content-Type: application/json" -d '{"environment":"test","lang":"no"}'
```

**Docs**: covered in root `README.md` and `docs/README_FULL.md`.

---

## 14) AGI Progress Hub + Homo vs. AI Workshop

**Purpose**: Sidebar-level module (`📊 AGI Progress`) with 4 tabs. Three tabs cover AGI tracking, possible endings and benefits. The fourth tab — **Homo Sapiens vs. KI i Test** — is the SOCO workshop companion: 10 live head-to-head testing challenges (scenarios, risk, ambiguities, exploratory, followups, automation, testData, oracle, triage, accessibility) where a human tester and the AI answer the same prompt side-by-side. Every AI call is grounded in real ISTQB syllabi sections (CTFL v4.0 + CT-AI v1.0) via curated anchors + optional local PDF RAG when the provider is ItemAI / ItemServerAI.

**Phase E (1.9.0) — Persistent Prompt Evolution governance**

Closes the Option-C feedback loop deferred since 1.8.0. After a re-run with feedback, the workshop host can click **🧬 Propose persistent revision** under any AI answer. LLM #2 (the "prompt engineer") reads the BASE prompt + the human's critique + the AI's previous answer and proposes a diff. The proposal lands as `status="pending"` — a yellow card in the governance panel. The host can:
- **📊 Run regression** — base vs proposed scored mechanically against 3 curated samples per task (keyword coverage + length + markdown structure). Verdict: `no_regression` / `mixed` / `regression`.
- **✅ Approve** — supersedes the prior active revision; future rounds use the evolved prompt.
- **❌ Reject** — archived with audit-log reason.
- **⏪ Rollback** — re-activate a previously superseded revision (recovery path).

The LLM is explicitly instructed to **refuse** unsafe revisions (removes ISTQB anchoring, drops bilingual hint, narrows the prompt to a single sample input). Refusals are persisted with `risk_flags`.

**Backend:**
- Workshop core: `backend/services/homo_vs_ai_service.py` + `backend/services/istqb_anchors.py` + `backend/services/istqb_local_rag.py`. Router: `backend/routers/homo_vs_ai.py` (5 endpoints).
- Phase E: `backend/services/prompt_evolution.py` (~480 lines) + `backend/routers/prompt_evolution.py` (7 endpoints). Data: `backend/data/regression_samples.json` (3 inputs per task, deterministic scoring).
- Total: **12 routes at `/api/agi/homo-vs-ai/*`** (5 core + 7 prompt-evolution).

**API endpoints (Phase E only):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/prompt-evolution/propose` | POST | LLM #2 proposes a revised system prompt; persists `pending` or `refused` |
| `/prompt-evolution/revisions` | GET | List with `?task=` + `?status=` filters |
| `/prompt-evolution/{id}/approve` | POST | Human approval gate; supersedes prior active |
| `/prompt-evolution/{id}/reject` | POST | Reject with reason (audit log) |
| `/prompt-evolution/{id}/regression` | POST | Curated harness base vs proposed, returns side-by-side scores |
| `/prompt-evolution/{id}/rollback` | POST | Re-activate a previously superseded revision |
| `/prompt-evolution/active/{task}` | GET | Debug helper: resolve currently active prompt |

**Frontend** (`frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` — 2350+ lines):
- Section 01 — Workshop Hero
- Section 02 — Activity Matrix
- Section 03 — Head-to-Head Demos (10 cards with `DemoCard` component; per-card propose-revision button)
- Section 04 — Trust Framework
- Section 05 — Workshop Scoreboard
- Section 06 — Speaker Crib Sheet
- **Section 07 — Prompt Evolution governance (Phase E)** — filterable revision list, side-by-side prompt boxes, regression results viewer
- Footer — Future improvements changelog

**Mongo collections (Phase E):**
- `homo_vs_ai_prompt_revisions` — versioned prompt history (status: pending / active / rejected / superseded / refused)
- `homo_vs_ai_prompt_audit` — append-only action log (actor, action, timestamp, detail)

**Option A · Feedback log (1.15.1, 2026-05-22) + A → C bridge (1.15.2, 2026-05-22)**

Closes the trilogy that the workshop's "Future improvements" footer parked since Pack 3. The three feedback flavours are now interconnected:

- **A · Log only** (1.15.1) — persists every captured note to `homo_vs_ai_feedback_log` Mongo collection (in-memory fallback up to 5000 entries). Auto-logged from Re-run with feedback (`context="ephemeral-rerun"`) and from Propose revision (`context="proposal-trigger"`); explicitly via the **📝 Save as note** button (`context="manual-note"`). Deterministic SHA-1 `entry_id` for de-duplication.
- **A → C bridge** (1.15.2) — the export panel at the bottom of the workshop tab now exposes a `▸ Review & promote entries` toggle. Each promotable row (entries with `user_input` + `previous_ai_output` populated) gets a **🧬 Promote to revision** button that calls the existing `/prompt-evolution/propose` endpoint with the entry's stored fields. The result lands as `pending` in the governance panel above for human approval — identical to a live proposal. Per-entry state machine: `idle → promoting → promoted (revision_id) | error`. Legacy entries without `user_input` show a `⊘ Not promotable` chip with tooltip.

**Endpoints added** (5 → 7 routes on `/api/agi/homo-vs-ai/*`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feedback-log` | POST | Persist a single note. Used by 📝 Save as note + auto-log from Re-run / Propose. |
| `/feedback-log/export?task=&since=&limit=` | GET | Newest-first export with task / since filters (default 1000, max 5000). Used by JSON download + Review & promote panel. |

**Mongo collection** (Option A):
- `homo_vs_ai_feedback_log` — `{entry_id, task, text, timestamp, actor, context, previous_ai_output?, user_input?, extra?}`. `user_input` is the 1.15.2 addition that makes the A → C bridge work; legacy entries (pre-1.15.2) naturally lack it and surface as non-promotable.

**Smoke** (`backend/tests/smoke_feedback_log.py` — **11 checks**, 1.15.2):
- Log shape + auto-log shape + validation × 2 + export filter + router registration + newest-first ordering (1.15.1: 8 checks)
- `user_input` persistence + export round-trip + promotable filter mirroring frontend (1.15.2: +3 checks)

Run via: `python -m backend.tests.smoke_feedback_log`. Phase E smoke (`smoke_prompt_evolution.py`) unchanged at 3/3 PASS.

**i18n**: Full **EN / NO / ES** parity. `homoVsAi.*` block under each `common.json` (router, judge, scoreboard, future, istqb, demos.feedback*, **34 `evolve.*` keys × 3 locales** for Phase E, **22 `feedbackLog.*` keys × 3 locales** for 1.15.1 + 1.15.2).

**Critical constraints:**
- **Backward-compatible by design**: if no revision is active or Mongo is unavailable, `run_challenge` keeps using `TASK_SPECS[task]["system"]` exactly as before 1.8.0
- **No auto-promotion**: the LLM proposes, a human approves. Always.
- **Append-only audit**: revisions are never deleted, only soft-marked
- **MVP scope**: prompt evolution is wired into `/challenge` only; `/route` and `/judge` keep fixed prompts
- ISTQB licensing: full PDFs stay gitignored under `docs-ISTQB/`; only curated short summaries live in `backend/data/istqb_anchors.json`

**Smoke / verification commands:**
```bash
# Phase E smoke — 3 checks (regression harness + router registration + backward compat)
python -m backend.tests.smoke_prompt_evolution

# Option A · Feedback log smoke — 11 checks (1.15.1 + 1.15.2):
#   log shape, auto-log, validation × 2, export filter, router, ordering,
#   user_input round-trip, export preserves both fields, promotable filter
python -m backend.tests.smoke_feedback_log

# Verify all 14 /homo-vs-ai routes registered (5 core + 7 prompt-evolution + 2 feedback-log)
python -c "from backend.app import app; print(sum(1 for r in app.routes if '/homo-vs-ai' in r.path))"

# Frontend production build — 0 warnings in src/pages/help/agi/
cd frontend && CI=true npm run build

# Endpoint smoke (backend running, will fall back to TASK_SPECS if Mongo empty)
curl http://localhost:8000/api/agi/homo-vs-ai/tasks
curl http://localhost:8000/api/agi/homo-vs-ai/prompt-evolution/revisions
```

**Docs**: covered in `README.md` (AGI Hub section), `docs/README_FULL.md` (Tab 4 — full backend + frontend catalogue + Phase E governance subsection), and `docs/CHANGELOG.md` [1.9.0] for the Phase E rollout notes.

---

# Local Skills (`.claude/skills/`)

## Skill: `enonic-xp` — Enonic XP Audit & Review

**Location**: `.claude/skills/enonic-xp/`
**Added**: 2026-05-19 (v0.1.0)
**Trigger**: code review or audit requests on Enonic XP TypeScript apps / libraries (`xp-*`, `lib-*`, Cristin→NVA-style migrations).

**Why it exists**: complements the runtime Enonic probes already in the Red Cross Web QA Agent (`frontend/src/red-cross-qa/Performance.jsx`) with a static-analysis knowledge base distilled from three real audits (`xp-nva` × 2 + Cristin→NVA migration).

**Contents**:

| File | Purpose |
|------|---------|
| `SKILL.md` | Manifest, decision tree, output contract |
| `references/code-review-checklist.md` | Pass-A scanner — walk top to bottom on any XP repo |
| `references/security-patterns.md` | NoQL injection, ACL, XSS, SSRF, response-size limits |
| `references/performance-patterns.md` | N+1 queries, double-fetch, refresh strategy, GC pressure |
| `references/reliability-patterns.md` | Task progress, retry, silent failure, stale data, timezone |
| `references/api-design-patterns.md` | Dead code, error semantics, `lib-portal`, type assertions |
| `references/data-integrity-patterns.md` | Idempotency, change detection, URL param drift in migrations |
| `references/nashorn-compatibility.md` | Safe vs unsafe runtime APIs, workarounds, XP version matrix |
| `references/upstream-marketplace.md` | When to bring in `xp-app-debugger` / `xp-app-upgrader` from Enonic's marketplace (`enonic/ai-enonic-marketplace`) |

**Companion artifacts**:
- `/enonic-review` slash command — `.claude/commands/enonic-review.md`
- `enonic-reviewer` subagent (read-only) — `.claude/agents/enonic-reviewer.yml`

**Severity rubric**: Critical / High / Medium / Low / Info (see `code-review-checklist.md`).

**When NOT to use**: non-XP code (FastAPI backend, React frontend, n8n workflows) has its own guidance in `CLAUDE.md`.

---

## Known Open Risks

| Risk | Severity | Status |
|------|----------|--------|
| Auth fallback returns mock user when Firebase=None (silent, all endpoints open) | High | Open |
| `hackathon_config.env` was tracked in git with HMAC secret | Medium | Mitigated (git rm --cached done) |
| No CI pipeline | Medium | Open |
| MCP handlers had ~180 lines duplicated config-forwarding code | Low | Fixed (Step D) |
| J-messages, Prompt Manager, Repo Analyzer have no contract tests | Medium | Open |

## Test Commands

```bash
# All tests
python -m pytest backend/tests/ -v

# Robomind contract tests (27 tests)
python -m pytest backend/tests/test_robomind_api_contracts.py -v

# MCP smoke tests (4 tests)
python -m pytest backend/tests/test_mcp_smoke.py -v

# Backend smoke (needs running server)
curl http://localhost:8000/health
curl http://localhost:8000/api/mcp/manifest
```
