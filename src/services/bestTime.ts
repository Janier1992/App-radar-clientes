import { Sector } from './outreachMessage';

/**
 * Franjas orientativas para escribir según el rubro. Son una regla práctica (cuándo suele estar el negocio
 * menos ocupado), no un dato medido: la pestaña «Resumen» del Historial muestra la franja que mejor te ha funcionado.
 */
interface Windows {
  ranges: [number, number][]; // [hora inicio, hora fin) en formato 24 h
  days?: number[]; // días ideales (0 = domingo)
  why: string;
}

const WINDOWS: Record<Sector, Windows> = {
  salud: { ranges: [[8, 11], [14, 16]], why: 'antes de la consulta y después del almuerzo' },
  vehiculos: { ranges: [[8, 10], [14, 16]], why: 'fuera de la hora pico del taller' },
  gastronomia: { ranges: [[9.5, 11.5], [15, 17]], why: 'entre el servicio de almuerzo y el de cena' },
  formacion: { ranges: [[9, 12], [14, 16]], why: 'antes de las clases de la tarde' },
  belleza: { ranges: [[9.5, 12]], days: [2, 3, 4], why: 'martes a jueves suelen ser los días más tranquilos' },
  general: { ranges: [[9, 11.5], [14, 17]], why: 'horario comercial habitual' },
};

const fmt = (h: number) => {
  const hour = Math.floor(h);
  const mins = h % 1 ? '30' : '00';
  const suffix = hour >= 12 ? 'p. m.' : 'a. m.';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${mins} ${suffix}`;
};

export interface TimingHint {
  ideal: boolean; // ahora es buen momento
  text: string;
}

export function timingHint(sector: Sector, now: Date): TimingHint {
  const w = WINDOWS[sector];
  const hour = now.getHours() + now.getMinutes() / 60;
  const day = now.getDay();
  const label = w.ranges.map(([a, b]) => `${fmt(a)} – ${fmt(b)}`).join(' o ');

  if (day === 0) return { ideal: false, text: `Domingo: mejor el lunes (${label})` };
  if (hour < 7 || hour >= 20) return { ideal: false, text: `Fuera de horario: mejor mañana (${label})` };
  if (w.days && !w.days.includes(day)) return { ideal: false, text: `Mejor entre martes y jueves (${label})` };
  const inside = w.ranges.some(([a, b]) => hour >= a && hour < b);
  return inside
    ? { ideal: true, text: 'Buen momento para escribir' }
    : { ideal: false, text: `Mejor entre ${label} (${w.why})` };
}

/** Aviso según el avance del tope diario de mensajes. */
export function limitNotice(sent: number, limit: number): { tone: 'ok' | 'warn' | 'stop'; text: string } {
  if (sent >= limit) return { tone: 'stop', text: `Llegaste al tope sugerido de ${limit} mensajes hoy. Seguir puede poner en riesgo tu número.` };
  if (sent >= Math.floor(limit * 0.8)) return { tone: 'warn', text: `Vas ${sent} de ${limit}: te quedan pocos mensajes antes del tope sugerido.` };
  return { tone: 'ok', text: `Hoy llevas ${sent} de ${limit} mensajes sugeridos` };
}
