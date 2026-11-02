import React, { useState } from 'react';
import { Ban, Check, Copy, MessageSquare, MessageSquareReply } from 'lucide-react';
import { BusinessLead } from '../../types';
import { useOutreach } from '../../services/outreachContext';
import { QUICK_REPLIES, QuickReplyId, buildQuickReply } from '../../services/quickReplies';

interface Props {
  lead: BusinessLead;
}

/** Respuestas de un toque para lo que suele contestar un negocio, listas para copiar o enviar por WhatsApp. */
export const QuickReplies: React.FC<Props> = ({ lead }) => {
  const { seller, replyUrl, actions, isBlockedLead } = useOutreach();
  const [selected, setSelected] = useState<QuickReplyId | null>(null);
  const [copied, setCopied] = useState(false);
  const blocked = isBlockedLead(lead);

  const option = QUICK_REPLIES.find((q) => q.id === selected);
  const text = selected ? buildQuickReply(selected, lead, seller) : '';
  const url = selected ? replyUrl(lead, selected) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* el navegador no permitió copiar */
    }
  };

  return (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <MessageSquareReply className="w-3.5 h-3.5" /> Respuestas rápidas
      </h4>
      <p className="text-[11px] text-slate-500">Elige lo que contestó el negocio y te dejamos la respuesta lista.</p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setSelected(selected === q.id ? null : q.id)}
            title={q.hint}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
              selected === q.id
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {option && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed break-words">{text}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => actions.sendReply(lead, option.label)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Enviar por WhatsApp
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Ban className="w-3.5 h-3.5" />
                {blocked ? 'Marcado como «no contactar»' : 'Sin teléfono para WhatsApp'}
              </span>
            )}
            {selected === 'no_interesa' && !blocked && (
              <button
                type="button"
                onClick={() => actions.markDoNotContact(lead, 'Pidió no recibir más mensajes')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Marcar «no contactar»
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Estado de contacto: respondió, no contactar y aviso de duplicado. */
export const ContactStatusBar: React.FC<Props> = ({ lead }) => {
  const { actions, isBlockedLead, duplicateOf } = useOutreach();
  const blocked = isBlockedLead(lead);
  const duplicate = duplicateOf(lead);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-2">
      {duplicate && (
        <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Ya le escribiste a <strong>{duplicate.lead.name}</strong>, que tiene el mismo teléfono. Evita contactar dos veces al mismo negocio.
        </p>
      )}
      {blocked ? (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 text-rose-200">
          <Ban className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 min-w-0">Marcado como «no contactar»: la app no abrirá WhatsApp para este negocio.</span>
          <button
            type="button"
            onClick={() => actions.unblock(lead.id)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold cursor-pointer hover:bg-slate-800"
          >
            Quitar de la lista
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => actions.markResponded(lead)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 font-semibold cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            El negocio respondió
          </button>
          {confirming ? (
            <span className="inline-flex items-center gap-2 text-rose-300">
              ¿No volver a escribirle?
              <button
                type="button"
                onClick={() => {
                  actions.markDoNotContact(lead, 'Marcado manualmente');
                  setConfirming(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
              >
                Sí, bloquear
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer">
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              No contactar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
