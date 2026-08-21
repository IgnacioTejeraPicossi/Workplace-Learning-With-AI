# This file will handle OpenAI GPT-5 configuration and integration 

import os
from dotenv import load_dotenv
import openai
try:
    from backend.prompts import CLASSIFY_UNKNOWN_INTENT, GENERATE_SCAFFOLD_PROMPT
    from backend.gpt5_config import get_optimal_model, get_gpt5_parameters
except ImportError:
    # Fallback for when running from root directory
    from prompts import CLASSIFY_UNKNOWN_INTENT, GENERATE_SCAFFOLD_PROMPT
    from gpt5_config import get_optimal_model, get_gpt5_parameters

# OpenRouter support
try:
    import openrouter
except ImportError:
    openrouter = None

# Load .env from project root (where backend/ folder is)
# load_dotenv() searches from current working directory, but we need it from project root
import pathlib
project_root = pathlib.Path(__file__).parent.parent.parent  # Go up from backend/llm.py to project root
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)  # Loads .env file from project root

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Debug: Log if API key was loaded
if OPENAI_API_KEY:
    print(f"[llm.py] ✅ OPENAI_API_KEY loaded from .env (length: {len(OPENAI_API_KEY)}, starts with 'sk-': {OPENAI_API_KEY.startswith('sk-')})")
else:
    print(f"[llm.py] ⚠️ OPENAI_API_KEY not found in .env file at: {env_path}")
    print(f"[llm.py]    Current working directory: {os.getcwd()}")
    print(f"[llm.py]    Project root: {project_root}")

# API Provider Selection (can be 'itemai', 'openai', or 'openrouter')
API_PROVIDER = os.getenv("API_PROVIDER", "openai").lower()


# ---------------------------------------------------------------------------
# Offline fast-mock switch (P2, 2026-08-20)
# ---------------------------------------------------------------------------
# When AI_FORCE_MOCK is truthy, ask_ai_unified / ask_ai_unified_sync return a
# mock response IMMEDIATELY, without touching the network. This exists so the
# offline smoke tests (Red Cross QA, Homo-vs-AI, …) can run as a fast CI gate:
# without it, every LLM call with no keys/headers still tries the local
# endpoints (localhost:1234, 192.168.50.142:1234) and waits ~seconds per call
# for a connection timeout before falling back to mock — turning the Red Cross
# smoke into a ~3-minute run. The returned string starts with the canonical
# "[MOCKED RESPONSE" sentinel, so every downstream service's existing
# mock-first deterministic fallback (is_mock path) triggers exactly as it does
# when all providers are genuinely unavailable. Default OFF → zero impact on
# production / local dev; opt-in only via the env var (CI sets AI_FORCE_MOCK=1).
_FORCE_MOCK_MESSAGE = "[MOCKED RESPONSE] AI_FORCE_MOCK is enabled (offline test mode)"


def _force_mock_enabled():
    """True when AI_FORCE_MOCK is set to a truthy value ('1','true','yes','on')."""
    return os.getenv("AI_FORCE_MOCK", "").strip().lower() in ("1", "true", "yes", "on")


def _normalize_temperature(value):
    """
    Normalize temperature to a safe float within [0.0, 2.0].
    Returns None if value is None or cannot be parsed.
    """
    if value is None:
        return None
    try:
        t = float(value)
    except Exception:
        return None
    if t < 0.0:
        return 0.0
    if t > 2.0:
        return 2.0
    return t

def _normalize_params_for_model(params: dict, model_name: str) -> dict:
    """
    Normalize parameters for different OpenAI models.

    GPT-5.x / o1 / o3 models have two API-level restrictions:
      1. They require 'max_completion_tokens' instead of 'max_tokens'
      2. They only accept the default temperature (1). Passing any other value
         (e.g. 0.7) returns HTTP 400 with 'unsupported_value'.

    We handle both by rewriting the params dict — the caller doesn't have to
    know which model needs what.

    Args:
        params: Dictionary of parameters to normalize
        model_name: Name of the model (e.g., 'gpt-5.5', 'gpt-4o')

    Returns:
        Normalized parameters dictionary
    """
    params = params.copy()  # Don't modify the original

    # Check if this is a GPT-5 / o-series reasoning model
    is_gpt5_model = model_name and (
        model_name.startswith("gpt-5") or
        model_name.startswith("o1") or
        model_name.startswith("o3")
    )

    if is_gpt5_model:
        # Convert max_tokens → max_completion_tokens
        if "max_tokens" in params:
            max_tokens_value = params.pop("max_tokens")
            params["max_completion_tokens"] = max_tokens_value

        # Drop temperature (and top_p, which has the same restriction on these
        # models). Leaving them out lets the API apply its default of 1, which
        # is the only value it accepts.
        for restricted in ("temperature", "top_p"):
            params.pop(restricted, None)

    return params

def get_api_config_from_headers(request_headers=None):
    """
    Get API configuration from request headers or use defaults
    This allows the frontend to pass API configuration via headers
    Validates API keys to avoid using placeholders like "tu-api-key-aqui"
    """
    if request_headers:
        # Try to get configuration from headers
        api_provider = request_headers.get('x-api-provider', API_PROVIDER)
        itemai_url = request_headers.get('x-itemai-url', 'http://localhost:1234')
        itemserverai_url = request_headers.get('x-itemserverai-url', 'http://192.168.50.142:1234')
        # Normalize ItemServerAI URL: convert https to http for internal IPs
        if itemserverai_url.startswith('https://192.168.'):
            itemserverai_url = itemserverai_url.replace('https://', 'http://')
        
        # Validate OpenAI key: must start with "sk-" and be reasonably long
        # If invalid or placeholder, use .env fallback
        openai_key_header = request_headers.get('x-openai-key', '')
        if openai_key_header and openai_key_header.startswith('sk-') and len(openai_key_header) > 20:
            openai_key = openai_key_header
        else:
            # Use .env fallback if header key is invalid or placeholder
            openai_key = OPENAI_API_KEY
        
        # Validate OpenRouter key: must be reasonably long
        openrouter_key_header = request_headers.get('x-openrouter-key', '')
        if openrouter_key_header and len(openrouter_key_header) > 10:
            openrouter_key = openrouter_key_header
        else:
            # Use .env fallback if header key is invalid or placeholder
            openrouter_key = OPENROUTER_API_KEY
        
        return {
            'provider': api_provider,
            'itemai_url': itemai_url,
            'itemserverai_url': itemserverai_url,
            'openai_key': openai_key,
            'openrouter_key': openrouter_key
        }
    
    # Fallback to environment variables
    return {
        'provider': API_PROVIDER,
        'itemai_url': 'http://localhost:1234',
        'itemserverai_url': 'http://192.168.50.142:1234',
        'openai_key': OPENAI_API_KEY,
        'openrouter_key': OPENROUTER_API_KEY
    }

def ask_ai_unified_sync(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, request_headers=None, temperature=None):
    """
    Synchronous version of unified AI system
    ItemAI (local) → OpenRouter → OpenAI with automatic fallback
    """
    if _force_mock_enabled():
        return _FORCE_MOCK_MESSAGE
    config = get_api_config_from_headers(request_headers)
    temperature = _normalize_temperature(temperature)
    
    # Respect explicit provider selection
    if config['provider'] == 'openai':
        # Direct OpenAI first
        try:
            openai_key_to_use = config.get('openai_key')
            print(f"🔄 Trying OpenAI (selected provider)...")
            print(f"   Using key from: {'header' if request_headers and request_headers.get('x-openai-key') else '.env'}")
            print(f"   Key length: {len(openai_key_to_use) if openai_key_to_use else 0}")
            print(f"   Key starts with 'sk-': {openai_key_to_use.startswith('sk-') if openai_key_to_use else False}")
            result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=openai_key_to_use)
            if result and not result.startswith("[MOCKED RESPONSE"):
                print("✅ OpenAI successful")
                return result
        except Exception as e:
            print(f"❌ OpenAI failed: {e}")
            import traceback
            traceback.print_exc()
        # Optional fallback to OpenRouter if key exists
        if config.get('openrouter_key'):
            try:
                print("🔄 Falling back to OpenRouter...")
                result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                if result and not result.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenRouter successful")
                    return result
            except Exception as e:
                print(f"❌ OpenRouter failed: {e}")
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    # Provider: openrouter → try OpenRouter first, then OpenAI
    if config['provider'] == 'openrouter':
        try:
            print("🔄 Trying OpenRouter (selected provider)...")
            result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
            if result and not result.startswith("[MOCKED RESPONSE"):
                print("✅ OpenRouter successful")
                return result
        except Exception as e:
            print(f"❌ OpenRouter failed: {e}")
        if config.get('openai_key'):
            try:
                print("🔄 Falling back to OpenAI...")
                result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'), temperature=temperature)
                if result and not result.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenAI successful")
                    return result
            except Exception as e:
                print(f"❌ OpenAI failed: {e}")
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    # Default/Provider: itemai → try ItemAI, then OpenRouter, then OpenAI
    if config['provider'] == 'itemai':
        itemai_failed = False
        try:
            print("🔄 Trying ItemAI (LM Studio) [Primary Provider]...")
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, temperature=temperature, url=config.get('itemai_url'))
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemAI (LM Studio) successful")
                return result
            else:
                itemai_failed = True
                print("❌ ItemAI returned empty or mocked response")
        except Exception as e:
            itemai_failed = True
            error_str = str(e)
            if "context length" in error_str.lower():
                print(f"⚠️ ItemAI failed due to context length limitation")
            elif "connection" in error_str.lower() or "refused" in error_str.lower():
                print(f"⚠️ ItemAI failed: LM Studio may not be running")
            else:
                print(f"❌ ItemAI failed: {e}")
        
        # Fallback chain: OpenRouter → OpenAI
        if itemai_failed:
            print(f"🔄 Automatic fallback chain activated (ItemAI → OpenRouter → OpenAI)")
            
            # Fallback to OpenRouter if configured
            if config.get('openrouter_key'):
                try:
                    print("   → Trying OpenRouter [Fallback 1]...")
                    result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenRouter successful (fallback from ItemAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenRouter failed: {e}")
            
            # Fallback to OpenAI if configured
            if config.get('openai_key'):
                try:
                    print("   → Trying OpenAI [Fallback 2]...")
                    result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'))
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenAI successful (fallback from ItemAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenAI failed: {e}")
        
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    # Provider: itemserverai → try ItemServerAI, then OpenRouter, then OpenAI
    if config['provider'] == 'itemserverai':
        itemserverai_failed = False
        try:
            print("🔄 Trying ItemServerAI (LM Studio) [Primary Provider]...")
            # Normalize URL: convert https to http for internal IPs
            itemserverai_url = config.get('itemserverai_url', 'http://192.168.50.142:1234')
            if itemserverai_url.startswith('https://192.168.'):
                itemserverai_url = itemserverai_url.replace('https://', 'http://')
                print(f"   → Normalized URL from https to http: {itemserverai_url}")
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, temperature=temperature, url=itemserverai_url)
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemServerAI (LM Studio) successful")
                return result
            else:
                itemserverai_failed = True
                print("❌ ItemServerAI returned empty or mocked response")
        except Exception as e:
            itemserverai_failed = True
            error_str = str(e)
            if "context length" in error_str.lower():
                print(f"⚠️ ItemServerAI failed due to context length limitation")
            elif "connection" in error_str.lower() or "refused" in error_str.lower():
                print(f"⚠️ ItemServerAI failed: LM Studio may not be running on server")
            else:
                print(f"❌ ItemServerAI failed: {e}")
        
        # Fallback chain: OpenRouter → OpenAI
        if itemserverai_failed:
            print(f"🔄 Automatic fallback chain activated (ItemServerAI → OpenRouter → OpenAI)")
            
            # Fallback to OpenRouter if configured
            if config.get('openrouter_key'):
                try:
                    print("   → Trying OpenRouter [Fallback 1]...")
                    result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenRouter successful (fallback from ItemServerAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenRouter failed: {e}")
            
            # Fallback to OpenAI if configured
            if config.get('openai_key'):
                try:
                    print("   → Trying OpenAI [Fallback 2]...")
                    result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'), temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenAI successful (fallback from ItemServerAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenAI failed: {e}")
    
    print("❌ All AI providers failed")
    return "[MOCKED RESPONSE] All AI providers unavailable"

async def ask_ai_unified(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, request_headers=None, temperature=None):
    """
    Unified AI system that reads configuration from API Config and tries all providers
    ItemAI (local) → OpenRouter → OpenAI with automatic fallback
    """
    if _force_mock_enabled():
        return _FORCE_MOCK_MESSAGE
    config = get_api_config_from_headers(request_headers)
    temperature = _normalize_temperature(temperature)
    
    # Respect explicit provider selection
    if config['provider'] == 'openai':
        try:
            openai_key_to_use = config.get('openai_key')
            print(f"🔄 Trying OpenAI (selected provider)...")
            print(f"   Using key from: {'header' if request_headers and request_headers.get('x-openai-key') else '.env'}")
            print(f"   Key length: {len(openai_key_to_use) if openai_key_to_use else 0}")
            print(f"   Key starts with 'sk-': {openai_key_to_use.startswith('sk-') if openai_key_to_use else False}")
            result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=openai_key_to_use)
            if result and not result.startswith("[MOCKED RESPONSE"):
                print("✅ OpenAI successful")
                return result
        except Exception as e:
            print(f"❌ OpenAI failed: {e}")
            import traceback
            traceback.print_exc()
        if config.get('openrouter_key'):
            try:
                print("🔄 Falling back to OpenRouter...")
                result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                if result and not result.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenRouter successful")
                    return result
            except Exception as e:
                print(f"❌ OpenRouter failed: {e}")
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    if config['provider'] == 'openrouter':
        try:
            print("🔄 Trying OpenRouter (selected provider)...")
            result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
            if result and not result.startswith("[MOCKED RESPONSE"):
                print("✅ OpenRouter successful")
                return result
        except Exception as e:
            print(f"❌ OpenRouter failed: {e}")
        if config.get('openai_key'):
            try:
                print("🔄 Falling back to OpenAI...")
                result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'), temperature=temperature)
                if result and not result.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenAI successful")
                    return result
            except Exception as e:
                print(f"❌ OpenAI failed: {e}")
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    # Default/Provider: itemai
    if config['provider'] == 'itemai':
        itemai_failed = False
        try:
            print("🔄 Trying ItemAI (LM Studio) [Primary Provider]...")
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, temperature=temperature, url=config.get('itemai_url'))
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemAI (LM Studio) successful")
                return result
            else:
                itemai_failed = True
                print("❌ ItemAI returned empty or mocked response")
        except Exception as e:
            itemai_failed = True
            error_str = str(e)
            if "context length" in error_str.lower():
                print(f"⚠️ ItemAI failed due to context length limitation")
            elif "connection" in error_str.lower() or "refused" in error_str.lower():
                print(f"⚠️ ItemAI failed: LM Studio may not be running")
            else:
                print(f"❌ ItemAI failed: {e}")
        
        # Fallback chain: OpenRouter → OpenAI
        if itemai_failed:
            print(f"🔄 Automatic fallback chain activated (ItemAI → OpenRouter → OpenAI)")
            
            # Fallback to OpenRouter if configured
            if config.get('openrouter_key'):
                try:
                    print("   → Trying OpenRouter [Fallback 1]...")
                    result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenRouter successful (fallback from ItemAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenRouter failed: {e}")
            
            # Fallback to OpenAI if configured
            if config.get('openai_key'):
                try:
                    print("   → Trying OpenAI [Fallback 2]...")
                    result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'), temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenAI successful (fallback from ItemAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenAI failed: {e}")
        
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"
    
    # Provider: itemserverai → try ItemServerAI, then OpenRouter, then OpenAI
    if config['provider'] == 'itemserverai':
        itemserverai_failed = False
        try:
            print("🔄 Trying ItemServerAI (LM Studio) [Primary Provider]...")
            # Normalize URL: convert https to http for internal IPs
            itemserverai_url = config.get('itemserverai_url', 'http://192.168.50.142:1234')
            if itemserverai_url.startswith('https://192.168.'):
                itemserverai_url = itemserverai_url.replace('https://', 'http://')
                print(f"   → Normalized URL from https to http: {itemserverai_url}")
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, temperature=temperature, url=itemserverai_url)
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemServerAI (LM Studio) successful")
                return result
            else:
                itemserverai_failed = True
                print("❌ ItemServerAI returned empty or mocked response")
        except Exception as e:
            itemserverai_failed = True
            error_str = str(e)
            if "context length" in error_str.lower():
                print(f"⚠️ ItemServerAI failed due to context length limitation")
            elif "connection" in error_str.lower() or "refused" in error_str.lower():
                print(f"⚠️ ItemServerAI failed: LM Studio may not be running on server")
            else:
                print(f"❌ ItemServerAI failed: {e}")
        
        # Fallback chain: OpenRouter → OpenAI
        if itemserverai_failed:
            print(f"🔄 Automatic fallback chain activated (ItemServerAI → OpenRouter → OpenAI)")
            
            # Fallback to OpenRouter if configured
            if config.get('openrouter_key'):
                try:
                    print("   → Trying OpenRouter [Fallback 1]...")
                    result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenRouter successful (fallback from ItemServerAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenRouter failed: {e}")
            
            # Fallback to OpenAI if configured
            if config.get('openai_key'):
                try:
                    print("   → Trying OpenAI [Fallback 2]...")
                    result = ask_openai(prompt, task_type, complexity, max_tokens, messages, override_api_key=config.get('openai_key'), temperature=temperature)
                    if result and not result.startswith("[MOCKED RESPONSE"):
                        print("✅ OpenAI successful (fallback from ItemServerAI)")
                        return result
                except Exception as e:
                    print(f"   ❌ OpenAI failed: {e}")
        
        print("❌ All AI providers failed")
        return "[MOCKED RESPONSE] All AI providers unavailable"

def ask_openai(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, override_api_key=None, temperature=None):
    """
    Enhanced OpenAI function with GPT-5 model selection and optimization.
    Now supports ItemAI API (local), OpenRouter, and OpenAI APIs with intelligent fallback.
    
    Args:
        prompt: The prompt to send
        task_type: Type of task for optimal model selection
        complexity: Task complexity (low, medium, high)
        max_tokens: Maximum tokens for response
        messages: Alternative to prompt for conversation format
    """
    # Try ItemAI API first if configured and selected (local, free)
    if API_PROVIDER == "itemai":
        try:
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
            if result and not result.startswith("[MOCKED RESPONSE"):
                return result
        except Exception as e:
            print(f"ItemAI API failed, falling back to OpenRouter: {e}")
    
    # Try OpenRouter if configured and selected
    if API_PROVIDER == "openrouter" and OPENROUTER_API_KEY and openrouter:
        try:
            result = ask_openrouter(prompt, task_type, complexity, max_tokens, messages, temperature=temperature)
            if result and not result.startswith("[MOCKED RESPONSE"):
                return result
        except Exception as e:
            print(f"OpenRouter failed, falling back to OpenAI: {e}")
    
    # Fallback to OpenAI
    effective_openai_key = override_api_key or OPENAI_API_KEY
    print(f"[ask_openai] override_api_key: {override_api_key[:10] + '...' if override_api_key and len(override_api_key) > 10 else override_api_key}")
    print(f"[ask_openai] OPENAI_API_KEY from .env: {OPENAI_API_KEY[:10] + '...' if OPENAI_API_KEY and len(OPENAI_API_KEY) > 10 else OPENAI_API_KEY}")
    print(f"[ask_openai] effective_openai_key: {effective_openai_key[:10] + '...' if effective_openai_key and len(effective_openai_key) > 10 else effective_openai_key}")
    
    if not effective_openai_key or str(effective_openai_key).strip() == "":
        # No key found, return mock response
        print("[ask_openai] ❌ No valid OpenAI API key found! Check .env file.")
        if prompt:
            return f"[MOCKED RESPONSE] This would be the AI's answer to: {prompt[:60]}..."
        elif messages:
            return f"[MOCKED RESPONSE] This would be the AI's answer to: {messages[-1]['content'][:60]}..."
        else:
            return "[MOCKED RESPONSE] No prompt or messages provided."
    
    def _call_openai(model_name: str):
        # Normalize parameters for the specific model (e.g., gpt-5.2 needs max_completion_tokens)
        normalized_params = _normalize_params_for_model(params, model_name)
        if messages:
            return openai.chat.completions.create(
                model=model_name,
                messages=messages,
                **normalized_params
            )
        return openai.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            **normalized_params
        )

    try:
        # Get optimal GPT-5 model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)

        # Optional override (e.g., from UI/MCP) — keep within safe bounds
        temp = _normalize_temperature(temperature)
        if temp is not None:
            params["temperature"] = temp
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided (will be converted to max_completion_tokens for GPT-5 models)
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Use old OpenAI syntax for compatibility with openai==0.28.1
        openai.api_key = effective_openai_key

        response = _call_openai(model_to_use)
        content = (response.choices[0].message.content or "").strip()
        finish = getattr(response.choices[0], "finish_reason", None)
        # GPT-5 / o-series are REASONING models: reasoning tokens count against
        # max_completion_tokens. With a small budget (e.g. 800–900 for code
        # generation), reasoning can consume the entire budget and return EMPTY
        # content with finish_reason="length". Detected live: gpt-5.5 @ 900 →
        # reasoning_tokens=900, content_len=0. Retry once with a much larger
        # budget so there is room for the actual answer after reasoning.
        _is_reasoning = bool(model_to_use) and (
            model_to_use.startswith("gpt-5") or model_to_use.startswith("o1") or model_to_use.startswith("o3")
        )
        if not content and finish == "length" and _is_reasoning:
            current = params.get("max_completion_tokens") or params.get("max_tokens") or 900
            bigger = max(int(current) * 4, 4096)
            retry_params = _normalize_params_for_model({**params, "max_tokens": bigger}, model_to_use)
            print(f"[ask_openai] ⚠️ empty content (reasoning starved budget={current}). Retrying model='{model_to_use}' with max_completion_tokens={bigger}")
            if messages:
                r2 = openai.chat.completions.create(model=model_to_use, messages=messages, **retry_params)
            else:
                r2 = openai.chat.completions.create(model=model_to_use, messages=[{"role": "user", "content": prompt}], **retry_params)
            content = (r2.choices[0].message.content or "").strip()
        return content
    except Exception as e:
        # Log the full error so we can see whether it's "model not found", "no access", etc.
        err_str = str(e)
        print(f"[ask_openai] ❌ OpenAI call failed for model='{model_to_use}': {err_str}")

        # If the chosen model isn't available for this API key/org, retry with a safe fallback.
        # This avoids breaking the J-messages analyzer when a new model name isn't enabled.
        lowered = err_str.lower()
        likely_model_issue = any(s in lowered for s in [
            "model_not_found",
            "no such model",
            "does not exist",
            "not found",
            "invalid model",
        ])

        # Fallback default updated 2026-06-17 (OpenAI deprecation 2026-12-11):
        # gpt-4o → gpt-5.4-mini (per OpenAI's recommended replacement table)
        fallback_model = "gpt-5.4-mini"
        if likely_model_issue and model_to_use != fallback_model:
            try:
                print(f"[ask_openai] ↩️ Retrying with fallback model='{fallback_model}'")
                # For fallback, ensure params are normalized for gpt-5.4-mini (uses max_tokens)
                fallback_params = params.copy()
                if "max_completion_tokens" in fallback_params:
                    # Convert back to max_tokens for gpt-5.4-mini
                    fallback_params["max_tokens"] = fallback_params.pop("max_completion_tokens")
                original_params = params
                params = fallback_params
                response = _call_openai(fallback_model)
                params = original_params  # Restore original params
                return response.choices[0].message.content.strip()
            except Exception as e2:
                print(f"[ask_openai] ❌ Fallback model failed too: {e2}")

        return f"[MOCKED RESPONSE - Error: {err_str}] This would be the AI's answer to: {prompt[:60]}..."

def ask_openrouter(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, temperature=None):
    """
    OpenRouter API function with model selection and optimization.
    
    Args:
        prompt: The prompt to send
        task_type: Type of task for optimal model selection
        complexity: Task complexity (low, medium, high)
        max_tokens: Maximum tokens for response
        messages: Alternative to prompt for conversation format
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.strip() == "":
        return f"[MOCKED RESPONSE] OpenRouter API key not configured."
    
    try:
        # Get optimal model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)

        # Optional override (e.g., from UI/MCP) — keep within safe bounds
        temp = _normalize_temperature(temperature)
        if temp is not None:
            params["temperature"] = temp
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided (will be converted to max_completion_tokens for GPT-5 models)
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Normalize parameters for the specific model (e.g., gpt-5.2 needs max_completion_tokens)
        # Note: OpenRouter may handle this differently, but we normalize for consistency
        params = _normalize_params_for_model(params, model_to_use)
        
        # Configure OpenRouter client
        openrouter.api_key = OPENROUTER_API_KEY
        openrouter.api_base = OPENROUTER_BASE_URL
        
        if messages:
            response = openrouter.ChatCompletion.create(
                model=model_to_use,
                messages=messages,
                **params
            )
        else:
            response = openrouter.ChatCompletion.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                **params
            )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[MOCKED RESPONSE - Error: {str(e)}] This would be the AI's answer to: {prompt[:60]}..." 

def ask_openai_stream(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, request_headers=None):
    """
    Enhanced streaming OpenAI function with GPT-5 model selection.
    Now supports both OpenAI and OpenRouter APIs.
    """
    # Get configuration from headers if available
    config = get_api_config_from_headers(request_headers)
    
    # Respect provider selection for streaming
    if config['provider'] == 'openai':
        # Stream directly from OpenAI using per-request key
        if not config.get('openai_key') or str(config.get('openai_key')).strip() == "":
            # No key → yield mock
            mock = "[MOCKED STREAMING ERROR: Missing OpenAI key]"
            for ch in mock:
                yield ch
            return
        try:
            print(f"[LLM STREAM] cfg provider=openai | openai_key_len={len(config.get('openai_key') or '')} | openrouter_key_len={len(config.get('openrouter_key') or '')}")
            # Get optimal model and parameters
            model = get_optimal_model(task_type, complexity)
            params = get_gpt5_parameters(model, task_type)
            model_to_use = params.pop("model", model)
            if max_tokens:
                params["max_tokens"] = max_tokens
            # Normalize parameters for the specific model (e.g., gpt-5.2 needs max_completion_tokens)
            params = _normalize_params_for_model(params, model_to_use)
            openai.api_key = config.get('openai_key')
            if messages:
                response = openai.chat.completions.create(
                    model=model_to_use,
                    messages=messages,
                    stream=True,
                    **params
                )
            else:
                response = openai.chat.completions.create(
                    model=model_to_use,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                    **params
                )
            for chunk in response:
                if hasattr(chunk, 'choices') and chunk.choices:
                    delta = chunk.choices[0].delta
                    content = getattr(delta, 'content', None)
                    if content:
                        yield content
            return
        except Exception as e:
            err = f"Sorry, I encountered an error: {str(e)}"
            for ch in err:
                yield ch
            return
    
    # Try ItemAI first if configured
    if config['provider'] == 'itemai':
        try:
            print("🔄 Trying ItemAI (LM Studio) streaming...")
            # For now, use the sync version and stream it character by character
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, url=config.get('itemai_url'))
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemAI (LM Studio) streaming successful")
                for char in result:
                    yield char
                return
            else:
                print("❌ ItemAI returned empty or mocked response")
        except Exception as e:
            print(f"❌ ItemAI streaming failed: {e}")
    
    # Try ItemServerAI if configured
    if config['provider'] == 'itemserverai':
        try:
            print("🔄 Trying ItemServerAI (LM Studio) streaming...")
            # Normalize URL: convert https to http for internal IPs
            itemserverai_url = config.get('itemserverai_url', 'http://192.168.50.142:1234')
            if itemserverai_url.startswith('https://192.168.'):
                itemserverai_url = itemserverai_url.replace('https://', 'http://')
                print(f"   → Normalized URL from https to http: {itemserverai_url}")
            # For now, use the sync version and stream it character by character
            result = ask_itemai(prompt, task_type, complexity, max_tokens, messages, url=itemserverai_url)
            if result and not result.startswith("[MOCKED RESPONSE") and result is not None:
                print("✅ ItemServerAI (LM Studio) streaming successful")
                for char in result:
                    yield char
                return
            else:
                print("❌ ItemServerAI returned empty or mocked response")
        except Exception as e:
            print(f"❌ ItemServerAI streaming failed: {e}")
    
    # Try OpenRouter if configured
    if config['provider'] == 'openrouter' and config['openrouter_key']:
        try:
            print("🔄 Trying OpenRouter streaming...")
            for chunk in ask_openrouter_stream(prompt, task_type, complexity, max_tokens, messages):
                yield chunk
            return
        except Exception as e:
            print(f"OpenRouter streaming failed, falling back to OpenAI: {e}")
    
    # Fallback to OpenAI
    if not config['openai_key'] or config['openai_key'].strip() == "":
        # No key found, yield a mock response for testing
        mock_response = f"""I'm your AI Study Buddy powered by GPT-5! Here's a helpful response to your question:

"{prompt or 'Hello'}"

This is a mock response since no OpenAI API key is configured. In a real environment, I would provide detailed, AI-powered answers about workplace learning, micro-lessons, career development, and other topics.

To get real AI responses, please configure your OPENAI_API_KEY in the .env file.

For now, here are some general tips:
- Micro-lessons are bite-sized learning modules designed for quick consumption
- AI can help personalize learning paths based on your goals
- Skills forecasting uses data to predict future learning needs
- Scenario simulations provide hands-on practice in safe environments

Would you like to know more about any specific feature?"""
        
        # Stream the mock response character by character to simulate real streaming
        for char in mock_response:
            yield char
        return
    
    # If we have an API key, try to use OpenAI with GPT-5
    try:
        # Get optimal GPT-5 model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided (will be converted to max_completion_tokens for GPT-5 models)
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Normalize parameters for the specific model (e.g., gpt-5.2 needs max_completion_tokens)
        params = _normalize_params_for_model(params, model_to_use)
        
        # Use old OpenAI syntax for compatibility with openai==0.28.1
        openai.api_key = config.get('openai_key') or OPENAI_API_KEY
        
        if messages:
            response = openai.chat.completions.create(
                model=model_to_use,
                messages=messages,
                stream=True,
                **params
            )
        else:
            response = openai.chat.completions.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                **params
            )
        for chunk in response:
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', None)
                if content:
                    yield content
    except Exception as e:
        # Fallback to mock response if API call fails
        mock_response = f"Sorry, I encountered an error: {str(e)}. Here's a helpful response instead:\n\n"
        mock_response += f"Regarding your question about '{prompt or 'learning'}', here are some general insights:\n"
        mock_response += "- Micro-lessons are bite-sized learning modules\n"
        mock_response += "- AI can personalize your learning experience\n"
        mock_response += "- Skills forecasting helps plan your career path\n"
        mock_response += "- Scenario simulations provide hands-on practice\n\n"
        mock_response += "Would you like to know more about any specific topic?"
        
        for char in mock_response:
            yield char

def web_search_query(query):
    """
    Enhanced web search with GPT-5 model selection.
    Now supports both OpenAI and OpenRouter APIs.
    """
    # Try OpenRouter first if configured and selected
    if API_PROVIDER == "openrouter" and OPENROUTER_API_KEY and openrouter:
        try:
            return web_search_openrouter(query)
        except Exception as e:
            print(f"OpenRouter web search failed, falling back to OpenAI: {e}")
    
    # Fallback to OpenAI
    # Use GPT-5-mini for web search (fast and cost-effective)
    model = get_optimal_model("web_search", "medium")
    params = get_gpt5_parameters(model, "web_search")
    
    response = openai.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": query}],
        tools=[{"type": "web_search"}],
        tool_choice="auto",
        **params
    )
    return response.choices[0].message.content

def web_search_openrouter(query):
    """
    OpenRouter web search function.
    """
    # Use optimal model for web search
    model = get_optimal_model("web_search", "medium")
    params = get_gpt5_parameters(model, "web_search")
    
    # Configure OpenRouter client
    openrouter.api_key = OPENROUTER_API_KEY
    openrouter.api_base = OPENROUTER_BASE_URL
    
    response = openrouter.ChatCompletion.create(
        model=model,
        messages=[{"role": "user", "content": query}],
        tools=[{"type": "web_search"}],
        tool_choice="auto",
        **params
    )
    return response.choices[0].message.content 

def ask_openrouter_stream(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None):
    """
    OpenRouter streaming API function with model selection and optimization.
    
    Args:
        prompt: The prompt to send
        task_type: Type of task for optimal model selection
        complexity: Task complexity (low, medium, high)
        max_tokens: Maximum tokens for response
        messages: Alternative to prompt for conversation format
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.strip() == "":
        yield f"[MOCKED RESPONSE] OpenRouter API key not configured."
        return
    
    try:
        # Get optimal model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided (will be converted to max_completion_tokens for GPT-5 models)
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Normalize parameters for the specific model (e.g., gpt-5.2 needs max_completion_tokens)
        # Note: OpenRouter may handle this differently, but we normalize for consistency
        params = _normalize_params_for_model(params, model_to_use)
        
        # Configure OpenRouter client
        openrouter.api_key = OPENROUTER_API_KEY
        openrouter.api_base = OPENROUTER_BASE_URL
        
        if messages:
            response = openrouter.ChatCompletion.create(
                model=model_to_use,
                messages=messages,
                stream=True,
                **params
            )
        else:
            response = openrouter.ChatCompletion.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                **params
            )
        for chunk in response:
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', None)
                if content:
                    yield content
    except Exception as e:
        # Fallback to mock response if API call fails
        mock_response = f"Sorry, I encountered an error: {str(e)}. Here's a helpful response instead:\n\n"
        mock_response += f"Regarding your question about '{prompt or 'learning'}', here are some general insights:\n"
        mock_response += "- Micro-lessons are bite-sized learning modules\n"
        mock_response += "- AI can personalize your learning experience\n"
        mock_response += "- Skills forecasting helps plan your career path\n"
        mock_response += "- Scenario simulations provide hands-on practice\n\n"
        mock_response += "Would you like to know more about any specific topic?"
        
        for char in mock_response:
            yield char

import json

ROUTER_PROMPT = """
You are an AI router in a workplace learning platform powered by GPT-5.
A user sends a free-form request. Your job is to determine which module should handle it.

Available modules:
- concepts: Generate 3 learning concepts
- microlesson: Generate a short learning module with quiz
- simulation: Create a scenario-based training simulation
- recommendation: Suggest what to learn next
- certification: Recommend and plan for official certification
- coach: Career advice and planning
- forecast: Skill prediction and development advice
- videolesson: Show a video-based lesson with quiz

Respond with:
{ \"module\": \"<module_name>\", \"reason\": \"<why this module is a good fit>\" }

User query:
\"{query}\"
"""

async def call_llm_router(query):
    # Use the classifier to get intent and confidence
    classification = classify_intent(query)
    confidence = classification.get('confidence', 'Low')
    module = classification.get('module_match')
    reason = classification.get('intent')
    if confidence == 'High' and module:
        return {"module": module, "reason": reason, "confidence": confidence}
    else:
        return {"module": None, "reason": reason, "confidence": confidence} 

def classify_intent(user_input: str) -> dict:
    """Classify a user's unknown request and return structured insight using GPT-5."""
    prompt = CLASSIFY_UNKNOWN_INTENT.format(user_input=user_input)
    
    # Check if we have OpenAI API key first
    if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "":
        # No API key - return a smart mock classification based on keywords
        return classify_with_keywords(user_input)
    
    try:
        # Use GPT-5-mini for classification (fast and accurate)
        response = ask_openai(
            prompt=prompt, 
            task_type="classification", 
            complexity="medium", 
            max_tokens=512
        )
        
        # Check if response is already a valid JSON string
        if response.startswith('{') and response.endswith('}'):
            import json
            return json.loads(response)
        elif '```json' in response and '```' in response:
            # Response is in Markdown code block format, extract JSON
            try:
                import json
                import re
                # Extract content between ```json and ```
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
                if json_match:
                    json_content = json_match.group(1)
                    return json.loads(json_content)
                else:
                    print("Could not extract JSON from Markdown block, using keyword classification")
                    return classify_with_keywords(user_input)
            except Exception as e:
                print(f"Error parsing JSON from Markdown: {e}, using keyword classification")
                return classify_with_keywords(user_input)
        else:
            # Response is not JSON, use keyword classification as fallback
            print("AI response is not valid JSON, using keyword classification")
            return classify_with_keywords(user_input)
            
    except Exception as e:
        print("Classification error:", e)
        return classify_with_keywords(user_input)

def classify_with_keywords(user_input: str) -> dict:
    """Fallback classification using keyword matching when AI is not available."""
    input_lower = user_input.lower()
    
    # Define keyword mappings for modules
    module_keywords = {
        "ai-concepts": ["concept", "concepto", "idea", "learn", "aprender", "knowledge", "conocimiento"],
        "micro-lessons": ["micro", "lesson", "lección", "short", "corto", "quick", "rápido"],
        "video-lessons": ["video", "video lesson", "lección de video", "watch", "ver"],
        "simulations": ["simulation", "simulación", "scenario", "escenario", "practice", "práctica"],
        "ai-career-coach": ["coach", "career", "carrera", "advice", "consejo", "planning", "planificación"],
        "skills-forecast": ["forecast", "predicción", "future", "futuro", "skill", "habilidad"],
        "certifications": ["certification", "certificación", "cert", "study plan", "plan de estudio"],
        "web-search": ["search", "buscar", "web", "internet", "research", "investigar"],
        "recommendations": ["recommend", "recomendar", "what to learn", "qué aprender", "next", "siguiente"]
    }
    
    # Find the best module match
    best_match = None
    best_score = 0
    
    for module, keywords in module_keywords.items():
        score = sum(1 for keyword in keywords if keyword in input_lower)
        if score > best_score:
            best_score = score
            best_match = module
    
    # Determine confidence based on match quality
    if best_score >= 2:
        confidence = "High"
    elif best_score >= 1:
        confidence = "Medium"
    else:
        confidence = "Low"
    
    # Generate appropriate response
    if best_match and confidence in ["High", "Medium"]:
        return {
            "intent": f"User wants to access {best_match.replace('-', ' ')}",
            "module_match": best_match,
            "new_feature": None,
            "confidence": confidence,
            "follow_up_question": "Is this what you were looking for?"
        }
    else:
        return {
            "intent": "User request unclear",
            "module_match": None,
            "new_feature": "Enhanced Intent Recognition",
            "confidence": "Low",
            "follow_up_question": "Sorry, I didn't quite understand that. Could you rephrase?"
        } 

def generate_scaffold(feature_name, feature_summary, scaffold_type="API Route"):
    from backend.prompts import SCAFFOLD_TYPE_PROMPT
    prompt = SCAFFOLD_TYPE_PROMPT.format(
        scaffold_type=scaffold_type,
        feature_name=feature_name,
        feature_summary=feature_summary
    )
    # Use GPT-5 for scaffold generation (complex task).
    # 4096, not 800: gpt-5.x reasoning tokens count against the completion
    # budget — a small budget returns EMPTY content (see ask_openai retry note).
    return ask_openai(
        prompt=prompt,
        task_type="code_generation",
        complexity="high",
        max_tokens=4096
    )

async def generate_summary(filename: str, content: str) -> str:
    """Generate a summary of a code file for documentation using GPT-5."""
    prompt = f"""
You are a technical documentation assistant powered by GPT-5. Analyze the following code file and provide a clear, concise summary.

File: {filename}
Content:
{content[:3000]}

Please provide a summary that includes:
1. What this file does (purpose and functionality)
2. Key components or functions
3. Important dependencies or relationships
4. Any notable patterns or architecture decisions

Write in clear, professional language suitable for technical documentation.
"""
    # Use GPT-5-mini for documentation (good balance of quality and cost)
    return ask_openai(
        prompt, 
        task_type="documentation", 
        complexity="medium", 
        max_tokens=500
    )

async def generate_quiz_questions(markdown_content: str, num_questions: int = 3, difficulty: str = "medium") -> list:
    """Generate quiz questions from markdown content using GPT-5."""
    prompt = f"""
You are a workplace learning assistant powered by GPT-5. Based on this markdown documentation, generate {num_questions} multiple-choice quiz questions.

Documentation:
{markdown_content[:4000]}

Difficulty Level: {difficulty}

Please generate questions in this exact JSON format:
[
  {{
    "question": "What is the main purpose of this component?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "This is the correct answer because..."
  }}
]

Make sure the questions are relevant to the content and appropriate for the specified difficulty level.
"""
    
    try:
        # Use GPT-5-mini for quiz generation (good for structured output)
        response = ask_openai(
            prompt, 
            task_type="quiz_generation", 
            complexity="medium", 
            max_tokens=1000
        )
        # Try to parse the JSON response
        import json
        import re
        
        # Extract JSON from the response
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            quiz_data = json.loads(json_match.group())
            return quiz_data
        else:
            # Fallback: return a simple quiz structure
            return [
                {
                    "question": "What is the main purpose of this documentation?",
                    "options": ["To explain the codebase", "To provide installation instructions", "To list all files", "To show examples"],
                    "correct_answer": "To explain the codebase",
                    "explanation": "The documentation explains the structure and purpose of the codebase."
                }
            ]
    except Exception as e:
        print(f"Error generating quiz questions: {e}")
        # Return a fallback quiz if parsing fails
        return [
            {
                "question": "What is the main purpose of this documentation?",
                "options": ["To explain the codebase", "To provide installation instructions", "To list all files", "To show examples"],
                "correct_answer": "To explain the codebase",
                "explanation": "The documentation explains the structure and purpose of the codebase."
            }
        ]

def ask_itemai(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None, temperature=None, url=None):
    """
    ItemAI API function for local LM Studio integration.
    
    Args:
        prompt: The prompt to send
        task_type: Type of task for optimal model selection
        complexity: Task complexity (low, medium, high)
        max_tokens: Maximum tokens for response
        messages: Alternative to prompt for conversation format
        url: Optional URL for LM Studio (defaults to http://localhost:1234)
    """
    try:
        import httpx
        
        # Default local URL for LM Studio, or use provided URL
        local_url = url or "http://localhost:1234"
        
        # Prepare the request payload
        temp = _normalize_temperature(temperature)
        if messages:
            payload = {
                "model": "default",  # LM Studio will use the loaded model
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temp if temp is not None else 0.7,
                "stream": False
            }
        else:
            payload = {
                "model": "default",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temp if temp is not None else 0.7,
                "stream": False
            }
        
        # Make request to local LM Studio
        # Timeout: 420s (7 minutes) to match MCP server timeout
        # Note: This is very slow. Consider using OpenAI for large documents.
        with httpx.Client(timeout=420.0) as client:
            response = client.post(
                f"{local_url}/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                response_data = response.json()
                completion_text = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return completion_text.strip()
            else:
                error_text = response.text
                # Check for context length errors
                if "context length" in error_text.lower() or "context.*overflow" in error_text.lower():
                    try:
                        error_json = response.json()
                        error_msg = error_json.get("error", error_text)
                        raise Exception(f"ItemAI API context length error: {error_msg}")
                    except:
                        raise Exception(f"ItemAI API returned status {response.status_code}: {error_text}")
                else:
                    raise Exception(f"ItemAI API returned status {response.status_code}: {error_text}")
                
    except httpx.RequestError as e:
        # Connection errors (LM Studio not running, network issues, etc.)
        print(f"❌ ItemAI API connection error: {e}")
        print(f"   → Check if LM Studio is running at {local_url}")
        return None
    except Exception as e:
        error_str = str(e)
        # Detect context length errors
        if "context length" in error_str.lower():
            print(f"⚠️ ItemAI API context length error: {error_str}")
            print(f"   → The prompt is too long for the model's context window")
            print(f"   → Solution: Use a model with larger context (8K, 16K, or 32K tokens)")
            print(f"   → Falling back to next provider...")
        else:
            print(f"❌ ItemAI API error: {e}")
        return None

# --- Unified AI System for AgentOps Studio ---
async def ask_openai_unified(messages, model=None, temperature=None, max_tokens=None, **kwargs):
    """
    Unified AI system for AgentOps Studio with automatic fallback:
    ItemAI (local) → OpenRouter → OpenAI
    
    Args:
        messages: List of message dictionaries
        model: Model name (optional)
        temperature: Temperature for AI responses (optional)
        max_tokens: Maximum tokens (optional)
        **kwargs: Additional parameters
    """
    try:
        # Try ItemAI (LM Studio) first
        print("🔄 Trying ItemAI (LM Studio)...")
        response = ask_itemai(
            messages=messages,
            max_tokens=max_tokens or 512,
            task_type="general",
            complexity="medium"
        )
        if response and not response.startswith("[MOCKED RESPONSE"):
            print("✅ ItemAI (LM Studio) successful")
            return response
    except Exception as e:
        print(f"❌ ItemAI failed: {e}")
    
    # Fallback to OpenRouter
    try:
        print("🔄 Trying OpenRouter...")
        response = ask_openrouter(
            messages=messages,
            max_tokens=max_tokens or 512,
            task_type="general",
            complexity="medium"
        )
        if response and not response.startswith("[MOCKED RESPONSE"):
            print("✅ OpenRouter successful")
            return response
    except Exception as e:
        print(f"❌ OpenRouter failed: {e}")
    
    # Fallback to OpenAI
    try:
        print("🔄 Trying OpenAI...")
        response = ask_openai(
            messages=messages,
            max_tokens=max_tokens or 512,
            task_type="general",
            complexity="medium"
        )
        if response and not response.startswith("[MOCKED RESPONSE"):
            print("✅ OpenAI successful")
            return response
    except Exception as e:
        print(f"❌ OpenAI failed: {e}")
    
    print("❌ All AI providers failed")
    return "[MOCKED RESPONSE] All AI providers unavailable" 