# AgentOps Studio - Security Utilities
import hmac
import hashlib
import os
from typing import Union

def compute_hmac_hex(secret: Union[str, bytes], body: Union[str, bytes]) -> str:
    """Compute HMAC-SHA256 hex signature"""
    if isinstance(secret, str):
        secret = secret.encode()
    if isinstance(body, str):
        body = body.encode()
    return hmac.new(secret, body, hashlib.sha256).hexdigest()

def verify_hmac(signature_hex: str, body: Union[str, bytes], secret: str = None) -> bool:
    """Verify HMAC-SHA256 signature"""
    secret = secret or os.getenv("AGENTOPS_HMAC_SECRET", "")
    calculated = compute_hmac_hex(secret, body)
    return hmac.compare_digest(
        (signature_hex or "").lower().strip(), 
        calculated.lower()
    )
