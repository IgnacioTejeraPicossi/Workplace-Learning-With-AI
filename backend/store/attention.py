"""
Personal Attention Agent Storage
MongoDB collections and operations for attention management
"""

from datetime import datetime
from backend.db import database
from typing import List, Dict, Any, Optional

# Collections
channel_sources_collection = database.get_collection("channel_sources")
attention_signals_collection = database.get_collection("attention_signals")
attention_clusters_collection = database.get_collection("attention_clusters")
attention_alerts_collection = database.get_collection("attention_alerts")
attention_preferences_collection = database.get_collection("attention_preferences")

# Channel Sources operations
async def upsert_channel_source(source: Dict[str, Any]) -> str:
    """Create or update a channel source"""
    source.setdefault("updated_at", datetime.utcnow())
    source.setdefault("created_at", datetime.utcnow())
    
    result = await channel_sources_collection.update_one(
        {"urlOrId": source["urlOrId"]}, 
        {"$set": source}, 
        upsert=True
    )
    
    if result.upserted_id:
        return str(result.upserted_id)
    else:
        # Find the existing document
        doc = await channel_sources_collection.find_one({"urlOrId": source["urlOrId"]})
        return str(doc["_id"])

async def get_active_sources() -> List[Dict[str, Any]]:
    """Get all active channel sources"""
    cursor = channel_sources_collection.find({"active": True})
    sources = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        sources.append(doc)
    return sources

async def deactivate_source(source_id: str) -> bool:
    """Deactivate a channel source"""
    result = await channel_sources_collection.update_one(
        {"_id": source_id},
        {"$set": {"active": False, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

# Signals operations
async def save_signal(signal: Dict[str, Any]) -> str:
    """Save a new signal"""
    signal.setdefault("created_at", datetime.utcnow())
    
    result = await attention_signals_collection.insert_one(signal)
    return str(result.inserted_id)

async def get_signals_by_source(source_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Get signals from a specific source"""
    cursor = attention_signals_collection.find(
        {"sourceId": source_id}
    ).sort("postedAt", -1).limit(limit)
    
    signals = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        signals.append(doc)
    return signals

async def get_recent_signals(hours: int = 24, limit: int = 1000) -> List[Dict[str, Any]]:
    """Get recent signals from the last N hours"""
    cutoff_time = datetime.utcnow().replace(hour=datetime.utcnow().hour - hours)
    
    cursor = attention_signals_collection.find(
        {"postedAt": {"$gte": cutoff_time}}
    ).sort("postedAt", -1).limit(limit)
    
    signals = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        signals.append(doc)
    return signals

# Clusters operations
async def save_cluster(cluster: Dict[str, Any]) -> str:
    """Save a new cluster"""
    cluster.setdefault("created_at", datetime.utcnow())
    
    result = await attention_clusters_collection.insert_one(cluster)
    return str(result.inserted_id)

async def update_cluster(cluster_id: str, updates: Dict[str, Any]) -> bool:
    """Update an existing cluster"""
    updates["lastSeen"] = datetime.utcnow()
    
    result = await attention_clusters_collection.update_one(
        {"_id": cluster_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def get_recent_clusters(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent clusters sorted by last seen"""
    cursor = attention_clusters_collection.find().sort("lastSeen", -1).limit(limit)
    
    clusters = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        clusters.append(doc)
    return clusters

async def get_clusters_by_score(min_score: float = 0.5) -> List[Dict[str, Any]]:
    """Get clusters above minimum score threshold"""
    cursor = attention_clusters_collection.find(
        {"score": {"$gte": min_score}}
    ).sort("score", -1)
    
    clusters = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        clusters.append(doc)
    return clusters

# Alerts operations
async def create_alert(alert: Dict[str, Any]) -> str:
    """Create a new alert"""
    alert.setdefault("created_at", datetime.utcnow())
    
    result = await attention_alerts_collection.insert_one(alert)
    return str(result.inserted_id)

async def update_alert_status(alert_id: str, status: str, artifacts: Dict[str, Any] = None) -> bool:
    """Update alert status and artifacts"""
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    if artifacts:
        update_data["artifacts"] = artifacts
    
    result = await attention_alerts_collection.update_one(
        {"_id": alert_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

async def get_pending_alerts() -> List[Dict[str, Any]]:
    """Get all pending alerts"""
    cursor = attention_alerts_collection.find({"status": "pending"}).sort("created_at", -1)
    
    alerts = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        alerts.append(doc)
    return alerts

async def get_alerts_by_priority(priority: str) -> List[Dict[str, Any]]:
    """Get alerts by priority level"""
    cursor = attention_alerts_collection.find({"priority": priority}).sort("created_at", -1)
    
    alerts = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        alerts.append(doc)
    return alerts

# Preferences operations
async def save_user_preferences(user_id: str, preferences: Dict[str, Any]) -> str:
    """Save or update user preferences"""
    preferences["ownerUser"] = user_id
    preferences["updated_at"] = datetime.utcnow()
    preferences.setdefault("created_at", datetime.utcnow())
    
    result = await attention_preferences_collection.update_one(
        {"ownerUser": user_id},
        {"$set": preferences},
        upsert=True
    )
    
    if result.upserted_id:
        return str(result.upserted_id)
    else:
        doc = await attention_preferences_collection.find_one({"ownerUser": user_id})
        return str(doc["_id"])

async def get_user_preferences(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user preferences"""
    doc = await attention_preferences_collection.find_one({"ownerUser": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Statistics operations
async def get_attention_stats() -> Dict[str, Any]:
    """Get attention agent statistics"""
    active_sources = await channel_sources_collection.count_documents({"active": True})
    total_signals = await attention_signals_collection.count_documents({})
    total_clusters = await attention_clusters_collection.count_documents({})
    pending_alerts = await attention_alerts_collection.count_documents({"status": "pending"})
    
    # Recent activity (last 24 hours)
    cutoff_time = datetime.utcnow().replace(hour=datetime.utcnow().hour - 24)
    recent_signals = await attention_signals_collection.count_documents(
        {"postedAt": {"$gte": cutoff_time}}
    )
    recent_clusters = await attention_clusters_collection.count_documents(
        {"created_at": {"$gte": cutoff_time}}
    )
    
    return {
        "active_sources": active_sources,
        "total_signals": total_signals,
        "total_clusters": total_clusters,
        "pending_alerts": pending_alerts,
        "recent_signals_24h": recent_signals,
        "recent_clusters_24h": recent_clusters
    }
