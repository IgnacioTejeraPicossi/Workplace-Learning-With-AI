# AgentOps Studio - Simulator Service
from typing import Dict, Any
import requests

def _head_request(url: str):
    """Make HEAD request to check URL accessibility"""
    try:
        response = requests.head(url, timeout=5)
        return {
            "status": response.status_code, 
            "headers": dict(response.headers)
        }
    except Exception as e:
        return {"error": str(e)}

async def preview(payload: Dict[str, Any]):
    """Preview task execution without actually running it"""
    plan = payload.get("plan", {})
    output = {"steps": []}
    tokens = 0
    
    for step in plan.get("steps", []):
        if step["action"] == "fetch_url":
            url = step["params"].get("url", "")
            output["steps"].append({
                "fetch_url": url, 
                "head": _head_request(url)
            })
            tokens += 40
        elif step["action"] == "prompt_chain":
            prompt = step["params"].get("prompt", "")
            output["steps"].append({
                "prompt_preview": prompt[:200]
            })
            tokens += len(prompt.split())
        else:
            output["steps"].append({
                "action": step["action"], 
                "params": step["params"]
            })
            tokens += 10
    
    return {
        "ok": True, 
        "preview": output, 
        "kpis": {"approx_tokens": tokens}
    }
