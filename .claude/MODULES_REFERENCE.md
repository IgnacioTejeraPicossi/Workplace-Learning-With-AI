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
**Port**: 3001
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
- Service: `backend/services/red_cross_qa.py` — 17 suites, mock-first graceful degradation (deterministic fallback when LLM unavailable)
- Router: `backend/routers/red_cross_qa.py` — 25 routes at `/api/red-cross-qa/*`
- Prompts: `backend/prompts/red_cross_qa/*.md` (13 versioned prompts)

**API endpoints (`/api/red-cross-qa/`):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-test-plan` | POST | Sprint test plan from Jira epic / user story |
| `/generate-playwright-tests` | POST | Cross-browser E2E generator (9 scopes) |
| `/run-playwright` | POST | Execute Playwright (execute mode) |
| `/generate-cypress-tests` | POST | Component + frontend regression generator |
| `/run-cypress` | POST | Execute Cypress (execute mode) |
| `/analyze-api` | POST | Guillotine GraphQL + NextJS API + integrations (10 checks) |
| `/generate-cms-test-cases` | POST | Enonic Content Studio editor + visitor flows |
| `/run-accessibility-check` | POST | axe-core + Lighthouse + manual checklist (WCAG 2.2 AA, 12 checks) |
| `/run-lighthouse` | POST | Core Web Vitals (10 metrics) |
| `/run-forms-qa` | POST | Skjemabygger audit (12 checks: JSON Schema, Adam Silver, Vipps handoff, PRG idempotency, etc.) |
| `/run-content-migration-audit` | POST | Legacy CMS → Enonic XP migration (8 content types × 10 checks) |
| `/run-enonic-performance` | POST | Enonic-specific perf: Guillotine waterfall / N+1, ISR latency, image service, publish ack (10 checks + hot queries) |
| `/run-designsystemet-audit` | POST | Digdir Designsystemet compliance (10 checks + 0-100 compliance score + deviations) |
| `/run-role-matrix-audit` | POST | Real authZ tests across 6 editorial roles × 4 actions + 8 authZ checks |
| `/generate-k6-script` | POST | k6 load script (5 profiles: smoke, normal, campaign peak, crisis spike, soak) |
| `/run-k6` | POST | Execute k6 (execute mode) |
| `/run-security-scan` | POST | OWASP Top 10, headers, rate limits, GDPR (13 checks) |
| `/jira-bundle-preview` | GET | Preview Jira issue bundle from latest findings |
| `/create-jira-issues` | POST | Dispatch findings as Jira issues |
| `/dispatch-to-outsystems` | POST | Send action bundle to OutSystems |
| `/runs` | GET | List runs with attestation hashes |
| `/runs/{run_id}` | GET | Run detail (logs, artifacts) |
| `/stats` | GET | Dashboard stats aggregation |
| `/settings` | GET/POST | Get/save agent settings |

**Frontend** (`frontend/src/red-cross-qa/` — 17 tab components + shared `_PageHero.jsx`):

| Tab | Component | Highlights |
|-----|-----------|-----------|
| Dashboard | `Dashboard.jsx` | Total runs, pass rate, open findings, blockers, 8 quality gates |
| Test Plan | `TestPlan.jsx` | Manual + automated + accessibility + API + regression + test data + Jira subtasks |
| Playwright | `Playwright.jsx` | 9 scopes, generate or run |
| Cypress | `Cypress.jsx` | Component + frontend regression |
| API QA | `ApiQA.jsx` | 10 checks (query correctness, pagination, schema drift, rate limit) |
| CMS QA | `CmsQA.jsx` | 14 areas (content types, page templates, layouts, parts, roles, scheduling, ISR) |
| Forms QA | `FormsQA.jsx` | 6 form scopes × 12 checks, Vipps handoff |
| Migration | `ContentMigration.jsx` | 8 content types, broken pages table, missing 301 redirects |
| Accessibility | `Accessibility.jsx` | WCAG 2.2 AA score + violations |
| Performance | `Performance.jsx` | Lighthouse panel + Enonic panel (10 Enonic checks, hot GraphQL queries with p95) |
| Designsystemet | `Designsystemet.jsx` | 0-100 compliance score, 10 checks, deviations panel with severity+component+page+fix_hint |
| Role Matrix | `RoleMatrix.jsx` | 6 colored role chips, full role × action matrix (allow/deny cells), 8 authZ checks, violations expected vs actual |
| Stress Test | `StressTest.jsx` | k6 profiles + scenarios (national crisis, donation peak, volunteer peak, search-heavy, etc.) |
| Security & Privacy | `SecurityPrivacy.jsx` | 13 checks (OWASP, GDPR, secrets, dependencies) |
| Jira | `Jira.jsx` | Action bundle preview, dispatch to Jira/OutSystems |
| Runs | `Runs.jsx` | Run history with SHA-256 attestation hash |
| Settings | `Settings.jsx` | Environments, tools, Jira project, payment-flow scope, quality thresholds |

**Shell**: `frontend/src/RedCrossWebQAAgent.jsx` — 17-tab horizontal nav, header with environment + execution-mode quick selectors, gradient red/rose/pink theme.

**i18n**: 40 top-level sections × 3 locales (EN / NO / ES), ~400 keys per locale, full parity.

**Critical constraints:**
- Mock-first graceful degradation: every async function returns deterministic data when `ask_ai_unified` is unavailable — preserve this pattern
- 25 routes registered at `/api/red-cross-qa/*` — do not break path naming
- Quality gates referenced in Dashboard: `gateAccessibility`, `gatePerformance`, `gateApi`, `gateSecurity`, `gateSeo`, `gateForms`, `gateCms`, `gateStress` (+ extended: `gateMigration`, `gateDesignsystemet`, `gateRoleMatrix`)
- No contract tests yet (validate via: `curl http://localhost:8000/api/red-cross-qa/stats` and `curl http://localhost:8000/api/red-cross-qa/runs`)

**Run / smoke commands:**
```bash
# Backend import smoke (PowerShell on Windows: set $env:PYTHONUTF8="1" first if needed)
python -c "from backend.services.red_cross_qa import SUITE_NAMES; print(len(SUITE_NAMES))"   # → 17
python -c "from backend.routers.red_cross_qa import router; print(len(router.routes))"      # → 25

# Frontend production build
cd frontend && CI=true npm run build      # exit 0, 0 warnings in src/red-cross-qa/

# Endpoint smoke
curl http://localhost:8000/api/red-cross-qa/stats
curl http://localhost:8000/api/red-cross-qa/runs
```

**Docs**: covered in root `README.md` and `docs/README_FULL.md`.

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
