# Red Cross Web QA Agent — Guía de usuario

El **Red Cross Web QA Agent** es un copiloto de QA 24/7 para la reconstrucción de **rodekors.no** (CMS Enonic XP + front en NextJS). Ayuda al equipo a probar el front, las APIs, el CMS, el rendimiento, la accesibilidad, el SEO, la seguridad, la calidad de contenido y la preparación para la release — y a convertir los resultados en scripts, informes y work items de Azure DevOps.

Es **mock-first**: cada pestaña funciona sin conexión con datos de ejemplo realistas, así que puedes explorarla sin sitio en vivo ni claves de API. Cuando hay un backend/sitio real disponible, lo usa en su lugar.

> ⚠️ **La IA se usa solo como apoyo.** Los datos personales reales, los datos de producción y las claves de API **no** deben ir a la IA. Acepta el aviso de la app antes de ejecutar acciones asistidas por IA.

## Inicio rápido
1. Elige un **Entorno** (arriba a la derecha): `Local` o `Test`.
2. Elige un **Modo de ejecución**: **Generar scripts e informes** (produce artefactos que ejecutas en Cursor / Claude / GitHub Actions) o **Ejecutar directamente** (corre Playwright / Cypress / axe / Lighthouse / k6 dentro de la app cuando la herramienta está disponible).
3. Abre la pestaña que necesites, fija la **URL** objetivo (o pulsa un chip de preset) y ejecuta.
4. Revisa el resultado; los hallazgos pueden enviarse a **Azure DevOps** y resumirse en un **Informe de Sprint**.

## URLs objetivo (presets)
Chips de un clic que fijan el objetivo de una ejecución:
- ❤️‍🩹 **rodekors.no** — producción.
- 🧪 **next.lunix.cloud** — preview de Tom con NextJS + Enonic XP + GraphQL (movido desde `test.lunix.cloud` el 2026-09-28). El mejor objetivo de smoke para las comprobaciones específicas de Enonic.
- 💻 **localhost:3000** — tu build de desarrollo local.

## Las pestañas de un vistazo
| Pestaña | Qué hace |
|---|---|
| 📊 Dashboard | Resumen, estado de conexión/backend, accesos rápidos |
| 📋 Test Plan | Genera un plan de pruebas desde un work item de Azure DevOps + criterios de aceptación |
| 🎭 Playwright | Genera / ejecuta specs de Playwright (integrado con Storybook — el E2E preferido por Tom) |
| 🌲 Cypress | Genera / ejecuta specs de Cypress (ad-hoc / sin Storybook) |
| 🔌 API QA | Analiza endpoints, exporta una colección Postman, ejecuta introspección GraphQL |
| 📝 CMS QA | Casos de prueba de Enonic Content Studio (preview vs publicado, ISR, enlaces rotos…) |
| 📑 Forms QA | Comprobaciones de formularios (donación / voluntariado / contacto) + hallazgos |
| 📦 Migration | Auditoría de migración CMS antiguo → Enonic XP (mapeo, æøå, 301s, procedencia) |
| ♿ Accessibility | axe-core + Lighthouse + checklist manual + scripts de lector de pantalla, WCAG 2.1 / 2.2 AA |
| ⚡ Performance | Core Web Vitals + rendimiento específico de Enonic (waterfall GraphQL / N+1 / over-fetch) |
| 🎨 Designsystemet | Puntuación de cumplimiento del Designsystemet de Digdir + desviaciones |
| 🔐 Role Matrix | Auditoría de roles / permisos (ACL) en todo el sitio |
| 🔥 Stress Test | Carga con k6 / Loadster + comprobaciones de resiliencia (VU de ruptura, recuperación, deriva) |
| 🛡️ Security & Privacy | Escaneo de seguridad + workbench de checklist GDPR / DPIA |
| 🎯 Azure DevOps | Parsea items pegados, trae un sprint, crea work items, despacha un bundle |
| 📈 Sprint Report | Genera automáticamente el informe por sprint de Trine (estado, desviaciones, recomendaciones) |
| ✅ UAT Support | Material de apoyo para las pruebas de aceptación de usuario |
| 🎲 Risk Matrix | Análisis de riesgo (probabilidad × impacto) |
| 📜 Runs | Historial de cada ejecución — reabre resultados anteriores |
| ⚙️ Settings | Entorno, modo de ejecución, configuración de sprint, líneas base |

## Modos de ejecución
- **Generar scripts e informes** — el agente escribe los artefactos (specs de Playwright / Cypress, scripts de k6, colecciones de Postman, informes) para que los ejecutes en tu propio pipeline (Cursor, Claude, GitHub Actions). No se ejecuta nada contra el sitio.
- **Ejecutar directamente** — cuando la herramienta está disponible, el agente corre la comprobación en la app (Lighthouse, axe, Playwright, k6…) y muestra resultados en vivo. Si falta una herramienta, cae a datos mock y lo indica.

## Señales de Enonic XP
Varias pestañas muestran señales extra alineadas con las buenas prácticas de Enonic XP:
- 🧩 **Badge de patrón (skill)** — enlaza un hallazgo con una sección de un doc de skills (p. ej. `security-patterns.md §2`).
- 🔗 **Herramientas y specs relacionadas** — dónde encontrar el endpoint / spec relevante.
- **Puntuación compuesta** (0–100) y **▲ delta vs línea base** — seguimiento de tendencia entre ejecuciones.

Son informativas y aparecen solo cuando el backend las provee (Accessibility, Performance, Role Matrix, Forms QA, Designsystemet, Stress Test).

## Contexto del equipo (Tom y Trine)
- **Tom (Tech leder, Røde Kors)** — la reconstrucción es NextJS + Enonic XP + Guillotine GraphQL; los componentes viven en **Storybook** con **Playwright** (usado en vez de Cypress); **Postman** es la forma preferida de trastear GraphQL. Los banners de consejo de Tom aparecen en las pestañas relevantes.
- **Trine (Testleder)** — la **Teststrategi** rige las severidades (Sev 1–4 en desarrollo, Kat A–C en operación) y exige un **informe por sprint**, que la pestaña Sprint Report automatiza.

## Flujo de Azure DevOps
Pega un work item o trae un sprint, convierte los hallazgos en work items, previsualiza el bundle de acciones y luego crea los items o despacha el bundle. El despacho **registra** la intención; no muta sistemas externos por sí solo.

## Preguntas frecuentes
- **¿Necesito un sitio en vivo o una clave de API?** No — es mock-first; todo funciona sin conexión con datos de ejemplo.
- **¿Adónde fue `test.lunix.cloud`?** Se movió a **`next.lunix.cloud`** (2026-09-28). El informe de ejemplo fechado conserva su nombre original.
- **¿Se envían mis datos a la IA?** Solo lo que escribas. Mantén datos personales / de producción reales y claves de API fuera de las entradas a la IA (ver el aviso).
- **¿Dónde están los resultados pasados?** En la pestaña **Runs**.
