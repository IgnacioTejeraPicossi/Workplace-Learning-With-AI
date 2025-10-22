# AgentOps Studio Routers
from . import digital, prompt, playbooks, flows, runs, settings

# Lightweight MCP manifest endpoint (for interoperability)
from fastapi import APIRouter

mcp_router = APIRouter(prefix="/api/mcp", tags=["mcp"])


def compliance_manifest():
    return {
        "name": "ai-compliance-agent",
        "version": "1.0.0",
        "tools": [
            {
                "name": "dispatch_action_bundle",
                "description": "Dispatch compliance actions (Jira/Slack/Sheets)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "doc_title": {"type": "string"},
                        "doc_url": {"type": "string"},
                        "summary_md": {"type": "string"},
                        "key_risks": {"type": "array", "items": {"type": "string"}},
                        "actions": {"type": "array"}
                    },
                    "required": ["doc_title", "summary_md", "actions"]
                },
                "invoke": {"method": "POST", "path": "/api/compliance/dispatch"}
            },
            {
                "name": "get_run_status",
                "description": "Get latest agent runs",
                "input_schema": {"type": "object", "properties": {"module": {"type": "string"}}, "required": []},
                "invoke": {"method": "GET", "path": "/api/agent-runs"}
            }
        ]
    }


def productivity_manifest():
    return {
        "name": "ai-productivity-agent",
        "version": "1.0.0",
        "tools": [
            {
                "name": "dispatch_action_bundle",
                "description": "Dispatch productivity actions (Jira/Slack/Sheets)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "brief_title": {"type": "string"},
                        "primary_url": {"type": "string"},
                        "summary_md": {"type": "string"},
                        "next_actions": {"type": "array"},
                        "actions": {"type": "array"}
                    },
                    "required": ["brief_title", "summary_md", "actions"]
                },
                "invoke": {"method": "POST", "path": "/api/productivity/dispatch"}
            },
            {
                "name": "get_run_status",
                "description": "Get latest agent runs",
                "input_schema": {"type": "object", "properties": {"module": {"type": "string"}}, "required": []},
                "invoke": {"method": "GET", "path": "/api/agent-runs"}
            }
        ]
    }


@mcp_router.get("/manifest")
async def mcp_index():
    return {"servers": [
        {"id": "compliance", "manifest": compliance_manifest()},
        {"id": "productivity", "manifest": productivity_manifest()}
    ]}