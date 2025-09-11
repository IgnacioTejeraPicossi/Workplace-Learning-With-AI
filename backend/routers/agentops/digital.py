# AgentOps Studio - Digital Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import os
from services.agentops.schemas import SoftwareTwin, TaskSpec, TaskAction
from services.agentops import planner, safety, simulator, judge

router = APIRouter(tags=["digital"])
N8N_TIMEOUT = float(os.getenv("N8N_TIMEOUT", "60"))

@router.post("/plan")
async def digital_plan(payload: Dict[str, Any]):
    """Generate execution plan for software task"""
    # Handle both full payload and simple topic/context
    if "twin" in payload and "task" in payload:
        # Full payload with twin and task
        twin = SoftwareTwin(**payload["twin"])
        task = TaskSpec(**payload["task"])
    else:
        # Simple payload with topic and context
        topic = payload.get("topic", "Untitled Task")
        context = payload.get("context", "")

        # Create default twin and task
        twin = SoftwareTwin(
            name="Default Software Twin",
            description="Auto-generated twin for planning",
            capabilities=["analysis", "execution"],
            policies={"safety": True, "performance": "high"}
        )
        
        # Create proper TaskAction objects
        actions = [
            TaskAction(
                id="analyze_1",
                name="Analyze Context",
                description="Analyze the provided context",
                type="extract_text",
                estimated_duration=30,
                params={"context": context}
            ),
            TaskAction(
                id="execute_1",
                name="Execute Task",
                description="Execute the main task",
                type="http_request",
                estimated_duration=60,
                params={"topic": topic}
            )
        ]

        task = TaskSpec(
            name=topic,
            description=context,
            actions=actions,
            expected_outcome="Task completion"
        )

    plan = await planner.make_plan(twin, task)
    return {"plan": plan.dict()}

@router.post("/safety-check")
async def safety_check(payload: Dict[str, Any]):
    """Evaluate safety of planned task"""
    try:
        twin = SoftwareTwin(**payload["twin"])
        task = TaskSpec(**payload["task"])
        plan = payload.get("plan", {})
        
        safety_report = await safety.evaluate_safety(twin, task, plan)
        return {"safety_report": safety_report.dict()}
    except Exception as e:
        return {"error": str(e)}

@router.post("/simulate")
async def simulate_execution(payload: Dict[str, Any]):
    """Simulate task execution"""
    try:
        twin = SoftwareTwin(**payload["twin"])
        task = TaskSpec(**payload["task"])
        plan = payload.get("plan", {})
        
        sim_result = await simulator.simulate_execution(twin, task, plan)
        return {"simulation": sim_result.dict()}
    except Exception as e:
        return {"error": str(e)}

@router.post("/judge")
async def judge_execution(payload: Dict[str, Any]):
    """Judge execution quality"""
    try:
        twin = SoftwareTwin(**payload["twin"])
        task = TaskSpec(**payload["task"])
        result = payload.get("result", {})
        
        judgment = await judge.evaluate_quality(twin, task, result)
        return {"judgment": judgment.dict()}
    except Exception as e:
        return {"error": str(e)}

@router.post("/run/pipeline")
async def run_pipeline(payload: Dict[str, Any]):
    """Run complete Plan → Safety → Sim → Judge pipeline"""
    try:
        twin = SoftwareTwin(**payload["twin"])
        task = TaskSpec(**payload["task"])
        
        # Step 1: Plan
        plan = await planner.make_plan(twin, task)
        
        # Step 2: Safety Check
        safety_report = await safety.evaluate_safety(twin, task, plan.dict())
        
        # Step 3: Simulate
        sim_result = await simulator.simulate_execution(twin, task, plan.dict())
        
        # Step 4: Judge
        judgment = await judge.evaluate_quality(twin, task, sim_result.dict())
        
        return {
            "plan": plan.dict(),
            "safety_report": safety_report.dict(),
            "simulation": sim_result.dict(),
            "judgment": judgment.dict()
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/execute")
async def execute_task(payload: Dict[str, Any]):
    """Execute task via n8n"""
    try:
        # This would integrate with n8n webhooks
        return {"status": "execution_started", "message": "Task execution initiated"}
    except Exception as e:
        return {"error": str(e)}