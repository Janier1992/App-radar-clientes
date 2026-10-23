import React, { useMemo, useState } from 'react';
import {
  History,
  Search,
  Eye,
  MessageSquare,
  PhoneCall,
  Globe,
  MapPin,
  Mail,
  ChevronDown,
  ChevronRight,
  Trash2,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  BookmarkCheck,
  Handshake,
  RotateCcw,
} from 'lucide-react';
import {
  ActivityType,
  ApproachChannel,
  BusinessLead,
  SearchLogEntry,
  TrackedBusiness,
} from '../../types';
import {
  ACTIVITY_LABELS,
  ApproachStatus,
  CHANNEL_LABELS,
  countEvents,
  getApproachStatus,
} from '../../services/activityLog';

interface HistorialScreenProps {
  businesses: TrackedBusiness[];
  searches: SearchLogEntry[];
  onOpenFicha: (lead: BusinessLead) => void;
  onAddApproach: (lead: BusinessLead, channel: ApproachChannel, note: string) => void;
  onDeleteBusiness: (id: string) => void;
  onClearAll: () => void;
  onRepeatSearch: (zone: string, niche: string) => void;
}

const STATUS_META: Record<ApproachStatus, { label: string; className: string }> = {
  acercamiento: {
    label: 'Acercamiento registrado',
    className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  },
  canal_abierto: {
    label: 'Canal abierto, sin confirmar',
    className: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  },
  solo_visto: {
    label: 'Solo visto',
    className: 'text-slate-300 bg-slate-800 border-slate-700',
  },
};

const EVENT_ICONS: Record<ActivityType, React.ElementType> = {
  ficha: Eye,
  analisis: Sparkles,
  guardado: BookmarkCheck,
  whatsapp: MessageSquare,
  llamada: PhoneCall,
  web: Globe,
  maps: MapPin,
  correo: Mail,
  acercamiento: Handshake,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const csvCell = (value: string | number | undefined) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const HistorialScreen: React.FC<HistorialScreenProps> = ({
  businesses,
  searches,
  onOpenFicha,
  onAddApproach,
  onDeleteBusiness,
  onClearAll,
  onRepeatSearch,
}) => {
  const [tab, setTab] = useState<'negocios' | 'busquedas'>('negocios');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApproachStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [channel, setChannel] = useState<ApproachChannel>('whatsapp');
  const [note, setNote] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = useMemo(() => {
    const c = { acercamiento: 0, canal_abierto: 0, solo_visto: 0 };
    businesses.forEach((b) => {
      c[getApproachStatus(b)] += 1;
    });
    return c;
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (statusFilter !== 'all' && getApproachStatus(b) !== statusFilter) return false;
      if (!q) return true;
      return (
        b.lead.name.toLowerCase().includes(q) ||
        (b.lead.primaryTypeDisplayName || '').toLowerCase().includes(q) ||
        b.lead.formattedAddress.toLowerCase().includes(q) ||
        (b.lead.email || '').toLowerCase().includes(q)
      );
    });
  }, [businesses, query, statusFilter]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Negocio', 'Categoría', 'Teléfono', 'Correo', 'Web', 'Dirección',
      'Primera vez visto', 'Última actividad', 'Fichas vistas', 'WhatsApp abierto',
      'Llamadas', 'Visitas a su web', 'Acercamientos registrados', 'Estado',
      'Último acercamiento (canal)', 'Último acercamiento (nota)',
    ];
    const rows = filtered.map((b) => {
      const lastApproach = b.events.find((e) => e.type === 'acercamiento');
      return [
        b.lead.name,
        b.lead.primaryTypeDisplayName,
        b.lead.nationalPhoneNumber,
        b.lead.email,
        b.lead.websiteUri,
        b.lead.formattedAddress,
        formatDate(b.firstSeenAt),
        formatDate(b.lastActivityAt),
        countEvents(b, 'ficha'),
        countEvents(b, 'whatsapp'),
        countEvents(b, 'llamada'),
        countEvents(b, 'web'),
        countEvents(b, 'acercamiento'),
        STATUS_META[getApproachStatus(b)].label,
        lastApproach?.channel ? CHANNEL_LABELS[lastApproach.channel] : '',
        lastApproach?.note,
      ].map(csvCell).join(';');
    });
    const csv = '﻿' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `radar_historial_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddApproach = (b: TrackedBusiness) => {
    onAddApproach(b.lead, channel, note.trim());
    setNote('');
  };

  const isEmpty = businesses.length === 0 && searches.length === 0;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20 inline-flex items-center gap-1.5 mb-1">
            <History className="w-3.5 h-3.5" />
            Módulo 5: Trazabilidad
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Historial de Prospección
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Registro de los negocios que has visto y de los canales que usaste para acercarte a cada uno, más las búsquedas que realizaste. Se guarda en este navegador.
          </p>
        </div>
        {businesses.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar CSV ({filtered.length})
            </button>
            {confirmClear ? (
              <span className="inline-flex items-center gap-2 text-xs text-rose-300">
                ¿Borrar todo?
                <button
                  type="button"
                  onClick={() => { onClearAll(); setConfirmClear(false); }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                >
                  Sí, borrar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Borrar historial
              </button>
            )}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Aún no hay actividad registrada</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cada vez que hagas una búsqueda, abras la ficha de un negocio o uses WhatsApp, la llamada o su web desde la app, quedará registrado aquí.
          </p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Negocios registrados', value: businesses.length, tone: 'text-slate-100' },
              { label: 'Con acercamiento registrado', value: counts.acercamiento, tone: 'text-emerald-300' },
              { label: 'Canal abierto, sin confirmar', value: counts.canal_abierto, tone: 'text-amber-300' },
              { label: 'Búsquedas realizadas', value: searches.length, tone: 'text-sky-300' },
            ].map((card) => (
              <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</div>
                <div className={`text-2xl font-extrabold font-mono mt-1 ${card.tone}`}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Pestañas */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
            {([
              ['negocios', `Negocios (${businesses.length})`],
              ['busquedas', `Búsquedas (${searches.length})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  tab === id ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'negocios' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, categoría, dirección o correo..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | ApproachStatus)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Todos los estados</option>
                  <option value="acercamiento">Acercamiento registrado</option>
                  <option value="canal_abierto">Canal abierto, sin confirmar</option>
                  <option value="solo_visto">Solo visto</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
                  Ningún negocio coincide con el filtro.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3 w-8"></th>
                          <th className="p-3">Negocio</th>
                          <th className="p-3">Última actividad</th>
                          <th className="p-3">Actividad</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filtered.map((b) => {
                          const status = getApproachStatus(b);
                          const isOpen = expandedId === b.id;
                          const chips = (
                            ['ficha', 'whatsapp', 'llamada', 'correo', 'web', 'acercamiento'] as ActivityType[]
                          )
                            .map((type) => ({ type, n: countEvents(b, type) }))
                            .filter((c) => c.n > 0);
                          return (
                            <React.Fragment key={b.id}>
                              <tr className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isOpen ? null : b.id)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                    aria-label={isOpen ? 'Ocultar detalle' : 'Ver detalle'}
                                  >
                                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-100">{b.lead.name}</div>
                                  <div className="text-[11px] text-slate-400">
                                    {b.lead.primaryTypeDisplayName || 'Negocio local'}
                                    {b.lead.email ? ` · ${b.lead.email}` : ''}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-300 whitespace-nowrap">{formatDate(b.lastActivityAt)}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {chips.map(({ type, n }) => {
                                      const Icon = EVENT_ICONS[type];
                                      return (
                                        <span
                                          key={type}
                                          title={ACTIVITY_LABELS[type]}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px]"
                                        >
                                          <Icon className="w-3 h-3 text-slate-400" />
                                          {n}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${STATUS_META[status].className}`}>
                                    {STATUS_META[status].label}
                                  </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => onOpenFicha(b.lead)}
                                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    Ficha →
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBusiness(b.id)}
                                    className="ml-2 p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                                    title="Quitar del historial"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>

                              {isOpen && (
                                <tr className="bg-slate-950/50">
                                  <td></td>
                                  <td colSpan={5} className="p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {/* Línea de tiempo */}
                                      <div>
                                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5" /> Línea de tiempo
                                        </h4>
                                        <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                          {b.events.map((ev) => {
                                            const Icon = EVENT_ICONS[ev.type];
                                            return (
                                              <li key={ev.id} className="flex items-start gap-2 text-xs">
                                                <Icon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                                <div>
                                                  <span className="text-slate-200 font-medium">
                                                    {ACTIVITY_LABELS[ev.type]}
                                                    {ev.channel ? ` por ${CHANNEL_LABELS[ev.channel]}` : ''}
                                                  </span>
                                                  <span className="text-slate-500"> · {formatDate(ev.at)}</span>
                                                  {ev.note && <div className="text-slate-400 mt-0.5">{ev.note}</div>}
                                                </div>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>

                                      {/* Registro manual */}
                                      <div>
                                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                          <Handshake className="w-3.5 h-3.5" /> Registrar acercamiento enviado
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mb-2">
                                          Abrir WhatsApp o el marcador no confirma que enviaste el mensaje. Cuando lo hagas, déjalo registrado aquí.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                          <select
                                            value={channel}
                                            onChange={(e) => setChannel(e.target.value as ApproachChannel)}
                                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-hidden"
                                          >
                                            {(Object.keys(CHANNEL_LABELS) as ApproachChannel[]).map((c) => (
                                              <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                                            ))}
                                          </select>
                                          <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Nota opcional (ej. envié propuesta de web)"
                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddApproach(b)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            Registrar
                                          </button>
                                        </div>
                                        {status === 'acercamiento' && (
                                          <p className="text-[11px] text-emerald-300 mt-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Ya tiene {countEvents(b, 'acercamiento')} acercamiento(s) registrado(s).
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              {searches.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Todavía no has hecho búsquedas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Zona</th>
                        <th className="p-3">Nicho</th>
                        <th className="p-3 text-center">Resultados</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {searches.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 whitespace-nowrap">{formatDate(s.at)}</td>
                          <td className="p-3 font-medium text-slate-100">{s.zone}</td>
                          <td className="p-3 capitalize text-amber-300">{s.niche}</td>
                          <td className="p-3 text-center font-mono">{s.resultsCount}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => onRepeatSearch(s.zone, s.niche)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Repetir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
