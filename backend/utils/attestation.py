"""
Attestation System for Agent Execution Receipts
Provides cryptographic verification of agent executions
"""
import json
import hashlib
import hmac
import os
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel

class Attestation(BaseModel):
    """Execution receipt for agent runs"""
    bundle_hash: str         # SHA-256 of canonical Action Bundle
    receipt_hash: str        # SHA-256 of the receipt object
    signed_by: str           # Service name that signed the receipt
    algorithm: str = "SHA256"
    hmac_signature: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

def canonical_json(obj: Dict[str, Any]) -> str:
    """
    Convert object to canonical JSON string (sorted keys, no spaces)
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def sha256_hex(text: str) -> str:
    """
    Compute SHA-256 hash of text and return as hex string
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def compute_bundle_hash(bundle: Dict[str, Any]) -> str:
    """
    Compute hash of action bundle for attestation
    """
    # Remove transient fields that might change between calls
    stable_bundle = {
        k: v for k, v in bundle.items() 
        if k not in ["run_id", "callback_url", "timestamp"]
    }
    return sha256_hex(canonical_json(stable_bundle))

def compute_attestation(
    bundle_hash: str, 
    artifacts: Dict[str, Any], 
    signer: str = "agent-bridge"
) -> Dict[str, Any]:
    """
    Create execution receipt with cryptographic attestation
    """
    receipt = {
        "bundle_hash": bundle_hash,
        "artifacts": artifacts or {},
        "signed_by": signer,
        "algorithm": "SHA256",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Compute receipt hash
    receipt_hash = sha256_hex(canonical_json(receipt))
    
    # Compute HMAC signature if secret is available
    secret = os.getenv("AGENTOPS_HMAC_SECRET")
    hmac_signature = None
    if secret:
        hmac_signature = hmac.new(
            secret.encode(), 
            canonical_json(receipt).encode(), 
            hashlib.sha256
        ).hexdigest()
    
    return {
        "bundle_hash": bundle_hash,
        "receipt_hash": receipt_hash,
        "signed_by": signer,
        "algorithm": "SHA256",
        "hmac_signature": hmac_signature,
        "timestamp": receipt["timestamp"]
    }

def verify_attestation(attestation: Dict[str, Any], secret: Optional[str] = None) -> bool:
    """
    Verify the HMAC signature of an attestation
    """
    if not attestation.get("hmac_signature"):
        return False
    
    if not secret:
        secret = os.getenv("AGENTOPS_HMAC_SECRET")
    
    if not secret:
        return False
    
    # Reconstruct the receipt
    receipt = {
        "bundle_hash": attestation["bundle_hash"],
        "artifacts": attestation.get("artifacts", {}),
        "signed_by": attestation["signed_by"],
        "algorithm": attestation["algorithm"],
        "timestamp": attestation["timestamp"]
    }
    
    # Compute expected signature
    expected_signature = hmac.new(
        secret.encode(),
        canonical_json(receipt).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(
        attestation["hmac_signature"], 
        expected_signature
    )

