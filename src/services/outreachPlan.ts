import { BusinessLead, PipelineStatus, TrackedBusiness } from '../types';
import { cleanColombianPhoneNumber, isMobilePhoneNumber } from './phoneUtils';
import { OUTREACH_STEPS, OutreachStep, STEP_LABELS, STEP_WAIT_DAYS, nextStepForCount } from './outreachMessage';

/** Tope diario recomendado para cuidar el número de WhatsApp y no parecer spam. */
export const DAILY_LIMIT = 20;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Etapas en las que ya no tiene sentido seguir escribiendo. */
const CLOSED_STATUSES: PipelineStatus[] = ['respondio', 'reunion', 'cliente', 'descartado'];

export type QueueKind = 'seguimiento' | 'accion' | 'confirmar' | 'primer_contacto';

export interface QueueItem {
  id: string;
  kind: QueueKind;
  lead: BusinessLead;
  step: OutreachStep; // mensaje que toca enviar
  title: string; // motivo corto
  detail: string;
  priority: number; // menor = más urgente
}

/** Fecha local en formato AAAA-MM-DD (la misma que usa el campo «próxima acción»). */
export const dateKey = (d: Date) => d.toLocaleDateString('en-CA');

export const approachEvents = (t?: TrackedBusiness) => (t ? t.events.filter((e) => e.type === 'acercamiento') : []);

export const approachCount = (t?: TrackedBusiness) => approachEvents(t).length;

/** Mensaje que toca enviar a este negocio según los acercamientos ya registrados. */
export const suggestedStep = (t?: TrackedBusiness): OutreachStep => nextStepForCount(approachCount(t)) ?? 'cierre';

/** Acercamientos registrados hoy (para el contador del tope diario). */
export function sentToday(tracked: TrackedBusiness[], now: Date): number {
  const today = dateKey(now);
  return tracked.reduce(
    (sum, t) => sum + approachEvents(t).filter((e) => dateKey(new Date(e.at)) === today).length,
    0
  );
}

/** Fecha sugerida para el siguiente seguimiento tras registrar el acercamiento número `count`. */
export function nextActionAfter(count: number, from: Date): string | undefined {
  const sent = OUTREACH_STEPS[count - 1];
  if (!sent || count >= OUTREACH_STEPS.length) return undefined; // secuencia terminada
  return dateKey(new Date(from.getTime() + STEP_WAIT_DAYS[sent] * DAY_MS));
}

const hasWhatsApp = (lead: BusinessLead) => isMobilePhoneNumber(cleanColombianPhoneNumber(lead.nationalPhoneNumber) || lead.nationalPhoneNumber);

/**
 * Construye la lista «contactar hoy»: seguimientos vencidos, acciones programadas, envíos sin confirmar
 * y negocios guardados que aún no han recibido el primer mensaje. Solo usa datos del navegador.
 */
export function buildContactQueue(
  leads: BusinessLead[],
  tracked: TrackedBusiness[],
  now: Date,
  snoozedToday: Set<string> = new Set()
): QueueItem[] {
  const today = dateKey(now);
  const savedById = new Map(leads.map((l) => [l.id, l]));
  const trackedById = new Map(tracked.map((t) => [t.id, t]));
  const items = new Map<string, QueueItem>();

  const statusOf = (lead: BusinessLead) => (savedById.get(lead.id) ?? lead).pipelineStatus;
  const isOpen = (lead: BusinessLead) => !CLOSED_STATUSES.includes(statusOf(lead));
  const currentLead = (lead: BusinessLead) => savedById.get(lead.id) ?? lead;

  // 1) Seguimientos vencidos y envíos sin confirmar (negocios con historial)
  for (const t of tracked) {
    if (snoozedToday.has(t.id)) continue;
    const lead = currentLead(t.lead);
    if (!isOpen(lead) || !hasWhatsApp(lead)) continue;

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
      (e) => e.type === 'whatsapp' && new Date(e.at).getTime() > lastApproachAt && now.getTime() - new Date(e.at).getTime() < 3 * DAY_MS
    );
    if (openedWa) {
      items.set(t.id, {
        id: t.id,
        kind: 'confirmar',
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
    if (items.has(lead.id) || snoozedToday.has(lead.id) || !isOpen(lead)) continue;
    if (lead.nextActionDate && lead.nextActionDate <= today) {
      items.set(lead.id, {
        id: lead.id,
        kind: 'accion',
        lead,
        step: suggestedStep(trackedById.get(lead.id)),
        title: 'Acción programada',
        detail: lead.nextActionDate === today ? 'Programada para hoy' : `Programada para el ${lead.nextActionDate}`,
        priority: 10,
      });
    }
  }

  // 3) Primer contacto para los leads guardados que nunca recibieron mensaje
  for (const lead of leads) {
    if (items.has(lead.id) || snoozedToday.has(lead.id)) continue;
    if (!['nuevo', 'analizado'].includes(lead.pipelineStatus) || !hasWhatsApp(lead)) continue;
    if (approachCount(trackedById.get(lead.id)) > 0) continue;
    items.set(lead.id, {
      id: lead.id,
      kind: 'primer_contacto',
      lead,
      step: 'primer_contacto',
      title: 'Primer contacto',
      detail: typeof lead.opportunityScore === 'number' ? `Oportunidad ${lead.opportunityScore}/100` : 'Aún no le has escrito',
      priority: 30 + (100 - (lead.opportunityScore ?? 0)),
    });
  }

  return [...items.values()].sort((a, b) => a.priority - b.priority);
}
