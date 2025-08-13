# FastAPI app skeleton for AI Workplace Learning (Expanded Minimal Version)
from fastapi import FastAPI, Request, Body, HTTPException, Depends, status, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from pathlib import Path
import json
import os
from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from fastapi.staticfiles import StaticFiles

# Create FastAPI app
app = FastAPI(title="AI Learning Platform - Expanded", version="1.0.0")

# Mock verify_token function (no Firebase dependency)
def verify_token(request: Request):
    """Mock authentication - always returns a mock user for testing"""
    return {"sub": "mock_user_id", "email": "test@example.com", "name": "Test User"}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Basic models
class SimpleSearchRequest(BaseModel):
    topic: str
    limit: int = 10

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

# Basic endpoints for testing
@app.get("/")
async def root():
    return {"message": "AI Learning Platform - Expanded Minimal Version"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint works!"}

@app.post("/api/test")
async def api_test():
    return {"message": "API test endpoint works!"}

# Web search functionality (DuckDuckGo - no API key required)
@app.post("/api/simple-search")
async def simple_web_search(request: SimpleSearchRequest):
    """Simple web search using DuckDuckGo (no API key required)"""
    try:
        import httpx
        import re
        
        query = f"{request.topic} best practices tutorial guide"
        url = "https://html.duckduckgo.com/html/"
        params = {"q": query}
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            html_content = response.text
            results = []
            
            link_pattern = r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</a>'
            snippet_pattern = r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([^<]*)</a>'
            
            links = re.findall(link_pattern, html_content)
            snippets = re.findall(snippet_pattern, html_content)
            
            for i, (url, title) in enumerate(links[:request.limit]):
                if url.startswith('/'):
                    continue
                    
                title = re.sub(r'<[^>]+>', '', title).strip()
                
                snippet = ""
                if i < len(snippets):
                    snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                
                if not title or len(title) < 10:
                    continue
                
                results.append(SearchResult(
                    title=title,
                    url=url,
                    snippet=snippet[:200] + "..." if len(snippet) > 200 else snippet
                ))
            
            if not results:
                results = [
                    SearchResult(
                        title=f"{request.topic} - Tutorial and Best Practices",
                        url=f"https://duckduckgo.com/?q={request.topic}+tutorial+best+practices",
                        snippet=f"Search results for {request.topic} with tutorials, best practices, and guides. Click to view full results on DuckDuckGo."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Learning Resources",
                        url=f"https://duckduckgo.com/?q={request.topic}+learning+resources",
                        snippet=f"Find learning resources, documentation, and educational content about {request.topic}."
                    )
                ]
            
            return {"results": results[:request.limit], "query": query, "provider": "DuckDuckGo"}
            
    except ImportError:
        # Fallback if httpx is not available
        return {
            "results": [
                SearchResult(
                    title=f"{request.topic} - Search Results",
                    url=f"https://duckduckgo.com/?q={request.topic}",
                    snippet=f"Search for {request.topic} on DuckDuckGo. Click the link to view results."
                )
            ],
            "query": request.topic,
            "provider": "DuckDuckGo (fallback)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/search-health")
async def search_health():
    """Health check for search service"""
    return {"status": "healthy", "service": "duckduckgo-web-search"}

# Debug: Print all registered routes
print("🔍 DEBUG: All registered routes:")
for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        print(f"  {route.methods} {route.path}")

print("🔍 DEBUG: App setup complete!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
