# 🚀 AgentOps Studio - n8n Integration Guide

## 📋 Prerequisites

1. **Docker Desktop** - Download from: https://www.docker.com/products/docker-desktop/
2. **LM Studio** - Already installed and running ✅
3. **AgentOps Studio** - Already functional ✅

## 🛠️ Installation Steps

### Step 1: Install Docker Desktop
1. Download Docker Desktop from the official website
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

### Step 2: Start n8n
```powershell
# Navigate to the agentops-n8n directory
cd agentops-n8n

# Run the startup script
.\start-n8n.ps1
```

### Step 3: Configure n8n
1. Open http://localhost:5678 in your browser
2. Complete the initial setup (create admin user)
3. Import the workflows:
   - Go to **Workflows** → **Import from file**
   - Import `web-research-workflow.json`
   - Import `software-planning-workflow.json`

### Step 4: Get Webhook URLs
1. Open each imported workflow
2. Click on the **Webhook** node
3. Copy the **Production URL** (not the Test URL)
4. Note the webhook paths:
   - Web Research: `/webhook/agentops-web-research-ext`
   - Software Planning: `/webhook/agentops-software-planning`

### Step 5: Register Flows in AgentOps Studio
1. Open AgentOps Studio → **Flow Catalog**
2. Click **"+ Register New Flow"**
3. Register each workflow:
   - **Name**: "Web Research Agent"
   - **n8n Webhook URL**: `http://localhost:5678/webhook/agentops-web-research-ext`
   - **Description**: "Web research → extract → LM Studio report"

   - **Name**: "Software Planning Agent"
   - **n8n Webhook URL**: `http://localhost:5678/webhook/agentops-software-planning`
   - **Description**: "Plan → Safety → Sim → Judge (software)"

### Step 6: Test Integration
1. Go to **Playbook Designer**
2. Create a new playbook with actions
3. Select a flow from the dropdown
4. Click **"Execute via AgentOps"**
5. Check **Runs Monitor** for results

## 🔧 Configuration Details

### Environment Variables
- **AGENTOPS_HMAC_SECRET**: `agentops-hmac-secret-2025`
- **LM_STUDIO_BASE_URL**: `http://localhost:1234/v1/chat/completions`
- **N8N_WEBHOOK_BASE_URL**: `http://localhost:5678/webhook`

### Ports
- **n8n**: http://localhost:5678
- **LM Studio**: http://localhost:1234
- **AgentOps Studio**: http://localhost:8000

## 🧪 Testing

### Quick Test
```bash
# Test webhook connectivity
curl -X POST "http://localhost:5678/webhook/agentops-web-research-ext" \
  -H "Content-Type: application/json" \
  -d '{"run_id":"test123","input":{"url":"https://www.example.com","topic":"AI","lm_base":"http://localhost:1234/v1/chat/completions","callback_url":"http://localhost:8000/api/runs/callback/DUMMY"}}'
```

### Full Integration Test
1. Use AgentOps Studio → Playbook Designer
2. Create a playbook with web research actions
3. Execute via AgentOps with registered flow
4. Monitor results in Runs Monitor

## 🚨 Troubleshooting

### Common Issues
1. **Docker not running**: Start Docker Desktop
2. **Port conflicts**: Change port in docker-compose.yml
3. **Webhook not responding**: Check n8n logs
4. **LM Studio not responding**: Verify LM Studio is running
5. **Callback failures**: Check AGENTOPS_HMAC_SECRET matches

### Logs
```bash
# n8n logs
docker compose logs

# AgentOps Studio logs
# Check backend terminal output
```

## 📚 Workflow Details

### Web Research Workflow
- **Input**: URL, topic, LM Studio base URL
- **Process**: Fetch → Extract → LM Studio → Report
- **Output**: Structured report with insights

### Software Planning Workflow
- **Input**: Topic, context, LM Studio base URL
- **Process**: Plan → Safety → Simulate → Judge
- **Output**: Comprehensive software development plan

## 🎯 Next Steps

1. **Customize workflows** for your specific needs
2. **Add more integrations** (Slack, Google Sheets, etc.)
3. **Create additional workflows** for different use cases
4. **Monitor and optimize** performance

## 📞 Support

If you encounter issues:
1. Check the logs
2. Verify all services are running
3. Test individual components
4. Check environment variables
5. Contact support with specific error messages
