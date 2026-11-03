import React, { useEffect, useMemo } from 'react';
import { Download, FileText, Globe, Mail, MessageCircle, Phone } from 'lucide-react';
import { CardData, buildVCard, cardPhoneDigits, decodeCard, isEmail, safeWebUrl } from '../../services/digitalCard';
import { RESERVASIA_APP_URL } from '../../services/outreachMessage';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/** Página pública de la tarjeta digital: se arma solo con los datos que trae el enlace. */
export const DigitalCardPage: React.FC<{ encoded: string }> = ({ encoded }) => {
  const card = useMemo<CardData | null>(() => decodeCard(encoded), [encoded]);

  useEffect(() => {
    document.title = card ? `${card.n} · Tarjeta digital` : 'Tarjeta digital';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [card]);

  if (!card) {
    return (
      <main className="min-h-dvh bg-slate-950 text-slate-300 flex items-center justify-center p-6 text-center">
        <p className="text-sm">Esta tarjeta no es válida o el enlace está incompleto.</p>
      </main>
    );
  }

  const phone = cardPhoneDigits(card.p);
  const web = safeWebUrl(card.w);
  const email = isEmail(card.e) ? card.e!.trim() : null;
  const waText = `Hola ${card.n}, vi tu tarjeta digital y me gustaría conocer más.`;

  const saveContact = () => {
    const blob = new Blob([buildVCard(card)], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.n.replace(/[^\w\-]+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const action =
    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-colors';

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100 flex items-start sm:items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-br from-emerald-600/30 via-slate-900 to-slate-900 px-6 pt-8 pb-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-2xl font-bold">
            {initials(card.n) || '·'}
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight break-words">{card.n}</h1>
          {card.c && <p className="text-sm text-emerald-300 font-medium break-words">{card.c}</p>}
          {card.r && <p className="mt-2 text-xs text-slate-300 leading-relaxed break-words">{card.r}</p>}
        </div>

        <div className="px-5 pb-6 space-y-2.5">
          {phone && (
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${action} bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white`}
            >
              <MessageCircle className="w-5 h-5" /> Escríbeme por WhatsApp
            </a>
          )}
          {phone && (
            <a href={`tel:+${phone}`} className={`${action} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100`}>
              <Phone className="w-5 h-5 text-emerald-400" /> Llamar
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className={`${action} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100 break-all`}>
              <Mail className="w-5 h-5 text-emerald-400 shrink-0" /> {email}
            </a>
          )}
          {web && (
            <a href={web} target="_blank" rel="noopener noreferrer" className={`${action} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100`}>
              <Globe className="w-5 h-5 text-emerald-400" /> Sitio web
            </a>
          )}
          <a
            href={safeWebUrl(card.a) ?? RESERVASIA_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${action} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100`}
          >
            <FileText className="w-5 h-5 text-emerald-400" /> Conocer ReservasIA
          </a>
          <button
            type="button"
            onClick={saveContact}
            className={`${action} bg-transparent hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer`}
          >
            <Download className="w-5 h-5 text-emerald-400" /> Guardar contacto
          </button>
        </div>
      </div>
    </main>
  );
};
