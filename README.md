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
* **Los leads, notas y el perfil se guardan en el navegador de cada persona** (`localStorage`); no se comparten entre el equipo. Usa *Exportar CSV* o la copia de seguridad JSON de Ajustes.
* Los correos los encuentra Gemini a partir de información pública; **verifícalos** antes de enviar una propuesta.

---

## 📚 Documentación

Manual de usuario para el equipo: [`docs/manual-usuario-radar-clientes.pdf`](docs/manual-usuario-radar-clientes.pdf).

---

## 📄 Licencia

Desarrollado para prospección comercial ética. Prohibido el uso para envío de spam masivo no solicitado.
