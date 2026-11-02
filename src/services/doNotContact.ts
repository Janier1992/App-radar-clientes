import { BusinessLead } from '../types';
import { cleanColombianPhoneNumber } from './phoneUtils';

/** Negocios que pidieron no recibir más mensajes. Se guarda en el navegador, como el resto de los datos. */
export interface BlockedEntry {
  id: string; // id del lugar en Google Places
  name: string;
  phone: string; // teléfono normalizado (57XXXXXXXXXX) para reconocerlo aunque aparezca con otro id
  at: string; // ISO
  reason?: string;
}

const KEY = 'radar_do_not_contact';

export function loadBlocked(): BlockedEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as BlockedEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveBlocked(list: BlockedEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudo guardar la lista de «no contactar»:', e);
  }
}

export const normalizePhone = (raw?: string) => cleanColombianPhoneNumber(raw) || '';

export function addBlocked(list: BlockedEntry[], lead: BusinessLead, reason?: string): BlockedEntry[] {
  if (list.some((b) => b.id === lead.id)) return list;
  return [
    { id: lead.id, name: lead.name, phone: normalizePhone(lead.nationalPhoneNumber), at: new Date().toISOString(), reason },
    ...list,
  ];
}

export const removeBlocked = (list: BlockedEntry[], id: string) => list.filter((b) => b.id !== id);

/** Un negocio está bloqueado por su id o por su teléfono (por si Google lo devuelve con otro id). */
export function isBlocked(list: BlockedEntry[], lead: BusinessLead): boolean {
  if (list.length === 0) return false;
  const phone = normalizePhone(lead.nationalPhoneNumber);
  return list.some((b) => b.id === lead.id || (phone !== '' && b.phone === phone));
}
