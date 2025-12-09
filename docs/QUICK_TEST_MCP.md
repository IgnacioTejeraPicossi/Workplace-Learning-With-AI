# Quick Test Guide - MCP J-messages Analyzer

## ✅ Server Status
Your test server is running at `http://localhost:8888` ✓

## 📄 Step 1: Place Your J-melding File

You need a `.docx` or `.pdf` J-melding file. Options:

### Option A: Use an Existing J-melding
If you have a J-melding file, place it in the project:
- Recommended location: `docs/j-melding-test.docx` or `docs/j-melding-test.pdf`
- Or anywhere in the project root

### Option B: Download from Fiskeridirektoratet
1. Go to Fiskeridirektoratet's website
2. Download a J-melding document
3. Save it as `docs/j-melding-test.docx` (or `.pdf`)

### Option C: Use a Test PDF (if you have one)
If you have any PDF in the project, you can test with it:
- Check: `static/Workplace-Learning-With-AI_documentation.pdf`
- Or: `Defendable-Red-Team.pdf`

## 🧪 Step 2: Test the MCP Endpoint

Once you have a file, test with:

### PowerShell (Windows):
```powershell
# Replace the file path with your actual file location
$body = @{
    file_url = "http://localhost:8888/docs/j-melding-test.docx"
    summary_length = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/mcp/j-messages/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{
        "x-api-provider" = "openai"
        "x-openai-key" = "tu-api-key-aqui"
    } `
    -Body $body
```

### cURL (if available):
```bash
curl -X POST http://localhost:8000/api/mcp/j-messages/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-provider: openai" \
  -H "x-openai-key: tu-api-key" \
  -d '{
    "file_url": "http://localhost:8888/docs/j-melding-test.docx",
    "summary_length": "medium"
  }'
```

### From Browser Console:
```javascript
fetch('http://localhost:8000/api/mcp/j-messages/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-provider': 'openai',
    'x-openai-key': 'tu-api-key'
  },
  body: JSON.stringify({
    file_url: 'http://localhost:8888/docs/j-melding-test.docx',
    summary_length: 'medium'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 🔍 Step 3: Verify File is Accessible

Before testing, verify the file is accessible:
1. Open browser: `http://localhost:8888/docs/`
2. You should see the file listed
3. Click on it to download (confirms it's accessible)

## ⚠️ Important Notes

1. **Backend must be running**: Make sure your main backend is running at `http://localhost:8000`
2. **File path**: The URL path must match the file location relative to project root
3. **API Key**: Replace `tu-api-key` with your actual OpenAI API key
4. **File format**: Supports both `.docx` and `.pdf`

## 🐛 Troubleshooting

### "Failed to download file from URL"
- Check the file exists at that path
- Verify the server is running: `http://localhost:8888/docs/`
- Try accessing the file directly in browser

### "404 File not found"
- Check the file path is correct
- File must be in a folder accessible from project root
- Case-sensitive on some systems

### "Analyzer API failed"
- Make sure main backend is running (`http://localhost:8000`)
- Check API key is correct
- Review backend logs for details

