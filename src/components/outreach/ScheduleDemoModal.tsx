import React, { useEffect, useState } from 'react';
import { CalendarCheck, CalendarPlus, Check, Copy, Download, ExternalLink, MessageSquare, X } from 'lucide-react';
import { BusinessLead } from '../../types';
import { useOutreach } from '../../services/outreachContext';
import {
  DEMO_MODE_LABELS,
  DemoMode,
  DemoPlan,
  buildDemoConfirmation,
  defaultDemoMinutes,
  downloadIcs,
  formatWhen,
  googleCalendarUrl,
} from '../../services/demoScheduling';

const pad = (n: number) => String(n).padStart(2, '0');
const dateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Ventana para agendar la demo: queda en el historial y se puede llevar al calendario o confirmar por WhatsApp. */
export const ScheduleDemoModal: React.FC<{ lead: BusinessLead; onClose: () => void }> = ({ lead, onClose }) => {
  const { seller, actions, demoConfirmUrl } = useOutreach();
  const tomorrow = new Date(Date.now() + 24 * 3600_000);
  const [date, setDate] = useState(dateInput(tomorrow));
  const [time, setTime] = useState('10:00');
  const [minutes, setMinutes] = useState(defaultDemoMinutes());
  const [mode, setMode] = useState<DemoMode>('videollamada');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [plan, setPlan] = useState<DemoPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const field = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return setError('Elige una fecha y una hora válidas.');
    if (start.getTime() < Date.now() - 5 * 60_000) return setError('La fecha ya pasó. Elige una fecha futura.');
    const next: DemoPlan = { startISO: start.toISOString(), minutes, mode, place: place.trim() || undefined, notes: notes.trim() || undefined };
    actions.scheduleDemo(lead, next);
    setPlan(next);
    setError('');
  };

  const copyConfirmation = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(buildDemoConfirmation(lead, seller, plan));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* el navegador no permitió copiar */
    }
  };

  const confirmUrl = plan ? demoConfirmUrl(lead, plan) : null;
  const action = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Agendar demo con ${lead.name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-emerald-400 shrink-0" />
              {plan ? 'Demo agendada' : 'Agendar demo'}
            </h3>
            <p className="text-xs text-slate-400 truncate">{lead.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!plan ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Fecha</span>
                <input type="date" className={field} value={date} min={dateInput(new Date())} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hora</span>
                <input type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Duración (min)</span>
                <input type="number" min={5} max={120} className={field} value={minutes} onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 10))} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Modalidad</span>
                <select className={field} value={mode} onChange={(e) => setMode(e.target.value as DemoMode)}>
                  {(Object.keys(DEMO_MODE_LABELS) as DemoMode[]).map((m) => (
                    <option key={m} value={m}>{DEMO_MODE_LABELS[m]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {mode === 'videollamada' ? 'Enlace de la videollamada (opcional)' : mode === 'presencial' ? 'Lugar (por defecto, su dirección)' : 'Notas de la llamada (opcional)'}
              </span>
              <input className={field} value={place} onChange={(e) => setPlace(e.target.value)} placeholder={mode === 'videollamada' ? 'https://meet.google.com/…' : mode === 'presencial' ? lead.formattedAddress : ''} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notas internas (opcional)</span>
              <textarea className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué quieres mostrarles, quién asistirá…" />
            </label>
            {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
            <p className="text-[11px] text-slate-500">Al agendar, el negocio pasa a «Reunión» y la fecha queda como próxima acción.</p>
            <button type="submit" className={`${action} w-full justify-center bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white`}>
              <CalendarCheck className="w-4 h-4" /> Agendar
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-emerald-300 font-semibold flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              {formatWhen(plan.startISO)} · {plan.minutes} min · {DEMO_MODE_LABELS[plan.mode].toLowerCase()}
            </p>
            <div className="flex flex-col gap-2">
              <a href={googleCalendarUrl(lead, seller, plan)} target="_blank" rel="noopener noreferrer" className={`${action} justify-center bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100`}>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Agregar a Google Calendar
              </a>
              <button type="button" onClick={() => downloadIcs(lead, seller, plan)} className={`${action} justify-center bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100`}>
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Descargar .ics (Apple, Outlook y otros)
              </button>
              {confirmUrl && (
                <a href={confirmUrl} target="_blank" rel="noopener noreferrer" className={`${action} justify-center bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white`}>
                  <MessageSquare className="w-3.5 h-3.5" /> Confirmar por WhatsApp
                </a>
              )}
              <button type="button" onClick={copyConfirmation} className={`${action} justify-center bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300`}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copiado' : 'Copiar mensaje de confirmación'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">El archivo .ics incluye avisos 1 día y 30 minutos antes. La app te recordará la demo en «Contactar hoy».</p>
            <button type="button" onClick={onClose} className={`${action} w-full justify-center bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300`}>
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
