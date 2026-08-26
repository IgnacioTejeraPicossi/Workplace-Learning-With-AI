from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

# OpenRouter support
try:
    import openrouter
except ImportError:
    openrouter = None

router = APIRouter(prefix="/api", tags=["api-test"])

class APITestRequest(BaseModel):
    provider: str
    openaiKey: str = ""
    openrouterKey: str = ""

class APIConfigSaveRequest(BaseModel):
    provider: str
    openaiKey: str = ""
    openrouterKey: str = ""
    itemaiUrl: str = "http://localhost:1234"
    itemserveraiUrl: str = "http://192.168.50.142:1234"

@router.post("/test-api")
async def test_api_connection(request: APITestRequest):
    """
    Test API connection for the specified provider
    """
    try:
        if request.provider == "openai":
            # Fall back to the server-side key (.env OPENAI_API_KEY) when the UI
            # field is empty — so "Test API" works with the key already configured
            # internally, mirroring how the rest of the app resolves the key.
            effective_key = request.openaiKey or os.getenv("OPENAI_API_KEY", "")
            if not effective_key:
                raise HTTPException(status_code=400, detail="OpenAI API key is required (none entered and OPENAI_API_KEY is not set on the server)")

            # Test OpenAI — use lightest current-gen model for cheap connectivity check.
            # NB: GPT-5 family expects `max_completion_tokens` (not `max_tokens`).
            openai.api_key = effective_key
            response = openai.chat.completions.create(
                model="gpt-5.4-nano",
                messages=[{"role": "user", "content": "Hello! Please respond with 'OpenAI API is working correctly.'"}],
                max_completion_tokens=50
            )
            
            return {
                "success": True,
                "provider": "openai",
                "message": "OpenAI API connection successful",
                "response": response.choices[0].message.content.strip()
            }
            
        elif request.provider == "openrouter":
            effective_key = request.openrouterKey or os.getenv("OPENROUTER_API_KEY", "")
            if not effective_key:
                raise HTTPException(status_code=400, detail="OpenRouter API key is required (none entered and OPENROUTER_API_KEY is not set on the server)")

            if not openrouter:
                raise HTTPException(status_code=500, detail="OpenRouter library not installed")

            # Test OpenRouter
            openrouter.api_key = effective_key
            openrouter.api_base = "https://openrouter.ai/api/v1"
            
            # OpenRouter naming: "openai/<model>" — use cheapest current-gen for connectivity check.
            # NB: GPT-5 family expects `max_completion_tokens` (not `max_tokens`).
            response = openrouter.ChatCompletion.create(
                model="openai/gpt-5.4-nano",
                messages=[{"role": "user", "content": "Hello! Please respond with 'OpenRouter API is working correctly.'"}],
                max_completion_tokens=50
            )
            
            return {
                "success": True,
                "provider": "openrouter",
                "message": "OpenRouter API connection successful",
                "response": response.choices[0].message.content.strip()
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid provider. Use 'openai' or 'openrouter'")
            
    except HTTPException as he:
        # Surface validation errors (missing key, etc.) with their real detail
        # instead of an empty message.
        detail = he.detail or f"HTTP {he.status_code}"
        return {
            "success": False,
            "provider": request.provider,
            "message": f"API test failed: {detail}",
            "error": detail,
        }
    except Exception as e:
        # Never return an empty error string (some SDK exceptions stringify empty),
        # which previously produced the confusing "API test failed: API test failed:".
        detail = str(e) or repr(e) or type(e).__name__
        return {
            "success": False,
            "provider": request.provider,
            "message": f"API test failed: {detail}",
            "error": detail,
        }


@router.post("/save-api-config")
async def save_api_config(request: APIConfigSaveRequest):
    """
    Save API configuration to server-side JSON file.
    This allows the MCP Server to use the same configuration as the web app.
    """
    try:
        from backend.api_config_storage import save_api_config
        
        config = {
            "provider": request.provider,
            "openai_key": request.openaiKey,
            "openrouter_key": request.openrouterKey,
            "itemai_url": request.itemaiUrl,
            "itemserverai_url": request.itemserveraiUrl
        }
        
        success = save_api_config(config)
        
        if success:
            return {
                "success": True,
                "message": "API configuration saved successfully. MCP Server will use this configuration."
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save API configuration")
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error saving API configuration: {str(e)}",
            "error": str(e)
        }


@router.get("/get-api-config")
async def get_api_config():
    """
    Get current API configuration from server-side JSON file.
    Returns the configuration without sensitive keys (for display purposes).
    """
    try:
        from backend.api_config_storage import get_api_config
        
        config = get_api_config()
        
        # Return config without keys for security (keys are used internally)
        return {
            "success": True,
            "provider": config.get("provider", "openai"),
            "itemai_url": config.get("itemai_url", "http://localhost:1234"),
            "has_openai_key": bool(config.get("openai_key")),
            "has_openrouter_key": bool(config.get("openrouter_key"))
        }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error reading API configuration: {str(e)}",
            "error": str(e)
        }
