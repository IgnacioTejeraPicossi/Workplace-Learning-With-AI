"""
HMAC verification for secure agent-to-agent communication
"""

import hmac
import json
import hashlib
import os

HMAC_SECRET = os.getenv("HMAC_SECRET", "change-me")

def canonicalize(obj) -> bytes:
    """Serialize object to canonical JSON bytes"""
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")

def sign(obj) -> str:
    """Generate HMAC signature for object"""
    msg = canonicalize(obj)
    return hmac.new(HMAC_SECRET.encode(), msg, hashlib.sha256).hexdigest()

def verify(obj, signature: str) -> bool:
    """Verify HMAC signature"""
    expected = sign(obj)
    return hmac.compare_digest(expected, signature)

