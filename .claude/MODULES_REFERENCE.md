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
| Cybersecurity | `cybersecurity.py` (393L) | `cyber/` | Security scanning |

**Shared backend models**: `backend/models/` (13 files for each domain)

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
