#!/usr/bin/env python3
"""
Diagnostic script to check MCP API configuration.
Run this to verify that api_config.json exists and has correct values.
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from backend.api_config_storage import get_api_config, get_api_config_for_headers
    
    print("=" * 60)
    print("MCP API Configuration Diagnostic")
    print("=" * 60)
    print()
    
    # Check if config file exists
    config_file = project_root / "api_config.json"
    print(f"[CONFIG] Config file path: {config_file}")
    print(f"[CONFIG] Exists: {config_file.exists()}")
    print()
    
    # Read config
    config = get_api_config()
    print("[CONFIG] Current Configuration:")
    print(f"   Provider: {config.get('provider', 'NOT SET')}")
    print(f"   ItemAI URL: {config.get('itemai_url', 'NOT SET')}")
    print(f"   OpenAI Key: {'SET' if config.get('openai_key') else 'NOT SET'}")
    print(f"   OpenRouter Key: {'SET' if config.get('openrouter_key') else 'NOT SET'}")
    print()
    
    # Get headers
    headers = get_api_config_for_headers()
    print("[HEADERS] Headers that would be sent:")
    for key, value in headers.items():
        if 'key' in key.lower():
            print(f"   {key}: {'SET' if value else 'NOT SET'} ({len(value) if value else 0} chars)")
        else:
            print(f"   {key}: {value}")
    print()
    
    # Check if provider is itemai
    provider = config.get("provider", "").lower()
    if provider == "itemai":
        print("[STATUS] OK: Provider is 'itemai' - MCP should use LM Studio")
        itemai_url = config.get("itemai_url", "")
        if itemai_url:
            print(f"   ItemAI URL: {itemai_url}")
        else:
            print("   WARNING: ItemAI URL is not set!")
    elif provider == "openai":
        print("[STATUS] OK: Provider is 'openai' - MCP will use OpenAI")
    elif provider == "openrouter":
        print("[STATUS] OK: Provider is 'openrouter' - MCP will use OpenRouter")
    else:
        print(f"[STATUS] WARNING: Unknown provider '{provider}' - will default to OpenAI")
    print()
    
    # Check environment variables as fallback
    print("[ENV] Environment Variables (fallback):")
    api_provider_env = os.getenv("API_PROVIDER", "NOT SET")
    lmstudio_url_env = os.getenv("LMSTUDIO_BASE_URL", "NOT SET")
    print(f"   API_PROVIDER: {api_provider_env}")
    print(f"   LMSTUDIO_BASE_URL: {lmstudio_url_env}")
    print()
    
    print("=" * 60)
    print("RECOMMENDATION:")
    if provider == "itemai":
        print("OK: Configuration looks correct for ItemAI/LM Studio")
        print("   If MCP still fails, check:")
        print("   1. LM Studio is running on the configured URL")
        print("   2. A model is loaded in LM Studio")
        print("   3. Backend logs show the headers being sent")
    else:
        print(f"WARNING: Provider is '{provider}', not 'itemai'")
        print("   To use LM Studio:")
        print("   1. Go to API Config in the frontend")
        print("   2. Select 'ItemAI API'")
        print("   3. Click 'Save Keys'")
    print("=" * 60)
    
except Exception as e:
    print(f"ERROR: Error running diagnostic: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

