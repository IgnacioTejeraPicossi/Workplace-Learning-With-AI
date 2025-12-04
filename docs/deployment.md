# Deployment

## Backend startup
- See `BACKEND_STARTUP.md` for detailed steps.

## Environment variables
- `BACKEND_BASE_URL` – base URL for FastAPI (default http://localhost:8000)
- `OUTSYSTEMS_CALLBACK_URL` – overrides default callback if needed
- `OUTSYSTEMS_*` or `N8N_*` – set OutSystems, or omit to use n8n fallback
- Frontend: `REACT_APP_API_BASE_URL`, `REACT_APP_WEBSEARCH_BASE_URL`

## Notes
- Update CORS origins to include your frontend host(s).
