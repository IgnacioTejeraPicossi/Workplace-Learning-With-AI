# Postman MCP Testing Guide - WLWAI MCP Server

This guide explains how to use Postman's MCP testing capabilities to test the WLWAI MCP Server (J-messages Analyzer).

## Overview

Postman has built-in support for Model Context Protocol (MCP) servers, allowing you to:
- ✅ Test MCP servers directly via STDIO
- ✅ View available tools, prompts, and resources
- ✅ Send requests and view responses in a familiar interface
- ✅ Create test collections for automated testing
- ✅ Debug MCP protocol messages

## Prerequisites

1. **Postman Desktop** (latest version with MCP support)
2. **WLWAI backend running** on `http://localhost:8000`
3. **Python 3.8+** (for bridge server)
4. **httpx library**: `pip install httpx`

## Quick Start

### Step 1: Verify Bridge Server

Ensure the bridge server is ready:
```bash
# Test bridge server manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python backend/mcp_bridge_server.py
```

You should see a JSON-RPC response with available tools.

### Step 2: Create MCP Request in Postman

1. **Open Postman Desktop**
2. **Create a new collection** (optional, but recommended):
   - Click "Collections" in the left sidebar
   - Click "New" → "Collection"
   - Name it: `WLWAI MCP Server Tests`

3. **Create a new MCP request**:
   - Click "New" → "Request"
   - Or right-click your collection → "Add Request"
   - Name it: `Test WLWAI J-messages MCP`

4. **Configure as MCP request**:
   - In the request type dropdown, select **"MCP"** (or look for "MCP Generator" option)
   - You should see options for "STDIO" connection

### Step 2.5: Save the Request

After configuring and connecting, you'll need to save the request:

1. **Click "Save"** button (top right, or use Ctrl+S)
2. **In the "SAVE REQUEST" modal**:
   - **Request name**: Already filled with "Test WLWAI J-messages MCP" (you can change it)
   - **Select a collection**: 
     - **Option A**: Select existing collection "WLWAI MCP Server Tests" (if you created it)
     - **Option B**: Select "MCP Generator Postman" (if you want to keep it with other MCP examples)
     - **Option C**: Click "New Collection" to create a new one
   - **Add description** (optional): Click "Add description" to add notes
3. **Click "Save"** (orange button, bottom right)

**Recommendation**: Save it in the "WLWAI MCP Server Tests" collection to keep all your WLWAI tests organized together.

### Step 3: Configure STDIO Connection

In the MCP request configuration, you'll see a field labeled **"Enter command or paste JSON config"**.

**Option 1: Simple Command Format (Recommended)**

Enter the command directly in the format: `command path/to/script.py`

**Windows Example:**
```
python C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py
```

**macOS/Linux Example:**
```
python3 /absolute/path/to/your/project/backend/mcp_bridge_server.py
```

**Important Notes:**
- Use **forward slashes** `/` even on Windows, or escape backslashes `\\`
- Use **absolute paths** (full path from root)
- If Python is not in PATH, use full path: `C:/Python39/python.exe C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py`

**Option 2: JSON Config Format (Alternative)**

If Postman requires JSON format, use:
```json
{
  "command": "python",
  "args": [
    "C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py"
  ],
  "env": {}
}
```

**For Windows with full Python path:**
```json
{
  "command": "C:/Python39/python.exe",
  "args": [
    "C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py"
  ],
  "env": {}
}
```

**For macOS/Linux:**
```json
{
  "command": "python3",
  "args": [
    "/absolute/path/to/your/project/backend/mcp_bridge_server.py"
  ],
  "env": {}
}
```

### Step 4: Connect to MCP Server

1. Click the **"Run"** button (or "Connect" if available)
2. Postman will start the bridge server process and connect via STDIO
3. You should see a **"Connected"** status with a green indicator

### Step 5: Explore Available Tools

Once connected, Postman should display:

- **Tools Tab**: Lists all available MCP tools
  - `analyze_j_melding` - Analyze a J-melding document
  - `list_j_meldinger` - List all analyzed J-meldinger

- **Prompts Tab**: (if your server supports prompts)
- **Resources Tab**: (if your server supports resources)

## Testing Tools

### Test 1: List Available Tools

1. In the **"Tools"** tab, you should see:
   - `analyze_j_melding`
   - `list_j_meldinger`

2. Click on a tool to see its:
   - Description
   - Input schema (parameters)
   - Example usage

### Test 2: Call `list_j_meldinger`

1. Select the **`list_j_meldinger`** tool
2. Configure parameters (all optional):
   ```json
   {
     "status": "Gjeldende",
     "category": "Pelagisk fisk",
     "search": "sild"
   }
   ```
3. Click **"Send"** or **"Run"**
4. View the response in the **"Response"** tab

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"items\": [...], \"total\": 5}"
      }
    ]
  }
}
```

### Test 3: Call `analyze_j_melding`

1. **Start the test file server** (if not already running):
   ```bash
   python backend/test_mcp_server.py
   ```
   This serves files on `http://localhost:8888`

2. **Select the `analyze_j_melding` tool**

3. **Configure parameters**:
   ```json
   {
     "file_url": "http://localhost:8888/docs/j-melding-test.docx",
     "summary_length": "medium"
   }
   ```

4. **Click "Send"**

5. **View the response** - should contain:
   - `id`: J-melding ID
   - `title`: Full title
   - `status`: Status (e.g., "Gjeldende")
   - `valid_from`, `valid_to`: Date ranges
   - `categories`: Array of categories
   - `toc`: Table of contents
   - `body_html`: HTML body content
   - `summary`: AI-generated summary (if requested)

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\": \"J-195-2025\", \"title\": \"...\", \"status\": \"Gjeldende\", ...}"
      }
    ]
  }
}
```

## Creating Test Collections

### Collection Structure

Create a collection with multiple test requests:

```
WLWAI MCP Server Tests
├── 1. Initialize Connection
├── 2. List Tools
├── 3. List J-meldinger (All)
├── 4. List J-meldinger (Filtered)
├── 5. Analyze J-melding (DOCX)
├── 6. Analyze J-melding (PDF)
└── 7. Analyze J-melding (With Summary)
```

### Test Scripts (Postman Tests)

You can add test scripts to validate responses:

**Example Test Script** (for `analyze_j_melding`):
```javascript
// Parse the response
const response = pm.response.json();

// Check JSON-RPC structure
pm.test("Response is valid JSON-RPC", function () {
    pm.expect(response).to.have.property('jsonrpc', '2.0');
    pm.expect(response).to.have.property('id');
    pm.expect(response).to.have.property('result');
});

// Check result content
if (response.result && response.result.content) {
    const content = JSON.parse(response.result.content[0].text);
    
    pm.test("J-melding has ID", function () {
        pm.expect(content).to.have.property('id');
    });
    
    pm.test("J-melding has title", function () {
        pm.expect(content).to.have.property('title');
    });
    
    pm.test("J-melding has TOC", function () {
        pm.expect(content).to.have.property('toc');
        pm.expect(content.toc).to.be.an('array');
    });
}
```

## Troubleshooting

### "Connection Failed" or "Process Not Found"

1. **Check Python path**:
   - Use full path to Python: `C:/Python39/python.exe`
   - Or ensure Python is in system PATH

2. **Check bridge server path**:
   - Use absolute path
   - Use forward slashes `/` on Windows
   - Verify file exists

3. **Check backend is running**:
   ```bash
   curl http://localhost:8000/api/mcp/manifest
   ```

### "No Tools Available"

1. **Check bridge server logs** (if available in Postman console)
2. **Test bridge server manually**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python backend/mcp_bridge_server.py
   ```
3. **Verify backend manifest endpoint**:
   ```bash
   curl http://localhost:8000/api/mcp/manifest
   ```

### "Timeout" Errors

1. **Increase timeout** in Postman request settings
2. **Check backend is responsive**:
   ```bash
   curl http://localhost:8000/api/mcp/manifest
   ```
3. **Check file server** (for `analyze_j_melding`):
   ```bash
   curl http://localhost:8888/docs/j-melding-test.docx
   ```

### Tools Not Appearing

1. **Restart Postman** after configuring MCP request
2. **Check connection status** - should show "Connected"
3. **Verify bridge server starts correctly** - check for Python errors

## Advantages of Using Postman for MCP Testing

### 1. **Visual Interface**
- See all available tools in one place
- Easy parameter configuration
- Clear response visualization

### 2. **Test Automation**
- Create test collections
- Run automated test suites
- Validate responses with test scripts

### 3. **Debugging**
- View raw MCP protocol messages
- Inspect request/response flow
- Identify issues quickly

### 4. **Documentation**
- Document API usage
- Share test collections with team
- Create examples for integration

### 5. **Integration Testing**
- Test before deploying to production
- Validate changes don't break existing functionality
- Compare responses across versions

## Example Test Scenarios

### Scenario 1: Complete Analysis Workflow

1. **List all J-meldinger** → Verify library is accessible
2. **Filter by status** → Test filtering functionality
3. **Analyze new document** → Test analysis endpoint
4. **List again** → Verify new document appears

### Scenario 2: Error Handling

1. **Invalid file URL** → Should return error
2. **Missing required parameter** → Should return validation error
3. **Non-existent file** → Should handle gracefully

### Scenario 3: Performance Testing

1. **Large document analysis** → Measure response time
2. **Multiple concurrent requests** → Test server stability
3. **Long-running operations** → Verify timeout handling

## Best Practices

1. **Organize Tests**: Create separate collections for different test scenarios
2. **Use Variables**: Store common values (base URL, file paths) in environment variables
3. **Add Assertions**: Write test scripts to validate responses automatically
4. **Document Tests**: Add descriptions to explain what each test does
5. **Version Control**: Export collections and commit to Git

## Next Steps

Once you've set up Postman testing:

1. ✅ Create comprehensive test collections
2. ✅ Add automated test scripts
3. ✅ Integrate into CI/CD pipeline (if using Postman CLI)
4. ✅ Share collections with team
5. ✅ Use for regression testing before releases

---

## Comparison: Postman vs Other Testing Methods

| Method | Pros | Cons |
|--------|------|------|
| **Postman** | Visual interface, test automation, easy debugging | Requires Postman Desktop |
| **cURL** | Simple, scriptable, no dependencies | Command-line only, manual testing |
| **Claude Desktop** | Real-world usage, natural language testing | Less structured, harder to automate |
| **Python Scripts** | Full control, easy automation | Requires coding, less visual |

**Recommendation**: Use **Postman** for development and testing, **Claude Desktop** for real-world usage validation.

