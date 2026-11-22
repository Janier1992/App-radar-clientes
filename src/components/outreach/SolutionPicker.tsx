import React from 'react';
import { Package } from 'lucide-react';
import { SOLUTIONS, SOLUTION_CHOICES, SolutionChoice, autoSolution } from '../../services/solutions';
import { BusinessLead } from '../../types';

interface Props {
  value: SolutionChoice;
  onChange: (choice: SolutionChoice) => void;
  /** Negocio al que aplica (en la ficha): permite mostrar qué elige «Automático» para él. */
  lead?: BusinessLead;
  label?: string;
  hint?: string;
}

/** Selector de la solución que se le quiere ofrecer al negocio o nicho (ReservasIA, Tiendly o automático según el rubro). */
export const SolutionPicker: React.FC<Props> = ({ value, onChange, lead, label = 'Solución a ofrecer', hint }) => {
  const info = value === 'auto' ? (lead ? SOLUTIONS[autoSolution(lead)] : null) : SOLUTIONS[value];
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Package className="w-3.5 h-3.5" /> {label}
      </span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {SOLUTION_CHOICES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={value === c.id}
            onClick={() => onChange(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
              value === c.id
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        {value === 'auto'
          ? `Cada negocio recibe la solución que mejor encaja con su rubro (comercio de barrio → Tiendly; citas y reservas → ReservasIA).${info ? ` Para este: ${info.name}.` : ''}`
          : info?.tagline}
        {hint ? ` ${hint}` : ''}
      </p>
    </div>
  );
};
