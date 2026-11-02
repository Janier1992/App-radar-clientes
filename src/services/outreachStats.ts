import { ActivityEvent, TrackedBusiness } from '../types';
import { OutreachStep, STEP_LABELS, Sector, detectSector } from './outreachMessage';

export type RangeKey = '7d' | '30d' | 'all';
export const RANGE_LABELS: Record<RangeKey, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', all: 'Todo el historial' };

export const SECTOR_LABELS: Record<Sector, string> = {
  salud: 'Salud y clínicas',
  vehiculos: 'Talleres y lavaderos',
  gastronomia: 'Restaurantes y cafés',
  formacion: 'Academias y gimnasios',
  belleza: 'Belleza y estética',
  general: 'Otros negocios',
};

const TONE_LABELS: Record<string, string> = { cercano: 'Cercano', profesional: 'Profesional', directo: 'Directo', sin_dato: 'Sin dato (anteriores)' };

export interface BucketStat {
  key: string;
  label: string;
  contacted: number;
  responded: number;
}

export interface SummaryData {
  messages: number; // mensajes de la secuencia registrados
  contacted: number; // negocios distintos contactados
  responded: number; // de esos, cuántos respondieron
  rate: number | null; // respondieron / contactados
  demos: number;
  closes: number;
  blocked: number;
  byRubro: BucketStat[];
  byTone: BucketStat[];
  byStep: { key: string; label: string; responses: number }[];
  bestWindow: { label: string; count: number } | null;
  responsesTotal: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Acercamientos de la secuencia (las respuestas rápidas no cuentan como mensaje de prospección). */
export const isSequenceApproach = (e: ActivityEvent) => e.type === 'acercamiento' && !e.note?.startsWith('Respuesta rápida');

function windowLabel(hour: number): string {
  if (hour < 11) return 'Mañana (antes de las 11 a. m.)';
  if (hour < 14) return 'Mediodía (11 a. m. – 2 p. m.)';
  if (hour < 18) return 'Tarde (2 – 6 p. m.)';
  return 'Noche (después de las 6 p. m.)';
}

export function computeSummary(tracked: TrackedBusiness[], range: RangeKey, now: Date): SummaryData {
  const since = range === 'all' ? 0 : now.getTime() - (range === '7d' ? 7 : 30) * DAY_MS;
  const inRange = (e: ActivityEvent) => new Date(e.at).getTime() >= since;

  let messages = 0;
  let demos = 0;
  let closes = 0;
  let blocked = 0;
  const rubro = new Map<string, BucketStat>();
  const tone = new Map<string, BucketStat>();
  const step = new Map<string, number>();
  const windows = new Map<string, number>();
  let contacted = 0;
  let responded = 0;
  let responsesTotal = 0;

  const bump = (map: Map<string, BucketStat>, key: string, label: string, didRespond: boolean) => {
    const cur = map.get(key) ?? { key, label, contacted: 0, responded: 0 };
    cur.contacted += 1;
    if (didRespond) cur.responded += 1;
    map.set(key, cur);
  };

  for (const t of tracked) {
    const chronological = [...t.events].sort((a, b) => a.at.localeCompare(b.at));
    const approaches = chronological.filter(isSequenceApproach);
    const approachesInRange = approaches.filter(inRange);
    messages += approachesInRange.length;

    demos += chronological.some((e) => e.type === 'etapa' && e.stage === 'reunion' && inRange(e)) ? 1 : 0;
    closes += chronological.some((e) => e.type === 'etapa' && e.stage === 'cliente' && inRange(e)) ? 1 : 0;
    blocked += chronological.some((e) => e.type === 'no_contactar' && inRange(e)) ? 1 : 0;

    // Cohorte: negocios a los que se les escribió en el periodo y si respondieron después de ese primer mensaje.
    if (approachesInRange.length > 0) {
      const first = approachesInRange[0];
      const didRespond = chronological.some((e) => e.type === 'respondio' && e.at >= first.at);
      contacted += 1;
      if (didRespond) responded += 1;
      bump(rubro, detectSector(t.lead), SECTOR_LABELS[detectSector(t.lead)], didRespond);
      const toneKey = first.tone ?? 'sin_dato';
      bump(tone, toneKey, TONE_LABELS[toneKey] ?? toneKey, didRespond);
    }

    // ¿Qué mensaje provocó cada respuesta del periodo?
    for (const reply of chronological.filter((e) => e.type === 'respondio' && inRange(e))) {
      responsesTotal += 1;
      const trigger = [...approaches].reverse().find((a) => a.at <= reply.at);
      const key = trigger?.step ?? 'sin_dato';
      step.set(key, (step.get(key) ?? 0) + 1);
      if (trigger) {
        const label = windowLabel(new Date(trigger.at).getHours());
        windows.set(label, (windows.get(label) ?? 0) + 1);
      }
    }
  }

  const sortStats = (m: Map<string, BucketStat>) =>
    [...m.values()].sort((a, b) => b.contacted - a.contacted || b.responded - a.responded);
  const topWindow = [...windows.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    messages,
    contacted,
    responded,
    rate: contacted > 0 ? responded / contacted : null,
    demos,
    closes,
    blocked,
    byRubro: sortStats(rubro),
    byTone: sortStats(tone),
    byStep: [...step.entries()]
      .map(([key, responses]) => ({ key, label: key === 'sin_dato' ? 'Sin dato (anteriores)' : STEP_LABELS[key as OutreachStep] ?? key, responses }))
      .sort((a, b) => b.responses - a.responses),
    bestWindow: topWindow && responsesTotal >= 5 ? { label: topWindow[0], count: topWindow[1] } : null,
    responsesTotal,
  };
}
