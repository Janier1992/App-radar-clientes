import React, { useMemo, useState } from 'react';
import { Ban, BellRing, CalendarClock, Check, ChevronDown, ChevronUp, MessageSquare, Send, Clock3, Eye } from 'lucide-react';
import { ActivityType, BusinessLead, TrackedBusiness } from '../../types';
import { useOutreach } from '../../services/outreachContext';
import { STEP_LABELS } from '../../services/outreachMessage';
import { DAILY_LIMIT, QueueItem, buildContactQueue, sentToday } from '../../services/outreachPlan';
import { detectSector } from '../../services/outreachMessage';
import { limitNotice, timingHint } from '../../services/bestTime';

interface Props {
  leads: BusinessLead[];
  tracked: TrackedBusiness[];
  onTrack?: (lead: BusinessLead, type: ActivityType) => void;
  onOpenFicha: (lead: BusinessLead) => void;
}

const SNOOZE_KEY = 'radar_queue_snooze';

/** «Pospuestos hoy»: se guardan por fecha en el navegador y caducan solos al día siguiente. */
function loadSnoozed(today: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}');
    return raw.date === today && Array.isArray(raw.ids) ? raw.ids : [];
  } catch {
    return [];
  }
}

const KIND_STYLES: Record<QueueItem['kind'], string> = {
  respondio: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  seguimiento: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  accion: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  confirmar: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  primer_contacto: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

export const ContactTodayPanel: React.FC<Props> = ({ leads, tracked, onTrack, onOpenFicha }) => {
  const { waUrl, replyUrl, blocked, actions } = useOutreach();
  const now = new Date();
  const today = now.toLocaleDateString('en-CA');
  const [snoozed, setSnoozed] = useState<string[]>(() => loadSnoozed(today));
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const queue = useMemo(
    () => buildContactQueue(leads, tracked, new Date(), new Set(snoozed), blocked),
    [leads, tracked, snoozed, blocked]
  );
  const doneToday = sentToday(tracked, now);
  const remaining = Math.max(0, DAILY_LIMIT - doneToday);
  const notice = limitNotice(doneToday, DAILY_LIMIT);
  const visible = showAll ? queue : queue.slice(0, Math.min(queue.length, Math.max(remaining, 5)));

  const snooze = (id: string) => {
    const next = [...snoozed, id];
    setSnoozed(next);
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify({ date: today, ids: next }));
    } catch {
      /* sin almacenamiento: solo se oculta en esta sesión */
    }
  };

  if (queue.length === 0 && doneToday === 0) return null;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden" aria-label="Contactar hoy">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-slate-800/40"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-100">Contactar hoy ({queue.length})</span>
            <span
              className={`block text-[11px] truncate ${
                notice.tone === 'stop' ? 'text-rose-300' : notice.tone === 'warn' ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              {notice.text}
            </span>
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-800">
          {queue.length === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-400">No tienes pendientes por hoy. Guarda más negocios o registra tus acercamientos para armar la cola.</p>
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {visible.map((item) => {
                const url = item.replyId ? replyUrl(item.lead, item.replyId) : waUrl(item.lead, item.step);
                return (
                  <li key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100 truncate">{item.lead.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full border font-semibold ${KIND_STYLES[item.kind]}`}>{item.title}</span>
                        <span className="text-slate-400 inline-flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {item.detail}
                        </span>
                        <span className="text-slate-500">
                          · Mensaje: {item.replyId ? 'Proponer la demo' : STEP_LABELS[item.step]}
                        </span>
                      </div>
                      {(() => {
                        const hint = timingHint(detectSector(item.lead), now);
                        return (
                          <p className={`mt-1 text-[11px] ${hint.ideal ? 'text-emerald-400' : 'text-slate-500'}`}>
                            🕒 {hint.text}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => (item.replyId ? actions.sendReply(item.lead, 'Proponer la demo') : onTrack?.(item.lead, 'whatsapp'))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenFicha(item.lead)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ficha
                      </button>
                      {item.kind !== 'respondio' && (
                        <button
                          type="button"
                          onClick={() => actions.markResponded(item.lead)}
                          title="El negocio contestó: pasa a «Respondió»"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Respondió
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Marcar a ${item.lead.name} como «no contactar»? Dejará de aparecer en la cola y no se abrirá WhatsApp para este negocio.`)) {
                            actions.markDoNotContact(item.lead, 'Marcado desde Contactar hoy');
                          }
                        }}
                        title="No volver a escribirle"
                        aria-label={`No contactar a ${item.lead.name}`}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-slate-800 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => snooze(item.id)}
                        title="Quitar de la lista de hoy"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Mañana
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {queue.length > visible.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800/40 border-t border-slate-800 cursor-pointer"
            >
              Ver los {queue.length - visible.length} restantes (ya superarías el tope sugerido de {DAILY_LIMIT} al día)
            </button>
          )}
          <p className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-800 flex items-start gap-1.5">
            <Send className="w-3 h-3 mt-0.5 shrink-0" />
            Escribe a mano, uno por uno: WhatsApp puede bloquear números que envían muchos mensajes seguidos.
          </p>
        </div>
      )}
    </section>
  );
};
