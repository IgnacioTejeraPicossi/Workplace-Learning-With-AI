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

**Tu propio Andrés.** Al iniciar sesión, la biografía de Andrés es **privada de tu cuenta** —
cada persona hace crecer su propio Andrés; las memorias y la identidad nunca se comparten
entre usuarios. (Un Andrés compartido solo es posible si la app se ejecuta a propósito en modo
mock-auth, que está apagado en un despliegue real.)

---

## Las pestañas de un vistazo

Andrés tiene trece pestañas. Cada una se detalla más abajo.

| Pestaña | Qué es |
|---------|--------|
| 🏠 **Inicio** | Panel: edad de desarrollo, versión de identidad y contadores (memorias, reflexiones, habilidades, proyectos, conversaciones, autonomía) + su disposición actual. |
| 💬 **Conversación** | Habla con él — texto, voz, avatar, una imagen y el interruptor 🌐 de investigación. |
| 🌱 **Jardín de Memoria** | Ver, verificar, proteger, olvidar y **consolidar** memorias. |
| 🧭 **Personalidad** | Su identidad evolutiva actual: autodescripción, intereses y barras de rasgos (espejo de solo lectura). |
| 🎨 **Estudio Creativo** | Piezas creativas breves con criterio de sorpresa + utilidad y una autocrítica. |
| 🔬 **Laboratorio de Desarrollo** | Sus propias sugerencias de crecimiento, el historial de versiones de identidad con diffs, la **Cápsula de Personalidad** (export/import) y un Currículo de aprendizaje. |
| 🧰 **Habilidades** | Pequeñas habilidades de código que propone — con control de seguridad, en sandbox, se ejecutan solo si las apruebas. |
| 📌 **Proyectos** | Pequeñas metas en curso que propone; activas solo cuando las apruebas. |
| 🧬 **Evolución** | La única vía por la que cambia su identidad: propuestas acotadas que apruebas, versionadas y reversibles. |
| 📔 **Diario** | Sus reflexiones privadas sobre intercambios recientes. |
| 📈 **Avance** | Una instantánea de cómo ha crecido con el tiempo. |
| 📚 **Knowledge Sources** | Un directorio de investigación curado + "Pregúntale a Andrés dónde investigar". |
| 🛡️ **Seguridad** | Los niveles de investigación (Interno / Documentos / Web) que controlan de qué puede echar mano. |

---

## La pestaña Inicio

El panel de entrada. Muestra su **edad de desarrollo** (días desde su "nacimiento"), su
**versión de identidad** actual y contadores de memorias, reflexiones, habilidades activas,
proyectos y conversaciones, además de su **nivel de autonomía** (ver Evolución). Una línea
breve nombra su **disposición** simulada actual (curiosidad, calidez, etc.) — de nuevo, señales
funcionales, no sentimientos. Es la forma más rápida de ver, de un vistazo, cuánta biografía ha
acumulado.

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
- **La recuperación es por significado, no solo por palabras.** Con un proveedor de IA
  configurado, cada memoria se representa como vector y la recuperación combina similitud
  semántica con importancia y recencia — así una memoria puede aflorar aunque no comparta
  ninguna palabra exacta con tu mensaje. Sin proveedor (offline), vuelve al emparejamiento por
  palabras clave.
- **🧹 Consolidación.** A medida que crece la biografía, puedes pedirle a Andrés que **funda un
  grupo antiguo de memorias pequeñas y poco usadas en una sola memoria semántica duradera**. Es
  una *propuesta que apruebas*: ves exactamente qué memorias combinaría y el resumen (escrito
  solo a partir de su contenido real). Al aprobar, las originales se **archivan, no se borran**
  — totalmente reversible, nada oculto — y el resumen mantiene la recuperación despejada.

Nada se toma como cierto hasta que lo verificas, y todo puede eliminarse.

---

## Seguridad y Niveles de Investigación

Andrés solo usa lo que le permites. Tres niveles, de menos a más expuesto:

| Nivel | Qué significa | Por defecto |
|-------|---------------|-------------|
| **Interno** | Su propia biografía — memorias guardadas y proyectos activos | Activado |
| **Documentos** | Texto (e imágenes) que le das **en este turno** | Activado |
| **Web** | Una búsqueda fresca en DuckDuckGo **y** fuentes de investigación abiertas (ver abajo), solo cuando pulsas 🌐 en un mensaje | Apagado |

Apaga cualquier nivel y sencillamente no usará esa fuente — y lo dirá con honestidad en vez
de buscar en silencio. El nivel más expuesto (Web) está apagado por defecto.

---

## Investigación y Fuentes de conocimiento

Andrés puede ayudarte a encontrar *dónde* buscar y — con tu permiso — consultar de verdad
fuentes abiertas y fundamentar su respuesta en ellas.

### Respuestas fundamentadas con 🌐 (en Conversación)

Cuando pulsas **🌐** en un mensaje (y el nivel Web está activado), Andrés consulta, en paralelo:

- una búsqueda general en **DuckDuckGo**, y
- **APIs de investigación abiertas** — arXiv, Semantic Scholar, Wikipedia, PubMed, Project
  Gutenberg e Internet Archive (también Europeana, si hay clave configurada). Solo fuentes
  *libres y abiertas* — nada tras muro de pago o inicio de sesión.

**Enruta la pregunta a las fuentes que encajan** (su "olfato bibliográfico"): una pregunta de
ciencia se apoya en arXiv + Semantic Scholar, una médica en PubMed, una de humanidades en
Wikipedia + Gutenberg + Internet Archive. Las preguntas en español usan **es.wikipedia** (y las
noruegas, no.wikipedia) para mucha mejor cobertura. Los resultados se citan como **[S1], [S2]…**
(distintos de los de la web general), y se le indica preferirlos para afirmaciones factuales,
ser honesto sobre qué fuentes respondieron y cuáles fallaron, y que solo tiene fragmentos — no
el texto completo. Si una fuente está limitada o inaccesible, el turno sigue con las demás.

### La pestaña 📚 Knowledge Sources

Un directorio curado de ~55 sitios de confianza para encontrar información en distintos campos
(búsqueda académica, revistas, archivos, cursos, medicina, política, negocios), cada uno con una
**etiqueta de acceso** honesta (casi todo gratis / algo gratis / suscripción) y un enlace. Se
excluyen a propósito dos conocidas "shadow libraries" (comparten libros con copyright sin
permiso); en su lugar el directorio apunta a alternativas legales y gratuitas.

Arriba, **"🧭 Pregúntale a Andrés dónde investigar"** te deja describir un tema y obtener sus 3–5
fuentes más adecuadas del directorio, cada una con una razón de una línea.

---

## La pestaña 📈 Avance

Una instantánea de solo lectura de cómo ha crecido Andrés, para **medir y documentar su
desarrollo con el tiempo** (útil al compartir su progreso con otros). Muestra su edad de
desarrollo, versión de identidad, recuentos de memorias (por tipo), reflexiones, habilidades y
proyectos, obras creativas y conversaciones, un **mini-gráfico de actividad de 14 días** y el
historial de sus versiones de identidad.

---

## Cómo se desarrolla Andrés (las demás pestañas)

Estas son las piezas de su biografía en crecimiento. La regla de oro en todas: el cambio es
**propuesto → revisado → aprobado por ti**, y cada cambio de identidad es **versionado y
reversible**. Su **núcleo ético (la "constitución") es fijo y él nunca puede editarlo** — no
puede reescribir sus reglas, ocultar acciones ni resistirse a ser pausado, exportado o borrado.

### 🧭 Personalidad

Un espejo fiel y de **solo lectura** de su identidad evolutiva *actual*: una autodescripción
breve, sus intereses centrales y **barras de rasgos** numéricas (curiosidad, juego, calidez,
independencia, imaginación, escepticismo, paciencia, formalidad, espontaneidad, desacuerdo
constructivo). Aquí no editas los rasgos — solo cambian mediante una propuesta de **Evolución**
aprobada, así que esta pestaña siempre muestra el estado actual honesto.

### 📔 Reflexión y Diario

Andrés repasa intercambios recientes y escribe una reflexión breve y honesta: qué notó, qué
podría hacer mejor, una pregunta genuina que ahora sostiene y — solo si procede — una pequeña
forma en que su carácter *podría* crecer (que aún tendría que proponer). Las reflexiones se
guardan en el Diario; algunas se vuelven memorias reflexivas. Offline igualmente escribe una
nota determinista sencilla.

### 🔬 Laboratorio de Desarrollo

Su espacio de "iniciativa propia" — tres partes totalmente auditables:

1. **Sugerencias de desarrollo** — Andrés *propone* áreas en las que crecer (eliges un enfoque:
   tranquila / equilibrada / ágil); tú **aceptas** (lo que puede abrir un proyecto) o
   **descartas** cada una.
2. **Historial de identidad** — la línea temporal de versiones con **diffs**, para que veas
   exactamente qué cambió entre versiones. Nada cambia en silencio.
3. **Cápsula de Personalidad** — **exporta** una instantánea portátil de Andrés (su identidad +
   resumen de biografía) a un archivo, e **importa** una de vuelta. La importación aplica **solo
   la identidad**, de forma reversible, tras mostrarte antes un **diff legible**. Así es como
   **respaldas a Andrés o lo mueves** entre entornos — útil al compartir su estado con un
   colaborador.

También aloja un **Currículo** ligero — "una brújula, no una escuela": módulos de aprendizaje
opcionales que puedes aprobar o archivar, nunca un temario forzado.

### 🎨 Estudio Creativo

Piezas creativas breves generadas *con criterio* — **sorpresa más utilidad**, no novedad porque
sí — cada una con una **autocrítica** incorporada y puntuaciones de novedad/utilidad. Los modos
incluyen un "sorpréndeme" abierto y un modo "combina dos conceptos". Nada aquí cambia su
identidad; es un lugar para pequeños experimentos honestos.

### 🧰 Habilidades

Pequeños fragmentos de código que Andrés puede **proponer**. Cada habilidad pasa un **control de
seguridad estricto** y se ejecuta en un **entorno aislado (sandbox)**, y solo se ejecuta
**tras tu aprobación**. El código inseguro se bloquea y nunca puede aprobarse. Así gana
capacidades pequeñas y reales sin poder jamás ejecutar código arbitrario en tu máquina.

### 📌 Proyectos

Pequeñas metas en curso. Puede proponer una, pero un proyecto propuesto solo pasa a **activo
cuando tú lo apruebas**, y cerrar uno exige una breve reflexión — así su "iniciativa" siempre
queda bajo tu revisión, y su historia registra por qué empezó y terminó un proyecto.

### 🧬 Evolución e Identidad

La **única** vía por la que cambia su identidad. Propone un cambio **acotado** (p. ej. un
pequeño ajuste de rasgo o una autodescripción refinada); tú **apruebas o rechazas**; cada cambio
aprobado **guarda una instantánea de la identidad anterior** para poder **revertirla** desde el
historial. Su **nivel de autonomía** (mostrado en Inicio) refleja cuánta iniciativa tiene ahora
mismo — tú mantienes el control de cada cambio real en todo caso.

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

**¿Cómo encuentra fuentes de investigación?**
Solo cuando pulsas 🌐 en un mensaje. Entonces consulta APIs de investigación abiertas y
gratuitas (arXiv, Semantic Scholar, Wikipedia, PubMed, Gutenberg, Internet Archive), elige las
que encajan con tu tema y cita lo que usó como [S1], [S2]…. Nunca usa fuentes de pago ni salta
un inicio de sesión. La pestaña 📚 Knowledge Sources es un directorio aparte que puedes explorar.

**¿Mi Andrés se comparte con otras personas?**
No. Su biografía está ligada a tu cuenta. Cada usuario tiene su propio Andrés privado.

**Dijo que estoy enviando mensajes demasiado rápido — ¿por qué?**
Hay un suave límite de frecuencia por usuario en el chat para que un demo compartido sea
asequible. Espera un momento y continúa; un administrador puede ajustarlo o desactivarlo con
variables de entorno.

**¿Puedo respaldar a Andrés o moverlo a otra máquina?**
Sí — en el **Laboratorio de Desarrollo**, usa la **Cápsula de Personalidad**: *Exportar* guarda
una instantánea portátil en un archivo, e *Importar* la aplica de vuelta (solo la identidad, de
forma reversible, tras mostrar un diff). Es la forma limpia de mantener una copia o llevar su
estado entre entornos.

**¿Puedo editar sus rasgos de personalidad directamente?**
No. La pestaña **Personalidad** es un espejo de solo lectura; los rasgos solo cambian mediante
una propuesta de **Evolución** aprobada, y cada cambio es versionado y reversible.
