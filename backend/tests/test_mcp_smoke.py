"""
Smoke tests for the MCP manifest endpoint.

Validates that GET /api/mcp/manifest is reachable and returns the expected
structure so that silent router-registration failures in app.py are caught
automatically (the mcp_router is registered inside a try/except block).

Covered assertions:
- Endpoint returns HTTP 200
- Response contains a "servers" list with all three expected entries
- Each server entry has "id" and "manifest" keys
- j-messages manifest exposes the required tools with correct input schemas
- compliance and productivity manifests expose dispatch_action_bundle
"""
from httpx import ASGITransport, AsyncClient
from backend.app import app

BASE = "http://testserver"


async def test_manifest_returns_200():
    """GET /api/mcp/manifest returns HTTP 200."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as client:
        r = await client.get("/api/mcp/manifest")
    assert r.status_code == 200


async def test_manifest_structure():
    """Response contains 'servers' list with compliance, productivity, j-messages."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as client:
        r = await client.get("/api/mcp/manifest")
    data = r.json()

    assert "servers" in data, "manifest must have a 'servers' key"
    servers = data["servers"]
    assert isinstance(servers, list)

    ids = {s["id"] for s in servers}
    assert "compliance" in ids
    assert "productivity" in ids
    assert "j-messages" in ids

    for server in servers:
        assert "id" in server
        assert "manifest" in server


async def test_j_messages_manifest_tools():
    """j-messages manifest exposes analyze_j_melding and list_j_meldinger tools."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as client:
        r = await client.get("/api/mcp/manifest")
    servers = r.json()["servers"]

    j_messages = next(s["manifest"] for s in servers if s["id"] == "j-messages")
    assert "tools" in j_messages

    tool_names = {t["name"] for t in j_messages["tools"]}
    assert "analyze_j_melding" in tool_names
    assert "list_j_meldinger" in tool_names

    # analyze_j_melding must require file_url
    analyze_tool = next(t for t in j_messages["tools"] if t["name"] == "analyze_j_melding")
    assert "input_schema" in analyze_tool
    required = analyze_tool["input_schema"].get("required", [])
    assert "file_url" in required


async def test_compliance_and_productivity_manifests():
    """compliance and productivity manifests each expose dispatch_action_bundle."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as client:
        r = await client.get("/api/mcp/manifest")
    servers = r.json()["servers"]

    for agent_id in ("compliance", "productivity"):
        manifest = next(s["manifest"] for s in servers if s["id"] == agent_id)
        assert "tools" in manifest, f"{agent_id} manifest missing 'tools'"
        tool_names = {t["name"] for t in manifest["tools"]}
        assert "dispatch_action_bundle" in tool_names, \
            f"{agent_id} manifest missing dispatch_action_bundle"
