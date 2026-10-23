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
- La app usa por defecto un modelo **GRATIS**: `google/gemma-4-31b-it:free` ($0 por token).
- **"Modelo gratis" ≠ "sin clave".** OpenRouter sigue exigiendo una clave válida para autenticar **cada** petición. El modelo gratis solo significa que no te cobran por token — un **saldo de pago en $0 sirve** para los modelos `:free` (tienen **límites de uso**).
- Consigue una clave en **https://openrouter.ai/keys** → *Create Key* (cópiala una sola vez; empieza por `sk-or-v1-`). Una cuenta gratuita normalmente no necesita tarjeta para modelos `:free`.

### Solución de problemas
| Mensaje | Significado / solución |
|---|---|
| **"API key is required"** | No hay clave introducida ni guardada/en el servidor. Pega la clave → Save Keys. |
| **"Failed to fetch"** (al guardar) | El navegador no alcanzó el backend. Asegúrate de que el backend corre en `:8000`; reinicia el dev-server de React si hace falta. |
| **"OpenRouter library not installed"** | Código viejo del backend. **Reinícialo** (el código actual ya no necesita ese paquete). |
| **401 "User not found"** / **"Incorrect API key"** | Clave inválida o revocada para el proveedor elegido. **Genera una clave nueva** y guárdala. (Con OpenRouter, un 401 **no** se reintenta en otros modelos: con una clave mala fallarían todos igual.) |
| ✅ éxito con la nota *"the OpenAI field held an OpenRouter key sk-or-…; it was ignored…"* | El campo **OpenAI** del navegador tiene guardada una clave de **OpenRouter**. La app la ignora y usa la clave OpenAI del servidor (`.env`), así que **funciona**. Para quitar el aviso: borra el campo OpenAI o pon tu clave `sk-proj…` → **Save Keys**. |
| **"This looks like an OpenRouter key (sk-or-...), not an OpenAI key"** | Igual que el caso anterior, pero el servidor **no** tiene `OPENAI_API_KEY`. Pon una clave de OpenAI de verdad, o elige el proveedor OpenRouter. |
| **"This looks like an OpenAI key (sk-...), not an OpenRouter key"** | Has puesto una clave de OpenAI en el campo de OpenRouter. Pon tu clave `sk-or-v1-…`. |
| **429 "temporarily rate-limited"** | El pool compartido del modelo gratis está saturado. El backend **reintenta automáticamente con otros modelos gratis** (Google → Poolside → NVIDIA), así que suele resolverse solo; si todos están ocupados, espera un minuto o pon `OPENROUTER_MODEL` a otro modelo `:free`. |
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
| OpenRouter | `OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` |

`get_optimal_model(task_type, complexity)` mapea `complexity` (`low`/`medium`/`high`/`frontier`) a un nivel. **Frontier** (GPT-6 Astra) es **solo opt-in** — p. ej. el desplegable "AI Level" del Analizador J-messages envía `complexity=frontier`; nunca es un valor por defecto (cuesta ~5× el nivel alto).

### Cómo se hacen las llamadas (`backend/llm.py`)
- Punto de entrada: `ask_ai_unified` / `ask_ai_unified_sync(prompt|messages, task_type, complexity, max_tokens, request_headers)`.
- Los **modelos de razonamiento** (`gpt-5*`, `gpt-6*`, `o1*`, `o3*`) se detectan por prefijo en DOS sitios (`_normalize_params_for_model` → `max_completion_tokens` + quitar temperatura; y el retry de contenido vacío). **Cualquier ID nuevo `gpt-6`/`gpt-7` debe estar cubierto por esos prefijos** o devolverá vacío/errores.
- Las llamadas a **OpenRouter** usan el **SDK de OpenAI apuntando a OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — sin paquete `openrouter` aparte. Se llaman como modelos estándar → `max_tokens` + temperatura. (El catálogo marca casi todos los `:free` como "reasoning"-capaces, pero con `max_tokens` funcionan; verificado 2026-10-23.)
- Todas las llamadas a OpenRouter (`ask_openrouter` y el botón Test API) pasan por `_openrouter_create_with_fallback()` → ver *Fallback entre modelos gratis* abajo.

### Dónde viven las claves (precedencia)
Una clave se resuelve en este orden (gana la primera no vacía):
1. **Por petición** — campo del navegador / cabecera `x-openai-key` / `x-openrouter-key`.
2. **Entorno** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (del `.env`).
3. **Config guardada** — `api_config.json` en la raíz del repo, escrito por **Save Keys** (`backend/api_config_storage.py`). Este fallback (añadido 2026-10) es lo que hace que una clave guardada **se use de verdad** en las llamadas, no solo que se almacene.

**Regla anti-cruce de proveedores** (2026-10): una clave `sk-or-` **nunca** se envía a OpenAI.
- `llm.get_api_config_from_headers`: si la cabecera `x-openai-key` es `sk-or-…`, se ignora y se usa `.env` / config guardada.
- `/api/test-api` (provider `openai`): hace lo mismo y lo avisa en el mensaje; solo da error si no queda ninguna clave OpenAI.
- `/api/test-api` (provider `openrouter`): una clave `sk-…` que no sea `sk-or-` se rechaza con un 400 claro.
- Causa típica: el navegador guarda los campos en `localStorage` (`openaiKey`, `openrouterKey`), así que una clave pegada en el campo equivocado se queda ahí hasta que la borras y pulsas Save Keys.

El módulo API Config (`frontend/src/APIConfig.jsx`) elige el **proveedor** y guarda las claves; usa la **base absoluta del backend** (`REACT_APP_API_BASE_URL` → por defecto `http://localhost:8000`), como el resto de módulos.

### Gestionar una deprecación de modelo de OpenAI
1. Mira el reemplazo recomendado en https://developers.openai.com/api/docs/deprecations.
2. Cambia la línea en `gpt5_config.py` (o la variable de entorno). Las referencias hardcodeadas del modelo low en `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` ya importan `OPENAI_LOW_MODEL`, así que el default se propaga.
3. Si el ID nuevo es de una familia con prefijo nuevo, amplía la detección de modelos de razonamiento en `llm.py`.

Historial: `gpt-5.4-nano` fue deprecado (apagado 2027-04-01) → reemplazado por `gpt-6-luna`.

### Cambiar el modelo gratis de OpenRouter
El catálogo gratis de OpenRouter es **volátil** (p. ej. `nex-agi/nex-n2-pro:free` fue retirado). Para cambiarlo: pon la env `OPENROUTER_MODEL`, o cambia el default en `gpt5_config.py`. Encuentra modelos gratis vivos con `GET https://openrouter.ai/api/v1/models` (sin clave) filtrando `id` que acabe en `:free` con precio `$0`.

### Fallback entre modelos gratis
Los modelos `:free` comparten pools de límite por proveedor y dan 404/429 a menudo. `_openrouter_create_with_fallback(client, messages, params, primary_model)` en `backend/llm.py`:
1. Prueba `OPENROUTER_MODEL` y luego cada modelo de `OPENROUTER_FREE_FALLBACKS` (sin repetir), en orden.
2. **Error de autenticación primero** (`401`, `user not found`, `unauthorized`, `invalid api key`) → se lanza ya, sin reintentar. Va antes porque el 401 de OpenRouter dice "User not found", que si no coincidiría con el marcador genérico "not found".
3. **Error transitorio** (`429`, `404`, `rate-limit`, `temporarily`, `provider returned error`, `not found`, `no endpoints`) → siguiente modelo.
4. Cualquier otro error → se lanza ya. Si fallan todos → se lanza el último error.
5. Devuelve `(response, model_used)`; el Test API muestra *"default model was rate-limited; used free fallback X"* cuando no respondió el modelo por defecto.

Lista por defecto (`gpt5_config.py`), un proveedor distinto en cada paso para no depender de un solo pool:

| Orden | Modelo | Proveedor |
|---|---|---|
| 1 | `google/gemma-4-31b-it:free` (= `OPENROUTER_MODEL`) | Google |
| 2 | `poolside/laguna-s-2.1:free` | Poolside |
| 3 | `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA |

Sustituible sin código con `OPENROUTER_FREE_FALLBACKS=modelo1,modelo2,...` en `.env` (ver `.env.example`).

### Comprobar un modelo gratis antes de añadirlo
1. **Que exista**: `GET https://openrouter.ai/api/v1/models` (sin clave) y busca el `id` exacto. *Ejemplo real:* `minimax/minimax-m3.1-flash:free` funcionaba el 2026-10-22 y OpenRouter lo **retiró** al día siguiente — desde entonces se saltaba en silencio. El catálogo gratis cambia de un día para otro.
2. **Que responda de verdad** con una llamada pequeña (como el Test API: `max_tokens=50`) usando tu clave. Significado de los errores:
   - **403 "only available on agentic harnesses"** → no sirve para esta app (p. ej. `thinkingmachines/inkling:free`).
   - **429** → existe pero ahora está saturado; vale como fallback.
   - **404 / "No endpoints"** → retirado o sin proveedor activo.
3. Actualiza `gpt5_config.py` + `.env.example` + esta ayuda (3 idiomas) + `CHANGELOG`.

### Tests (offline, en CI)
- `backend/tests/test_openrouter_fallback.py` — fallback (éxito directo, 404/429 → siguiente, 401 sin reintento, todos fallan, sin duplicados), mensaje del Test API y regla anti-cruce de claves.
- `backend/tests/test_api_test_fallback.py` — Test API usa la clave del `.env` si el campo está vacío.
- Ejecutar: `python -m pytest backend/tests/test_openrouter_fallback.py backend/tests/test_api_test_fallback.py -q`
- Prueba en vivo (usa la clave guardada en el servidor): `POST http://localhost:8000/api/test-api` con `{"provider":"openrouter","openrouterKey":""}` o `{"provider":"openai","openaiKey":""}`.

### Historial de cambios (2026-10)
| Commit | Fecha | Cambio |
|---|---|---|
| `47759e7` | 2026-10-22 | Regla anti-cruce `sk-or-` ↔ OpenAI. Modelo gratis por defecto: `nvidia/nemotron-3-super-120b-a12b:free` → `google/gemma-4-31b-it:free`. |
| `467a9bc` | 2026-10-22 | `_openrouter_create_with_fallback` + `OPENROUTER_FREE_FALLBACKS`; el Test API indica qué fallback respondió. |
| `46bc7d7` | 2026-10-23 | Arreglo: un 401 se reintentaba en todos los modelos. Tests nuevos + CI, `.env.example`, CHANGELOG `[1.45.6]`. |
| `47e3a9f` | 2026-10-23 | Fallback `minimax/minimax-m3.1-flash:free` (retirado de OpenRouter) → `poolside/laguna-s-2.1:free`. |
| `f9647ec` | 2026-10-23 | Test API (OpenAI) ignora una clave `sk-or-` del campo y usa la clave del servidor, en vez de fallar. |
