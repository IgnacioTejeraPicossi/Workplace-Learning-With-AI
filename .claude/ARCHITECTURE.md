# WLWAI — Architecture Reference

## Service Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        WLWAI Platform                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │   Frontend   │───▶│            FastAPI Backend            │  │
│  │  React :3000 │    │            Python :8000               │  │
│  └──────────────┘    │                                       │  │
│                      │  Routers (33 files)                   │  │
│  ┌──────────────┐    │  ├── j_messages_analyzer (1909 lines) │  │
│  │  Websearch   │    │  ├── clinic/ (Robomind)               │  │
│  │  Node :3001  │    │  ├── agentops/ (MCP manifest)         │  │
│  └──────────────┘    │  ├── agents (attention/council/sales) │  │
│                      │  └── enterprise (EA/GRC/OpsX)         │  │
│  ┌──────────────┐    │                                       │  │
│  │     n8n      │    │  Services (17 files)                  │  │
│  │  Docker:5678 │    │  Models (13 files)                    │  │
│  └──────────────┘    │  Integrations (19 files)              │  │
│                      └──────────────────────────────────────┘  │
│                               │                                 │
│  ┌──────────────┐    ┌────────┴─────────┐                      │
│  │  LM Studio   │    │    Databases     │                      │
│  │  Local :1234 │    │  MongoDB + Firebase                     │
│  └──────────────┘    └──────────────────┘                      │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │  MCP Bridge (STDIO)                  │                      │
│  │  backend/mcp_bridge_server.py        │                      │
│  │  HTTP manifest: /api/mcp/manifest    │                      │
│  │  Test file server: :8888             │                      │
│  └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Module Map (`backend/`)

### Core Application
| File | Role |
|------|------|
| `app.py` | FastAPI factory, router registration |
| `config.py` | Configuration management |
| `db.py` | MongoDB + Firebase connections |
| `llm.py` | Unified LLM orchestration layer |
| `mcp_bridge_server.py` | MCP STDIO bridge for Postman/Claude |

### Routers (`backend/routers/`)
| Router | Lines | Module |
|--------|-------|--------|
| `j_messages_analyzer.py` | 1909 | J-meldinger regulatory analysis |
| `j_messages_training.py` | 867 | Training pair management |
| `agentops/__init__.py` | ~300 | MCP manifest + tool discovery |
| `prompts_editor.py` | 213 | Prompt CRUD |
| `council_execute.py` | 319 | Council agent orchestration |
| `opsx_execute.py` | 332 | Operations excellence |
| `cybersecurity.py` | 393 | Cybersecurity scanning |
| `hologram_agent.py` | 233 | Voice/avatar agent |
| `productivity_agent.py` | 246 | Productivity workflows |
| `grc_execute.py` | 219 | Governance/risk/compliance |
| `attention_agent.py` | — | Attention management |
| `compliance_agent.py` | — | Compliance workflows |
| `sales_agent.py` | 141 | Sales assistant |
| `ea_execute.py` | 73 | Enterprise architecture |
| `telco_ops.py` | 186 | Telecom operations |
| `agentic_rag.py` | — | Retrieval-augmented generation |
| `auth.py` | — | Authentication |
| `embeddings.py` | — | Vector embeddings |

### Clinic Module (`backend/clinic/`) — Robomind Clinic
| File | Role |
|------|------|
| `router.py` | Main clinic API endpoints |
| `enhanced_router.py` | Competition-enhanced API |
| `service.py` | Core clinic logic |
| `detectors.py` | Issue detection |
| `enhanced_detectors.py` | Competition detectors |
| `judge.py` | LLM-based evaluation |
| `therapy_engine.py` | Therapy session logic |
| `scoring.py` | Scoring system |
| `pii.py` | PII detection |
| `models.py` + `schemas.py` | Pydantic schemas |

### AgentOps Sub-Router (`backend/routers/agentops/`)
| File | Role |
|------|------|
| `__init__.py` | MCP manifest + `tools/list` endpoint |
| `digital.py` | Digital workflow execution |
| `flows.py` | Flow management |
| `playbooks.py` | Playbook automation |
| `prompt.py` | Prompt management |
| `runs.py` | Execution history |
| `settings.py` | Settings management |

### Services (`backend/services/`)
| Service | Role |
|---------|------|
| `j_messages_evaluator.py` (379 lines) | J-messages analysis logic |
| `prompt_suggestion_service.py` (311 lines) | AI prompt suggestions |
| `agentic_rag/agentic_rag_service.py` | RAG orchestration |
| `agentic_rag/your_bm25.py` | BM25 keyword search |
| `agentic_rag/your_embeddings.py` | Embedding management |
| `agentic_rag/your_mongo.py` | MongoDB persistence |
| `agentops/judge.py` | Evaluation logic |
| `agentops/planner.py` | Planning service |
| `agentops/simulator.py` | Simulation engine |

## Frontend Module Map (`frontend/src/`)

### Feature Modules
| Module | Path | Description |
|--------|------|-------------|
| J-messages Analyzer | `JMessagesAnalyzer.jsx` | Regulatory document analysis UI |
| Robomind Clinic | `RobomindClinic/` | AI therapy clinic UI |
| AgentOps Studio | `AgentOpsStudio/` | Workflow orchestration UI |
| EA Agent | `ea/` (6 components) | Enterprise architecture tools |
| Cyber | `cyber/` (5 components) | Cybersecurity dashboard |
| Hologram Agent | `components/hologram/` | 3D avatar voice interaction |
| Sales Agent | `sales-agent/` | Sales assistant UI |
| Council Agent | `council-agent/` | Council debate orchestration |
| GRC Agent | `grc-agent/` | Governance/risk/compliance |
| Attention Agent | `attention-agent/` | Attention management |

### Shared Infrastructure
| File/Folder | Role |
|-------------|------|
| `App.jsx` | Root component + routing |
| `Dashboard.jsx` | Main dashboard |
| `Auth.jsx` | Authentication UI |
| `contexts/UnifiedAuthContext.js` | Auth state management |
| `api/api.js` | Main HTTP client |
| `i18n/` | English + Norwegian translations |
| `configs/agents/` | 7 agent JSON configs |

## MCP Architecture
```
Postman / Claude Desktop
        │
        ▼ STDIO
backend/mcp_bridge_server.py
        │
        ▼ HTTP
/api/mcp/manifest  ──── Tool discovery
/api/mcp/tools/list ─── Tool list
/api/mcp/invoke ──────── Tool execution
        │
        ▼
J-messages Analyzer tools
```

## Authentication Flow
- Firebase Auth (primary) — falls back to mock user if Firebase is None
- MongoDB Auth — alternative auth (MongoAuth.jsx)
- **Known risk**: Auth fallback returns mock user silently — all endpoints accessible when Firebase not configured

## Data Persistence
- **MongoDB**: documents, prompts, clinic runs, agent runs, embeddings
- **Firebase**: user authentication
- **In-memory**: some session state (not persistent across restarts)

## Key Dependencies
- Python: FastAPI, Pydantic, Motor (async MongoDB), firebase-admin, httpx
- Node.js: Express (websearch-backend)
- React: Axios, React Router, i18next
- LLM: Anthropic Claude, OpenAI, LM Studio (local)
