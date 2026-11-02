import { BusinessLead, SellerProfile } from '../types';
import { SECTOR_BENEFITS, detectSector, getReservasIaPdfUrl, webSituation } from './outreachMessage';
import { OutreachSettings } from './outreachSettings';
import { downloadBlob, pdfText, stamp } from './historyExport';
import { qrDataUrl } from './qr';

export interface ProposalOptions {
  landing: boolean;
  reservas: boolean;
  note?: string; // nota adicional para este negocio
}

/** ¿Hay al menos un precio configurado? Sin precios la propuesta dice «valor a definir en la demo». */
export const hasPrices = (s: OutreachSettings) => Boolean(s.priceLanding.trim() || s.priceReservasSetup.trim() || s.priceReservasMonthly.trim());

/**
 * Propuesta comercial en PDF para enviar tras la demo. Los precios salen solo de lo que se escribió en
 * Ajustes: la app no inventa cifras. Lo que describe de ReservasIA es lo que dice la presentación comercial.
 */
export async function exportProposalPdf(opts: {
  lead: BusinessLead;
  seller: SellerProfile;
  settings: OutreachSettings;
  cardUrl: string;
  options: ProposalOptions;
}) {
  const { lead, seller, settings, cardUrl, options } = opts;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const sector = detectSector(lead);
  const web = webSituation(lead);

  let y = 0;
  const ensure = (needed: number) => {
    if (y + needed > H - 60) {
      doc.addPage();
      y = 56;
    }
  };
  const text = (value: string, x: number, size: number, o: { bold?: boolean; color?: [number, number, number]; maxWidth?: number; gap?: number } = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(o.color ?? [30, 41, 59]));
    const lines = doc.splitTextToSize(pdfText(value), o.maxWidth ?? W - 2 * M) as string[];
    ensure(lines.length * size * 1.35 + 2);
    y += size;
    doc.text(lines, x, y);
    y += (lines.length - 1) * size * 1.35 + (o.gap ?? 4);
  };
  const heading = (title: string) => {
    ensure(40);
    y += 12;
    doc.setFillColor(16, 185, 129);
    doc.rect(M, y + 2, 3, 14, 'F');
    text(title, M + 10, 13, { bold: true, color: [15, 23, 42], gap: 6 });
  };
  const bullets = (items: string[]) => items.forEach((b) => text(`•  ${b}`, M + 8, 10.5, { maxWidth: W - 2 * M - 16, gap: 2 }));

  // Cabecera
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 110, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 110, W, 3, 'F');
  y = 26;
  text('Propuesta comercial', M, 10, { color: [148, 163, 184] });
  text(lead.name, M, 22, { bold: true, color: [255, 255, 255], gap: 6 });
  text(`Preparada por ${[seller.name, seller.companyOrAgency].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ')} · ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, M, 10, { color: [203, 213, 225] });
  y = 128;

  // Contexto
  heading('Lo que vimos en tu negocio');
  const context: string[] = [];
  if (typeof lead.rating === 'number') context.push(`Calificación en Google: ${lead.rating.toFixed(1)} de 5${lead.userRatingCount ? ` (${lead.userRatingCount} reseñas)` : ''}.`);
  context.push(
    web === 'own'
      ? 'Ya cuentan con página web; la oportunidad está en convertir visitas en reservas y atender fuera de horario.'
      : web === 'social'
      ? `Hoy dependen de ${lead.websiteClassification.platform || 'redes sociales'} y no tienen una página propia donde reservar o consultar.`
      : 'No tienen una página web propia registrada, así que quien los busca en Google no encuentra dónde ver servicios y reservar.'
  );
  for (const p of lead.analysis?.plainProblems?.filter(Boolean).slice(0, 3) ?? []) context.push(p);
  bullets(context);

  // Qué incluye
  heading('Qué incluye la propuesta');
  if (options.landing) {
    text('Landing page profesional', M + 4, 11, { bold: true, gap: 2 });
    bullets(['Diseño rápido en celular, pensado para aparecer en Google.', 'Ubicación, servicios, horarios y botón directo de WhatsApp.', 'Lista para recibir reservas y consultas.']);
  }
  if (options.reservas) {
    text('ReservasIA: asistente de reservas por WhatsApp', M + 4, 11, { bold: true, gap: 2 });
    bullets([
      'Atiende 24/7: muestra horarios reales, agenda y confirma solo.',
      'Calendario protegido contra dobles reservas.',
      'Recordatorios automáticos para reducir las ausencias.',
      'Tres puertas de entrada: chat, código QR o enlace, y el mostrador del local.',
      `Para su rubro: ${SECTOR_BENEFITS[sector]}`,
    ]);
  }

  // Inversión
  heading('Inversión');
  const rows: [string, string][] = [];
  if (options.landing) rows.push(['Landing page (pago único)', settings.priceLanding.trim()]);
  if (options.reservas) {
    rows.push(['ReservasIA: implementación (pago único)', settings.priceReservasSetup.trim()]);
    rows.push(['ReservasIA: mensualidad', settings.priceReservasMonthly.trim()]);
  }
  const shown = rows.filter(([, price]) => price);
  if (shown.length === 0) {
    text('El valor se define en la demo según lo que necesite tu negocio.', M + 4, 10.5, { gap: 4 });
  } else {
    for (const [label, price] of shown) {
      ensure(34);
      const top = y + 4;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M, top, W - 2 * M, 26, 4, 4, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      doc.text(pdfText(label), M + 10, top + 17, { maxWidth: W - 2 * M - 200 });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text(pdfText(price), W - M - 10, top + 17, { align: 'right', maxWidth: 180 });
      y = top + 32;
    }
  }
  if (settings.founderOffer.trim()) text(settings.founderOffer.trim(), M + 4, 10.5, { bold: true, color: [4, 120, 87], gap: 4 });
  if (options.note?.trim()) text(`Nota: ${options.note.trim()}`, M + 4, 10, { color: [71, 85, 105], gap: 4 });

  // Cómo empezamos
  heading('Cómo empezamos');
  [
    '1. Arranque precargado: elegimos tu rubro y dejamos los servicios típicos configurados (o cargamos tu lista de precios desde Excel).',
    '2. Tu horario, tus reglas: defines cuándo abres, cuándo almuerzas y qué días descansas; enlazamos Google Calendar.',
    '3. Listo para vender: te entregamos tu enlace web y tu código QR, y el asistente empieza a trabajar.',
  ].forEach((step) => text(step, M + 8, 10.5, { maxWidth: W - 2 * M - 16, gap: 2 }));

  // Condiciones
  const terms = settings.proposalTerms.split('\n').map((t) => t.trim()).filter(Boolean);
  const validity = Math.min(90, Math.max(1, Math.round(settings.proposalValidityDays) || 15));
  heading('Condiciones');
  bullets([...terms, `Propuesta vigente por ${validity} días (hasta el ${new Date(Date.now() + validity * 86_400_000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}).`]);

  // Contacto
  ensure(120);
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);
  y += 6;
  const top = y;
  const contact = [
    [seller.name, seller.companyOrAgency && !seller.companyOrAgency.toLowerCase().includes((seller.name || '').toLowerCase()) ? seller.companyOrAgency : ''].filter(Boolean).join(' · '),
    settings.cardRole,
    settings.cardPhone && `WhatsApp: ${settings.cardPhone}`,
    settings.cardEmail,
    settings.cardWeb,
  ].filter((v): v is string => Boolean(v));
  contact.forEach((line, i) => text(line, M, i === 0 ? 12 : 10.5, { bold: i === 0, maxWidth: W - 2 * M - 140, gap: 2 }));
  text(`Presentación: ${getReservasIaPdfUrl()}`, M, 8.5, { color: [100, 116, 139], maxWidth: W - 2 * M - 140 });
  if (cardUrl) {
    try {
      doc.addImage(await qrDataUrl(cardUrl, 300), 'PNG', W - M - 90, top, 90, 90);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea para ver mi tarjeta', W - M - 90, top + 100, { maxWidth: 90 });
      y = Math.max(y, top + 108);
    } catch (err) {
      console.warn('No se pudo generar el QR de la propuesta:', err);
    }
  }

  // Pie con número de página
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfText(`Propuesta para ${lead.name}`), M, H - 24);
    doc.text(`Página ${i} de ${pages}`, W - M, H - 24, { align: 'right' });
  }

  downloadBlob(doc.output('blob'), `propuesta_comercial_${lead.name.replace(/[^\w\-]+/g, '_').slice(0, 40)}_${stamp()}.pdf`);
}
