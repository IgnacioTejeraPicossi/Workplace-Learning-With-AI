# Despliegue (Deployment)

## Arranque del backend
- Consulta `BACKEND_STARTUP.md` para los pasos detallados.
- Arranca desde la **raíz del repositorio**: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`

## Variables de entorno

### Backend
- `MONGO_URI` – cadena de conexión de MongoDB (Atlas: `mongodb+srv://...`, local: `mongodb://localhost:27017`)
- `OPENAI_API_KEY` – clave de API de OpenAI para las llamadas al LLM
- `HMAC_SECRET` – clave HMAC para la firma entre agentes
- `ALLOWED_ORIGINS` – orígenes CORS permitidos, separados por comas (p. ej. `https://your-app.vercel.app,http://localhost:3000`)
- `PORT` – puerto del backend (Cloud Run lo inyecta automáticamente, por defecto 8000)
- `ANTHROPIC_API_KEY` – clave de API de Anthropic (opcional, LLM alternativo)
- `FIREBASE_SERVICE_ACCOUNT` – ruta al JSON de la cuenta de servicio de Firebase
- `LM_STUDIO_URL` – endpoint local de LM Studio (opcional, no usado en la nube)
- `BACKEND_BASE_URL` – URL base de FastAPI (por defecto http://localhost:8000)
- `OUTSYSTEMS_CALLBACK_URL` – sobrescribe el callback por defecto si hace falta
- `OUTSYSTEMS_*` o `N8N_*` – configura OutSystems, u omítelo para usar la alternativa de n8n

### Frontend
- `REACT_APP_API_BASE_URL` – URL de la API del backend (p. ej. `https://your-backend.run.app`)
- `REACT_APP_WEBSEARCH_BASE_URL` – URL del backend de búsqueda web
- `REACT_APP_FIREBASE_*` – claves públicas de configuración de Firebase (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)

### Backend de búsqueda web (Fase 2)
- `WEBSEARCH_PORT` – puerto del backend de búsqueda web (por defecto 8080)
- `SERPER_API_KEY` – clave de API de Serper.dev para la búsqueda web
- `ALLOWED_ORIGINS` – orígenes CORS para la búsqueda web

## Despliegue en la nube

### Arquitectura
- **Frontend**: Vercel (React, CI/CD de GitHub)
- **Backend**: Google Cloud Run (contenedor Docker, escala a cero)
- **Base de datos**: MongoDB Atlas (nivel gratuito M0 disponible)
- **Autenticación**: Firebase Auth (ya integrado, sin migración)
- **DNS/SSL**: Cloudflare (Fase 2)

### Artefactos de despliegue
- `deployment/Dockerfile` – Python 3.11-slim, listo para Cloud Run, HEALTHCHECK incluido
- `deployment/cloudrun.yaml` – especificación de servicio Knative (europe-north1, escala 0-3, sondas de startup/liveness/readiness)

### Comandos rápidos de despliegue
```bash
# Construir la imagen Docker localmente
docker build -t wlwai-backend -f deployment/Dockerfile .

# Probar localmente
docker run -p 8000:8000 --env-file .env wlwai-backend

# Desplegar en Cloud Run
gcloud builds submit --tag gcr.io/PROJECT/wlwai-backend
gcloud run deploy wlwai-backend --image gcr.io/PROJECT/wlwai-backend --region europe-north1
```

### Endpoints de salud
- `GET /health` – chequeo de salud básico (ok, service, version, timestamp)
- `GET /ready` – chequeo de disponibilidad con ping a MongoDB

### Módulo Cloud Install
El módulo «Installing the App in the Cloud» ofrece un banco de trabajo de despliegue dentro de la app:
- Puntuación de preparación y seguimiento del progreso por sección
- Recomendaciones de arquitectura con estimaciones de coste
- Plantillas de variables de entorno con guía de almacenamiento en la nube
- Pruebas de humo automáticas contra endpoints en vivo
- Guía de resolución de problemas (13 puntos en 5 categorías)
- API: `GET/POST /api/cloud-install/*` (7 endpoints)

## Notas
- Actualiza los orígenes CORS para incluir el/los host(s) del frontend mediante la variable `ALLOWED_ORIGINS`.
- Los secretos deberían usar Google Cloud Secret Manager (backend) o Vercel Environment Variables (frontend).
- Nunca subas archivos `.env` a git.
