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
