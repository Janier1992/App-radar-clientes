import React from 'react';
import { 
  Search, 
  Building2, 
  Radar, 
  Users, 
  Settings, 
  Target,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  History
} from 'lucide-react';
import { ScreenType } from '../../types';

interface SidebarProps {
  activeScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  leadsCount?: number;
  historyCount?: number;
  hasActiveBusiness?: boolean;
  activeBusinessName?: string;
  monthlyCallsCount?: number;
  monthlyCallsLimit?: number;
  alertThreshold?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  leadsCount = 0,
  historyCount = 0,
  hasActiveBusiness = false,
  activeBusinessName,
  monthlyCallsCount = 0,
  monthlyCallsLimit = 1000,
  alertThreshold = 800,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const isNearLimit = monthlyCallsCount >= alertThreshold;
  const isOverLimit = monthlyCallsCount >= monthlyCallsLimit;

  const navItems: {
    id: ScreenType;
    label: string;
    icon: React.ElementType;
    description: string;
    badge?: string | number;
    badgeVariant?: 'default' | 'warning' | 'danger';
    disabled?: boolean;
  }[] = [
    {
      id: 'buscar',
      label: 'Buscar',
      icon: Search,
      description: 'Explora negocios por zona y nicho',
    },
    {
      id: 'ficha',
      label: 'Ficha del negocio',
      icon: Building2,
      description: hasActiveBusiness
        ? (activeBusinessName ? activeBusinessName.slice(0, 22) + (activeBusinessName.length > 22 ? '…' : '') : 'Negocio seleccionado')
        : 'Auditoría y contacto',
      badge: hasActiveBusiness ? 'Activo' : undefined,
    },
    {
      id: 'radar',
      label: 'Radar de nichos',
      icon: Target,
      description: 'Oportunidades por categoría',
    },
    {
      id: 'leads',
      label: 'Mis leads',
      icon: Users,
      description: 'Embudo de prospección CRM',
      badge: leadsCount > 0 ? leadsCount : undefined,
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      description: 'Trazabilidad de negocios y búsquedas',
      badge: historyCount > 0 ? historyCount : undefined,
    },
    {
      id: 'ajustes',
      label: 'Ajustes',
      icon: Settings,
      description: 'Claves, perfil y cuota',
      badge: isOverLimit ? 'Límite 100%' : isNearLimit ? `Alerta >${alertThreshold}` : undefined,
      badgeVariant: isOverLimit ? 'danger' : isNearLimit ? 'warning' : 'default',
    },
  ];

  const quotaPercent = Math.min(100, Math.round((monthlyCallsCount / monthlyCallsLimit) * 100));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/90 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs shadow-emerald-500/20">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">Radar de Clientes</h1>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  B2B
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Prospección Digital Local</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navegación principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-xs border-l-3 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-md transition-colors ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.badgeVariant === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-bold'
                            : item.badgeVariant === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold'
                            : isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quota & status box with visual alert */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div
            className={`rounded-xl p-3.5 space-y-2.5 transition-all ${
              isOverLimit
                ? 'bg-rose-950/40 border-2 border-rose-500 shadow-lg shadow-rose-950/50'
                : isNearLimit
                ? 'bg-amber-950/30 border border-amber-500/80 shadow-lg shadow-amber-950/40'
                : 'bg-slate-950/60 border border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap
                  className={`w-3.5 h-3.5 ${
                    isOverLimit
                      ? 'text-rose-400 animate-bounce'
                      : isNearLimit
                      ? 'text-amber-400 animate-pulse'
                      : 'text-amber-400'
                  }`}
                />
                Cuota mensual Places
              </span>
              <span
                className={`font-mono font-bold ${
                  isOverLimit
                    ? 'text-rose-400'
                    : isNearLimit
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {monthlyCallsCount} / {monthlyCallsLimit}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isOverLimit
                    ? 'bg-rose-500 animate-pulse'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>

            {/* Mensajes de Alerta Visual */}
            {isOverLimit ? (
              <div className="p-2 rounded-md bg-rose-900/40 border border-rose-700/60 text-[11px] text-rose-200 leading-tight space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  🚫 Límite mensual alcanzado
                </p>
                <p>Has llegado a {monthlyCallsLimit} peticiones. Configura tu cuota o reinicia el contador.</p>
              </div>
            ) : isNearLimit ? (
              <div className="p-2 rounded-md bg-amber-900/30 border border-amber-700/60 text-[11px] text-amber-200 leading-tight space-y-0.5">
                <p className="font-bold flex items-center gap-1 text-amber-300">
                  ⚠️ Alerta de consumo ({monthlyCallsCount} peticiones)
                </p>
                <p>
                  Superaste el umbral de aviso configurado ({alertThreshold} peticiones de 1.000).
                </p>
              </div>
            ) : null}

            <button
              onClick={() => {
                onNavigate('ajustes');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-center text-xs transition-colors pt-0.5 block font-semibold ${
                isNearLimit
                  ? 'text-amber-300 hover:text-amber-200 underline'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gestionar cuota y umbral en Ajustes →
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            Entorno local listo
          </span>
          <span className="text-[11px] text-slate-400 font-mono">v1.0</span>
        </div>
      </aside>
    </>
  );
};
