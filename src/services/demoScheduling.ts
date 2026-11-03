import { BusinessLead, SellerProfile } from '../types';
import { downloadBlob } from './historyExport';
import { applyEmojiPolicy, getOutreachSettings } from './outreachSettings';

export type DemoMode = 'videollamada' | 'llamada' | 'presencial';

export const DEMO_MODE_LABELS: Record<DemoMode, string> = {
  videollamada: 'Videollamada',
  llamada: 'Llamada',
  presencial: 'Visita presencial',
};

export interface DemoPlan {
  startISO: string; // fecha y hora de inicio (ISO)
  minutes: number;
  mode: DemoMode;
  place?: string; // enlace de la videollamada o dirección
  notes?: string;
}

/** Duración sugerida: la que se configuró para la demo en Ajustes. */
export const defaultDemoMinutes = () => Math.min(60, Math.max(5, Math.round(getOutreachSettings().demoMinutes) || 10));

export function formatWhen(iso: string, withWeekday = true): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-CO', { weekday: withWeekday ? 'long' : undefined, day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toUtcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const endOf = (plan: DemoPlan) => new Date(new Date(plan.startISO).getTime() + plan.minutes * 60_000);

export const demoTitle = (lead: BusinessLead) => `Demo ReservasIA · ${lead.name}`;

export function demoDetails(lead: BusinessLead, seller: SellerProfile, plan: DemoPlan): string {
  return [
    `Demo de ${plan.minutes} minutos con ${lead.name} (${DEMO_MODE_LABELS[plan.mode].toLowerCase()}).`,
    lead.nationalPhoneNumber ? `Teléfono: ${lead.nationalPhoneNumber}` : '',
    lead.email ? `Correo: ${lead.email}` : '',
    lead.formattedAddress ? `Dirección: ${lead.formattedAddress}` : '',
    plan.place ? (plan.mode === 'videollamada' ? `Enlace: ${plan.place}` : `Lugar: ${plan.place}`) : '',
    plan.notes ? `Notas: ${plan.notes}` : '',
    `Agendada por ${seller.name || 'Synflow'} desde Radar de Clientes.`,
  ]
    .filter(Boolean)
    .join('\n');
}

const location = (lead: BusinessLead, plan: DemoPlan) =>
  plan.place || (plan.mode === 'presencial' ? lead.formattedAddress : '') || '';

/** Enlace para crear el evento en Google Calendar (se abre en el navegador, sin permisos ni claves). */
export function googleCalendarUrl(lead: BusinessLead, seller: SellerProfile, plan: DemoPlan): string {
  const start = new Date(plan.startISO);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: demoTitle(lead),
    dates: `${toUtcStamp(start)}/${toUtcStamp(endOf(plan))}`,
    details: demoDetails(lead, seller, plan),
    location: location(lead, plan),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsEscape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
/** Las líneas de un .ics no deben pasar de 75 caracteres: se pliegan con un espacio al inicio. */
const fold = (line: string) => (line.length <= 74 ? line : line.match(/.{1,73}/g)!.join('\r\n '));

export function buildIcs(lead: BusinessLead, seller: SellerProfile, plan: DemoPlan): string {
  const start = new Date(plan.startISO);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Radar de Clientes//Demo//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${lead.id}-${toUtcStamp(start)}@radar-de-clientes`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(endOf(plan))}`,
    `SUMMARY:${icsEscape(demoTitle(lead))}`,
    `DESCRIPTION:${icsEscape(demoDetails(lead, seller, plan))}`,
    location(lead, plan) ? `LOCATION:${icsEscape(location(lead, plan))}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(demoTitle(lead))}`,
    'TRIGGER:-PT30M',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(`Mañana: ${demoTitle(lead)}`)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(lead: BusinessLead, seller: SellerProfile, plan: DemoPlan) {
  const name = lead.name.replace(/[^\w\-]+/g, '_').slice(0, 40);
  downloadBlob(new Blob([buildIcs(lead, seller, plan)], { type: 'text/calendar;charset=utf-8' }), `demo_${name}.ics`);
}

const how = (plan: DemoPlan) =>
  plan.mode === 'videollamada'
    ? plan.place
      ? `por videollamada: ${plan.place}`
      : 'por videollamada (les comparto el enlace antes)'
    : plan.mode === 'llamada'
    ? 'por llamada'
    : plan.place
    ? `en ${plan.place}`
    : 'en su negocio';

/** Mensaje para confirmarle la demo al negocio. */
export function buildDemoConfirmation(lead: BusinessLead, seller: SellerProfile, plan: DemoPlan): string {
  const sender = (seller.name || 'Synflow').trim();
  return applyEmojiPolicy([
    '¡Perfecto, quedamos así! 🙌',
    '',
    `📅 *Demo de ReservasIA para ${lead.name}*`,
    `🕒 ${formatWhen(plan.startISO)} (${plan.minutes} minutos)`,
    `📍 ${how(plan)}`,
    '',
    'Les mostraré cómo quedaría con los datos de su negocio. Si necesitan cambiar la hora, me avisan por aquí.',
    '',
    `— ${sender}`,
  ].join('\n'));
}

/** Recordatorio para el mismo día o el día anterior. */
export function buildDemoReminder(lead: BusinessLead, seller: SellerProfile, startISO: string): string {
  const sender = (seller.name || 'Synflow').trim();
  const start = new Date(startISO);
  const today = new Date();
  const sameDay = start.toDateString() === today.toDateString();
  return applyEmojiPolicy([
    `¡Hola! 👋 Les recuerdo nuestra demo de ReservasIA ${sameDay ? 'de hoy' : 'de mañana'}:`,
    `🕒 ${formatWhen(startISO, false)}`,
    '',
    '¿Seguimos con la hora acordada? Cualquier cambio me avisan por aquí.',
    '',
    `— ${sender}`,
  ].join('\n'));
}
