from fastapi import APIRouter, HTTPException
from .models import Checkpoint, ChatReq, FlowReq
from .store import append_turn, save_findings, get_turns
from backend.clinic.models import CaseIntake
from backend.clinic.service import diagnose_case
import asyncio, os, random, httpx

router = APIRouter(prefix="/api/gateway", tags=["ai-gateway"])
SAMPLE = float(os.getenv("CLINIC_SAMPLING","0.25"))

@router.post("/checkpoint")
async def checkpoint(body: Checkpoint):
    await append_turn(body.run_id, body.turn, body.meta)
    return {"ok": True}

@router.post("/chat")
async def chat(body: ChatReq):
    # 1) call LM Studio (or your existing chat endpoint)
    async with httpx.AsyncClient(timeout=60) as s:
        r = await s.post(os.getenv("CHAT_BACKEND","http://localhost:1234/v1/chat/completions"),
                         json=body.payload)
        r.raise_for_status()
        out = r.json()
    
    # 2) Sample diagnosis after assistant reply
    if random.random() < SAMPLE:
        asyncio.create_task(_run_diagnosis(body.run_id))
    
    return {
        "output": out.get("choices",[{}])[0].get("message",{}).get("content",""), 
        "raw": out
    }

@router.post("/flow/trigger")
async def flow_trigger(body: FlowReq):
    # call runner-specific bridge (n8n/outsystems/temporal)
    url = _runner_url(body.runner)
    async with httpx.AsyncClient(timeout=120) as s:
        r = await s.post(url, json={"flow_id":body.flow_id, "inputs":body.inputs, "run_id":body.run_id})
        r.raise_for_status()
        res = r.json()
    
    # on error or policy -> enqueue diagnosis
    if res.get("status") == "error" or random.random() < SAMPLE:
        asyncio.create_task(_run_diagnosis(body.run_id))
    
    return res

def _runner_url(runner:str)->str:
    m = {
        "n8n": os.getenv("N8N_BRIDGE","http://localhost:8000/api/n8n/trigger"),
        "outsystems": os.getenv("OUT_BRIDGE","http://localhost:8000/api/outsystems/trigger"),
        "temporal": os.getenv("TMP_BRIDGE","http://localhost:8000/api/temporal/start"),
        "lmstudio": os.getenv("LMST_BRIDGE","http://localhost:8000/api/lmstudio/run")
    }
    return m[runner]

async def _run_diagnosis(run_id:str):
    try:
        # pull last N turns
        turns = await get_turns(run_id, 12)
        if not turns: 
            return
            
        report = await diagnose_case(CaseIntake(run_id=run_id, turns=turns))
        await save_findings(run_id, report.dict())
    except Exception as e:
        print(f"Diagnosis failed for {run_id}: {e}")
