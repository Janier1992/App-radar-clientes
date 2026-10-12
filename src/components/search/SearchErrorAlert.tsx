import React from 'react';
import { AlertCircle, KeyRound, RefreshCw, Sliders, ExternalLink } from 'lucide-react';
import { SearchErrorState } from '../../types';

interface SearchErrorAlertProps {
  error: SearchErrorState;
  onRetry: () => void;
  onOpenSettings: () => void;
}

export const SearchErrorAlert: React.FC<SearchErrorAlertProps> = ({
  error,
  onRetry,
  onOpenSettings,
}) => {
  return (
    <div className="bg-rose-950/30 border border-rose-800/80 rounded-xl p-5 my-4 text-slate-200 animate-in fade-in duration-200">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-rose-900/50 border border-rose-700/60 text-rose-300 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="text-sm font-bold text-rose-200">
              {error.title || 'Error al conectar con el servicio de búsqueda'}
            </h4>
            <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
              {error.message}
            </p>
          </div>

          {error.technicalDetails && (
            <div className="mt-2 bg-slate-950/80 border border-slate-800/90 rounded-md p-2.5 font-mono text-[11px] text-slate-300 break-all select-all">
              <span className="text-slate-400 block mb-0.5 font-sans font-semibold text-[10px] uppercase tracking-wider">
                Respuesta técnica de Google Places API:
              </span>
              {error.technicalDetails}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 text-xs font-semibold border border-rose-700/60 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar búsqueda
            </button>

            {error.isApiKeyIssue && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Configurar clave en Ajustes
              </button>
            )}

            {error.isQuotaIssue && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Revisar consumo de cuota
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
