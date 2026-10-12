import { GoogleGenAI, Type } from '@google/genai';
import { BusinessLead, GeminiAnalysis, SellerProfile } from '../types';

const MODEL = 'gemini-2.5-flash';

let cachedClient: GoogleGenAI | null | undefined;

function getApiKey(): string {
  return (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
}

export function isGeminiConfigured(): boolean {
  return getApiKey().trim().length > 0;
}

function getClient(): GoogleGenAI | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = getApiKey().trim();
  cachedClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return cachedClient;
}

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'Resumen de 2 frases sobre a qué se dedica el negocio.' },
    checklist: {
      type: Type.OBJECT,
      properties: {
        hasHttps: { type: Type.BOOLEAN },
        mobileResponsive: { type: Type.BOOLEAN },
        whatsappButton: { type: Type.BOOLEAN },
        onlineBooking: { type: Type.BOOLEAN },
        contactForm: { type: Type.BOOLEAN },
        outdatedSignals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Señales concretas de que la presencia digital está desactualizada o incompleta.',
        },
      },
      required: ['hasHttps', 'mobileResponsive', 'whatsappButton', 'onlineBooking', 'contactForm', 'outdatedSignals'],
    },
    contactsFound: {
      type: Type.OBJECT,
      properties: {
        emails: { type: Type.ARRAY, items: { type: Type.STRING } },
        socialLinks: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['emails', 'socialLinks'],
    },
    plainProblems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 a 5 problemas cotidianos explicados en lenguaje simple, no técnico.',
    },
    recommendedService: {
      type: Type.STRING,
      enum: ['web_nueva', 'agente_whatsapp', 'sistema_citas'],
    },
    recommendedServiceRationale: { type: Type.STRING },
  },
  required: ['summary', 'checklist', 'contactsFound', 'plainProblems', 'recommendedService', 'recommendedServiceRationale'],
};

function buildPrompt(lead: BusinessLead, seller: SellerProfile, hasWebsite: boolean): string {
  return `
Eres un consultor de digitalización B2B que audita negocios locales en Medellín y Colombia para la agencia "${seller.companyOrAgency}".

Datos del negocio a auditar:
- Nombre: ${lead.name}
- Categoría: ${lead.primaryTypeDisplayName || 'servicios locales'}
- Dirección: ${lead.formattedAddress}
- Calificación en Google: ${lead.rating ?? 'sin datos'} con ${lead.userRatingCount ?? 0} reseñas
- Sitio web: ${lead.websiteUri || 'no tiene sitio web propio'}
- Presencia web detectada: ${lead.websiteClassification.type}${
    lead.websiteClassification.platform ? ` (${lead.websiteClassification.platform})` : ''
  }

${
  hasWebsite
    ? 'Visita el sitio web indicado arriba y basa tu análisis en su contenido real (velocidad percibida, textos, botones de contacto, reservas online, diseño).'
    : 'Este negocio no tiene sitio web propio: basa el análisis en su categoría, dirección, calificación y volumen de reseñas.'
}

Servicios que ofrece "${seller.companyOrAgency}": ${seller.servicesOffered.join(', ') || 'páginas web y automatizaciones de WhatsApp'}.
Propuesta de valor de la agencia: ${seller.valueProposition || 'digitalizar negocios locales para que no pierdan clientes'}.

Devuelve un análisis de oportunidad comercial honesto y ESPECÍFICO de este negocio (nunca genérico ni repetido de otros análisis), en español neutro colombiano, siguiendo exactamente el esquema JSON solicitado. Los "plainProblems" deben estar redactados en lenguaje cotidiano, como si se los explicaras al dueño del negocio en una llamada.
`.trim();
}

/**
 * Genera el análisis de oportunidad con Gemini, incluyendo lectura real del sitio web
 * del negocio cuando existe. Devuelve null si no hay API key configurada o si la
 * llamada falla, para que el flujo de llamada (analyzer.ts) recurra al generador simulado.
 */
export async function generateGeminiAnalysis(
  lead: BusinessLead,
  seller: SellerProfile
): Promise<GeminiAnalysis | null> {
  const client = getClient();
  if (!client) return null;

  const hasWebsite = lead.websiteClassification.type === 'own' && Boolean(lead.websiteUri);
  const prompt = buildPrompt(lead, seller, hasWebsite);

  const parseResponse = (text: string | undefined): GeminiAnalysis | null => {
    if (!text) return null;
    try {
      return JSON.parse(text) as GeminiAnalysis;
    } catch {
      return null;
    }
  };

  // Primer intento: si tiene web propia, dejamos que el modelo la visite de verdad
  // con la herramienta de contexto de URL, combinada con salida JSON estructurada.
  if (hasWebsite) {
    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema,
          tools: [{ urlContext: {} }],
        },
      });
      const parsed = parseResponse(response.text);
      if (parsed) return parsed;
    } catch (err) {
      console.warn('Gemini con urlContext falló, reintentando sin leer la web en vivo:', err);
    }
  }

  // Segundo intento (o único, si no hay web propia): solo razonamiento + JSON estructurado.
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisResponseSchema,
      },
    });
    return parseResponse(response.text);
  } catch (err) {
    console.warn('Gemini no pudo generar el análisis, se usará el generador simulado:', err);
    return null;
  }
}

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const IGNORED_EMAIL_PATTERN =
  /(example\.|ejemplo\.|tudominio|tunegocio|sentry|wixpress|godaddy|domain\.com|email\.com|\.(png|jpe?g|gif|svg|webp)$)/i;

/**
 * Extrae del texto de la respuesta solo correos con forma válida y descarta placeholders.
 * Gemini no inventa el dato por sí solo: exigimos que aparezca literalmente en su respuesta.
 */
export function extractEmails(text: string | undefined): string[] {
  if (!text) return [];
  const found = text.match(EMAIL_REGEX) || [];
  const unique = new Set(
    found.map((e) => e.toLowerCase().replace(/[.,;]+$/, '')).filter((e) => !IGNORED_EMAIL_PATTERN.test(e))
  );
  return Array.from(unique);
}

/**
 * Busca el correo público de contacto de un negocio con Gemini, sin backend.
 * - Con web propia: lee el sitio en vivo con la herramienta urlContext.
 * - Sin web propia: usa búsqueda de Google (grounding) con nombre y dirección.
 * Devuelve null si no hay API key, si falla la llamada o si no se encontró ningún correo.
 */
export async function findBusinessEmail(lead: BusinessLead): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const hasWebsite = lead.websiteClassification.type === 'own' && Boolean(lead.websiteUri);

  const prompt = hasWebsite
    ? `Visita el sitio web ${lead.websiteUri} (revisa la página principal, la sección de contacto y el pie de página) y encuentra el correo electrónico de contacto público de "${lead.name}". Responde SOLO con la dirección de correo. Si el sitio no muestra ningún correo, responde exactamente: NO_ENCONTRADO. No inventes direcciones.`
    : `Busca en Internet el correo electrónico de contacto público de "${lead.name}", ubicado en ${lead.formattedAddress}${
        lead.websiteUri ? ` (perfil: ${lead.websiteUri})` : ''
      }. Responde SOLO con la dirección de correo. Si no encuentras una publicada, responde exactamente: NO_ENCONTRADO. No inventes direcciones.`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { tools: hasWebsite ? [{ urlContext: {} }] : [{ googleSearch: {} }] },
    });
    const emails = extractEmails(response.text);
    return emails[0] ?? null;
  } catch (err) {
    console.warn(`No se pudo buscar el correo de ${lead.name}:`, err);
    return null;
  }
}
