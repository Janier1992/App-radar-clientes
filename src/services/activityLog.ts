import {
  ActivityEvent,
  ActivityType,
  ApproachChannel,
  BusinessLead,
  SearchLogEntry,
  TrackedBusiness,
} from '../types';

const BUSINESSES_KEY = 'radar_activity_log';
const SEARCHES_KEY = 'radar_search_log';
const MAX_BUSINESSES = 300;
const MAX_EVENTS_PER_BUSINESS = 60;
const MAX_SEARCHES = 200;

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  ficha: 'Vio la ficha',
  analisis: 'Analizó el negocio',
  guardado: 'Guardó en Mis leads',
  whatsapp: 'Abrió WhatsApp',
  llamada: 'Abrió el marcador (llamada)',
  web: 'Visitó su web',
  maps: 'Abrió Google Maps',
  correo: 'Abrió su correo',
  acercamiento: 'Acercamiento registrado',
};

export const CHANNEL_LABELS: Record<ApproachChannel, string> = {
  whatsapp: 'WhatsApp',
  llamada: 'Llamada',
  correo: 'Correo',
  presencial: 'Visita presencial',
  otro: 'Otro',
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch (e) {
    console.warn(`No se pudo leer ${key} de localStorage:`, e);
  }
  return [];
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`No se pudo guardar ${key} en localStorage:`, e);
  }
}

export const loadTrackedBusinesses = () => load<TrackedBusiness>(BUSINESSES_KEY);
export const saveTrackedBusinesses = (list: TrackedBusiness[]) => save(BUSINESSES_KEY, list);
export const loadSearchLog = () => load<SearchLogEntry>(SEARCHES_KEY);
export const saveSearchLog = (list: SearchLogEntry[]) => save(SEARCHES_KEY, list);

/** Registra un evento de un negocio (lo crea en el historial si es la primera vez que se ve). */
export function addBusinessEvent(
  list: TrackedBusiness[],
  lead: BusinessLead,
  type: ActivityType,
  extra?: { channel?: ApproachChannel; note?: string }
): TrackedBusiness[] {
  const now = new Date().toISOString();
  const event: ActivityEvent = { id: newId(), type, at: now, ...extra };
  const existing = list.find((t) => t.id === lead.id);

  if (existing) {
    const updated: TrackedBusiness = {
      ...existing,
      lead: { ...existing.lead, ...lead },
      lastActivityAt: now,
      events: [event, ...existing.events].slice(0, MAX_EVENTS_PER_BUSINESS),
    };
    return [updated, ...list.filter((t) => t.id !== lead.id)];
  }

  const created: TrackedBusiness = {
    id: lead.id,
    lead,
    firstSeenAt: now,
    lastActivityAt: now,
    events: [event],
  };
  return [created, ...list].slice(0, MAX_BUSINESSES);
}

/** Actualiza la copia guardada del negocio (correo, análisis…) sin crear un evento nuevo. */
export function refreshBusinessSnapshot(list: TrackedBusiness[], lead: BusinessLead): TrackedBusiness[] {
  return list.map((t) => (t.id === lead.id ? { ...t, lead: { ...t.lead, ...lead } } : t));
}

export function addSearchEntry(
  list: SearchLogEntry[],
  entry: Omit<SearchLogEntry, 'id' | 'at'>
): SearchLogEntry[] {
  return [{ ...entry, id: newId(), at: new Date().toISOString() }, ...list].slice(0, MAX_SEARCHES);
}

export type ApproachStatus = 'acercamiento' | 'canal_abierto' | 'solo_visto';

export function getApproachStatus(t: TrackedBusiness): ApproachStatus {
  if (t.events.some((e) => e.type === 'acercamiento')) return 'acercamiento';
  if (t.events.some((e) => e.type === 'whatsapp' || e.type === 'llamada' || e.type === 'correo')) return 'canal_abierto';
  return 'solo_visto';
}

export const countEvents = (t: TrackedBusiness, type: ActivityType) =>
  t.events.filter((e) => e.type === type).length;
