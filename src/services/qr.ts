/** Código QR como imagen (se carga solo cuando se necesita). */
export async function qrDataUrl(text: string, width = 360): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(text, { width, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } });
}
