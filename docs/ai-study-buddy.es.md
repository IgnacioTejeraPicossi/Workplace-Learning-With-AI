# Compañero de estudio IA — cómo funciona

El **Compañero de estudio IA** (Ayuda → *Compañero de estudio IA*) es un
asistente dentro de la app que responde preguntas sobre **esta aplicación** —
*Workplace Learning With AI (WLWAI)*—: sus módulos, sus agentes, sus
funcionalidades y cómo usarlas. Se apoya en la propia documentación del proyecto,
así que no debería inventarse funcionalidades.

## Qué conoce (su contexto)

En cada pregunta, el Compañero arma un contexto con estas fuentes y lo envía al
modelo de lenguaje junto con tu pregunta:

1. **Resumen de la app** — un mapa compacto del repositorio (`docs/llms.txt`):
   qué es la app, sus servicios, puertos y reglas. Siempre incluido.
2. **Catálogo de agentes** — la lista completa de agentes (nombre + descripción
   corta) desde `/api/agents/catalog`. Siempre incluido, para poder responder
   "¿qué agentes tiene la app?".
3. **Secciones de ayuda relevantes** — las secciones de los documentos de ayuda
   más relevantes para *tu pregunta concreta* (ver *Cómo busca la información*).
4. **Extracto del README** — el inicio del README, añadido cuando la casilla
   **Usar contexto del README** está activada (activada por defecto).

## Cómo busca la información (recuperación)

El Compañero hace una **búsqueda ligera por palabra clave** sobre un conjunto
curado de documentos de ayuda — `README.md`, `architecture`, `deployment`,
`agents`, `admin-dev`, `n8n`, `J-messages_Analyzer`, `MCP_TESTING_GUIDE`,
`TESTING`— mediante el endpoint `GET /api/help/search`. El proceso:

- trocea cada documento en secciones por encabezado, en tu idioma (es/no/en);
- puntúa las secciones por coincidencia de palabras clave con tu pregunta, dando
  **más peso al encabezado** y limitando la puntuación del cuerpo para que un
  documento largo no gane solo por su longitud;
- normaliza acentos (`cómo` → `como`) y compara **raíces** de palabra
  (`despliega` → encuentra `despliegue`);
- devuelve las secciones más relevantes más un **índice** de los documentos.

Esas secciones se inyectan en el contexto, por lo que las respuestas pueden citar
contenido real (ficheros, comandos, pasos) de la documentación.

## Controles

- **Usar contexto del README** (casilla) — incluye un extracto del README.
  Activada por defecto. El recuadro de vista previa muestra las primeras líneas
  del README en tu idioma.
- **Agente** (desplegable) — elige un único agente para obtener una respuesta
  **enfocada** solo en ese agente. Déjalo en *Selecciona un agente…* para
  preguntas generales.

## Presentación

El campo de escritura está **encima** del panel de respuestas. Tu pregunta se
mantiene en el campo tras enviarla (no se borra) y **no** se repite dentro del
panel de respuestas — así nunca aparece duplicada. Las respuestas salen en el
panel de abajo.

## Consejos — buenas preguntas

- "¿Qué agentes tiene esta app?"
- "¿Cómo se despliega la app en la nube?"
- "¿Cómo funciona la arquitectura / el backend?"
- "¿Cómo configuro n8n?"
- "Explícame el J-messages Analyzer" (o elígelo en el desplegable de Agente)

## Limitaciones

- Responde **solo a partir de la información documentada**. Si algo no está
  escrito en los docs, lo dirá en vez de inventarse la respuesta.
- La búsqueda por palabra clave **no** cruza idiomas: una pregunta en un idioma
  puede no casar con un documento que solo existe en otro. Los docs curados
  localizados cubren los casos comunes; una recuperación cross-lingüe total
  requeriría embeddings, que el proyecto evita para no añadir dependencias
  pesadas.
- Las respuestas completas necesitan un modelo de IA conectado (el Compañero usa
  `/llm-stream`). Sin él, las respuestas son genéricas.
