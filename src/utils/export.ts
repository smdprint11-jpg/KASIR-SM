import { jsPDF } from 'jspdf';

/**
 * Export helpers for Excel (CSV with UTF-8 BOM) and PDF printing
 */

export function downloadExcel(filename: string, headers: string[], rows: (string | number)[][], sheetTitle: string = 'Data Tabel'): void {
  // Generate HTML-based Excel spreadsheet (.xls) which Microsoft Excel opens natively with formatting
  const tableRows = rows
    .map(
      (row, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">` +
        row
          .map(
            cell =>
              `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; color: #1e293b;">${String(
                cell ?? ''
              ).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`
          )
          .join('') +
        '</tr>'
    )
    .join('');

  const tableHeaders = headers
    .map(
      h =>
        `<th style="border: 1px solid #1e3a8a; background-color: #1e3a8a; color: #ffffff; padding: 8px 10px; font-size: 11px; font-weight: bold; text-align: left;">${String(
          h
        ).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</th>`
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetTitle}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      <h2>${filename.replace(/_/g, ' ').toUpperCase()}</h2>
      <p style="font-size: 10px; color: #64748b;">Tanggal Unduh: ${new Date().toLocaleString('id-ID')}</p>
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  // Add UTF-8 BOM so Microsoft Excel renders Indonesian characters correctly
  const bom = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PdfExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  shopName?: string;
}

export function downloadPdfTable({
  filename,
  title,
  subtitle,
  headers,
  rows,
  shopName = 'SM DIGITAL PRINTING',
}: PdfExportOptions): void {
  const isLandscape = headers.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  // Header Zone
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, usableWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(shopName.toUpperCase(), margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(title, margin + 6, margin + 14);

  const dateStr = `Tanggal: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  doc.setFontSize(8);
  doc.text(dateStr, pageWidth - margin - 6, margin + 8, { align: 'right' });

  if (subtitle) {
    doc.text(subtitle, pageWidth - margin - 6, margin + 14, { align: 'right' });
  }

  // Calculate Column Widths
  const colCount = headers.length;
  const colWidth = usableWidth / colCount;

  let currentY = margin + 26;

  // Render Table Header
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(margin, currentY, usableWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  headers.forEach((h, i) => {
    const x = margin + i * colWidth + 2;
    doc.text(String(h), x, currentY + 5.5, { maxWidth: colWidth - 3 });
  });

  currentY += 8;

  // Render Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  rows.forEach((row, rowIdx) => {
    // Pagination check
    if (currentY > pageHeight - 18) {
      doc.addPage();
      currentY = margin + 10;

      // Re-draw header on new page
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, currentY, usableWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      headers.forEach((h, i) => {
        doc.text(String(h), margin + i * colWidth + 2, currentY + 5, { maxWidth: colWidth - 3 });
      });
      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    const isEven = rowIdx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, currentY, usableWidth, 7, 'F');

    // Bottom row line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY + 7, margin + usableWidth, currentY + 7);

    doc.setTextColor(30, 41, 59); // slate-800
    row.forEach((cell, i) => {
      const textVal = String(cell ?? '');
      const x = margin + i * colWidth + 2;
      doc.text(textVal, x, currentY + 4.8, { maxWidth: colWidth - 3 });
    });

    currentY += 7;
  });

  // Footer page number
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${totalPages} · Dokumen Resmi Sistem Kasir ${shopName}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

export function downloadJson(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint(): void {
  window.print();
}

/**
 * Replace placeholders in WhatsApp template:
 * [NAMA], [TOKO], [NOTA], [STATUS], [DETAIL_PRODUK], [TOTAL], [DP], [SISA], [LINK]
 */
export function buildWhatsAppMessage(
  template: string,
  params: {
    nama: string;
    toko: string;
    nota: string;
    status: string;
    detailProduk: string;
    total: string;
    dp: string;
    sisa: string;
    link: string;
  }
): string {
  let message = template;
  message = message.replace(/\[NAMA\]/g, params.nama);
  message = message.replace(/\[TOKO\]/g, params.toko);
  message = message.replace(/\[NOTA\]/g, params.nota);
  message = message.replace(/\[STATUS\]/g, params.status);
  message = message.replace(/\[DETAIL_PRODUK\]/g, params.detailProduk);
  message = message.replace(/\[TOTAL\]/g, params.total);
  message = message.replace(/\[DP\]/g, params.dp);
  message = message.replace(/\[SISA\]/g, params.sisa);
  message = message.replace(/\[LINK\]/g, params.link);
  return message;
}

export function openWhatsApp(phone: string, text: string): void {
  // Normalize phone number to international format (62 for Indonesia)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }
  const encodedText = encodeURIComponent(text);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(waUrl, '_blank');
}
