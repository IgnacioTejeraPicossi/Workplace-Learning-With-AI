from typing import Literal, Dict, Any

Action = Literal['allow','allow_and_diagnose','block','require_approval','patch_prompt']

DEFAULT_POLICY = {
    "sampling_rate": 0.25,               # 25% runs are fully diagnosed
    "on_error": "allow_and_diagnose",
    "max_turns": 12,
    "threshold_block": 0.85,             # critical
    "threshold_review": 0.65,
    "auto_apply_therapies": True
}

def decide_action(diagnosis, policy=DEFAULT_POLICY) -> Action:
    level = diagnosis.overall_risk
    if level == "critical": return "block"
    if level == "high":     return "require_approval"
    if level == "moderate": return "allow_and_diagnose"
    return "allow"
