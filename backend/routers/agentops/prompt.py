# AgentOps Studio - Prompt Router
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.services.agentops.schemas import PromptRun, SafetyPolicy

router = APIRouter(tags=["prompt"])

DEFAULT_MODEL = "deepseek-r1-distill-qwen-7b"


@router.post("/run")
async def run_prompt(payload: Dict[str, Any]):
    """Execute prompt through unified AI system (ItemAI → OpenRouter → OpenAI)"""
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
        
        # Use unified AI system (ItemAI → OpenRouter → OpenAI)
        try:
            from backend.llm import ask_openai_unified
        except ImportError:
            from llm import ask_openai_unified
        
        # Prepare messages for the unified system
        messages = [
            {"role": "system", "content": prompt_run.system},
            {"role": "user", "content": prompt_run.user}
        ]
        
        # Call unified AI system
        response = await ask_openai_unified(
            messages=messages,
            max_tokens=prompt_run.max_tokens,
            temperature=prompt_run.temperature
        )
        
        # Check if response is valid (not mocked)
        if response and not response.startswith("[MOCKED RESPONSE"):
            return {
                "success": True,
                "response": response,
                "usage": {
                    "prompt_tokens": len(full_prompt.split()),
                    "completion_tokens": len(response.split()),
                    "total_tokens": len(full_prompt.split()) + len(response.split())
                },
                "model": "unified_ai_system",
                "ai_provider": "ItemAI → OpenRouter → OpenAI"
            }
        else:
            return {
                "success": False,
                "error": "Unified AI system returned mock response",
                "details": response
            }
                
    except Exception as e:
        return {
            "success": False,
            "error": f"Unified AI system error: {str(e)}"
        }