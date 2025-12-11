# Claude Desktop Setup - WLWAI MCP Server

This guide explains how to connect the WLWAI MCP Server (J-messages Analyzer) to Claude Desktop.

**✅ Works with Free Plan**: The bridge server method described below works with **all Claude Desktop plans, including the free plan**. You don't need a paid subscription.

## Prerequisites

1. **Claude Desktop installed** (latest version)
2. **WLWAI backend running** on `http://localhost:8000`
3. **Python 3.8+** (for bridge server)
4. **httpx library**: `pip install httpx`

---

## Quick Start (Bridge Server Method)

### Step 1: Install Dependencies

```bash
pip install httpx
```

### Step 2: Locate Claude Desktop Config File

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

Or navigate to:
```
C:\Users\YourUsername\AppData\Roaming\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Step 3: Create/Edit Config File

**If the file doesn't exist**, create it. **If it exists**, add the `mcpServers` section.

**Windows Example (adjust path to your project):**
```json
{
  "mcpServers": {
    "wlwai-j-messages": {
      "command": "python",
      "args": [
        "C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py"
      ],
      "env": {}
    }
  }
}
```

**macOS/Linux Example:**
```json
{
  "mcpServers": {
    "wlwai-j-messages": {
      "command": "python3",
      "args": [
        "/absolute/path/to/your/project/backend/mcp_bridge_server.py"
      ],
      "env": {}
    }
  }
}
```

**Important Notes:**
- Replace the path with your **actual project path**
- Use **forward slashes** `/` even on Windows, or escape backslashes `\\`
- Use **absolute paths** (full path from root)
- If Python is not in PATH, use full path: `"C:/Python39/python.exe"` instead of `"python"`

### Step 4: Verify Backend is Running

```bash
# Test manifest endpoint
curl http://localhost:8000/api/mcp/manifest
```

You should see JSON with server manifests.

### Step 5: Restart Claude Desktop

**⚠️ IMPORTANT**: After adding/changing the config file:
1. **Completely close** Claude Desktop (not just minimize)
2. **Wait a few seconds**
3. **Restart** Claude Desktop
4. Changes only take effect after a full restart

### Step 6: Test in Claude Chat

Once connected, you can ask Claude:

**Example 1: Analyze a J-melding**
```
"Can you analyze this J-melding file: http://localhost:8888/docs/j-melding-test.docx"
```

**Example 2: List J-meldinger**
```
"List all J-meldinger with status 'Gjeldende'"
```

**Example 3: Search J-meldinger**
```
"Search for J-meldinger about 'sild' (herring)"
```

Claude will automatically use the `analyze_j_melding` or `list_j_meldinger` tools when appropriate.

---

## How It Works

The bridge server (`backend/mcp_bridge_server.py`):
1. **Listens on stdio** for MCP protocol messages from Claude Desktop
2. **Translates MCP requests** to HTTP requests to our backend (`http://localhost:8000`)
3. **Converts HTTP responses** back to MCP protocol format
4. **Handles tool discovery** by fetching the manifest from `/api/mcp/manifest`

This allows Claude Desktop to use our HTTP-based MCP server as if it were a native MCP server.

---

## Troubleshooting

### Claude Desktop doesn't see the tools

1. **Check backend is running**: 
   ```bash
   curl http://localhost:8000/api/mcp/manifest
   ```

2. **Check config file syntax**: 
   - Ensure valid JSON (use a JSON validator)
   - Check for trailing commas
   - Ensure paths are correct

3. **Test bridge server manually**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python backend/mcp_bridge_server.py
   ```
   You should see a JSON-RPC response.

4. **Check Claude Desktop logs**:
   - Windows: `%APPDATA%\Claude\logs\`
   - macOS: `~/Library/Logs/Claude/`
   - Look for MCP connection errors

5. **Restart Claude Desktop**: Full restart required after config changes

### Connection refused errors

- Ensure backend is running on `http://localhost:8000`
- Check firewall settings
- Verify the URL in `mcp_bridge_server.py` matches your backend URL

### "Python not found" errors

- Use full path to Python executable in config:
  ```json
  "command": "C:/Python39/python.exe"
  ```
- Or ensure Python is in your system PATH

### Tools not appearing in Claude

- Verify you have the latest Claude Desktop version
- Check that the manifest endpoint returns valid JSON
- Ensure tool names match exactly: `analyze_j_melding`, `list_j_meldinger`
- Try asking Claude directly: "What tools do you have available?"

### Bridge server errors

- Check Python version: `python --version` (needs 3.8+)
- Install httpx: `pip install httpx`
- Check file permissions on `mcp_bridge_server.py`

---

## Alternative: Direct HTTP Connector (If Available)

Some Claude Desktop versions support direct HTTP connectors through the UI (as seen in the Enonic demo with "Free plan"):

1. Open Claude Desktop
2. Click the settings icon below the chat input (or go to **Settings** → **Connectors**)
3. Look for **"Add connectors"** or **"Manage connectors"**
4. If available, you can add:
   - **Name**: `WLWAI J-messages Analyzer` or `wlwai-j-messages`
   - **Base URL**: `http://localhost:8000`
   - **Manifest**: `/api/mcp/manifest`

**Note**: 
- This feature may vary by Claude Desktop version
- The **bridge server method (recommended above) works with all versions and all plans**, including the free plan
- If you see "Add connectors PRO" in the menu, that's for premium connectors, but the bridge server method still works for free users
- As shown in the Enonic demo, MCP servers can work with the free plan

---

## Next Steps

Once connected, you can:
- ✅ Ask Claude to analyze J-meldinger documents
- ✅ Search and filter J-meldinger from Claude's chat
- ✅ Use Claude's reasoning to work with J-melding data
- ✅ Combine J-melding analysis with other Claude capabilities
- ✅ Get natural language explanations of J-melding regulations

---

## Example Conversations

**Analyzing a document:**
```
User: "Analyze this J-melding: http://localhost:8888/docs/j-195-2025.docx"
Claude: [Uses analyze_j_melding tool] "I've analyzed the J-melding. Here's what I found: [metadata, TOC, summary]"
```

**Searching the library:**
```
User: "Show me all J-meldinger about herring fishing"
Claude: [Uses list_j_meldinger tool with search="sild"] "I found 3 J-meldinger about herring..."
```

**Getting insights:**
```
User: "What are the main categories of J-meldinger in the library?"
Claude: [Uses list_j_meldinger tool, analyzes results] "The main categories are: Pelagisk fisk, Sør for 62° N, Fiskeriregulering..."
```
