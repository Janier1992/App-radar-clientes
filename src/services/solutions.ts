import { BusinessLead, SolutionId } from '../types';
import { RESERVASIA_APP_URL } from './outreachMessage';
import { getOutreachSettings, getTiendlyUrl } from './outreachSettings';

/** Elección general (barra de búsqueda): una solución fija o «automática» según el tipo de negocio. */
export type SolutionChoice = 'auto' | SolutionId;

export interface SolutionInfo {
  id: SolutionId;
  name: string;
  tagline: string;
  /** Para qué negocios encaja mejor (se muestra en el selector). */
  fitsFor: string;
}

export const SOLUTIONS: Record<SolutionId, SolutionInfo> = {
  reservasia: {
    id: 'reservasia',
    name: 'ReservasIA',
    tagline: 'Asistente de WhatsApp que atiende, agenda y confirma citas 24/7',
    fitsFor: 'Clínicas, talleres, restaurantes, belleza, academias: negocios con citas o reservas',
  },
  tiendly: {
    id: 'tiendly',
    name: 'Tiendly',
    tagline: 'App para llevar ventas, inventario, fiados y tareas de la tienda, con asistente de IA',
    fitsFor: 'Tiendas de barrio, minimercados, misceláneas, ferreterías, papelerías, droguerías',
  },
};

export const SOLUTION_IDS: SolutionId[] = ['reservasia', 'tiendly'];

export const SOLUTION_CHOICES: { id: SolutionChoice; label: string }[] = [
  { id: 'auto', label: 'Automático' },
  { id: 'reservasia', label: 'ReservasIA' },
  { id: 'tiendly', label: 'Tiendly' },
];

/** Negocios de comercio de barrio, donde Tiendly encaja mejor que un sistema de citas. */
const TIENDLY_PATTERN =
  /(tienda|minimarket|mini ?mercado|supermercado|miscel[aá]nea|abarrote|ferreter|papeler|droguer|farmacia|licor|fruver|fruter|carnicer|graner|bodega|convenience|grocery|supermarket|hardware|stationery|liquor|general_store|market)/;

/** Solución sugerida según el tipo de negocio. */
export function autoSolution(lead: Pick<BusinessLead, 'primaryTypeDisplayName' | 'types' | 'name'>): SolutionId {
  const text = `${lead.primaryTypeDisplayName || ''} ${(lead.types || []).join(' ')} ${lead.name}`.toLowerCase();
  return TIENDLY_PATTERN.test(text) ? 'tiendly' : 'reservasia';
}

/** Solución efectiva de un negocio: la suya si la tiene, si no la elección general (o la automática). */
export function resolveSolution(lead: BusinessLead, choice: SolutionChoice = 'auto'): SolutionId {
  if (lead.solutionId) return lead.solutionId;
  return choice === 'auto' ? autoSolution(lead) : choice;
}

/** Enlace que se comparte: el de ReservasIA (configurable) o el de Tiendly (configurables en Ajustes). */
export function getSolutionUrl(id: SolutionId): string {
  const s = getOutreachSettings();
  return id === 'tiendly' ? getTiendlyUrl() : s.reservasUrl.trim() || RESERVASIA_APP_URL;
}

export const solutionOfLead = (lead: BusinessLead): SolutionId => lead.solutionId ?? 'reservasia';

const KEY = 'radar_solution_choice';
export function loadSolutionChoice(): SolutionChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'reservasia' || v === 'tiendly' ? v : 'auto';
  } catch {
    return 'auto';
  }
}
export function saveSolutionChoice(choice: SolutionChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* sin almacenamiento */
  }
}
