"""
Milestone C2: Alerting on critical risk and repeated high-risk.
Webhook (MVP); placeholders for Slack/email. Debounce to avoid spam.
"""
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx

# Per-key (e.g. module_id or "global") last alert time; skip if within DEBOUNCE_SECONDS
_last_alert: Dict[str, datetime] = {}
DEBOUNCE_SECONDS = 3600  # 1 hour

def _alert_key(module_id: Optional[str], workflow_id: Optional[str]) -> str:
    return f"{module_id or 'global'}:{workflow_id or 'global'}"

def _should_fire(decision: str, composite: float, key: str, policy: Dict[str, Any]) -> bool:
    """Fire on block, or on review if repeated (we simplify: fire once per block, once per review per debounce window)."""
    if decision == "block":
        return True
    if decision == "review" and composite >= policy.get("threshold_review", 65):
        return True
    return False

def _debounce(key: str) -> bool:
    """True if we should skip (already sent recently)."""
    now = datetime.utcnow()
    if key in _last_alert:
        if (now - _last_alert[key]).total_seconds() < DEBOUNCE_SECONDS:
            return True
    _last_alert[key] = now
    return False

async def fire_alert_if_needed(
    decision: str,
    composite: float,
    module_id: Optional[str] = None,
    workflow_id: Optional[str] = None,
    policy: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    If decision is block or (review and high composite), POST to webhook once per debounce window.
    Returns True if alert was sent.
    """
    from .policy import get_effective_policy, decide_decision, DEFAULT_POLICY
    if policy is None:
        policy = get_effective_policy(module_id, workflow_id)
    if not _should_fire(decision, composite, _alert_key(module_id, workflow_id), policy):
        return False
    key = _alert_key(module_id, workflow_id)
    if _debounce(key):
        return False
    url = os.getenv("ROBOMIND_ALERT_WEBHOOK_URL", "").strip()
    if not url:
        return False
    payload = {
        "event": "robomind_risk",
        "decision": decision,
        "composite": composite,
        "module_id": module_id,
        "workflow_id": workflow_id,
        "ts": datetime.utcnow().isoformat() + "Z",
        "meta": meta or {},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
        return True
    except Exception as e:
        print(f"Robomind alert webhook failed: {e}")
        return False
