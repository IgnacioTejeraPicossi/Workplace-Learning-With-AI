# Enonic 'Red Cross' — Ayuda

El agente **Enonic 'Red Cross'** es un asistente de conocimiento y pruebas para la instalación
**Enonic XP 8 / Content Studio 6** de la Cruz Roja Noruega. Lo encontrarás en la barra lateral
en **Item Agents → Enonic Red Cross**, justo debajo de Humanizing AI.

Te ayuda (a ti y a quien no conozca esta instalación) a entender la plataforma y el proyecto de
la Cruz Roja, y a preparar, explicar y resolver sus pruebas. **No** ejecuta pruebas, ni edita el
CMS, ni escribe en Azure DevOps — el **Red Cross Web QA Agent** sigue siendo el espacio de
ejecución y reporte.

## Qué hace

- Explica la plataforma Enonic con enlaces de documentación conscientes de la versión (XP 8 /
  Content Studio 6, separados del antiguo XP 7).
- Responde preguntas específicas del proyecto fundamentadas **solo** en una base de conocimiento
  curada y con fuentes — nunca inventa datos.
- Permite buscar en el catálogo de tests importado por id, título, persona, resultado y sprint.
- Redacta procedimientos de test manuales propuestos — claramente etiquetados, con ids de
  borrador locales, nunca ids de Azure DevOps inventados.

## Las pestañas

- **Resumen** — qué es el agente, la leyenda de evidencia y sus límites.
- **Asistente** — un chat fundamentado. Pregunta sobre la plataforma o la instalación y cómo
  probarla. Cada respuesta llega con fuentes citadas, un estado de evidencia (respaldado /
  parcial / insuficiente) y, cuando aplica, información que falta y una siguiente pregunta
  sugerida. Escribe tu pregunta (Ctrl/Cmd+Enter envía) o pulsa una sugerida.
- **Conocimiento** — los hechos curados que el asistente puede citar, cada uno etiquetado por
  nivel de evidencia con su fuente.
- **Catálogo de tests** — los casos importados. Filtra por texto, persona (Sluttbruker /
  Redaktør), resultado y sprint. **Pulsa el id de un caso** para saltar al Asistente con la
  pregunta «¿Cómo debo probar el caso N?» ya formulada.
- **Contexto del proyecto** — URLs del entorno, arquitectura, las coordenadas de Azure DevOps y
  las «incógnitas conocidas» por recopilar.

## Niveles de evidencia

Cada afirmación del asistente está etiquetada, para que sepas siempre cómo de sólida es:

- **Doc. plataforma** — documentación del producto Enonic.
- **Hecho del proyecto** — un hecho confirmado de esta instalación concreta.
- **Observación** — un resultado fechado y específico del entorno (no estado en vivo).
- **Receta de test** — un paso práctico destilado de ejecutar pruebas.
- **Sugerencia** — una propuesta general, no un hecho establecido del proyecto.

El asistente nunca presenta especulación como hecho, nunca dice que abrió Content Studio o
ejecutó un test, y nunca inventa pasos oficiales. Un «Passed/Active» pasado es una observación
de ese momento, no una afirmación sobre hoy.

## El catálogo de tests

El catálogo contiene los casos del equipo por sprint, importados del Test Plan de Azure DevOps
como **observaciones** (resultados registrados), no definiciones oficiales de pasos ni estado en
vivo. Los resultados se mapean así:

- **Passed → pass** ✅, **Failed → fail** ❌, **Blocked → blocked** ⛔, **Active (aún no
  ejecutado) → planned** 🗓️, y **partial** 🟡 cuando un caso pasó con matices.

Un mismo caso puede pertenecer a varias suites de sprint, así que el catálogo se indexa por
**(id del caso, sprint)** — el mismo id puede aparecer una vez por sprint. Algunos casos llevan
además una nota de una sesión de prueba práctica que va más allá del resultado oficial; la nota
explica el hallazgo.

## Lo que (todavía) no hace

No edita el CMS, no publica, no ejecuta tests ni escribe en Azure DevOps. Un borrador de test o
defecto generado no es un test ejecutado. La subida de documentos propios (un pipeline de
ingesta/aprobación) y conectores en vivo de solo lectura a Enonic / Azure DevOps se planean para
una versión posterior — ver `docs/enonic-red-cross-agent-plan.md`.

## Idiomas y configuración

El agente responde en inglés, noruego o español, según el idioma de la app. Usa la misma
configuración de LLM compartida que el resto de la app (en API Config); no necesita una clave
aparte. Si no hay modelo disponible, recurre a una respuesta provisional sin conexión,
claramente marcada.

## Añadir más datos de test

Los nuevos sprints se añaden ampliando el catálogo en
`backend/services/enonic_red_cross.py` (cada caso lleva su `sprint`). Como la Cruz Roja mantiene
Azure DevOps en privado, los datos de sprint se transcriben desde capturas, no se obtienen en
vivo.
