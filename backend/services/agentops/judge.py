# AgentOps Studio - Judge Service
from typing import Dict, Any

async def score(payload: Dict[str, Any]):
    """Score the overall quality of the task execution"""
    safety_ok = payload.get("safety", {}).get("ok", False)
    tokens = payload.get("sim", {}).get("kpis", {}).get("approx_tokens", 0)
    
    # Base score from safety
    base_score = 70.0 if safety_ok else 30.0
    
    # Penalty for excessive token usage
    size_penalty = 10.0 if tokens > 5000 else 0.0
    
    final_score = max(0, min(100, base_score - size_penalty))
    
    return {
        "score": round(final_score, 1),
        "checks": {
            "safety_ok": safety_ok, 
            "approx_tokens": tokens
        }
    }
