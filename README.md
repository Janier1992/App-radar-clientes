# Radar de Clientes 🎯🚀

> Herramienta inteligente de prospección comercial B2B para negocios locales en Medellín y Colombia. Diseñada para agencias digitales, consultores y desarrolladores que ofrecen soluciones de diseño web, automatizaciones y agentes de IA.

---

## 🌟 Características Principales

1. **Búsqueda y Rastreo en Vivo (Google Places API New):**
   * Localización de negocios reales en cualquier zona, barrio o municipio de Colombia (*El Poblado, Laureles, Envigado, Belén, Itagüí, Bogotá, Cali, etc.*).
   * Filtros avanzados por nicho (*talleres mecánicos, clínicas dentales, centros de estética, peluquerías, restaurantes, inmobiliarias, etc.*).
   * Filtro anti-contaminación semántica para garantizar resultados precisos según el sector.

2. **Detección de Presencia Web y Clasificación Inteligente:**
   * Distingue con precisión si un negocio tiene **página web propia**, si depende únicamente de **redes sociales o directorios** (*Instagram, Facebook, Linktree, Doctoralia, etc.*) o si **carece totalmente de presencia web**.

3. **Algoritmo de Score de Oportunidad (0 - 100):**
   * Puntuación matemática de prospección que prioriza negocios con alto flujo de clientes (muchas reseñas y buena reputación en Google) pero con infraestructura digital deficiente o inexistente.

4. **Generador de Propuestas Comerciales Multicanal:**
   * Generación de guiones de llamada (30 segundos), mensajes de WhatsApp y correos electrónicos adaptados al problema detectado.
   * Selector de tono de prospección: **Cercano**, **Profesional** o **Directo**.

5. **Contacto Directo por WhatsApp en 1 Clic:**
   * Enlaces automáticos a `wa.me/57...` con el teléfono del prospecto y el mensaje persuasivo preescrito listo para enviar desde WhatsApp Web o móvil.

6. **Mini-CRM y Embudo de Ventas:**
   * Tablero Kanban y vista en tabla con etapas del pipeline: *Nuevo*, *Analizado*, *Contactado*, *Respondió*, *Reunión*, *Cliente* y *Descartado*.
   * Notas de seguimiento y fechas de próxima acción.
   * Exportación de base de datos a **CSV / Excel** e impresión de ficha técnica en **PDF**.

7. **Control de Cuotas y Seguridad:**
   * Medidor de consumo de llamadas a Google Places API con alerta preventiva de límite mensual.

---

## 🛠️ Tecnologías

* **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 8](https://vitejs.dev/)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Iconos y Animaciones:** [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
* **Gráficos:** [Recharts](https://recharts.org/)
* **APIs Integradas:** Google Places API (New)

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior)
* Clave de API de Google Cloud con la API **Places API (New)** habilitada.

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
   Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y coloca tu clave de API de Google Cloud:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_cloud_aqui
   ```

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

## 📄 Licencia

Desarrollado para prospección comercial ética. Prohibido el uso para envío de spam masivo no solicitado.
