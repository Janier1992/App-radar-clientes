import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  ChevronDown, 
  Sparkles,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { BusinessLead, PipelineStatus } from '../../types';

interface LeadsAnalyticsSummaryProps {
  leads: BusinessLead[];
}

// Valor medio estimado de servicios digitales para pymes en Medellín y Colombia (en pesos colombianos COP)
const ESTIMATED_SERVICE_VALUES: Record<string, number> = {
  web_nueva: 2400000,
  agente_whatsapp: 1800000,
  sistema_citas: 1600000,
  default: 2000000,
};

const formatCOP = (val: number): string => {
  return `$ ${val.toLocaleString('es-CO')} COP`;
};

const STATUS_METRICS_CONFIG: {
  id: PipelineStatus;
  label: string;
  color: string;
}[] = [
  { id: 'nuevo', label: 'Nuevo', color: '#94a3b8' },
  { id: 'analizado', label: 'Analizado', color: '#60a5fa' },
  { id: 'contactado', label: 'Contactado', color: '#f59e0b' },
  { id: 'respondio', label: 'Respondió', color: '#c084fc' },
  { id: 'reunion', label: 'Reunión', color: '#818cf8' },
  { id: 'cliente', label: 'Cliente', color: '#10b981' },
  { id: 'descartado', label: 'Descartado', color: '#f43f5e' },
];

export const LeadsAnalyticsSummary: React.FC<LeadsAnalyticsSummaryProps> = ({ leads }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 1. Cálculos de métricas clave
  const totalLeads = leads.length;
  const closedClients = leads.filter((l) => l.pipelineStatus === 'cliente').length;
  const inMeetings = leads.filter((l) => l.pipelineStatus === 'reunion').length;
  const respondedOrBeyond = leads.filter((l) =>
    ['respondio', 'reunion', 'cliente'].includes(l.pipelineStatus)
  ).length;
  const contactedOrBeyond = leads.filter((l) =>
    ['contactado', 'respondio', 'reunion', 'cliente'].includes(l.pipelineStatus)
  ).length;

  // Tasa de conversión (clientes / total)
  const conversionRate = totalLeads > 0 ? ((closedClients / totalLeads) * 100).toFixed(1) : '0';
  
  // Tasa de respuesta (de los contactados, cuántos respondieron o más)
  const responseRate = contactedOrBeyond > 0 
    ? ((respondedOrBeyond / contactedOrBeyond) * 100).toFixed(1) 
    : '0';

  // Valor total del pipeline estimado
  const totalEstimatedPipeline = leads.reduce((acc, lead) => {
    if (lead.pipelineStatus === 'descartado') return acc;
    const srv = lead.analysis?.recommendedService || 'default';
    return acc + (ESTIMATED_SERVICE_VALUES[srv] || ESTIMATED_SERVICE_VALUES.default);
  }, 0);

  // Valor de clientes cerrados
  const wonValue = leads
    .filter((l) => l.pipelineStatus === 'cliente')
    .reduce((acc, lead) => {
      const srv = lead.analysis?.recommendedService || 'default';
      return acc + (ESTIMATED_SERVICE_VALUES[srv] || ESTIMATED_SERVICE_VALUES.default);
    }, 0);

  // 2. Datos para el gráfico de barras del Embudo
  const funnelBarData = STATUS_METRICS_CONFIG.map((status) => {
    const count = leads.filter((l) => l.pipelineStatus === status.id).length;
    return {
      statusKey: status.id,
      name: status.label,
      cantidad: count,
      color: status.color,
    };
  });

  // 3. Datos para el gráfico de servicios recomendados y valor
  const serviceDistributionMap: Record<string, { name: string; count: number; value: number; color: string }> = {
    web_nueva: { name: 'Página Web Nueva', count: 0, value: 0, color: '#38bdf8' },
    agente_whatsapp: { name: 'Agente IA WhatsApp', count: 0, value: 0, color: '#34d399' },
    sistema_citas: { name: 'Sistema de Citas', count: 0, value: 0, color: '#a78bfa' },
    otro: { name: 'Servicio General', count: 0, value: 0, color: '#f59e0b' },
  };

  leads.forEach((l) => {
    if (l.pipelineStatus === 'descartado') return;
    const srvKey = l.analysis?.recommendedService || 'otro';
    const target = serviceDistributionMap[srvKey] || serviceDistributionMap.otro;
    target.count += 1;
    target.value += ESTIMATED_SERVICE_VALUES[srvKey] || ESTIMATED_SERVICE_VALUES.default;
  });

  const servicePieData = Object.values(serviceDistributionMap).filter((item) => item.count > 0);

  if (totalLeads === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all">
      {/* Cabecera del panel de analítica */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Métricas del Embudo y Valor de Oportunidades</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                En vivo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Rendimiento comercial y valor económico estimado de tus negocios guardados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
        >
          <span>{isCollapsed ? 'Expandir analítica' : 'Plegar analítica'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
          {/* Tarjetas de KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Leads */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Negocios en Pipeline
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono">
                {totalLeads}
              </div>
              <p className="text-[11px] text-slate-400">
                {leads.filter((l) => l.pipelineStatus === 'nuevo').length} pendientes de contacto
              </p>
            </div>

            {/* Tasa de Conversión */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Tasa de Conversión
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {conversionRate}%
              </div>
              <p className="text-[11px] text-slate-400">
                {closedClients} clientes cerrados de {totalLeads}
              </p>
            </div>

            {/* Tasa de Respuesta */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Tasa de Respuesta
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">
                {responseRate}%
              </div>
              <p className="text-[11px] text-slate-400">
                {respondedOrBeyond} respuestas sobre {contactedOrBeyond} contactados
              </p>
            </div>

            {/* Valor Estimado del Pipeline */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Valor Estimado Cartera (COP)
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                {formatCOP(totalEstimatedPipeline)}
              </div>
              <p className="text-[11px] text-slate-400">
                {wonValue > 0 ? `${formatCOP(wonValue)} ya ganados 🎉` : 'En oportunidades activas'}
              </p>
            </div>
          </div>

          {/* Gráficos con Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gráfico 1: Embudo de Ventas por Estado (BarChart) */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Volumen de Leads por Fase del Embudo
                </h3>
                <span className="text-[11px] text-slate-400">Distribución de estados</span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs">
                            <span className="font-bold text-slate-100">{data.name}</span>
                            <div className="text-emerald-400 font-mono mt-0.5">
                              {data.cantidad} negocio{data.cantidad === 1 ? '' : 's'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} 
                  />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                    {funnelBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Servicios Recomendados y Valor Estimado (Donut/Pie) */}
          <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Valor Potencial por Servicio
              </h3>
              <span className="text-[11px] text-amber-400 font-mono font-semibold">
                Ticket medio ~ $ 1.95M COP
              </span>
            </div>

            {servicePieData.length > 0 ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={3}
                      >
                        {servicePieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                                <div className="font-bold text-slate-100">{d.name}</div>
                                <div className="text-slate-300 font-mono">{d.count} negocios</div>
                                <div className="text-emerald-400 font-mono font-bold">
                                  {formatCOP(d.value)} estimados
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda y Desglose */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  {servicePieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-100">
                        {formatCOP(item.value)} ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  Analiza negocios para ver el desglose por tipo de servicio
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
