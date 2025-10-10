"""
ERP Integration for Operations Efficiency Agent
SAP/Business Central/Coupa integration
"""

import os
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Environment variables
ERP_BASE_URL = os.getenv("ERP_BASE_URL", "https://erp.example.com")
ERP_BEARER_TOKEN = os.getenv("ERP_BEARER_TOKEN", "token")
ERP_TIMEOUT = int(os.getenv("ERP_TIMEOUT", "30"))

# Headers
HEADERS = {
    "Authorization": f"Bearer {ERP_BEARER_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

async def invoice_approve(payload: Dict[str, Any]) -> str:
    """
    Approve an invoice in ERP system
    payload: {invoiceId: "..."}
    """
    invoice_id = payload.get("invoiceId")
    if not invoice_id:
        raise ValueError("invoiceId is required")
    
    try:
        async with httpx.AsyncClient(timeout=ERP_TIMEOUT) as client:
            response = await client.patch(
                f"{ERP_BASE_URL}/api/invoices/{invoice_id}",
                headers=HEADERS,
                json={"status": "APPROVED"}
            )
            response.raise_for_status()
            logger.info(f"Invoice {invoice_id} approved successfully")
            return invoice_id
    except httpx.HTTPError as e:
        logger.error(f"Failed to approve invoice {invoice_id}: {e}")
        raise

async def invoice_hold(payload: Dict[str, Any]) -> str:
    """
    Put an invoice on hold in ERP system
    payload: {invoiceId: "...", reason: "..."}
    """
    invoice_id = payload.get("invoiceId")
    reason = payload.get("reason", "Manual review required")
    
    if not invoice_id:
        raise ValueError("invoiceId is required")
    
    try:
        async with httpx.AsyncClient(timeout=ERP_TIMEOUT) as client:
            response = await client.patch(
                f"{ERP_BASE_URL}/api/invoices/{invoice_id}",
                headers=HEADERS,
                json={
                    "status": "HOLD",
                    "reason": reason,
                    "hold_date": "2024-01-01T00:00:00Z"
                }
            )
            response.raise_for_status()
            logger.info(f"Invoice {invoice_id} put on hold: {reason}")
            return invoice_id
    except httpx.HTTPError as e:
        logger.error(f"Failed to hold invoice {invoice_id}: {e}")
        raise

async def post_allocation(payload: Dict[str, Any]) -> str:
    """
    Post cost allocation to ERP system
    payload: {docId: "...", lines: [{amount, gl, costCenter, project, note}]}
    """
    doc_id = payload.get("docId")
    lines = payload.get("lines", [])
    
    if not doc_id:
        raise ValueError("docId is required")
    
    if not lines:
        raise ValueError("lines are required")
    
    try:
        async with httpx.AsyncClient(timeout=ERP_TIMEOUT) as client:
            response = await client.post(
                f"{ERP_BASE_URL}/api/allocations",
                headers=HEADERS,
                json={
                    "document_id": doc_id,
                    "lines": lines,
                    "posting_date": "2024-01-01T00:00:00Z"
                }
            )
            response.raise_for_status()
            result = response.json()
            allocation_id = result.get("id", f"alloc-{doc_id}")
            logger.info(f"Allocation posted successfully: {allocation_id}")
            return allocation_id
    except httpx.HTTPError as e:
        logger.error(f"Failed to post allocation for {doc_id}: {e}")
        raise

async def get_invoice_details(invoice_id: str) -> Dict[str, Any]:
    """
    Get invoice details from ERP system
    """
    try:
        async with httpx.AsyncClient(timeout=ERP_TIMEOUT) as client:
            response = await client.get(
                f"{ERP_BASE_URL}/api/invoices/{invoice_id}",
                headers=HEADERS
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to get invoice details for {invoice_id}: {e}")
        raise

async def three_way_match(invoice_id: str) -> Dict[str, Any]:
    """
    Perform 3-way match (PO/GR/Invoice)
    """
    try:
        async with httpx.AsyncClient(timeout=ERP_TIMEOUT) as client:
            response = await client.get(
                f"{ERP_BASE_URL}/api/invoices/{invoice_id}/three-way-match",
                headers=HEADERS
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to perform 3-way match for {invoice_id}: {e}")
        raise

async def health_check() -> bool:
    """
    Check ERP system health
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{ERP_BASE_URL}/api/health",
                headers=HEADERS
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"ERP health check failed: {e}")
        return False
