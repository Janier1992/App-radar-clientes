import { BusinessLead, SellerProfile } from '../types';
import { applyOutreachSettings, getOutreachSettings } from './outreachSettings';

export type OutreachTone = 'cercano' | 'profesional' | 'directo';

/** Secuencia de acercamiento: primer mensaje y tres seguimientos escalonados. */
export type OutreachStep = 'primer_contacto' | 'seguimiento_1' | 'seguimiento_2' | 'cierre';

export const OUTREACH_STEPS: OutreachStep[] = ['primer_contacto', 'seguimiento_1', 'seguimiento_2', 'cierre'];

export const STEP_LABELS: Record<OutreachStep, string> = {
  primer_contacto: 'Primer contacto',
  seguimiento_1: 'Seguimiento 1',
  seguimiento_2: 'Seguimiento 2',
  cierre: 'Cierre amable',
};

/** Días de espera tras enviar cada paso antes de sugerir el siguiente. */
export const STEP_WAIT_DAYS: Record<OutreachStep, number> = {
  primer_contacto: 2,
  seguimiento_1: 3,
  seguimiento_2: 4,
  cierre: 0,
};

/** Paso que toca según cuántos acercamientos ya se registraron (null = secuencia completa). */
export function nextStepForCount(approachCount: number): OutreachStep | null {
  return OUTREACH_STEPS[approachCount] ?? null;
}

/** Presentación comercial de ReservasIA, publicada junto a la app (carpeta public/docs). */
export const RESERVASIA_PDF_PATH = '/docs/ReservasIA-Presentacion-Comercial.pdf';
export const RESERVASIA_PDF_NAME = 'ReservasIA-Presentacion-Comercial.pdf';

export const getReservasIaPdfUrl = () => {
  const custom = getOutreachSettings().pdfUrl.trim();
  if (custom) return custom;
  return typeof window === 'undefined' ? RESERVASIA_PDF_PATH : new URL(RESERVASIA_PDF_PATH, window.location.origin).toString();
};

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

export type Sector = 'salud' | 'vehiculos' | 'gastronomia' | 'formacion' | 'belleza' | 'general';

/** Frase de ReservasIA adaptada al rubro (según los casos de uso de la presentación comercial). */
const SECTOR_LINES: Record<Sector, string> = {
  salud: 'Está pensado para clínicas y consultorios: cuida la privacidad de los pacientes (Ley 1581) y deriva las urgencias a una persona.',
  vehiculos: 'Para talleres y lavaderos incluye ficha del vehículo (placa, modelo) y un tablero por etapas, para que nadie se pierda con las manos ocupadas.',
  gastronomia: 'Para restaurantes y cafés incluye menú con QR en la mesa, fila por número de comensales y aviso cuando el pedido está listo.',
  formacion: 'Para academias, gimnasios y jardines controla los cupos grupales y las clases de prueba, y guarda la ficha de cada alumno.',
  belleza: 'Para peluquerías y centros de estética guarda el historial de cada cliente (fórmulas, preferencias) y lo avisa antes de su cita.',
  general: 'Se adapta al horario, los precios y las reglas de su negocio, y atiende con la misma calidez que su equipo.',
};

/** Un beneficio concreto por rubro para el segundo seguimiento (según la presentación comercial). */
const SECTOR_BENEFITS: Record<Sector, string> = {
  salud: 'recordatorios automáticos que ayudan a reducir las citas perdidas y una agenda sin cruces, cuidando la privacidad de los pacientes.',
  vehiculos: 'la ficha de cada vehículo (placa, modelo) y un tablero por etapas —en fila, lavando, listo—, para saber siempre qué sigue.',
  gastronomia: 'un menú con QR en la mesa y un aviso por WhatsApp cuando el pedido está listo.',
  formacion: 'control de cupos y de clases de prueba, con recordatorios automáticos para cada alumno.',
  belleza: 'el historial de cada cliente y recordatorios antes de cada cita.',
  general: 'una agenda sin dobles reservas y recordatorios automáticos para que no se pierda ningún cliente.',
};

export function detectSector(lead: BusinessLead): Sector {
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
  pdfUrl: string = getReservasIaPdfUrl(),
  step: OutreachStep = 'primer_contacto'
): string {
  return applyOutreachSettings(composeOutreachMessage(lead, seller, tone, pdfUrl, step));
}

function composeOutreachMessage(
  lead: BusinessLead,
  seller: SellerProfile = loadSellerProfile(),
  tone: OutreachTone = seller.defaultTone || 'cercano',
  pdfUrl: string = getReservasIaPdfUrl(),
  step: OutreachStep = 'primer_contacto'
): string {
  if (step !== 'primer_contacto') return buildFollowUpMessage(lead, seller, tone, pdfUrl, step);
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
  const offer = web === 'own' || !getOutreachSettings().offerLanding ? [agent] : [landing, agent];
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

/** Seguimientos: breves, sin presionar, y cada uno aporta algo distinto al anterior. */
function buildFollowUpMessage(
  lead: BusinessLead,
  seller: SellerProfile,
  tone: OutreachTone,
  pdfUrl: string,
  step: Exclude<OutreachStep, 'primer_contacto'>
): string {
  const sender = senderLine(seller);
  const web = webSituation(lead);
  const benefit = SECTOR_BENEFITS[detectSector(lead)];
  const value =
    web === 'own'
      ? 'un asistente por WhatsApp que atiende, agenda y confirma citas 24/7, para que no se les pierda ningún cliente.'
      : 'una landing page que carga rápido en el celular y un asistente por WhatsApp que atiende, agenda y confirma citas 24/7.';
  const pdf = `📄 Por si se les pasó, aquí está la presentación:\n${pdfUrl}`;

  if (step === 'seguimiento_1') {
    if (tone === 'directo') {
      return [`Hola, le habla ${sender}. Le escribí hace unos días sobre *${lead.name}*.`, '', `Le resumo: ${value}`, '', pdf, '', '¿La alcanzó a ver? Puedo explicársela en 10 minutos.'].join('\n');
    }
    if (tone === 'profesional') {
      return [`Buenos días, le saluda nuevamente ${sender}.`, '', `Hace unos días le escribí sobre *${lead.name}*. Le comparto de forma breve lo esencial: ${value}`, '', pdf, '', 'Quedo atento para resolver cualquier duda o coordinar una reunión corta.'].join('\n');
    }
    return [`¡Hola de nuevo! 👋 Soy ${sender}. Les escribí hace unos días sobre *${lead.name}*.`, '', `Sé que el día a día no da tregua, así que se lo dejo cortito: ${value}`, '', pdf, '', '¿Alcanzaron a mirarla? Si prefieren, se las explico en una llamada de 10 minutos 🙌'].join('\n');
  }

  if (step === 'seguimiento_2') {
    if (tone === 'directo') {
      return [`${sender}, una última idea concreta para *${lead.name}*:`, '', `Con ReservasIA tendrían ${benefit}`, '', 'Les armo una demo corta con los datos de su negocio, sin costo. ¿Esta semana o la próxima?'].join('\n');
    }
    if (tone === 'profesional') {
      return [`Buenos días, le saluda ${sender}.`, '', `Para *${lead.name}*, ReservasIA ofrece ${benefit}`, '', 'Podemos preparar una demostración breve con los datos de su negocio, sin costo ni compromiso. ¿Le queda mejor esta semana o la próxima?'].join('\n');
    }
    return [`¡Hola! 😊 Soy ${sender} otra vez. Quería compartirles algo concreto para *${lead.name}*:`, '', `✨ Con ReservasIA tendrían ${benefit}`, '', 'Si les sirve, les preparo una demo corta con los datos de su negocio, sin costo ni compromiso.', '', '¿Qué día les queda mejor para verla: esta semana o la próxima?'].join('\n');
  }

  // cierre
  if (tone === 'directo') {
    return [`${sender}: no insistiré más por ahora.`, '', `Si más adelante quieren que *${lead.name}* atienda y agende clientes automáticamente, aquí tienen la presentación:`, pdfUrl, '', 'Si prefieren que no les escriba, díganmelo y lo respeto.'].join('\n');
  }
  if (tone === 'profesional') {
    return [`Buenos días, le saluda ${sender}.`, '', 'Para no ser insistente, este será mi último mensaje por ahora.', '', `Si en el futuro *${lead.name}* desea automatizar su atención y sus reservas, la presentación sigue disponible:`, pdfUrl, '', 'Si prefiere que no volvamos a escribirle, con gusto lo respetamos. Quedo atento y le deseo muchos éxitos.'].join('\n');
  }
  return [`Hola, soy ${sender}. Para no ser insistente, este será mi último mensaje por ahora 🙂`, '', `Si más adelante quieren que *${lead.name}* atienda y agende clientes de forma automática, aquí estaré; y la presentación sigue disponible:`, pdfUrl, '', 'Si prefieren que no les escriba más, solo díganmelo y lo respeto. ¡Muchos éxitos! 🌟'].join('\n');
}

/** Tono con el que se arman los mensajes de este negocio: el del borrador elegido o, si no hay, el del perfil. */
export const toneForLead = (lead: BusinessLead, seller: SellerProfile): OutreachTone =>
  lead.drafts?.tone || seller.defaultTone || 'cercano';

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
