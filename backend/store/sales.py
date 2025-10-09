"""
Sales Assistant Agent MongoDB Store
Handles sales data persistence
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from ..database import database

# Collections
sales_opportunities_collection = database.sales_opportunities
sales_signals_collection = database.sales_signals
email_drafts_collection = database.email_drafts

async def upsert_opportunity(opportunity_data: Dict[str, Any]) -> str:
    """Upsert sales opportunity"""
    opportunity_data["updated_at"] = datetime.utcnow()
    
    result = await sales_opportunities_collection.update_one(
        {"crm_id": opportunity_data["crm_id"]},
        {"$set": opportunity_data},
        upsert=True
    )
    
    return str(result.upserted_id) if result.upserted_id else opportunity_data["crm_id"]

async def get_opportunity(crm_id: str) -> Optional[Dict[str, Any]]:
    """Get sales opportunity by CRM ID"""
    return await sales_opportunities_collection.find_one({"crm_id": crm_id})

async def get_opportunities(
    limit: int = 50,
    stage: Optional[str] = None,
    owner: Optional[str] = None,
    min_amount: Optional[float] = None
) -> List[Dict[str, Any]]:
    """Get sales opportunities with filters"""
    
    query = {}
    
    if stage:
        query["stage"] = stage
    if owner:
        query["owner"] = owner
    if min_amount:
        query["amount"] = {"$gte": min_amount}
    
    cursor = sales_opportunities_collection.find(query).sort("updated_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def get_high_risk_opportunities(risk_threshold: float = 70.0) -> List[Dict[str, Any]]:
    """Get high-risk opportunities"""
    cursor = sales_opportunities_collection.find({
        "risk_score": {"$gte": risk_threshold}
    }).sort("risk_score", -1)
    
    return [doc async for doc in cursor]

async def get_high_potential_opportunities(potential_threshold: float = 70.0) -> List[Dict[str, Any]]:
    """Get high-potential opportunities"""
    cursor = sales_opportunities_collection.find({
        "potential_score": {"$gte": potential_threshold}
    }).sort("potential_score", -1)
    
    return [doc async for doc in cursor]

async def get_hygiene_issues() -> List[Dict[str, Any]]:
    """Get opportunities with hygiene issues"""
    cursor = sales_opportunities_collection.find({
        "$or": [
            {"hygiene_score": {"$gte": 50.0}},
            {"missing_fields": {"$ne": []}},
            {"next_activity_date": {"$lt": datetime.utcnow()}}
        ]
    }).sort("hygiene_score", -1)
    
    return [doc async for doc in cursor]

async def add_sales_signal(signal_data: Dict[str, Any]) -> str:
    """Add sales signal"""
    signal_data["timestamp"] = datetime.utcnow()
    
    result = await sales_signals_collection.insert_one(signal_data)
    return str(result.inserted_id)

async def get_recent_signals(
    opportunity_id: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get recent signals for an opportunity"""
    cursor = sales_signals_collection.find({
        "opportunity_id": opportunity_id
    }).sort("timestamp", -1).limit(limit)
    
    return [doc async for doc in cursor]

async def create_email_draft(draft_data: Dict[str, Any]) -> str:
    """Create email draft"""
    draft_data["created_at"] = datetime.utcnow()
    draft_data["status"] = "Draft"
    
    result = await email_drafts_collection.insert_one(draft_data)
    return str(result.inserted_id)

async def get_email_drafts(
    opportunity_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Get email drafts with filters"""
    
    query = {}
    
    if opportunity_id:
        query["opportunity_id"] = opportunity_id
    if status:
        query["status"] = status
    
    cursor = email_drafts_collection.find(query).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def update_email_draft_status(draft_id: str, status: str) -> bool:
    """Update email draft status"""
    update_data = {"status": status}
    
    if status == "Sent":
        update_data["sent_at"] = datetime.utcnow()
    
    result = await email_drafts_collection.update_one(
        {"_id": draft_id},
        {"$set": update_data}
    )
    
    return result.modified_count > 0

async def compute_hygiene_score(opportunity: Dict[str, Any]) -> float:
    """Compute hygiene score for an opportunity"""
    score = 0.0
    missing_fields = []
    
    # Check required fields
    if not opportunity.get("close_date"):
        score += 25.0
        missing_fields.append("close_date")
    
    if not opportunity.get("next_activity_date"):
        score += 25.0
        missing_fields.append("next_activity_date")
    
    if not opportunity.get("amount"):
        score += 20.0
        missing_fields.append("amount")
    
    # Check for stale stage (no updates in 30 days)
    updated_at = opportunity.get("updated_at")
    if updated_at:
        days_since_update = (datetime.utcnow() - updated_at).days
        if days_since_update > 30:
            score += 30.0
            missing_fields.append("stale_stage")
    
    return min(score, 100.0)

async def compute_risk_score(opportunity: Dict[str, Any]) -> float:
    """Compute risk score for an opportunity"""
    score = 0.0
    
    # Check close date proximity
    close_date = opportunity.get("close_date")
    if close_date:
        days_to_close = (close_date - datetime.utcnow()).days
        if days_to_close < 7:
            score += 40.0
        elif days_to_close < 14:
            score += 20.0
    
    # Check stage progression
    stage = opportunity.get("stage", "").lower()
    if stage in ["prospecting", "qualification"]:
        score += 30.0
    elif stage in ["proposal", "negotiation"]:
        score += 10.0
    
    # Check activity recency
    next_activity = opportunity.get("next_activity_date")
    if next_activity and next_activity < datetime.utcnow():
        score += 30.0
    
    return min(score, 100.0)

async def compute_potential_score(opportunity: Dict[str, Any]) -> float:
    """Compute potential score for an opportunity"""
    score = 0.0
    
    # Amount-based scoring
    amount = opportunity.get("amount", 0)
    if amount > 100000:
        score += 40.0
    elif amount > 50000:
        score += 30.0
    elif amount > 10000:
        score += 20.0
    
    # Stage-based scoring
    stage = opportunity.get("stage", "").lower()
    if stage in ["proposal", "negotiation", "closed-won"]:
        score += 40.0
    elif stage in ["qualification", "needs-analysis"]:
        score += 20.0
    
    # Recent activity bonus
    updated_at = opportunity.get("updated_at")
    if updated_at:
        days_since_update = (datetime.utcnow() - updated_at).days
        if days_since_update < 7:
            score += 20.0
    
    return min(score, 100.0)
