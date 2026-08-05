# TESTING.md — Workplace Learning With AI (WLWAI)

This is the single source of truth for smoke tests and validation gates in WLWAI.

## 0) Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm
- MongoDB (local or reachable)
- Optional: Docker Desktop (for n8n workflows)
- Optional: Postman Desktop (MCP testing)
- Optional: Claude Desktop (MCP testing)

## 1) Install & start (baseline)

### 1.1 Backend setup (from repo ROOT)
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 1.2 Start backend
```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### 1.3 Frontend (separate terminal)
```bash
cd frontend && npm install && npm start
```

## 2) Automated tests (pytest)

```bash
# All backend tests
python -m pytest backend/tests/ -v

# Robomind contract tests (27 tests)
python -m pytest backend/tests/test_robomind_api_contracts.py -v

# MCP smoke tests (4 tests)
python -m pytest backend/tests/test_mcp_smoke.py -v
```

## 3) Smoke tests by module (requires running server on :8000)

### 3.1 Backend health
```bash
curl http://localhost:8000/health
```

### 3.2 MCP
```bash
curl http://localhost:8000/api/mcp/manifest
```

### 3.3 Cybersecurity module
```bash
# Module health
curl http://localhost:8000/api/cyber/health

# Threats and controls
curl http://localhost:8000/api/cyber/threats
curl http://localhost:8000/api/cyber/controls

# Vulnerability summary
curl http://localhost:8000/api/cyber/vulnerabilities/summary

# Posture (NIST CSF 2.0 domains)
curl http://localhost:8000/api/cyber/posture/nist-domains

# Risk score
curl http://localhost:8000/api/cyber/risk/score

# Compliance summary
curl http://localhost:8000/api/cyber/compliance/summary

# Coach topics
curl http://localhost:8000/api/cyber/coach/topics

# Drill scenarios
curl http://localhost:8000/api/cyber/drills/scenarios

# Knowledge articles
curl http://localhost:8000/api/cyber/knowledge/articles

# Agent Security
curl http://localhost:8000/api/agent-security/health
curl http://localhost:8000/api/agent-security/overview
```

### 3.4 Robomind Clinic
```bash
curl http://localhost:8000/api/robomind/dashboard/metrics
```

### 3.5 J-messages Analyzer
```bash
curl http://localhost:8000/api/j-messages/list
```

## 4) Validation gates

| Module | Gate | Command |
|--------|------|---------|
| Backend | Starts without error | `python -m uvicorn backend.app:app` |
| Robomind | 27/27 contract tests | `python -m pytest backend/tests/test_robomind_api_contracts.py -v` |
| MCP | 4/4 smoke tests | `python -m pytest backend/tests/test_mcp_smoke.py -v` |
| Security Center | Frontend build + i18n parity | `cd frontend && npx react-scripts build` |
| Cybersecurity | 14/14 contract tests | `python -m pytest backend/tests/test_cyber_api_contracts.py -v` |
| Self-Correcting Loop | 4/4 contract tests (offline fallback) | `python -m pytest backend/tests/test_self_correcting_loop_contracts.py -v` |
| Future (Idea Log / Roadmap) | 7/7 contract tests (offline, incl. Notify emails) | `python -m pytest backend/tests/test_future_module_contracts.py -v` |
| Self-Correcting Scaffold Loop | 5/5 contract tests (offline, ast ground truth) | `python -m pytest backend/tests/test_scaffold_loop_contracts.py -v` |
| AI Training progress persistence | 5/5 contract tests (offline, auth+Mongo mocked) | `python -m pytest backend/tests/test_ai_training_progress_contracts.py -v` |
| Scenario Simulator progress persistence | 4/4 contract tests (offline, auth+Mongo mocked) | `python -m pytest backend/tests/test_simulator_progress_contracts.py -v` |
| Web Search AI (grounded answer) | 4/4 contract tests (offline, search+LLM mocked) | `python -m pytest backend/tests/test_web_search_ai_contracts.py -v` |
| Babel Library (intelligence + profile) | 14/14 contract tests (offline, services mocked) | `python -m pytest backend/tests/test_babel_contracts.py -v` |
| Team Dynamics (CRUD + analytics) | 8/8 contract tests (offline, auth+Mongo+LLM mocked) | `python -m pytest backend/tests/test_team_dynamics_contracts.py -v` |
| Agent Security | Health endpoint | `curl http://localhost:8000/api/agent-security/health` |
| Frontend | Loads without crash | `cd frontend && npm start` (verify in browser) |

## 5) Continuous Integration (GitHub Actions)

A minimal CI pipeline runs on every push/PR to `main`/`master` and on manual
dispatch: `.github/workflows/ci.yml`.

| Job | What it validates |
|-----|-------------------|
| `backend` | `python -m compileall backend` (syntax gate for all backend sources) + `pip install -r backend/requirements.txt` (dependency resolution) + **`pytest` on the offline, mock-first suites** (121 tests) |
| `frontend` | `npm install` + `npm run build` (production build). Runs with `CI=false` so pre-existing ESLint warnings do not fail the build yet. |

The `backend` test step runs only the suites verified to pass with **no**
MongoDB, LLM key or Firebase credentials:

```bash
python -m pytest \
  backend/tests/test_voice_examples.py \
  backend/tests/test_language_agents_contracts.py \
  backend/tests/test_mcp_smoke.py \
  backend/tests/test_cyber_api_contracts.py \
  backend/tests/test_self_correcting_loop_contracts.py \
  backend/tests/test_future_module_contracts.py \
  backend/tests/test_scaffold_loop_contracts.py \
  backend/tests/test_ai_training_progress_contracts.py \
  backend/tests/test_simulator_progress_contracts.py \
  backend/tests/test_web_search_ai_contracts.py \
  backend/tests/test_babel_contracts.py \
  backend/tests/test_team_dynamics_contracts.py
```

`MONGO_URI` is set to an unreachable host with a short `serverSelectionTimeoutMS`
so any accidental DB access fails fast instead of hanging. The Mongo-backed
suites (`smoke_red_cross_qa` baselines, `test_robomind_api_contracts`,
`test_app`) are **deliberately excluded** — they need a live MongoDB and/or
enforce auth, so they would hang or fail in the secret-less CI. Add them behind
a MongoDB service container + fixtures later. The pipeline otherwise requires
**no** secrets, so it stays green and fast.

## 6) End-to-end tests (Cypress) — directory layout

There are **two** Cypress test areas; be aware of which one you run:

- **`cypress/` (repo root)** — the comprehensive suite (~35 `*.cy.js` specs
  covering most modules). Run ad-hoc from the repo root, e.g.
  `npx cypress open` / `npx cypress run`.
- **`frontend/cypress/`** — a small smoke suite (`basic-tests.cy.js`) wired
  into the frontend package scripts (`npm run cypress:open`,
  `npm run cypress:run`, `npm run test:comprehensive`). Cypress is installed
  as a devDependency here (`frontend/package.json`).

The only Cypress config Cypress actually loads is **`frontend/cypress.config.js`**
(loaded from the directory where `cypress` is invoked). Redundant stub config
files previously present under `frontend/cypress/` and `frontend/src/` have been
removed to avoid confusion.

> Consolidating both suites into a single location is a worthwhile follow-up,
> but it is a larger, potentially disruptive migration and should be done
> deliberately (not as part of a quick cleanup).