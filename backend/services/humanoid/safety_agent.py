# Safety Agent - Safety evaluation and risk assessment
from typing import Dict, List
import random

# Mandatory safety checks
MANDATORY_CHECKS = [
    "e_stop", 
    "safe_zone_cleared", 
    "payload_within_limit",
    "emergency_stop_accessible",
    "human_operator_present"
]

async def evaluate(payload: Dict) -> Dict:
    """
    Evaluate safety of the planned operation
    Uses AI when available, falls back to rule-based checks
    """
    try:
        # Try to use existing LLM infrastructure for advanced safety analysis
        from backend.llm import ask_openai
        
        # Extract context for safety analysis
        twin = payload.get("twin", {})
        task = payload.get("task", {})
        plan = payload.get("plan", {})
        context = payload.get("context", {})
        
        # Create safety analysis prompt
        prompt = f"""
        You are a safety officer for humanoid robot operations. Evaluate the safety of this planned operation:
        
        Task: {task.get('name', 'Unknown')}
        Description: {task.get('description', 'No description')}
        Human Role: {twin.get('human_role', 'Unknown')}
        Constraints: {twin.get('constraints', {})}
        Environment: {twin.get('environment', {})}
        
        Plan Steps:
        {_format_plan_steps(plan.get('steps', []))}
        
        Current Safety Context:
        - E-stop accessible: {context.get('e_stop', 'Unknown')}
        - Safe zone cleared: {context.get('safe_zone_cleared', 'Unknown')}
        - Payload within limit: {context.get('payload_within_limit', 'Unknown')}
        - Payload weight: {context.get('payload_weight', 'Unknown')} kg
        - Emergency stop accessible: {context.get('emergency_stop_accessible', 'Unknown')}
        - Human operator present: {context.get('human_operator_present', 'Unknown')}
        
        Please provide a JSON response with:
        {{
            "ok": true/false,
            "findings": ["list of safety issues or 'All safety checks passed'"],
            "risk_level": "low/medium/high",
            "recommendations": ["list of safety recommendations"]
        }}
        
        Consider:
        - Physical safety (collisions, falls, overloading)
        - Human-robot interaction safety
        - Environmental hazards
        - Emergency procedures
        - Compliance with safety standards
        """
        
        response = await ask_openai(prompt, model="gpt-4o-mini")
        
        # Try to parse JSON response
        import json
        try:
            safety_data = json.loads(response)
            return {
                "ok": safety_data.get("ok", False),
                "findings": safety_data.get("findings", ["Safety analysis failed"]),
                "risk_level": safety_data.get("risk_level", "medium"),
                "recommendations": safety_data.get("recommendations", [])
            }
        except (json.JSONDecodeError, KeyError, ValueError):
            # Fallback to rule-based evaluation
            pass
            
    except Exception as e:
        print(f"⚠️ LLM safety analysis failed, using rule-based: {e}")
        # Fallback to rule-based evaluation
    
    # Rule-based safety evaluation (fallback)
    return _rule_based_safety_evaluation(payload)

def _rule_based_safety_evaluation(payload: Dict) -> Dict:
    """Rule-based safety evaluation when LLM is not available"""
    context = payload.get("context", {})
    twin = payload.get("twin", {})
    plan = payload.get("plan", {})
    
    findings = []
    risk_factors = []
    
    # Check mandatory safety flags
    for check in MANDATORY_CHECKS:
        if check not in context:
            findings.append(f"Missing safety check: {check}")
            risk_factors.append("missing_safety_check")
        elif context[check] is False:
            findings.append(f"Safety check failed: {check}")
            risk_factors.append("failed_safety_check")
    
    # Check payload constraints
    constraints = twin.get("constraints", {})
    max_load = constraints.get("max_load")
    if max_load is not None:
        payload_weight = context.get("payload_weight", 0.0)
        if payload_weight > max_load:
            findings.append(f"Payload {payload_weight}kg exceeds max_load {max_load}kg")
            risk_factors.append("payload_overload")
        elif payload_weight > max_load * 0.8:
            findings.append(f"Payload {payload_weight}kg is close to max_load {max_load}kg")
            risk_factors.append("payload_warning")
    
    # Check plan complexity
    steps = plan.get("steps", [])
    if len(steps) > 10:
        findings.append("Plan has many steps - consider breaking into smaller tasks")
        risk_factors.append("complex_plan")
    
    # Check for high-risk operations
    high_risk_actions = ["lift", "carry", "move_heavy", "climb", "reach_high"]
    for step in steps:
        action = step.get("action", "").lower()
        for risk_action in high_risk_actions:
            if risk_action in action:
                findings.append(f"High-risk operation detected: {step.get('action')}")
                risk_factors.append("high_risk_operation")
                break
    
    # Determine overall safety status
    ok = len(findings) == 0 or all("warning" in f.lower() for f in findings)
    
    # Determine risk level
    if "payload_overload" in risk_factors or "failed_safety_check" in risk_factors:
        risk_level = "high"
    elif "high_risk_operation" in risk_factors or "payload_warning" in risk_factors:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    # Add recommendations
    recommendations = []
    if "payload_overload" in risk_factors:
        recommendations.append("Reduce payload weight or increase load capacity")
    if "failed_safety_check" in risk_factors:
        recommendations.append("Address all failed safety checks before proceeding")
    if "high_risk_operation" in risk_factors:
        recommendations.append("Consider additional safety measures for high-risk operations")
    if "complex_plan" in risk_factors:
        recommendations.append("Break complex plan into smaller, manageable tasks")
    
    if not findings:
        findings.append("All safety checks passed")
    
    return {
        "ok": ok,
        "findings": findings,
        "risk_level": risk_level,
        "recommendations": recommendations
    }

def _format_plan_steps(steps: List[Dict]) -> str:
    """Format plan steps for display in prompt"""
    if not steps:
        return "No steps provided"
    
    formatted = []
    for step in steps:
        formatted.append(f"{step.get('index', '?')}. {step.get('action', 'Unknown action')} (~{step.get('est_seconds', 0)}s)")
    
    return "\n".join(formatted)

def _check_environmental_safety(environment: Dict, context: Dict) -> List[str]:
    """Check for environmental safety issues"""
    findings = []
    
    # Check for hazardous zones
    zone = environment.get("zone", "")
    if "hazard" in zone.lower() or "danger" in zone.lower():
        findings.append(f"Operating in potentially hazardous zone: {zone}")
    
    # Check for height constraints
    shelf_height = environment.get("shelf_height", 0)
    if shelf_height > 2.0:  # 2 meters
        findings.append(f"High shelf operation detected: {shelf_height}m")
    
    # Check for confined spaces
    if environment.get("confined_space", False):
        findings.append("Operating in confined space - ensure adequate ventilation")
    
    return findings
