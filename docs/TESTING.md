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
pip install -r requirements.txt
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
| Cybersecurity | Health endpoint | `curl http://localhost:8000/api/cyber/health` |
| Agent Security | Health endpoint | `curl http://localhost:8000/api/agent-security/health` |
| Frontend | Loads without crash | `cd frontend && npm start` (verify in browser) |