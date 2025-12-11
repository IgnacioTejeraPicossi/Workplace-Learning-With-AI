# MCP PowerShell Examples - J-messages Analyzer

## Example 1: Using Saved API Configuration (Recommended)

This example uses the API configuration you saved in the "API Config" module. **No headers needed!**

```powershell
# Prepare the request body
$body = @{
    file_url = "http://localhost:8888/docs/j-melding-test.docx"
    summary_length = "medium"
} | ConvertTo-Json

# Make the request WITHOUT headers - will use saved config
Invoke-RestMethod -Uri "http://localhost:8000/api/mcp/j-messages/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**What happens:**
- MCP Server reads your saved configuration from `api_config.json`
- Uses the provider you selected in "API Config" (ItemAI, OpenRouter, or OpenAI)
- Uses the keys/URLs you saved

**Backend log will show:**
```
🟢 [MCP] Using API configuration from SAVED CONFIG FILE (api_config.json)
   → Provider: itemai
   → ItemAI URL: http://localhost:1234
```

---

## Example 2: Override with Request Headers

This example explicitly sets the API provider and key in the request headers. **This overrides your saved configuration.**

```powershell
# Prepare the request body
$body = @{
    file_url = "http://localhost:8888/docs/j-melding-test.docx"
    summary_length = "medium"
} | ConvertTo-Json

# Make the request WITH headers - will override saved config
Invoke-RestMethod -Uri "http://localhost:8000/api/mcp/j-messages/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{
        "x-api-provider" = "openai"
        "x-openai-key" = "sk-your-actual-key-here"
    } `
    -Body $body
```

**What happens:**
- MCP Server uses the headers you provided
- **Ignores** your saved configuration
- Uses OpenAI even if you saved ItemAI in "API Config"

**Backend log will show:**
```
🔵 [MCP] Using API configuration from REQUEST HEADERS (overrides saved config)
   → Provider: openai
   → OpenAI key: sk-your-act... (valid)
```

---

## Example 3: Using ItemAI with Custom URL

If you want to use ItemAI but with a different URL than saved:

```powershell
$body = @{
    file_url = "http://localhost:8888/docs/j-melding-test.docx"
    summary_length = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/mcp/j-messages/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{
        "x-api-provider" = "itemai"
        "x-itemai-url" = "http://localhost:1234"
    } `
    -Body $body
```

---

## Example 4: Using OpenRouter

```powershell
$body = @{
    file_url = "http://localhost:8888/docs/j-melding-test.docx"
    summary_length = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/mcp/j-messages/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{
        "x-api-provider" = "openrouter"
        "x-openrouter-key" = "sk-or-v1-your-key-here"
    } `
    -Body $body
```

---

## Configuration Priority

The MCP Server uses configuration in this order:

1. **Request Headers** (if provided) ← Highest priority
2. **Saved Config File** (`api_config.json`) ← What you saved in "API Config"
3. **Environment Variables** (`.env` file) ← Fallback

## Tips

- **For testing**: Use Example 1 (no headers) to test your saved configuration
- **For production**: Use Example 1 (no headers) for consistency
- **For debugging**: Use Example 2 (with headers) to override and test specific providers
- **Check logs**: The backend will clearly show which configuration source is being used

