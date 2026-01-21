# AgentOps Studio Routers
from . import digital, prompt, playbooks, flows, runs, settings

# Lightweight MCP manifest endpoint (for interoperability)
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from typing import Dict, Any
import httpx
import logging
import os
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
                "description": "Analyze a J-melding (.docx or .pdf) from Fiskeridirektoratet and extract structured metadata, table of contents, and HTML body. Returns JSON with id, title, status, dates, category/area, toc, body_html, plus api_config (provider/model/ai_level/temperature) for transparency.",
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
                        },
                        "ai_level": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                            "description": "AI complexity level (low|medium|high). Mirrors the web UI 'AI Level'. Default: low."
                        },
                        "temperature": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 2.0,
                            "description": "Sampling temperature (0.0-2.0). Lower=more deterministic, higher=more creative. Default: model/task default."
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
            },
            {
                "name": "pre_analyze_j_melding",
                "description": "Pre-analyze a J-melding (.docx or .pdf) by rewriting it according to lovteknikk rules. Uses the lovteknikkboka-oppdatert.md document as reference for rewriting rules. Returns JSON with title, toc, body_html, and raw_text of the rewritten document.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_url": {
                            "type": "string",
                            "description": "HTTPS URL to a .docx or .pdf J-melding file accessible from WLWAI backend"
                        },
                        "ai_level": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                            "description": "AI complexity level (low|medium|high). Mirrors the web UI 'AI Level'. Default: medium."
                        },
                        "temperature": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 2.0,
                            "description": "Sampling temperature (0.0-2.0). Lower=more deterministic, higher=more creative. Default: model/task default."
                        }
                    },
                    "required": ["file_url"]
                },
                "invoke": {
                    "method": "POST",
                    "path": "/api/mcp/j-messages/pre-analyze"
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
    ai_level = data.get("ai_level", "low")
    temperature = data.get("temperature", None)

    # Validate ai_level
    if ai_level not in ["low", "medium", "high"]:
        ai_level = "low"
    # Validate temperature (optional)
    try:
        if temperature is not None:
            temperature = float(temperature)
            if temperature < 0.0 or temperature > 2.0:
                temperature = None
    except Exception:
        temperature = None
    
    if not file_url or not isinstance(file_url, str):
        raise HTTPException(status_code=400, detail="file_url is required and must be a string")
    
    logger.info("analyze_j_melding called via MCP", extra={"file_url": file_url, "summary_length": summary_length, "ai_level": ai_level})
    
    try:
        # 1) Download the file from URL (60s timeout for download)
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
        
        # 2) Call internal analyzer API with extended timeout (420s = 7 minutes)
        # LM Studio can take 2-6 minutes to analyze documents
        async with httpx.AsyncClient(timeout=420.0) as client:
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
            # Forward ai_level to internal analyzer as 'complexity'
            params["complexity"] = ai_level
            if temperature is not None:
                params["temperature"] = temperature
            
            # Forward request headers (for API config, auth, etc.)
            # Priority: 1) Request headers, 2) Saved API config file, 3) .env fallback
            headers = {}
            config_source = "unknown"
            
            # Try to get config from request headers first
            has_headers = any(
                k in request.headers 
                for k in ["x-api-provider", "x-openai-key", "x-openrouter-key", "x-itemai-url"]
            )
            
            if has_headers:
                config_source = "request_headers"
                logger.info("🔵 [MCP] Using API configuration from REQUEST HEADERS (overrides saved config)")
                
                # Forward API provider if present
                if "x-api-provider" in request.headers:
                    headers["x-api-provider"] = request.headers["x-api-provider"]
                    logger.info(f"   → Provider: {request.headers['x-api-provider']}")
                
                # Only forward OpenAI key if it's valid (not a placeholder)
                openai_key = request.headers.get("x-openai-key", "")
                if openai_key and openai_key.startswith("sk-") and len(openai_key) > 20:
                    headers["x-openai-key"] = openai_key
                    logger.info(f"   → OpenAI key: {openai_key[:10]}... (valid)")
                elif openai_key:
                    logger.info(f"   → OpenAI key: invalid/placeholder, will use .env fallback")
                
                # Only forward OpenRouter key if it's valid
                openrouter_key = request.headers.get("x-openrouter-key", "")
                if openrouter_key and len(openrouter_key) > 10:
                    headers["x-openrouter-key"] = openrouter_key
                    logger.info(f"   → OpenRouter key: {openrouter_key[:10]}... (valid)")
                
                # Forward ItemAI URL if present
                if "x-itemai-url" in request.headers:
                    headers["x-itemai-url"] = request.headers["x-itemai-url"]
                    logger.info(f"   → ItemAI URL: {request.headers['x-itemai-url']}")
            else:
                # No headers provided - try to load from saved API config file
                try:
                    from backend.api_config_storage import get_api_config_for_headers, get_api_config
                    saved_config = get_api_config()
                    saved_headers = get_api_config_for_headers()
                    
                    # Log what we're loading
                    provider = saved_config.get("provider", "unknown")
                    logger.info(f"🟢 [MCP] Loading API configuration from SAVED CONFIG FILE (api_config.json)")
                    logger.info(f"   → Provider found: {provider}")
                    
                    # Update headers with saved config
                    headers.update(saved_headers)
                    config_source = "saved_config_file"
                    
                    # Detailed logging based on provider
                    if provider == "itemai":
                        itemai_url = saved_config.get('itemai_url', 'http://localhost:1234')
                        logger.info(f"   → ItemAI URL: {itemai_url}")
                        logger.info(f"   → Headers being sent: {list(headers.keys())}")
                        # Ensure x-api-provider is set
                        if "x-api-provider" not in headers:
                            headers["x-api-provider"] = "itemai"
                            logger.warning(f"   ⚠️ x-api-provider was missing, added it")
                        # Ensure x-itemai-url is set
                        if "x-itemai-url" not in headers and itemai_url:
                            headers["x-itemai-url"] = itemai_url
                            logger.warning(f"   ⚠️ x-itemai-url was missing, added it")
                    elif provider == "openai":
                        has_key = bool(saved_config.get("openai_key"))
                        logger.info(f"   → OpenAI key: {'present' if has_key else 'not set (will use .env)'}")
                        if "x-api-provider" not in headers:
                            headers["x-api-provider"] = "openai"
                    elif provider == "openrouter":
                        has_key = bool(saved_config.get("openrouter_key"))
                        logger.info(f"   → OpenRouter key: {'present' if has_key else 'not set (will use .env)'}")
                        if "x-api-provider" not in headers:
                            headers["x-api-provider"] = "openrouter"
                except Exception as e:
                    config_source = "env_fallback"
                    logger.warning(f"🟡 [MCP] Could not load saved API config: {e}")
                    logger.warning(f"   → Exception type: {type(e).__name__}")
                    logger.warning(f"   → Exception details: {str(e)}")
                    logger.info(f"   → Falling back to .env file")
                    # Try to read provider from .env as fallback
                    import os
                    env_provider = os.getenv("API_PROVIDER", "openai").lower()
                    if env_provider == "itemai":
                        headers["x-api-provider"] = "itemai"
                        headers["x-itemai-url"] = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234")
                        logger.info(f"   → Using ItemAI from .env: {headers.get('x-itemai-url')}")
                    # Will fall back to .env in get_api_config_from_headers()
            
            # Log headers being sent for debugging (ALWAYS log this)
            logger.info(f"📤 [MCP] Calling internal analyzer with config from: {config_source}")
            logger.info(f"   → Headers being sent: {list(headers.keys())}")
            if "x-api-provider" in headers:
                logger.info(f"   → API Provider: {headers['x-api-provider']}")
            if "x-itemai-url" in headers:
                logger.info(f"   → ItemAI URL: {headers['x-itemai-url']}")
            logger.debug("MCP calling internal analyzer", extra={
                "url": analyzer_url,
                "headers_present": list(headers.keys()),
                "has_openai_key": "x-openai-key" in headers,
                "has_itemai_url": "x-itemai-url" in headers,
                "config_source": config_source
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

            # Add transparency info for MCP clients (Postman / MCP Test UI)
            try:
                import os
                from backend.gpt5_config import get_optimal_model, get_gpt5_parameters

                provider_effective = headers.get("x-api-provider")
                config_details = {}
                if not provider_effective:
                    # Try to determine from saved config or env fallback (same logic path as above)
                    try:
                        from backend.api_config_storage import get_api_config
                        saved_config = get_api_config()
                        provider_effective = saved_config.get("provider") or provider_effective
                        config_details = saved_config or {}
                    except Exception:
                        provider_effective = os.getenv("API_PROVIDER", "openai").lower()

                model_to_use = None
                if provider_effective in ["openai", "openrouter"]:
                    # Metadata extraction uses task_type="extraction"
                    model_key = get_optimal_model("extraction", ai_level)
                    params_for_model = get_gpt5_parameters(model_key, "extraction")
                    model_to_use = params_for_model.get("model")
                elif provider_effective == "itemai":
                    # Best-effort: expose configured local model if present in saved config
                    model_to_use = config_details.get("itemai_model") or config_details.get("itemaiCurrentModel")

                result["api_config"] = {
                    "provider": provider_effective,
                    "ai_level": ai_level,
                    "model": model_to_use,
                    "temperature": temperature,
                    "config_source": config_source
                }
            except Exception as _:
                # Never fail the analysis response due to transparency metadata
                result["api_config"] = {
                    "provider": headers.get("x-api-provider"),
                    "ai_level": ai_level,
                    "model": None,
                    "temperature": temperature,
                    "config_source": config_source
                }
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


@mcp_router.post("/j-messages/pre-analyze")
async def mcp_pre_analyze_j_melding(request: Request, data: Dict[str, Any]):
    """
    MCP tool handler for pre_analyze_j_melding.
    Accepts file_url, downloads the file, and calls the internal pre-analyzer endpoint.
    """
    file_url = data.get("file_url")
    ai_level = data.get("ai_level", "medium")
    temperature = data.get("temperature", None)

    # Validate ai_level
    if ai_level not in ["low", "medium", "high"]:
        ai_level = "medium"
    # Validate temperature (optional)
    try:
        if temperature is not None:
            temperature = float(temperature)
            if temperature < 0.0 or temperature > 2.0:
                temperature = None
    except Exception:
        temperature = None
    
    if not file_url or not isinstance(file_url, str):
        raise HTTPException(status_code=400, detail="file_url is required and must be a string")
    
    logger.info("pre_analyze_j_melding called via MCP", extra={"file_url": file_url, "ai_level": ai_level})
    
    try:
        # 1) Download the file from URL (60s timeout for download)
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
        
        # 2) Call internal pre-analyzer API with extended timeout (420s = 7 minutes)
        async with httpx.AsyncClient(timeout=420.0) as client:
            # We need to make a multipart/form-data request to /api/j-messages/pre-analyze
            base_url = str(request.base_url).rstrip("/")
            pre_analyzer_url = f"{base_url}/api/j-messages/pre-analyze"
            
            # Prepare form data
            files = {
                "file": (filename, BytesIO(file_bytes), content_type or "application/octet-stream")
            }
            params = {}
            # Forward ai_level to internal pre-analyzer as 'complexity'
            params["complexity"] = ai_level
            if temperature is not None:
                params["temperature"] = temperature
            
            # Forward request headers (for API config, auth, etc.)
            headers = {}
            config_source = "unknown"
            
            # Try to get config from request headers first
            has_headers = any(
                k in request.headers 
                for k in ["x-api-provider", "x-openai-key", "x-openrouter-key", "x-itemai-url"]
            )
            
            if has_headers:
                config_source = "request_headers"
                logger.info("🔵 [MCP PRE-ANALYZE] Using API configuration from REQUEST HEADERS (overrides saved config)")
                
                # Forward API provider if present
                if "x-api-provider" in request.headers:
                    headers["x-api-provider"] = request.headers["x-api-provider"]
                    logger.info(f"   → Provider: {request.headers['x-api-provider']}")
                
                # Only forward OpenAI key if it's valid (not a placeholder)
                openai_key = request.headers.get("x-openai-key", "")
                if openai_key and openai_key.startswith("sk-") and len(openai_key) > 20:
                    headers["x-openai-key"] = openai_key
                    logger.info(f"   → OpenAI key: {openai_key[:10]}... (valid)")
                elif openai_key:
                    logger.info(f"   → OpenAI key: invalid/placeholder, will use .env fallback")
                
                # Only forward OpenRouter key if it's valid
                openrouter_key = request.headers.get("x-openrouter-key", "")
                if openrouter_key and len(openrouter_key) > 10:
                    headers["x-openrouter-key"] = openrouter_key
                    logger.info(f"   → OpenRouter key: {openrouter_key[:10]}... (valid)")
                
                # Forward ItemAI URL and key if present
                if "x-itemai-url" in request.headers:
                    headers["x-itemai-url"] = request.headers["x-itemai-url"]
                    logger.info(f"   → ItemAI URL: {request.headers['x-itemai-url']}")
                if "x-itemai-key" in request.headers:
                    headers["x-itemai-key"] = request.headers["x-itemai-key"]
            
            # If no headers, try to use saved API config
            if not has_headers:
                try:
                    from backend.api_config_storage import get_api_config
                    saved_config = get_api_config()
                    if saved_config:
                        config_source = "saved_config"
                        logger.info("🟢 [MCP PRE-ANALYZE] Using API configuration from SAVED CONFIG FILE (api_config.json)")
                        
                        provider = saved_config.get("provider")
                        if provider:
                            headers["x-api-provider"] = provider
                            logger.info(f"   → Provider: {provider}")
                        
                        if provider == "openai":
                            openai_key = saved_config.get("openaiApiKey") or saved_config.get("openai_key")
                            if openai_key and openai_key.startswith("sk-") and len(openai_key) > 20:
                                headers["x-openai-key"] = openai_key
                                logger.info(f"   → OpenAI key: {openai_key[:10]}... (valid)")
                        elif provider == "openrouter":
                            openrouter_key = saved_config.get("openrouterApiKey") or saved_config.get("openrouter_key")
                            if openrouter_key and len(openrouter_key) > 10:
                                headers["x-openrouter-key"] = openrouter_key
                                logger.info(f"   → OpenRouter key: {openrouter_key[:10]}... (valid)")
                        elif provider == "itemai":
                            itemai_url = saved_config.get("itemaiUrl") or saved_config.get("itemai_url")
                            itemai_key = saved_config.get("itemaiKey") or saved_config.get("itemai_key")
                            if itemai_url:
                                headers["x-itemai-url"] = itemai_url
                                logger.info(f"   → ItemAI URL: {itemai_url}")
                            if itemai_key:
                                headers["x-itemai-key"] = itemai_key
                except Exception as e:
                    logger.warning(f"⚠️ [MCP PRE-ANALYZE] Failed to load saved API config: {e}, will use .env fallback")
                    config_source = "env_fallback"
            
            # Make the request
            resp = await client.post(
                pre_analyzer_url,
                files=files,
                params=params,
                headers=headers
            )
            resp.raise_for_status()
            result = resp.json()
            
            # Add transparency metadata about API config used
            try:
                provider_effective = headers.get("x-api-provider") or os.getenv("API_PROVIDER", "openai").lower()
                if not headers.get("x-api-provider") and config_source == "saved_config":
                    try:
                        from backend.api_config_storage import get_api_config
                        saved_config = get_api_config()
                        provider_effective = saved_config.get("provider") or provider_effective
                    except Exception:
                        provider_effective = os.getenv("API_PROVIDER", "openai").lower()

                model_to_use = None
                if provider_effective in ["openai", "openrouter"]:
                    # Pre-analysis uses task_type="rewriting"
                    from backend.gpt5_config import get_optimal_model, get_gpt5_parameters
                    model_key = get_optimal_model("rewriting", ai_level)
                    params_for_model = get_gpt5_parameters(model_key, "rewriting")
                    model_to_use = params_for_model.get("model")
                elif provider_effective == "itemai":
                    try:
                        from backend.api_config_storage import get_api_config
                        saved_config = get_api_config()
                        model_to_use = saved_config.get("itemai_model") or saved_config.get("itemaiCurrentModel")
                    except Exception:
                        pass

                result["api_config"] = {
                    "provider": provider_effective,
                    "ai_level": ai_level,
                    "model": model_to_use,
                    "temperature": temperature,
                    "config_source": config_source
                }
            except Exception as _:
                # Never fail the response due to transparency metadata
                result["api_config"] = {
                    "provider": headers.get("x-api-provider"),
                    "ai_level": ai_level,
                    "temperature": temperature,
                    "config_source": config_source
                }
            
            logger.info("pre_analyze_j_melding via MCP succeeded", extra={
                "file_url": file_url,
                "title": result.get("title"),
                "has_toc": bool(result.get("toc")),
                "has_body": bool(result.get("body_html"))
            })
            
            return result
            
    except httpx.TimeoutException:
        logger.error("pre_analyze_j_melding via MCP failed: timeout", extra={"file_url": file_url})
        raise HTTPException(status_code=504, detail="Request timeout - file may be too large or LLM took too long")
    except httpx.RequestError as e:
        logger.error("pre_analyze_j_melding via MCP failed: request error", extra={"file_url": file_url, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("pre_analyze_j_melding via MCP failed: unexpected error", extra={"file_url": file_url, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@mcp_router.get("/manifest")
async def mcp_index():
    return {"servers": [
        {"id": "compliance", "manifest": compliance_manifest()},
        {"id": "productivity", "manifest": productivity_manifest()},
        {"id": "j-messages", "manifest": j_messages_manifest()}
    ]}