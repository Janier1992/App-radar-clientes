import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Loader2, X } from 'lucide-react';
import { BusinessLead } from '../../types';
import { useOutreach } from '../../services/outreachContext';
import { webSituation } from '../../services/outreachMessage';
import { hasPrices } from '../../services/proposalPdf';

/** Elige qué incluye la propuesta y genera el PDF con los precios configurados en Ajustes. */
export const ProposalModal: React.FC<{ lead: BusinessLead; onClose: () => void; onOpenSettings?: () => void }> = ({ lead, onClose, onOpenSettings }) => {
  const { seller, settings, cardUrl, actions } = useOutreach();
  const web = webSituation(lead);
  const recommended = lead.analysis?.recommendedService;
  const [landing, setLanding] = useState(web !== 'own' || recommended === 'web_nueva');
  const [reservas, setReservas] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const priced = hasPrices(settings);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const generate = async () => {
    if (!landing && !reservas) return setError('Elige al menos un servicio para la propuesta.');
    setBusy(true);
    setError('');
    try {
      const { exportProposalPdf } = await import('../../services/proposalPdf');
      await exportProposalPdf({ lead, seller, settings, cardUrl, options: { landing, reservas, note } });
      actions.logProposal(lead, [landing && 'Landing page', reservas && 'ReservasIA'].filter(Boolean).join(' + '));
      onClose();
    } catch (err) {
      console.warn('No se pudo generar la propuesta:', err);
      setError('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Propuesta comercial para ${lead.name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" /> Propuesta comercial
            </h3>
            <p className="text-xs text-slate-400 truncate">{lead.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!priced && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <p>
              Todavía no has escrito tus precios, así que el PDF dirá «el valor se define en la demo».{' '}
              {onOpenSettings && (
                <button type="button" onClick={() => { onClose(); onOpenSettings(); }} className="underline font-semibold cursor-pointer">
                  Configurar precios en Ajustes
                </button>
              )}
            </p>
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Servicios incluidos</legend>
          <label className="flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
            <input type="checkbox" checked={landing} onChange={(e) => setLanding(e.target.checked)} className="mt-1" />
            <span>Landing page profesional{web === 'own' ? <span className="text-slate-500"> (ya tiene web propia)</span> : ''}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
            <input type="checkbox" checked={reservas} onChange={(e) => setReservas(e.target.checked)} className="mt-1" />
            <span>ReservasIA: asistente de reservas por WhatsApp</span>
          </label>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Nota para este negocio (opcional)</span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. Incluye la carga inicial de su lista de precios."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </label>

        {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {busy ? 'Generando…' : 'Generar PDF'}
          </button>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
