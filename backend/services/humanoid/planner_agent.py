# Planner Agent - AI-powered task planning
from .schemas import PlanRequest, Plan, Step
from typing import List
import random

async def make_plan(req: PlanRequest) -> Plan:
    """
    Generate a task plan using AI (mock implementation)
    Uses the existing LLM infrastructure when available
    """
    try:
        # Try to use existing LLM infrastructure
        from backend.llm import ask_openai
        
        # Create a prompt for the planner
        prompt = f"""
        You are an AI planner for humanoid robot operations. Generate a detailed step-by-step plan for the following task:
        
        Task: {req.task.name}
        Description: {req.task.description}
        Human Role: {req.twin.human_role}
        Skills: {', '.join(req.twin.skills)}
        Constraints: {req.twin.constraints}
        Environment: {req.twin.environment}
        Quality Goal: {req.quality_goal}
        
        Please provide a JSON response with the following structure:
        {{
            "steps": [
                {{"index": 1, "action": "Step description", "est_seconds": 5.0}},
                {{"index": 2, "action": "Step description", "est_seconds": 8.0}}
            ],
            "total_seconds": 13.0
        }}
        
        Make the plan realistic and consider safety, efficiency, and the human operator's capabilities.
        """
        
        # Use OpenAI API if available
        response = await ask_openai(prompt, model="gpt-4o-mini")
        
        # Try to parse JSON response
        import json
        try:
            plan_data = json.loads(response)
            steps = []
            total_time = 0.0
            
            for step_data in plan_data.get("steps", []):
                step = Step(
                    index=step_data["index"],
                    action=step_data["action"],
                    est_seconds=float(step_data["est_seconds"])
                )
                steps.append(step)
                total_time += step.est_seconds
            
            return Plan(
                task_name=req.task.name,
                steps=steps,
                est_total_seconds=round(total_time, 2)
            )
        except (json.JSONDecodeError, KeyError, ValueError):
            # Fallback to mock implementation
            pass
            
    except Exception as e:
        print(f"⚠️ LLM planning failed, using mock: {e}")
        # Fallback to mock implementation
    
    # Mock implementation (fallback)
    return _generate_mock_plan(req)

def _generate_mock_plan(req: PlanRequest) -> Plan:
    """Generate a mock plan when LLM is not available"""
    # Use hints if provided, otherwise generate based on task type
    base_steps = req.task.steps_hint or _get_default_steps(req.task.name)
    
    # Adjust based on skills and constraints
    speed_factor = 0.9 if "picking" in [s.lower() for s in req.twin.skills] else 1.0
    if req.twin.constraints.get("max_load", 0) > 10:
        speed_factor *= 0.8  # Slower for heavy loads
    
    steps = []
    total = 0.0
    
    for i, step_desc in enumerate(base_steps, start=1):
        # Estimate time based on step type
        if "navigate" in step_desc.lower() or "move" in step_desc.lower():
            est_time = 8.0 * speed_factor
        elif "grip" in step_desc.lower() or "grab" in step_desc.lower():
            est_time = 6.0 * speed_factor
        elif "place" in step_desc.lower() or "put" in step_desc.lower():
            est_time = 5.0 * speed_factor
        elif "detect" in step_desc.lower() or "scan" in step_desc.lower():
            est_time = 4.0 * speed_factor
        else:
            est_time = 6.0 * speed_factor
        
        # Add some randomness
        est_time *= random.uniform(0.9, 1.1)
        est_time = round(est_time, 2)
        
        step = Step(index=i, action=step_desc, est_seconds=est_time)
        steps.append(step)
        total += est_time
    
    return Plan(
        task_name=req.task.name,
        steps=steps,
        est_total_seconds=round(total, 2)
    )

def _get_default_steps(task_name: str) -> List[str]:
    """Get default steps based on task name"""
    task_lower = task_name.lower()
    
    if "pick" in task_lower or "replenish" in task_lower:
        return [
            "Navigate to source location",
            "Detect target item with camera",
            "Grip item with appropriate force",
            "Lift item to safe height",
            "Navigate to destination",
            "Place item in target location",
            "Verify placement success"
        ]
    elif "inspect" in task_lower or "check" in task_lower:
        return [
            "Navigate to inspection area",
            "Position camera for optimal view",
            "Scan item for defects",
            "Record inspection results",
            "Mark item as inspected"
        ]
    elif "sort" in task_lower or "organize" in task_lower:
        return [
            "Scan items in sorting area",
            "Identify item categories",
            "Pick up first item",
            "Determine correct destination",
            "Place item in appropriate bin",
            "Repeat for remaining items"
        ]
    else:
        return [
            "Navigate to task area",
            "Assess current situation",
            "Execute primary task action",
            "Verify task completion",
            "Return to home position"
        ]
