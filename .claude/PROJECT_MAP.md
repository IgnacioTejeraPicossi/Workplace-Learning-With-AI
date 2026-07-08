# WLWAI — Project Map
> Complete knowledge base for Claude Code, Cursor AI, and LLM-assisted development.

## Identity
**Workplace Learning With AI (WLWAI)** — modular AI platform for workplace learning, enterprise AI, and agentic workflows.

## Services & Ports

| Service | Tech | Port | Start Command |
|---------|------|------|---------------|
| Backend | FastAPI (Python) | 8000 | `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` |
| Frontend | React (Vite/CRA) | 3000 | `cd frontend && npm start` |
| Websearch | Node.js | 8080 | `cd websearch-backend && node index.js` |
| n8n | Docker | 5678 | `cd agentops-n8n && docker-compose up` |
| LM Studio | Local LLM | 1234 | Manual (LM Studio app) |
| MCP File Server | Python HTTP | 8888 | Manual (test file server) |

## Top-Level Structure

```
AI Learning with AI/
├── CLAUDE.md                  # Project identity & Claude operating rules
├── README.md                  # Entry point & module summary
├── pytest.ini                 # Pytest config (testpaths=backend/tests)
├── .env                       # Backend secrets (not tracked)
├── .env.example               # Env template
├── hackathon_config.env       # Tracked — security risk (Step B done, monitor)
│
├── backend/                   # FastAPI — 171 Python files
├── frontend/                  # React — ~168 JSX/JS files
├── websearch-backend/         # Node.js websearch service
├── agentops-n8n/              # Docker n8n workflows
├── grocery_bot/               # NMiAI competition bot sandbox
│
├── docs/                      # 53 documentation files
├── docs-md/                   # Internal markdown docs (~32 files)
├── docs-media/                # Media assets
├── configs/                   # Agent JSON configurations
├── schemas/                   # EA data schemas
├── scripts/                   # Setup & automation scripts
├── deployment/                # Cloud deployment: Dockerfile + cloudrun.yaml (Cloud Run)
├── docker/                    # Docker setup files
└── .claude/                   # Claude Code project metadata
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `backend/app.py` | FastAPI application factory |
| `frontend/src/App.jsx` | React root component |
| `websearch-backend/index.js` | Node.js web search service |
| `backend/mcp_bridge_server.py` | MCP STDIO bridge (Postman/Claude) |
| `backend/routers/agentops/__init__.py` | MCP manifest & tool discovery |
| `backend/routers/cloud_install.py` | Cloud deployment workbench (7 endpoints) |
| `backend/routers/ea_second_brain.py` | EA Second Brain Agent (24 endpoints) |
| `deployment/Dockerfile` | Docker image for Cloud Run |
| `deployment/cloudrun.yaml` | Knative service spec |

## Critical Rules (from CLAUDE.md)
1. **Backend must start from REPO ROOT** — not from inside `backend/`
2. **Never commit secrets** — use `.env` and environment variables
3. **Keep changes minimal** — no broad rewrites without explicit request
4. **Preserve API contracts** — trace impact to frontend/exports before changing shapes
5. **Validate before declaring success** — always run smoke tests after changes

## Governance Docs
- `docs/AGENTS.md` — agent workflow rules & module guardrails
- `docs/llms.txt` — compact repo map for LLMs
- `docs/TESTING.md` — validation gates & smoke tests
- `README.md` — module summary & quick start
