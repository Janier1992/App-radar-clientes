import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  SlidersHorizontal, 
  ChevronDown, 
  Check, 
  X, 
  Sparkles, 
  RotateCcw,
  Phone,
  Globe,
  Star,
  MessageSquare
} from 'lucide-react';
import { PREDEFINED_NICHES, PredefinedNiche, SearchFilters } from '../../types';

interface SearchFormProps {
  zone: string;
  niche: string;
  filters: SearchFilters;
  isLoading: boolean;
  onZoneChange: (zone: string) => void;
  onNicheChange: (niche: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenFavorites?: () => void;
  favoritesCount?: number;
  isCurrentFavorite?: boolean;
  onToggleCurrentFavorite?: () => void;
}

const QUICK_ZONE_SUGGESTIONS = [
  'El Poblado, Medellín',
  'Laureles, Medellín',
  'Envigado, Antioquia',
  'Belén, Medellín',
  'Centro, Medellín',
  'Itagüí, Antioquia',
];

export const SearchForm: React.FC<SearchFormProps> = ({
  zone,
  niche,
  filters,
  isLoading,
  onZoneChange,
  onNicheChange,
  onFiltersChange,
  onSubmit,
  onOpenFavorites,
  favoritesCount = 0,
  isCurrentFavorite = false,
  onToggleCurrentFavorite,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter predefined niches based on input text
  const filteredNiches = PREDEFINED_NICHES.filter((item) =>
    item.toLowerCase().includes(niche.toLowerCase().trim())
  );

  const activeFiltersCount = [
    filters.onlyWithoutWebsite,
    filters.onlyWithPhone,
    filters.minRating > 0,
    filters.minReviews > 0,
    filters.hideClosed,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    onFiltersChange({
      onlyWithoutWebsite: false,
      onlyWithPhone: false,
      minRating: 0,
      minReviews: 0,
      hideClosed: true,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Main Inputs Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Zona Input */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Zona geográfica (Colombia)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Comuna, barrio o municipio</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={zone}
                onChange={(e) => onZoneChange(e.target.value)}
                placeholder="Ej. El Poblado, Medellín o Laureles, Envigado..."
                required
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 transition-colors"
              />
              {zone && (
                <button
                  type="button"
                  onClick={() => onZoneChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  title="Borrar zona"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Nicho Input with Dropdown */}
          <div className="md:col-span-5 relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                Nicho / Categoría
              </span>
              <span className="text-[11px] text-slate-400 font-normal">{PREDEFINED_NICHES.length} nichos sugeridos</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={niche}
                onChange={(e) => {
                  onNicheChange(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Ej. Talleres mecánicos, odontología, estética..."
                required
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 transition-colors pr-9"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 p-1"
                title="Desplegar categorías predefinidas"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 divide-y divide-slate-800/60">
                <div className="p-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/50">
                  Categorías sugeridas de alta oportunidad
                </div>
                {filteredNiches.length > 0 ? (
                  filteredNiches.map((item) => {
                    const isSelected = niche.toLowerCase() === item.toLowerCase();
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          onNicheChange(item);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between hover:bg-slate-800 transition-colors capitalize ${
                          isSelected ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-slate-300'
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center">
                    Búsqueda libre: «{niche}»
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button & Favorite Toggle */}
          <div className="md:col-span-2 flex items-end gap-1.5">
            <button
              type="submit"
              disabled={isLoading || !zone.trim() || !niche.trim()}
              className="flex-1 h-[42px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg px-3 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </>
              )}
            </button>

            {onToggleCurrentFavorite && (
              <button
                type="button"
                onClick={onToggleCurrentFavorite}
                disabled={!zone.trim() || !niche.trim()}
                className={`h-[42px] px-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isCurrentFavorite
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-amber-400'
                }`}
                title={isCurrentFavorite ? 'Guardado en favoritos' : 'Guardar búsqueda actual en favoritos'}
              >
                <Star className={`w-4 h-4 ${isCurrentFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Atajos rápidos:</span>
            {PREDEFINED_NICHES.slice(0, 6).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onNicheChange(item)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors capitalize cursor-pointer ${
                  niche.toLowerCase() === item.toLowerCase()
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 hover:text-slate-100 border border-slate-700/60'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {onOpenFavorites && (
            <button
              type="button"
              onClick={onOpenFavorites}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Búsquedas rápidas</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filters Toggle and Summary Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showFilters || activeFiltersCount > 0
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtros avanzados</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showFilters && (
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
            {/* Solo sin web propia */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.onlyWithoutWebsite}
                onChange={(e) =>
                  onFiltersChange({ ...filters, onlyWithoutWebsite: e.target.checked })
                }
                className="mt-0.5 rounded-sm border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block group-hover:text-emerald-400 transition-colors">
                  Solo sin web propia
                </span>
                <span className="text-slate-400 text-[11px] leading-tight block">
                  Sin URL o solo con enlaces a Facebook, Instagram o directorios.
                </span>
              </div>
            </label>

            {/* Solo con teléfono */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.onlyWithPhone}
                onChange={(e) =>
                  onFiltersChange({ ...filters, onlyWithPhone: e.target.checked })
                }
                className="mt-0.5 rounded-sm border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block group-hover:text-emerald-400 transition-colors">
                  Solo con teléfono
                </span>
                <span className="text-slate-400 text-[11px] leading-tight block">
                  Descarta negocios que no tengan número para llamada o WhatsApp.
                </span>
              </div>
            </label>

            {/* Valoración mínima */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Valoración mínima:
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {filters.minRating > 0 ? `${filters.minRating} ★` : 'Cualquiera'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4.8"
                step="0.2"
                value={filters.minRating}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minRating: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.0</span>
                <span>3.5</span>
                <span>4.0</span>
                <span>4.8</span>
              </div>
            </div>

            {/* Mínimo de reseñas y Ocultar cerrados */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  Mínimo de reseñas:
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {filters.minReviews > 0 ? `${filters.minReviews}+` : '0'}
                </span>
              </div>
              <select
                value={filters.minReviews}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minReviews: parseInt(e.target.value, 10) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value={0}>Cualquier cantidad de reseñas</option>
                <option value={5}>Mínimo 5 reseñas (actividad mínima)</option>
                <option value={15}>Mínimo 15 reseñas (negocio consolidado)</option>
                <option value={30}>Mínimo 30 reseñas (alto volumen de clientes)</option>
                <option value={50}>Mínimo 50 reseñas (referentes locales)</option>
              </select>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={filters.hideClosed}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, hideClosed: e.target.checked })
                  }
                  className="rounded-sm border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="text-[11px] text-slate-300 font-medium">
                  Ocultar negocios cerrados permanentemente
                </span>
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
