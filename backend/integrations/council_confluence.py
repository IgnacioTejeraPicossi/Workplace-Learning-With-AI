"""
Council Agent Confluence Integration
Publish Council Briefs to Confluence pages
"""

import os
import base64
import httpx

CONFLUENCE_BASE_URL = os.getenv("CONFLUENCE_BASE_URL", "https://atlassian.example.com/wiki")
CONFLUENCE_USER = os.getenv("CONFLUENCE_USER", "user")
CONFLUENCE_TOKEN = os.getenv("CONFLUENCE_TOKEN", "token")

HEADERS = {
    "Authorization": "Basic " + base64.b64encode(f"{CONFLUENCE_USER}:{CONFLUENCE_TOKEN}".encode()).decode(),
    "Content-Type": "application/json"
}

async def publish(payload: dict) -> str:
    """Publish Council Brief to Confluence"""
    if not CONFLUENCE_TOKEN or CONFLUENCE_TOKEN == "token":
        # Return a mock response when Confluence is not configured
        return "confluence:disabled"
    
    space = payload.get("space", "SEC")
    title = payload.get("title", "Council Brief")
    body_storage = payload.get("body_storage", "<p>Council Brief</p>")
    
    # Convert markdown to Confluence storage format
    confluence_body = convert_markdown_to_confluence(body_storage)
    
    page_data = {
        "type": "page",
        "title": title,
        "space": {"key": space},
        "body": {
            "storage": {
                "value": confluence_body,
                "representation": "storage"
            }
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CONFLUENCE_BASE_URL}/rest/api/content",
            headers=HEADERS,
            json=page_data
        )
        response.raise_for_status()
        data = response.json()
        
        return data.get("id", "page")

def convert_markdown_to_confluence(markdown: str) -> str:
    """Convert markdown to Confluence storage format"""
    # Simple markdown to Confluence conversion
    confluence = markdown
    
    # Headers
    confluence = confluence.replace("## ", "<h2>").replace("\n", "</h2>\n")
    confluence = confluence.replace("### ", "<h3>").replace("\n", "</h3>\n")
    
    # Bold
    confluence = confluence.replace("**", "<strong>").replace("**", "</strong>")
    
    # Lists
    confluence = confluence.replace("- ", "<li>").replace("\n", "</li>\n")
    
    # Code blocks
    confluence = confluence.replace("```", "<pre>").replace("```", "</pre>")
    
    # Line breaks
    confluence = confluence.replace("\n\n", "<p></p>")
    
    return confluence
