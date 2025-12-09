#!/usr/bin/env python3
"""
Simple HTTP server to serve J-melding files for MCP testing.
Usage:
    python backend/test_mcp_server.py
    
Then access files at: http://localhost:8888/j-melding.docx
"""
import http.server
import socketserver
import os
from pathlib import Path

PORT = 8888

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from project root
        root_dir = Path(__file__).parent.parent
        super().__init__(*args, directory=str(root_dir), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"✅ Test file server running on http://localhost:{PORT}")
        print(f"📁 Serving files from: {Path(__file__).parent.parent}")
        print(f"\n📝 To test MCP endpoint:")
        print(f"   curl -X POST http://localhost:8000/api/mcp/j-messages/analyze \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"file_url\": \"http://localhost:{PORT}/path/to/j-melding.docx\"}}'")
        print(f"\n⚠️  Press Ctrl+C to stop the server\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

