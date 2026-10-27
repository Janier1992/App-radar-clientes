import React, { useState } from 'react';
import { Download, RefreshCw, Share, WifiOff, X } from 'lucide-react';
import { applyUpdate, promptInstall, usePwa } from './pwa';

const DISMISS_KEY = 'radar_install_dismissed';

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/** Avisos de la app instalable: instalar, actualización disponible y modo sin conexión. */
export const PwaBanner: React.FC = () => {
  const { canInstall, installed, online, updateReady, isIos } = usePwa();
  const [dismissed, setDismissed] = useState(wasDismissed);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sin almacenamiento: solo se oculta en esta sesión */
    }
  };

  const showInstall = !installed && !dismissed && (canInstall || isIos);

  if (online && !updateReady && !showInstall) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      {!online && (
        <div className="pointer-events-auto w-full max-w-md flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-slate-900/95 px-3.5 py-2.5 text-xs text-amber-200 shadow-2xl backdrop-blur">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Sin conexión. Puedes ver tus leads e historial; las búsquedas y auditorías necesitan Internet.</span>
        </div>
      )}

      {updateReady && (
        <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-xl border border-sky-500/30 bg-slate-900/95 px-3.5 py-2.5 text-xs text-slate-200 shadow-2xl backdrop-blur">
          <RefreshCw className="w-4 h-4 shrink-0 text-sky-300" />
          <span className="flex-1">Hay una versión nueva de la app.</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
          >
            Actualizar
          </button>
        </div>
      )}

      {showInstall && (
        <div className="pointer-events-auto w-full max-w-md flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-slate-900/95 px-3.5 py-3 text-xs text-slate-200 shadow-2xl backdrop-blur">
          <Download className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100">Instala Radar de Clientes</p>
            {canInstall ? (
              <p className="text-slate-400 mt-0.5">Ábrela como una app, sin la barra del navegador y con acceso directo.</p>
            ) : (
              <p className="text-slate-400 mt-0.5">
                Toca <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <strong className="text-slate-200">Compartir</strong> y luego{' '}
                <strong className="text-slate-200">Añadir a pantalla de inicio</strong>.
              </p>
            )}
            {canInstall && (
              <button
                type="button"
                onClick={promptInstall}
                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                Instalar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar aviso de instalación"
            className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
