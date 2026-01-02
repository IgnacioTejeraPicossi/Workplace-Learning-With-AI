#!/usr/bin/env python3
"""
MCP Bridge Server for Claude Desktop
Bridges HTTP REST API to MCP protocol (stdio)

This script allows Claude Desktop to connect to our HTTP-based MCP server
by translating MCP protocol messages (JSON-RPC over stdio) to HTTP requests.
"""
import sys
import json
import httpx
import asyncio
from typing import Any, Dict, Optional

# Base URL of the WLWAI backend
MCP_BASE_URL = "http://localhost:8000"

async def handle_mcp_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle MCP protocol requests and forward to HTTP API"""
    method = request.get("method")
    params = request.get("params", {})
    request_id = request.get("id")
    
    try:
        if method == "initialize":
            # MCP initialization
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "wlwai-j-messages-mcp",
                        "version": "1.0.0"
                    }
                }
            }
        
        elif method == "tools/list":
            # Fetch manifest from HTTP API and return tools
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{MCP_BASE_URL}/api/mcp/manifest")
                manifest = resp.json()
                
                # Extract tools from j-messages manifest
                j_messages_manifest = None
                for server in manifest.get("servers", []):
                    if server.get("id") == "j-messages":
                        j_messages_manifest = server.get("manifest")
                        break
                
                if j_messages_manifest:
                    tools = j_messages_manifest.get("tools", [])
                    return {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "tools": [
                                {
                                    "name": tool["name"],
                                    "description": tool["description"],
                                    "inputSchema": tool["input_schema"]
                                }
                                for tool in tools
                            ]
                        }
                    }
                else:
                    return {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {"tools": []}
                    }
        
        elif method == "tools/call":
            # Call tool via HTTP API
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            # Map tool calls to HTTP endpoints
            if tool_name == "analyze_j_melding":
                # Extended timeout for LM Studio analysis (420s = 7 minutes)
                async with httpx.AsyncClient(timeout=420.0) as client:
                    resp = await client.post(
                        f"{MCP_BASE_URL}/api/mcp/j-messages/analyze",
                        json=arguments,
                        headers={"Content-Type": "application/json"}
                    )
                    resp.raise_for_status()
                    result = resp.json()
                    return {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result, indent=2, ensure_ascii=False)
                                }
                            ]
                        }
                    }
            
            elif tool_name == "list_j_meldinger":
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # Convert arguments to query parameters
                    query_params = {k: v for k, v in arguments.items() if v is not None}
                    resp = await client.get(
                        f"{MCP_BASE_URL}/api/j-messages/list",
                        params=query_params
                    )
                    resp.raise_for_status()
                    result = resp.json()
                    return {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result, indent=2, ensure_ascii=False)
                                }
                            ]
                        }
                    }
            
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32601,
                        "message": f"Unknown tool: {tool_name}"
                    }
                }
        
        elif method == "ping":
            # Health check
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {}
            }
        
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }
    
    except httpx.RequestError as e:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": -32603,
                "message": f"Connection error: {str(e)}"
            }
        }
    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": -32603,
                "message": f"Internal error: {str(e)}"
            }
        }

async def main():
    """Main MCP server loop (stdio)"""
    # Read requests from stdin and write responses to stdout
    for line in sys.stdin:
        if not line.strip():
            continue
        
        try:
            request = json.loads(line.strip())
            response = await handle_mcp_request(request)
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32700,
                    "message": f"Parse error: {str(e)}"
                }
            }
            print(json.dumps(error_response), flush=True)
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())

