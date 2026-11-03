import { BusinessLead, SellerProfile } from '../types';
import { SECTOR_LINES, detectSector, firstZone, getReservasIaUrl, webSituation } from './outreachMessage';
import { OutreachSettings } from './outreachSettings';
import { downloadBlob, pdfText, stamp } from './historyExport';
import { qrDataUrl } from './qr';

const SERVICE_NAMES: Record<string, string> = {
  web_nueva: 'una página web nueva',
  agente_whatsapp: 'un asistente de WhatsApp con IA',
  sistema_citas: 'un sistema de citas y reservas',
};

/**
 * Hoja de una página para llevar a una visita presencial (o enviar como PDF). Solo usa datos reales del
 * negocio: Google Maps, la auditoría de PageSpeed y el análisis de Gemini si ya se corrieron.
 */
export async function exportVisitSheetPdf(opts: {
  lead: BusinessLead;
  seller: SellerProfile;
  settings: OutreachSettings;
  cardUrl: string;
}) {
  const { lead, seller, settings, cardUrl } = opts;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const web = webSituation(lead);
  const sector = detectSector(lead);
  const zone = firstZone(lead);
  const minutes = Math.min(60, Math.max(5, Math.round(settings.demoMinutes) || 10));

  const text = (value: string, x: number, y: number, size: number, opts2: { bold?: boolean; color?: [number, number, number]; maxWidth?: number } = {}) => {
    doc.setFont('helvetica', opts2.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts2.color ?? [30, 41, 59]));
    const lines = doc.splitTextToSize(pdfText(value), opts2.maxWidth ?? W - 2 * M) as string[];
    doc.text(lines, x, y);
    return y + lines.length * (size * 1.35);
  };
  const heading = (title: string, y: number) => {
    doc.setFillColor(16, 185, 129);
    doc.rect(M, y - 11, 3, 14, 'F');
    return text(title, M + 10, y, 13, { bold: true, color: [15, 23, 42] }) + 4;
  };

  // Cabecera
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 96, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 96, W, 3, 'F');
  text('Propuesta para', M, 34, 10, { color: [148, 163, 184] });
  text(lead.name, M, 58, 22, { bold: true, color: [255, 255, 255], maxWidth: W - 2 * M });
  text([lead.primaryTypeDisplayName, zone, 'Medellín y Colombia'].filter((v, i) => i < 2 && v).join(' · '), M, 82, 10, { color: [203, 213, 225] });

  let y = 128;

  // 1) El negocio hoy
  y = heading('Tu negocio hoy', y);
  const facts: string[] = [];
  if (typeof lead.rating === 'number') {
    facts.push(`Calificación en Google: ${lead.rating.toFixed(1)} de 5${lead.userRatingCount ? ` (${lead.userRatingCount} reseñas)` : ''}`);
  }
  facts.push(
    web === 'own'
      ? `Página web: ${lead.websiteUri || 'sí tiene'}`
      : web === 'social'
      ? `Presencia en línea: solo ${lead.websiteClassification.platform || 'redes sociales'}, sin página web propia`
      : 'Presencia en línea: sin página web propia registrada'
  );
  if (lead.nationalPhoneNumber) facts.push(`Teléfono: ${lead.nationalPhoneNumber}`);
  if (lead.email) facts.push(`Correo: ${lead.email}`);
  if (lead.formattedAddress) facts.push(`Dirección: ${lead.formattedAddress}`);
  for (const fact of facts) y = text(`•  ${fact}`, M + 4, y + 2, 10.5) + 1;
  y += 10;

  // 2) Hallazgos
  y = heading('Lo que encontramos', y);
  const audit = lead.auditData;
  if (audit) {
    const boxes: [string, number][] = [
      ['Velocidad', audit.performance],
      ['SEO', audit.seo],
      ['Accesibilidad', audit.accessibility],
      ['Buenas prácticas', audit.bestPractices],
    ];
    const bw = (W - 2 * M - 3 * 10) / 4;
    boxes.forEach(([label, score], i) => {
      const x = M + i * (bw + 10);
      const color: [number, number, number] = score >= 90 ? [5, 150, 105] : score >= 50 ? [217, 119, 6] : [225, 29, 72];
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, bw, 52, 6, 6, 'FD');
      text(String(Math.round(score)), x + 10, y + 28, 22, { bold: true, color, maxWidth: bw - 12 });
      text(label, x + 10, y + 44, 8.5, { color: [100, 116, 139], maxWidth: bw - 12 });
    });
    y += 66;
    y = text('Medido con Google PageSpeed en celular (0 a 100).', M + 4, y, 8.5, { color: [100, 116, 139] }) + 4;
  }
  const problems = lead.analysis?.plainProblems?.filter(Boolean).slice(0, 4) ?? [];
  if (problems.length > 0) {
    for (const problem of problems) y = text(`•  ${problem}`, M + 4, y + 2, 10.5) + 1;
  } else if (!audit) {
    const generic =
      web === 'none'
        ? ['Quien busca el negocio en Google no encuentra una página propia donde ver servicios, horarios y cómo reservar.', 'Las consultas dependen de que alguien conteste el teléfono o el chat en el momento.']
        : web === 'social'
        ? ['Depender de redes sociales deja al cliente a varios pasos de escribir o reservar.', 'No hay un lugar propio con servicios, ubicación y botón directo de WhatsApp.']
        : ['Conviene revisar si la página convierte visitas en reservas y consultas, y si responde fuera de horario.'];
    for (const line of generic) y = text(`•  ${line}`, M + 4, y + 2, 10.5) + 1;
  }
  if (lead.analysis?.recommendedService) {
    y = text(`Recomendación: ${SERVICE_NAMES[lead.analysis.recommendedService] ?? lead.analysis.recommendedService}.`, M + 4, y + 6, 10.5, { bold: true, color: [4, 120, 87] });
  }
  y += 12;

  // 3) Cómo ayudamos
  y = heading('Cómo podemos ayudarte', y);
  if (web !== 'own' && settings.offerLanding) {
    y = text('Landing page profesional', M + 4, y + 2, 11, { bold: true }) + 1;
    for (const b of ['Rápida en celular y lista para aparecer en Google.', 'Con tu ubicación, servicios y botón directo de WhatsApp.'])
      y = text(`•  ${b}`, M + 10, y + 1, 10) + 1;
    y += 4;
  }
  y = text('ReservasIA: asistente de reservas por WhatsApp', M + 4, y + 2, 11, { bold: true }) + 1;
  for (const b of [
    'Atiende 24/7: muestra horarios reales, agenda y confirma solo.',
    'Calendario protegido contra dobles reservas.',
    'Recordatorios automáticos para reducir las ausencias.',
    'Panel con todo el estado del negocio y código QR para reservar.',
  ])
    y = text(`•  ${b}`, M + 10, y + 1, 10) + 1;
  y = text(SECTOR_LINES[sector], M + 4, y + 6, 10, { color: [71, 85, 105] }) + 10;

  // 4) Siguiente paso y contacto
  y = Math.max(y, H - 230);
  y = heading('Siguiente paso', y);
  y = text(`Una demo de ${minutes} minutos con los datos de ${lead.name}, sin costo ni compromiso.`, M + 4, y + 2, 11) + 6;

  const contact: string[] = [
    [seller.name, seller.companyOrAgency && !seller.companyOrAgency.toLowerCase().includes(seller.name.toLowerCase()) ? seller.companyOrAgency : ''].filter(Boolean).join(' · ') ||
      seller.companyOrAgency,
    settings.cardRole,
    settings.cardPhone && `WhatsApp: ${settings.cardPhone}`,
    settings.cardEmail,
    settings.cardWeb,
  ].filter((v): v is string => Boolean(v));
  const contactTop = y;
  for (const [i, line] of contact.entries()) y = text(line, M + 4, y + 2, i === 0 ? 12 : 10.5, { bold: i === 0, maxWidth: W - 2 * M - 150 }) + 1;
  y = text(`ReservasIA: ${getReservasIaUrl()}`, M + 4, y + 4, 8.5, { color: [100, 116, 139], maxWidth: W - 2 * M - 150 });

  if (cardUrl) {
    try {
      const qr = await qrDataUrl(cardUrl, 300);
      doc.addImage(qr, 'PNG', W - M - 112, contactTop - 4, 112, 112);
      text('Escanea para ver mi tarjeta', W - M - 112, contactTop + 120, 8.5, { color: [100, 116, 139], maxWidth: 112 });
    } catch (err) {
      console.warn('No se pudo generar el QR de la hoja:', err);
    }
  }

  // Pie
  doc.setDrawColor(226, 232, 240);
  doc.line(M, H - 40, W - M, H - 40);
  text(`Preparado con Radar de Clientes · ${new Date().toLocaleDateString('es-CO')}`, M, H - 24, 8, { color: [100, 116, 139] });

  downloadBlob(doc.output('blob'), `propuesta_${lead.name.replace(/[^\w\-]+/g, '_').slice(0, 40)}_${stamp()}.pdf`);
}
