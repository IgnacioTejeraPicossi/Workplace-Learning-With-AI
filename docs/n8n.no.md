# n8n Webhook-oppsett

- Webhooks (standard):
  - `N8N_COMPLIANCE_WEBHOOK` → http://localhost:5678/webhook/compliance-agent
  - `N8N_PRODUCTIVITY_WEBHOOK` → http://localhost:5678/webhook/productivity-agent
- Reserveløsning: brukes automatisk når `OUTSYSTEMS_*` ikke er satt.

## Tilbakekall (callback)
- `CALLBACK_URL_DEFAULT` fra `backend/config.py` → `${BACKEND_BASE_URL}/api/agent-runs/callback`
