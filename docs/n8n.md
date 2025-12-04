# n8n Webhook Setup

- Webhooks (default):
  - `N8N_COMPLIANCE_WEBHOOK` → http://localhost:5678/webhook/compliance-agent
  - `N8N_PRODUCTIVITY_WEBHOOK` → http://localhost:5678/webhook/productivity-agent
- Fallback: used automatically when `OUTSYSTEMS_*` is not set.

## Callback
- `CALLBACK_URL_DEFAULT` from `backend/config.py` → `${BACKEND_BASE_URL}/api/agent-runs/callback`
