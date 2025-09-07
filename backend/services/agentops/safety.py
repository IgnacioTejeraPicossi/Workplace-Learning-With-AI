# AgentOps Studio - Safety Service
from typing import Dict, Any
import urllib.parse as up

async def evaluate(payload: Dict[str, Any]):
    """Evaluate safety of software task execution"""
    twin = payload.get("twin", {})
    plan = payload.get("plan", {})
    findings = []
    
    policies = twin.get("policies", {})
    allowed_domains = set(policies.get("allowed_domains", []))
    blocked_domains = set(policies.get("blocked_domains", []))
    
    # Check each step in the plan
    for step in plan.get("steps", []):
        if step.get("action") == "fetch_url":
            url = step.get("params", {}).get("url", "")
            if url:
                try:
                    hostname = up.urlparse(url).hostname or ""
                    if allowed_domains and hostname not in allowed_domains:
                        findings.append(f"Domain not in allowlist: {hostname}")
                    if hostname in blocked_domains:
                        findings.append(f"Domain in blocklist: {hostname}")
                except Exception as e:
                    findings.append(f"Invalid URL format: {url}")
    
    return {
        "ok": len(findings) == 0, 
        "findings": findings
    }
