# Configuración de webhooks de n8n

- Webhooks (por defecto):
  - `N8N_COMPLIANCE_WEBHOOK` → http://localhost:5678/webhook/compliance-agent
  - `N8N_PRODUCTIVITY_WEBHOOK` → http://localhost:5678/webhook/productivity-agent
- Alternativa: se usa automáticamente cuando `OUTSYSTEMS_*` no está configurado.

## Callback
- `CALLBACK_URL_DEFAULT` de `backend/config.py` → `${BACKEND_BASE_URL}/api/agent-runs/callback`
