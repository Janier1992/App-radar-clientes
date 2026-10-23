import { BusinessLead } from '../types';
import {
  PIPELINE_LABELS,
  SERVICE_LABELS,
  downloadBlob,
  formatDateTime,
  pdfText,
  stamp,
  webTypeLabel,
} from './historyExport';

/** Una fila por lead guardado, con los mismos datos en Excel, PDF y CSV. */
function buildLeadRows(leads: BusinessLead[]) {
  return leads.map((l, index) => ({
    n: index + 1,
    name: l.name,
    category: l.primaryTypeDisplayName || '',
    phone: l.nationalPhoneNumber || '',
    email: l.email || '',
    address: l.formattedAddress || '',
    webType: webTypeLabel(l),
    website: l.websiteUri || '',
    rating: typeof l.rating === 'number' ? l.rating : null,
    reviews: typeof l.userRatingCount === 'number' ? l.userRatingCount : null,
    score: typeof l.opportunityScore === 'number' ? l.opportunityScore : null,
    pipeline: PIPELINE_LABELS[l.pipelineStatus] || '',
    nextAction: l.nextActionDate || '',
    service: l.analysis ? SERVICE_LABELS[l.analysis.recommendedService] || '' : '',
    notes: l.notes || '',
    mapsUrl: l.googleMapsUri || '',
  }));
}

const HEADERS = [
  'Nombre', 'Categoría', 'Teléfono', 'Correo', 'Dirección', 'Tipo de web', 'URL web', 'Valoración', 'Reseñas',
  'Puntuación oportunidad', 'Etapa del embudo', 'Fecha próxima acción', 'Servicio recomendado', 'Notas', 'Enlace Google Maps',
];

const csvCell = (value: string | number | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function exportLeadsCsv(leads: BusinessLead[]) {
  const lines = buildLeadRows(leads).map((r) =>
    [
      r.name, r.category, r.phone, r.email, r.address, r.webType, r.website, r.rating, r.reviews, r.score,
      r.pipeline, r.nextAction, r.service, r.notes, r.mapsUrl,
    ].map(csvCell).join(';')
  );
  const csv = '﻿' + [HEADERS.map(csvCell).join(';'), ...lines].join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `radar_leads_${stamp()}.csv`);
}

export async function exportLeadsXlsx(leads: BusinessLead[], filterNote: string) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Radar de Clientes';
  wb.created = new Date();
  const rows = buildLeadRows(leads);

  // Hoja 1: Resumen del embudo
  const resumen = wb.addWorksheet('Resumen');
  resumen.columns = [{ width: 34 }, { width: 14 }];
  resumen.addRow(['Radar de Clientes · Mis leads']).font = { bold: true, size: 16 };
  resumen.addRow([`Generado: ${formatDateTime(new Date().toISOString())}`]);
  resumen.addRow([filterNote]);
  resumen.addRow([]);
  const head = resumen.addRow(['Etapa del embudo', 'Leads']);
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  });
  Object.values(PIPELINE_LABELS).forEach((label) =>
    resumen.addRow([label, rows.filter((r) => r.pipeline === label).length])
  );
  resumen.addRow(['Total', rows.length]).font = { bold: true };

  // Hoja 2: Leads
  const sheet = wb.addWorksheet('Leads');
  sheet.columns = [
    { header: '#', key: 'n', width: 5 },
    { header: 'Nombre', key: 'name', width: 34 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Teléfono', key: 'phone', width: 16 },
    { header: 'Correo', key: 'email', width: 30 },
    { header: 'Dirección', key: 'address', width: 40 },
    { header: 'Tipo de web', key: 'webType', width: 24 },
    { header: 'URL web', key: 'website', width: 32 },
    { header: 'Valoración', key: 'rating', width: 11 },
    { header: 'Reseñas', key: 'reviews', width: 10 },
    { header: 'Oportunidad (0-100)', key: 'score', width: 14 },
    { header: 'Etapa del embudo', key: 'pipeline', width: 16 },
    { header: 'Próxima acción', key: 'nextAction', width: 14 },
    { header: 'Servicio recomendado', key: 'service', width: 22 },
    { header: 'Notas', key: 'notes', width: 44 },
    { header: 'Enlace Google Maps', key: 'mapsUrl', width: 34 },
  ];
  rows.forEach((r) => {
    const row = sheet.addRow({ ...r, rating: r.rating ?? '', reviews: r.reviews ?? '', score: r.score ?? '' });
    if (r.email) row.getCell('email').value = { text: r.email, hyperlink: `mailto:${r.email}` };
    if (r.website) row.getCell('website').value = { text: r.website, hyperlink: r.website };
    if (r.mapsUrl) row.getCell('mapsUrl').value = { text: r.mapsUrl, hyperlink: r.mapsUrl };
    ['email', 'website', 'mapsUrl'].forEach((k) => {
      const c = row.getCell(k);
      if (c.value) c.font = { color: { argb: 'FF0563C1' }, underline: true };
    });
  });
  sheet.getColumn('rating').numFmt = '0.0';
  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF10B981' } } };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `radar_leads_${stamp()}.xlsx`
  );
}

export async function exportLeadsPdf(leads: BusinessLead[], filterNote: string) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rows = buildLeadRows(leads);

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
  doc.text('Mis leads y embudo de ventas', 36, 48);
  doc.setFontSize(9);
  doc.text(pdfText(`Generado: ${formatDateTime(new Date().toISOString())}`), pageWidth - 36, 30, { align: 'right' });
  doc.text(pdfText(filterNote), pageWidth - 36, 48, { align: 'right', maxWidth: pageWidth * 0.6 });

  const summary = Object.values(PIPELINE_LABELS)
    .map((label) => `${label}: ${rows.filter((r) => r.pipeline === label).length}`)
    .join('   |   ');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(pdfText(`Leads: ${rows.length}   |   ${summary}`), 36, 86, { maxWidth: pageWidth - 72 });

  autoTable(doc, {
    startY: 100,
    margin: { left: 36, right: 36, bottom: 40 },
    head: [['#', 'Nombre', 'Categoría', 'Teléfono', 'Correo', 'Web', 'Opor.', 'Etapa', 'Próx. acción', 'Servicio recomendado']],
    body: rows.map((r) => [
      r.n, pdfText(r.name), pdfText(r.category), pdfText(r.phone), pdfText(r.email || '-'), pdfText(r.webType),
      r.score ?? '-', pdfText(r.pipeline), pdfText(r.nextAction || '-'), pdfText(r.service || '-'),
    ]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, textColor: [30, 41, 59], overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 128 }, 2: { cellWidth: 86 }, 3: { cellWidth: 66 }, 4: { cellWidth: 108 },
      5: { cellWidth: 82 }, 6: { cellWidth: 34, halign: 'center' }, 7: { cellWidth: 60 }, 8: { cellWidth: 60 },
    },
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Radar de Clientes · Mis leads', 36, pageHeight - 18);
    doc.text(`Página ${i} de ${total}`, pageWidth - 36, pageHeight - 18, { align: 'right' });
  }
  downloadBlob(doc.output('blob'), `radar_leads_${stamp()}.pdf`);
}
