# AgentOps Studio Routers
from . import digital, prompt, playbooks, flows, runs, settings

# Lightweight MCP manifest endpoint (for interoperability)
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from typing import Dict, Any
import httpx
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

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


def j_messages_manifest():
    """
    MCP manifest for J-messages Analyzer module.
    Exposes tools for analyzing Norwegian J-meldinger (regulations) from Fiskeridirektoratet.
    """
    return {
        "name": "wlwai-j-messages-mcp",
        "version": "1.0.0",
        "description": "Internal MCP server exposing J-messages Analyzer from WLWAI",
        "tools": [
            {
                "name": "analyze_j_melding",
                "description": "Analyze a J-melding (.docx or .pdf) from Fiskeridirektoratet and extract structured metadata, table of contents, and HTML body. Returns JSON with id, title, status, dates, categories, toc, and body_html.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_url": {
                            "type": "string",
                            "description": "HTTPS URL to a .docx or .pdf J-melding file accessible from WLWAI backend"
                        },
                        "summary_length": {
                            "type": "string",
                            "enum": ["none", "short", "medium", "long"],
                            "description": "Optional: Include AI summary (none|short|medium|long). Default: none."
                        }
                    },
                    "required": ["file_url"]
                },
                "invoke": {
                    "method": "POST",
                    "path": "/api/mcp/j-messages/analyze"
                }
            },
            {
                "name": "list_j_meldinger",
                "description": "List all analyzed J-meldinger stored in the library with optional filtering by status, category, or search term",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "description": "Filter by status (e.g., 'Gjeldende', 'Utgått')"
                        },
                        "category": {
                            "type": "string",
                            "description": "Filter by category"
                        },
                        "search": {
                            "type": "string",
                            "description": "Search in title, j_id, or content"
                        }
                    },
                    "required": []
                },
                "invoke": {
                    "method": "GET",
                    "path": "/api/j-messages/list"
                }
            }
        ]
    }


@mcp_router.post("/j-messages/analyze")
async def mcp_analyze_j_melding(request: Request, data: Dict[str, Any]):
    """
    MCP tool handler for analyze_j_melding.
    Accepts file_url, downloads the file, and calls the internal analyzer endpoint.
    """
    file_url = data.get("file_url")
    summary_length = data.get("summary_length", "none")
    
    if not file_url or not isinstance(file_url, str):
        raise HTTPException(status_code=400, detail="file_url is required and must be a string")
    
    logger.info("analyze_j_melding called via MCP", extra={"file_url": file_url, "summary_length": summary_length})
    
    try:
        # 1) Download the file from URL
        async with httpx.AsyncClient(timeout=60.0) as client:
            file_resp = await client.get(file_url)
            if file_resp.status_code != 200:
                raise HTTPException(
                    status_code=file_resp.status_code,
                    detail=f"Failed to download file from URL: {file_resp.status_code} {file_resp.reason_phrase}"
                )
            
            file_bytes = file_resp.content
            content_type = file_resp.headers.get("content-type", "")
            
            # Determine filename from URL or content-type
            filename = "j-melding"
            if ".docx" in file_url.lower() or "wordprocessingml" in content_type:
                filename = "j-melding.docx"
            elif ".pdf" in file_url.lower() or "pdf" in content_type:
                filename = "j-melding.pdf"
            
            # 2) Call internal analyzer API
            # We need to make a multipart/form-data request to /api/j-messages/analyze
            base_url = str(request.base_url).rstrip("/")
            analyzer_url = f"{base_url}/api/j-messages/analyze"
            
            # Prepare form data
            files = {
                "file": (filename, BytesIO(file_bytes), content_type or "application/octet-stream")
            }
            params = {}
            if summary_length and summary_length != "none":
                params["summary_length"] = summary_length
            
            # Forward request headers (for API config, auth, etc.)
            # Priority: 1) Request headers, 2) Saved API config file, 3) .env fallback
            headers = {}
            
            # Try to get config from request headers first
            has_headers = any(
                k in request.headers 
                for k in ["x-api-provider", "x-openai-key", "x-openrouter-key", "x-itemai-url"]
            )
            
            if has_headers:
                # Forward API provider if present
                if "x-api-provider" in request.headers:
                    headers["x-api-provider"] = request.headers["x-api-provider"]
                
                # Only forward OpenAI key if it's valid (not a placeholder)
                openai_key = request.headers.get("x-openai-key", "")
                if openai_key and openai_key.startswith("sk-") and len(openai_key) > 20:
                    headers["x-openai-key"] = openai_key
                
                # Only forward OpenRouter key if it's valid
                openrouter_key = request.headers.get("x-openrouter-key", "")
                if openrouter_key and len(openrouter_key) > 10:
                    headers["x-openrouter-key"] = openrouter_key
                
                # Forward ItemAI URL if present
                if "x-itemai-url" in request.headers:
                    headers["x-itemai-url"] = request.headers["x-itemai-url"]
            else:
                # No headers provided - try to load from saved API config file
                try:
                    from backend.api_config_storage import get_api_config_for_headers
                    saved_headers = get_api_config_for_headers()
                    headers.update(saved_headers)
                    logger.debug("MCP using saved API config from file", extra={
                        "headers_present": list(headers.keys())
                    })
                except Exception as e:
                    logger.warning(f"Could not load saved API config: {e}")
                    # Will fall back to .env in get_api_config_from_headers()
            
            # Log headers being sent for debugging
            logger.debug("MCP calling internal analyzer", extra={
                "url": analyzer_url,
                "headers_present": list(headers.keys()),
                "has_openai_key": "x-openai-key" in headers,
                "config_source": "request_headers" if has_headers else "saved_config_file"
            })
            
            analyze_resp = await client.post(
                analyzer_url,
                files=files,
                params=params,
                headers=headers
            )
            
            if analyze_resp.status_code != 200:
                error_text = analyze_resp.text[:500] if analyze_resp.text else ""
                raise HTTPException(
                    status_code=analyze_resp.status_code,
                    detail=f"Analyzer API failed: {analyze_resp.status_code} {analyze_resp.reason_phrase} - {error_text}"
                )
            
            result = analyze_resp.json()
            logger.info("analyze_j_melding via MCP succeeded", extra={
                "file_url": file_url,
                "j_id": result.get("id"),
                "title": result.get("title"),
                "has_metadata": bool(result.get("id") or result.get("title"))
            })
            
            return result
            
    except httpx.TimeoutException:
        logger.error("analyze_j_melding via MCP failed: timeout", extra={"file_url": file_url})
        raise HTTPException(status_code=504, detail="Request timeout while downloading or processing file")
    except httpx.RequestError as e:
        logger.error("analyze_j_melding via MCP failed: request error", extra={"file_url": file_url, "error": str(e)})
        raise HTTPException(status_code=502, detail=f"Failed to download file: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze_j_melding via MCP failed: unexpected error", extra={"file_url": file_url, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@mcp_router.get("/manifest")
async def mcp_index():
    return {"servers": [
        {"id": "compliance", "manifest": compliance_manifest()},
        {"id": "productivity", "manifest": productivity_manifest()},
        {"id": "j-messages", "manifest": j_messages_manifest()}
    ]}