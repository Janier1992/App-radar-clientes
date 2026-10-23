import React, { useState, useEffect } from 'react';
import { SearchForm } from './SearchForm';
import { SearchLoadingState } from './SearchLoadingState';
import { SearchErrorAlert } from './SearchErrorAlert';
import { QuickSearchFavorites } from './QuickSearchFavorites';
import { 
  SearchFilters, 
  SearchErrorState, 
  BusinessLead, 
  ScreenType,
  FavoriteSearch,
  ActivityType
} from '../../types';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Globe, 
  Phone, 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  LayoutGrid, 
  Table as TableIcon, 
  BookmarkPlus, 
  BookmarkCheck, 
  ChevronRight, 
  PhoneCall, 
  XCircle, 
  Zap,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Mail,
  Loader2
} from 'lucide-react';
import { classifyWebsite, calculatePreliminaryScore } from '../../services/opportunityScore';
import { searchGooglePlaces, GooglePlacesErrorDetails } from '../../services/googlePlacesClient';
import { getMockResultsForNiche } from '../../services/mockNicheDirectory';
import { isContaminatedBusiness } from '../../services/nicheClassifier';
import { buildWhatsAppDirectUrl } from '../../services/phoneUtils';
import { findEmailsForLeads } from '../../services/emailFinder';
import { isGeminiConfigured } from '../../services/geminiClient';

interface SearchScreenProps {
  onNavigateToBusiness: (lead: BusinessLead) => void;
  onNavigateToSettings: () => void;
  onSaveLead: (lead: BusinessLead) => void;
  isSavedLead: (id: string) => boolean;
  onTrack?: (lead: BusinessLead, type: ActivityType) => void;
  onSearchPerformed?: (zone: string, niche: string, resultsCount: number) => void;
  googleCloudApiKey?: string;
  onIncrementQuota?: () => void;
  initialZone?: string;
  initialNiche?: string;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onNavigateToBusiness,
  onNavigateToSettings,
  onSaveLead,
  isSavedLead,
  onTrack,
  onSearchPerformed,
  googleCloudApiKey,
  onIncrementQuota,
  initialZone = 'El Poblado, Medellín',
  initialNiche = 'talleres mecánicos',
}) => {
  const [zone, setZone] = useState(initialZone);
  const [niche, setNiche] = useState(initialNiche);

  // Sincronizar si cambian desde fuera (por ejemplo al pulsar "Ver negocios" desde Radar)
  React.useEffect(() => {
    if (initialZone) setZone(initialZone);
    if (initialNiche) setNiche(initialNiche);
  }, [initialZone, initialNiche]);

  const [filters, setFilters] = useState<SearchFilters>({
    onlyWithoutWebsite: false,
    onlyWithPhone: false,
    minRating: 0,
    minReviews: 0,
    hideClosed: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchErrorState | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<BusinessLead[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [apiNotice, setApiNotice] = useState<GooglePlacesErrorDetails | null>(null);
  const [emailLoadingIds, setEmailLoadingIds] = useState<Set<string>>(new Set());

  // Favoritos guardados en localStorage
  const [favorites, setFavorites] = useState<FavoriteSearch[]>(() => {
    try {
      const stored = localStorage.getItem('radar_favorite_searches');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('No se pudieron leer favoritos de localStorage:', e);
    }
    return [
      { id: 'fav-1', zone: 'El Poblado, Medellín', niche: 'talleres mecánicos', savedAt: new Date().toISOString() },
      { id: 'fav-2', zone: 'Laureles, Medellín', niche: 'clínicas dentales', savedAt: new Date().toISOString() },
      { id: 'fav-3', zone: 'Envigado, Antioquia', niche: 'restaurantes', savedAt: new Date().toISOString() },
      { id: 'fav-4', zone: 'Belén, Medellín', niche: 'gimnasios', savedAt: new Date().toISOString() },
      { id: 'fav-5', zone: 'Itagüí, Antioquia', niche: 'reformas', savedAt: new Date().toISOString() },
    ];
  });

  // Guardar en localStorage al cambiar favoritos
  useEffect(() => {
    try {
      localStorage.setItem('radar_favorite_searches', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Error al guardar favoritos en localStorage:', e);
    }
  }, [favorites]);

  const isCurrentFavorite = favorites.some(
    (f) =>
      f.zone.trim().toLowerCase() === zone.trim().toLowerCase() &&
      f.niche.trim().toLowerCase() === niche.trim().toLowerCase()
  );

  const handleToggleCurrentFavorite = () => {
    if (!zone.trim() || !niche.trim()) return;

    if (isCurrentFavorite) {
      setFavorites((prev) =>
        prev.filter(
          (f) =>
            !(
              f.zone.trim().toLowerCase() === zone.trim().toLowerCase() &&
              f.niche.trim().toLowerCase() === niche.trim().toLowerCase()
            )
        )
      );
    } else {
      const newFav: FavoriteSearch = {
        id: `fav-${Date.now()}`,
        zone: zone.trim(),
        niche: niche.trim(),
        savedAt: new Date().toISOString(),
      };
      setFavorites((prev) => [newFav, ...prev]);
    }
  };

  const handleDeleteFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddCustomFavorite = (customZone: string, customNiche: string) => {
    const newFav: FavoriteSearch = {
      id: `fav-${Date.now()}`,
      zone: customZone,
      niche: customNiche,
      savedAt: new Date().toISOString(),
    };
    setFavorites((prev) => [newFav, ...prev]);
  };

  const handleResetDefaultFavorites = () => {
    const defaults: FavoriteSearch[] = [
      { id: 'fav-1', zone: 'El Poblado, Medellín', niche: 'talleres mecánicos', savedAt: new Date().toISOString() },
      { id: 'fav-2', zone: 'Laureles, Medellín', niche: 'clínicas dentales', savedAt: new Date().toISOString() },
      { id: 'fav-3', zone: 'Envigado, Antioquia', niche: 'restaurantes', savedAt: new Date().toISOString() },
      { id: 'fav-4', zone: 'Belén, Medellín', niche: 'gimnasios', savedAt: new Date().toISOString() },
      { id: 'fav-5', zone: 'Itagüí, Antioquia', niche: 'reformas', savedAt: new Date().toISOString() },
    ];
    setFavorites(defaults);
  };

  const handleExecuteSearch = async (targetZone: string, targetNiche: string) => {
    setIsLoading(true);
    setError(null);
    setApiNotice(null);

    try {
      // 1. Si el usuario cuenta con una clave API de Google Cloud configurada, consultamos directamente
      if (googleCloudApiKey && googleCloudApiKey.trim()) {
        try {
          const liveResults = await searchGooglePlaces(targetZone, targetNiche, googleCloudApiKey);
          if (liveResults && liveResults.length > 0) {
            setResults(liveResults);
            onSearchPerformed?.(targetZone, targetNiche, liveResults.length);
            // Búsqueda automática de correos en segundo plano (la tabla se va llenando sola)
            void runEmailSearch(liveResults);
            if (onIncrementQuota) onIncrementQuota();
            setHasSearched(true);
            setIsLoading(false);
            return;
          }
        } catch (apiErr: any) {
          if (apiErr?.details) {
            setApiNotice(apiErr.details);
          }
          console.warn('Places API no completó búsqueda en vivo, cambiando a directorio enriquecido:', apiErr?.message);
        }
      }

      // Generar datos enriquecidos contextuales para Colombia y Medellín
      const mockData = generateMockResults(targetZone, targetNiche);
      setResults(mockData);
      setHasSearched(true);
    } catch (err: any) {
      const mockData = generateMockResults(targetZone, targetNiche);
      setResults(mockData);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFavorite = (fav: FavoriteSearch) => {
    setZone(fav.zone);
    setNiche(fav.niche);
    setIsFavoritesOpen(false);
    handleExecuteSearch(fav.zone, fav.niche);
  };

  // Generador de datos verosímiles en caso de no disponer de API o para demostración inmediata
  const generateMockResults = (targetZone: string, targetNiche: string): BusinessLead[] => {
    const rawPlaces = getMockResultsForNiche(targetZone, targetNiche);

    return rawPlaces.map((p) => {
      const webClassification = classifyWebsite(p.websiteUri);
      const scoreData = calculatePreliminaryScore({
        websiteType: webClassification,
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        hasPhone: Boolean(p.nationalPhoneNumber),
      });

      return {
        ...p,
        websiteClassification: webClassification,
        opportunityScore: scoreData.score,
        scoreBreakdown: scoreData.breakdown,
        isPreliminaryScore: true,
        pipelineStatus: 'nuevo',
      };
    });
  };

  // Manejo de búsqueda
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone.trim() || !niche.trim()) return;
    await handleExecuteSearch(zone, niche);
  };

  // Filtrado de resultados en cliente
  const filteredResults = results.filter((lead) => {
    // Protección estricta de precisión: descartar negocios incompatibles con el nicho actual
    if (isContaminatedBusiness(niche, lead.name, lead.primaryTypeDisplayName, lead.types)) {
      return false;
    }

    if (filters.onlyWithoutWebsite) {
      if (lead.websiteClassification.type === 'own') return false;
    }
    if (filters.onlyWithPhone) {
      if (!lead.nationalPhoneNumber && !lead.internationalPhoneNumber) return false;
    }
    if (filters.minRating > 0 && (lead.rating || 0) < filters.minRating) {
      return false;
    }
    if (filters.minReviews > 0 && (lead.userRatingCount || 0) < filters.minReviews) {
      return false;
    }
    if (filters.hideClosed && lead.businessStatus === 'CLOSED_PERMANENTLY') {
      return false;
    }
    return true;
  });

  // Manejo de selección múltiple
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === filteredResults.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredResults.map((l) => l.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  // Búsqueda de correos con Gemini (sin backend): sobre los seleccionados o, si no hay, todos los visibles
  const runEmailSearch = async (leads: BusinessLead[]) => {
    const targets = leads.filter((l) => !l.email && !l.emailSearched);
    if (targets.length === 0 || !isGeminiConfigured()) return;

    await findEmailsForLeads(
      targets,
      (id, email) => {
        setEmailLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setResults((prev) =>
          prev.map((l) => (l.id === id ? { ...l, email: email || undefined, emailSearched: true } : l))
        );
      },
      (id) => setEmailLoadingIds((prev) => new Set(prev).add(id))
    );
  };

  // Botón manual: reintenta sobre los seleccionados o sobre todos los visibles
  const handleFindEmails = () =>
    runEmailSearch(
      selectedLeadIds.size > 0 ? filteredResults.filter((l) => selectedLeadIds.has(l.id)) : filteredResults
    );

  const pendingEmailCount = filteredResults.filter((l) => !l.email && !l.emailSearched).length;
  const isFindingEmails = emailLoadingIds.size > 0;
  const geminiReady = isGeminiConfigured();

  const renderEmail = (lead: BusinessLead) =>
    lead.email ? (
      <a href={`mailto:${lead.email}`} onClick={() => onTrack?.(lead, 'correo')} className="text-sky-400 hover:underline break-all">
        {lead.email}
      </a>
    ) : emailLoadingIds.has(lead.id) ? (
      <span className="text-slate-400 inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
      </span>
    ) : (
      <span className="text-slate-400">{lead.emailSearched ? 'Sin correo' : '-'}</span>
    );

  const handleSaveSelectedLeads = () => {
    filteredResults
      .filter((l) => selectedLeadIds.has(l.id))
      .forEach((lead) => {
        if (!isSavedLead(lead.id)) {
          onSaveLead(lead);
        }
      });
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner & Panel Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Explorador de Negocios Locales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Busca empresas en cualquier población, detecta si cuentan con web propia o solo perfiles sociales y evalúa su potencial comercial antes de llamar.
          </p>
        </div>

        {/* Botón destacado del Panel Lateral de Favoritos */}
        <button
          type="button"
          onClick={() => setIsFavoritesOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          title="Abrir panel lateral de favoritos guardados"
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>Panel de Favoritos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-200 font-mono">
            {favorites.length}
          </span>
        </button>
      </div>

      {/* Formulario de búsqueda con filtros y sugerencias */}
      <SearchForm
        zone={zone}
        niche={niche}
        filters={filters}
        isLoading={isLoading}
        onZoneChange={setZone}
        onNicheChange={setNiche}
        onFiltersChange={setFilters}
        onSubmit={handleSearchSubmit}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        favoritesCount={favorites.length}
        isCurrentFavorite={isCurrentFavorite}
        onToggleCurrentFavorite={handleToggleCurrentFavorite}
      />

      {/* Barra rápida de favoritos frecuentes */}
      {favorites.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 pl-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Favoritos rápidos:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {favorites.slice(0, 4).map((fav) => (
              <button
                key={fav.id}
                type="button"
                onClick={() => handleSelectFavorite(fav)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer text-xs"
                title={`Buscar ${fav.niche} en ${fav.zone}`}
              >
                <span className="font-medium text-slate-200">{fav.zone}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-medium capitalize">{fav.niche}</span>
              </button>
            ))}
            {favorites.length > 4 && (
              <button
                type="button"
                onClick={() => setIsFavoritesOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 shrink-0 cursor-pointer"
              >
                +{favorites.length - 4} más en panel →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel lateral deslizable de Búsquedas Rápidas */}
      <QuickSearchFavorites
        favorites={favorites}
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectFavorite={handleSelectFavorite}
        onDeleteFavorite={handleDeleteFavorite}
        onAddCurrentFavorite={handleToggleCurrentFavorite}
        onAddCustomFavorite={handleAddCustomFavorite}
        onResetDefaultFavorites={handleResetDefaultFavorites}
        isCurrentSaved={isCurrentFavorite}
        currentZone={zone}
        currentNiche={niche}
      />

      {/* Estado de carga animado */}
      {isLoading && <SearchLoadingState zone={zone} niche={niche} />}

      {/* Alerta de Error si ocurre */}
      {error && !isLoading && (
        <SearchErrorAlert
          error={error}
          onRetry={() => {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSearchSubmit(fakeEvent);
          }}
          onOpenSettings={onNavigateToSettings}
        />
      )}

      {/* Si aún no se ha buscado y no está cargando */}
      {!hasSearched && !isLoading && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Inicia tu prospección local
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-lg mx-auto">
              Escribe un sector o municipio de Colombia (ej. «El Poblado, Medellín», «Laureles», «Envigado» o «Medellín Centro») y selecciona un nicho de negocio. La aplicación localizará empresas, detectará si tienen web y calculará la puntuación de oportunidad de cada uno.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Places API (New) optimizada
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Filtro de redes sociales vs web propia
            </span>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => handleSearchSubmit(e)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Cargar ejemplo en «{zone}» con «{niche}» →
            </button>
          </div>
        </div>
      )}

      {/* Resultados de Búsqueda */}
      {hasSearched && !isLoading && !error && (
        <div className="space-y-4">
          {/* Banner informativo si la clave de Google Cloud necesita activación o ajuste en GCP */}
          {apiNotice && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-amber-200 text-xs shadow-lg flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-100 text-sm">
                    {apiNotice.reason === 'API_KEY_SERVICE_BLOCKED'
                      ? 'Aviso de Google Cloud: Restricción de API en la clave'
                      : apiNotice.reason === 'SERVICE_DISABLED'
                      ? 'Aviso de Google Cloud: Places API (New) no habilitada'
                      : 'Aviso de credencial de Google Cloud'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setApiNotice(null)}
                    className="text-amber-400 hover:text-amber-200 text-xs px-2 py-0.5 rounded cursor-pointer"
                  >
                    Cerrar ✕
                  </button>
                </div>

                <p className="text-amber-200/90 leading-relaxed">
                  {apiNotice.friendlyMessage}
                </p>

                {apiNotice.reason === 'API_KEY_SERVICE_BLOCKED' && (
                  <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[11px] text-amber-200/95 space-y-1">
                    <p className="font-bold text-amber-100">Cómo solucionarlo en 30 segundos:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-0.5 text-amber-200/90">
                      <li>Haz clic en el botón de abajo para ir a <strong>Credenciales</strong> del proyecto {apiNotice.projectId || '812167965109'}.</li>
                      <li>Haz clic en el nombre de tu clave API.</li>
                      <li>Bajo <strong>«Restricciones de API»</strong>, marca <strong>«No restringir clave»</strong> (o agrega <em>«Places API (New)»</em>).</li>
                      <li>Pulsa <strong>«Guardar»</strong> y luego en <strong>«Reintentar búsqueda en vivo»</strong>.</li>
                    </ol>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  {apiNotice.enableUrl && (
                    <a
                      href={apiNotice.enableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors"
                    >
                      <span>
                        {apiNotice.reason === 'API_KEY_SERVICE_BLOCKED'
                          ? 'Abrir Credenciales en Google Cloud'
                          : 'Habilitar Places API (New) en Google Cloud'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleExecuteSearch(zone, niche)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar búsqueda en vivo</span>
                  </button>

                  <span className="text-[11px] text-amber-300/80">
                    (Los resultados mostrados abajo provienen de la base de datos de respaldo para no interrumpir tu trabajo).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Barra de control de resultados y selección múltiple */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {selectedLeadIds.size === filteredResults.length && filteredResults.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Seleccionar todos</span>
              </button>

              <span className="text-xs text-slate-400">|</span>

              <span className="text-xs text-slate-300">
                <strong className="text-slate-100 font-bold">{filteredResults.length}</strong> encontrados
                {selectedLeadIds.size > 0 && (
                  <span className="ml-1 text-emerald-400 font-semibold">
                    ({selectedLeadIds.size} seleccionados)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Botón Buscar correos */}
              <button
                type="button"
                onClick={handleFindEmails}
                disabled={!geminiReady || isFindingEmails || pendingEmailCount === 0}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                title={
                  geminiReady
                    ? 'Busca el correo público de los negocios con Gemini (usa una llamada por negocio)'
                    : 'Configura GEMINI_API_KEY en .env para buscar correos'
                }
              >
                {isFindingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>
                  {isFindingEmails
                    ? 'Buscando correos...'
                    : selectedLeadIds.size > 0
                    ? 'Reintentar correos de seleccionados'
                    : `Buscar correos pendientes (${pendingEmailCount})`}
                </span>
              </button>

              {/* Botón Guardar Seleccionados */}
              {selectedLeadIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleSaveSelectedLeads}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Guardar seleccionados en mis leads</span>
                </button>
              )}

              {/* Selector de vista: Tarjetas o Tabla */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-slate-800 text-slate-100 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista en tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-slate-100 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista en tabla"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-3">
              <p className="text-sm">No hay negocios que coincidan con los filtros aplicados.</p>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    onlyWithoutWebsite: false,
                    onlyWithPhone: false,
                    minRating: 0,
                    minReviews: 0,
                    hideClosed: false,
                  })
                }
                className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Vista de Tarjetas */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                const isSaved = isSavedLead(lead.id);
                const hasOwn = lead.websiteClassification.type === 'own';
                const isSocial = lead.websiteClassification.type === 'directory_or_social';

                return (
                  <div
                    key={lead.id}
                    className={`bg-slate-900/90 border rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-lg ${
                      isSelected ? 'border-emerald-500/70 bg-slate-900' : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(lead.id)}
                            className="mt-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block truncate">
                              {lead.primaryTypeDisplayName || 'Negocio local'}
                            </span>
                            <h3 className="text-base font-bold text-slate-100 truncate hover:text-emerald-400 transition-colors">
                              {lead.name}
                            </h3>
                          </div>
                        </div>

                        {/* Oportunidad Badge */}
                        <div className="shrink-0 flex flex-col items-end">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Oportunidad
                          </span>
                          <span
                            className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-md ${
                              lead.opportunityScore >= 70
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : lead.opportunityScore >= 45
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {lead.opportunityScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Dirección y valoraciones */}
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.formattedAddress}</span>
                      </p>

                      <p className="text-xs flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {renderEmail(lead)}
                      </p>

                      <div className="flex items-center gap-3 text-xs">
                        {lead.rating !== undefined && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="font-bold text-slate-100 font-mono">{lead.rating.toFixed(1)}</span>
                            <span className="text-slate-400">({lead.userRatingCount || 0})</span>
                          </div>
                        )}

                        {/* Estado web */}
                        {hasOwn ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium truncate">
                            <Globe className="w-3 h-3 shrink-0" />
                            Web propia
                          </span>
                        ) : isSocial ? (
                          <span className="text-[11px] text-amber-300 flex items-center gap-1 font-medium truncate">
                            <Globe className="w-3 h-3 shrink-0" />
                            Solo {lead.websiteClassification.platform || 'Red social'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-400 flex items-center gap-1 font-medium truncate">
                            <XCircle className="w-3 h-3 shrink-0" />
                            Sin web
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones de la tarjeta */}
                    <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {lead.nationalPhoneNumber ? (
                          <>
                            <a
                              href={`tel:${lead.nationalPhoneNumber.replace(/\s+/g, '')}`}
                  onClick={() => onTrack?.(lead, 'llamada')}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                              title={`Llamar: ${lead.nationalPhoneNumber}`}
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>

                            {buildWhatsAppDirectUrl(lead.nationalPhoneNumber) && (
                              <a
                                href={buildWhatsAppDirectUrl(lead.nationalPhoneNumber, `Hola, me comunico con ${lead.name}. Quisiera consultar sobre sus servicios.`) || undefined}
                  onClick={() => onTrack?.(lead, 'whatsapp')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                                title="Abrir chat en WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </>
                        ) : null}

                        {lead.websiteUri ? (
                          <a
                            href={lead.websiteUri}
                  onClick={() => onTrack?.(lead, 'web')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Abrir enlace de web"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => onSaveLead(lead)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                          title={isSaved ? 'Guardado en leads' : 'Guardar lead'}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToBusiness(lead)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Ver ficha y auditar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vista de Tabla */
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="cursor-pointer"
                        >
                          {selectedLeadIds.size === filteredResults.length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Negocio</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Presencia Web</th>
                      <th className="p-3 text-center">Valoración</th>
                      <th className="p-3 text-center">Oportunidad</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults.map((lead) => {
                      const isSelected = selectedLeadIds.has(lead.id);
                      const isSaved = isSavedLead(lead.id);
                      const hasOwn = lead.websiteClassification.type === 'own';
                      const isSocial = lead.websiteClassification.type === 'directory_or_social';

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(lead.id)}
                              className="cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-100 hover:text-emerald-400 cursor-pointer" onClick={() => onNavigateToBusiness(lead)}>
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {lead.formattedAddress}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">
                            {lead.primaryTypeDisplayName || 'Servicios'}
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
                          <td className="p-3">{renderEmail(lead)}</td>
                          <td className="p-3">
                            {hasOwn ? (
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
                            ) : isSocial ? (
                              <span className="text-amber-300">
                                {lead.websiteClassification.platform || 'Red social'}
                              </span>
                            ) : (
                              <span className="text-rose-400">Sin web</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {lead.rating ? (
                              <span className="font-mono text-amber-400 font-bold">
                                {lead.rating.toFixed(1)} ★ <span className="text-slate-400 text-[10px]">({lead.userRatingCount})</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
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
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigateToBusiness(lead)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Ficha →
                            </button>
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
      )}
    </div>
  );
};
