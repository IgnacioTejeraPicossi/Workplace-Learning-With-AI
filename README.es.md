# 🤖 Plataforma de Aprendizaje Laboral con IA

**Workplace Learning With AI (WLWAI)** es un proyecto de portafolio centrado en **pruebas automáticas, validación asistida por IA, flujos de trabajo con agentes y experimentación de producto habilitada por LLM**. Combina FastAPI, React, MCP, Postman y pipelines de IA estructurados para explorar cómo los sistemas de IA modernos pueden probarse, depurarse, integrarse y mejorarse en escenarios reales. (Test Manager/AI Test/Automatic testing)

---

## 🎯 Enfoque del portafolio

- **Pruebas automáticas**: validación de APIs, flujos de pruebas MCP, diagnósticos reproducibles y flujos orientados a la resolución de problemas.
- **Ingeniería de IA aplicada**: iteración de prompts, orquestación de LLM, flujos con agentes y pipelines de análisis estructurado.
- **Integración de sistemas**: backend FastAPI, frontend React, MongoDB, n8n, puentes con OutSystems y herramientas compatibles con MCP.
- **Mentalidad experimental**: ciclos de retroalimentación rápidos para depuración, validación, refinamiento de prompts y análisis del comportamiento de la IA.

---

## 🚀 Qué demuestra este proyecto

- **IA + pruebas juntas**: no solo construir funciones de IA, sino validarlas y depurarlas sistemáticamente.
- **Interoperabilidad de MCP y herramientas**: probar herramientas de IA mediante puentes STDIO/HTTP y flujos de cliente como Postman.
- **Flujos de producto habilitados por LLM**: análisis de documentos, gestión de prompts, bucles de evaluación e interfaces orientadas a agentes.
- **Entrega full-stack práctica**: APIs de backend, componentes de frontend, documentación de integración y guía de pruebas en un solo repositorio.

---

## 📚 Capacidades principales

| Área | Aspectos destacados |
|------|------------|
| **Pruebas y validación** | Servidor MCP, flujos de pruebas con Postman, documentación de validación, flujos de resolución de problemas |
| **IA y agentes** | AgentOps Studio, Repository Analyzer, Document Analyzer, Agentic RAG, AI Study Buddy |
| **Aprendizaje laboral** | Conceptos de IA, microlecciones, recomendaciones, simulador de escenarios, certificaciones |
| **Empresa y operaciones** | EA Second Brain (Portfolio, Impact Scoring, Heatmap, Deprecation Radar, Ask), Process Designer, Catalog Manager |
| **Despliegue en la nube** | Banco de trabajo Cloud Install, puntuación de preparación, checklist de despliegue, pruebas de humo automáticas, línea base de coste, Dockerfile + configuración de Cloud Run |
| **Security Center** | Seguridad y privacidad de la plataforma en 6 módulos: cifrado local (AES-GCM 256), borrado automático de datos, control y exportación de datos del usuario, anonimización de PII, puntuación de seguridad dinámica, monitorización de eventos en tiempo real |
| **Ciberseguridad** | Plataforma de seguridad de 10 pestañas: biblioteca de amenazas, escaneo real de vulnerabilidades, postura NIST CSF 2.0, seguimiento de cumplimiento, coach de programación segura, simulacros de incidentes, base de conocimiento, monitor de seguridad de agentes |
| **QA y automatización de pruebas** | Red Cross Web QA Agent (20 pestañas / 50 endpoints): generadores Playwright + Cypress, QA de formularios Skjemabygger + Fundy, auditoría de migración de contenido, rendimiento específico de Enonic, cumplimiento de Designsystemet (Digdir), matriz de permisos por rol, **paquete de work-items de Azure DevOps**, **generador de Sprint Report**, **DPIA / verificador DoD / Resilience / UAT-støtte / Risk Matrix**, **pruebas de carga duales k6 + Loadster**, **introspección Storybook + Postman + GraphQL** (Fase F), **accesibilidad NVDA + WAVE** (Fase G), **Fase H · Pack 2 — banco de trabajo Sikkerhet og personvern** (impulsado por backend, persistente, estado preservado entre re-escaneos, DPIA estructurado), **Fase H · Pack 3 — 5 extensiones de flujo** (📥 exportación Markdown de hallazgos + DPIA + historial, 🎯 despacho ADO idempotente de un solo hallazgo con IDs de work-item mock deterministas, 🔀 diff de escaneos con grupos new/fixed/regressed/persisted, ✅ flujo verify-fix que promueve automáticamente `fixed` → `verified`, 🌐 matriz de entornos local/test/staging/prod), alineado con la Teststrategi 30.3 de Trine Bruu |
| **Agentes de idiomas** | 6 tutores de idiomas (japonés, chino, coreano, English Mastery, noruego, español) — pronunciación, gramática, vocabulario SRS, conversación; **ejemplos con voz nativa clonada** (Voicebox, local) y **Conversation Audio hablada** (Web Speech ASR + TTS, investigación web opcional) |
| **Casos de uso de IA especializados** | J-messages Analyzer, agentes de compliance/productividad, ATM V&V Test Copilot, experimentación con IA |

---

## 📁 Estructura

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents, mcp_bridge_server
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
├── deployment/        # Cloud deployment: Dockerfile, cloudrun.yaml (Google Cloud Run)
├── grocery_bot/       # Autonomous bot experimentation sandbox (strategy.py, bot.py)
├── websearch-backend/ # Node.js web search service
├── agentops-n8n/      # n8n workflows (Docker)
├── docs/              # All documentation (*.md), including full README
├── requirements.txt   # Python deps (root)
├── .env               # Backend env (root)
└── README.md          # This file
```

El **backend** debe ejecutarse desde la **raíz del repositorio**:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Puertos**: Backend 8000, Frontend 3000, Web Search 8080 (`WEBSEARCH_PORT`), n8n 5678 (opcional), servidor de archivos de prueba 8888 (para MCP).

---

## 📖 Documentación

**Empieza aquí si quieres entender cómo se prueba y se documenta este proyecto:**

- [docs/agents.md](docs/agents.md)
- [docs/llms.txt](docs/llms.txt)
- [docs/TESTING.md](docs/TESTING.md)

---

- **README completo** (instalación, configuración, todos los módulos): [docs/README_FULL.md](docs/README_FULL.md)
- **Índice rápido**: [docs/README_INDEX.md](docs/README_INDEX.md) — arquitectura, despliegue, agentes, administración
- **Sandbox del bot autónomo**: [grocery_bot/README.md](grocery_bot/README.md)
- **Pruebas MCP / Postman**: [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md) — J-messages Analyzer vía MCP o HTTP

---

## 🔄 Trabajo reciente (2024–2026)

### Agentes de idiomas — voz nativa clonada + conversación hablada (julio 2026)

La familia de **Agentes de idiomas** (barra lateral → **Language Agents**) es un conjunto de seis tutores de idiomas — 🇯🇵 Japanese Sensei · 🇨🇳 Chinese Teacher · 🇰🇷 Korean Teacher · 🇬🇧 English Mastery · 🇳🇴 Norwegian Mentor · 🇪🇸 Spanish Teacher — cada uno un espacio de trabajo multi-pestaña (pronunciación, gramática, vocabulario SRS, conversación, etc.) respaldado por `/api/{japanese|chinese|korean|english|norwegian|spanish}/*`. Cobertura de contratos: `backend/tests/test_language_agents_contracts.py` (42 tests sobre los 6 agentes).

Dos capacidades llegaron en julio de 2026:

**1. Ejemplos con voz nativa clonada — Spanish Teacher (CHANGELOG [1.19.0])**
Una vía de **clonación de voz** local y respetuosa con la privacidad mediante **[Voicebox](https://voicebox.sh)** (código abierto, se ejecuta en `127.0.0.1`, mantiene todos los datos de voz en la máquina del usuario). Como la síntesis en vivo de una voz clonada en CPU es lenta (~1-5 min/frase sin GPU), la pestaña **Pronunciación** del Spanish Teacher reproduce un conjunto curado de frases de ejemplo nativas **pregeneradas** (saludos, instrucciones de clase, muestra de pronunciación rr/ñ/j/ll, ánimo) — cacheadas como WAV y servidas para reproducción **instantánea** (~0.2s).
- Backend: `backend/services/voice_examples.py` (conjunto de frases + caché + recortador de prefijo de referencia con detección de silencio + validación de velocidad de habla y contenido de voz), `backend/scripts/pregenerate_voice_examples.py` (generador offline, reanudable), endpoints `GET /api/voice/examples` + `GET /api/voice/examples/{id}/audio`.
- El proxy de Voicebox `backend/routers/voicebox.py` reescrito para el flujo de generación **asíncrono** de Voicebox v0.5.0 (POST /generate → poll /history/{id} → GET /audio/{id}), con fallback elegante a la voz del navegador y selección de `engine`/`model_size`.
- Frontend: panel `NativeVoiceExamples` en `SpanishTeacher.jsx`; tests `backend/tests/test_voice_examples.py` (10). i18n EN/NO/ES.
- **Matriz de modelos (verificada):** las voces clonadas funcionan con Qwen TTS (`qwen`, 0.6B/1.7B); `qwen_custom_voice` rechaza clones, Kokoro es de voz fija y LuxTTS solo soporta inglés.

**2. Conversation Audio — English Mastery AI (CHANGELOG [1.20.0])**
Una nueva pestaña **🎙 Conversation Audio**: práctica *hablada* con manos libres. Tú hablas (Web Speech **ASR**, `hologram/useSpeechCapture`), el mentor responde y la respuesta se lee automáticamente en voz alta (TTS del navegador) en un bucle de turnos — reutilizando el endpoint existente `/api/english/conversation/message` (Fase 1, sin cambios de backend). La **Fase 2** añade un toggle opcional de **🌐 investigación web**: el mentor investiga el tema mediante el `websearch-backend` de Node independiente (`WEBSEARCH_URL`, por defecto `:8080`) y fundamenta la respuesta con datos actuales (flag `web_research` → respuesta `web_used`), degradando con elegancia a una respuesta normal cuando el servicio está apagado.
- Backend: `backend/services/english_mentor.py` (`_web_research` + parámetro `web_research`), `backend/routers/english_mentor.py`. Frontend: `TabConversationAudio` en `EnglishMentor.jsx`. i18n EN/NO/ES.
- **Sin dependencia de Docker:** English Mastery usa la voz del navegador; Voicebox/Docker solo se usa para los ejemplos de voz clonada en español y degrada con elegancia cuando está apagado.

> **Nota:** `docs/Voice-Cloning-Discontinuation.md` (dic. 2024) describe un intento *anterior* y abandonado con Coqui-TTS, y ha quedado **superado** por el enfoque de Voicebox descrito arriba.

### Red Cross Web QA Agent (mayo 2026 — alineación con Teststrategi 30.3)

Un copiloto de QA 24/7 creado a medida para la reconstrucción del sitio web **rodekors.no** sobre **Enonic XP CMS + NextJS + Designsystemet (Digdir)**. Item Agent #9, accesible desde la barra lateral en **Future Item Agents**.

Alineado con la **Teststrategi 30.3 de Trine Bruu** (Testleder, Røde Kors): **Azure DevOps** es la herramienta de pruebas oficial (§5), cada hallazgo lleva el esquema de doble severidad `severity_dev` 1-4 + `category_ops` A-C (§8.1), los niveles de prueba siguen el modelo en V (unit / SIT / system / UAT / performance, §5), y **Fundy** se reconoce como el proveedor de formularios de donación (separado del traspaso de pago a Vipps, §3 Systemlandskap).

El agente se entrega como un **shell de 20 pestañas** (`frontend/src/RedCrossWebQAAgent.jsx`) con dos modos de ejecución — **Generate-only** (produce scripts/informes para Cursor / Claude Code / GitHub Actions) y **Execute-directly** (ejecuta Playwright / Cypress / axe-core / Lighthouse / k6 dentro de la app) — y dos entornos (local en `:3000`, test). Cada ejecución se firma con un hash de atestación SHA-256 para trazabilidad.

**20 pestañas** (`frontend/src/red-cross-qa/*.jsx`):

| # | Pestaña | Propósito |
|---|-----|---------|
| 1 | 📊 Dashboard | Estado de calidad en vivo: total de ejecuciones, tasa de aprobación, hallazgos abiertos, bloqueadores críticos, 11 quality gates, panel de 16 botones de Quick Actions, **Fase F: banner de consejos de herramientas de Tom** (NextJS + Storybook + Playwright + Postman para la reconstrucción de rodekors.no) |
| 2 | 📋 Test Plan | El LLM convierte un work item de Azure DevOps / user story en un plan de pruebas manual + automatizado + accesibilidad + API + regresión; emite `ado_work_items` con `work_item_type` (Bug / Task / Test Case), `priority` 1-4 y `test_level` (unit / sit / system / uat / performance) |
| 3 | 🎭 Playwright | Generador E2E multinavegador (10 ámbitos: navegación, formularios, búsqueda, donación, voluntariado, vista previa del CMS, a11y smoke, visual, API mock, **Fase F: Storybook para componentes de Designsystemet — genera un `storybook.spec.ts` determinista con patrones de `@storybook/test-runner`, patrón de URL `iframe.html`, inyección de axe-core por historia, perfil de etiqueta WCAG 2.2 AA**). El banner de consejos de Tom explica que Playwright viene empaquetado con Storybook en este proyecto. |
| 4 | 🌲 Cypress | Generador de componentes + regresión del frontend. **Fase F: aviso de deprecación suave** en la parte superior recomendando Playwright (pestaña 3) ya que el empaquetado de Storybook ya está en marcha; Cypress permanece para necesidades ad-hoc / sin Storybook. |
| 5 | 🔌 API QA | Enonic Guillotine GraphQL + API de NextJS + integraciones externas — 10 comprobaciones. **Fase F: panel de introspección del esquema GraphQL** (lista 5 operaciones de Guillotine + 8 tipos de contenido de Røde Kors como Distrikt / Aktivitet / Kampanje, mock-first) + **botón de exportación de Postman Collection v2.1** con descarga en el navegador (4 consultas canónicas, variables `base_url` + `token`, tests por petición que verifican status 200 + sin errores de GraphQL). El flujo preferido de Tom para trastear con el backend XP. |
| 6 | 📝 CMS QA | Editor Enonic Content Studio + experiencia del visitante — 14 áreas |
| 7 | 📑 Forms QA | Auditoría **Skjemabygger + Fundy** — **21 comprobaciones** (12 base: JSON Schema, patrones de Adam Silver, estado multipaso, teclado móvil, autocompletado, prefill APIM/Dataverse, regiones ARIA live, resumen de errores, **traspaso a Vipps**, idempotencia PRG, más 9 comprobaciones del proveedor de donaciones **Fundy**). Los hallazgos llevan `severity_dev` 1-4 + `category_ops` A-C |
| 8 | 📦 Content Migration | Auditoría de migración gradual del CMS heredado → Enonic XP — 8 tipos de contenido (Forening / Distrikt / Aktivitet / Kontaktperson / Tjeneste-Kurs / Tema / Nyhet / Kampanje) × 10 comprobaciones (mapeo, caracteres æøå, relaciones, re-anclaje de imágenes, redirecciones 301, SEO, invalidación ISR, traspaso de permisos por rol) |
| 9 | ♿ Universell utforming-pilot (Accesibilidad) | **Selector de herramientas** con 3 motores en paralelo: 🤖 **axe-core + Lighthouse** (escaneo automático existente, 12 comprobaciones, toggle WCAG 2.1/2.2 AA), 🔊 **NVDA** (Fase G — genera un checklist en markdown con pulsaciones `Insert+T` / `Insert+F7` / Tab + anuncios esperados + mapeo WCAG SC por paso, 5 presets de ámbito: donación / voluntariado / búsqueda / navegación / formularios, descarga .md), 🌊 **WAVE (WebAIM)** (Fase G — informe mock-first con tarjetas de estadísticas de errores/contraste/alertas/features/estructura/aria + 3 tablas de detalle + enlace profundo a `wave.webaim.org/report#/{url}`; llamada real a la API cuando se define la variable `WAVE_API_KEY`) |
| 10 | ⚡ Performance | Core Web Vitals + **rendimiento específico de Enonic**: waterfall de Guillotine GraphQL / N+1 / over-fetch, revalidación ISR, servicio de imágenes, latencia de ack de publicación, bloqueo de UI en publicación masiva, virtualización de partes, frescura de caché — 10 comprobaciones + tabla de hot-queries + métricas p95 |
| 11 | 🎨 Designsystemet | **Cumplimiento de Digdir Designsystemet** — uso de `@digdir/designsystemet-react`, tokens, tipografía, espaciado, modo oscuro, override de marca, versión, componentes de botón + elementos de formulario — 10 comprobaciones + puntuación de cumplimiento 0-100 + panel de desviaciones |
| 12 | 🔐 Role Matrix | **Pruebas de autorización reales** en 6 roles editoriales (Administrator / Eier / Lokal eier / Redaktør / Lokal redaktør / Bidragsyter) × 4 acciones (read/edit/publish/delete) — 8 comprobaciones de autorización (aislamiento de subárbol, guard de publicación, guard de borrado, guard de asignación de rol, audit log, expiración de sesión, escalada de privilegios, autorización de API) |
| 13 | 🔥 Stress Test | Perfiles de carga k6 para picos de Red Cross: smoke, normal, pico de campaña, **pico de crisis (1.000+ VUs)**, soak de 4 horas. La **Fase D** añade **Loadster** como herramienta paralela con un selector de radio arriba — Loadster ejecuta navegadores reales, así que captura **hidratación JS** (`hydration_p95_ms`) y **coste de navegación SPA** (`spa_nav_p95_ms`) que k6 a nivel de protocolo no puede medir (relevante para la UX del frontend NextJS + Designsystemet). Además, una sección **Resilience** dedicada (Trine §7) con `resilience_score` 0-100, VU de breakpoint, segundos de recuperación, tasa de error pico, deriva de memoria — separando *ytelse* de *resilience* |
| 14 | 🛡️ Sikkerhet og personvern (Seguridad y privacidad) | **Fase H · Pack 2 — banco de trabajo completo impulsado por backend**: panel de snapshot (estado general + hallazgos pass/warn/fail/open) → tarjetas de comprobación clicables (estado + severidad + scan_type + badge de categoría + recuento de hallazgos vinculados) → cajón de detalle (resumen, evidencia, recomendaciones, filas completas de hallazgos) → lista de hallazgos filtrable con **flujo de 4 estados** (open / accepted_risk / fixed / verified, estado preservado entre re-escaneos) y edición de propietario/recomendación + historial de auditoría → **historial de escaneos** con flechas de tendencia comparando fail+warn vs ejecución anterior → editor **DPIA** estructurado con 10 campos (purpose, dataTypes, sensitiveData, storageLocation, accessRoles, retention, thirdParties, legalBasis, riskNotes, mitigations). 13 comprobaciones de seguridad/privacidad + 12 de DPIA = 25 en total. Respaldado por 3 colecciones de MongoDB + fallback en memoria |
| 15 | 🎯 Azure DevOps | Convierte hallazgos en work items de Azure DevOps (Bug / Task / Test Case) con píldora de prioridad (P1-P4), badges `severity_dev` (dev), `category_ops` (drift) y `test_level`. También despacha a OutSystems |
| 16 | 📈 Sprint Report | **Generador de sprint report** — agrega ejecuciones/hallazgos/despachos del sprint activo, calcula recuentos Sev1-4 + KatA-C, produce una narrativa en noruego/inglés (Status / Identifiserte avvik / Anbefalinger) para la línea de reporte de Trine hacia Røde Kors. Ahora incluye un **verificador de Definition of Done** (Trine §6.1: funcionalidad probada ✓ / integraciones verificadas ✓ / bugs conocidos documentados ✓ / listo para UAT ✓) calculado mecánicamente por work item |
| 17 | ✅ UAT Support | **NUEVO** — Item no ejecuta la UAT; lo hace Røde Kors. Genera scripts de UAT, checklists por stakeholder y un formulario de firma para los stakeholders nombrados **Hilde Forslund** (Produkteier), **Trine Røsand Scheen** (Fagperson), **Astri Fretheim** (Fagperson) |
| 18 | 🎲 Risk Matrix | **NUEVO** — Trine §10: la matriz vive fuera del documento de estrategia. Pega CSV/JSON, el agente puntúa cada riesgo (probabilidad × impacto, 1-25), asigna `level` (critical / high / medium / low), lo mapea a suites de prueba y produce `suite_priority` + `coverage_gaps` |
| 19 | 📜 Runs | Historial de ejecuciones con hash de atestación, artefactos, capturas |
| 20 | ⚙️ Settings | Entornos, herramientas, proyecto de **Azure DevOps** (organization / project / area path / iteration path / tags / current sprint / sprint length weeks), ámbito del flujo de pago (Vipps), umbrales de calidad |

**Backend:**
- Servicio: `backend/services/red_cross_qa.py` — **23 suites** con degradación elegante mock-first (cada función devuelve datos deterministas cuando el LLM no está disponible). Genera anotaciones `severity_dev` + `category_ops` en cada hallazgo.
- Router: `backend/routers/red_cross_qa.py` — **37 rutas** en `/api/red-cross-qa/*` (Fase B: DPIA / DoD / Resilience / UAT / Risk Matrix; Fase D: Loadster; Fase F: Postman + introspección GraphQL; Fase G: `/generate-nvda-script`, `/run-wave-audit`)
- **Sub-router de Fase H** `backend/routers/qa_security.py` — **13 rutas / 15 method bindings** en `/api/qa/security/*`. Pack 2: status, checks, checks/{id}, scan, findings, findings/{id} PATCH, history, dpia GET/POST/PATCH. Pack 3: `/export/markdown`, `/findings/{id}/dispatch-ado`, `/diff`, `/findings/{id}/verify`, `/environments`. Respaldado por `backend/services/qa_security_service.py` + `backend/repositories/qa_security_repository.py` + `backend/schemas/qa_security.py` con 3 colecciones dedicadas de MongoDB (`qa_security_scans`, `qa_security_findings`, `qa_security_dpia`) y fallback en memoria. Los estados de hallazgo definidos por el usuario (`fixed` / `accepted_risk` / `verified`) se preservan entre re-escaneos. Pack 3 añade: exportación de sprint report en Markdown, despacho ADO idempotente de un solo hallazgo (IDs de work-item mock deterministas), diff de ejecución de escaneo con grupos new/fixed/regressed/persisted, flujo verify-fix con re-escaneo y auto-transición de estado, y matriz de gobernanza de 4 entornos. **Pack 4.1** añade un `findings_snapshot` por escaneo en cada doc `ScanRun` → `diff_scans` devuelve un discriminador `diff_mode` (`"precise"` cuando ambas ejecuciones llevan snapshots, `"timestamp_fallback"` en caso contrario). **Pack 4.2** cablea la integración REST real de Azure DevOps: cuando `ADO_PAT` (o `AZURE_DEVOPS_PAT`) está definido en el entorno, `dispatch_finding_to_ado` hace POST de un documento JSON-Patch a `https://dev.azure.com/{org}/{project}/_apis/wit/workitems/${type}?api-version=7.0` (Basic auth, usuario vacío + PAT como contraseña); ante cualquier fallo degrada con elegancia al mock SHA determinista y expone `is_mock` + `live_error` en la respuesta. La UI muestra un badge MOCK / LIVE junto al enlace de ADO en consecuencia.
- Prompts versionados: `backend/prompts/red_cross_qa/*.md` (13 prompts: test_plan, playwright_generator, cypress_generator, api_checker, accessibility_reviewer, performance_reviewer, k6_generator, release_judge, **forms_qa**, **content_migration**, **enonic_performance**, **designsystemet**, **role_matrix**). `release_judge.md` y `test_plan.md` actualizados para referenciar Azure DevOps + doble severidad Sev/Kat + niveles de prueba del modelo en V.

**Frontend** (`frontend/src/red-cross-qa/` — 21 archivos: 20 componentes de pestaña + `_PageHero.jsx` compartido):
Sistema de diseño con estilos inline igual que el módulo ATM V&V Test Copilot — heros de página con gradiente, tarjetas de panel, chips de estado (pass/warn/fail/pending), badges de severidad (critical/high/medium/low + `severity_dev` 1-4 + `category_ops` A-C).

**i18n**: paridad total EN / NO / ES (40+ secciones de nivel superior cada una, **700 claves por idioma** tras Fase H Pack 4.2). Nuevos bloques: `dpia:` (10 claves), `dod:` (15), `resilience:` (13), `uatSupport:` (22), `riskMatrix:` (24), `stakeholders:` (3), Fase C procedencia de migración + versión WCAG (8), Fase D selector de herramienta Loadster (11) + 2 etiquetas de pestaña, Fase F: banners de consejos de Tom + Storybook + Postman + introspección GraphQL (27), Fase G NVDA + WAVE (29), **Fase H · Pack 2: etiquetas del panel de snapshot + tarjetas de comprobación clicables + flujo de hallazgo de 4 estados (open / accepted_risk / fixed / verified) + 5 filtros (status / type / category / finding state / severity) + historial de escaneos con flechas de tendencia + editor DPIA estructurado con 10 campos (82 claves)**.

**Cómo usarlo**:
1. Backend: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` desde la raíz del repo
2. Frontend: `cd frontend && npm start` → abre `http://localhost:3000`
3. Barra lateral → **Future Item Agents** → ❤️‍🩹 **Red Cross Web QA Agent**
4. Elige el entorno (`local` / `test`) y el modo de ejecución (`generate` / `execute`) en la cabecera
5. Abre cualquier pestaña y pulsa su botón **Run**. Los hallazgos + recomendaciones + casos de prueba sugeridos se muestran inline con anotaciones `severity_dev` / `category_ops`; las ejecuciones se persisten en la pestaña **Runs** con el hash de atestación SHA-256.
6. Fin del sprint → pestaña **Sprint Report** → pulsa **Generate** para la narrativa en noruego lista para los stakeholders de Trine.

**Compatibilidad hacia atrás**: `TestPlanRequest` mantiene `jira_epic` como alias deprecado de `ado_work_item`; el nombre de la colección de MongoDB `red_cross_qa_jira_dispatches_collection` se conserva deliberadamente para evitar una migración de BD. Solo cambió la terminología de cara al usuario.

**Estado de validación**: los imports del backend son limpios (23 suites, 37 rutas + 13 rutas de Fase H / 15 method bindings tras Pack 3), las pruebas de humo end-to-end pasan (`backend/tests/smoke_red_cross_qa.py` — **37 comprobaciones** cubriendo las Fases A→G + integración de skill de Fase H+ en 13 áreas de auditoría; **`backend/tests/smoke_qa_security.py` — 16 comprobaciones** cubriendo el ciclo de vida de Fase H Pack 2 + Pack 3 + Pack 4: persistencia de perform_scan, IDs de hallazgo deterministas, hallazgos filtrables, **el re-escaneo preserva el estado definido por el usuario** (promesa del Pack 2), **exportación Markdown con las secciones requeridas**, **despacho ADO idempotente con ID de work-item mock determinista** + forma `is_mock` / `live_error` del Pack 4.2 + validación del documento JSON-Patch, **diff de escaneo con 4 grupos** + aserción impulsada por snapshot `diff_mode == "precise"` del Pack 4.1, **flujo verify-fix con transiciones de estado**, **matriz de entornos con agregación worst-overall**, DPIA seed → save → patch). Los 3 idiomas parsean con paridad (**721 claves × 3** tras el ciclo de integración del skill Enonic de Fase H+), el build de producción del frontend tiene éxito con **0 warnings en `src/red-cross-qa/`**.

**Fase H+ (1.15.0, 2026-05-21) — el skill de Enonic XP aplicado sistemáticamente en 13 áreas de auditoría**. La base de conocimiento `.claude/skills/enonic-xp/` (patrones de security / performance / reliability / api-design / data-integrity / nashorn-compatibility) impulsó enriquecimientos aditivos en cada suite del módulo: 34 nuevas comprobaciones alineadas con el skill, 6 nuevas specs deterministas de Playwright/Cypress, 5 trackers de línea base en memoria para detección de tendencias (`_GRAPHQL_BASELINES`, `_PERF_HOT_QUERY_BASELINES`, `_DS_COMPLIANCE_BASELINES`, `_ROLE_MATRIX_BASELINES`, `_RESILIENCE_BASELINES`), `cross_tool_refs` en 9 áreas que hacen cada respuesta auto-navegable, y 2 campos Optional en el esquema `Finding` de Fase H (`enonic_xp_pattern` + `automation_ref`) para que cada hallazgo pueda citar su sección de skill y enlazar a una spec automatizada existente. Retrospectiva completa en `docs/audits/red-cross-qa-enonic-xp-roundup.md`.

**AGI Progress · Trilogía de feedback (1.15.1 + 1.15.2, 2026-05-22) — A + B + C completas e interconectadas**. La pestaña del workshop Homo Sapiens vs. KI i Test entregó originalmente la Opción B (re-ejecución efímera, Pack 3) y la Opción C (evolución persistente de prompts + gobernanza + arnés de regresión, Fase E). El hueco restante — **Opción A (persistencia de feedback solo en log)** — llegó en 1.15.1 con una nueva colección Mongo `homo_vs_ai_feedback_log` (fallback en memoria para las demos del workshop), auto-registro desde las acciones Re-run with feedback + Propose revision, y un panel de exportación JSON de un clic al final de la pestaña del workshop. 1.15.2 cerró luego el **puente A → C**: cada nota capturada puede promoverse a una propuesta de revisión de Fase E mediante un botón por fila `🧬 Promote to revision` en el panel de exportación, llamando al endpoint existente `proposePromptRevision` con los campos almacenados de la entrada (`task`, `user_input`, `previous_ai_output`, `text`) — sin re-escribir. Smoke `smoke_feedback_log.py` 11/11 PASS. Fase E sin cambios (3/3). Retrospectiva completa en `docs/audits/agi-progress-trilogy-roundup.md`.

**Variables de entorno opcionales para Red Cross Web QA**:
- `ADO_PAT` (o `AZURE_DEVOPS_PAT`) — Personal Access Token de Azure DevOps con ámbito `Work Items: Read & Write`. Cuando está definido, `POST /api/qa/security/findings/{id}/dispatch-ado` crea un work item real de ADO vía la API REST; cuando está ausente, el despacho degrada a un mock determinista para que la UX del workshop siga en verde. Nunca subas el valor — léelo solo desde `.env`.

### Self-Simulating Reality Agent (1.18.4 · julio 2026 — V0+V1+V2+V3)

Un compañero de tono serio y disciplina epistémica para la idea más especulativa de la hoja de ruta: la propuesta de que los observadores, las mentes o la consciencia participan en la construcción del universo que experimentan. El marco de anclaje es **Observer Patch Holography (OPH)** de Bernhard Mueller et al. La frase guía del agente — *"No te digo qué creer. Te muestro qué es ciencia, qué es teoría, qué es filosofía y qué es imaginación metafísica"* — es innegociable. Cada afirmación pasa por un clasificador epistémico de 5 niveles (`established / mainstream / speculative / philosophy / metaphor / unsupported`) antes de salir.

Ubicado en la barra lateral bajo **Future Item Agents** (icono 🌀). **10 pestañas**:

1. 🎯 **Overview** — misión, frase guía, 5 niveles epistémicos
2. 📚 **Core Concepts** — 5 tarjetas OPH de la presentación de Mueller
3. ⚙️ **OPH Mechanics** — detalles técnicos del modelo observer-patch
4. 🧭 **Theory Tour** — **8 teorías** (Friston Predictive Processing, Rovelli Relational QM, 't Hooft/Susskind Holographic, Bostrom Simulation, Tononi IIT, Dehaene GNW, **Celestial Holography**, OPH) cada una con autor + nivel epistémico + relación con OPH. Bajo las filas de teorías: una **tarjeta de Voz destacada para Sabrina Gonzalez Pasterski** (Faculty en el Perimeter Institute, Deputy Director de la Simons Collaboration on Celestial Holography, descubridora del efecto de memoria de espín gravitacional con Strominger y Zhiboedov) con enlaces a su perfil de Perimeter, la Simons Collaboration, `physicsgirl.com` y la reseña canónica de arXiv 2111.11392.
5. 🔍 **WiPhy Search** *(NUEVO · V1)* — consultas en vivo contra `wiphy.org/api/search`, el servidor MCP público de Pasterski para recuperación de afirmaciones de física (~10 155 papers · 361 273 afirmaciones · 17 953 conceptos). Bloque de estadísticas del corpus al montar + parser JSON defensivo (acepta múltiples formas de nombre de campo y envoltorio) + textos de error diferenciados `cors` / `http` / `network` con escape "Open on wiphy.org". Los IDs de paper enlazan a arXiv.
6. 🔬 **Claim Analyzer** *(NUEVO · V2)* — pega una afirmación fuerte (p. ej. *"la consciencia colapsa la función de onda"*) y el LLM del backend devuelve 5 paneles: badge de **veredicto epistémico** (`mostly_solid / mixed / mostly_overreach / unsupported`), **núcleo científico** (cada parte con su nivel de evidencia), **exceso** (cada parte etiquetada con uno de 5 tipos: `unsupported / category_error / conflation / overgeneralization / philosophical_leap`), **reformulación** en el registro honesto de la misma idea, y **términos clave** como chips clicables. Al pulsar un término se puentea a la pestaña WiPhy Search con la búsqueda auto-ejecutada vía un estado de shell `{query, nonce}`.
7. 🎨 **Playground** *(NUEVO · V3)* — dos herramientas educativas emparejadas apiladas verticalmente: **Theory Map** (SVG puro, 8 nodos con OPH centrado y 7 satélites posicionados a mano por afinidad estructural; 9 aristas tipadas con colores distintos: `provides_form`, `structural_parallel`, `competes_with`, `candidate_measure`, `de_mystifies`, `different_framing`, `supports_side`, `extends_to_flat`; clic en un nodo → panel de info que lee de las mismas claves i18n que Theory Tour) y **Observer Patch Simulator** (HTML5 Canvas 720×380 con limpieza de `requestAnimationFrame` + `cancelAnimationFrame`; N patches con movimiento browniano + rebotes en paredes + convergencia de estado por solapamiento por pares; métrica de consenso en vivo `1 - std(states)` que crece hacia el 100% sin ningún coordinador global — el remate pedagógico).
8. 🧠 **AI as Observer** — 5 experimentos mentales sobre si las IAs pueden ser observer patches
9. 🌌 **Substrate Question** — 7 secciones filosóficas que extienden la ontología de OPH (problema difícil, sustrato vs experiencia, convergencia cosmológica, hipótesis de comprensión recursiva, pregunta platónica, frontera lingüística, tres posiciones honestas)
10. 🗺️ **Roadmap & Sources** — fases V0→V3 + 14 enlaces de referencia (OPH repo/learn/book, Mueller X, Bostrom, Rovelli, Susskind, Friston, IIT, GNW, **Pasterski Perimeter, Simons Collaboration, arXiv 2111.11392, physicsgirl.com**) + bloque de integraciones candidatas para la integración completa de la herramienta MCP `wiphy.org/mcp` (pendiente de trabajo de backend)

**Backend**:
- `backend/services/claim_analyzer.py` + `backend/routers/claim_analyzer.py` — `POST /api/claim-analyzer/analyze` que devuelve `{core_scientific[], overreach[], reformulation, epistemic_verdict, key_terms[]}` con prompt LLM estrictamente JSON y fallback mock trilingüe.
- `backend/llm.py::_normalize_params_for_model` extendido en 1.18.4 para descartar `temperature` y `top_p` en modelos GPT-5.x / o1 / o3 (solo aceptan el valor por defecto 1) — arreglo en cascada que desbloqueó ~8 módulos más que caían silenciosamente a sus mocks.

**Frontend** (`frontend/src/self-sim-reality/` + `frontend/src/SelfSimRealityAgent.jsx`):
- 4 componentes nuevos en 1.18.4: `WiphySearch.jsx` (316 líneas), `ClaimAnalyzer.jsx` (350 líneas), `Playground.jsx` (30 líneas), `playground/TheoryMap.jsx` (254 líneas), `playground/ObserverPatchSimulator.jsx` (320 líneas).
- Estado cruzado a nivel de shell `{query, nonce}` que puentea Claim Analyzer → WiPhy Search.
- Única fuente de verdad: Theory Map lee las mismas claves i18n `theoryTour.rows.*` que la pestaña Theory Tour, así que actualizar una teoría en un sitio se propaga automáticamente.

**i18n**: paridad total **EN / ES / NO** — ~60 claves nuevas por idioma en 1.18.4 (fila Celestial Holography, tarjeta de Voz destacada, WiPhy Search, Claim Analyzer, Playground). Total ~180 hojas por idioma para este módulo.

Ver `docs/self-sim-reality-agent-plan.md` §14 para la retrospectiva completa de 1.18.4 y `docs/CHANGELOG.md` [1.18.4].

### AGI Hub — pestaña "Homo Sapiens vs. KI i Test" (abril 2026)

Cuarta pestaña del AGI Progress Hub, creada a medida como **compañero de workshop para SOCO** (consultora noruega de pruebas de software). Orientada a la sesión "Homo Sapiens vs. KI" con Ola Kleiven y Keyhan Farahaninia.

> **Cambio en la barra lateral (1.7.0):** **AGI Progress** se promovió del submenú Help a una entrada de nivel superior (justo debajo de **Run Test**, icono 📊) porque el módulo superó la estantería de "ayuda del sistema" — 4 pestañas, enriquecimiento con IA y un módulo de workshop completo.

Secciones en un solo scroll:
1. **Hero del workshop** — las tres preguntas de reflexión de SOCO como anclas, callout de los anfitriones.
2. **Activity Matrix** — 10 actividades canónicas de testing × 3 veredictos (🧑 Humano / 🤖 IA / 🤝 Híbrido), cada una con justificación y nivel de confianza.
3. **Head-to-head — 10 rondas en vivo** (1:1 con la Activity Matrix) que llaman a `POST /api/agi/homo-vs-ai/challenge` y transmiten respuestas de IA en vivo junto a un panel de "tester humano" preescrito. Las diez rondas: `scenarios`, `risk`, `ambiguities`, `exploratory`, `followups`, `automation`, `testData`, `oracle`, `triage`, `accessibility`. Una barra de chips de navegación rápida permite al presentador saltar a cualquier ronda en el proyector sin hacer scroll.
   - **Step 0 · Problem Router** — un panel de texto libre arriba donde el tester describe un problema real; la IA elige la ronda que mejor encaja, explica por qué, sugiere hasta 2 alternativas y puede pre-rellenar la entrada de la demo seleccionada con un clic. El prompt v2 del router usa una rúbrica de decisión de 10 reglas + 4 ejemplos few-shot a `temperature=0.1` para que el enrutamiento sea determinista (p. ej. "Som bruker ønsker jeg å logge inn med Google…" aterriza de forma fiable en `scenarios`, no en `ambiguities`).
   - **Panel humano editable** — la respuesta preescrita de cada ronda es editable in situ (Edit / Save / Clear / Restore prewritten). Los participantes pueden escribir su propia respuesta antes de pulsar Run AI. Los cambios de idioma ya no sobrescriben un panel editado (dirty-tracked).
   - **AI Judge (consultivo)** — junto a los tres botones de voto humano `+1`, un botón separado **🧠 Ask AI to judge** llama a `POST /api/agi/homo-vs-ai/judge` y renderiza un panel de veredicto: veredicto (🧑/🤖/🤝), confianza, desglose por criterio (precisión / cobertura / valor práctico), justificación, y un **descargo de sesgo de autopreferencia**. El veredicto es solo consultivo — el marcador solo cuenta tu voto. Cuando el humano emite un voto, el veredicto del juez en ese momento se adjunta como snapshot y se muestra en el log de rondas del Scoreboard como un badge: `—` (sin juez), **verde `🤖 agreed`**, o **ámbar `🤖 said X`**.
4. **Trust framework** — cuadrícula de decisión de 7 filas ("La IA destaca cuando… / Los humanos destacan cuando… / Regla práctica") por dimensión: contexto, riesgo, ambigüedad, novedad, volumen, juicio, responsabilidad.
5. **Workshop Scoreboard** — grupos configurables, log de rondas con notas, deshacer, reset, exportación JSON. Los votos de las demos head-to-head se alimentan automáticamente y ahora incluyen también `task` + `aiJudge` por ronda, así que el JSON exportado es un registro auditable de con qué frecuencia coincidieron la sala y la IA.
6. **Speaker Crib Sheet** (colapsable, solo para el ponente) — apertura de 60 segundos, 4 citas reales (Bach, Kaner, Hendrycks, Amodei) con pistas de "úsalo cuando", 5 preguntas probables de la audiencia + respuestas preparadas, y un cierre.
7. **Panel Prompt Evolution (Fase E, NUEVO)** — sección de gobernanza entre el Speaker Crib Sheet y el pie de Future Improvements. Cierra el **bucle de feedback de la Opción C** que se aplazó deliberadamente por el riesgo de "deriva silenciosa". Cuando el humano escribe feedback crítico durante una re-ejecución, un botón amarillo **🧬 Propose persistent revision** pide al LLM #2 que sugiera un diff permanente al prompt base `TASK_SPECS` de la tarea. La propuesta aterriza como `status="pending"` en la colección `homo_vs_ai_prompt_revisions`, con log de auditoría completo en `homo_vs_ai_prompt_audit`. El anfitrión del workshop aprueba / rechaza / ejecuta un arnés de regresión (3 muestras curadas por tarea puntuadas mecánicamente por cobertura de keywords + longitud + estructura markdown) / revierte desde el mismo panel. Las revisiones aprobadas alimentan todas las rondas futuras; `run_challenge` lee de Mongo con fallback elegante a TASK_SPECS cuando no hay revisión activa o Mongo no está disponible. El LLM puede **rechazar** revisiones inseguras (devuelve `status: refused` con `refusal_reason` + risk flags); los rechazos se persisten para el rastro de auditoría. Un badge `🧬 Evolved prompt v3` aparece junto a las respuestas de IA que usaron un prompt evolucionado.
8. **Nota de Future improvements** — sigue siendo un aparcamiento discreto al final. Los elementos entregados son: **Opción B** (1.8.0, *Re-run with feedback* efímero), **Local ISTQB PDF RAG** (1.8.0, BM25 sobre `docs-ISTQB/*.pdf` para los proveedores ItemAI/ItemServerAI; la nube se queda con anclas), y ahora **Opción C — evolución persistente de prompts (Fase E)** descrita arriba. **RAG completo en la nube** con embeddings + vector DB permanece deliberadamente sin implementar (la licencia de ISTQB es el bloqueante).

**Prompts anclados en ISTQB (1.7.1):** cada llamada de IA en el módulo está ahora fundamentada en secciones reales de los syllabi de ISTQB (CTFL v4.0 + CT-AI v1.0), más un bloque de terminología noruega del glosario oficial ISTQB-NO v2.4 cuando la sesión corre en noruego. Un badge `📚 ISTQB-anchored` aparece en cada tarjeta de ronda, en el resultado del Problem Router y junto al veredicto del AI Judge — al pulsarlo revela las secciones exactas usadas. Implementado como **Opción A (anclas curadas)**: ~80-150 tokens por prompt, cargador tolerante, conforme con la licencia de ISTQB (solo resúmenes cortos curados viven en el repo — los PDFs completos permanecen gitignored bajo `docs-ISTQB/`). Ver `backend/data/istqb_anchors.json` + `backend/services/istqb_anchors.py`.

**Iteración de workshop (1.8.0):** **extractos de PDF locales** opcionales (`backend/services/istqb_local_rag.py`) añadidos a los system prompts cuando `x-api-provider` es `itemai` o `itemserverai`; las respuestas incluyen metadatos `istqb_rag` y la UI muestra una pista verde/ámbar **Local ISTQB PDF RAG**. **`GET /api/agi/homo-vs-ai/istqb-rag-status`** reporta la salud del índice. Ver `docs/CHANGELOG.md` **[1.8.0]**.

Totalmente bilingüe **EN / NO / ES** para esta pestaña: el noruego mantiene calidad nativa para los testers; el español cubre las mismas claves `homoVsAi.*` (incluyendo re-ejecución de feedback + pistas de RAG).

Backend: `backend/services/homo_vs_ai_service.py` + `backend/routers/homo_vs_ai.py` + `backend/services/istqb_anchors.py` + `backend/services/istqb_local_rag.py` + **`backend/services/prompt_evolution.py`** (Fase E) + **`backend/routers/prompt_evolution.py`** (Fase E) + `backend/data/regression_samples.json` (entradas curadas del arnés, 3 por tarea)
- `POST /api/agi/homo-vs-ai/challenge` — ejecuta una de las 10 rondas de testing; opcional **`previous_ai_output` + `feedback`** para re-ejecución efímera; la respuesta incluye `istqb_anchors: IstqbAnchor[]`, **`istqb_rag: IstqbRagMeta`** y **`prompt_source: { source: 'baked_in' | 'evolved', revision_id?, version?, approved_by?, approved_at? }`** (Fase E)
- `POST /api/agi/homo-vs-ai/route` — Problem Router (texto libre → mejor ronda; anclas + RAG local opcional)
- `POST /api/agi/homo-vs-ai/judge` — AI Judge (veredicto consultivo; anclas + RAG local opcional)
- `GET  /api/agi/homo-vs-ai/tasks` — descubrimiento
- `GET  /api/agi/homo-vs-ai/istqb-rag-status` — recuentos de PDF/chunks y modo de recuperación (para demos con LM local)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/propose`** — el LLM #2 propone un system prompt revisado para una tarea; persiste pending o refused (Fase E)
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/revisions`** — lista con filtros `?task=` + `?status=`
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/approve`** — puerta de aprobación humana; supersede la activa anterior
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/reject`** — rechaza con motivo (audit log)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/regression`** — ejecuta el arnés curado base vs propuesta, devuelve puntuaciones lado a lado
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/rollback`** — reactiva una revisión previamente superada
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/active/{task}`** — helper de depuración: resuelve el prompt activo actual para una tarea

Colecciones Mongo (Fase E): `homo_vs_ai_prompt_revisions` (historial de prompts versionado, status: pending/active/rejected/superseded/refused) + `homo_vs_ai_prompt_audit` (log de acciones append-only).

Frontend: `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` (incluyendo `IstqbBadge`, `IstqbRagHint`, textarea de feedback + **Re-run with feedback**, **Fase E** `PromptEvolutionPanel` + `PromptBox` + `RegressionView` + el botón amarillo **🧬 Propose persistent revision** + el badge verde **🧬 Evolved prompt**)
Helpers de API del frontend: `frontend/src/api/agiApi.js` — `proposePromptRevision / listPromptRevisions / approvePromptRevision / rejectPromptRevision / rollbackPromptRevision / runRegressionHarness / getActivePromptForTask`
Cableado de pestaña: `frontend/src/pages/help/AgiProgressPage.jsx`
Cableado de barra lateral: `frontend/src/Sidebar.jsx` (entrada de nivel superior `agi-progress`, grupo `developer`, icono `bar-chart`)
i18n: bloque de nivel superior `homoVsAi.*` en `common.json` de **EN, NO y ES** (router, judge, scoreboard, future, **istqb**, demos.feedback*, **evolve.* (Fase E, 34 claves × 3 idiomas)**), más `help.agiTabs.homoVsAi` y `sidebar.agiProgress`

**Smoke**: `python -m backend.tests.smoke_prompt_evolution` ejecuta 8 comprobaciones que cubren la robustez de `_safe_parse_json`, el determinismo de `_score_output`, la compatibilidad hacia atrás de `get_active_prompt`, las transiciones de estado propose→reject, la degradación elegante del arnés de regresión, el registro del router y el valor por defecto de `ChallengeResponse.prompt_source` — todo sin requerir Mongo (mock-first) y sin requerir un LLM (vía auto-rechazo).

> **¿Lo vas a usar en SOCO?** Un checklist completo para el ponente (pre-vuelo, orden de ejecución de 45 minutos, qué hacer si se cae la conexión de la IA, exportación post-workshop) vive en [`docs/README_FULL.md` → Tab 4 → *How to run this in a live workshop*](docs/README_FULL.md#tab-4--homo-sapiens-vs-ki-i-test-soco-workshop-companion).

### AGI Hub — "Update with AI" (abril 2026)

Las tres pestañas del AGI Progress Hub tienen ahora un panel no destructivo **"Update information from the web with AI"**. Un clic ejecuta una búsqueda web en vivo (`websearch-backend` en el puerto 8080 → **fallback a DuckDuckGo** → solo-LLM best-effort) y pide al LLM configurado sugerencias estructuradas. Cada sugerencia se renderiza como una tarjeta con botones **Apply** / **Dismiss** — nunca se sobrescribe nada en silencio.

- **Tracker** → Apply persiste vía el `POST /api/agi/progress` existente (upsert), validando `sum(scores) == total`.
- **Possible Endings** → Apply es solo de sesión; acepta `quote` (sobrescribe la cita/atribución de un escenario), `pdoom` (añade una tarjeta P(doom)), o `reference` (añade una entrada de Sources). Todos los elementos aplicados por IA se etiquetan con un badge "AI" / "AI UPDATED".
- **Benefits of AGI** → Apply es solo de sesión; añade una nueva viñeta de ejemplo (con enlace a la fuente) a la categoría objetivo.

Backend: `backend/services/agi_ai_enrich_service.py`, `backend/routers/agi_ai_enrich.py` → `POST /api/agi/ai-enrich/{tracker|endings|benefits}`
Frontend: `frontend/src/pages/help/agi/AiSuggestions.jsx` (panel compartido) + cableado por pestaña en `AgiTracker.jsx`, `PossibleEndings.jsx`, `BenefitsOfAGI.jsx`
i18n: claves `ai.*` (EN/NO)

### AGI Progress Hub (abril 2026)

El "AGI Progress Tracker" de una sola página bajo Help se reestructuró en un hub de tres pestañas (estilo AgentOps) y el dataset se refrescó hasta 2026:

- **Pestaña 1 — AGI Progress Tracker**: marco inspirado en CHC de Hendrycks et al. (2025). Dataset ampliado de 2 a **5 modelos**: GPT-4 (2023) 27%, GPT-5 (2025) 58%, **Claude Opus 4.6 (2025) 61%**, **Gemini 3.1 Pro (2026) 61%**, **Claude Opus 4.7 (2026) 67%**. Cada modelo lleva notas de benchmark reales (GPQA Diamond, MATH-500, SWE-bench Verified/Pro, ARC-AGI-2). Long-Term Memory Storage permanece en 0 en todos los LLMs actuales — el cuello de botella arquitectónico del paper.
- **Pestaña 2 — Possible Endings for AGI**: visualización de iceberg con 12 posibles futuros de AGI en 3 zonas (Surface / Shallow / Deep), con filtro por zona y tarjetas por escenario.
- **Pestaña 3 — The Benefits of AGI**: tarjetas categorizadas (Salud, Ciencia, Educación, Productividad, Accesibilidad, etc.) con ejemplos concretos.
- **Endurecimiento del backend**: el seed `DEFAULT_DATA` es ahora idempotente (upsert por model+year), así que refrescar los valores por defecto ya no requiere borrar MongoDB; `POST /api/agi/progress` también hace upsert. Sincronización de dropdown/chart arreglada en el primer render.

Backend: `backend/routers/agi_progress.py`
Frontend: `frontend/src/pages/help/AgiProgressPage.jsx` (contenedor de pestañas) + `frontend/src/pages/help/agi/{AgiTracker,PossibleEndings,BenefitsOfAGI}.jsx`
Assets: `frontend/public/images/agi-endings-iceberg.png`
i18n: `help.agiHub`, `help.agiTabs`, `help.agiProgress`, `help.agiEndings`, `help.agiBenefits` en EN/NO
Fuente: ["A Definition of AGI" — Hendrycks et al. (Oxford–MIT–Cornell, CAIS, oct. 2025)](https://www.agidefinition.ai/paper.pdf)

### Installing the App in the Cloud (abril 2026)

Nuevo módulo de planificación de despliegue y preparación para la nube. Proporciona un banco de trabajo interactivo para migrar la plataforma a servicios cloud (Vercel + Google Cloud Run + MongoDB Atlas + Firebase Auth). Ubicado en la barra lateral después de "Future".

**Pack 1 — Shell de frontend (Cursor AI):**
- 4 pestañas interactivas: Overview, Target Architecture, Environment & Secrets, Smoke Tests & Monitoring
- Dashboard de puntuación de preparación con 6 tarjetas de sección y seguimiento de progreso
- Diagrama de flujo de arquitectura con tarjetas de servicio (5 servicios, 2 fases)
- Referencia de variables de entorno con copiar-al-portapapeles, clasificación secret/public/optional
- Checklist manual de pruebas de humo (5 capas: frontend, backend, auth, database, AI) con progreso por capa
- Guía de resolución de problemas con incidencias comunes de despliegue en la nube
- i18n EN/NO completa (92 claves con paridad perfecta)

**Pack 2 — Cimientos de backend + endurecimiento cloud (Claude Code):**
- **Servicio de backend**: `backend/services/cloud_install_service.py` — 7 métodos deterministas: status (inspección real del entorno), recomendación de arquitectura (3 niveles de presupuesto), plantilla de env (20 variables, 6 secretos, 3 ámbitos), checklist de despliegue (26 ítems), pruebas de humo (async, golpea endpoints reales vía httpx), línea base de coste (6 ítems), resolución de problemas (13 ítems, 5 categorías)
- **Router de backend**: `backend/routers/cloud_install.py` — 7 endpoints en `/api/cloud-install/*`
- **Esquemas tipados**: `backend/schemas/cloud_install.py` — 18 modelos Pydantic
- **Artefactos de despliegue**: `deployment/Dockerfile` (Python 3.11-slim, listo para Cloud Run) + `deployment/cloudrun.yaml` (spec Knative, escala 0-3, probes, referencias a Secret Manager)
- **Arreglos de preparación cloud**: CORS vía variable `ALLOWED_ORIGINS`, soporte de variable `MONGO_URI`, `/health` mejorado, endpoint `/ready` con ping a MongoDB
- **Conexión frontend-backend**: las 4 pestañas conectadas al backend real con fallback elegante si está offline
  - CloudOverview → `GET /api/cloud-install/status` (puntuación de preparación en vivo)
  - CloudTargetArchitecture → `POST /recommend-architecture` + `GET /cost-baseline` (panel de coste, orden de despliegue)
  - CloudEnvSecrets → `POST /generate-env-template` (banner de estadísticas en vivo, variables provenientes del backend)
  - CloudSmokeTests → `POST /run-smoke-tests` (runner de pruebas automáticas) + `GET /troubleshooting` (ítems en vivo con severidad)

Backend: `backend/routers/cloud_install.py`, `backend/services/cloud_install_service.py`, `backend/schemas/cloud_install.py`
Frontend: `frontend/src/cloud-install/` (5 componentes: InstallingAppInCloud, CloudOverview, CloudTargetArchitecture, CloudEnvSecrets, CloudSmokeTests)
Deployment: `deployment/Dockerfile`, `deployment/cloudrun.yaml`
i18n: 92 claves EN/NO con paridad total

### EA Second Brain Agent (abril 2026)

Implementación completa del agente Enterprise Architecture Second Brain basado en los documentos de visión orientados a OutSystems de Ketil. Gestión de portfolio, impact scoring, heatmap de tecnología, deprecation radar, insights potenciados por IA y consultas en lenguaje natural.

- **CRUD de portfolio**: crear/editar/borrar ítems de portfolio con stacks tecnológicos, niveles de criticidad (1-5), estados de ciclo de vida y seguimiento de EOL
- **Impact Scoring**: fórmula Ketil 6.0 — `ImpactScore = 0.40 * Relevance + 0.30 * Criticality + 0.20 * Freshness + 0.10 * Risk`
- **Technology Heatmap**: pipeline de agregación que muestra recuentos de uso de tecnología y niveles de riesgo
- **Deprecation Radar**: seguimiento de EOL ordenado por urgencia
- **Insights potenciados por IA**: insights generados por LLM con contexto de portfolio, flujo de estado (New → Acknowledged → In Progress → Resolved/Dismissed)
- **Consultas en lenguaje natural**: haz preguntas sobre el portfolio, obtén respuestas estructuradas con puntuaciones de confianza
- **Dashboard**: 6 tarjetas de estadística, Today's Insights, Deprecation Radar, Tech Heatmap, Lifecycle Distribution, Quick Actions
- **Datos semilla**: 8 ítems de portfolio noruegos, 6 ítems de watchlist, 5 source feeds, 7 insights realistas

Backend: `backend/services/ea_second_brain.py` (~500 líneas), `backend/routers/ea_second_brain.py` (24 endpoints en `/api/ea-brain/*`), `backend/models/ea.py` (15+ modelos Pydantic)
Frontend: `frontend/src/EASecondBrain.jsx` + `frontend/src/ea-agent/` (5 componentes de pestaña: Dashboard, Insights, Portfolio, Ask, Settings)
Seed: `backend/scripts/seed_ea_brain.py` — ejecutar con `python -m backend.scripts.seed_ea_brain`
MongoDB: 4 colecciones (`ea_portfolio_items`, `ea_watchlists`, `ea_source_feeds`, `ea_insights`)
i18n: 172 claves EN/NO con paridad total

### ATM V&V Test Copilot (abril 2026)

Nuevo módulo de agente que implementa un copiloto de pruebas potenciado por IA para flujos de verificación y validación de Gestión del Tránsito Aéreo (ATM/ATC) críticos para la seguridad. Ubicado en la barra lateral bajo "Future Item Agents".

- **Overview Dashboard**: estadísticas en vivo, indicador de salud del backend, Quick Actions interactivas y una cuadrícula de categorías de escenario clicable (navega al Scenario Builder con el tipo seleccionado pre-cargado)
- **Requirement Lab**: ingiere requisitos (6 tipos de fuente), los normaliza con IA en intent/conditions/constraints/expectedBehavior, luego genera diseños de prueba estructurados con casos positivos/negativos/borde, candidatos de automatización y preguntas abiertas
- **Scenario Builder**: genera matrices de escenarios ATM para 7 familias de escenario (detección de conflictos, traspaso de sector, actualización de trayectoria, vigilancia degradada, monitorización de conformidad, timing de alertas, fallback de contingencia) con niveles de riesgo configurables y parámetros personalizados
- **Run Analyzer**: sube artefactos de ejecución de prueba (logs, JSON, XML, salida de consola), diagnostica fallos con IA con propuestas de severidad, análisis de causa raíz (con niveles de confianza), áreas afectadas y próximos pasos sugeridos
- **Export**: exportación Markdown para diseños de prueba y matrices de escenario
- **Ejemplos precargados**: script semilla con 13 ejemplos realistas de ATM/ATC (5 requisitos, 3 diseños de prueba, 3 matrices de escenario, 2 análisis de ejecución de prueba) basados en las specs EUROCAE ED-153, DO-278A y EUROCONTROL STCA

Backend: `backend/services/atm_copilot.py`, `backend/routers/atm_copilot.py` (17 endpoints en `/api/atm-copilot/`)
Frontend: `frontend/src/AtmVvTestCopilot.jsx` + `frontend/src/atm-copilot/` (4 componentes de pestaña)
Seed: `backend/scripts/seed_atm_examples.py` — ejecutar con `python -m backend.scripts.seed_atm_examples`
MongoDB: 4 colecciones (`atm_requirement_bundles`, `atm_test_designs`, `atm_scenario_matrices`, `atm_test_runs`)
i18n: 120+ claves EN/NO con paridad total
Docs: `docs-md/Readme ATM Agent.md` (independiente) | `docs/ATM VV Test Copilot.docx` | `Presentation/ATM_VV_Test_Copilot_Presentation.pptx`

### Babel Library AI Intelligence (abril 2026)

Hoja de ruta de IA de 4 fases implementada por completo para el módulo Babel Library:

- **Fase 1 — Clasificación inteligente**: clasificación potenciada por LLM (11 dominios, 3 niveles de dificultad), etiquetado automático, embeddings de sentence-transformer (384d) y búsqueda híbrida (semántica 60% + keyword 40%)
- **Fase 2 — Recomendaciones personalizadas**: seguimiento de interacciones del usuario con decaimiento temporal, perfiles de aprendizaje, motor de recomendaciones de 4 señales (brecha de dominio, interés, tipo/dificultad, frescura) y rutas de aprendizaje generadas por IA
- **Fase 3 — Generación de contenido con IA**: una sola llamada al LLM por recurso genera resúmenes con puntos clave, 3 tipos de pregunta (opción múltiple, verdadero/falso, respuesta abierta) con mostrar/ocultar respuestas interactivo, y pistas de aprendizaje adaptativas (prerrequisitos, próximos pasos)
- **Fase 4 — Inteligencia predictiva**: análisis de tendencias con indicadores de momentum, previsión de demanda vs oferta, detección de brechas de conocimiento por usuario y distribución de expertise en la red — todo pura agregación de datos, sin llamadas al LLM

Backend: `backend/services/babel_intelligence.py`, `babel_predictive.py`, `learning_profile.py`, `recommendation_engine.py`
Routers: `backend/routers/babel_intelligence.py` (13 endpoints), `learning_profile.py` (5 endpoints)
Frontend: `frontend/src/BabelLibrary.jsx` — búsqueda con IA, recomendaciones, paneles de contenido, dashboard predictivo
i18n: 313 claves EN/NO con paridad total

### Módulo de Ciberseguridad (abril 2026)

Implementación completa de la plataforma de Ciberseguridad de 10 pestañas en 3 sprints:
- **Sprint 1**: Posture & Risk (puntuaciones de dominio NIST CSF 2.0, medidor de riesgo) + Vulnerabilities (escaneo real de npm/pip/secrets)
- **Sprint 2**: Compliance Tracker (22 controles, 5 frameworks, edición inline) + Secure Coding Coach (10 temas con lecciones ricas)
- **Sprint 3**: Incident Drills (6 escenarios con feedback paso a paso) + Knowledge Base (8 artículos + Q&A con IA)
- **Correcciones**: persistencia en MongoDB para Agent Security, escáneres de vulnerabilidades reales con fallback elegante

Backend: `backend/routers/cybersecurity.py` (1499 líneas) + `agent_security.py` (785 líneas)
Frontend: `frontend/src/cyber/` (11 componentes)

### Pruebas automáticas y validación de IA

El trabajo reciente en este repositorio se ha centrado en la **validación automática, la depuración asistida por IA y las pruebas de flujos de LLM impulsadas por herramientas**.

**Aspectos destacados:**
- **Pruebas del puente MCP**: validación de herramientas mediante flujos STDIO ↔ HTTP compatibles con Postman y clientes tipo MCP.
- **Flujo de depuración**: trazas, inspección de estado, resolución de problemas de conexión y diagnósticos reproducibles.
- **Iteración asistida por IA**: refinamiento rápido de prompts, estrategias y comportamiento del sistema mediante ciclos cortos de prueba/medida.
- **Documentación estructurada para humanos y agentes**: `docs/agents.md`, `docs/llms.txt`, `docs/TESTING.md`.

### Servidor MCP / Postman (J-messages Analyzer)

El puente MCP en `backend/mcp_bridge_server.py` traduce STDIO ↔ HTTP para que Postman pueda invocar herramientas como `analyze_j_melding` y `list_j_meldinger`.

**La resolución de problemas documentada incluye:**
- **Problemas de `cmd.exe` en Windows** cuando Postman arranca el proceso del puente.
- **Pruebas de fallback HTTP** vía `POST /api/mcp/j-messages/analyze`.
- **Verificación de PATH** para `cmd.exe` en entornos Windows.
- **Ejemplos de cURL** y patrones de petición reproducibles en [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).

**Servidor de archivos de prueba**: `python backend/test_mcp_server.py` en el puerto `8888`.

---

## 🧪 Pruebas

- **Backend**: `pytest` donde existan tests.
- **Frontend**: preservar el comportamiento de los componentes existentes.
- **Validación MCP / API**: [docs/MCP_TESTING_GUIDE.md](docs/MCP_TESTING_GUIDE.md), [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).
- **Docs de pruebas del proyecto**: [docs/TESTING.md](docs/TESTING.md).

---

*Workplace Learning With AI — Ignacio Tejera*
