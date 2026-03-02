# 🤖 AI-Powered Workplace Learning Platform

**Workplace Learning With AI (WLWAI)** — A modular application for AI-powered learning, compliance, productivity agents, and AI diagnostics. Built for enterprise integration (OutSystems, n8n, MCP) and competitions (e.g. AI_NM_2026).

---

## 🎯 Objective

- **Learning**: Dashboard, AI concepts, micro-lessons, recommendations, scenario simulator, certifications, video lessons, Babel Library.
- **AI collaboration**: AgentOps Studio (workflow lab), Robomind Clinic (AI pathology diagnosis & therapy), Repository Analyzer, Document Analyzer, Agentic RAG, Presentation Agent, AI Study Buddy, AGI Progress Tracker.
- **Enterprise**: EA Dashboard, Process Designer, Catalog Manager, Heatmap View, Impact Analysis.
- **Agents**: AI Compliance, AI Productivity, EA Second Brain, Sales Assistant, Personal Attention, Telco Ops, Responsible AI (GRC). J-messages Analyzer (Fiskeridirektoratet) for Norwegian J‑meldinger.
- **Integrations**: Firebase auth, MongoDB, OpenAI/OpenRouter/ItemAI, n8n webhooks, OutSystems bridges, MCP (Postman/Claude).

---

## 📚 Modules (summary)

| Area | Main modules |
|------|-----------------------------|
| **Learning** | Dashboard, AI Concepts, Micro Lessons, Recommendations, Scenario Simulator, Web Search, AI Career Coach, Skills Forecast, Certifications, Video Lessons, Babel Library |
| **AI & agents** | AgentOps Studio, Robomind Clinic, Repository Analyzer, Document Analyzer, Agentic RAG, Presentation Agent, AI Study Buddy, AGI Progress Tracker |
| **Enterprise** | EA Dashboard, Process Designer, Catalog Manager, Heatmap View, Impact Analysis |
| **Item agents** | AI Compliance, AI Productivity, EA Second Brain, Sales Assistant, Personal Attention, Telco Ops, GRC |
| **Specialized** | J-messages Analyzer (Fiskeridirektoratet), MCP server, n8n workflows |

---

## 📁 Structure

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
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

**Ports**: Backend 8000, Frontend 3000, Web Search 3001, n8n 5678 (optional).

---

## 📖 Documentation

- **Full README** (installation, setup, all modules): [docs/README_FULL.md](docs/README_FULL.md)
- **Quick index**: [docs/README_INDEX.md](docs/README_INDEX.md) — architecture, deployment, agents, admin
- **Robomind Clinic (AI_NM_2026)**: [docs/ROBOMIND_AI_NM_2026_PLAN.md](docs/ROBOMIND_AI_NM_2026_PLAN.md)
- **Grocery Bot (NMiAI 2026 Pre-Challenge)**: [grocery_bot/README.md](grocery_bot/README.md) — [plan](docs/NMiAI_2026_GROCERY_BOT_PLAN.md)

---

*Workplace Learning With AI — Ignacio Tejera*
