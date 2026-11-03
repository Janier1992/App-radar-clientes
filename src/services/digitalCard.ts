import { cleanColombianPhoneNumber } from './phoneUtils';

/**
 * Tarjeta digital sin backend: los datos viajan dentro del propio enlace (parámetro `tarjeta`), así quien
 * la abre ve la misma tarjeta sin que nada quede guardado en un servidor.
 */
export interface CardData {
  n: string; // nombre
  c?: string; // empresa
  r?: string; // frase / cargo
  p?: string; // teléfono o WhatsApp
  e?: string; // correo
  w?: string; // sitio web
  a?: string; // enlace de ReservasIA (si falta, se usa el oficial)
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
};

export function encodeCard(data: CardData): string {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string' && v.trim() !== ''));
  return toBase64Url(new TextEncoder().encode(JSON.stringify(clean)));
}

export function decodeCard(encoded: string): CardData | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    if (!parsed || typeof parsed.n !== 'string' || !parsed.n.trim()) return null;
    const pick = (key: string, max: number) => (typeof parsed[key] === 'string' ? parsed[key].slice(0, max) : undefined);
    return { n: parsed.n.slice(0, 80), c: pick('c', 80), r: pick('r', 160), p: pick('p', 30), e: pick('e', 120), w: pick('w', 200), a: pick('a', 200) };
  } catch {
    return null;
  }
}

export const buildCardUrl = (data: CardData, origin: string = window.location.origin) => `${origin}/?tarjeta=${encodeCard(data)}`;

/** Solo se enlazan direcciones http(s): evita enlaces `javascript:` si alguien arma una tarjeta a mano. */
export function safeWebUrl(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const candidate = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export const isEmail = (raw?: string) => !!raw && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(raw.trim());

export function cardPhoneDigits(raw?: string): string | null {
  return cleanColombianPhoneNumber(raw);
}

/** vCard 3.0 para «Guardar contacto» en el celular. */
export function buildVCard(card: CardData): string {
  const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
  const phone = cardPhoneDigits(card.p);
  const web = safeWebUrl(card.w);
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(card.n)}`,
    card.c ? `ORG:${esc(card.c)}` : '',
    card.r ? `TITLE:${esc(card.r)}` : '',
    phone ? `TEL;TYPE=CELL:+${phone}` : '',
    isEmail(card.e) ? `EMAIL:${card.e!.trim()}` : '',
    web ? `URL:${web}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');
}
