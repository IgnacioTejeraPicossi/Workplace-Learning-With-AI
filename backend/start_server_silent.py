#!/usr/bin/env python3
"""
Ultra-silent server startup script
Completely eliminates all logging output
"""

import uvicorn
import os
import sys
import logging

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
            "backend.app:app",  # Changed from "app:app" to "backend.app:app"
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
