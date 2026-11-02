import React, { useEffect, useRef, useState } from 'react';
import { Check, MessageSquare, X } from 'lucide-react';
import { BusinessLead, TrackedBusiness } from '../../types';
import { STEP_LABELS, STEP_WAIT_DAYS, OUTREACH_STEPS } from '../../services/outreachMessage';
import { suggestedStep } from '../../services/outreachPlan';

const PENDING_KEY = 'radar_pending_send';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const EVENT_NAME = 'radar:pending-send';

interface Pending {
  lead: BusinessLead;
  at: number;
}

/** Se llama al tocar un botón de WhatsApp: deja pendiente la pregunta «¿lo enviaste?» para cuando se vuelva a la app. */
export function markPendingSend(lead: BusinessLead) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ lead, at: Date.now() } satisfies Pending));
  } catch {
    /* sin almacenamiento: no hay confirmación rápida */
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pending;
    if (!parsed?.lead?.id || Date.now() - parsed.at > MAX_AGE_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const clearPending = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* nada que limpiar */
  }
};

interface Props {
  tracked: TrackedBusiness[];
  onConfirm: (lead: BusinessLead) => void;
}

/** Tarjeta flotante que aparece al volver de WhatsApp para registrar el acercamiento con un toque. */
export const PendingSendPrompt: React.FC<Props> = ({ tracked, onConfirm }) => {
  const [pending, setPending] = useState<Pending | null>(() => readPending());
  const [visible, setVisible] = useState<boolean>(() => readPending() !== null); // al abrir la app con un envío sin confirmar
  const wasHidden = useRef(false);

  useEffect(() => {
    const onMarked = () => {
      wasHidden.current = false;
      setPending(readPending());
      setVisible(false);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden.current = true;
        return;
      }
      if (wasHidden.current) {
        wasHidden.current = false;
        const current = readPending();
        setPending(current);
        setVisible(current !== null);
      }
    };
    window.addEventListener(EVENT_NAME, onMarked);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener(EVENT_NAME, onMarked);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!pending || !visible) return null;

  const step = suggestedStep(tracked.find((t) => t.id === pending.lead.id));
  const waitDays = STEP_WAIT_DAYS[step];
  const close = () => {
    clearPending();
    setPending(null);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Confirmar envío de WhatsApp"
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-emerald-500/40 bg-slate-900/98 shadow-2xl backdrop-blur p-3.5 space-y-3">
        <div className="flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">¿Enviaste el mensaje a {pending.lead.name}?</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Se registrará como acercamiento por WhatsApp ({STEP_LABELS[step]})
              {step !== OUTREACH_STEPS[OUTREACH_STEPS.length - 1]
                ? ` y te recordaremos el siguiente seguimiento en ${waitDays} días.`
                : ' y la secuencia quedará completa.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Decidir más tarde"
            className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onConfirm(pending.lead);
              close();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Sí, lo envié
          </button>
          <button
            type="button"
            onClick={close}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            No lo envié
          </button>
        </div>
      </div>
    </div>
  );
};
