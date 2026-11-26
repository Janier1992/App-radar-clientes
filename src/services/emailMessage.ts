import { BusinessLead, SellerProfile } from '../types';
import {
  OutreachStep,
  OutreachTone,
  SECTOR_BENEFITS,
  SECTOR_LINES,
  detectSector,
  getReservasIaUrl,
  webSituation,
} from './outreachMessage';
import { applyOutreachSettings, emailLinkLines, getReservasVideoUrl } from './outreachSettings';
import { composeTiendlyEmail } from './tiendlyMessage';

export interface EmailDraft {
  subject: string;
  body: string;
}

const plain = (text: string) => text.replace(/\*/g, '');

/**
 * Correo de acercamiento (mismos pasos y tonos que WhatsApp), en texto plano para abrirlo en el cliente de correo.
 * Lleva el enlace a ReservasIA.
 */
export function buildEmailDraft(
  lead: BusinessLead,
  seller: SellerProfile,
  tone: OutreachTone = seller.defaultTone || 'cercano',
  step: OutreachStep = 'primer_contacto',
  appUrl: string = getReservasIaUrl()
): EmailDraft {
  const name = lead.name;
  const sender = (seller.name || 'Synflow').trim();
  const agency = (seller.companyOrAgency || '').trim();
  const sector = detectSector(lead);
  const web = webSituation(lead);
  const hi = tone === 'cercano' ? 'Hola, equipo de' : tone === 'directo' ? 'Buen día,' : 'Estimados señores de';
  const greeting = tone === 'directo' ? `${hi} ${name}:` : `${hi} ${name}:`;
  const close = tone === 'cercano' ? 'Un abrazo,' : tone === 'directo' ? 'Saludos,' : 'Cordialmente,';
  const hook =
    web === 'own'
      ? 'Tienen web, pero un cliente que escribe fuera de horario, o mientras están atendiendo, rara vez recibe respuesta a tiempo.'
      : 'Hoy el cliente busca en Google, escribe por WhatsApp y se va con quien le responde primero.';
  const offer = [
    '• Atiende por WhatsApp 24/7: responde dudas, muestra horarios reales, agenda y confirma la cita solo.',
    '• Recordatorios automáticos: menos ausencias y una agenda más llena.',
    '• Cero dobles reservas: el calendario siempre ordenado.',
    '• Más tiempo para atender y vender: su equipo se dedica a los clientes, no a contestar el chat.',
  ];
  const landingPs =
    web === 'own' ? [] : ['', 'P.D. Y si por ahora no necesitan un sistema de reservas, también creamos páginas web profesionales para que más clientes los encuentren en Google y en redes.'];

  const emailLinks = (label: string) => emailLinkLines(label, appUrl, getReservasVideoUrl());
  let subject: string;
  let lines: string[];

  if (lead.solutionId === 'tiendly') {
    const t = composeTiendlyEmail(lead, step, greeting);
    const sig = [close, sender, agency && !agency.toLowerCase().includes(sender.toLowerCase()) ? agency : ''].filter(Boolean).join('\n');
    return { subject: t.subject, body: applyOutreachSettings(`${plain(t.lines.join('\n'))}\n\n${sig}`, { signature: true }) };
  }

  switch (step) {
    case 'primer_contacto':
      subject = `Digitalice la atención de ${name} y no pierda más clientes`;
      lines = [greeting, '', `Conocí ${name} en Google Maps${lead.rating && (lead.userRatingCount ?? 0) >= 10 ? ` y me llamó la atención su calificación de ${lead.rating.toFixed(1)} con ${lead.userRatingCount} reseñas` : ''}. ${hook}`, '', 'Desarrollamos ReservasIA, un asistente que digitaliza la atención de su negocio para que atienda más clientes y venda más:', ...offer, '', SECTOR_LINES[sector], ...emailLinks('Pueden ver cómo funciona ReservasIA aquí:'), '', `¿Les parece si les muestro en 10 minutos cómo quedaría para ${name}? Sin compromiso.`, ...landingPs];
      break;
    case 'seguimiento_1':
      subject = `Seguimiento: ReservasIA para ${name}`;
      lines = [greeting, '', `Hace unos días les escribí sobre ${name}. Sé que el día a día no da tregua, así que les resumo: un asistente por WhatsApp que atiende, agenda y confirma citas 24/7, para que no se les pierda ningún cliente y su negocio venda más.`, ...emailLinks('Por si se les pasó, aquí pueden ver cómo funciona:'), '', '¿Alcanzaron a verlo? Si prefieren, se lo explico en una llamada de 10 minutos.'];
      break;
    case 'seguimiento_2':
      subject = `Una idea concreta para ${name}`;
      lines = [greeting, '', `Para ${name}, ReservasIA ofrece ${SECTOR_BENEFITS[sector]}`, '', 'Si les sirve, les preparo una demo corta con los datos de su negocio, sin costo ni compromiso.', '', '¿Qué día les queda mejor para verla: esta semana o la próxima?'];
      break;
    default:
      subject = `Cierro el seguimiento con ${name}`;
      lines = [greeting, '', 'Para no ser insistente, este será mi último mensaje por ahora.', '', `Si más adelante quieren que ${name} atienda y agende clientes de forma automática, ReservasIA sigue disponible aquí: ${appUrl}`, '', 'Si prefieren que no les escriba más, solo díganmelo y lo respeto. ¡Muchos éxitos!'];
  }

  const signature = [close, sender, agency && !agency.toLowerCase().includes(sender.toLowerCase()) ? agency : ''].filter(Boolean).join('\n');
  // La firma propia (Ajustes) reemplaza a la firma por defecto cuando existe.
  const body = applyOutreachSettings(`${plain(lines.join('\n'))}\n\n${signature}`, { signature: true });
  return { subject, body };
}

const enc = encodeURIComponent;

export const mailtoUrl = (to: string | undefined, draft: EmailDraft) =>
  `mailto:${to ? enc(to) : ''}?subject=${enc(draft.subject)}&body=${enc(draft.body)}`;

export const gmailComposeUrl = (to: string | undefined, draft: EmailDraft) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${to ? enc(to) : ''}&su=${enc(draft.subject)}&body=${enc(draft.body)}`;
