from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

# OpenRouter support
try:
    import openrouter
except ImportError:
    openrouter = None

router = APIRouter(prefix="/api", tags=["api-test"])

class APITestRequest(BaseModel):
    provider: str
    openaiKey: str = ""
    openrouterKey: str = ""

@router.post("/test-api")
async def test_api_connection(request: APITestRequest):
    """
    Test API connection for the specified provider
    """
    try:
        if request.provider == "openai":
            if not request.openaiKey:
                raise HTTPException(status_code=400, detail="OpenAI API key is required")
            
            # Test OpenAI
            openai.api_key = request.openaiKey
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello! Please respond with 'OpenAI API is working correctly.'"}],
                max_tokens=50
            )
            
            return {
                "success": True,
                "provider": "openai",
                "message": "OpenAI API connection successful",
                "response": response.choices[0].message.content.strip()
            }
            
        elif request.provider == "openrouter":
            if not request.openrouterKey:
                raise HTTPException(status_code=400, detail="OpenRouter API key is required")
            
            if not openrouter:
                raise HTTPException(status_code=500, detail="OpenRouter library not installed")
            
            # Test OpenRouter
            openrouter.api_key = request.openrouterKey
            openrouter.api_base = "https://openrouter.ai/api/v1"
            
            response = openrouter.ChatCompletion.create(
                model="openai/gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello! Please respond with 'OpenRouter API is working correctly.'"}],
                max_tokens=50
            )
            
            return {
                "success": True,
                "provider": "openrouter",
                "message": "OpenRouter API connection successful",
                "response": response.choices[0].message.content.strip()
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid provider. Use 'openai' or 'openrouter'")
            
    except Exception as e:
        return {
            "success": False,
            "provider": request.provider,
            "message": f"API test failed: {str(e)}",
            "error": str(e)
        }
