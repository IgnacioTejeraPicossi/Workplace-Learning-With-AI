# WLWAI — Claude Code Project Structure
> Inspired by: Claude Code Project Structure best practices

```
.claude/
├── README.md                    ← This file (index)
│
├── PROJECT_MAP.md               ← Services, ports, top-level structure
├── ARCHITECTURE.md              ← Full architecture + module file map
├── MODULES_REFERENCE.md         ← Module-by-module reference (10 modules)
│
├── commands/                    ← Slash commands for common operations
│   ├── audit.md                 ← /audit   — Read-only quality audit
│   ├── test.md                  ← /test    — Run test suite
│   ├── backend-smoke.md         ← /backend-smoke — Start & validate backend
│   ├── mcp-validate.md          ← /mcp-validate  — MCP integration check
│   ├── enonic-review.md         ← /enonic-review — Enonic XP code review
│   └── new-feature.md           ← /new-feature   — Safe feature workflow
│
├── agents/                      ← Specialized subagents
│   ├── auditor.yml              ← Read-only audit agent
│   ├── test-runner.yml          ← Test execution agent
│   ├── module-expert.yml        ← Deep-dive module analysis agent
│   └── enonic-reviewer.yml      ← Enonic XP reviewer (read-only)
│
└── skills/                      ← Local skill knowledge bases
    └── enonic-xp/               ← Enonic XP audit & review (security, perf, reliability, Nashorn compat)
        ├── SKILL.md
        └── references/          ← 7 domain reference docs
```

## Quick Reference

| Need | Use |
|------|-----|
| Full project map | `.claude/PROJECT_MAP.md` |
| Architecture diagrams | `.claude/ARCHITECTURE.md` |
| Module details & file locations | `.claude/MODULES_REFERENCE.md` |
| Run an audit | `/audit` |
| Run tests | `/test` |
| Validate backend | `/backend-smoke` |
| Validate MCP | `/mcp-validate` |
| Implement safely | `/new-feature` |
| Review an Enonic XP app | `/enonic-review` |
| Enonic patterns reference | `.claude/skills/enonic-xp/references/` |

## Key External Docs

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Project identity & Claude operating rules |
| `docs/AGENTS.md` | Agent workflow rules & module guardrails |
| `docs/llms.txt` | Compact repo map for LLMs |
| `docs/TESTING.md` | Validation gates & smoke tests |
| `README.md` | Entry point & module summary |

## Platform Services

| Service | Port | Start |
|---------|------|-------|
| FastAPI backend | 8000 | `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` |
| React frontend | 3000 | `cd frontend && npm start` |
| Node websearch | 3001 | `cd websearch-backend && node index.js` |
| n8n (Docker) | 5678 | `cd agentops-n8n && docker-compose up` |
| LM Studio | 1234 | Manual |
| MCP file server | 8888 | Manual |

## Test Baseline

```bash
python -m pytest backend/tests/ -v
# Expected: 31+ tests passing (27 Robomind + 4 MCP + others)
```
