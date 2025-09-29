# 🤖 AI Agent Bridge Platform - Configuration Guide

## 📋 Environment Variables

Add these variables to your `.env` file in the root directory:

```env
# AI Agent Bridge Platform Configuration
AGENTOPS_HMAC_SECRET=change-me-in-production
OUTSYSTEMS_CALLBACK_URL=http://localhost:8000/api/agent-runs/callback

# Per-module destinations (you may also keep them in UI form state)
OUTSYSTEMS_COMPLIANCE_URL=https://your-outsystems-tenant.com/agents/compliance/execute
OUTSYSTEMS_PRODUCTIVITY_URL=https://your-outsystems-tenant.com/agents/productivity/execute

# Optional n8n (if used)
N8N_WEBHOOK_COMPLIANCE=http://localhost:5678/webhook/agent-compliance
N8N_WEBHOOK_PRODUCTIVITY=http://localhost:5678/webhook/agent-productivity
```

## 🚀 Quick Setup

1. **Create `.env` file** in the root directory if it doesn't exist
2. **Add the variables above** to your `.env` file
3. **Update URLs** with your actual OutSystems tenant URLs
4. **Restart the backend** to load the new variables

## 🔧 OutSystems Integration

### For Development/Demo:
- Set `OUTSYSTEMS_COMPLIANCE_URL` and `OUTSYSTEMS_PRODUCTIVITY_URL` to your OutSystems agent endpoints
- The platform will send HMAC-signed requests to these endpoints
- OutSystems agents should POST status updates to `OUTSYSTEMS_CALLBACK_URL`

### For Production:
- Change `AGENTOPS_HMAC_SECRET` to a secure random string
- Use HTTPS URLs for all OutSystems endpoints
- Set `COOKIE_SECURE=true` in your `.env`

## 📊 MongoDB Collections

The platform uses the `agent_runs` collection in your MongoDB database:

```javascript
// Example document structure
{
  "run_id": "comp-1695827390",
  "module": "compliance",
  "topic": "[Compliance] GDPR 2025",
  "status": "DONE",
  "created_at": "2025-09-23T12:00:00Z",
  "updated_at": "2025-09-23T12:05:00Z",
  "artifacts": {
    "jira": ["COMP-123"],
    "slack": "ts-987654321",
    "sheets": "https://docs.google.com/..."
  },
  "error": null
}
```

## 🧪 Testing

1. **Start backend**: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
2. **Test endpoints**:
   - `GET /api/agent-runs` - List all runs
   - `POST /api/compliance/dispatch` - Dispatch compliance action
   - `POST /api/productivity/dispatch` - Dispatch productivity action
3. **Check AgentOps Studio** for run status and artifacts

## 🔐 Security

- All requests to OutSystems are signed with HMAC-SHA256
- Use the `AGENTOPS_HMAC_SECRET` to verify incoming callbacks
- Store sensitive data (API keys, secrets) in environment variables only
