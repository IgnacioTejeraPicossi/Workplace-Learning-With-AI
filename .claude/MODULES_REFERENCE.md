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
| Cybersecurity | `cybersecurity.py` (1499L) | `cyber/` (11 components) | Full security platform |

**Shared backend models**: `backend/models/` (13 files for each domain)

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
