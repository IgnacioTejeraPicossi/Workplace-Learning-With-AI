# Judge Agent - Performance evaluation and scoring
from typing import Dict
import random

async def score(payload: Dict) -> Dict:
    """
    Judge the performance and quality of the humanoid run
    Uses AI when available, falls back to rule-based scoring
    """
    try:
        # Try to use existing LLM infrastructure for intelligent judging
        from backend.llm import ask_openai
        
        plan = payload.get("plan", {})
        sim = payload.get("sim", {})
        safety = payload.get("safety", {})
        
        # Create judging prompt
        prompt = f"""
        You are an AI judge evaluating a humanoid robot task execution. Rate the performance based on:
        
        PLANNED vs ACTUAL:
        - Estimated time: {plan.get('est_total_seconds', 0)}s
        - Actual time: {sim.get('sim_total_seconds', 0)}s
        - Time ratio: {sim.get('sim_total_seconds', 0) / max(plan.get('est_total_seconds', 1), 1):.2f}
        
        SAFETY:
        - Safety status: {'PASS' if safety.get('ok') else 'FAIL'}
        - Safety findings: {safety.get('findings', [])}
        - Risk level: {safety.get('risk_level', 'unknown')}
        
        PERFORMANCE METRICS:
        - Minor events: {sim.get('kpis', {}).get('minor_events', 0)}
        - Energy efficiency: {sim.get('kpis', {}).get('energy_efficiency', 0)}
        - Success rate: {sim.get('kpis', {}).get('success_rate', 0)}
        
        Rate the performance on a scale of 0-100 considering:
        1. Time efficiency (actual vs estimated)
        2. Safety compliance
        3. Operational quality (events, efficiency)
        4. Overall execution success
        
        Provide a JSON response:
        {{
            "score": 85.5,
            "explain": {{
                "safety_ok": true,
                "time_ratio": 1.05,
                "efficiency_rating": "good",
                "safety_rating": "excellent",
                "overall_rating": "good",
                "penalties": ["minor_delay_penalty: -5"],
                "bonuses": ["efficiency_bonus: +3"]
            }}
        }}
        """
        
        response = await ask_openai(prompt, model="gpt-4o-mini")
        
        # Try to parse JSON response
        import json
        try:
            judge_data = json.loads(response)
            return {
                "score": judge_data.get("score", 0),
                "explain": judge_data.get("explain", {})
            }
        except (json.JSONDecodeError, KeyError, ValueError):
            # Fallback to rule-based scoring
            pass
            
    except Exception as e:
        print(f"⚠️ LLM judging failed, using rule-based: {e}")
        # Fallback to rule-based scoring
    
    # Rule-based scoring (fallback)
    return _rule_based_scoring(payload)

def _rule_based_scoring(payload: Dict) -> Dict:
    """Rule-based performance scoring when LLM is not available"""
    plan = payload.get("plan", {})
    sim = payload.get("sim", {})
    safety = payload.get("safety", {})
    
    # Base score
    base_score = 80.0
    
    # Safety factor (most important)
    safety_ok = safety.get("ok", False)
    if not safety_ok:
        base_score = 30.0  # Major penalty for safety failure
    else:
        risk_level = safety.get("risk_level", "medium")
        if risk_level == "low":
            base_score += 10.0
        elif risk_level == "high":
            base_score -= 20.0
    
    # Time efficiency factor
    est_time = plan.get("est_total_seconds", 1.0)
    actual_time = sim.get("sim_total_seconds", est_time)
    time_ratio = actual_time / max(est_time, 0.1)
    
    if time_ratio <= 0.9:  # Faster than expected
        time_bonus = 15.0
    elif time_ratio <= 1.1:  # Close to estimate
        time_bonus = 10.0
    elif time_ratio <= 1.3:  # Somewhat slower
        time_bonus = 0.0
    else:  # Much slower
        time_bonus = -20.0
    
    # Performance quality factor
    kpis = sim.get("kpis", {})
    minor_events = kpis.get("minor_events", 0)
    energy_efficiency = kpis.get("energy_efficiency", 0.8)
    success_rate = kpis.get("success_rate", 0.9)
    
    # Penalty for minor events
    event_penalty = minor_events * 5.0
    
    # Bonus for efficiency
    efficiency_bonus = 0.0
    if energy_efficiency > 0.9:
        efficiency_bonus = 5.0
    elif energy_efficiency < 0.7:
        efficiency_bonus = -5.0
    
    # Bonus for success rate
    success_bonus = 0.0
    if success_rate > 0.95:
        success_bonus = 5.0
    elif success_rate < 0.8:
        success_bonus = -10.0
    
    # Calculate final score
    final_score = base_score + time_bonus - event_penalty + efficiency_bonus + success_bonus
    final_score = max(0.0, min(100.0, final_score))  # Clamp between 0-100
    
    # Generate explanation
    explain = {
        "safety_ok": safety_ok,
        "time_ratio": round(time_ratio, 2),
        "efficiency_rating": _get_efficiency_rating(energy_efficiency),
        "safety_rating": _get_safety_rating(safety_ok, safety.get("risk_level", "medium")),
        "overall_rating": _get_overall_rating(final_score),
        "penalties": _get_penalties(minor_events, time_ratio, energy_efficiency, success_rate),
        "bonuses": _get_bonuses(time_ratio, energy_efficiency, success_rate)
    }
    
    return {
        "score": round(final_score, 1),
        "explain": explain
    }

def _get_efficiency_rating(efficiency: float) -> str:
    """Get efficiency rating based on energy efficiency"""
    if efficiency > 0.9:
        return "excellent"
    elif efficiency > 0.8:
        return "good"
    elif efficiency > 0.7:
        return "fair"
    else:
        return "poor"

def _get_safety_rating(safety_ok: bool, risk_level: str) -> str:
    """Get safety rating based on safety status"""
    if not safety_ok:
        return "fail"
    elif risk_level == "low":
        return "excellent"
    elif risk_level == "medium":
        return "good"
    else:
        return "fair"

def _get_overall_rating(score: float) -> str:
    """Get overall rating based on final score"""
    if score >= 90:
        return "excellent"
    elif score >= 80:
        return "good"
    elif score >= 70:
        return "fair"
    elif score >= 60:
        return "poor"
    else:
        return "fail"

def _get_penalties(minor_events: int, time_ratio: float, efficiency: float, success_rate: float) -> list:
    """Get list of penalties applied"""
    penalties = []
    
    if minor_events > 0:
        penalties.append(f"minor_events_penalty: -{minor_events * 5}")
    
    if time_ratio > 1.3:
        penalties.append(f"time_delay_penalty: -{int((time_ratio - 1.0) * 20)}")
    
    if efficiency < 0.7:
        penalties.append("low_efficiency_penalty: -5")
    
    if success_rate < 0.8:
        penalties.append("low_success_penalty: -10")
    
    return penalties

def _get_bonuses(time_ratio: float, efficiency: float, success_rate: float) -> list:
    """Get list of bonuses applied"""
    bonuses = []
    
    if time_ratio <= 0.9:
        bonuses.append("time_efficiency_bonus: +15")
    elif time_ratio <= 1.1:
        bonuses.append("time_accuracy_bonus: +10")
    
    if efficiency > 0.9:
        bonuses.append("high_efficiency_bonus: +5")
    
    if success_rate > 0.95:
        bonuses.append("high_success_bonus: +5")
    
    return bonuses
