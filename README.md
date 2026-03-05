# 🤖 AI-Powered Workplace Learning Platform

**Workplace Learning With AI (WLWAI)** — A modular application for AI-powered learning, compliance, productivity agents, and AI diagnostics. Built for enterprise integration (OutSystems, n8n, MCP) and competitions (e.g. AI_NM_2026, NMiAI 2026).

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
| **Competitions** | Grocery Bot (NMiAI 2026 Pre-Challenge), Robomind Clinic (AI_NM_2026) |

---

## 📁 Structure

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents, mcp_bridge_server
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
├── grocery_bot/      # NMiAI 2026 Pre-Challenge: WebSocket bot (strategy.py, bot.py)
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

**Docs (humans & agents):**

- [docs/agents.md](docs/agents.md)
- [docs/llms.txt](docs/llms.txt)
- [docs/TESTING.md](docs/TESTING.md)

---

- **Full README** (installation, setup, all modules): [docs/README_FULL.md](docs/README_FULL.md)
- **Quick index**: [docs/README_INDEX.md](docs/README_INDEX.md) — architecture, deployment, agents, admin
- **Robomind Clinic (AI_NM_2026)**: [docs/ROBOMIND_AI_NM_2026_PLAN.md](docs/ROBOMIND_AI_NM_2026_PLAN.md)
- **Grocery Bot (NMiAI 2026 Pre-Challenge)**: [grocery_bot/README.md](grocery_bot/README.md) — [plan](docs/NMiAI_2026_GROCERY_BOT_PLAN.md)
- **MCP / Postman testing**: [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md) — J-messages Analyzer via MCP or HTTP

---

## 🔄 Recent Work (2024–2025)

### Grocery Bot (NMiAI 2026)

Bot WebSocket para el Pre-Challenge del Norwegian AI Championship. Soporta 1–10 bots con estrategia unificada.

**Implementado:**
- **Level 1**: Conectar, wait, salir en game_over.
- **Level 2/3**: Un solo flujo para 1–10 bots.
- **Pathfinding**: BFS evitando paredes, bots y celdas reservadas; ítems bloqueados al ir al drop_off; fallback `_move_toward_safe` si no hay camino.
- **Asignación**: `_assign_targets` asigna un ítem por bot (no solo 3); considera ítems en tránsito; bots ociosos pre-recogen del pedido preview.
- **Roles courier/picker**: Bot 0 hace deliver-early; los demás llenan inventario a 3; backpressure (wait) si ≥2 bots cerca del drop_off.
- **Deliver-early**: 1 bot: dist≤8 o faltan ≤2 ítems; multi-bot: courier con dist≤6 o faltan ≤1 ítem.
- **Anti pick-up spam**: Detección de pick_up fallidos (posición e inventario sin cambios); tras 1 fallo se replanifica y se evita ese ítem.
- **Trace**: `python bot.py --trace` muestra posición, inventario y acción por bot en las primeras 10 rondas.

**Archivos**: `grocery_bot/strategy.py`, `grocery_bot/bot.py`, `grocery_bot/README.md`.

### MCP Server / Postman (J-messages Analyzer)

El bridge MCP (`backend/mcp_bridge_server.py`) traduce STDIO ↔ HTTP para que Postman pueda invocar `analyze_j_melding` y `list_j_meldinger`.

**Troubleshooting documentado:**
- **Error "cmd.exe"** (Windows): Postman arranca el bridge como proceso; si falta `cmd.exe` en PATH, usar la alternativa HTTP.
- **Alternativa HTTP**: POST a `http://localhost:8000/api/mcp/j-messages/analyze` con JSON `{file_url, summary_length, ai_level}`.
- **Comprobar cmd.exe**: `where cmd.exe`; añadir `C:\Windows\System32` al PATH si falta.
- **Ejemplo cURL**: Incluido en [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).

**Servidor de archivos de prueba**: `python backend/test_mcp_server.py` (puerto 8888).

---

## 🧪 Testing

- **Backend**: pytest si existen tests.
- **Frontend**: no romper componentes existentes.
- **Grocery Bot**: ejecutar `python bot.py` con token/URL configurados.
- **MCP**: [docs/MCP_TESTING_GUIDE.md](docs/MCP_TESTING_GUIDE.md), [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).

---

*Workplace Learning With AI — Ignacio Tejera*
