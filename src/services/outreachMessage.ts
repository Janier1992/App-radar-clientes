import { BusinessLead, SellerProfile } from '../types';

export type OutreachTone = 'cercano' | 'profesional' | 'directo';

/** Presentación comercial de ReservasIA, publicada junto a la app (carpeta public/docs). */
export const RESERVASIA_PDF_PATH = '/docs/ReservasIA-Presentacion-Comercial.pdf';
export const RESERVASIA_PDF_NAME = 'ReservasIA-Presentacion-Comercial.pdf';

export const getReservasIaPdfUrl = () =>
  typeof window === 'undefined' ? RESERVASIA_PDF_PATH : new URL(RESERVASIA_PDF_PATH, window.location.origin).toString();

const DEFAULT_SELLER: SellerProfile = {
  name: 'Synflow',
  companyOrAgency: 'SynflowIA SaaS',
  servicesOffered: [],
  valueProposition: '',
  defaultTone: 'cercano',
};

/** Lee el perfil guardado en Ajustes para que los botones de las listas no necesiten recibirlo por props. */
export function loadSellerProfile(): SellerProfile {
  try {
    const stored = localStorage.getItem('radar_seller_profile');
    if (stored) return { ...DEFAULT_SELLER, ...JSON.parse(stored) };
  } catch {
    /* sin perfil guardado: se usan los valores por defecto */
  }
  return DEFAULT_SELLER;
}

type Sector = 'salud' | 'vehiculos' | 'gastronomia' | 'formacion' | 'belleza' | 'general';

/** Frase de ReservasIA adaptada al rubro (según los casos de uso de la presentación comercial). */
const SECTOR_LINES: Record<Sector, string> = {
  salud: 'Está pensado para clínicas y consultorios: cuida la privacidad de los pacientes (Ley 1581) y deriva las urgencias a una persona.',
  vehiculos: 'Para talleres y lavaderos incluye ficha del vehículo (placa, modelo) y un tablero por etapas, para que nadie se pierda con las manos ocupadas.',
  gastronomia: 'Para restaurantes y cafés incluye menú con QR en la mesa, fila por número de comensales y aviso cuando el pedido está listo.',
  formacion: 'Para academias, gimnasios y jardines controla los cupos grupales y las clases de prueba, y guarda la ficha de cada alumno.',
  belleza: 'Para peluquerías y centros de estética guarda el historial de cada cliente (fórmulas, preferencias) y lo avisa antes de su cita.',
  general: 'Se adapta al horario, los precios y las reglas de su negocio, y atiende con la misma calidez que su equipo.',
};

function detectSector(lead: BusinessLead): Sector {
  const text = `${lead.primaryTypeDisplayName || ''} ${(lead.types || []).join(' ')} ${lead.name}`.toLowerCase();
  if (/(dent|cl[ií]nica|m[eé]dic|salud|fisio|terap|veterin|odont|psic|optic|hospital|doctor)/.test(text)) return 'salud';
  if (/(taller|mec[aá]nic|lavader|car_wash|auto|moto|llanta|repair|vehic)/.test(text)) return 'vehiculos';
  if (/(restaur|caf[eé]|panader|bar\b|comida|pizz|hamburg|bakery|food)/.test(text)) return 'gastronomia';
  if (/(gimnas|gym|academ|jard[ií]n infantil|colegio|escuela|instituto|yoga|baile|danza|school)/.test(text)) return 'formacion';
  if (/(peluquer|barber|est[eé]tic|spa\b|u[ñn]as|belleza|salon|salón|beauty|hair)/.test(text)) return 'belleza';
  return 'general';
}

/** Barrio o sector: primera parte de la dirección que no sea la calle (sin números). */
const firstZone = (lead: BusinessLead) =>
  (lead.formattedAddress || '')
    .split(',')
    .map((part) => part.trim())
    .find((part) => part && !/\d/.test(part) && !/^colombia$/i.test(part)) || '';

function senderLine(seller: SellerProfile) {
  const name = (seller.name || DEFAULT_SELLER.name).trim();
  const agency = (seller.companyOrAgency || '').trim();
  if (agency && !agency.toLowerCase().includes(name.toLowerCase())) return `*${name}* de *${agency}*`;
  return `*${name}*`;
}

/** Cuánta presencia web tiene el negocio, para ofrecer landing solo cuando hace falta. */
function webSituation(lead: BusinessLead): 'none' | 'social' | 'own' {
  const type = lead.websiteClassification?.type;
  if (type === 'own') return 'own';
  if (type === 'directory_or_social') return 'social';
  return 'none';
}

/**
 * Mensaje de primer contacto por WhatsApp: personalizado con datos reales del negocio (nombre, zona,
 * valoración y presencia web), con la oferta de landing page (si no tiene web propia) y del agente
 * ReservasIA, y con el enlace a la presentación en PDF. No inventa datos: solo menciona lo que existe.
 */
export function buildOutreachMessage(
  lead: BusinessLead,
  seller: SellerProfile = loadSellerProfile(),
  tone: OutreachTone = seller.defaultTone || 'cercano',
  pdfUrl: string = getReservasIaPdfUrl()
): string {
  const web = webSituation(lead);
  const sector = detectSector(lead);
  const zone = firstZone(lead);
  const sender = senderLine(seller);
  const hasRating = typeof lead.rating === 'number' && typeof lead.userRatingCount === 'number' && lead.userRatingCount >= 10;
  const rating = hasRating ? `⭐ ${lead.rating!.toFixed(1)} con ${lead.userRatingCount} reseñas en Google` : '';
  const platform = lead.websiteClassification?.platform;

  const webHook =
    web === 'none'
      ? 'Vi que todavía no tienen página web propia, y hoy la mayoría de clientes busca en Google y mira el celular antes de llamar.'
      : web === 'social'
      ? `Vi que hoy dependen de ${platform || 'sus redes'} para que los encuentren, y ahí es fácil que el cliente se pierda antes de escribirles.`
      : 'Vi su página web y creo que se puede aprovechar mucho más para convertir visitas en reservas y consultas.';

  const landing = '🌐 *Landing page profesional*: rápida en celular, con su ubicación, servicios y botón directo de WhatsApp.';
  const agent =
    '🤖 *ReservasIA*: un asistente que atiende por WhatsApp 24/7, muestra horarios reales, agenda y confirma solo, envía recordatorios (menos ausencias) y evita las dobles reservas.';
  const offer = web === 'own' ? [agent] : [landing, agent];
  const pdfLine = `📄 Aquí les dejo la presentación con cómo funciona:\n${pdfUrl}`;

  if (tone === 'directo') {
    return [
      `Buen día, le habla ${sender}.`,
      '',
      `${web === 'own' ? 'Tienen web, pero' : web === 'none' ? 'No tienen web propia y' : 'Hoy dependen de redes y'} ${lead.name} puede estar perdiendo clientes fuera de horario${rating ? ` pese a su ${rating}` : ''}.`,
      '',
      ...offer,
      '',
      pdfLine,
      '',
      `¿Le muestro en 10 minutos cómo quedaría para ${lead.name}? Sin compromiso.`,
    ].join('\n');
  }

  if (tone === 'profesional') {
    return [
      `Buenos días, le saluda ${sender}.`,
      '',
      `Conocimos ${lead.name}${zone ? ` en ${zone}` : ''}${rating ? `, destacado por su calificación (${rating})` : ''}. ${webHook}`,
      '',
      'Le proponemos:',
      ...offer,
      '',
      SECTOR_LINES[sector],
      '',
      pdfLine,
      '',
      `Con gusto agendamos una reunión breve para mostrarle cómo se implementaría en ${lead.name}. Quedo atento.`,
    ].join('\n');
  }

  return [
    `¡Hola! 👋 Soy ${sender}.`,
    '',
    `Estuve viendo *${lead.name}*${zone ? ` por ${zone}` : ''} en Google Maps${rating ? ` y me encantó su calificación: ${rating}` : ''}. ¡Se nota que sus clientes los quieren! 👏`,
    '',
    webHook,
    '',
    'Les puedo ayudar con:',
    ...offer,
    '',
    SECTOR_LINES[sector],
    '',
    pdfLine,
    '',
    `¿Les parece si les muestro en 10 minutos cómo quedaría para *${lead.name}*? Sin compromiso 🙌`,
  ].join('\n');
}

/** ¿Este navegador puede compartir un archivo (hoja de compartir del celular)? */
export function canShareFiles(): boolean {
  try {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
    return navigator.canShare({ files: [new File([''], RESERVASIA_PDF_NAME, { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

/**
 * Abre la hoja de compartir del celular con el PDF adjunto y el mensaje. WhatsApp no permite adjuntar
 * archivos desde un enlace wa.me, así que aquí la persona elige WhatsApp y el chat del negocio.
 */
export async function shareOutreachWithPdf(message: string): Promise<'shared' | 'cancelled'> {
  const res = await fetch(RESERVASIA_PDF_PATH);
  if (!res.ok) throw new Error('No se pudo cargar la presentación en PDF');
  const file = new File([await res.blob()], RESERVASIA_PDF_NAME, { type: 'application/pdf' });
  try {
    await navigator.share({ files: [file], text: message, title: 'ReservasIA · Presentación comercial' });
    return 'shared';
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
    throw err;
  }
}
