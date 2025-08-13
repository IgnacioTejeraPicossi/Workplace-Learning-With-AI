from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import httpx
import os

router = APIRouter()

class SimpleSearchRequest(BaseModel):
    topic: str
    limit: int = 10

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

@router.post("/simple-search")
async def simple_web_search(request: SimpleSearchRequest):
    """Simple web search using Bing Web Search API"""
    
    # Get API key from environment
    bing_api_key = os.getenv("BING_API_KEY")
    if not bing_api_key:
        raise HTTPException(status_code=500, detail="Bing API key not configured")
    
    try:
        # Create search query
        query = f"{request.topic} best practices tutorial guide"
        
        # Call Bing Web Search API
        url = "https://api.bing.microsoft.com/v7.0/search"
        headers = {"Ocp-Apim-Subscription-Key": bing_api_key}
        params = {
            "q": query, 
            "count": request.limit, 
            "textDecorations": False, 
            "safeSearch": "Moderate"
        }
        
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            web_pages = data.get("webPages", {}).get("value", [])
            
            # Format results
            results = []
            for page in web_pages:
                results.append(SearchResult(
                    title=page.get("name", ""),
                    url=page.get("url", ""),
                    snippet=page.get("snippet", "")
                ))
            
            return {"results": results, "query": query}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Search API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/search-health")
async def search_health():
    """Health check for search service"""
    return {"status": "healthy", "service": "simple-web-search"}
