import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  Play, 
  MapPin, 
  Briefcase, 
  Plus, 
  Bookmark, 
  X, 
  Sparkles,
  Clock,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';
import { FavoriteSearch, PREDEFINED_NICHES } from '../../types';

interface QuickSearchFavoritesProps {
  favorites: FavoriteSearch[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFavorite: (favorite: FavoriteSearch) => void;
  onDeleteFavorite: (id: string) => void;
  onAddCurrentFavorite: () => void;
  onAddCustomFavorite?: (zone: string, niche: string) => void;
  onResetDefaultFavorites?: () => void;
  isCurrentSaved: boolean;
  currentZone: string;
  currentNiche: string;
}

export const QuickSearchFavorites: React.FC<QuickSearchFavoritesProps> = ({
  favorites,
  isOpen,
  onClose,
  onSelectFavorite,
  onDeleteFavorite,
  onAddCurrentFavorite,
  onAddCustomFavorite,
  onResetDefaultFavorites,
  isCurrentSaved,
  currentZone,
  currentNiche,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualZone, setManualZone] = useState('');
  const [manualNiche, setManualNiche] = useState<string>(PREDEFINED_NICHES[0]);

  if (!isOpen) return null;

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualZone.trim() || !manualNiche.trim()) return;
    if (onAddCustomFavorite) {
      onAddCustomFavorite(manualZone.trim(), manualNiche.trim());
      setManualZone('');
      setShowAddForm(false);
    }
  };

  return (
    <>
      {/* Backdrop para cerrar al hacer clic fuera */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral deslizante */}
      <aside className="fixed inset-y-0 right-0 z-50 w-84 sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Cabecera del Panel */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Panel de Favoritos</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {favorites.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Búsquedas guardadas para ejecutar en 1 clic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar panel de favoritos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección: Guardar Búsqueda Actual en Pantalla */}
        <div className="p-4 border-b border-slate-800/90 bg-slate-950/40">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Búsqueda actual en formulario:
                </span>
                <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{currentZone || 'Sin zona escrita'}</span>
                </div>
                <div className="text-xs text-amber-300 font-medium truncate capitalize flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{currentNiche || 'Sin nicho'}</span>
                </div>
              </div>

              {isCurrentSaved && (
                <span className="shrink-0 p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Búsqueda ya guardada">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!currentZone.trim() || !currentNiche.trim() || isCurrentSaved}
              onClick={onAddCurrentFavorite}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCurrentSaved
                  ? 'bg-slate-800/70 border border-slate-700 text-slate-400 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-md shadow-amber-950/50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isCurrentSaved ? 'fill-emerald-400 text-emerald-400' : 'fill-white text-white'}`} />
              <span>{isCurrentSaved ? 'Guardada en tus favoritos ⭐' : 'Guardar búsqueda actual'}</span>
            </button>
          </div>
        </div>

        {/* Barra de herramientas para añadir manual o cargar sugerencias */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cerrar formulario' : 'Añadir favorito manual'}</span>
          </button>

          {onResetDefaultFavorites && (
            <button
              type="button"
              onClick={onResetDefaultFavorites}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Restablecer combinaciones sugeridas"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sugeridos</span>
            </button>
          )}
        </div>

        {/* Formulario Manual Colapsable */}
        {showAddForm && (
          <form onSubmit={handleManualAdd} className="p-4 bg-slate-950 border-b border-slate-800 space-y-2.5 animate-in fade-in duration-150">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Zona geográfica:
              </label>
              <input
                type="text"
                required
                value={manualZone}
                onChange={(e) => setManualZone(e.target.value)}
                placeholder="Ej. El Poblado, Laureles, Envigado, Medellín..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Nicho / Categoría:
              </label>
              <select
                value={manualNiche}
                onChange={(e) => setManualNiche(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden capitalize"
              >
                {PREDEFINED_NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar en lista</span>
            </button>
          </form>
        )}

        {/* Lista de Favoritos Guardados */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Tus combinaciones ({favorites.length})</span>
            <span className="text-[10px] text-emerald-400 font-medium">1 clic para buscar</span>
          </div>

          {favorites.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-3 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Star className="w-6 h-6" />
              </div>
              <p className="font-medium text-slate-300">No tienes favoritos guardados aún.</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Guarda tus poblaciones y sectores más frecuentes para no tener que escribir la zona y el nicho cada vez.
              </p>
              {onResetDefaultFavorites && (
                <button
                  type="button"
                  onClick={onResetDefaultFavorites}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cargar 4 favoritos recomendados</span>
                </button>
              )}
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all group shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{fav.zone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold capitalize truncate mt-1">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{fav.niche}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteFavorite(fav.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Eliminar favorito"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Botón de Ejecución en 1 Clic */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectFavorite(fav);
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-emerald-600 group-hover:bg-emerald-600 text-slate-200 hover:text-white group-hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-400 group-hover:text-white" />
                  <span>Ejecutar búsqueda ahora (1 clic)</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del Panel */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Bookmark className="w-3 h-3 text-emerald-400" />
          <span>Sincronizado automáticamente en tu navegador</span>
        </div>
      </aside>
    </>
  );
};
