"""
SAP Integration for GRC Agent
S/4HANA FI/MM/SD via OData/REST
"""

import os
import httpx
from typing import Dict, Any

SAP_BASE_URL = os.getenv("SAP_BASE_URL", "https://sap.example.com")
SAP_BEARER_TOKEN = os.getenv("SAP_BEARER_TOKEN", "token")

HEADERS = {
    "Authorization": f"Bearer {SAP_BEARER_TOKEN}",
    "Content-Type": "application/json"
}

async def apply_fix(payload: Dict[str, Any]) -> str:
    """Apply fix to ERP system"""
    # payload: {object: "PO|Invoice|Material", id: "...", patch: {...}}
    object_type = payload.get("object", "PO")
    object_id = payload.get("id")
    patch_data = payload.get("patch", {})
    
    path_map = {
        "PO": "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder",
        "Invoice": "/sap/opu/odata/sap/API_INVOICE_PROCESS_SRV/A_Invoice",
        "Material": "/sap/opu/odata/sap/API_MATERIAL_SRV/A_Material"
    }
    
    path = path_map.get(object_type, path_map["PO"])
    url = f"{SAP_BASE_URL}{path}('{object_id}')"
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, headers=HEADERS, json=patch_data)
        response.raise_for_status()
        return object_id

async def block_po(payload: Dict[str, Any]) -> str:
    """Block purchase order"""
    # payload: {poNumber: "...", reason: "..."}
    po_number = payload.get("poNumber")
    reason = payload.get("reason", "Policy violation")
    
    url = f"{SAP_BASE_URL}/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder('{po_number}')"
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            url, 
            headers=HEADERS, 
            json={"BlockReason": reason}
        )
        response.raise_for_status()
        return po_number

async def hold_invoice(payload: Dict[str, Any]) -> str:
    """Hold invoice for review"""
    # payload: {invoiceId: "...", reason: "..."}
    invoice_id = payload.get("invoiceId")
    reason = payload.get("reason", "Quality check required")
    
    url = f"{SAP_BASE_URL}/sap/opu/odata/sap/API_INVOICE_PROCESS_SRV/A_Invoice('{invoice_id}')"
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            url, 
            headers=HEADERS, 
            json={
                "Hold": True, 
                "HoldReason": reason
            }
        )
        response.raise_for_status()
        return invoice_id
