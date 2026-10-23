from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

# Single source of truth for the low-cost connectivity-check model, so a future
# OpenAI deprecation is a one-line change in gpt5_config.py. Literal fallback
# keeps this module working even if the import path differs.
try:
    from backend.gpt5_config import OPENAI_LOW_MODEL, OPENROUTER_MODEL
except Exception:  # pragma: no cover
    try:
        from gpt5_config import OPENAI_LOW_MODEL, OPENROUTER_MODEL  # type: ignore
    except Exception:
        OPENAI_LOW_MODEL = "gpt-6-luna"
        OPENROUTER_MODEL = "google/gemma-4-31b-it:free"

# Shared helper: retry the OpenRouter call across diverse free models on a
# transient 404/429 so the "Test API" button doesn't fail just because one free
# model's upstream pool is momentarily rate-limited.
try:
    from backend.llm import _openrouter_create_with_fallback
except Exception:  # pragma: no cover
    try:
        from llm import _openrouter_create_with_fallback  # type: ignore
    except Exception:
        _openrouter_create_with_fallback = None

# OpenRouter support
try:
    import openrouter
except ImportError:
    openrouter = None


def _saved_cfg() -> dict:
    """Server-side saved keys (api_config.json, written by 'Save Keys'). Used as
    the last fallback so a saved key is actually usable for the connectivity test.
    Never raises."""
    try:
        from backend.api_config_storage import get_api_config
    except Exception:  # pragma: no cover
        try:
            from api_config_storage import get_api_config  # type: ignore
        except Exception:
            return {}
    try:
        return get_api_config() or {}
    except Exception:
        return {}

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
            # A misfiled OpenRouter key (sk-or-...) in the UI field is ignored, the same
            # way llm.get_api_config_from_headers does for real requests, so the test
            # reflects the key the app will actually use (.env / saved key).
            field_key = request.openaiKey or ""
            ignored_field_key = field_key.startswith("sk-or-")
            if ignored_field_key:
                field_key = ""
            effective_key = field_key or os.getenv("OPENAI_API_KEY", "") or _saved_cfg().get("openai_key", "")
            if not effective_key:
                if ignored_field_key:
                    raise HTTPException(status_code=400, detail="This looks like an OpenRouter key (sk-or-...), not an OpenAI key. Select the OpenRouter provider, or enter an OpenAI key (sk-...).")
                raise HTTPException(status_code=400, detail="OpenAI API key is required (none entered and OPENAI_API_KEY is not set on the server)")
            # Guard against a cross-provider key mix-up: an OpenRouter key
            # (sk-or-...) sent to OpenAI returns a confusing 401 "Incorrect API
            # key". Reject it here with an actionable message instead.
            if effective_key.startswith("sk-or-"):
                raise HTTPException(status_code=400, detail="This looks like an OpenRouter key (sk-or-...), not an OpenAI key. Select the OpenRouter provider, or enter an OpenAI key (sk-...).")

            # Test OpenAI — use lightest current-gen model for cheap connectivity check.
            # NB: GPT-5 family expects `max_completion_tokens` (not `max_tokens`).
            openai.api_key = effective_key
            response = openai.chat.completions.create(
                model=OPENAI_LOW_MODEL,
                messages=[{"role": "user", "content": "Hello! Please respond with 'OpenAI API is working correctly.'"}],
                max_completion_tokens=50
            )
            
            return {
                "success": True,
                "provider": "openai",
                "message": "OpenAI API connection successful"
                           + (" (the OpenAI field held an OpenRouter key sk-or-...; it was ignored and the server's OpenAI key was used; clear or replace the field)" if ignored_field_key else ""),
                "response": response.choices[0].message.content.strip()
            }
            
        elif request.provider == "openrouter":
            effective_key = request.openrouterKey or os.getenv("OPENROUTER_API_KEY", "") or _saved_cfg().get("openrouter_key", "")
            if not effective_key:
                raise HTTPException(status_code=400, detail="OpenRouter API key is required (none entered and OPENROUTER_API_KEY is not set on the server)")
            # Symmetric guard: a plain OpenAI key (sk-... but not sk-or-...) sent
            # to OpenRouter will fail auth; flag the mix-up clearly.
            if effective_key.startswith("sk-") and not effective_key.startswith("sk-or-"):
                raise HTTPException(status_code=400, detail="This looks like an OpenAI key (sk-...), not an OpenRouter key. Select the OpenAI provider, or enter an OpenRouter key (sk-or-...).")

            # OpenRouter via the OpenAI SDK pointed at OpenRouter's base URL (no
            # separate 'openrouter' package needed). Connectivity check uses the
            # configured free model; standard (non-reasoning) model → max_tokens.
            from openai import OpenAI
            or_client = OpenAI(api_key=effective_key, base_url="https://openrouter.ai/api/v1")
            msgs = [{"role": "user", "content": "Hello! Please respond with 'OpenRouter API is working correctly.'"}]
            params = {"max_tokens": 50}
            if _openrouter_create_with_fallback is not None:
                response, used_model = _openrouter_create_with_fallback(or_client, msgs, params, OPENROUTER_MODEL)
            else:  # pragma: no cover — defensive if the helper import failed
                used_model = OPENROUTER_MODEL
                response = or_client.chat.completions.create(model=OPENROUTER_MODEL, messages=msgs, **params)

            note = "" if used_model == OPENROUTER_MODEL else f" (default model was rate-limited; used free fallback {used_model})"
            return {
                "success": True,
                "provider": "openrouter",
                "message": f"OpenRouter API connection successful{note}",
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
