# MCP Testing Guide for J-messages Analyzer

This guide explains how to test the MCP endpoint `analyze_j_melding` with a real J-melding from an accessible URL.

## Option 1: Local HTTP Server (Recommended for Development)

### Step 1: Place your J-melding file
Place your `.docx` or `.pdf` file in the project root or in an accessible folder.

### Step 2: Start the test server
```bash
# From the project root
python backend/test_mcp_server.py
```

The server will be available at `http://localhost:8888`

### Step 3: Test the MCP endpoint
```bash
# Example: if your file is in docs/j-melding-195-2025.docx
curl -X POST http://localhost:8000/api/mcp/j-messages/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-provider: openai" \
  -H "x-openai-key: your-api-key" \
  -d '{
    "file_url": "http://localhost:8888/docs/j-melding-195-2025.docx",
    "summary_length": "medium"
  }'
```

## Option 2: Use a Temporary Hosting Service

### A) GitHub Gists (for small files)
1. Upload your `.docx` to GitHub Gist
2. Get the direct link: `https://gist.githubusercontent.com/user/gist-id/raw/filename.docx`
3. Use that URL in the MCP endpoint

### B) Google Drive (with direct link)
1. Upload the file to Google Drive
2. Share with "Anyone with the link"
3. Get the file ID from the URL
4. Use: `https://drive.google.com/uc?export=download&id=FILE_ID`

**Note**: Google Drive may require authentication, better to use another option.

### C) Dropbox (direct link)
1. Upload the file to Dropbox
2. Create a shared link
3. Replace `www.dropbox.com` with `dl.dropboxusercontent.com` in the URL
4. Use that URL

### D) File Sharing Services
- **Transfer.sh**: `curl --upload-file j-melding.docx https://transfer.sh/j-melding.docx`
- **0x0.st**: Similar to transfer.sh
- **File.io**: Temporary (deleted after download)

## Option 3: Use ngrok to Expose Locally

If you have the file on your local machine:

```bash
# 1. Install ngrok (if you don't have it)
# https://ngrok.com/download

# 2. Start a simple HTTP server
python -m http.server 8888

# 3. In another terminal, expose with ngrok
ngrok http 8888

# 4. Use the ngrok URL (e.g., https://abc123.ngrok.io/j-melding.docx)
curl -X POST http://localhost:8000/api/mcp/j-messages/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://abc123.ngrok.io/j-melding.docx"
  }'
```

## Option 4: Test from Frontend (UI)

You can create a simple interface in the frontend to test:

```javascript
// In the frontend, create a test component
const testMCPAnalyze = async (fileUrl) => {
  const response = await fetch('http://localhost:8000/api/mcp/j-messages/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-provider': localStorage.getItem('apiProvider') || 'openai',
      'x-openai-key': localStorage.getItem('openaiApiKey') || ''
    },
    body: JSON.stringify({
      file_url: fileUrl,
      summary_length: 'medium'
    })
  });
  
  const result = await response.json();
  console.log('MCP Analysis Result:', result);
  return result;
};

// Usage:
testMCPAnalyze('http://localhost:8888/docs/j-melding.docx');
```

## Result Verification

The endpoint should return a JSON with:
```json
{
  "id": "J-195-2025",
  "title": "Forskrift om...",
  "status": "Gjeldende",
  "valid_from": "2025-10-08",
  "valid_to": "2025-12-31",
  "replaces": "J-169-2025",
  "categories": ["Sør for 62° N", "Pelagisk fisk"],
  "toc": [...],
  "body_html": "<h1>...</h1>...",
  "summary": "..." // if summary_length != "none"
}
```

## Troubleshooting

### Error: "Failed to download file from URL"
- Verify that the URL is accessible from the backend
- Test the URL directly in the browser
- Make sure the file server is running

### Error: "Request timeout"
- The file may be too large
- Increase the timeout in `backend/routers/agentops/__init__.py` (currently 60 seconds)

### Error: "Analyzer API failed"
- Verify that the main backend is running at `http://localhost:8000`
- Check the backend logs for more details
- Make sure you have the correct API key configured

## Complete Example with cURL

```bash
# 1. Make sure the backend is running
# 2. Start the test server (in another terminal)
python backend/test_mcp_server.py

# 3. In another terminal, test the endpoint
curl -X POST http://localhost:8000/api/mcp/j-messages/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-provider: openai" \
  -H "x-openai-key: sk-..." \
  -d '{
    "file_url": "http://localhost:8888/docs/j-melding-195-2025.docx",
    "summary_length": "medium"
  }' | jq

# If you don't have jq, you can use python to format:
curl ... | python -m json.tool
```

## Next Steps

Once it works with local files, you can:
1. Upload files to a production server
2. Integrate with Enonic CMS using the MCP protocol
3. Configure authentication if needed for protected URLs
