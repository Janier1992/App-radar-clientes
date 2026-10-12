import React from 'react';
import { Menu, KeyRound, Sparkles, User, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScreenType } from '../../types';

interface HeaderProps {
  activeScreen: ScreenType;
  onOpenMobileNav: () => void;
  hasGoogleCloudKey?: boolean;
  sellerName?: string;
  onNavigateToSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onOpenMobileNav,
  hasGoogleCloudKey = true,
  sellerName = 'Consultor Digital',
  onNavigateToSettings,
}) => {
  const screenTitles: Record<ScreenType, { title: string; subtitle: string }> = {
    buscar: {
      title: 'Explorador de Negocios Locales',
      subtitle: 'Encuentra empresas en tu zona, detecta si tienen web y prioriza oportunidades.',
    },
    ficha: {
      title: 'Ficha del Negocio y Auditoría',
      subtitle: 'Diagnóstico técnico, rendimiento en móvil y borradores de primer contacto.',
    },
    radar: {
      title: 'Radar de Nichos con Oportunidad',
      subtitle: 'Analiza la competencia y tasa de digitalización en varias categorías a la vez.',
    },
    leads: {
      title: 'Mis Leads y Embudo de Ventas',
      subtitle: 'Gestiona el estado de contacto, reuniones y clientes en proceso.',
    },
    ajustes: {
      title: 'Ajustes y Perfil Comercial',
      subtitle: 'Claves de API, monitor de consumo de Places y tono de los mensajes.',
    },
  };

  const current = screenTitles[activeScreen];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Mobile toggle & Titles */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight truncate">
            {current.title}
          </h2>
          <p className="text-xs text-slate-400 truncate hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right status indicators */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Google Cloud Key Badge */}
        <button
          onClick={onNavigateToSettings}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            hasGoogleCloudKey
              ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Estado de la clave de Google Cloud para Places y PageSpeed"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>{hasGoogleCloudKey ? 'Google Cloud API activa' : 'Configurar Clave Google Cloud'}</span>
          {hasGoogleCloudKey ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* Seller Profile Pill */}
        <div 
          onClick={onNavigateToSettings}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 cursor-pointer hover:border-slate-600 transition-colors"
          title="Tu perfil de prospección comercial"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            {sellerName ? sellerName.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="font-medium max-w-[120px] truncate hidden sm:inline">
            {sellerName}
          </span>
        </div>
      </div>
    </header>
  );
};
