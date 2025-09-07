# AgentOps Studio - Prompt Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import httpx
import os
from backend.services.agentops.schemas import PromptRun, SafetyPolicy

router = APIRouter(tags=["prompt"])

DEFAULT_MODEL = "deepseek-r1-distill-qwen-7b"
LMSTUDIO_BASE = os.getenv("LMSTUDIO_BASE", "http://localhost:1234/v1")

@router.post("/run")
async def run_prompt(payload: Dict[str, Any]):
    """Execute prompt through LM Studio"""
    try:
        # Create PromptRun with defaults
        prompt_run = PromptRun(
            system=payload.get("system", "You are a concise assistant."),
            user=payload.get("user", "Hello, please help me with this task."),
            model=payload.get("model", DEFAULT_MODEL),
            temperature=payload.get("temperature", 0.3),
            max_tokens=payload.get("max_tokens", 512),
            policies=payload.get("policies", SafetyPolicy())
        )
        
        # Call LM Studio
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{LMSTUDIO_BASE}/chat/completions",
                json={
                    "model": prompt_run.model,
                    "messages": [
                        {"role": "system", "content": prompt_run.system},
                        {"role": "user", "content": prompt_run.user}
                    ],
                    "temperature": prompt_run.temperature,
                    "max_tokens": prompt_run.max_tokens
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "response": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    "usage": result.get("usage", {}),
                    "model": prompt_run.model
                }
            else:
                return {
                    "success": False,
                    "error": f"LM Studio error: {response.status_code}",
                    "details": response.text
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
