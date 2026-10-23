import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Kanban, 
  Table as TableIcon, 
  Building2, 
  Phone, 
  Globe, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  Plus, 
  Clock, 
  Star,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { ActivityType, BusinessLead, PipelineStatus } from '../../types';
import { LeadsAnalyticsSummary } from './LeadsAnalyticsSummary';
import { buildWhatsAppDirectUrl } from '../../services/phoneUtils';

interface MisLeadsProps {
  leads: BusinessLead[];
  onNavigateToBusiness: (lead: BusinessLead) => void;
  onUpdateLead: (lead: BusinessLead) => void;
  onTrack?: (lead: BusinessLead, type: ActivityType) => void;
  onDeleteLead: (id: string) => void;
  onNavigateToSearch: () => void;
}

const PIPELINE_COLUMNS: {
  id: PipelineStatus;
  label: string;
  dotColor: string;
  badgeBg: string;
  borderHeader: string;
}[] = [
  {
    id: 'nuevo',
    label: 'Nuevo',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-800 text-slate-300',
    borderHeader: 'border-slate-700',
  },
  {
    id: 'analizado',
    label: 'Analizado',
    dotColor: 'bg-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-300',
    borderHeader: 'border-blue-500/30',
  },
  {
    id: 'contactado',
    label: 'Contactado',
    dotColor: 'bg-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300',
    borderHeader: 'border-amber-500/30',
  },
  {
    id: 'respondio',
    label: 'Respondió',
    dotColor: 'bg-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300',
    borderHeader: 'border-purple-500/30',
  },
  {
    id: 'reunion',
    label: 'Reunión',
    dotColor: 'bg-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-300',
    borderHeader: 'border-indigo-500/30',
  },
  {
    id: 'cliente',
    label: 'Cliente 🎉',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300',
    borderHeader: 'border-emerald-500/40',
  },
  {
    id: 'descartado',
    label: 'Descartado',
    dotColor: 'bg-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-300',
    borderHeader: 'border-rose-500/30',
  },
];

export const MisLeads: React.FC<MisLeadsProps> = ({
  leads,
  onNavigateToBusiness,
  onUpdateLead,
  onTrack,
  onDeleteLead,
  onNavigateToSearch,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNiche, setFilterNiche] = useState<string>('all');

  // Extraer nichos únicos
  const uniqueNiches = Array.from(
    new Set(leads.map((l) => l.primaryTypeDisplayName || 'General').filter(Boolean))
  );

  // Filtrado de leads
  const filteredLeads = leads.filter((lead) => {
    // Filtro texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchAddress = lead.formattedAddress.toLowerCase().includes(q);
      const matchPhone = lead.nationalPhoneNumber?.toLowerCase().includes(q) || lead.email?.toLowerCase().includes(q);
      const matchNotes = lead.notes?.toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchPhone && !matchNotes) {
        return false;
      }
    }

    // Filtro por estado
    if (filterStatus !== 'all' && lead.pipelineStatus !== filterStatus) {
      return false;
    }

    // Filtro por nicho
    if (filterNiche !== 'all' && (lead.primaryTypeDisplayName || 'General') !== filterNiche) {
      return false;
    }

    return true;
  });

  // Mover lead de estado rápidamente
  const handleMoveStatus = (lead: BusinessLead, newStatus: PipelineStatus) => {
    onUpdateLead({
      ...lead,
      pipelineStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Nombre',
      'Categoría',
      'Teléfono',
      'Correo',
      'Dirección',
      'Tipo de Web',
      'URL Web',
      'Valoración',
      'Reseñas',
      'Puntuación Oportunidad',
      'Estado Embudo',
      'Fecha Próxima Acción',
      'Servicio Recomendado',
      'Notas',
      'Enlace Google Maps'
    ];

    const rows = filteredLeads.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.primaryTypeDisplayName || '').replace(/"/g, '""')}"`,
      `"${(l.nationalPhoneNumber || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.formattedAddress || '').replace(/"/g, '""')}"`,
      `"${l.websiteClassification.type === 'own' ? 'Web Propia' : l.websiteClassification.type === 'directory_or_social' ? `Red/Directorio (${l.websiteClassification.platform || ''})` : 'Sin Web'}"`,
      `"${(l.websiteUri || '').replace(/"/g, '""')}"`,
      l.rating ?? '',
      l.userRatingCount ?? '',
      l.opportunityScore ?? '',
      `"${l.pipelineStatus}"`,
      `"${l.nextActionDate || ''}"`,
      `"${(l.analysis?.recommendedService || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.googleMapsUri || '').replace(/"/g, '""')}"`,
    ]);

    // BOM para UTF-8 en Excel
    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `radar_leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header y Resumen de Métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Módulo 4: Embudo de Ventas (CRM)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Mis Negocios y Oportunidades Guardadas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestiona el ciclo de contacto comercial: desde que detectas el negocio hasta que cierras la reunión o el cliente.
          </p>
        </div>

        {/* Botón Exportar CSV */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={filteredLeads.length === 0}
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Exportar todos los leads filtrados a archivo CSV compatible con Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV ({filteredLeads.length})</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToSearch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buscar más leads</span>
          </button>
        </div>
      </div>

      {/* Resumen Visual del Embudo y Analítica (Recharts) */}
      <LeadsAnalyticsSummary leads={leads} />

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, dirección, teléfono o notas..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filtros Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden capitalize"
          >
            <option value="all">Todos los estados</option>
            {PIPELINE_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>

          {/* Filtro Nicho */}
          {uniqueNiches.length > 0 && (
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden capitalize max-w-[150px]"
            >
              <option value="all">Todos los nichos</option>
              {uniqueNiches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          )}

          {/* Selector de Vista: Kanban vs Tabla */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Tablero Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESTADO VACÍO SI NO HAY LEADS */}
      {leads.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Aún no tienes negocios en tu embudo
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Cuando uses el buscador o el radar de nichos, pulsa el botón «Guardar en mis leads» en cualquier negocio para organizarlo aquí en fases de venta.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSearch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Explorar y buscar negocios ahora</span>
          </button>
        </div>
      )}

      {/* VISTA 1: TABLERO KANBAN */}
      {leads.length > 0 && viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1280px]">
            {PIPELINE_COLUMNS.map((column) => {
              const columnLeads = filteredLeads.filter(
                (l) => l.pipelineStatus === column.id
              );

              return (
                <div
                  key={column.id}
                  className="w-72 shrink-0 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col max-h-[calc(100vh-250px)]"
                >
                  {/* Cabecera de Columna */}
                  <div
                    className={`p-3 border-b ${column.borderHeader} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                      <h3 className="text-xs font-bold text-slate-200 capitalize">
                        {column.label}
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${column.badgeBg}`}
                    >
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Lista de Tarjetas de la Columna */}
                  <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                    {columnLeads.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-400">
                        Sin leads en esta fase
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-lg p-3 space-y-2.5 shadow-md transition-all group"
                        >
                          {/* Categoría y Score */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold uppercase tracking-wider text-emerald-400 truncate max-w-[140px]">
                              {lead.primaryTypeDisplayName || 'Negocio local'}
                            </span>
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                                lead.opportunityScore >= 70
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : lead.opportunityScore >= 45
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {lead.opportunityScore}/100
                            </span>
                          </div>

                          {/* Nombre del Negocio (clic para abrir ficha) */}
                          <h4
                            onClick={() => onNavigateToBusiness(lead)}
                            className="text-xs font-bold text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                          >
                            {lead.name}
                          </h4>

                          {/* Teléfono y WhatsApp */}
                          {lead.nationalPhoneNumber && (
                            <div className="flex items-center justify-between gap-1">
                              <a
                                href={`tel:${lead.nationalPhoneNumber.replace(/\s+/g, '')}`}
                  onClick={() => onTrack?.(lead, 'llamada')}
                                className="text-[11px] text-slate-300 hover:text-emerald-400 flex items-center gap-1 font-mono"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{lead.nationalPhoneNumber}</span>
                              </a>
                              {buildWhatsAppDirectUrl(lead.nationalPhoneNumber) && (
                                <a
                                  href={buildWhatsAppDirectUrl(lead.nationalPhoneNumber, `Hola, me comunico con ${lead.name}. Quisiera consultar sobre sus servicios.`) || undefined}
                  onClick={() => onTrack?.(lead, 'whatsapp')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-200 p-1 rounded-sm hover:bg-emerald-500/10"
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Próxima acción */}
                          {lead.nextActionDate && (
                            <div className="text-[10px] text-amber-300 flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-900/40">
                              <Calendar className="w-3 h-3" />
                              <span>Acción: {lead.nextActionDate}</span>
                            </div>
                          )}

                          {/* Selector para cambiar de columna / fase */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                            <select
                              value={lead.pipelineStatus}
                              onChange={(e) =>
                                handleMoveStatus(lead, e.target.value as PipelineStatus)
                              }
                              className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-slate-300 focus:outline-hidden text-[10px] w-32 truncate"
                            >
                              {PIPELINE_COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  ➔ {c.label}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onDeleteLead(lead.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar lead"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigateToBusiness(lead)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                                title="Abrir ficha y auditoría"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: TABLA DETALLADA */}
      {leads.length > 0 && viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Negocio</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Presencia Web</th>
                  <th className="p-3 text-center">Oportunidad</th>
                  <th className="p-3">Próxima Acción</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeads.map((lead) => {
                  const currentColumn = PIPELINE_COLUMNS.find(
                    (c) => c.id === lead.pipelineStatus
                  );

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <div
                          onClick={() => onNavigateToBusiness(lead)}
                          className="font-bold text-slate-100 hover:text-emerald-400 cursor-pointer"
                        >
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {lead.formattedAddress}
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        {lead.primaryTypeDisplayName || 'General'}
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.pipelineStatus}
                          onChange={(e) =>
                            handleMoveStatus(lead, e.target.value as PipelineStatus)
                          }
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-hidden capitalize"
                        >
                          {PIPELINE_COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        {lead.nationalPhoneNumber ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.nationalPhoneNumber.replace(/\s+/g, '')}`}
                  onClick={() => onTrack?.(lead, 'llamada')}
                              className="text-emerald-400 hover:underline font-mono"
                            >
                              {lead.nationalPhoneNumber}
                            </a>
                            {buildWhatsAppDirectUrl(lead.nationalPhoneNumber) && (
                              <a
                                href={buildWhatsAppDirectUrl(lead.nationalPhoneNumber, `Hola, me comunico con ${lead.name}. Quisiera consultar información sobre sus servicios.`) || undefined}
                  onClick={() => onTrack?.(lead, 'whatsapp')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-200 p-1 rounded-sm hover:bg-emerald-500/10"
                                title="Contactar por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin teléfono</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} onClick={() => onTrack?.(lead, 'correo')} className="text-sky-400 hover:underline break-all">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.websiteClassification.type === 'own' ? (
                          <a
                            href={lead.websiteUri}
                  onClick={() => onTrack?.(lead, 'web')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>Web propia</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : lead.websiteClassification.type === 'directory_or_social' ? (
                          <span className="text-amber-300">
                            {lead.websiteClassification.platform || 'Red social'}
                          </span>
                        ) : (
                          <span className="text-rose-400">Sin web</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-sm ${
                            lead.opportunityScore >= 70
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : lead.opportunityScore >= 45
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {lead.opportunityScore}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        {lead.nextActionDate || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToBusiness(lead)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Ficha →
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
