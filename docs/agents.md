# AGENTS.md — Workplace Learning With AI (WLWAI)

This repository is a multi-service, modular AI platform. This file defines how AI agents (Cursor, CLI agents, MCP-enabled agents) must operate when making changes.

## 0) Repo identity
WLWAI combines:
- FastAPI backend (Python) providing core APIs, AI orchestration, and specialty modules
- React frontend (learning UI + agents UI)
- Node websearch backend
- Optional n8n workflows (AgentOps Studio automation)
- MCP server (J-messages Analyzer) accessible via Postman/Claude through a STDIO bridge server

Primary module highlights:
- J-messages Analyzer (Fiskeridirektoratet regulation processing)
- Robomind Clinic (AI Psychology / Psychopathia Machinalis)
- Repo Analyzer Cursor AI (documentation generation + learning module creation)
- Prompt Managers for Compliance & Productivity agents

## 1) Non-negotiable principles
1. Small, reviewable PRs (one primary module/service per PR unless explicitly requested).
2. Never commit secrets (API keys, tokens, passwords). Use `.env` and env vars.
3. Preserve stable ports and the documented service topology:
   - backend 8000, frontend 3000, websearch 3001, n8n 5678, LM Studio 1234, MCP test file server 8888.
4. Backend MUST be started from repo ROOT (not from `backend/`) to avoid import issues.
5. If changing API contracts, add/adjust contract tests or at minimum a reproducible smoke command in TESTING.md.
6. Avoid heavyweight dependency bloat: do not reintroduce the discontinued Voice Cloning stack or similar multi-GB deps.

## 2) “Work style” (agent workflow)
For any task:
1. Scope classification: Backend / Frontend / MCP / n8n / Websearch / Competition bot.
2. Identify the validation gate(s) BEFORE coding (see TESTING.md).
3. Implement minimal changes following existing patterns.
4. Run the minimum gate(s).
5. Summarize:
   - what changed
   - why
   - how validated (commands + results)
   - risks / follow-ups

## 3) Service boundaries (what goes where)
### Backend (FastAPI, Python)
- Run from root: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Cross-cutting services:
  - Unified LLM stack (shared function(s) used by multiple modules)
  - Mongo persistence for modules (documents, prompts, clinic runs)

### Frontend (React)
- Runs on 3000, calls backend on 8000 (via REACT_APP_API_BASE_URL or similar).
- UI modules include: J-messages Analyzer, Robomind Clinic, Repo Analyzer Cursor AI, Agent prompt managers, etc.

### Websearch backend (Node)
- Runs on 3001. Treat as separate service; keep API stable.

### n8n (Docker, optional)
- Runs on 5678. Used for AgentOps Studio flows; avoid breaking webhook payloads.

### MCP server (J-messages Analyzer)
- Manifest: `GET http://localhost:8000/api/mcp/manifest`
- Bridge server: `backend/mcp_bridge_server.py` (STDIO JSON-RPC)
- Test file server: `python backend/test_mcp_server.py` on port 8888 for serving local docs to Postman MCP.

## 4) Module-specific guardrails

### A) J-messages Analyzer (Fiskeridirektoratet)
Key code locations:
- Routers: `backend/routers/j_messages_analyzer.py`, `backend/routers/j_messages_training.py`
- Services: `backend/services/j_messages_evaluator.py`, `backend/services/prompt_suggestion_service.py`
- Frontend: `frontend/src/JMessagesAnalyzer.jsx`, `frontend/src/JMessagesLibrary.jsx`, `frontend/src/JMessagesPairsLibrary.jsx`, `frontend/src/components/PromptPanel.jsx`

Rules:
- Preserve stored fields: `{id, title, status, toc, body_html, summary}` where applicable.
- Preserve the versioned native prompt system under `backend/prompts/j_messages/v{version}/` and keep prompt version captured in analysis results.
- If changing analysis output, update export paths and UI renderers.

### B) Prompt Manager (Compliance & Productivity Agents)
Backend API contract must remain stable:
- `GET/POST/PUT/DELETE /api/prompts/{agent}`
- `POST /api/prompts/{agent}/test` returns:
  - Compliance: `{ ok, output, summary, risks }`
  - Productivity: `{ ok, output, summary, actions }`

Rules:
- Keep Mongo collection `prompts` fields compatible (`agent`, `name`, `prompt`, flags, timestamps).
- Testing a prompt must not mutate live production analysis unless explicitly intended.

### C) Robomind Clinic (Psychopathia Machinalis)
There are two layers:
- Legacy clinic (rule detectors + optional LLM judge)
- Enhanced clinic API (competition) under `/api/robomind/*` with Pydantic schemas

Endpoints (enhanced):
- `POST /api/robomind/screen`
- `POST /api/robomind/therapy`
- `POST /api/robomind/apply`
- `GET /api/robomind/dashboard/metrics`
- `GET /api/robomind/cases/{id}`

Rules:
- Maintain Pydantic schema compatibility for Screen/Therapy/Apply responses.
- If you touch enhanced API behavior, run the contract test suite:
  `python -m pytest backend/tests/test_robomind_api_contracts.py -v`
- If demo-mode headers/flags exist, preserve deterministic behavior.

### D) Repo Analyzer Cursor AI
Backend endpoints:
- `POST /api/cursor-readme/upload-files`
- `POST /api/cursor-readme/generate`
- `POST /api/cursor-readme/save-learning-module`
- `GET /api/cursor-readme/learning-modules`
- `GET /api/cursor-readme/learning-module/{module_id}`

Rules:
- Preserve upload limits and failure handling.
- Keep “learning module conversion” stable; it is used by the learning system.

### E) MCP testing via Postman / Claude
Rules:
- MCP tool discovery must work via `tools/list` STDIO to the bridge.
- Manifest must remain reachable (`/api/mcp/manifest`).
- Avoid schema changes to MCP tool input/output unless versioned.

## 5) Stop conditions (halt + report)
Stop and report if:
- A change could leak secrets or PII
- Backend no longer starts from ROOT
- MCP tool discovery fails
- Gateway/clinic contracts break without an updated test
- Dependency bloat risks repo size or deployability

## 6) Definition of Done (DoD)
A change is done when:
- Relevant services start and respond
- Minimum validation gates pass (TESTING.md)
- No secrets committed
- Docs updated if workflow changed
- PR summary includes command evidence