"""
Custom logging configuration for Uvicorn
Completely disables verbose logging and endpoint listing
"""

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "minimal": {
            "format": "%(levelname)s: %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "minimal",
            "level": "ERROR"
        }
    },
    "loggers": {
        "uvicorn": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False
        },
        "uvicorn.error": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False
        },
        "uvicorn.access": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False
        },
        "fastapi": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False
        },
        "asyncio": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "ERROR"
    }
}
