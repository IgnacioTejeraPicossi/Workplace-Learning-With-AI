from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from backend.services.digital import playbooks_repo
from backend.services.humanoid import planner_agent, safety_agent, simulator

router = APIRouter(prefix="/api/digital", tags=["digital"])

# --- Playbooks CRUD ---
@router.post("/playbooks")
async def create_playbook(payload: Dict[str, Any]):
    """
    Body: { name, description?, task: TaskSpec (dict) }
    """
    if not payload.get("name") or not payload.get("task"):
        raise HTTPException(400, "name and task are required")
    doc = {
        "name": payload["name"],
        "description": payload.get("description", ""),
        "task": payload["task"]
    }
    return await playbooks_repo.insert_playbook(doc)

@router.get("/playbooks")
async def list_playbooks():
    return {"items": await playbooks_repo.list_playbooks()}

@router.get("/playbooks/{pid}")
async def read_playbook(pid: str):
    pb = await playbooks_repo.get_playbook(pid)
    if not pb: 
        raise HTTPException(404, "playbook not found")
    return pb

@router.patch("/playbooks/{pid}")
async def patch_playbook(pid: str, patch: Dict[str, Any]):
    pb = await playbooks_repo.update_playbook(pid, patch)
    if not pb: 
        raise HTTPException(404, "playbook not found")
    return pb

@router.delete("/playbooks/{pid}")
async def delete_playbook(pid: str):
    ok = await playbooks_repo.delete_playbook(pid)
    if not ok: 
        raise HTTPException(404, "playbook not found")
    return {"deleted": True}

# --- Digital Lab endpoints (reusing Humanoid Lab services) ---
@router.post("/plan")
async def plan_task(payload: Dict[str, Any]):
    """
    Body: { twin, task }
    """
    twin = payload.get("twin")
    task = payload.get("task")
    if not twin or not task:
        raise HTTPException(400, "twin and task required")
    
    try:
        plan_res = await planner_agent.make_plan(twin, task)
        return {"plan": plan_res}
    except Exception as e:
        raise HTTPException(500, f"Planning failed: {str(e)}")

@router.post("/safety-check")
async def safety_check(payload: Dict[str, Any]):
    """
    Body: { twin, task, plan }
    """
    twin = payload.get("twin")
    task = payload.get("task")
    plan = payload.get("plan")
    if not twin or not task or not plan:
        raise HTTPException(400, "twin, task and plan required")
    
    try:
        safety_res = await safety_agent.evaluate({"twin": twin, "task": task, "plan": plan})
        return safety_res
    except Exception as e:
        raise HTTPException(500, f"Safety check failed: {str(e)}")

@router.post("/simulate")
async def simulate_task(payload: Dict[str, Any]):
    """
    Body: { plan }
    """
    plan = payload.get("plan")
    if not plan:
        raise HTTPException(400, "plan required")
    
    try:
        sim_res = await simulator.preview({"plan": plan})
        return sim_res
    except Exception as e:
        raise HTTPException(500, f"Simulation failed: {str(e)}")

# --- Optional: single-call pipeline for UX sugar ---
@router.post("/run/pipeline")
async def run_pipeline(payload: Dict[str, Any]):
    """
    Body: { twin, task }
    Returns: { plan, safety, sim }
    """
    twin = payload.get("twin")
    task = payload.get("task")
    if not twin or not task:
        raise HTTPException(400, "twin and task required")

    try:
        # Step 1: Plan
        plan_res = await planner_agent.make_plan(twin, task)
        plan_dict = plan_res.dict() if hasattr(plan_res, "dict") else plan_res
        
        # Step 2: Safety Check
        safety_res = await safety_agent.evaluate({"twin": twin, "task": task, "plan": plan_dict})
        
        # Step 3: Simulation
        sim_res = await simulator.preview({"plan": plan_dict})

        return {
            "plan": plan_dict, 
            "safety": safety_res, 
            "sim": sim_res
        }
    except Exception as e:
        raise HTTPException(500, f"Pipeline execution failed: {str(e)}")
