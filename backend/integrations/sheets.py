"""
Google Sheets Integration for Operations Efficiency Agent
Export data to Google Sheets
"""

import os
import json
import httpx
import logging
from typing import Dict, Any, List, Optional
from google.oauth2 import service_account
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

# Environment variables
GOOGLE_SA_JSON = os.getenv("GOOGLE_SA_JSON", "{}")
SHEETS_SPREADSHEET_ID = os.getenv("SHEETS_SPREADSHEET_ID")
SHEETS_TIMEOUT = int(os.getenv("SHEETS_TIMEOUT", "30"))

# Google Sheets API scopes
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def _get_access_token() -> str:
    """
    Get Google Sheets API access token from service account
    """
    try:
        if not GOOGLE_SA_JSON or GOOGLE_SA_JSON == "{}":
            raise ValueError("GOOGLE_SA_JSON not configured")
        
        service_account_info = json.loads(GOOGLE_SA_JSON)
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info, 
            scopes=SCOPES
        )
        credentials.refresh(Request())
        return credentials.token
    except Exception as e:
        logger.error(f"Failed to get Google Sheets access token: {e}")
        raise

async def append_row(payload: Dict[str, Any]) -> str:
    """
    Append row to Google Sheet
    payload: {range: "Sheet1!A1", values: [["col1", "col2", "col3"]]}
    """
    if not SHEETS_SPREADSHEET_ID:
        logger.warning("SHEETS_SPREADSHEET_ID not configured, skipping Sheets operation")
        return "skipped"
    
    range_name = payload.get("range", "Sheet1!A1")
    values = payload.get("values", [])
    
    if not values:
        raise ValueError("No values provided")
    
    try:
        access_token = _get_access_token()
        
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEETS_SPREADSHEET_ID}/values/{range_name}:append"
        params = {"valueInputOption": "RAW"}
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        body = {"values": values}
        
        async with httpx.AsyncClient(timeout=SHEETS_TIMEOUT) as client:
            response = await client.post(
                url,
                headers=headers,
                params=params,
                json=body
            )
            response.raise_for_status()
            
            result = response.json()
            updated_range = result.get("updates", {}).get("updatedRange", "unknown")
            
            logger.info(f"Row appended to Google Sheets: {updated_range}")
            return updated_range
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to append row to Google Sheets: {e}")
        raise
    except Exception as e:
        logger.error(f"Google Sheets operation error: {e}")
        raise

async def update_range(payload: Dict[str, Any]) -> str:
    """
    Update a range in Google Sheet
    payload: {range: "Sheet1!A1:C3", values: [["row1col1", "row1col2"], ["row2col1", "row2col2"]]}
    """
    if not SHEETS_SPREADSHEET_ID:
        logger.warning("SHEETS_SPREADSHEET_ID not configured, skipping Sheets operation")
        return "skipped"
    
    range_name = payload.get("range", "Sheet1!A1")
    values = payload.get("values", [])
    
    if not values:
        raise ValueError("No values provided")
    
    try:
        access_token = _get_access_token()
        
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEETS_SPREADSHEET_ID}/values/{range_name}"
        params = {"valueInputOption": "RAW"}
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        body = {"values": values}
        
        async with httpx.AsyncClient(timeout=SHEETS_TIMEOUT) as client:
            response = await client.put(
                url,
                headers=headers,
                params=params,
                json=body
            )
            response.raise_for_status()
            
            result = response.json()
            updated_range = result.get("updatedRange", "unknown")
            
            logger.info(f"Range updated in Google Sheets: {updated_range}")
            return updated_range
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to update range in Google Sheets: {e}")
        raise
    except Exception as e:
        logger.error(f"Google Sheets operation error: {e}")
        raise

async def export_candidates_to_sheets(job_id: str, candidates: List[Dict[str, Any]], sheet_name: str = "ATS") -> str:
    """
    Export candidate ranking results to Google Sheets
    """
    if not candidates:
        logger.warning("No candidates to export")
        return "skipped"
    
    # Prepare data
    headers = ["Job ID", "Candidate ID", "Score", "Top Skills", "Processed At"]
    rows = [headers]
    
    for candidate in candidates:
        top_skills = ", ".join([
            highlight.get("matched_keywords", [])[0] 
            for highlight in candidate.get("highlights", [])[:3]
        ])
        
        rows.append([
            job_id,
            candidate.get("candidateId", ""),
            f"{candidate.get('score01', 0):.1%}",
            top_skills,
            candidate.get("processed_at", "")
        ])
    
    # Append to sheet
    range_name = f"{sheet_name}!A1"
    return await append_row({
        "range": range_name,
        "values": rows
    })

async def export_invoice_summary_to_sheets(invoices: List[Dict[str, Any]], sheet_name: str = "Invoices") -> str:
    """
    Export invoice summary to Google Sheets
    """
    if not invoices:
        logger.warning("No invoices to export")
        return "skipped"
    
    # Prepare data
    headers = ["Invoice ID", "Vendor", "Amount", "Status", "Variance %", "Processed At"]
    rows = [headers]
    
    for invoice in invoices:
        rows.append([
            invoice.get("invoice_id", ""),
            invoice.get("vendor", ""),
            f"NOK {invoice.get('total_amount', 0):,.2f}",
            invoice.get("status", ""),
            f"{invoice.get('variance_percent', 0):.1f}%" if invoice.get('variance_percent') else "N/A",
            invoice.get("processed_at", "")
        ])
    
    # Append to sheet
    range_name = f"{sheet_name}!A1"
    return await append_row({
        "range": range_name,
        "values": rows
    })

async def export_allocations_to_sheets(allocations: List[Dict[str, Any]], sheet_name: str = "Allocations") -> str:
    """
    Export cost allocations to Google Sheets
    """
    if not allocations:
        logger.warning("No allocations to export")
        return "skipped"
    
    # Prepare data
    headers = ["Allocation ID", "Document ID", "Vendor", "Total Amount", "Status", "Confidence", "Created At"]
    rows = [headers]
    
    for allocation in allocations:
        rows.append([
            allocation.get("allocation_id", ""),
            allocation.get("document_id", ""),
            allocation.get("vendor", ""),
            f"NOK {allocation.get('total_amount', 0):,.2f}",
            allocation.get("status", ""),
            f"{allocation.get('confidence_score', 0):.1%}",
            allocation.get("created_at", "")
        ])
    
    # Append to sheet
    range_name = f"{sheet_name}!A1"
    return await append_row({
        "range": range_name,
        "values": rows
    })

async def health_check() -> bool:
    """
    Check Google Sheets API health
    """
    if not SHEETS_SPREADSHEET_ID or not GOOGLE_SA_JSON or GOOGLE_SA_JSON == "{}":
        return False
    
    try:
        access_token = _get_access_token()
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"https://sheets.googleapis.com/v4/spreadsheets/{SHEETS_SPREADSHEET_ID}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Google Sheets health check failed: {e}")
        return False