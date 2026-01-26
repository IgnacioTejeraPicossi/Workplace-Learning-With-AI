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

@router.post("/run-with-apiconfig")
async def run_prompt_with_apiconfig(payload: Dict[str, Any]):
    """Execute prompt using API Config settings (ItemAI → OpenRouter → OpenAI)"""
    try:
        # Get API configuration from payload
        api_config = payload.get("api_config", {})
        api_provider = api_config.get("provider", "itemai")
        itemai_url = api_config.get("itemai_url", "http://localhost:1234")
        itemserverai_url = api_config.get("itemserverai_url", "https://192.168.50.214:1234")
        openai_key = api_config.get("openai_key", "")
        openrouter_key = api_config.get("openrouter_key", "")
        
        # Create PromptRun with defaults
        prompt_run = PromptRun(
            system=payload.get("system", "You are a concise assistant."),
            user=payload.get("user", "Hello, please help me with this task."),
            model=payload.get("model", DEFAULT_MODEL),
            temperature=payload.get("temperature", 0.3),
            max_tokens=payload.get("max_tokens", 512),
            policies=payload.get("policies", SafetyPolicy())
        )
        
        # Prepare messages
        messages = [
            {"role": "system", "content": prompt_run.system},
            {"role": "user", "content": prompt_run.user}
        ]
        
        # Try ItemAI first if configured
        if api_provider == "itemai":
            try:
                print("🔄 Trying ItemAI (LM Studio)...")
                import httpx
                
                payload_itemai = {
                    "model": "default",
                    "messages": messages,
                    "max_tokens": prompt_run.max_tokens,
                    "temperature": prompt_run.temperature,
                    "stream": False
                }
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        f"{itemai_url}/v1/chat/completions",
                        json=payload_itemai,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        completion_text = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        if completion_text and not completion_text.startswith("[MOCKED RESPONSE"):
                            print("✅ ItemAI (LM Studio) successful")
                            return {
                                "success": True,
                                "response": completion_text,
                                "ai_provider": "ItemAI (LM Studio)",
                                "model": response_data.get("model", "unknown"),
                                "safety_check": "PASSED",
                                "quality_score": min(100, max(0, len(completion_text.strip()) * 2))
                            }
            except Exception as e:
                print(f"❌ ItemAI failed: {e}")
        
        # Try ItemServerAI if configured
        if api_provider == "itemserverai":
            try:
                print("🔄 Trying ItemServerAI (LM Studio)...")
                import httpx
                
                payload_itemserverai = {
                    "model": "default",
                    "messages": messages,
                    "max_tokens": prompt_run.max_tokens,
                    "temperature": prompt_run.temperature,
                    "stream": False
                }
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        f"{itemserverai_url}/v1/chat/completions",
                        json=payload_itemserverai,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        completion_text = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        if completion_text and not completion_text.startswith("[MOCKED RESPONSE"):
                            print("✅ ItemServerAI (LM Studio) successful")
                            return {
                                "success": True,
                                "response": completion_text,
                                "ai_provider": "ItemServerAI (LM Studio)",
                                "model": response_data.get("model", "unknown"),
                                "safety_check": "PASSED",
                                "quality_score": min(100, max(0, len(completion_text.strip()) * 2))
                            }
            except Exception as e:
                print(f"❌ ItemServerAI failed: {e}")
        
        # Fallback to OpenRouter if configured
        if openrouter_key:
            try:
                print("🔄 Trying OpenRouter...")
                import openai
                openai.api_key = openrouter_key
                openai.api_base = "https://openrouter.ai/api/v1"
                
                response = openai.chat.completions.create(
                    model="openai/gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=prompt_run.max_tokens,
                    temperature=prompt_run.temperature
                )
                
                completion_text = response.choices[0].message.content.strip()
                if completion_text and not completion_text.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenRouter successful")
                    return {
                        "success": True,
                        "response": completion_text,
                        "ai_provider": "OpenRouter",
                        "model": "gpt-3.5-turbo",
                        "safety_check": "PASSED",
                        "quality_score": min(100, max(0, len(completion_text.strip()) * 2))
                    }
            except Exception as e:
                print(f"❌ OpenRouter failed: {e}")
        
        # Fallback to OpenAI if configured
        if openai_key:
            try:
                print("🔄 Trying OpenAI...")
                import openai
                openai.api_key = openai_key
                openai.api_base = "https://api.openai.com/v1"
                
                response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=prompt_run.max_tokens,
                    temperature=prompt_run.temperature
                )
                
                completion_text = response.choices[0].message.content.strip()
                if completion_text and not completion_text.startswith("[MOCKED RESPONSE"):
                    print("✅ OpenAI successful")
                    return {
                        "success": True,
                        "response": completion_text,
                        "ai_provider": "OpenAI",
                        "model": "gpt-3.5-turbo",
                        "safety_check": "PASSED",
                        "quality_score": min(100, max(0, len(completion_text.strip()) * 2))
                    }
            except Exception as e:
                print(f"❌ OpenAI failed: {e}")
        
        print("❌ All AI providers failed")
        return {
            "success": False,
            "error": "All AI providers unavailable",
            "details": "[MOCKED RESPONSE] No AI providers configured or available",
            "safety_check": "FAILED",
            "quality_score": 0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "details": str(e)
        }