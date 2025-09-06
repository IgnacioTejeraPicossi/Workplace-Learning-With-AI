import hmac
import hashlib
import os
from typing import Union

def compute_hmac_hex(secret: Union[str, bytes], body: Union[str, bytes]) -> str:
    """Compute HMAC-SHA256 hex for a body with secret"""
    if isinstance(secret, str):
        secret = secret.encode("utf-8")
    if isinstance(body, str):
        body = body.encode("utf-8")
    return hmac.new(secret, body, hashlib.sha256).hexdigest()

def verify_hmac(signature_hex: str, body: Union[str, bytes], secret: Union[str, bytes] = None) -> bool:
    """Constant-time verify HMAC. If secret is None, read AGENTOPS_HMAC_SECRET env."""
    if secret is None:
        secret = os.getenv("AGENTOPS_HMAC_SECRET", "")
    calc = compute_hmac_hex(secret, body)
    try:
        return hmac.compare_digest(signature_hex.strip().lower(), calc.lower())
    except Exception:
        return False
