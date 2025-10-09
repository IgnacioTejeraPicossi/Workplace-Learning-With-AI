"""
Development helpers for EA Second Brain Agent
"""

from fastapi import APIRouter, Body
from backend.security import hmac as hmacsec

router = APIRouter(prefix="/api/dev", tags=["dev"])

@router.post("/sign")
async def sign_bundle(bundle: dict = Body(...)):
    """
    Generate HMAC signature for a bundle (development only)
    In production, this should be done server-side or via API gateway
    """
    signature = hmacsec.sign(bundle)
    return signature

