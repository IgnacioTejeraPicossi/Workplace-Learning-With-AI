"""
API Configuration Storage
Stores API configuration (provider, keys, URLs) in a JSON file on the server.
This allows the MCP Server to use the same configuration as the web app.
"""
import json
import os
import pathlib
from typing import Dict, Any, Optional

# Path to the API config file (in project root)
project_root = pathlib.Path(__file__).parent.parent
CONFIG_FILE = project_root / "api_config.json"


def get_api_config() -> Dict[str, Any]:
    """
    Read API configuration from JSON file.
    Returns default values if file doesn't exist.
    """
    if not CONFIG_FILE.exists():
        return {
            "provider": "openai",
            "openai_key": "",
            "openrouter_key": "",
            "itemai_url": "http://localhost:1234"
        }
    
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
        return {
            "provider": config.get("provider", "openai"),
            "openai_key": config.get("openai_key", ""),
            "openrouter_key": config.get("openrouter_key", ""),
            "itemai_url": config.get("itemai_url", "http://localhost:1234")
        }
    except Exception as e:
        print(f"[api_config_storage] Error reading config file: {e}")
        return {
            "provider": "openai",
            "openai_key": "",
            "openrouter_key": "",
            "itemai_url": "http://localhost:1234"
        }


def save_api_config(config: Dict[str, Any]) -> bool:
    """
    Save API configuration to JSON file.
    Only saves non-sensitive parts (provider, itemai_url).
    Keys are stored but should be validated before use.
    """
    try:
        # Ensure directory exists
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Read existing config to preserve any fields we don't update
        existing = get_api_config()
        
        # Update with new values
        existing.update({
            "provider": config.get("provider", existing.get("provider", "openai")),
            "itemai_url": config.get("itemai_url", existing.get("itemai_url", "http://localhost:1234"))
        })
        
        # Only update keys if they are provided and not empty
        if config.get("openai_key"):
            existing["openai_key"] = config["openai_key"]
        if config.get("openrouter_key"):
            existing["openrouter_key"] = config["openrouter_key"]
        
        # Write to file
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
        
        print(f"[api_config_storage] ✅ API config saved to {CONFIG_FILE}")
        return True
    except Exception as e:
        print(f"[api_config_storage] ❌ Error saving config file: {e}")
        return False


def get_api_config_for_headers() -> Dict[str, str]:
    """
    Get API configuration formatted as headers.
    This is used by the MCP Server when no headers are provided in the request.
    """
    config = get_api_config()
    headers = {}
    
    # Add provider
    if config.get("provider"):
        headers["x-api-provider"] = config["provider"]
    
    # Add ItemAI URL
    if config.get("itemai_url"):
        headers["x-itemai-url"] = config["itemai_url"]
    
    # Add OpenAI key if valid
    openai_key = config.get("openai_key", "")
    if openai_key and openai_key.startswith("sk-") and len(openai_key) > 20:
        headers["x-openai-key"] = openai_key
    
    # Add OpenRouter key if valid
    openrouter_key = config.get("openrouter_key", "")
    if openrouter_key and len(openrouter_key) > 10:
        headers["x-openrouter-key"] = openrouter_key
    
    return headers

