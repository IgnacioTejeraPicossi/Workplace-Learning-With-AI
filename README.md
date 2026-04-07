# 🤖 AI-Powered Workplace Learning Platform

**Workplace Learning With AI (WLWAI)** is a portfolio project focused on **automatic testing, AI-assisted validation, agentic workflows, and LLM-enabled product experimentation**. It combines FastAPI, React, MCP, Postman, and structured AI pipelines to explore how modern AI systems can be tested, debugged, integrated, and improved in real-world scenarios.

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
| **Enterprise & Operations** | EA Dashboard, Process Designer, Catalog Manager, Heatmap View, Impact Analysis |
| **Security Center** | 6-module platform security & privacy: local encryption (AES-GCM 256), automatic data deletion, user data control & export, PII anonymization, dynamic security score, real-time event monitoring |
| **Cybersecurity** | 10-tab security platform: threat library, real vulnerability scanning, NIST CSF 2.0 posture, compliance tracker, secure coding coach, incident drills, knowledge base, agent security monitor |
| **Specialized AI Use Cases** | J-messages Analyzer, compliance/productivity agents, AI experimentation |

---

## 📁 Structure

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents, mcp_bridge_server
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
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
