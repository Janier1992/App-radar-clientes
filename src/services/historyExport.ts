import { BusinessLead, PipelineStatus, SearchLogEntry, TrackedBusiness } from '../types';
import {
  ACTIVITY_LABELS,
  CHANNEL_LABELS,
  STATUS_LABELS,
  countEvents,
  getApproachStatus,
} from './activityLog';

export interface HistoryExportOptions {
  businesses: TrackedBusiness[]; // ya filtrados y ordenados como se ven en pantalla
  searches: SearchLogEntry[];
  filterNote: string; // descripción legible de filtros y orden aplicados
}

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  nuevo: 'Nuevo',
  analizado: 'Analizado',
  contactado: 'Contactado',
  respondio: 'Respondió',
  reunion: 'Reunión',
  cliente: 'Cliente',
  descartado: 'Descartado',
};

export const SERVICE_LABELS: Record<string, string> = {
  web_nueva: 'Web nueva',
  agente_whatsapp: 'Agente de WhatsApp',
  sistema_citas: 'Sistema de citas',
};

export const webTypeLabel = (lead: BusinessLead) =>
  lead.websiteClassification.type === 'own'
    ? 'Web propia'
    : lead.websiteClassification.type === 'directory_or_social'
    ? `Red social / directorio${lead.websiteClassification.platform ? ` (${lead.websiteClassification.platform})` : ''}`
    : 'Sin web';

export const stamp = () => new Date().toISOString().slice(0, 10);

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Datos comunes a Excel, PDF y CSV: una fila por negocio con todos sus campos. */
export function buildBusinessRows(businesses: TrackedBusiness[]) {
  return businesses.map((b, index) => {
    const lastApproach = b.events.find((e) => e.type === 'acercamiento');
    const lead = b.lead;
    return {
      n: index + 1,
      name: lead.name,
      category: lead.primaryTypeDisplayName || '',
      phone: lead.nationalPhoneNumber || '',
      email: lead.email || '',
      website: lead.websiteUri || '',
      webType: webTypeLabel(lead),
      address: lead.formattedAddress || '',
      rating: typeof lead.rating === 'number' ? lead.rating : null,
      reviews: typeof lead.userRatingCount === 'number' ? lead.userRatingCount : null,
      score: typeof lead.opportunityScore === 'number' ? lead.opportunityScore : null,
      pipeline: PIPELINE_LABELS[lead.pipelineStatus] || '',
      service: lead.analysis ? SERVICE_LABELS[lead.analysis.recommendedService] || '' : '',
      status: STATUS_LABELS[getApproachStatus(b)],
      firstSeen: new Date(b.firstSeenAt),
      lastActivity: new Date(b.lastActivityAt),
      fichas: countEvents(b, 'ficha'),
      whatsapp: countEvents(b, 'whatsapp'),
      calls: countEvents(b, 'llamada'),
      mails: countEvents(b, 'correo'),
      webVisits: countEvents(b, 'web'),
      maps: countEvents(b, 'maps'),
      approaches: countEvents(b, 'acercamiento'),
      lastApproachChannel: lastApproach?.channel ? CHANNEL_LABELS[lastApproach.channel] : '',
      lastApproachDate: lastApproach ? new Date(lastApproach.at) : null,
      lastApproachNote: lastApproach?.note || '',
      mapsUrl: lead.googleMapsUri || '',
    };
  });
}

/** Un registro por acción (formato "largo", ideal para tablas dinámicas). */
function buildActivityRows(businesses: TrackedBusiness[]) {
  return businesses
    .flatMap((b) =>
      b.events.map((e) => ({
        at: new Date(e.at),
        name: b.lead.name,
        category: b.lead.primaryTypeDisplayName || '',
        action: ACTIVITY_LABELS[e.type],
        channel: e.channel ? CHANNEL_LABELS[e.channel] : '',
        note: e.note || '',
      }))
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

// ---------------------------------------------------------------- CSV
const csvCell = (value: string | number | Date | null | undefined) => {
  const text = value instanceof Date ? formatDateTime(value.toISOString()) : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

export function exportHistoryCsv({ businesses }: HistoryExportOptions) {
  const rows = buildBusinessRows(businesses);
  const headers = [
    '#', 'Negocio', 'Categoría', 'Teléfono', 'Correo', 'Sitio web', 'Tipo de presencia web', 'Dirección',
    'Valoración', 'Reseñas', 'Oportunidad', 'Etapa del embudo', 'Servicio recomendado', 'Estado de acercamiento',
    'Primera vez visto', 'Última actividad', 'Fichas vistas', 'WhatsApp abierto', 'Llamadas', 'Correos abiertos',
    'Visitas a su web', 'Google Maps', 'Acercamientos registrados', 'Último acercamiento (canal)',
    'Último acercamiento (fecha)', 'Último acercamiento (nota)', 'Enlace Google Maps',
  ];
  const lines = rows.map((r) =>
    [
      r.n, r.name, r.category, r.phone, r.email, r.website, r.webType, r.address, r.rating, r.reviews, r.score,
      r.pipeline, r.service, r.status, r.firstSeen, r.lastActivity, r.fichas, r.whatsapp, r.calls, r.mails,
      r.webVisits, r.maps, r.approaches, r.lastApproachChannel, r.lastApproachDate, r.lastApproachNote, r.mapsUrl,
    ].map(csvCell).join(';')
  );
  const csv = '﻿' + [headers.map(csvCell).join(';'), ...lines].join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `radar_historial_${stamp()}.csv`);
}

// --------------------------------------------------------------- Excel
const HEADER_FILL = 'FF0F172A';
const ACCENT = 'FF10B981';
const DATE_FORMAT = 'dd/mm/yyyy hh:mm';

export async function exportHistoryXlsx({ businesses, searches, filterNote }: HistoryExportOptions) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Radar de Clientes';
  wb.created = new Date();

  const styleHeader = (sheet: import('exceljs').Worksheet) => {
    const header = sheet.getRow(1);
    header.height = 24;
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = { bottom: { style: 'medium', color: { argb: ACCENT } } };
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
  };

  const rows = buildBusinessRows(businesses);
  const activity = buildActivityRows(businesses);

  // ---- Hoja 1: Resumen
  const resumen = wb.addWorksheet('Resumen');
  resumen.columns = [{ width: 38 }, { width: 18 }, { width: 18 }];
  resumen.addRow(['Radar de Clientes · Historial de prospección']).font = { bold: true, size: 16 };
  resumen.addRow([`Generado: ${formatDateTime(new Date().toISOString())}`]);
  resumen.addRow([filterNote]);
  resumen.addRow([]);
  const kpiHeader = resumen.addRow(['Indicador', 'Valor']);
  kpiHeader.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  });
  const countStatus = (label: string) => rows.filter((r) => r.status === label).length;
  [
    ['Negocios exportados', rows.length],
    [STATUS_LABELS.acercamiento, countStatus(STATUS_LABELS.acercamiento)],
    [STATUS_LABELS.canal_abierto, countStatus(STATUS_LABELS.canal_abierto)],
    [STATUS_LABELS.solo_visto, countStatus(STATUS_LABELS.solo_visto)],
    ['Acciones registradas', activity.length],
    ['Búsquedas registradas', searches.length],
  ].forEach((r) => resumen.addRow(r));

  resumen.addRow([]);
  const catHeader = resumen.addRow(['Negocios por categoría', 'Negocios', 'Con acercamiento']);
  catHeader.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  });
  const byCategory = new Map<string, { total: number; approached: number }>();
  rows.forEach((r) => {
    const key = r.category || 'Sin categoría';
    const entry = byCategory.get(key) || { total: 0, approached: 0 };
    entry.total += 1;
    if (r.approaches > 0) entry.approached += 1;
    byCategory.set(key, entry);
  });
  [...byCategory.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, v]) => resumen.addRow([cat, v.total, v.approached]));

  // ---- Hoja 2: Negocios
  const sheet = wb.addWorksheet('Negocios');
  sheet.columns = [
    { header: '#', key: 'n', width: 5 },
    { header: 'Negocio', key: 'name', width: 34 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Teléfono', key: 'phone', width: 16 },
    { header: 'Correo', key: 'email', width: 30 },
    { header: 'Sitio web', key: 'website', width: 32 },
    { header: 'Tipo de presencia web', key: 'webType', width: 24 },
    { header: 'Dirección', key: 'address', width: 40 },
    { header: 'Valoración', key: 'rating', width: 11 },
    { header: 'Reseñas', key: 'reviews', width: 10 },
    { header: 'Oportunidad (0-100)', key: 'score', width: 14 },
    { header: 'Etapa del embudo', key: 'pipeline', width: 16 },
    { header: 'Servicio recomendado', key: 'service', width: 22 },
    { header: 'Estado de acercamiento', key: 'status', width: 28 },
    { header: 'Primera vez visto', key: 'firstSeen', width: 18 },
    { header: 'Última actividad', key: 'lastActivity', width: 18 },
    { header: 'Fichas vistas', key: 'fichas', width: 10 },
    { header: 'WhatsApp abierto', key: 'whatsapp', width: 11 },
    { header: 'Llamadas', key: 'calls', width: 10 },
    { header: 'Correos abiertos', key: 'mails', width: 10 },
    { header: 'Visitas a su web', key: 'webVisits', width: 10 },
    { header: 'Google Maps', key: 'maps', width: 10 },
    { header: 'Acercamientos registrados', key: 'approaches', width: 13 },
    { header: 'Último acercamiento (canal)', key: 'lastApproachChannel', width: 18 },
    { header: 'Último acercamiento (fecha)', key: 'lastApproachDate', width: 18 },
    { header: 'Último acercamiento (nota)', key: 'lastApproachNote', width: 34 },
    { header: 'Enlace Google Maps', key: 'mapsUrl', width: 34 },
  ];
  rows.forEach((r) => {
    const row = sheet.addRow({
      ...r,
      rating: r.rating ?? '',
      reviews: r.reviews ?? '',
      score: r.score ?? '',
      lastApproachDate: r.lastApproachDate ?? '',
    });
    if (r.email) row.getCell('email').value = { text: r.email, hyperlink: `mailto:${r.email}` };
    if (r.website) row.getCell('website').value = { text: r.website, hyperlink: r.website };
    if (r.mapsUrl) row.getCell('mapsUrl').value = { text: r.mapsUrl, hyperlink: r.mapsUrl };
    ['email', 'website', 'mapsUrl'].forEach((k) => {
      const c = row.getCell(k);
      if (c.value) c.font = { color: { argb: 'FF0563C1' }, underline: true };
    });
  });
  ['firstSeen', 'lastActivity', 'lastApproachDate'].forEach((k) => (sheet.getColumn(k).numFmt = DATE_FORMAT));
  sheet.getColumn('rating').numFmt = '0.0';
  styleHeader(sheet);

  // ---- Hoja 3: Actividad (una fila por acción)
  const act = wb.addWorksheet('Actividad');
  act.columns = [
    { header: 'Fecha y hora', key: 'at', width: 18 },
    { header: 'Negocio', key: 'name', width: 34 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Acción', key: 'action', width: 30 },
    { header: 'Canal', key: 'channel', width: 18 },
    { header: 'Nota', key: 'note', width: 44 },
  ];
  activity.forEach((a) => act.addRow(a));
  act.getColumn('at').numFmt = DATE_FORMAT;
  styleHeader(act);

  // ---- Hoja 4: Búsquedas
  const sr = wb.addWorksheet('Búsquedas');
  sr.columns = [
    { header: 'Fecha y hora', key: 'at', width: 18 },
    { header: 'Zona', key: 'zone', width: 30 },
    { header: 'Nicho', key: 'niche', width: 26 },
    { header: 'Resultados', key: 'resultsCount', width: 12 },
  ];
  searches.forEach((s) => sr.addRow({ ...s, at: new Date(s.at) }));
  sr.getColumn('at').numFmt = DATE_FORMAT;
  styleHeader(sr);

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `radar_historial_${stamp()}.xlsx`
  );
}

// ----------------------------------------------------------------- PDF
// jsPDF usa fuentes estándar (Latin-1): se eliminan emojis y símbolos fuera de ese rango.
export const pdfText = (value: string | number | null | undefined) =>
  String(value ?? '').replace(/[^ -~ -ÿ–—‘’“”•…€]/g, '');

export async function exportHistoryPdf({ businesses, searches, filterNote }: HistoryExportOptions) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const rows = buildBusinessRows(businesses);
  const activity = buildActivityRows(businesses);
  const approaches = activity.filter((a) => a.action === ACTIVITY_LABELS.acercamiento);

  // Cabecera
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 62, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 62, pageWidth, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Radar de Clientes', 36, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Historial de prospección', 36, 48);
  doc.setFontSize(9);
  doc.text(pdfText(`Generado: ${formatDateTime(new Date().toISOString())}`), pageWidth - 36, 30, { align: 'right' });
  doc.text(pdfText(filterNote), pageWidth - 36, 48, { align: 'right', maxWidth: pageWidth * 0.6 });

  // Resumen
  const countStatus = (label: string) => rows.filter((r) => r.status === label).length;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(
    pdfText(
      `Negocios: ${rows.length}   |   ${STATUS_LABELS.acercamiento}: ${countStatus(STATUS_LABELS.acercamiento)}   |   ${STATUS_LABELS.canal_abierto}: ${countStatus(STATUS_LABELS.canal_abierto)}   |   ${STATUS_LABELS.solo_visto}: ${countStatus(STATUS_LABELS.solo_visto)}   |   Búsquedas: ${searches.length}`
    ),
    36,
    86
  );

  const baseStyles = {
    font: 'helvetica' as const,
    fontSize: 8,
    cellPadding: 4,
    textColor: [30, 41, 59] as [number, number, number],
    overflow: 'linebreak' as const,
  };
  const headStyles = { fillColor: [15, 23, 42] as [number, number, number], textColor: 255, fontStyle: 'bold' as const };
  const alternate = { fillColor: [241, 245, 249] as [number, number, number] };

  const sectionTitle = (text: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(text, 36, y);
  };

  // Tabla 1: negocios
  sectionTitle(`Negocios (${rows.length})`, 112);
  autoTable(doc, {
    startY: 120,
    margin: { left: 36, right: 36, bottom: 40 },
    head: [['#', 'Negocio', 'Categoría', 'Teléfono', 'Correo', 'Web', 'Estado', 'Última actividad', 'Fichas', 'WA', 'Llam.', 'Web', 'Acerc.']],
    body: rows.map((r) => [
      r.n,
      pdfText(r.name),
      pdfText(r.category),
      pdfText(r.phone),
      pdfText(r.email || '-'),
      pdfText(r.webType),
      pdfText(r.status),
      pdfText(formatDateTime(r.lastActivity.toISOString())),
      r.fichas,
      r.whatsapp,
      r.calls,
      r.webVisits,
      r.approaches,
    ]),
    styles: baseStyles,
    headStyles,
    alternateRowStyles: alternate,
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 116 },
      2: { cellWidth: 80 },
      3: { cellWidth: 62 },
      4: { cellWidth: 98 },
      5: { cellWidth: 70 },
      6: { cellWidth: 86 },
      7: { cellWidth: 70 },
      8: { cellWidth: 36, halign: 'center' },
      9: { cellWidth: 24, halign: 'center' },
      10: { cellWidth: 32, halign: 'center' },
      11: { cellWidth: 28, halign: 'center' },
      12: { cellWidth: 36, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text === pdfText(STATUS_LABELS.acercamiento)) data.cell.styles.textColor = [4, 120, 87];
        else if (text === pdfText(STATUS_LABELS.canal_abierto)) data.cell.styles.textColor = [180, 83, 9];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Tabla 2: acercamientos registrados
  const afterFirst = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  if (approaches.length > 0) {
    const y = afterFirst + 28;
    if (y > doc.internal.pageSize.getHeight() - 110) doc.addPage();
    const startY = y > doc.internal.pageSize.getHeight() - 110 ? 50 : y;
    sectionTitle(`Acercamientos registrados (${approaches.length})`, startY);
    autoTable(doc, {
      startY: startY + 8,
      margin: { left: 36, right: 36, bottom: 40 },
      head: [['Fecha y hora', 'Negocio', 'Canal', 'Nota']],
      body: approaches.map((a) => [
        pdfText(formatDateTime(a.at.toISOString())),
        pdfText(a.name),
        pdfText(a.channel),
        pdfText(a.note || '-'),
      ]),
      styles: baseStyles,
      headStyles,
      alternateRowStyles: alternate,
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 200 }, 2: { cellWidth: 90 } },
    });
  }

  // Tabla 3: búsquedas
  if (searches.length > 0) {
    const afterSecond = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const needPage = afterSecond + 28 > doc.internal.pageSize.getHeight() - 110;
    if (needPage) doc.addPage();
    const startY = needPage ? 50 : afterSecond + 28;
    sectionTitle(`Búsquedas realizadas (${searches.length})`, startY);
    autoTable(doc, {
      startY: startY + 8,
      margin: { left: 36, right: 36, bottom: 40 },
      head: [['Fecha y hora', 'Zona', 'Nicho', 'Resultados']],
      body: searches.map((s) => [
        pdfText(formatDateTime(s.at)),
        pdfText(s.zone),
        pdfText(s.niche),
        s.resultsCount,
      ]),
      styles: baseStyles,
      headStyles,
      alternateRowStyles: alternate,
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 200 }, 2: { cellWidth: 160 }, 3: { cellWidth: 60, halign: 'center' } },
    });
  }

  // Pie de página con numeración
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Radar de Clientes · Historial de prospección', 36, doc.internal.pageSize.getHeight() - 18);
    doc.text(`Página ${i} de ${total}`, pageWidth - 36, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
  }

  downloadBlob(doc.output('blob'), `radar_historial_${stamp()}.pdf`);
}
