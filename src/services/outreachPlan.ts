import { BusinessLead, PipelineStatus, TrackedBusiness } from '../types';
import { cleanColombianPhoneNumber, isMobilePhoneNumber } from './phoneUtils';
import { OUTREACH_STEPS, OutreachStep, STEP_LABELS, STEP_WAIT_DAYS, nextStepForCount } from './outreachMessage';
import { BlockedEntry, isBlocked, normalizePhone } from './doNotContact';
import { isEmail } from './digitalCard';
import type { QuickReplyId } from './quickReplies';
import { isSequenceApproach } from './outreachStats';

/** Tope diario recomendado para cuidar el número de WhatsApp y no parecer spam. */
export const DAILY_LIMIT = 20;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Etapas en las que ya no tiene sentido seguir escribiendo. */
const CLOSED_STATUSES: PipelineStatus[] = ['respondio', 'reunion', 'cliente', 'descartado'];

export type QueueKind = 'demo' | 'respondio' | 'seguimiento' | 'accion' | 'confirmar' | 'primer_contacto';

export interface QueueItem {
  id: string;
  kind: QueueKind;
  lead: BusinessLead;
  step: OutreachStep; // mensaje que toca enviar
  title: string; // motivo corto
  detail: string;
  priority: number; // menor = más urgente
  replyId?: QuickReplyId; // si el negocio ya respondió: respuesta rápida sugerida
  channel: 'whatsapp' | 'correo'; // canal para escribirle
  demoAt?: string; // fecha y hora de la demo (solo kind 'demo')
}

/** Fecha local en formato AAAA-MM-DD (la misma que usa el campo «próxima acción»). */
export const dateKey = (d: Date) => d.toLocaleDateString('en-CA');

/** Acercamientos de la secuencia: las respuestas rápidas a un negocio que ya contestó no cuentan como paso. */
export const approachEvents = (t?: TrackedBusiness) => (t ? t.events.filter(isSequenceApproach) : []);

export const approachCount = (t?: TrackedBusiness) => approachEvents(t).length;

/** Mensaje que toca enviar a este negocio según los acercamientos ya registrados. */
export const suggestedStep = (t?: TrackedBusiness): OutreachStep => nextStepForCount(approachCount(t)) ?? 'cierre';

/** Acercamientos registrados hoy (para el contador del tope diario). */
export function sentToday(tracked: TrackedBusiness[], now: Date): number {
  const today = dateKey(now);
  return tracked.reduce(
    (sum, t) => sum + t.events.filter((e) => e.type === 'acercamiento' && dateKey(new Date(e.at)) === today).length,
    0
  );
}

/** Fecha sugerida para el siguiente seguimiento tras registrar el acercamiento número `count`. */
export function nextActionAfter(count: number, from: Date): string | undefined {
  const sent = OUTREACH_STEPS[count - 1];
  if (!sent || count >= OUTREACH_STEPS.length) return undefined; // secuencia terminada
  return dateKey(new Date(from.getTime() + STEP_WAIT_DAYS[sent] * DAY_MS));
}

/** Canal por el que se puede escribir: WhatsApp si tiene celular; si no, correo si lo tiene. */
export const channelOf = (lead: BusinessLead): 'whatsapp' | 'correo' | null =>
  hasWhatsApp(lead) ? 'whatsapp' : isEmail(lead.email) ? 'correo' : null;

const hasWhatsApp = (lead: BusinessLead) => isMobilePhoneNumber(cleanColombianPhoneNumber(lead.nationalPhoneNumber) || lead.nationalPhoneNumber);

/** Otro registro (otro id) con el mismo teléfono al que ya se le escribió: evita contactar dos veces al mismo negocio. */
export function findContactedDuplicate(lead: BusinessLead, tracked: TrackedBusiness[]): TrackedBusiness | undefined {
  const phone = normalizePhone(lead.nationalPhoneNumber);
  if (!phone) return undefined;
  return tracked.find((t) => t.id !== lead.id && normalizePhone(t.lead.nationalPhoneNumber) === phone && approachCount(t) > 0);
}

/**
 * Construye la lista «contactar hoy»: seguimientos vencidos, acciones programadas, envíos sin confirmar
 * y negocios guardados que aún no han recibido el primer mensaje. Solo usa datos del navegador.
 */
export function buildContactQueue(
  leads: BusinessLead[],
  tracked: TrackedBusiness[],
  now: Date,
  snoozedToday: Set<string> = new Set(),
  blocked: BlockedEntry[] = []
): QueueItem[] {
  const today = dateKey(now);
  const savedById = new Map(leads.map((l) => [l.id, l]));
  const trackedById = new Map(tracked.map((t) => [t.id, t]));
  const items = new Map<string, QueueItem>();

  const statusOf = (lead: BusinessLead) => (savedById.get(lead.id) ?? lead).pipelineStatus;
  const isOpen = (lead: BusinessLead) => !CLOSED_STATUSES.includes(statusOf(lead));
  const currentLead = (lead: BusinessLead) => savedById.get(lead.id) ?? lead;
  const skip = (lead: BusinessLead) => snoozedToday.has(lead.id) || isBlocked(blocked, lead);

  // -1) Demos de hoy o de mañana: lo primero es prepararlas y recordárselas al negocio
  for (const t of tracked) {
    if (skip(t.lead)) continue;
    const demo = t.events.filter((e) => e.type === 'demo_agendada' && e.scheduledFor).sort((a, b) => b.at.localeCompare(a.at))[0];
    if (!demo?.scheduledFor) continue;
    const when = new Date(demo.scheduledFor).getTime();
    const lead = currentLead(t.lead);
    if (['cliente', 'descartado'].includes(lead.pipelineStatus)) continue;
    if (when < now.getTime() - 3 * 3600_000 || when > now.getTime() + 36 * 3600_000) continue;
    const sameDay = dateKey(new Date(when)) === today;
    items.set(t.id, {
      id: t.id,
      kind: 'demo',
      channel: 'whatsapp',
      lead,
      step: 'primer_contacto',
      demoAt: demo.scheduledFor,
      title: sameDay ? 'Demo hoy' : 'Demo mañana',
      detail: new Date(when).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }),
      priority: -300 + (when - now.getTime()) / 3600_000,
    });
  }

  // 0) Negocios que ya respondieron: lo más valioso es contestarles rápido
  for (const lead of leads) {
    if (lead.pipelineStatus !== 'respondio' || items.has(lead.id) || skip(lead) || !hasWhatsApp(lead)) continue;
    const answeredAt = trackedById.get(lead.id)?.events.find((e) => e.type === 'respondio')?.at;
    const days = answeredAt ? Math.floor((now.getTime() - new Date(answeredAt).getTime()) / DAY_MS) : 0;
    items.set(lead.id, {
      id: lead.id,
      kind: 'respondio',
      channel: 'whatsapp',
      lead,
      step: 'primer_contacto',
      replyId: 'agendar_demo',
      title: 'Respondió: contéstale',
      detail: days > 0 ? `Respondió hace ${days} ${days === 1 ? 'día' : 'días'}` : 'Respondió hoy',
      priority: -100 + Math.min(days, 50) * -1,
    });
  }

  // 1) Seguimientos vencidos y envíos sin confirmar (negocios con historial)
  for (const t of tracked) {
    if (items.has(t.id) || skip(t.lead)) continue;
    const lead = currentLead(t.lead);
    const channel = channelOf(lead);
    if (!isOpen(lead) || !channel) continue;

    const approaches = approachEvents(t); // más reciente primero
    const last = approaches[0];

    if (last) {
      const step = nextStepForCount(approaches.length);
      if (step) {
        const waited = STEP_WAIT_DAYS[OUTREACH_STEPS[approaches.length - 1]];
        const dueAt = new Date(last.at).getTime() + waited * DAY_MS;
        if (now.getTime() >= dueAt) {
          const overdue = Math.floor((now.getTime() - dueAt) / DAY_MS);
          items.set(t.id, {
            id: t.id,
            kind: 'seguimiento',
            channel,
            lead,
            step,
            title: `${STEP_LABELS[step]} pendiente`,
            detail: overdue > 0 ? `Venció hace ${overdue} ${overdue === 1 ? 'día' : 'días'}` : 'Toca hoy',
            priority: 0 - Math.min(overdue, 30),
          });
          continue;
        }
      }
    }

    // WhatsApp abierto después del último acercamiento y sin confirmar (últimos 3 días)
    const lastApproachAt = last ? new Date(last.at).getTime() : 0;
    const openedWa = t.events.find(
      (e) => (e.type === 'whatsapp' || e.type === 'correo') && new Date(e.at).getTime() > lastApproachAt && now.getTime() - new Date(e.at).getTime() < 3 * DAY_MS
    );
    if (openedWa) {
      items.set(t.id, {
        id: t.id,
        kind: 'confirmar',
        channel,
        lead,
        step: suggestedStep(t),
        title: '¿Enviaste el mensaje?',
        detail: 'Abriste WhatsApp pero no quedó registrado el envío',
        priority: 20,
      });
    }
  }

  // 2) Acciones programadas a mano (próxima acción vencida o de hoy)
  for (const lead of leads) {
    if (items.has(lead.id) || skip(lead) || !isOpen(lead)) continue;
    if (findContactedDuplicate(lead, tracked)) continue;
    if (lead.nextActionDate && lead.nextActionDate <= today) {
      items.set(lead.id, {
        id: lead.id,
        kind: 'accion',
        channel: channelOf(lead) ?? 'whatsapp',
        lead,
        step: suggestedStep(trackedById.get(lead.id)),
        title: 'Acción programada',
        detail: lead.nextActionDate === today ? 'Programada para hoy' : `Programada para el ${lead.nextActionDate}`,
        priority: 10,
      });
    }
  }

  // 3) Primer contacto para los leads guardados que nunca recibieron mensaje
  const seenPhones = new Set<string>();
  for (const lead of [...leads].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))) {
    if (items.has(lead.id) || skip(lead)) continue;
    const channel = channelOf(lead);
    if (!['nuevo', 'analizado'].includes(lead.pipelineStatus) || !channel) continue;
    if (approachCount(trackedById.get(lead.id)) > 0 || findContactedDuplicate(lead, tracked)) continue;
    const phone = normalizePhone(lead.nationalPhoneNumber) || (lead.email ?? '').toLowerCase();
    if (phone && seenPhones.has(phone)) continue; // mismo teléfono guardado dos veces: solo se sugiere uno
    seenPhones.add(phone);
    items.set(lead.id, {
      id: lead.id,
      kind: 'primer_contacto',
      channel,
      lead,
      step: 'primer_contacto',
      title: 'Primer contacto',
      detail: typeof lead.opportunityScore === 'number' ? `Oportunidad ${lead.opportunityScore}/100` : 'Aún no le has escrito',
      priority: 30 + (100 - (lead.opportunityScore ?? 0)),
    });
  }

  return [...items.values()].sort((a, b) => a.priority - b.priority);
}
