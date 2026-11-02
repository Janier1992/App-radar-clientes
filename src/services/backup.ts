import { AppQuotaSettings, BusinessLead, SearchLogEntry, SellerProfile, TrackedBusiness } from '../types';
import { BlockedEntry } from './doNotContact';
import { OutreachSettings } from './outreachSettings';

export const BACKUP_APP = 'radar-de-clientes';
export const BACKUP_VERSION = 2;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_BUSINESSES = 300;
const MAX_EVENTS = 60;
const MAX_SEARCHES = 200;

/** Todo lo que la app guarda en el navegador y que vale la pena respaldar. */
export interface AppData {
  leads: BusinessLead[];
  tracked: TrackedBusiness[];
  searches: SearchLogEntry[];
  blocked: BlockedEntry[];
  seller: SellerProfile;
  settings: OutreachSettings;
  quota: AppQuotaSettings;
}

export interface BackupFile {
  app: string;
  version: number;
  exportedAt: string;
  leads: BusinessLead[];
  activityLog: TrackedBusiness[];
  searchLog: SearchLogEntry[];
  doNotContact: BlockedEntry[];
  sellerProfile?: SellerProfile;
  outreachSettings?: OutreachSettings;
  quotaSettings?: AppQuotaSettings;
}

export type RestoreMode = 'merge' | 'replace';

// ------------------------------------------------------------------ marcas de tiempo del respaldo
const LAST_KEY = 'radar_last_backup_at';
const FIRST_KEY = 'radar_first_seen_at';
const SNOOZE_KEY = 'radar_backup_snooze_until';
const DAY_MS = 24 * 60 * 60 * 1000;

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento disponible */
  }
};

export const getLastBackupAt = () => read(LAST_KEY);
export const markBackupDone = () => write(LAST_KEY, new Date().toISOString());
export const ensureFirstSeen = () => {
  if (!read(FIRST_KEY)) write(FIRST_KEY, new Date().toISOString());
};
export const snoozeBackupReminder = (days = 2) => write(SNOOZE_KEY, new Date(Date.now() + days * DAY_MS).toISOString());

export interface BackupStatus {
  due: boolean; // toca recordar
  days: number | null; // días desde la última copia (o desde que se empezó a usar la app)
  never: boolean; // nunca se ha descargado una copia
}

/** Recordatorio semanal: solo si hay datos que perder y no se pospuso. */
export function backupStatus(hasData: boolean, now: Date = new Date()): BackupStatus {
  const last = read(LAST_KEY);
  const first = read(FIRST_KEY);
  const reference = last ?? first;
  const days = reference ? Math.floor((now.getTime() - new Date(reference).getTime()) / DAY_MS) : null;
  const snoozeUntil = read(SNOOZE_KEY);
  const snoozed = snoozeUntil ? new Date(snoozeUntil).getTime() > now.getTime() : false;
  return { due: hasData && !snoozed && days !== null && days >= 7, days, never: !last };
}

// ------------------------------------------------------------------ crear y leer
export function buildBackup(data: AppData): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    leads: data.leads,
    activityLog: data.tracked,
    searchLog: data.searches,
    doNotContact: data.blocked,
    sellerProfile: data.seller,
    outreachSettings: data.settings,
    // La clave de Google escrita en Ajustes no se incluye: el archivo se comparte y se guarda en otros lugares.
    quotaSettings: { ...data.quota, googleCloudApiKey: '' },
  };
}

export const backupFileName = () => `radar_backup_${new Date().toISOString().slice(0, 10)}.json`;

export function downloadBackup(file: BackupFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackupDone();
}

export const canShareBackup = () => {
  try {
    return !!navigator.share && !!navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'a.json', { type: 'application/json' })] });
  } catch {
    return false;
  }
};

/** Hoja de compartir del celular: enviar la copia a otro dispositivo (correo, WhatsApp, Drive…). */
export async function shareBackup(file: BackupFile): Promise<'shared' | 'cancelled'> {
  const blob = new File([JSON.stringify(file, null, 2)], backupFileName(), { type: 'application/json' });
  try {
    await navigator.share({ files: [blob], title: 'Copia de seguridad · Radar de Clientes' });
    markBackupDone();
    return 'shared';
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
    throw err;
  }
}

export interface BackupSummary {
  exportedAt?: string;
  leads: number;
  businesses: number;
  searches: number;
  blocked: number;
  hasSettings: boolean;
  skipped: number; // registros inválidos que se ignoraron
}

export type ParseResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === 'string' && v.length > 0;

export function parseBackup(text: string, size = text.length): ParseResult {
  if (size > MAX_FILE_BYTES) return { ok: false, error: 'El archivo es demasiado grande para ser una copia de Radar de Clientes.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  if (!isObj(raw)) return { ok: false, error: 'El archivo no tiene el formato de una copia de seguridad.' };
  if (raw.app !== undefined && raw.app !== BACKUP_APP) return { ok: false, error: 'Este archivo no es una copia de Radar de Clientes.' };
  if (typeof raw.version === 'number' && raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'La copia viene de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.' };
  }
  if (!Array.isArray(raw.leads) && !Array.isArray(raw.activityLog)) {
    return { ok: false, error: 'No se encontraron leads ni historial en el archivo.' };
  }

  let skipped = 0;
  const keep = <T>(value: unknown, valid: (item: unknown) => boolean): T[] => {
    if (!Array.isArray(value)) return [];
    const good = value.filter((item) => valid(item));
    skipped += value.length - good.length;
    return good as T[];
  };

  const leads = keep<BusinessLead>(raw.leads, (l) => isObj(l) && str(l.id) && str(l.name) && typeof l.pipelineStatus === 'string');
  const activityLog = keep<TrackedBusiness>(
    raw.activityLog,
    (t) => isObj(t) && str(t.id) && isObj(t.lead) && Array.isArray(t.events)
  );
  const searchLog = keep<SearchLogEntry>(raw.searchLog, (s) => isObj(s) && str(s.zone) && str(s.niche) && str(s.at));
  const doNotContact = keep<BlockedEntry>(raw.doNotContact, (b) => isObj(b) && str(b.id) && str(b.name));

  const backup: BackupFile = {
    app: BACKUP_APP,
    version: typeof raw.version === 'number' ? raw.version : 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    leads,
    activityLog,
    searchLog,
    doNotContact,
    sellerProfile: isObj(raw.sellerProfile) ? (raw.sellerProfile as unknown as SellerProfile) : undefined,
    outreachSettings: isObj(raw.outreachSettings) ? (raw.outreachSettings as unknown as OutreachSettings) : undefined,
    quotaSettings: isObj(raw.quotaSettings) ? (raw.quotaSettings as unknown as AppQuotaSettings) : undefined,
  };

  return {
    ok: true,
    backup,
    summary: {
      exportedAt: backup.exportedAt || undefined,
      leads: leads.length,
      businesses: activityLog.length,
      searches: searchLog.length,
      blocked: doNotContact.length,
      hasSettings: Boolean(backup.sellerProfile || backup.outreachSettings),
      skipped,
    },
  };
}

// ------------------------------------------------------------------ combinar / reemplazar
const newer = (a?: string, b?: string) => (a ?? '') >= (b ?? '');

function mergeLeads(current: BusinessLead[], incoming: BusinessLead[]): BusinessLead[] {
  const map = new Map(current.map((l) => [l.id, l]));
  for (const lead of incoming) {
    const existing = map.get(lead.id);
    if (!existing || !newer(existing.updatedAt ?? existing.savedAt, lead.updatedAt ?? lead.savedAt)) map.set(lead.id, lead);
  }
  return [...map.values()];
}

function mergeTracked(current: TrackedBusiness[], incoming: TrackedBusiness[]): TrackedBusiness[] {
  const map = new Map(current.map((t) => [t.id, t]));
  for (const inc of incoming) {
    const cur = map.get(inc.id);
    if (!cur) {
      map.set(inc.id, inc);
      continue;
    }
    const events = new Map(cur.events.map((e) => [e.id, e]));
    inc.events.forEach((e) => events.set(e.id, events.get(e.id) ?? e));
    map.set(inc.id, {
      ...cur,
      lead: newer(cur.lead.updatedAt, inc.lead.updatedAt) ? cur.lead : inc.lead,
      firstSeenAt: cur.firstSeenAt < inc.firstSeenAt ? cur.firstSeenAt : inc.firstSeenAt,
      lastActivityAt: cur.lastActivityAt > inc.lastActivityAt ? cur.lastActivityAt : inc.lastActivityAt,
      events: [...events.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_EVENTS),
    });
  }
  return [...map.values()].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)).slice(0, MAX_BUSINESSES);
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[], order: (a: T, b: T) => number, max: number): T[] {
  const map = new Map(current.map((x) => [x.id, x]));
  incoming.forEach((x) => map.set(x.id, map.get(x.id) ?? x));
  return [...map.values()].sort(order).slice(0, max);
}

/** Resultado de aplicar una copia sobre los datos actuales. Con «reemplazar» solo queda lo que trae la copia. */
export function applyBackup(current: AppData, backup: BackupFile, mode: RestoreMode): AppData {
  if (mode === 'replace') {
    return {
      leads: backup.leads,
      tracked: backup.activityLog.slice(0, MAX_BUSINESSES),
      searches: backup.searchLog.slice(0, MAX_SEARCHES),
      blocked: backup.doNotContact,
      seller: backup.sellerProfile ? { ...current.seller, ...backup.sellerProfile } : current.seller,
      settings: backup.outreachSettings ? { ...current.settings, ...backup.outreachSettings } : current.settings,
      // La clave de Google de este dispositivo se conserva: las copias no la incluyen.
      quota: backup.quotaSettings
        ? { ...current.quota, ...backup.quotaSettings, googleCloudApiKey: current.quota.googleCloudApiKey }
        : current.quota,
    };
  }
  return {
    ...current,
    leads: mergeLeads(current.leads, backup.leads),
    tracked: mergeTracked(current.tracked, backup.activityLog),
    searches: mergeById(current.searches, backup.searchLog, (a, b) => b.at.localeCompare(a.at), MAX_SEARCHES),
    blocked: mergeById(current.blocked, backup.doNotContact, (a, b) => b.at.localeCompare(a.at), 10_000),
  };
}

// ------------------------------------------------------------------ almacenamiento protegido
/** Pide al navegador que no borre los datos de la app cuando falte espacio (se concede sobre todo a la app instalada). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}
