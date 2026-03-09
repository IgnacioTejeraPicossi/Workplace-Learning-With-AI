from typing import Dict, Any
from .schemas import Turn, ScreenRequest
from .enhanced_detectors import run_all_detectors
from .scoring import aggregate
from .therapy_engine import build_plan, inject_prompt

class RobomindGate:
    def __init__(self, enabled: bool = True, thresholds: Dict[str, float] = None):
        self.enabled = enabled
        self.thresholds = thresholds or {"epistemic": 55.0, "cognitive": 55.0}

    def should_therapy(self, axis_scores: Dict[str, float]) -> bool:
        return any(axis_scores.get(ax, 0) >= thr for ax, thr in self.thresholds.items())

    def process(self, conversation_turns: list[Turn], user_prompt: str, model_meta: Dict[str, Any]) -> str:
        if not self.enabled:
            return user_prompt
        req = ScreenRequest(turns=conversation_turns, sources=[], meta=model_meta)
        flags = run_all_detectors(req.turns, req.sources)
        agg = aggregate(flags)
        if self.should_therapy(agg["axis_scores"]):
            # pick dominant issue by highest axis; map axis names to keywords build_plan recognises
            _AXIS_TO_ISSUE = {
                "epistemic": "confabulation",
                "cognitive": "repetition",
                "ontological": "confabulation",
                "memetic": "confabulation",
                "alignment": "goal",
                "tool_interface": "goal",
                "revaluation": "dissociation",
            }
            dominant_axis = max(agg["axis_scores"], key=lambda k: agg["axis_scores"][k])
            target_issue = _AXIS_TO_ISSUE.get(dominant_axis, dominant_axis)
            plan = build_plan(target_issue, profile=None)  # profile optional for now
            return inject_prompt(user_prompt, plan)
        return user_prompt
