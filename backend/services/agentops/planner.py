# AgentOps Studio - Planner Service
from .schemas import SoftwareTwin, TaskSpec, Plan

async def make_plan(twin: SoftwareTwin, task: TaskSpec) -> Plan:
    """Generate execution plan for software task"""
    steps, est = [], 0.0
    
    for i, action in enumerate(task.actions, start=1):
        # Estimate duration based on action type
        if action.type in ("fetch_url", "http_request"):
            duration = 6.0
        else:
            duration = 3.0
            
        steps.append({
            "index": i, 
            "action": action.type, 
            "params": action.params, 
            "est_seconds": duration
        })
        est += duration
    
    return Plan(
        task_name=task.name, 
        steps=steps, 
        est_total_seconds=round(est, 2)
    )
