/** Ajustes editables de los mensajes (se guardan en el navegador y se aplican a todos los textos que genera la app). */
export interface OutreachSettings {
  greeting: string; // reemplaza «¡Hola! 👋» al inicio del primer mensaje en tono cercano
  contactLine: string; // dato de contacto que se agrega al final (teléfono, web…)
  signature: string; // firma final
  demoMinutes: number; // duración de la demo que se propone
  pdfUrl: string; // enlace propio a la presentación (si queda vacío se usa la que viene con la app)
  offerLanding: boolean; // ofrecer landing page a negocios sin web propia
  // Tarjeta digital (ver digitalCard.ts): datos que se codifican dentro del enlace
  cardRole: string; // frase o cargo
  cardPhone: string; // WhatsApp / teléfono
  cardEmail: string;
  cardWeb: string;
  includeCardLink: boolean; // agregar el enlace de la tarjeta al final de los mensajes
}

export const DEFAULT_OUTREACH_SETTINGS: OutreachSettings = {
  greeting: '',
  contactLine: '',
  signature: '',
  demoMinutes: 10,
  pdfUrl: '',
  offerLanding: true,
  cardRole: '',
  cardPhone: '',
  cardEmail: '',
  cardWeb: '',
  includeCardLink: false,
};

const KEY = 'radar_outreach_settings';

export function loadOutreachSettings(): OutreachSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULT_OUTREACH_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
  } catch {
    return DEFAULT_OUTREACH_SETTINGS;
  }
}

export function saveOutreachSettings(settings: OutreachSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('No se pudieron guardar los ajustes de mensajes:', e);
  }
}

// Copia activa que leen los generadores de mensajes; App la actualiza cada vez que cambian los ajustes.
let active: OutreachSettings = DEFAULT_OUTREACH_SETTINGS;
let activeCardUrl = '';
export const getOutreachSettings = () => active;
export const setActiveOutreachSettings = (settings: OutreachSettings, cardUrl = '') => {
  active = settings;
  activeCardUrl = cardUrl;
};

/** Aplica los ajustes al texto final: duración de la demo, saludo, dato de contacto y firma. */
export function applyOutreachSettings(text: string, options: { signature?: boolean } = {}): string {
  const s = active;
  let out = text;
  const minutes = Math.min(60, Math.max(5, Math.round(s.demoMinutes) || 10));
  if (minutes !== 10) out = out.replace(/\b10 minutos\b/g, `${minutes} minutos`);
  if (s.greeting.trim() && out.startsWith('¡Hola! 👋')) out = s.greeting.trim() + out.slice('¡Hola! 👋'.length);
  if (options.signature !== false) {
    const card = s.includeCardLink && activeCardUrl ? `🪪 Mi tarjeta: ${activeCardUrl}` : '';
    const tail = [s.contactLine.trim(), card, s.signature.trim()].filter(Boolean);
    if (tail.length > 0) out = `${out}\n\n${tail.join('\n')}`;
  }
  return out;
}
