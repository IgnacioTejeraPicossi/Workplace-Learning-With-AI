#!/usr/bin/env python3
"""
Ultra-silent server startup script for the AI Learning application
Run from project root: python scripts/start-backend-silent.py
Or from scripts: python start-backend-silent.py
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

def main():
    """Start the server with complete silence"""
    
    # Completely disable ALL logging
    logging.disable(logging.CRITICAL)
    
    # Disable specific loggers
    for logger_name in ['uvicorn', 'fastapi', 'asyncio', 'urllib3', 'httpx']:
        logging.getLogger(logger_name).disabled = True
    
    print("🚀 Starting AI Learning Backend Server...")
    print(f"📍 Host: 0.0.0.0:8000")
    print(f"🔄 Reload: Enabled")
    print(f"🔇 Silent Mode: Enabled")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "backend.app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="critical",  # Only critical errors
            access_log=False,
            use_colors=False,
            log_config=None
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
