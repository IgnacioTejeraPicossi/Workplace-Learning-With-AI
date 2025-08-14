"""
Configuration file for the AI Learning Backend
Controls logging levels and other settings
"""

import logging
import os

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING").upper()
LOG_FORMAT = "%(levelname)s - %(message)s"

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
    handlers=[
        logging.StreamHandler()
    ]
)

# Disable verbose logging from external libraries
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)

# Custom logger for the application
logger = logging.getLogger("ai_learning")
logger.setLevel(logging.INFO)

# Server configuration
SERVER_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "reload": True,
    "log_level": LOG_LEVEL.lower(),
    "access_log": False,
    "use_colors": False,
}

# Database configuration
DB_CONFIG = {
    "max_pool_size": 10,
    "min_pool_size": 1,
}

# API configuration
API_CONFIG = {
    "title": "AI Learning Backend",
    "description": "Backend API for AI-powered learning platform",
    "version": "1.0.0",
    "docs_url": "/docs",
    "redoc_url": "/redoc",
}
