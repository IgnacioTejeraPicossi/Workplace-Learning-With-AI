#!/usr/bin/env python3
"""
Clean server startup script for the AI Learning application
Run from project root: python scripts/start-backend-clean.py
Or from scripts: python start-backend-clean.py
"""

import uvicorn
import os
import sys
import logging

# Project root (parent of scripts/)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.join(_SCRIPT_DIR, "..")
sys.path.insert(0, _PROJECT_ROOT)
os.chdir(_PROJECT_ROOT)

# Import custom logging config
from backend.logging_config import LOGGING_CONFIG

def main():
    """Start the server with clean configuration"""
    
    print("🚀 Starting AI Learning Backend Server...")
    print(f"📍 Host: 0.0.0.0:8000")
    print(f"🔄 Reload: Enabled")
    print(f"📝 Log Level: ERROR (minimal)")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "backend.app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="error",
            access_log=False,
            use_colors=False,
            log_config=LOGGING_CONFIG
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
