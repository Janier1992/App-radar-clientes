import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { TIENDLY_APP_URL } from '../../services/outreachSettings';
import { RESERVASIA_APP_URL } from '../../services/outreachMessage';

const VIDEOS = {
  tiendly: {
    name: 'Tiendly',
    blurb: 'Ventas, inventario, fiados y tareas de tu tienda desde el celular, con un asistente de IA.',
    file: 'tiendly-demo',
    poster: 'tiendly-poster',
    url: TIENDLY_APP_URL,
    cta: 'Probar Tiendly',
  },
  reservasia: {
    name: 'ReservasIA',
    blurb: 'Un asistente que atiende por WhatsApp 24/7, agenda y confirma citas y envía recordatorios.',
    file: 'reservasia-demo',
    poster: 'reservasia-poster',
    url: RESERVASIA_APP_URL,
    cta: 'Conocer ReservasIA',
  },
} as const;


/** Página pública (/?video=tiendly o /?video=reservasia): el video de la solución y un botón para probar la app. Es la que se comparte en los mensajes. */
export const TiendlyVideoPage: React.FC<{ solution?: keyof typeof VIDEOS }> = ({ solution = 'tiendly' }) => {
  const v = VIDEOS[solution];
  useEffect(() => {
    document.title = `${v.name} · Así funciona`;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [v.name]);

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6 gap-5">
      <header className="text-center space-y-1 max-w-md">
        <h1 className="text-xl font-bold">{v.name} · Así funciona</h1>
        <p className="text-sm text-slate-400">
          {v.blurb}
        </p>
      </header>
      <video
        controls
        playsInline
        preload="metadata"
        poster={`/videos/${v.poster}.jpg`}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-black"
      >
        <source src={`/videos/${v.file}.mp4`} type="video/mp4" />
        Tu navegador no puede reproducir el video.
      </video>
      <a
        href={v.url}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
      >
        <ExternalLink className="w-4 h-4" />
        {v.cta}
      </a>
    </main>
  );
};
