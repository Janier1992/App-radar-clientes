import { BusinessLead, SellerProfile } from '../types';
import {
  OutreachStep,
  OutreachTone,
  SECTOR_BENEFITS,
  SECTOR_LINES,
  detectSector,
  getReservasIaPdfUrl,
  webSituation,
} from './outreachMessage';
import { applyOutreachSettings } from './outreachSettings';

export interface EmailDraft {
  subject: string;
  body: string;
}

const plain = (text: string) => text.replace(/\*/g, '');

/**
 * Correo de acercamiento (mismos pasos y tonos que WhatsApp), en texto plano para abrirlo en el cliente de correo.
 * Lleva el enlace a la presentación en PDF; no se adjunta archivo porque un enlace `mailto:` no lo permite.
 */
export function buildEmailDraft(
  lead: BusinessLead,
  seller: SellerProfile,
  tone: OutreachTone = seller.defaultTone || 'cercano',
  step: OutreachStep = 'primer_contacto',
  pdfUrl: string = getReservasIaPdfUrl()
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
    web === 'none'
      ? 'Vi que todavía no cuentan con una página web propia, y hoy la mayoría de clientes busca en Google desde el celular antes de llamar.'
      : web === 'social'
      ? 'Vi que hoy dependen de sus redes para que los encuentren, y ahí es fácil que el cliente se pierda antes de escribirles.'
      : 'Vi su página web y creo que se puede aprovechar más para convertir visitas en reservas y consultas.';
  const offer = [
    web === 'own' ? '' : '• Landing page profesional: rápida en celular, con su ubicación, servicios y botón directo de WhatsApp.',
    '• ReservasIA: un asistente que atiende por WhatsApp 24/7, muestra horarios reales, agenda y confirma solo, y envía recordatorios para reducir las ausencias.',
  ].filter(Boolean);

  let subject: string;
  let lines: string[];

  switch (step) {
    case 'primer_contacto':
      subject = web === 'own' ? `Atención 24/7 por WhatsApp para ${name}` : `Presencia web y reservas automáticas para ${name}`;
      lines = [greeting, '', `Conocí ${name} en Google Maps${lead.rating && (lead.userRatingCount ?? 0) >= 10 ? ` y me llamó la atención su calificación de ${lead.rating.toFixed(1)} con ${lead.userRatingCount} reseñas` : ''}. ${hook}`, '', 'Les propongo:', ...offer, '', SECTOR_LINES[sector], '', `Les dejo la presentación con cómo funciona: ${pdfUrl}`, '', `¿Les parece si les muestro en 10 minutos cómo quedaría para ${name}? Sin compromiso.`];
      break;
    case 'seguimiento_1':
      subject = `Seguimiento: presentación de ReservasIA para ${name}`;
      lines = [greeting, '', `Hace unos días les escribí sobre ${name}. Sé que el día a día no da tregua, así que les resumo: un asistente por WhatsApp que atiende, agenda y confirma citas 24/7${web === 'own' ? '' : ', más una landing page rápida en celular'}.`, '', `Por si se les pasó, aquí está la presentación: ${pdfUrl}`, '', '¿Alcanzaron a verla? Si prefieren, se las explico en una llamada de 10 minutos.'];
      break;
    case 'seguimiento_2':
      subject = `Una idea concreta para ${name}`;
      lines = [greeting, '', `Para ${name}, ReservasIA ofrece ${SECTOR_BENEFITS[sector]}`, '', 'Si les sirve, les preparo una demo corta con los datos de su negocio, sin costo ni compromiso.', '', '¿Qué día les queda mejor para verla: esta semana o la próxima?'];
      break;
    default:
      subject = `Cierro el seguimiento con ${name}`;
      lines = [greeting, '', 'Para no ser insistente, este será mi último mensaje por ahora.', '', `Si más adelante quieren que ${name} atienda y agende clientes de forma automática, la presentación sigue disponible: ${pdfUrl}`, '', 'Si prefieren que no les escriba más, solo díganmelo y lo respeto. ¡Muchos éxitos!'];
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
