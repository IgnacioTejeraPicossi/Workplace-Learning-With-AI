# Simulator - Task execution simulation
from typing import Dict, List, Any
import random
import time
import asyncio

async def run_sim(payload: Dict) -> Dict:
    """
    Run simulation of the planned task
    Simulates realistic execution with telemetry data
    """
    try:
        # Try to use existing LLM infrastructure for realistic simulation
        from backend.llm import ask_openai
        
        plan = payload.get("plan", {})
        twin = payload.get("twin", {})
        task = payload.get("task", {})
        
        if not plan or not plan.get("steps"):
            return {"ok": False, "error": "No plan provided for simulation"}
        
        # Create simulation prompt
        prompt = f"""
        You are simulating a humanoid robot executing this task plan:
        
        Task: {task.get('name', 'Unknown')}
        Human Role: {twin.get('human_role', 'Unknown')}
        Skills: {twin.get('skills', [])}
        Constraints: {twin.get('constraints', {})}
        
        Plan Steps:
        {_format_plan_for_simulation(plan.get('steps', []))}
        
        Simulate realistic execution considering:
        - Human operator skill level
        - Environmental factors
        - Equipment performance
        - Potential delays or issues
        
        Provide a JSON response with:
        {{
            "ok": true,
            "sim_total_seconds": 45.2,
            "telemetry": [
                {{
                    "step": "Navigate to source",
                    "duration": 8.5,
                    "energy_j": 250.0,
                    "events": ["ok"],
                    "position": {{"x": 1.2, "y": 0.8, "z": 0.1}},
                    "gripper_state": "open"
                }}
            ],
            "kpis": {{
                "minor_events": 1,
                "avg_step_seconds": 6.5,
                "energy_efficiency": 0.85,
                "success_rate": 0.95
            }}
        }}
        """
        
        response = await ask_openai(prompt, model="gpt-4o-mini")
        
        # Try to parse JSON response
        import json
        try:
            sim_data = json.loads(response)
            return {
                "ok": sim_data.get("ok", True),
                "sim_total_seconds": sim_data.get("sim_total_seconds", 0),
                "telemetry": sim_data.get("telemetry", []),
                "kpis": sim_data.get("kpis", {})
            }
        except (json.JSONDecodeError, KeyError, ValueError):
            # Fallback to mock simulation
            pass
            
    except Exception as e:
        print(f"⚠️ LLM simulation failed, using mock: {e}")
        # Fallback to mock simulation
    
    # Mock simulation (fallback)
    return _generate_mock_simulation(payload)

def _generate_mock_simulation(payload: Dict) -> Dict:
    """Generate mock simulation data when LLM is not available"""
    plan = payload.get("plan", {})
    twin = payload.get("twin", {})
    
    if not plan or not plan.get("steps"):
        return {"ok": False, "error": "No plan provided for simulation"}
    
    steps = plan.get("steps", [])
    twin_skills = twin.get("skills", [])
    constraints = twin.get("constraints", {})
    
    # Calculate performance factors
    skill_factor = _calculate_skill_factor(twin_skills)
    load_factor = _calculate_load_factor(constraints)
    complexity_factor = _calculate_complexity_factor(steps)
    
    # Simulate execution
    total_time = 0.0
    telemetry = []
    minor_events = 0
    
    for i, step in enumerate(steps):
        # Base duration from plan
        base_duration = step.get("est_seconds", 5.0)
        
        # Apply performance factors
        duration = base_duration * skill_factor * load_factor * complexity_factor
        
        # Add realistic variance
        duration *= random.uniform(0.85, 1.15)
        duration = round(duration, 2)
        
        # Simulate events
        events = ["ok"]
        if random.random() < 0.1:  # 10% chance of minor event
            events.append("minor_delay")
            minor_events += 1
        
        # Calculate energy consumption
        energy = duration * random.uniform(20, 30)  # Joules per second
        
        # Generate position data
        position = _generate_position_data(i, len(steps))
        
        # Generate gripper state
        gripper_state = _generate_gripper_state(step.get("action", ""))
        
        telemetry_entry = {
            "step": step.get("action", f"Step {i+1}"),
            "duration": duration,
            "energy_j": round(energy, 2),
            "events": events,
            "position": position,
            "gripper_state": gripper_state
        }
        
        telemetry.append(telemetry_entry)
        total_time += duration
    
    # Calculate KPIs
    avg_step_time = total_time / len(steps) if steps else 0
    energy_efficiency = random.uniform(0.8, 0.95)
    success_rate = 1.0 - (minor_events * 0.05)  # Each minor event reduces success rate
    
    kpis = {
        "minor_events": minor_events,
        "avg_step_seconds": round(avg_step_time, 2),
        "energy_efficiency": round(energy_efficiency, 2),
        "success_rate": round(success_rate, 2)
    }
    
    return {
        "ok": True,
        "sim_total_seconds": round(total_time, 2),
        "telemetry": telemetry,
        "kpis": kpis
    }

def _calculate_skill_factor(skills: List[str]) -> float:
    """Calculate performance factor based on skills"""
    if not skills:
        return 1.0
    
    # Skills that improve performance
    performance_skills = ["picking", "precision", "navigation", "gripping"]
    skill_count = sum(1 for skill in skills if any(ps in skill.lower() for ps in performance_skills))
    
    # Each relevant skill improves performance by 5%
    return max(0.7, 1.0 - (skill_count * 0.05))

def _calculate_load_factor(constraints: Dict) -> float:
    """Calculate performance factor based on load constraints"""
    max_load = constraints.get("max_load", 0)
    if max_load == 0:
        return 1.0
    
    # Heavier loads reduce performance
    if max_load > 20:
        return 0.8
    elif max_load > 10:
        return 0.9
    else:
        return 1.0

def _calculate_complexity_factor(steps: List[Dict]) -> float:
    """Calculate performance factor based on plan complexity"""
    if not steps:
        return 1.0
    
    # More steps = more complexity
    step_count = len(steps)
    if step_count > 8:
        return 1.1
    elif step_count > 5:
        return 1.05
    else:
        return 1.0

def _generate_position_data(step_index: int, total_steps: int) -> Dict[str, float]:
    """Generate realistic position data for telemetry"""
    # Simulate movement in a 2x2 meter workspace
    x = random.uniform(0.5, 1.8)
    y = random.uniform(0.3, 1.5)
    z = random.uniform(0.1, 1.2)  # Height
    
    return {
        "x": round(x, 2),
        "y": round(y, 2),
        "z": round(z, 2)
    }

def _generate_gripper_state(action: str) -> str:
    """Generate appropriate gripper state based on action"""
    action_lower = action.lower()
    
    if "grip" in action_lower or "grab" in action_lower or "hold" in action_lower:
        return "closed"
    elif "release" in action_lower or "drop" in action_lower or "place" in action_lower:
        return "open"
    else:
        return "open" if random.random() < 0.5 else "closed"

def _format_plan_for_simulation(steps: List[Dict]) -> str:
    """Format plan steps for simulation prompt"""
    if not steps:
        return "No steps provided"
    
    formatted = []
    for step in steps:
        formatted.append(f"{step.get('index', '?')}. {step.get('action', 'Unknown action')} (est: {step.get('est_seconds', 0)}s)")
    
    return "\n".join(formatted)
