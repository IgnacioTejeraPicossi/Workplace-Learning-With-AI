# AGENTS.md — Workplace Learning With AI (WLWAI)

Este repositorio es una plataforma de IA modular con múltiples servicios. Este archivo define cómo deben operar los agentes de IA (Cursor, agentes CLI, agentes con MCP) al hacer cambios.

## 0) Identidad del repositorio
WLWAI combina:
- Backend FastAPI (Python) que ofrece las APIs principales, la orquestación de IA y módulos especializados
- Frontend React (UI de aprendizaje + UI de agentes)
- Backend de búsqueda web en Node
- Flujos de trabajo n8n opcionales (automatización de AgentOps Studio)
- Servidor MCP (J-messages Analyzer) accesible vía Postman/Claude a través de un servidor puente STDIO

Módulos destacados:
- J-messages Analyzer (procesamiento de la normativa del Fiskeridirektoratet)
- Robomind Clinic (Psicología de IA / Psychopathia Machinalis)
- Repo Analyzer Cursor AI (generación de documentación + creación de módulos de aprendizaje)
- Prompt Managers para los agentes de Compliance y Productivity

## 1) Principios innegociables
1. PRs pequeños y revisables (un módulo/servicio principal por PR salvo que se pida explícitamente).
2. Nunca subas secretos (claves de API, tokens, contraseñas). Usa `.env` y variables de entorno.
3. Preserva los puertos estables y la topología de servicios documentada:
   - backend 8000, frontend 3000, websearch 8080, n8n 5678, LM Studio 1234, servidor de archivos de prueba MCP 8888.
4. El backend DEBE arrancarse desde la RAÍZ del repositorio (no desde `backend/`) para evitar problemas de importación.
5. Al cambiar contratos de API, añade/ajusta tests de contrato o, como mínimo, un comando de prueba de humo reproducible en TESTING.md.
6. Evita el exceso de dependencias pesadas: no reintroduzcas el stack descontinuado de Voice Cloning ni dependencias similares de varios GB.

## 2) «Estilo de trabajo» (flujo del agente)
Para cualquier tarea:
1. Clasificación del alcance: Backend / Frontend / MCP / n8n / Websearch / Bot de competición.
2. Identifica la(s) puerta(s) de validación ANTES de programar (ver TESTING.md).
3. Implementa cambios mínimos siguiendo los patrones existentes.
4. Ejecuta la(s) puerta(s) mínima(s).
5. Resume:
   - qué cambió
   - por qué
   - cómo se validó (comandos + resultados)
   - riesgos / seguimientos

## 3) Fronteras de servicio (qué va dónde)
### Backend (FastAPI, Python)
- Ejecuta desde la raíz: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Servicios transversales:
  - Stack LLM unificado (función(es) compartida(s) usada(s) por varios módulos)
  - Persistencia en Mongo para los módulos (documentos, prompts, ejecuciones de clínica)

### Frontend (React)
- Corre en 3000, llama al backend en 8000 (vía REACT_APP_API_BASE_URL o similar).
- Los módulos de UI incluyen: J-messages Analyzer, Robomind Clinic, Repo Analyzer Cursor AI, gestores de prompts de agentes, etc.

### Backend de búsqueda web (Node)
- Corre en 8080. Trátalo como un servicio separado; mantén la API estable.

### n8n (Docker, opcional)
- Corre en 5678. Se usa para los flujos de AgentOps Studio; evita romper las cargas útiles de los webhooks.

### Servidor MCP (J-messages Analyzer)
- Manifest: `GET http://localhost:8000/api/mcp/manifest`
- Servidor puente: `backend/mcp_bridge_server.py` (STDIO JSON-RPC)
- Servidor de archivos de prueba: `python backend/test_mcp_server.py` en el puerto 8888 para servir documentos locales al MCP de Postman.

## 4) Salvaguardas específicas por módulo
### A) J-messages Analyzer (Fiskeridirektoratet)
Ubicaciones clave del código:
- Routers: `backend/routers/j_messages_analyzer.py`, `backend/routers/j_messages_training.py`
- Servicios: `backend/services/j_messages_evaluator.py`, `backend/services/prompt_suggestion_service.py`
- Frontend: `frontend/src/JMessagesAnalyzer.jsx`, `frontend/src/JMessagesLibrary.jsx`, `frontend/src/JMessagesPairsLibrary.jsx`, `frontend/src/components/PromptPanel.jsx`

Reglas:
- Preserva los campos almacenados: `{id, title, status, toc, body_html, summary}` cuando aplique.
- Preserva el sistema de prompts nativo versionado bajo `backend/prompts/j_messages/v{version}/` y mantén la versión del prompt registrada en los resultados del análisis.
- Si cambias la salida del análisis, actualiza las rutas de exportación y los renderizadores de la UI.

### B) Prompt Manager (agentes de Compliance y Productivity)
El contrato de la API del backend debe permanecer estable:
- `GET/POST/PUT/DELETE /api/prompts/{agent}`
- `POST /api/prompts/{agent}/test` devuelve:
  - Compliance: `{ ok, output, summary, risks }`
  - Productivity: `{ ok, output, summary, actions }`

Reglas:
- Mantén compatibles los campos de la colección `prompts` de Mongo (`agent`, `name`, `prompt`, flags, timestamps).
- Probar un prompt no debe mutar el análisis de producción en vivo salvo que sea intencionado.

### C) Robomind Clinic (Psychopathia Machinalis)
Hay dos capas:
- Clínica heredada (detectores por reglas + juez LLM opcional)
- API de clínica mejorada (competición) bajo `/api/robomind/*` con esquemas Pydantic

Endpoints (mejorada):
- `POST /api/robomind/screen`
- `POST /api/robomind/therapy`
- `POST /api/robomind/apply`
- `GET /api/robomind/dashboard/metrics`
- `GET /api/robomind/cases/{id}`

Reglas:
- Mantén la compatibilidad del esquema Pydantic para las respuestas de Screen/Therapy/Apply.
- Si tocas el comportamiento de la API mejorada, ejecuta la suite de tests de contrato:
  `python -m pytest backend/tests/test_robomind_api_contracts.py -v`
- Si existen cabeceras/flags de modo demo, preserva el comportamiento determinista.

### D) Repo Analyzer Cursor AI
Endpoints del backend:
- `POST /api/cursor-readme/upload-files`
- `POST /api/cursor-readme/generate`
- `POST /api/cursor-readme/save-learning-module`
- `GET /api/cursor-readme/learning-modules`
- `GET /api/cursor-readme/learning-module/{module_id}`

Reglas:
- Preserva los límites de subida y el manejo de errores.
- Mantén estable la «conversión a módulo de aprendizaje»; la usa el sistema de aprendizaje.

### E) Pruebas MCP vía Postman / Claude
Reglas:
- El descubrimiento de herramientas MCP debe funcionar vía `tools/list` STDIO hacia el puente.
- El manifest debe permanecer accesible (`/api/mcp/manifest`).
- Evita cambios de esquema en la entrada/salida de las herramientas MCP salvo que estén versionados.

## 5) Condiciones de parada (detener + reportar)
Detente y reporta si:
- Un cambio podría filtrar secretos o datos personales (PII)
- El backend ya no arranca desde la RAÍZ
- Falla el descubrimiento de herramientas MCP
- Los contratos de gateway/clínica se rompen sin un test actualizado
- El exceso de dependencias amenaza el tamaño del repo o su desplegabilidad

## 6) Definición de Hecho (DoD)
Un cambio está hecho cuando:
- Los servicios relevantes arrancan y responden
- Pasan las puertas mínimas de validación (TESTING.md)
- No se ha subido ningún secreto
- La documentación se actualizó si cambió el flujo de trabajo
- El resumen del PR incluye evidencia de comandos
