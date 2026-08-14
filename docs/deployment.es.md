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
- `ALLOW_MOCK_AUTH` – **SEGURIDAD**: si es `true`, el backend devuelve un usuario mock y todos los endpoints quedan abiertos. **Debe ser `false` (o sin definir) en producción**, junto con credenciales reales de Firebase.
- `ANTHROPIC_API_KEY` – clave de API de Anthropic (opcional, LLM alternativo)
- `FIREBASE_SERVICE_ACCOUNT` – ruta al JSON de la cuenta de servicio de Firebase
- `LM_STUDIO_URL` – endpoint local de LM Studio (opcional, no usado en la nube)

#### Agentes / módulos nuevos (opcional, solo si se usa la función)
- `API_PROVIDER` – proveedor del gateway LLM: `openai` \| `openrouter` \| `itemai` (usa `openai` en la nube; itemai/LM Studio es local)
- `OPENROUTER_API_KEY` – clave de OpenRouter (proveedor LLM alternativo)
- `EMBED_MODEL` – modelo de embeddings del vector store / Source Map del Agente de Realidad Auto-Simulada (por defecto `text-embedding-3-small`; cae a TF-IDF offline sin `OPENAI_API_KEY`)
- `AZURE_DEVOPS_PAT` (o `ADO_PAT`) – PAT de Azure DevOps para el Red Cross Web QA Agent (ingesta de sprints / work items)
- `WAVE_API_KEY` – clave WAVE de WebAIM para los chequeos de accesibilidad de Red Cross QA
- `ROBOMIND_ADMIN_TOKEN` – control de admin para los endpoints de ajustes/política de Robomind Clinic
- `EMAIL_PROVIDER` + `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` (o `SENDGRID_API_KEY`) – email saliente para el flujo "Notify Me" del módulo Future
- `JWT_SECRET` – secreto de firma de sesión/JWT
- `VOICEBOX_URL` – endpoint local de Voicebox (Language Agents; solo local, cae a TTS del navegador en la nube)

> Nota: `OPENAI_API_KEY` ahora también alimenta los embeddings del Agente de Realidad Auto-Simulada (Source Map) y la visión de imágenes de Andrés the Robot. Sin ella, esas funciones degradan con elegancia (offline/mock), no fallan.
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
- Puntuación de preparación en **7 secciones**: Arquitectura, Entorno y Secretos, Frontend,
  Backend, Datos y Auth, **Endurecimiento de seguridad**, Smoke Tests.
- Recomendaciones de arquitectura con estimaciones de coste.
- Plantillas de variables de entorno con guía de almacenamiento en la nube (ahora incluyen las
  variables de los agentes nuevos de arriba).
- Pruebas de humo automáticas contra endpoints en vivo, con una **capa "Agentes y módulos"**
  que pinguea el health de cada agente notable (Andrés `/api/andres/health`, Realidad
  Auto-Simulada `/api/self-sim-reality/health`, Claim Analyzer, Self-Correcting Loop, Robomind
  `/api/clinic/health`, Cybersecurity `/api/cyber/health`, AGI `/api/agi/progress`) — así el
  deploy se valida sirviendo los módulos de verdad, no solo `/health`.
- Guía de resolución de problemas (ahora con entradas `modules`, `security` y de modelos de razonamiento).
- API: `GET/POST /api/cloud-install/*` (7 endpoints).

### Endurecimiento de seguridad (antes de ir a producción)
- Pon **`ALLOW_MOCK_AUTH=false`** (o déjalo sin definir) — si no, el backend sirve un usuario
  mock compartido y todos los endpoints quedan abiertos.
- Proporciona **credenciales reales de Firebase** para que la auth no caiga al usuario mock.
- La sección **Endurecimiento de seguridad** del readiness comprueba ambas y se pone en rojo si
  alguna está mal.

## Notas
- Actualiza los orígenes CORS para incluir el/los host(s) del frontend mediante la variable `ALLOWED_ORIGINS`.
- Los secretos deberían usar Google Cloud Secret Manager (backend) o Vercel Environment Variables (frontend).
- Nunca subas archivos `.env` a git.
