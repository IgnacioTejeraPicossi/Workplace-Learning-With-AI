"""
PII anonymization for Robomind Clinic (A3).
Simple regex-based scrub for emails, phones, and ID-like patterns before storing in MongoDB.
"""
import re
from typing import Any, Dict, List

# Placeholders (short, consistent for tests)
REDACT_EMAIL = "[EMAIL_REDACTED]"
REDACT_PHONE = "[PHONE_REDACTED]"
REDACT_ID = "[ID_REDACTED]"

# Order matters: more specific first (e.g. email before generic)
_PATTERNS = [
    # Email
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", REDACT_EMAIL),
    # International phone (+country code, spaces/dashes)
    (r"\+\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}[\s.-]?\d{1,9}(?:[\s.-]?\d{1,9})?\b", REDACT_PHONE),
    # Norwegian / European style: 8 digits, optional spaces/dashes
    (r"\b\d{3}[\s.-]?\d{2}[\s.-]?\d{3}\b", REDACT_PHONE),
    (r"\b\d{4}[\s.-]?\d{4}\b", REDACT_PHONE),
    # National ID / personal number (Norwegian: 11 digits, often with dot)
    (r"\b\d{6}\s?\d{5}\b", REDACT_ID),
    (r"\b\d{11}\b", REDACT_ID),
]


def scrub_pii(text: str) -> str:
    """Replace PII in a string with placeholders. Idempotent on already-scrubbed text."""
    if not text or not isinstance(text, str):
        return text
    out = text
    for pattern, replacement in _PATTERNS:
        out = re.sub(pattern, replacement, out)
    return out


def scrub_pii_deep(obj: Any) -> Any:
    """Recursively scrub PII in dicts, lists, and strings. Returns a copy."""
    if obj is None:
        return None
    if isinstance(obj, str):
        return scrub_pii(obj)
    if isinstance(obj, dict):
        return {k: scrub_pii_deep(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub_pii_deep(v) for v in obj]
    if isinstance(obj, (int, float, bool)):
        return obj
    # datetime, etc.: convert to string and scrub (e.g. if stored as ISO)
    return obj
