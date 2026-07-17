"""
Milestone C1: Per-workflow / per-module policy management.
Evaluation order: workflow override → module override → global default.
Decision: allow | review | block based on composite score vs thresholds.
"""
from typing import Dict, Any, Optional, Literal
import os

Decision = Literal["allow", "review", "block"]

DEFAULT_POLICY: Dict[str, Any] = {
    "threshold_block": 85.0,   # composite >= this → block
    "threshold_review": 65.0,  # composite >= this → review (below block)
    "sampling_rate": 0.25,
    "auto_apply_therapies": False,
}

# In-memory overrides for MVP (can be replaced by Mongo robomind_policies)
_policy_overrides: Dict[str, Dict[str, Any]] = {}


def get_global_policy() -> Dict[str, Any]:
    """Global default policy (env or DEFAULT_POLICY)."""
    p = dict(DEFAULT_POLICY)
    t = os.getenv("ROBOMIND_THRESHOLD_BLOCK")
    if t is not None:
        try:
            p["threshold_block"] = float(t)
        except ValueError:
            pass
    t = os.getenv("ROBOMIND_THRESHOLD_REVIEW")
    if t is not None:
        try:
            p["threshold_review"] = float(t)
        except ValueError:
            pass
    return p


def get_effective_policy(module_id: Optional[str] = None, workflow_id: Optional[str] = None) -> Dict[str, Any]:
    """Merge policy: workflow override → module override → global override → defaults."""
    effective = get_global_policy()
    # Global override — written by the Clinic Settings UI (POST /api/clinic/settings).
    # Previously this scope was stored but never read, so saving settings had no
    # effect on allow/review/block decisions.
    global_override = _policy_overrides.get("global", {}).get("global", {})
    if global_override:
        effective = {**effective, **global_override}
    if module_id and "module" in _policy_overrides:
        mod_overrides = _policy_overrides.get("module", {}).get(module_id, {})
        effective = {**effective, **mod_overrides}
    if workflow_id and "workflow" in _policy_overrides:
        wf_overrides = _policy_overrides.get("workflow", {}).get(workflow_id, {})
        effective = {**effective, **wf_overrides}
    return effective


def decide_decision(composite: float, policy: Optional[Dict[str, Any]] = None) -> Decision:
    """Map composite score to allow / review / block from policy thresholds."""
    if policy is None:
        policy = get_global_policy()
    # Defensive: a malformed override (non-numeric threshold) must not break
    # every subsequent screening — fall back to the defaults instead.
    try:
        block = float(policy.get("threshold_block", DEFAULT_POLICY["threshold_block"]))
    except (TypeError, ValueError):
        block = DEFAULT_POLICY["threshold_block"]
    try:
        review = float(policy.get("threshold_review", DEFAULT_POLICY["threshold_review"]))
    except (TypeError, ValueError):
        review = DEFAULT_POLICY["threshold_review"]
    if composite >= block:
        return "block"
    if composite >= review:
        return "review"
    return "allow"


def set_policy_override(scope: Literal["global", "module", "workflow"], key: str, value: Dict[str, Any]) -> None:
    """Set override for global (key ignored), module (key=module_id), or workflow (key=workflow_id)."""
    if scope not in _policy_overrides:
        _policy_overrides[scope] = {}
    _policy_overrides[scope][key] = value


def get_policy_overrides() -> Dict[str, Dict[str, Any]]:
    """Return current overrides (for GET /settings/policies)."""
    return dict(_policy_overrides)
