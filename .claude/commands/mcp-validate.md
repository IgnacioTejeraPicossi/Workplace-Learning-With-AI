# /mcp-validate — MCP Integration Validation

Validate the MCP (Model Context Protocol) integration for J-messages Analyzer.

## Instructions

### Prerequisites
- Backend must be running on port 8000
- Optional: MCP test file server on port 8888

### Step 1: Manifest check
```bash
curl http://localhost:8000/api/mcp/manifest
```
Expected: JSON response with `tools` array, each tool has `name`, `description`, `inputSchema`.

### Step 2: Tools list via bridge (STDIO mode)
```bash
# Direct HTTP test
curl -X POST http://localhost:8000/api/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d "{}"
```
Expected: `{ "tools": [...] }` with J-messages tools listed.

### Step 3: Tool invocation smoke test
```bash
curl -X POST http://localhost:8000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_j_messages", "parameters": {}}'
```
Expected: Valid response (may be empty list if no documents loaded).

### Step 4: Run automated MCP tests
```bash
python -m pytest backend/tests/test_mcp_smoke.py -v
```
Expected: 4/4 passed.

### MCP Architecture (for context)
```
Claude Desktop / Postman
        │ STDIO
        ▼
backend/mcp_bridge_server.py
        │ HTTP
        ▼
/api/mcp/manifest
/api/mcp/tools/list
/api/mcp/invoke
        │
        ▼
J-messages Analyzer tools
```

### Key files
| File | Role |
|------|------|
| `backend/mcp_bridge_server.py` | STDIO bridge — do not change tool schemas here |
| `backend/routers/agentops/__init__.py` | HTTP manifest + tool discovery |
| `backend/tests/test_mcp_smoke.py` | Automated validation |
| `docs/MCP_TESTING_GUIDE.md` | Full MCP testing reference |
| `docs/POSTMAN_MCP_TESTING.md` | Postman collection guide |

### If validation fails
1. Check backend is running: `curl http://localhost:8000/health`
2. Check no schema breakage in `__init__.py`
3. Check `mcp_bridge_server.py` has not changed tool names
4. Review `docs/MCP_TESTING_GUIDE.md` for diagnostic steps
