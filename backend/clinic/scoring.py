from typing import Dict, List
from .schemas import Flag, Axis

AXES: List[Axis] = ["epistemic","cognitive","alignment","ontological","tool_interface","memetic","revaluation"]

# weights can be tuned; default uniform
WEIGHTS = {
    "epistemic": 1.0, "cognitive": 1.0, "alignment": 1.1,
    "ontological": 0.9, "tool_interface": 0.8, "memetic": 1.2, "revaluation": 1.4
}

def aggregate(flags: List[Flag]) -> Dict[str, float]:
    """Return per-axis normalized 0..100 scores and composite."""
    axis_scores = {ax: 0.0 for ax in AXES}
    counts = {ax: 0 for ax in AXES}
    for f in flags:
        axis_scores[f.axis] += min(max(f.confidence, 0.0), 1.0) * 100 * WEIGHTS[f.axis]
        counts[f.axis] += 1
    for ax in AXES:
        if counts[ax]:
            axis_scores[ax] = min(100.0, axis_scores[ax] / counts[ax])
        else:
            axis_scores[ax] = 0.0
    # composite: weighted mean
    denom = sum(WEIGHTS.values())
    composite = sum(axis_scores[ax]*WEIGHTS[ax] for ax in AXES) / denom if denom else 0.0
    return {"axis_scores": axis_scores, "composite": round(composite, 2)}
