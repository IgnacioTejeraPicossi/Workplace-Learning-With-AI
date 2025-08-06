# Web Search Backend

Este es el servidor Node.js Express que maneja la funcionalidad de búsqueda web con IA.

## Características

- **Endpoint `/web-search`**: Utiliza OpenAI GPT-4o con herramienta de búsqueda web
- **Fallback automático**: Si la herramienta de búsqueda web no está disponible, usa respuesta estándar de GPT
- **CORS configurado**: Permite peticiones desde el frontend React
- **Health check**: Endpoint `/health` para verificar el estado del servicio

## Instalación

```bash
cd websearch-backend
npm install
```

## Configuración

El servidor lee las variables de entorno del archivo `.env` del directorio raíz:

```
OPENAI_API_KEY=tu_api_key_de_openai
WEBSEARCH_PORT=8080  # Opcional, por defecto 8080
```

## Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## Endpoints

### POST /web-search
Realiza una búsqueda web con IA.

**Body:**
```json
{
  "query": "¿Cuál es la noticia más reciente sobre IA?"
}
```

**Respuesta:**
```json
{
  "result": "Respuesta de la IA...",
  "used_web_search": true,
  "tool_calls": [...]
}
```

### GET /health
Verifica el estado del servicio.

### GET /
Información del servicio.

## Arquitectura

Este servidor trabaja en conjunto con el backend principal de FastAPI:

- **FastAPI (Puerto 8000)**: Maneja la mayoría de endpoints
- **Node.js Express (Puerto 8080)**: Maneja específicamente la búsqueda web

El frontend React puede llamar a ambos servidores según necesite. 