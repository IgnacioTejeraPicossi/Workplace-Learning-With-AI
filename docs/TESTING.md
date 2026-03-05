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