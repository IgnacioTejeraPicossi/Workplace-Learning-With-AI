# n8n Webhook Setup for Hackathon Demo

## 🎯 Overview
This document explains how to configure n8n webhooks for the AI Compliance Agent and AI Productivity Agent modules.

## 🔧 Step-by-Step Setup

### 1. Access n8n Interface
- Open your browser and go to: `http://localhost:5678`
- You should see the n8n interface

### 2. Create Compliance Agent Webhook

#### 2.1 Create New Workflow
- Click "New Workflow" button
- Name it: `Compliance Agent Webhook`

#### 2.2 Add Webhook Node
- Drag and drop a "Webhook" node from the nodes panel
- Configure the webhook:
  - **HTTP Method**: POST
  - **Path**: `compliance-agent`
  - **Response Mode**: "On Received"
  - **Response Code**: 200

#### 2.3 Add Response Node
- Drag and drop a "Respond to Webhook" node
- Connect it to the webhook node
- Configure the response:
  - **Response Code**: 200
  - **Response Body**: 
    ```json
    {
      "status": "success",
      "message": "Compliance agent webhook received",
      "timestamp": "{{ $now }}"
    }
    ```

#### 2.4 Activate Workflow
- Click the "Active" toggle in the top-right corner
- The webhook URL will be: `http://localhost:5678/webhook/compliance-agent`

### 3. Create Productivity Agent Webhook

#### 3.1 Create New Workflow
- Click "New Workflow" button
- Name it: `Productivity Agent Webhook`

#### 3.2 Add Webhook Node
- Drag and drop a "Webhook" node
- Configure the webhook:
  - **HTTP Method**: POST
  - **Path**: `productivity-agent`
  - **Response Mode**: "On Received"
  - **Response Code**: 200

#### 3.3 Add Response Node
- Drag and drop a "Respond to Webhook" node
- Connect it to the webhook node
- Configure the response:
  - **Response Code**: 200
  - **Response Body**: 
    ```json
    {
      "status": "success",
      "message": "Productivity agent webhook received",
      "timestamp": "{{ $now }}"
    }
    ```

#### 3.4 Activate Workflow
- Click the "Active" toggle in the top-right corner
- The webhook URL will be: `http://localhost:5678/webhook/productivity-agent`

## 🧪 Testing the Webhooks

### Test Compliance Webhook
```bash
curl -X POST "http://localhost:5678/webhook/compliance-agent" \
  -H "Content-Type: application/json" \
  -d '{"test": "compliance-webhook-test"}'
```

### Test Productivity Webhook
```bash
curl -X POST "http://localhost:5678/webhook/productivity-agent" \
  -H "Content-Type: application/json" \
  -d '{"test": "productivity-webhook-test"}'
```

## 📋 Expected Response
Both webhooks should return:
```json
{
  "status": "success",
  "message": "Agent webhook received",
  "timestamp": "2024-01-XX..."
}
```

## 🔗 Integration with Application
Once webhooks are configured, update your `.env` file:
```env
OUTSYSTEMS_COMPLIANCE_URL=http://localhost:5678/webhook/compliance-agent
OUTSYSTEMS_PRODUCTIVITY_URL=http://localhost:5678/webhook/productivity-agent
AGENTOPS_HMAC_SECRET=hackathon-secret-key-2024
OUTSYSTEMS_CALLBACK_URL=http://localhost:8000/api/agent-runs/callback
```

## 🚀 Next Steps
1. Configure the webhooks in n8n interface
2. Test the webhooks with curl commands
3. Update .env file with new URLs
4. Test the full integration in the application
