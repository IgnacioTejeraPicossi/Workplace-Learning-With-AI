"""
Google Sheets integration for EA Second Brain Agent
"""

import json
import httpx
import os
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SHEETS_SPREADSHEET_ID = os.getenv("SHEETS_SPREADSHEET_ID", "")
GOOGLE_SA_JSON = os.getenv("GOOGLE_SA_JSON", "{}")

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def _sa_creds():
    """Get service account credentials"""
    info = json.loads(GOOGLE_SA_JSON)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return creds

def _access_token():
    """Get access token from service account"""
    creds = _sa_creds()
    creds.refresh(Request())
    return creds.token

async def append_row(payload: dict) -> str:
    """
    Append a row to Google Sheets
    
    Payload mapping:
    {
        "range": "EA_Audit!A1",  # sheet!range
        "values": [["run_id", "status", "hash"]]  # 2D array
    }
    """
    if not SHEETS_SPREADSHEET_ID or GOOGLE_SA_JSON == "{}":
        return "row:mock-ok"  # Return mock if not configured
    
    sheet_id = SHEETS_SPREADSHEET_ID
    token = _access_token()
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{payload['range']}:append?valueInputOption=RAW"
    
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json={"values": payload["values"]},
            timeout=30.0
        )
        r.raise_for_status()
        data = r.json()
        return data.get("updates", {}).get("updatedRange", "row:ok")

