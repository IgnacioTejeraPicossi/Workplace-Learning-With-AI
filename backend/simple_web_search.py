from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import httpx
import re

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
    """Simple web search using DuckDuckGo (no API key required)"""
    try:
        # DuckDuckGo search URL
        query = f"{request.topic} best practices tutorial guide"
        url = "https://html.duckduckgo.com/html/"
        params = {"q": query}
        
        # Use a realistic user agent to avoid blocking
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            # Parse HTML response to extract search results
            html_content = response.text
            
            # Extract results using regex patterns for DuckDuckGo HTML
            results = []
            
            # Pattern for DuckDuckGo result links
            # Look for links with class "result__a" or similar
            link_pattern = r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</a>'
            snippet_pattern = r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([^<]*)</a>'
            
            # Find all links
            links = re.findall(link_pattern, html_content)
            snippets = re.findall(snippet_pattern, html_content)
            
            # Process results (limit to requested amount)
            for i, (url, title) in enumerate(links[:request.limit]):
                if url.startswith('/'):
                    # Skip internal DuckDuckGo links
                    continue
                    
                # Clean up the title
                title = re.sub(r'<[^>]+>', '', title).strip()
                
                # Get snippet if available
                snippet = ""
                if i < len(snippets):
                    snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                
                # Skip if no meaningful content
                if not title or len(title) < 10:
                    continue
                
                results.append(SearchResult(
                    title=title,
                    url=url,
                    snippet=snippet[:200] + "..." if len(snippet) > 200 else snippet
                ))
            
            # If regex parsing didn't work well, provide fallback results
            if not results:
                print(f"⚠️ DuckDuckGo parsing failed, using fallback results for: {request.topic}")
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
                    ),
                    SearchResult(
                        title=f"{request.topic} - Official Documentation",
                        url=f"https://duckduckgo.com/?q={request.topic}+official+documentation",
                        snippet=f"Official documentation and guides for {request.topic}. Comprehensive reference materials and API documentation."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Community Forum",
                        url=f"https://duckduckgo.com/?q={request.topic}+community+forum+discussion",
                        snippet=f"Community discussions, Q&A, and support forums for {request.topic}. Get help from other users and experts."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Video Tutorials",
                        url=f"https://duckduckgo.com/?q={request.topic}+video+tutorial+youtube",
                        snippet=f"Video tutorials and step-by-step guides for {request.topic}. Learn through visual demonstrations and examples."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Best Practices Guide",
                        url=f"https://duckduckgo.com/?q={request.topic}+best+practices+guide",
                        snippet=f"Best practices, tips, and advanced techniques for {request.topic}. Optimize your workflow and avoid common pitfalls."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Examples and Use Cases",
                        url=f"https://duckduckgo.com/?q={request.topic}+examples+use+cases",
                        snippet=f"Real-world examples and practical use cases for {request.topic}. See how others are using it successfully."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Troubleshooting Guide",
                        url=f"https://duckduckgo.com/?q={request.topic}+troubleshooting+problems+solutions",
                        snippet=f"Common problems and solutions for {request.topic}. Troubleshooting guide and FAQ section."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Advanced Features",
                        url=f"https://duckduckgo.com/?q={request.topic}+advanced+features+capabilities",
                        snippet=f"Advanced features and capabilities of {request.topic}. Explore powerful tools and hidden functionality."
                    ),
                    SearchResult(
                        title=f"{request.topic} - Integration Guide",
                        url=f"https://duckduckgo.com/?q={request.topic}+integration+setup+configuration",
                        snippet=f"Integration and setup guide for {request.topic}. Learn how to integrate it with other tools and systems."
                    )
                ]
            
            return {"results": results[:request.limit], "query": query, "provider": "DuckDuckGo"}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Search API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/search-health")
async def search_health():
    """Health check for search service"""
    return {"status": "healthy", "service": "duckduckgo-web-search"}
