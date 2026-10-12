import React, { useState, useEffect } from 'react';
import { Radar, Sparkles, Building, Globe, Zap } from 'lucide-react';

interface SearchLoadingStateProps {
  zone: string;
  niche: string;
}

export const SearchLoadingState: React.FC<SearchLoadingStateProps> = ({ zone, niche }) => {
  const steps = [
    'Conectando con Google Places API (New)...',
    'Localizando empresas en ' + (zone || 'la zona indicada') + '...',
    'Clasificando páginas web (propias vs redes sociales/directorios)...',
    'Calculando puntuaciones de oportunidad comercial...',
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="space-y-6 py-6 animate-in fade-in duration-200">
      {/* Loading banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center max-w-xl mx-auto shadow-xl">
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Radar className="w-7 h-7 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-100">
          Rastreando {niche} en {zone}
        </h3>
        <p className="text-xs text-slate-400 mt-1 min-h-[18px] transition-all">
          {steps[currentStepIndex]}
        </p>

        {/* Progress bar */}
        <div className="mt-4 w-48 mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Skeletons simulating results */}
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-slate-800 rounded-md w-48" />
                <div className="h-4 bg-slate-800/80 rounded-sm w-20" />
              </div>
              <div className="h-3.5 bg-slate-800/60 rounded-md w-72" />
              <div className="flex items-center gap-3 pt-1">
                <div className="h-4 bg-slate-800/50 rounded-md w-28" />
                <div className="h-4 bg-slate-800/50 rounded-md w-24" />
              </div>
            </div>

            <div className="flex sm:flex-col items-end gap-2 shrink-0">
              <div className="h-7 bg-slate-800 rounded-full w-24" />
              <div className="h-8 bg-slate-800/70 rounded-lg w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
