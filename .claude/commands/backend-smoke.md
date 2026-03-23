# /backend-smoke — Backend Startup & Smoke Validation

Start the backend and verify key endpoints respond correctly.

## Instructions

### Start the backend (from repo root)
```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**IMPORTANT**: Always start from repo root, never from inside `backend/`.

### Smoke check endpoints
```bash
# Health check
curl http://localhost:8000/health

# MCP manifest (critical — must always be reachable)
curl http://localhost:8000/api/mcp/manifest

# MCP tools list
curl -X POST http://localhost:8000/api/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d "{}"

# Prompts list
curl http://localhost:8000/api/prompts/

# Robomind clinic info
curl http://localhost:8000/clinic/info
```

### What to check
1. Backend starts without import errors
2. `/health` returns 200
3. `/api/mcp/manifest` returns JSON with tools array
4. No ERROR-level logs on startup

### Common startup issues
| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError: backend` | Started from inside `backend/` | `cd` to repo root first |
| `Firebase credentials error` | Missing `.env` or Firebase key | Check `.env` has `FIREBASE_*` vars |
| `MongoDB connection refused` | MongoDB not running | Start MongoDB or check URI in `.env` |
| `Port 8000 in use` | Previous process still running | Kill it: `lsof -ti:8000 | xargs kill` |

### After backend changes always run
1. Restart backend
2. Confirm `/health` responds
3. If MCP changed: confirm `/api/mcp/manifest` is reachable
4. If schema changed: verify affected frontend endpoints still work
