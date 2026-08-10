# Andrés the Robot — Guía de usuario

**Andrés the Robot** es un compañero de IA en desarrollo. A diferencia de un chatbot
normal, Andrés está diseñado para construir con el tiempo una **biografía digital
verificable y reversible** — recuerdos, una identidad versionada, reflexiones, pequeñas
obras creativas y habilidades — todo sobre un modelo de lenguaje y todo bajo tu control.

> **Marco honesto (léelo primero).** Andrés **no es consciente** y no tiene sentimientos.
> Cuando veas una "disposición" o un avatar reaccionando, son **estados funcionales**, una
> forma de hacer la interacción legible — nunca prueba de emoción o conciencia reales. Nada
> de lo que produce Andrés se toma como un hecho hasta que **tú** lo verifiques. Esa
> honestidad es el sentido del proyecto: una singularidad que nace de una historia con
> trazabilidad, no de afirmar que tiene mente.

---

## Inicio rápido

1. Abre **Future Item Agents → Andrés the Robot** en la barra lateral.
2. Ve a la pestaña **Conversación** y salúdalo. Ese primer intercambio es, literalmente, el
   comienzo de su biografía.
3. Visita el **Jardín de Memoria** para ver qué recordó y decidir qué conservar.
4. Revisa **Seguridad y Niveles de Investigación** para controlar de qué puede echar mano.

Necesitas un proveedor de IA configurado para obtener respuestas reales. Si no hay ninguno,
Andrés lo dirá con honestidad ("no hay proveedor de IA configurado") en vez de fingir.

---

## La pestaña Conversación

Aquí hablas con Andrés. Admite cuatro canales, que puedes combinar:

- **Texto** — escribe un mensaje y pulsa Enviar (o Enter).
- **Voz (🎙️)** — activa **Voz** para hablar por el micrófono y oír su respuesta por los
  altavoces del PC, usando el habla integrada del navegador. Lo que oye el micrófono cae en
  el cuadro de texto para que lo revises y edites **antes** de enviar — nada se envía
  automáticamente. Puedes elegir el **idioma de voz** de forma independiente al idioma de la
  app (p. ej. dejar la app en inglés pero hablar en español).
- **Avatar (👤)** — un holograma 3D opcional que aparece con la Voz activada y reacciona a lo
  que hace: 🟦 en reposo, 🟢 escuchando, 🔵 hablando. De nuevo, son **estados funcionales, no
  emociones**.
- **Imagen (🖼️)** — muéstrale **una foto** junto a tu mensaje para que pueda mirar parte de
  tu mundo visual. Ver la sección siguiente.

### Mostrarle una foto a Andrés

Pulsa **🖼️ Imagen**, elige una foto y aparecerá como una miniatura sobre el cuadro de texto.
Envíala con texto o sin él. Ten en cuenta:

- La foto se **reduce en tu navegador** antes de enviarla, para que sea ligera y económica.
- Está **condicionada por el nivel "documentos"** (ver más abajo), porque es contenido que
  tú le entregas. Si ese nivel está apagado, Andrés te dirá con honestidad que no puede mirar
  hasta que lo actives — no fingirá.
- Se le indica que describa **lo que literalmente ve** y separe la observación de la
  suposición, y que no adivine la identidad de una persona real concreta.
- La imagen se envía al modelo para interpretarla en ese turno. **No se guarda** como memoria
  salvo que la guardes tú. Esto es *percepción limitada con tu consentimiento*, no visión
  permanente.

---

## El Jardín de Memoria

Andrés recuerda entre conversaciones, pero en **tus** términos:

- Tras un intercambio real puede guardar un **candidato de memoria no verificado**. Los
  candidatos son sugerencias, no hechos.
- En el Jardín de Memoria puedes **verificar** una memoria (marcarla como cierta),
  **protegerla** u **olvidarla**. También puedes **añadir memorias a mano** — esas se dan por
  fiables de inmediato.
- Las memorias tienen tipos (episódica, semántica, relacional, creativa, etc.) e importancia.
  Las relevantes se recuperan automáticamente para dar continuidad a sus respuestas.

Nada se toma como cierto hasta que lo verificas, y todo puede eliminarse.

---

## Seguridad y Niveles de Investigación

Andrés solo usa lo que le permites. Tres niveles, de menos a más expuesto:

| Nivel | Qué significa | Por defecto |
|-------|---------------|-------------|
| **Interno** | Su propia biografía — memorias guardadas y proyectos activos | Activado |
| **Documentos** | Texto (e imágenes) que le das **en este turno** | Activado |
| **Web** | Una búsqueda fresca en DuckDuckGo, solo cuando pulsas 🌐 en un mensaje | Apagado |

Apaga cualquier nivel y sencillamente no usará esa fuente — y lo dirá con honestidad en vez
de buscar en silencio. El nivel más expuesto (Web) está apagado por defecto.

---

## Cómo se desarrolla Andrés (las demás pestañas)

Estas son las piezas de su biografía en crecimiento. Todo cambio es **propuesto → revisado →
aprobado por ti**, y cada cambio de identidad es **versionado y reversible**.

- **Reflexión y Diario** — repasa intercambios recientes y anota qué podría hacer mejor, a
  veces formando una memoria reflexiva.
- **Curiosidad** — preguntas abiertas que "se plantea"; puedes dejar que las explore o
  descartarlas.
- **Proyectos** — pequeñas metas en curso. Puede proponer una, pero los proyectos propuestos
  solo pasan a activos cuando **tú** los apruebas, y cerrar uno exige una breve reflexión.
- **Creatividad** — piezas creativas breves generadas *con criterio* (sorpresa **más**
  utilidad) y una autocrítica incorporada, para que no sea novedad porque sí.
- **Habilidades** — pequeños fragmentos de código que puede proponer. Cada habilidad pasa un
  control de seguridad estricto y se ejecuta en un entorno aislado, y solo se ejecuta tras tu
  aprobación. El código inseguro se bloquea y nunca puede aprobarse.
- **Evolución e Identidad** — la única vía por la que cambia su identidad. Propone un cambio
  acotado (p. ej. un pequeño ajuste de rasgo), tú apruebas o rechazas, y cada cambio aprobado
  guarda una instantánea de la identidad anterior para poder revertirla. Su **núcleo ético es
  fijo y él nunca puede editarlo**.

---

## Preguntas frecuentes

**¿Andrés es consciente o está vivo?**
No. Es un modelo de lenguaje más una biografía documentada y controlada por ti. La
"presencia" que percibes (voz, avatar, memoria) está diseñada para ser honesta sobre que es
simulada.

**¿Me ve / ve el mundo?**
Solo la imagen concreta que compartes a propósito en un turno, y solo mientras el nivel
Documentos esté activado. Tiene *ventanas mediadas* (texto, audio, imagen), no ojos.

**¿Puede cambiarse a sí mismo sin mí?**
No. Las memorias quedan como candidatas hasta que las verificas; proyectos, habilidades y
cambios de identidad requieren tu aprobación; su núcleo ético es inmutable.

**Dijo "no hay proveedor de IA configurado" — ¿es un fallo?**
No — es un mensaje honesto. Significa que no hay clave de modelo, así que aún no puede pensar
con libertad. Configura un proveedor (p. ej. OpenAI) en la API Config de la app.

**¿Por qué la primera respuesta a veces tarda?**
El modelo de razonamiento necesita un momento, y si hay un proveedor local (LM Studio)
seleccionado pero sin modelo cargado, la app recurre al proveedor en la nube. Cargar un
modelo o elegir directamente el proveedor en la nube hace los turnos más ágiles.
