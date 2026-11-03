# Radar de Clientes 🎯🚀

> Herramienta inteligente de prospección comercial B2B para negocios locales en Medellín y Colombia. Diseñada para agencias digitales, consultores y desarrolladores que ofrecen soluciones de diseño web, automatizaciones y agentes de IA.

---

## 🌟 Características Principales

1. **Búsqueda y Rastreo en Vivo (Google Places API New):**
   * Localización de negocios reales en cualquier zona, barrio o municipio de Colombia (*El Poblado, Laureles, Envigado, Belén, Itagüí, Bogotá, Cali, etc.*).
   * **19 nichos sugeridos** (talleres mecánicos, clínicas dentales, restaurantes, inmobiliarias… y negocios de barrio como ferreterías, panaderías, lavanderías, tiendas de mascotas y jardines infantiles), además de cualquier nicho que escribas.
   * Filtro anti-contaminación semántica para garantizar resultados precisos según el sector.

2. **Detección de Presencia Web y Clasificación Inteligente:**
   * Distingue si un negocio tiene **página web propia**, si depende únicamente de **redes sociales o directorios** (*Instagram, Facebook, Linktree, Doctoralia, etc.*) o si **carece de presencia web**.

3. **Correo electrónico de cada negocio (Gemini):**
   * Tras cada búsqueda, Gemini lee la web del negocio (o busca en Internet si no tiene) y completa la columna **Correo**. Si no hay correo publicado, muestra «Sin correo».
   * El correo se guarda con el lead y sale en el CSV exportado.

4. **Score de Oportunidad (0 - 100):**
   * Puntuación que prioriza negocios con muchas reseñas y buena reputación pero con infraestructura digital deficiente o inexistente.

5. **Auditoría real de velocidad (Google PageSpeed Insights):**
   * Mide la web en móvil (rendimiento, SEO, accesibilidad, buenas prácticas) con captura de pantalla. Si Google no puede medirla, la ficha muestra el motivo; **no se inventan cifras**.

6. **Radar de nichos:**
   * Compara categorías de una zona con datos reales de Google Places (hasta 20 negocios por categoría). Cuando no hay clave o falla la consulta, la categoría se marca como **Estimado**.

7. **Generador de Propuestas Comerciales Multicanal:**
   * Guiones de llamada (30 segundos), mensajes de WhatsApp y correos adaptados al problema detectado, en tono **Cercano**, **Profesional** o **Directo**, con enlace directo a `wa.me/57...`.
   * **Mensaje de WhatsApp de primer contacto:** al tocar el botón de WhatsApp (en la búsqueda, en Mis leads o en la ficha) se abre el chat con un mensaje personalizado con el nombre, la zona y la valoración reales del negocio, la oferta de **landing page** (si no tiene web propia) y del agente **ReservasIA**, una frase adaptada a su rubro y el **enlace de ReservasIA** (<https://reservas-ia-app.vercel.app/>, configurable en Ajustes) para que el negocio conozca el servicio.
   * **Secuencia de seguimiento:** primer contacto + Seguimiento 1 (a los 2 días), Seguimiento 2 (3 días después, con un beneficio según el rubro) y Cierre amable (4 días después). Los botones de WhatsApp envían automáticamente el mensaje que toca según los acercamientos ya registrados; en la ficha puedes elegir otro paso.
   * **Contactar hoy:** bloque en *Mis leads* con seguimientos vencidos, acciones programadas, envíos sin confirmar y primeros contactos (por oportunidad), con un tope sugerido de 20 mensajes al día.
   * **Confirmación rápida:** al volver de WhatsApp aparece «¿Enviaste el mensaje?»; con «Sí, lo envié» se registra el acercamiento, el lead pasa a *Contactado* y se programa la fecha del siguiente seguimiento.
   * **Cuando el negocio responde:** botón «El negocio respondió» (en la cola, la ficha y el historial) que lo pasa a *Respondió* y lo sube al tope de «Contactar hoy»; **respuestas rápidas** de un toque para las objeciones más comunes (precio, «lo consulto», «ya tengo web», «mándame información», «ahora no», «no me interesa») y para proponer la demo.
   * **Lista de «no contactar»:** si un negocio pide no recibir mensajes, queda bloqueado (también por teléfono): no se abre WhatsApp para él, sale de la cola y puede gestionarse desde Ajustes. Además, la app avisa si ya le escribiste a otro registro con el mismo teléfono.
   * **Resumen de prospección** (Historial → *Resumen*): mensajes enviados, negocios contactados, respuestas, demos y cierres en los últimos 7 / 30 días o todo el historial, con la tasa de respuesta por rubro, por tono y por paso de la secuencia, y la franja horaria que mejor te ha funcionado. Avisa cuando la muestra es pequeña.
   * **Mejor momento para escribir:** cada fila de «Contactar hoy» sugiere una franja según el rubro (orientativa) y avisa fuera de horario o al acercarse al tope diario de mensajes.
   * **Plantillas editables** (Ajustes → *Plantillas de mensajes*): saludo, dato de contacto, firma, minutos de la demo, el enlace de ReservasIA que se envía y si se ofrece landing page, con vista previa en vivo. Se aplican al primer contacto, los seguimientos y las respuestas rápidas.
   * **Correo con la misma secuencia:** en la ficha, pestaña *Correo*, el asunto y el cuerpo cambian con el paso y el tono, llevan el enlace de ReservasIA y se abren en tu cliente de correo o en Gmail. «Contactar hoy» sugiere el correo cuando el negocio no tiene celular pero sí correo, y al volver aparece «¿Enviaste el correo?».
   * **Tarjeta digital** (Ajustes → *Tarjeta digital*): una página pública con tu WhatsApp, llamada, correo, web, el enlace de ReservasIA y «Guardar contacto» (vCard). Los datos viajan dentro del enlace (`/?tarjeta=…`), sin servidor; incluye código QR descargable y puede agregarse al final de los mensajes.
   * **Hoja para visita (PDF):** en la ficha, un PDF de una página por negocio con sus datos reales, los puntajes de PageSpeed y problemas detectados (si ya se analizó), la propuesta de landing y ReservasIA y tus datos de contacto con el QR de tu tarjeta.
   * **Agendar la demo:** botón en la ficha y el historial; elige fecha, hora y modalidad, y la app crea el evento en **Google Calendar** (enlace) o descarga un **.ics** (Apple, Outlook), con avisos 1 día y 30 minutos antes, más un mensaje de confirmación por WhatsApp. El negocio pasa a *Reunión* y la demo de hoy o mañana aparece primero en «Contactar hoy» con su recordatorio.
   * **Propuesta comercial en PDF** (ficha → *Propuesta con precios*): elige los servicios y genera una página con lo que incluye, la inversión, los pasos para empezar, las condiciones y tus datos con el QR de la tarjeta. Los precios los escribes en Ajustes → *Precios y propuesta comercial*; la app nunca inventa cifras (sin precios dice «el valor se define en la demo»).
   * **Avisos del navegador** (Ajustes): un aviso al día con demos próximas, respondidos y seguimientos vencidos. Sin servidor solo salen mientras la app esté abierta.
   * WhatsApp no deja adjuntar archivos desde un enlace `wa.me`; por eso el mensaje lleva el enlace de ReservasIA (WhatsApp muestra la vista previa). Si además quieres mandar la presentación comercial en PDF (`public/docs/`), el botón opcional **Enviar con el PDF adjunto** de la ficha abre la hoja de compartir del celular con el archivo.

8. **Mini-CRM y Embudo de Ventas:**
   * Tablero Kanban y tabla con etapas: *Nuevo*, *Analizado*, *Contactado*, *Respondió*, *Reunión*, *Cliente* y *Descartado*. Notas, fechas de próxima acción, exportación a **Excel (.xlsx), PDF y CSV** y copia de seguridad en JSON.

9. **Historial de prospección (trazabilidad):**
   * Registra cada búsqueda y cada negocio visto, con la actividad de contacto (WhatsApp, llamada, web, correo, Maps) y los acercamientos que registres a mano. Filtros, orden, línea de tiempo por negocio y **exportación ordenada a Excel (.xlsx, 4 hojas), PDF y CSV**.

10. **App instalable (PWA) y 100 % responsiva:**
   * Se instala como app en Android, iOS, Windows, macOS y ChromeOS (botón *Instalar* o *Añadir a pantalla de inicio*), con icono propio, accesos directos y pantalla completa.
   * Funciona sin conexión para ver leads e historial; las búsquedas y auditorías requieren Internet. Avisa cuando hay una versión nueva.
   * Diseño adaptable de 320 px a pantallas de escritorio, sin desbordamiento horizontal.

11. **Control de Cuotas:**
   * Medidor de consumo de llamadas a Google Places con alerta preventiva de límite mensual.

---

## 🛠️ Tecnologías

* **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 8](https://vitejs.dev/)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Iconos y Animaciones:** [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
* **Gráficos:** [Recharts](https://recharts.org/)
* **APIs:** Google Places API (New), Google PageSpeed Insights API, Gemini (`@google/genai`)

La app corre **100 % en el navegador**, sin backend propio.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior)
* Un proyecto de Google Cloud con estas APIs habilitadas y permitidas en las restricciones de la clave:
  * **Places API (New)**
  * **PageSpeed Insights API**
* Una clave de API de Gemini (Google AI Studio).

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Janier1992/App-radar-clientes.git
   cd App-radar-clientes
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_cloud
   GEMINI_API_KEY=tu_clave_de_gemini
   ```
   En Vercel, define las mismas dos variables en *Settings → Environment Variables* y vuelve a desplegar.

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## ⚠️ Limitaciones conocidas

* **Las claves quedan visibles en el navegador** (no hay backend). Restringe ambas claves por dominio (*HTTP referrers*) en Google Cloud y AI Studio.
* **Los leads, notas, historial y ajustes se guardan en el navegador de cada persona** (`localStorage`); no se comparten entre el equipo. Descarga la **copia de seguridad** de Ajustes con frecuencia (la app te lo recuerda cada 7 días) y usa **Restaurar copia** para recuperarla o pasarla a otro dispositivo (combinando o reemplazando). La copia no incluye la clave de Google escrita en Ajustes. La app también pide al navegador *almacenamiento protegido* para que no borre los datos por falta de espacio.
* Los correos los encuentra Gemini a partir de información pública; **verifícalos** antes de enviar una propuesta.

---

## 📚 Documentación

Manual de usuario para el equipo (v7, noviembre 2026): [`docs/manual-usuario-radar-clientes.pdf`](docs/manual-usuario-radar-clientes.pdf). Se genera desde `docs/manual.html`.

---

## 📄 Licencia

Desarrollado para prospección comercial ética. Prohibido el uso para envío de spam masivo no solicitado.
