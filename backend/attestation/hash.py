"""
Attestation hash computation for trust receipts
"""

import hashlib
import json

def canonicalize(obj) -> bytes:
    """Serialize object to canonical JSON bytes"""
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")

def compute_attestation(bundle: dict, artifacts: dict) -> str:
    """
    Compute SHA-256 attestation hash for bundle + artifacts
    This provides a trust receipt that can be verified later
    """
    m = hashlib.sha256()
    combined = {"bundle": bundle, "artifacts": artifacts}
    m.update(canonicalize(combined))
    return m.hexdigest()

