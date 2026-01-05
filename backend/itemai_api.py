from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import asyncio
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api", tags=["itemai-api"])

class ItemAITestRequest(BaseModel):
    """Request model for testing ItemAI API connection"""
    model_config = {"protected_namespaces": ()}
    
    local_url: str = "http://localhost:1234"
    model_name: Optional[str] = None

class ItemAICompletionRequest(BaseModel):
    """Request model for ItemAI API completions"""
    model_config = {"protected_namespaces": ()}
    
    prompt: str
    model_name: Optional[str] = None
    max_tokens: int = 512
    temperature: float = 0.7
    local_url: str = "http://localhost:1234"

class ItemAIResponse(BaseModel):
    """Response model for ItemAI API"""
    model_config = {"protected_namespaces": ()}
    
    success: bool
    message: str
    response: Optional[str] = None
    model_used: Optional[str] = None
    error: Optional[str] = None

@router.post("/test-itemai", response_model=ItemAIResponse)
async def test_itemai_connection(request: ItemAITestRequest):
    """
    Test connection to local ItemAI API (LM Studio)
    """
    try:
        # Test basic connectivity
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First, try to get available models
            try:
                models_response = await client.get(f"{request.local_url}/v1/models")
                if models_response.status_code == 200:
                    models_data = models_response.json()
                    available_models = models_data.get("data", [])
                    model_names = [model.get("id", "unknown") for model in available_models]
                    
                    return ItemAIResponse(
                        success=True,
                        message=f"ItemAI API connection successful! Available models: {', '.join(model_names)}",
                        model_used=model_names[0] if model_names else None
                    )
                else:
                    return ItemAIResponse(
                        success=False,
                        message="ItemAI API connection failed",
                        error=f"Models endpoint returned status {models_response.status_code}"
                    )
                    
            except httpx.RequestError as e:
                return ItemAIResponse(
                    success=False,
                    message="ItemAI API connection failed",
                    error=f"Connection error: {str(e)}"
                )
                
    except Exception as e:
        return ItemAIResponse(
            success=False,
            message="ItemAI API test failed",
            error=str(e)
        )

@router.post("/itemai-completion", response_model=ItemAIResponse)
async def get_itemai_completion(request: ItemAICompletionRequest):
    """
    Get completion from local ItemAI API (LM Studio)
    """
    try:
        # Prepare the request payload for LM Studio
        payload = {
            "model": request.model_name or "default",
            "messages": [
                {"role": "user", "content": request.prompt}
            ],
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "stream": False
        }
        
        # Timeout: 420s (7 minutes) to match MCP server timeout
        async with httpx.AsyncClient(timeout=420.0) as client:
            response = await client.post(
                f"{request.local_url}/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                response_data = response.json()
                completion_text = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                model_used = response_data.get("model", "unknown")
                
                return ItemAIResponse(
                    success=True,
                    message="ItemAI API completion successful",
                    response=completion_text,
                    model_used=model_used
                )
            else:
                return ItemAIResponse(
                    success=False,
                    message="ItemAI API completion failed",
                    error=f"API returned status {response.status_code}: {response.text}"
                )
                
    except httpx.TimeoutException:
        return ItemAIResponse(
            success=False,
            message="ItemAI API request timed out",
            error="Request timed out after 420 seconds (7 minutes). Consider reducing Context Length in LM Studio (e.g., 4096 or 6144 tokens) or using cloud AI for large documents."
        )
    except Exception as e:
        return ItemAIResponse(
            success=False,
            message="ItemAI API completion failed",
            error=str(e)
        )

@router.get("/itemai-models")
async def get_itemai_models(local_url: str = "http://localhost:1234"):
    """
    Get available models from local ItemAI API
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{local_url}/v1/models")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "models": response.json().get("data", []),
                    "message": "Models retrieved successfully"
                }
            else:
                return {
                    "success": False,
                    "models": [],
                    "message": f"Failed to get models: {response.status_code}"
                }
                
    except Exception as e:
        return {
            "success": False,
            "models": [],
            "message": f"Error retrieving models: {str(e)}"
        }
