# Configuración de API — Guía de usuario y mantenimiento

**API Config** es el centro de mando que decide qué backend de IA alimenta a **todos** los agentes de la app. Eliges un proveedor, le das una clave, lo pruebas, y todos los módulos (Andrés, Red Cross QA, J-messages, etc.) enrutan sus llamadas de IA a través de él.

---

## Parte 1 — Para usuarios

### Los cuatro proveedores
- 🏠 **ItemAI API** — servidor LM Studio local (`http://localhost:1234`). Gratis, offline, privado.
- 🖥️ **ItemServerAI API** — servidor LM Studio en tu red. Gratis.
- 🚀 **OpenAI API** — modelos de OpenAI directos (calidad premium, de pago). Necesita clave de OpenAI (`sk-...`).
- 🌐 **OpenRouter API** — una clave, muchos proveedores, **incluidos modelos gratis**. Necesita clave de OpenRouter (`sk-or-v1-...`).

### Cómo configurarlo
1. **Selecciona el proveedor** (las tarjetas de arriba).
2. Pega la **clave de API** correspondiente en el campo.
3. **💾 Save Keys** — se guarda en tu navegador **y** en el servidor.
4. **Reinicia el backend** para que cargue el código/configuración actual.
5. **🧪 Test API** — confirma que la conexión real funciona.

> "Guardado correctamente" solo confirma el **guardado**. El resultado verde de **Test API** confirma la **conexión**.

### OpenRouter + modelos gratis
- La app usa por defecto un modelo **GRATIS**: `nvidia/nemotron-3-super-120b-a12b:free` ($0 por token).
- **"Modelo gratis" ≠ "sin clave".** OpenRouter sigue exigiendo una clave válida para autenticar **cada** petición. El modelo gratis solo significa que no te cobran por token — un **saldo de pago en $0 sirve** para los modelos `:free` (tienen **límites de uso**).
- Consigue una clave en **https://openrouter.ai/keys** → *Create Key* (cópiala una sola vez; empieza por `sk-or-v1-`). Una cuenta gratuita normalmente no necesita tarjeta para modelos `:free`.

### Solución de problemas
| Mensaje | Significado / solución |
|---|---|
| **"API key is required"** | No hay clave introducida ni guardada/en el servidor. Pega la clave → Save Keys. |
| **"Failed to fetch"** (al guardar) | El navegador no alcanzó el backend. Asegúrate de que el backend corre en `:8000`; reinicia el dev-server de React si hace falta. |
| **"OpenRouter library not installed"** | Código viejo del backend. **Reinícialo** (el código actual ya no necesita ese paquete). |
| **401 "User not found"** | La **clave de OpenRouter es inválida/revocada** (no es falta de crédito — eso sería 402). **Genera una clave nueva** y guárdala. |
| Respuestas enlatadas / `[MOCKED RESPONSE]` | No llegó una clave válida al proveedor → cayó al mock offline. Revisa la clave + reinicia. |

---

## Parte 2 — Para mantenimiento (y cambios futuros)

### Dónde se eligen los modelos
`backend/gpt5_config.py` es la única fuente de verdad. Todos son **sustituibles por variable de entorno** (sin tocar código):

| Nivel | Constante / env | Por defecto (2026-10) |
|---|---|---|
| Low | `OPENAI_LOW_MODEL` | `gpt-6-luna` |
| Medium | `OPENAI_MEDIUM_MODEL` | `gpt-5.4-mini` |
| High | `OPENAI_HIGH_MODEL` | `gpt-5.5` |
| Frontier (opt-in) | `OPENAI_FRONTIER_MODEL` | `gpt-6-astra` |
| OpenRouter | `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` |

`get_optimal_model(task_type, complexity)` mapea `complexity` (`low`/`medium`/`high`/`frontier`) a un nivel. **Frontier** (GPT-6 Astra) es **solo opt-in** — p. ej. el desplegable "AI Level" del Analizador J-messages envía `complexity=frontier`; nunca es un valor por defecto (cuesta ~5× el nivel alto).

### Cómo se hacen las llamadas (`backend/llm.py`)
- Punto de entrada: `ask_ai_unified` / `ask_ai_unified_sync(prompt|messages, task_type, complexity, max_tokens, request_headers)`.
- Los **modelos de razonamiento** (`gpt-5*`, `gpt-6*`, `o1*`, `o3*`) se detectan por prefijo en DOS sitios (`_normalize_params_for_model` → `max_completion_tokens` + quitar temperatura; y el retry de contenido vacío). **Cualquier ID nuevo `gpt-6`/`gpt-7` debe estar cubierto por esos prefijos** o devolverá vacío/errores.
- Las llamadas a **OpenRouter** usan el **SDK de OpenAI apuntando a OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — sin paquete `openrouter` aparte. Los modelos de OpenRouter son estándar (no de razonamiento) → mantienen `max_tokens` + temperatura.

### Dónde viven las claves (precedencia)
Una clave se resuelve en este orden (gana la primera no vacía):
1. **Por petición** — campo del navegador / cabecera `x-openai-key` / `x-openrouter-key`.
2. **Entorno** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (del `.env`).
3. **Config guardada** — `api_config.json` en la raíz del repo, escrito por **Save Keys** (`backend/api_config_storage.py`). Este fallback (añadido 2026-10) es lo que hace que una clave guardada **se use de verdad** en las llamadas, no solo que se almacene.

El módulo API Config (`frontend/src/APIConfig.jsx`) elige el **proveedor** y guarda las claves; usa la **base absoluta del backend** (`REACT_APP_API_BASE_URL` → por defecto `http://localhost:8000`), como el resto de módulos.

### Gestionar una deprecación de modelo de OpenAI
1. Mira el reemplazo recomendado en https://developers.openai.com/api/docs/deprecations.
2. Cambia la línea en `gpt5_config.py` (o la variable de entorno). Las referencias hardcodeadas del modelo low en `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` ya importan `OPENAI_LOW_MODEL`, así que el default se propaga.
3. Si el ID nuevo es de una familia con prefijo nuevo, amplía la detección de modelos de razonamiento en `llm.py`.

Historial: `gpt-5.4-nano` fue deprecado (apagado 2027-04-01) → reemplazado por `gpt-6-luna`.

### Cambiar el modelo gratis de OpenRouter
El catálogo gratis de OpenRouter es **volátil** (p. ej. `nex-agi/nex-n2-pro:free` fue retirado). Para cambiarlo: pon la env `OPENROUTER_MODEL`, o cambia el default en `gpt5_config.py`. Encuentra modelos gratis vivos con `GET https://openrouter.ai/api/v1/models` (sin clave) filtrando `id` que acabe en `:free` con precio `$0`.
