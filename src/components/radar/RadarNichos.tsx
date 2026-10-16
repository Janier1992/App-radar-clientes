import React, { useState } from 'react';
import { 
  Target, 
  MapPin, 
  Sparkles, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  RefreshCw, 
  Plus, 
  X, 
  ChevronRight, 
  Award,
  Globe,
  Sliders,
  Info
} from 'lucide-react';
import { PREDEFINED_NICHES, RadarAnalysisResponse, NicheStat } from '../../types';
import { runRadarAnalysis } from '../../services/radarService';

interface RadarNichosProps {
  onNavigateToSearch: (zone: string, niche: string) => void;
  monthlyCallsCount: number;
  monthlyCallsLimit: number;
  googleCloudApiKey?: string;
  onIncrementQuota?: (count: number) => void;
}

export const RadarNichos: React.FC<RadarNichosProps> = ({
  onNavigateToSearch,
  monthlyCallsCount,
  monthlyCallsLimit,
  googleCloudApiKey,
  onIncrementQuota,
}) => {
  const [zone, setZone] = useState('Medellín, Antioquia');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'talleres mecánicos',
    'clínicas dentales',
    'fisioterapeutas',
    'peluquerías',
    'centros de estética',
    'reformas',
    'inmobiliarias',
    'autoescuelas',
  ]);
  const [customNicheInput, setCustomNicheInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [radarData, setRadarData] = useState<RadarAnalysisResponse | null>(null);

  // Añadir nicho personalizado
  const handleAddCustomNiche = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customNicheInput.trim().toLowerCase();
    if (clean && !selectedCategories.includes(clean)) {
      setSelectedCategories([...selectedCategories, clean]);
      setCustomNicheInput('');
    }
  };

  // Alternar selección
  const handleToggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories([...PREDEFINED_NICHES]);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  // Iniciar ejecución tras confirmación
  const handleConfirmRun = async () => {
    setShowConfirmModal(false);
    setIsAnalyzing(true);
    try {
      const data = await runRadarAnalysis(zone, selectedCategories, googleCloudApiKey);
      setRadarData(data);
      if (onIncrementQuota && data.placesCallsUsed) {
        onIncrementQuota(data.placesCallsUsed);
      }
    } catch (err) {
      console.warn('Aviso al ejecutar radar:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Módulo 3: Inteligencia de Mercado
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          Radar de Nichos con Mayor Oportunidad
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Compara simultáneamente varias categorías en tu zona para descubrir dónde hay más negocios sin web, mayor clientela activa y mejor rentabilidad de servicio.
        </p>
      </div>

      {/* Configuración de Escaneo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Zona geográfica */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Zona geográfica a auditar (Colombia):
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej. Medellín, El Poblado, Laureles, Envigado..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Añadir nicho libre */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Añadir otra categoría al análisis:
            </label>
            <form onSubmit={handleAddCustomNiche} className="flex gap-2">
              <input
                type="text"
                value={customNicheInput}
                onChange={(e) => setCustomNicheInput(e.target.value)}
                placeholder="Ej. Carpinterías, cerrajerías..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!customNicheInput.trim()}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </form>
          </div>
        </div>

        {/* Selector de Categorías */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-semibold text-slate-300">
              Categorías seleccionadas ({selectedCategories.length}):
            </span>
            <div className="flex items-center gap-3 text-slate-400">
              <button
                type="button"
                onClick={handleSelectAll}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Seleccionar todas (14)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                Desmarcar todas
              </button>
            </div>
          </div>

          {/* Chips clicables */}
          <div className="flex flex-wrap gap-2 pt-1">
            {PREDEFINED_NICHES.map((niche) => {
              const isSelected = selectedCategories.includes(niche);
              return (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleToggleCategory(niche)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-semibold shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-400' : 'bg-slate-600'
                    }`}
                  />
                  <span>{niche}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón Principal de Lanzamiento */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Consumo estimado: <strong>{selectedCategories.length} llamadas</strong> a Google Places API.
            </span>
          </div>

          <button
            type="button"
            disabled={isAnalyzing || selectedCategories.length === 0 || !zone.trim()}
            onClick={() => setShowConfirmModal(true)}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Escaneando nichos ({selectedCategories.length})...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Ejecutar Radar de Oportunidad</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PREVIA DE CUOTA */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Confirmación de consumo de cuota
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta acción consultará <strong>{selectedCategories.length} categorías</strong> en «{zone}» y consumirá exactamente <strong>{selectedCategories.length} llamadas</strong> a Google Places API.
                </p>
              </div>
            </div>

            {/* Estado de cuota mensual */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Consumo acumulado del mes:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {monthlyCallsCount} / {monthlyCallsLimit}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nuevo total tras escaneo:</span>
                <span className="font-mono">
                  {monthlyCallsCount + selectedCategories.length} / {monthlyCallsLimit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRun}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                Sí, escanear nichos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO DE CARGA ANIMADO */}
      {isAnalyzing && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-spin">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Analizando el mercado local en {zone}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Consultando Google Places por cada categoría, calculando el porcentaje de webs inexistentes y ordenando por oportunidad...
            </p>
          </div>
        </div>
      )}

      {/* RESULTADOS DEL RADAR */}
      {radarData && !isAnalyzing && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Origen de los datos */}
          {radarData.categories.some((c) => c.isEstimated) ? (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Las categorías marcadas como <strong>Estimado</strong> usan valores de referencia del sector, porque no hay clave de Google Cloud o la consulta a Google Places falló. Las marcadas como <strong>Dato real</strong> se calcularon con negocios reales (hasta 20 por categoría).
              </span>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Datos reales de Google Places: se analizaron hasta 20 negocios por categoría en {radarData.zone}.
              </span>
            </div>
          )}

          {/* BANNER DE RECOMENDACIÓN DE GEMINI (TOP 3) */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-amber-500/30 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Recomendación Estratégica para {radarData.zone}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {radarData.executiveSummary}
            </p>

            {/* Tarjetas Top 3 Ganadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {radarData.topRecommendations.map((top, idx) => {
                const medals = ['🥇 Nicho #1', '🥈 Nicho #2', '🥉 Nicho #3'];
                const borders = [
                  'border-amber-500/50 bg-amber-500/5',
                  'border-slate-600 bg-slate-800/40',
                  'border-amber-700/40 bg-amber-950/20',
                ];

                return (
                  <div
                    key={top.category}
                    className={`rounded-xl border p-4 space-y-2.5 flex flex-col justify-between ${borders[idx]}`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          {medals[idx]}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-100 capitalize">
                        {top.category}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {top.whyTop}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 space-y-2">
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        💼 Servicio a vender: <span className="text-slate-200 font-normal">{top.serviceToSell}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToSearch(radarData.zone, top.category)}
                        className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Ver negocios en {top.category}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA COMPARATIVA COMPLETA */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Ranking Completo de Oportunidad por Categoría
              </h3>
              <span className="text-xs text-slate-400">
                Ordenado por puntuación de oportunidad
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 text-center w-12">Puesto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-center" title="Máximo 20 negocios por consulta">Encontrados (máx. 20)</th>
                    <th className="p-3">Sin web propia (%)</th>
                    <th className="p-3 text-center">Valoración media</th>
                    <th className="p-3 text-center">Media reseñas</th>
                    <th className="p-3">Servicio recomendado</th>
                    <th className="p-3 text-center">Oportunidad</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {radarData.categories.map((cat) => (
                    <tr
                      key={cat.category}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        #{cat.opportunityRank}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-100 capitalize flex items-center gap-1.5">
                          {cat.category}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide normal-case border ${
                              cat.isEstimated
                                ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                            }`}
                            title={
                              cat.isEstimated
                                ? 'Valores de referencia del sector: no se consultó Google Places para esta categoría'
                                : 'Calculado con negocios reales de Google Places'
                            }
                          >
                            {cat.isEstimated ? 'Estimado' : 'Dato real'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {cat.opportunityRationale}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-300">
                        {cat.totalFound}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full"
                              style={{ width: `${cat.percentWithoutOwnWeb}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-amber-300">
                            {cat.percentWithoutOwnWeb}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-amber-400 font-bold">
                          {cat.avgRating} ★
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-300">
                        {cat.avgReviews}
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-medium">
                          {cat.recommendedService}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            cat.opportunityScore >= 75
                              ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                              : cat.opportunityScore >= 50
                              ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {cat.opportunityScore}/100
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateToSearch(radarData.zone, cat.category)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                          title={`Buscar negocios de ${cat.category} en ${radarData.zone}`}
                        >
                          <span>Ver negocios</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
