"""
Operations Efficiency Agent Store
MongoDB operations for Ops Efficiency Agent
"""

from ..database import database
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Collections
opsx_invoices_collection = database.opsx_invoices
opsx_allocations_collection = database.opsx_allocations
opsx_candidates_collection = database.opsx_candidates
opsx_findings_collection = database.opsx_findings

# Invoice operations
async def create_invoice(invoice_data: Dict[str, Any]) -> str:
    """
    Create a new invoice record
    """
    try:
        invoice_data["created_at"] = datetime.now()
        invoice_data["updated_at"] = datetime.now()
        
        result = await opsx_invoices_collection.insert_one(invoice_data)
        logger.info(f"Created invoice: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to create invoice: {e}")
        raise

async def update_invoice_status(invoice_id: str, status: str, reason: Optional[str] = None) -> bool:
    """
    Update invoice status
    """
    try:
        update_data = {
            "status": status,
            "updated_at": datetime.now()
        }
        
        if reason:
            update_data["reason"] = reason
        
        result = await opsx_invoices_collection.update_one(
            {"invoice_id": invoice_id},
            {"$set": update_data}
        )
        
        success = result.modified_count > 0
        if success:
            logger.info(f"Updated invoice {invoice_id} status to {status}")
        else:
            logger.warning(f"Invoice {invoice_id} not found for status update")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to update invoice status: {e}")
        raise

async def get_recent_invoices(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get recent invoices
    """
    try:
        cursor = opsx_invoices_collection.find().sort("updated_at", -1).limit(limit)
        invoices = []
        async for invoice in cursor:
            invoices.append(invoice)
        
        logger.info(f"Retrieved {len(invoices)} recent invoices")
        return invoices
        
    except Exception as e:
        logger.error(f"Failed to get recent invoices: {e}")
        raise

async def get_invoice_by_id(invoice_id: str) -> Optional[Dict[str, Any]]:
    """
    Get invoice by ID
    """
    try:
        invoice = await opsx_invoices_collection.find_one({"invoice_id": invoice_id})
        return invoice
        
    except Exception as e:
        logger.error(f"Failed to get invoice {invoice_id}: {e}")
        raise

# Allocation operations
async def create_allocation(allocation_data: Dict[str, Any]) -> str:
    """
    Create a new cost allocation record
    """
    try:
        allocation_data["created_at"] = datetime.now()
        allocation_data["updated_at"] = datetime.now()
        
        result = await opsx_allocations_collection.insert_one(allocation_data)
        logger.info(f"Created allocation: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to create allocation: {e}")
        raise

async def update_allocation_status(allocation_id: str, status: str) -> bool:
    """
    Update allocation status
    """
    try:
        result = await opsx_allocations_collection.update_one(
            {"allocation_id": allocation_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now()
                }
            }
        )
        
        success = result.modified_count > 0
        if success:
            logger.info(f"Updated allocation {allocation_id} status to {status}")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to update allocation status: {e}")
        raise

async def get_recent_allocations(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get recent allocations
    """
    try:
        cursor = opsx_allocations_collection.find().sort("updated_at", -1).limit(limit)
        allocations = []
        async for allocation in cursor:
            allocations.append(allocation)
        
        logger.info(f"Retrieved {len(allocations)} recent allocations")
        return allocations
        
    except Exception as e:
        logger.error(f"Failed to get recent allocations: {e}")
        raise

# Candidate operations
async def create_candidate(candidate_data: Dict[str, Any]) -> str:
    """
    Create a new candidate record
    """
    try:
        candidate_data["created_at"] = datetime.now()
        
        result = await opsx_candidates_collection.insert_one(candidate_data)
        logger.info(f"Created candidate: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to create candidate: {e}")
        raise

async def get_candidates_by_job(job_id: str) -> List[Dict[str, Any]]:
    """
    Get candidates for a specific job
    """
    try:
        cursor = opsx_candidates_collection.find({"job_id": job_id}).sort("score", -1)
        candidates = []
        async for candidate in cursor:
            candidates.append(candidate)
        
        logger.info(f"Retrieved {len(candidates)} candidates for job {job_id}")
        return candidates
        
    except Exception as e:
        logger.error(f"Failed to get candidates for job {job_id}: {e}")
        raise

async def get_recent_candidates(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get recent candidates
    """
    try:
        cursor = opsx_candidates_collection.find().sort("created_at", -1).limit(limit)
        candidates = []
        async for candidate in cursor:
            candidates.append(candidate)
        
        logger.info(f"Retrieved {len(candidates)} recent candidates")
        return candidates
        
    except Exception as e:
        logger.error(f"Failed to get recent candidates: {e}")
        raise

# Findings operations
async def create_finding(finding_data: Dict[str, Any]) -> str:
    """
    Create a new finding record
    """
    try:
        finding_data["created_at"] = datetime.now()
        
        result = await opsx_findings_collection.insert_one(finding_data)
        logger.info(f"Created finding: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to create finding: {e}")
        raise

async def get_findings_by_type(finding_type: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get findings by type
    """
    try:
        cursor = opsx_findings_collection.find({"type": finding_type}).sort("created_at", -1).limit(limit)
        findings = []
        async for finding in cursor:
            findings.append(finding)
        
        logger.info(f"Retrieved {len(findings)} findings of type {finding_type}")
        return findings
        
    except Exception as e:
        logger.error(f"Failed to get findings of type {finding_type}: {e}")
        raise

# Analytics operations
async def get_invoice_analytics(days: int = 30) -> Dict[str, Any]:
    """
    Get invoice analytics for the last N days
    """
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$total_amount"}
                }
            }
        ]
        
        cursor = opsx_invoices_collection.aggregate(pipeline)
        analytics = {}
        
        async for result in cursor:
            status = result["_id"]
            analytics[status] = {
                "count": result["count"],
                "total_amount": result["total_amount"]
            }
        
        logger.info(f"Retrieved invoice analytics for last {days} days")
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get invoice analytics: {e}")
        raise

async def get_allocation_analytics(days: int = 30) -> Dict[str, Any]:
    """
    Get allocation analytics for the last N days
    """
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$total_amount"},
                    "avg_confidence": {"$avg": "$confidence_score"}
                }
            }
        ]
        
        cursor = opsx_allocations_collection.aggregate(pipeline)
        analytics = {}
        
        async for result in cursor:
            status = result["_id"]
            analytics[status] = {
                "count": result["count"],
                "total_amount": result["total_amount"],
                "avg_confidence": result["avg_confidence"]
            }
        
        logger.info(f"Retrieved allocation analytics for last {days} days")
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get allocation analytics: {e}")
        raise

async def get_candidate_analytics(days: int = 30) -> Dict[str, Any]:
    """
    Get candidate analytics for the last N days
    """
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": None,
                    "total_candidates": {"$sum": 1},
                    "avg_score": {"$avg": "$score"},
                    "max_score": {"$max": "$score"},
                    "min_score": {"$min": "$score"}
                }
            }
        ]
        
        cursor = opsx_candidates_collection.aggregate(pipeline)
        analytics = {}
        
        async for result in cursor:
            analytics = {
                "total_candidates": result["total_candidates"],
                "avg_score": result["avg_score"],
                "max_score": result["max_score"],
                "min_score": result["min_score"]
            }
        
        logger.info(f"Retrieved candidate analytics for last {days} days")
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get candidate analytics: {e}")
        raise

# Cleanup operations
async def cleanup_old_data(days: int = 90):
    """
    Clean up old data older than N days
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Clean up old invoices
        invoice_result = await opsx_invoices_collection.delete_many({
            "created_at": {"$lt": cutoff_date},
            "status": {"$in": ["approved", "rejected"]}
        })
        
        # Clean up old allocations
        allocation_result = await opsx_allocations_collection.delete_many({
            "created_at": {"$lt": cutoff_date},
            "status": {"$in": ["posted", "cancelled"]}
        })
        
        # Clean up old candidates
        candidate_result = await opsx_candidates_collection.delete_many({
            "created_at": {"$lt": cutoff_date}
        })
        
        logger.info(f"Cleaned up old data: {invoice_result.deleted_count} invoices, "
                   f"{allocation_result.deleted_count} allocations, "
                   f"{candidate_result.deleted_count} candidates")
        
        return {
            "invoices_deleted": invoice_result.deleted_count,
            "allocations_deleted": allocation_result.deleted_count,
            "candidates_deleted": candidate_result.deleted_count
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup old data: {e}")
        raise
