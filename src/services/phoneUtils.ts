import { applyEmojiPolicy, getOutreachSettings } from './outreachSettings';

/**
 * Utilidades para formateo y enlace directo a WhatsApp para negocios en Colombia
 */

export function cleanColombianPhoneNumber(rawPhone?: string): string | null {
  if (!rawPhone) return null;
  
  // Extraer únicamente los dígitos numéricos
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  // Si ya tiene el código de país de Colombia 57
  if (digits.startsWith('57')) {
    // Si tiene 12 dígitos (57 + 10 dígitos)
    if (digits.length === 12) return digits;
    // Si tiene 10 dígitos después del 57 pero faltó algo
    if (digits.length > 10) return digits;
  }

  // Celulares en Colombia: 10 dígitos empezando con 3 (ej. 300 123 4567)
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }

  // Fijos en Colombia con indicativo (ej. 604 411 9020 -> 10 dígitos)
  if (digits.length === 10) {
    return `57${digits}`;
  }

  // Si son 7 u 8 dígitos (fijo local sin indicativo 604 de Medellín)
  if (digits.length === 7) {
    return `57604${digits}`;
  }

  // Fallback si tiene al menos 10 dígitos
  if (digits.length >= 10) {
    return `57${digits.slice(-10)}`;
  }

  return null;
}

export function isMobilePhoneNumber(rawPhone?: string): boolean {
  if (!rawPhone) return false;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) {
    return digits.substring(2).startsWith('3');
  }
  return digits.length === 10 && digits.startsWith('3');
}

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

/**
 * Enlace al chat de WhatsApp. En computador se abre WhatsApp Web (la app de escritorio de Windows a veces
 * muestra los emojis como cuadros con «?» al abrir enlaces wa.me); en celular se usa wa.me, que abre la app.
 * Se puede forzar el destino en Ajustes.
 */
export function buildWhatsAppDirectUrl(rawPhone?: string, message?: string): string | null {
  const phone = cleanColombianPhoneNumber(rawPhone);
  if (!phone) return null;

  const text = message ? applyEmojiPolicy(message.trim()) : '';
  const encodedMsg = text ? encodeURIComponent(text) : '';
  const target = getOutreachSettings().whatsappTarget;
  const useWeb = target === 'web' || (target === 'auto' && !isMobileDevice());
  return useWeb
    ? `https://web.whatsapp.com/send?phone=${phone}${encodedMsg ? `&text=${encodedMsg}` : ''}`
    : `https://wa.me/${phone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}
