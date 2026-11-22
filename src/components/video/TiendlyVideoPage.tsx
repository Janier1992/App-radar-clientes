import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { TIENDLY_APP_URL } from '../../services/outreachSettings';

/** Página pública (/?video=tiendly): el video de Tiendly y un botón para probar la app. Es la que se comparte en los mensajes. */
export const TiendlyVideoPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Tiendly · Así funciona';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6 gap-5">
      <header className="text-center space-y-1 max-w-md">
        <h1 className="text-xl font-bold">Tiendly · Así funciona</h1>
        <p className="text-sm text-slate-400">
          Ventas, inventario, fiados y tareas de tu tienda desde el celular, con un asistente de IA.
        </p>
      </header>
      <video
        controls
        playsInline
        preload="metadata"
        poster="/videos/tiendly-poster.jpg"
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-black"
      >
        <source src="/videos/tiendly-demo.mp4" type="video/mp4" />
        Tu navegador no puede reproducir el video.
      </video>
      <a
        href={TIENDLY_APP_URL}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
      >
        <ExternalLink className="w-4 h-4" />
        Probar Tiendly
      </a>
    </main>
  );
};
