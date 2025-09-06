# Independent MongoDB connection for Human+Humanoid Lab
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# Use same MongoDB instance but different collection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "ai_learning_app")

_client: Optional[AsyncIOMotorClient] = None
_db = None

def get_humanoid_db():
    """Get MongoDB database connection for Humanoid Lab"""
    global _client, _db
    if _db is None:
        try:
            _client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            _db = _client[MONGO_DB]
        except Exception as e:
            print(f"⚠️ Warning: MongoDB connection failed: {e}")
            # Return a mock database for graceful degradation
            return None
    return _db

def get_db():
    """Alias for get_humanoid_db for compatibility"""
    return get_humanoid_db()

def get_humanoid_collection(collection_name: str):
    """Get specific collection for Humanoid Lab"""
    db = get_humanoid_db()
    if db is None:
        return None
    return db[collection_name]
