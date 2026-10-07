import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Edit3,
  Check,
  QrCode,
  FileText,
  Smartphone,
  Copy,
  Image as ImageIcon,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrintFormat, Transaction } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { generateQrMatrix, getQrSvgPath } from '../../utils/qrCode';
import { buildWhatsAppMessage, openWhatsApp, triggerPrint } from '../../utils/export';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings, showToast } = useApp();
  // Set default to A6 Portrait (Vertikal) as requested
  const [printFormat, setPrintFormat] = useState<PrintFormat>('a6_portrait');
  const [thermalNote, setThermalNote] = useState<string>(settings.thermalCustomNotes || '');
  const [isEditingThermal, setIsEditingThermal] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.thermalCustomNotes) {
      setThermalNote(settings.thermalCustomNotes);
    }
  }, [settings]);

  if (!transaction) return null;

  const trackingUrl = `${window.location.origin}/#track?nota=${transaction.invoiceNumber}`;
  const qrMatrix = generateQrMatrix(trackingUrl);
  const qrSvgPath = getQrSvgPath(qrMatrix, printFormat === 'thermal_58' ? 2.5 : 3.2);

  const handlePrint = () => {
    showToast('Membuka dialog cetak...', 'info');
    triggerPrint();
  };

  const handleShareWhatsApp = () => {
    const itemsList = transaction.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName}${it.width && it.length ? ` (${it.width}x${it.length}m)` : ''} - ${it.qty} ${it.unit} = ${formatRupiah(it.subtotal)}`
      )
      .join('\n');

    const msg = buildWhatsAppMessage(settings.waTemplate, {
      nama: transaction.customerName,
      toko: settings.shopName,
      nota: transaction.invoiceNumber,
      status: transaction.productionStatus.toUpperCase(),
      detailProduk: itemsList,
      total: formatRupiah(transaction.grandTotal),
      dp: formatRupiah(transaction.dpAmount),
      sisa: formatRupiah(transaction.remainingAmount),
      link: trackingUrl,
    });

    openWhatsApp(transaction.customerPhone, msg);
    showToast(`Membuka WhatsApp untuk mengirim nota ke ${transaction.customerName}...`, 'info');
  };

  // Helper to draw QR code on 2D canvas
  const drawQrCode = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const matrixLen = qrMatrix.length;
    const cellSize = size / matrixLen;
    ctx.fillStyle = '#000000';
    for (let r = 0; r < matrixLen; r++) {
      for (let c = 0; c < matrixLen; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(Math.round(x + c * cellSize), Math.round(y + r * cellSize), Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }
  };

  // Reusable Canvas Generator for Save JPG & WhatsApp Share image
  const renderReceiptCanvas = (fmt: PrintFormat): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (fmt === 'thermal_58') {
      // 1. THERMAL 58MM CANVAS RENDER (ARIAL BOLD - TANPA QR CODE SESUAI PERMINTAAN)
      const width = 380;
      const height = Math.max(540, 360 + transaction.items.length * 48);
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header - ARIAL BOLD
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 17px Arial, Helvetica, sans-serif';
      ctx.fillText(settings.shopName.toUpperCase(), width / 2, 35);
      ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
      ctx.fillText(settings.tagline, width / 2, 54);
      ctx.fillText(settings.address, width / 2, 70);
      ctx.fillText(`WA: ${settings.phone}`, width / 2, 86);

      // Dashed line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(15, 98);
      ctx.lineTo(width - 15, 98);
      ctx.stroke();

      // Info
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
      ctx.fillText(`NO. NOTA : ${transaction.invoiceNumber}`, 15, 120);
      ctx.fillText(`TANGGAL  : ${transaction.createdAt}`, 15, 138);
      ctx.fillText(`KASIR    : ${transaction.cashierName}`, 15, 156);
      ctx.fillText(`KLIEN    : ${transaction.customerName.toUpperCase()}`, 15, 174);
      ctx.fillText(`TELP/HP  : ${transaction.customerPhone}`, 15, 192);

      ctx.beginPath();
      ctx.moveTo(15, 204);
      ctx.lineTo(width - 15, 204);
      ctx.stroke();

      // Items
      let y = 224;
      transaction.items.forEach((it, idx) => {
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
        ctx.fillText(`${idx + 1}. ${it.productName}`, 15, y);
        y += 18;
        const dimStr = it.width && it.length ? `${it.width}x${it.length}m ` : '';
        ctx.fillText(`   ${dimStr}${it.qty} ${it.unit} x ${formatRupiah(it.pricePerUnit)}`, 15, y);
        ctx.textAlign = 'right';
        ctx.fillText(formatRupiah(it.subtotal), width - 15, y);
        y += 24;
      });

      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
      y += 22;

      // Totals
      ctx.setLineDash([]);
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
      ctx.fillText('SUBTOTAL:', 15, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatRupiah(transaction.subtotal), width - 15, y);
      y += 20;

      if (transaction.discount > 0) {
        ctx.textAlign = 'left';
        ctx.fillText('DISKON:', 15, y);
        ctx.textAlign = 'right';
        ctx.fillText(`-${formatRupiah(transaction.discount)}`, width - 15, y);
        y += 20;
      }

      ctx.textAlign = 'left';
      ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
      ctx.fillText('TOTAL AKHIR:', 15, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatRupiah(transaction.grandTotal), width - 15, y);
      y += 22;

      ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TELAH DIBAYAR:', 15, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatRupiah(transaction.dpAmount), width - 15, y);
      y += 20;

      ctx.textAlign = 'left';
      ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
      ctx.fillText('SISA TAGIHAN:', 15, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatRupiah(transaction.remainingAmount), width - 15, y);
      y += 24;

      // Footer divider (TANPA QR CODE untuk Thermal sesuai permintaan user)
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
      y += 22;

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
      ctx.fillText(thermalNote || settings.thermalCustomNotes || 'Barang yang sudah dicetak tidak dapat dibatalkan', width / 2, y);
      y += 20;
      ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
      ctx.fillText('*** TERIMA KASIH ***', width / 2, y);
    } else if (fmt === 'a6_landscape') {
      // 2. A6 HORIZONTAL (LANDSCAPE) CANVAS RENDER
      const width = 850;
      const height = 580;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Navy top border accent
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, 8);

      // Header
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(25, 25, 42, 42, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SM', 46, 53);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(settings.shopName.toUpperCase(), 78, 42);
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${settings.address} · WA: ${settings.phone}`, 78, 58);

      // Invoice header right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 15px "JetBrains Mono", monospace';
      ctx.fillText(transaction.invoiceNumber, width - 25, 42);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(transaction.createdAt, width - 25, 58);

      // Divider
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(25, 76);
      ctx.lineTo(width - 25, 76);
      ctx.stroke();

      // Left Column: Customer Box & QR
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(25, 90, 260, 110, 8);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('PELANGGAN:', 40, 110);
      ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(transaction.customerName, 40, 130);
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(transaction.customerPhone, 40, 148);
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#1d4ed8';
      ctx.fillText(`Tipe: ${transaction.customerType.toUpperCase()}`, 40, 168);

      // QR Code on Left
      drawQrCode(ctx, 40, 215, 80);
      ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('SCAN LACAK', 135, 245);
      ctx.font = '9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Cek progres nota di HP', 135, 262);

      // Right Column: Items Table
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(305, 90, width - 330, 26);
      ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('ITEM PESANAN', 315, 107);
      ctx.textAlign = 'center';
      ctx.fillText('QTY', width - 150, 107);
      ctx.textAlign = 'right';
      ctx.fillText('SUBTOTAL', width - 35, 107);

      let itemY = 135;
      transaction.items.forEach(it => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        const label = `${it.productName}${it.width && it.length ? ` (${it.width}x${it.length}m)` : ''}`;
        ctx.fillText(label.substring(0, 36), 315, itemY);
        ctx.textAlign = 'center';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(`${it.qty} ${it.unit}`, width - 150, itemY);
        ctx.textAlign = 'right';
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.fillText(formatRupiah(it.subtotal), width - 35, itemY);
        itemY += 26;
      });

      // Totals Box
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(305, itemY + 10);
      ctx.lineTo(width - 25, itemY + 10);
      ctx.stroke();

      let totY = itemY + 30;
      ctx.textAlign = 'right';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('TOTAL AKHIR:', width - 140, totY);
      ctx.font = '900 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(formatRupiah(transaction.grandTotal), width - 35, totY);

      totY += 20;
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#15803d';
      ctx.fillText('DP / TELAH BAYAR:', width - 140, totY);
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.fillText(formatRupiah(transaction.dpAmount), width - 35, totY);

      totY += 22;
      ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = transaction.remainingAmount > 0 ? '#dc2626' : '#16a34a';
      ctx.fillText('SISA TAGIHAN:', width - 140, totY);
      ctx.font = '900 14px "JetBrains Mono", monospace';
      ctx.fillText(formatRupiah(transaction.remainingAmount), width - 35, totY);

      // Signatures
      ctx.textAlign = 'left';
      ctx.font = 'italic 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('*Nota resmi SM Digital Printing. Pengambilan barang wajib bawa nota.', 25, height - 20);
      ctx.textAlign = 'right';
      ctx.fillText(`Kasir: ${transaction.cashierName}`, width - 25, height - 20);
    } else {
      // 3. A6 VERTIKAL (PORTRAIT) / A5 STANDAR CANVAS RENDER
      const width = 640;
      const height = Math.max(900, 680 + transaction.items.length * 40);
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header card
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(30, 30, 48, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SM', 54, 62);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(settings.shopName.toUpperCase(), 90, 50);
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(settings.tagline, 90, 68);
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${settings.address} · WA: ${settings.phone}`, 90, 84);

      // Badge top right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(width - 150, 32, 120, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(printFormat === 'a6_portrait' ? 'NOTA A6 VERTIKAL' : 'NOTA RESMI A5', width - 90, 48);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 15px "JetBrains Mono", monospace';
      ctx.fillText(transaction.invoiceNumber, width - 30, 75);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(transaction.createdAt, width - 30, 92);

      // Divider
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 105);
      ctx.lineTo(width - 30, 105);
      ctx.stroke();

      // Customer Meta Box
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(30, 118, width - 60, 60, 10);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('PELANGGAN:', 45, 138);
      ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${transaction.customerName} (${transaction.customerPhone})`, 45, 156);

      ctx.textAlign = 'right';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('STATUS & KASIR:', width - 45, 138);
      ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = transaction.paymentStatus === 'lunas' ? '#16a34a' : '#e11d48';
      ctx.fillText(`[${transaction.paymentStatus.toUpperCase()}] · Kasir: ${transaction.cashierName}`, width - 45, 156);

      // Items Table
      let tableY = 195;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(30, tableY, width - 60, 28);
      ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'left';
      ctx.fillText('ITEM PESANAN', 45, tableY + 18);
      ctx.textAlign = 'center';
      ctx.fillText('QTY', width - 180, tableY + 18);
      ctx.textAlign = 'right';
      ctx.fillText('SUBTOTAL', width - 45, tableY + 18);
      tableY += 38;

      transaction.items.forEach(it => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
        const label = `${it.productName}${it.width && it.length ? ` (${it.width}x${it.length}m)` : ''}`;
        ctx.fillText(label.substring(0, 42), 45, tableY);
        if (it.notes) {
          ctx.font = 'italic 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#2563eb';
          ctx.fillText(`* ${it.notes}`, 45, tableY + 14);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`${it.qty} ${it.unit}`, width - 180, tableY);

        ctx.textAlign = 'right';
        ctx.font = '800 12px "JetBrains Mono", monospace';
        ctx.fillText(formatRupiah(it.subtotal), width - 45, tableY);
        tableY += it.notes ? 38 : 30;
      });

      // Bottom Section: QR Tracking and Totals
      tableY += 15;
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(30, tableY);
      ctx.lineTo(width - 30, tableY);
      ctx.stroke();
      tableY += 20;

      // QR Code Left
      drawQrCode(ctx, 45, tableY, 75);
      ctx.textAlign = 'left';
      ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('SCAN PELACAKAN QR', 135, tableY + 28);
      ctx.font = '9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Cek progres pengerjaan pesanan online', 135, tableY + 44);

      // Totals Right
      ctx.textAlign = 'right';
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Grand Total:', width - 150, tableY + 15);
      ctx.font = '900 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(formatRupiah(transaction.grandTotal), width - 45, tableY + 15);

      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#16a34a';
      ctx.fillText('Telah Dibayar (DP):', width - 150, tableY + 38);
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.fillText(formatRupiah(transaction.dpAmount), width - 45, tableY + 38);

      ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = transaction.remainingAmount > 0 ? '#dc2626' : '#16a34a';
      ctx.fillText('Sisa Tagihan:', width - 150, tableY + 62);
      ctx.font = '900 16px "JetBrains Mono", monospace';
      ctx.fillText(formatRupiah(transaction.remainingAmount), width - 45, tableY + 62);

      // Signatures
      tableY += 105;
      ctx.textAlign = 'center';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Pelanggan,', 100, tableY);
      ctx.fillText('Kasir Petugas,', width - 100, tableY);

      tableY += 45;
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(50, tableY);
      ctx.lineTo(150, tableY);
      ctx.moveTo(width - 150, tableY);
      ctx.lineTo(width - 50, tableY);
      ctx.stroke();

      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(transaction.customerName.substring(0, 16), 100, tableY + 15);
      ctx.fillText(transaction.cashierName, width - 100, tableY + 15);
    }

    return canvas;
  };

  const handleSaveJpg = () => {
    const canvas = renderReceiptCanvas(printFormat);
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = `NOTA_${printFormat.toUpperCase()}_${transaction.invoiceNumber}_${transaction.customerName.replace(/\s+/g, '_')}.jpg`;
    a.click();
    showToast(`Nota JPG (${printFormat.toUpperCase()}) berhasil diunduh sesuai ukuran nota!`, 'success');
  };

  const handleSavePdf = () => {
    const canvas = renderReceiptCanvas(printFormat);
    if (!canvas) {
      triggerPrint();
      return;
    }

    try {
      let orientation: 'portrait' | 'landscape' = 'portrait';
      let formatWidthMm = 105;
      let formatHeightMm = 148;

      if (printFormat === 'a6_portrait') {
        orientation = 'portrait';
        formatWidthMm = 105;
        formatHeightMm = 148;
      } else if (printFormat === 'a6_landscape') {
        orientation = 'landscape';
        formatWidthMm = 148;
        formatHeightMm = 105;
      } else if (printFormat === 'thermal_58') {
        orientation = 'portrait';
        formatWidthMm = 58;
        formatHeightMm = Math.max(120, (58 * canvas.height) / canvas.width);
      } else if (printFormat === 'a5_landscape') {
        orientation = 'landscape';
        formatWidthMm = 210;
        formatHeightMm = 148;
      } else {
        orientation = 'portrait';
        formatWidthMm = 148;
        formatHeightMm = 210;
      }

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [formatWidthMm, formatHeightMm],
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, formatWidthMm, formatHeightMm);
      pdf.save(`NOTA_${printFormat.toUpperCase()}_${transaction.invoiceNumber}_${transaction.customerName.replace(/\s+/g, '_')}.pdf`);
      showToast(`Nota PDF (${printFormat.toUpperCase()}) berhasil diunduh langsung!`, 'success');
    } catch {
      triggerPrint();
    }
  };

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waImageUrl, setWaImageUrl] = useState<string | null>(null);
  const [waImageBlob, setWaImageBlob] = useState<Blob | null>(null);

  const handleOpenWaModal = () => {
    const canvas = renderReceiptCanvas(printFormat);
    if (canvas) {
      setWaImageUrl(canvas.toDataURL('image/jpeg', 0.95));
      canvas.toBlob(blob => {
        setWaImageBlob(blob);
      }, 'image/jpeg', 0.95);
    }
    setIsWaModalOpen(true);
  };

  const handleCopyWaImage = () => {
    const canvas = renderReceiptCanvas(printFormat);
    if (!canvas) return;
    canvas.toBlob(async blob => {
      if (blob && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('✅ Gambar nota berhasil disalin ke clipboard! Tekan Ctrl+V di chat WhatsApp.', 'success');
        } catch {
          showToast('Silakan unduh gambar nota lalu lampirkan ke WhatsApp.', 'info');
        }
      }
    }, 'image/png');
  };

  const handleDownloadWaImage = () => {
    if (!waImageUrl) return;
    const a = document.createElement('a');
    a.href = waImageUrl;
    a.download = `NOTA_${transaction.invoiceNumber}_${transaction.customerName.replace(/\s+/g, '_')}.jpg`;
    a.click();
    showToast('Gambar nota berhasil diunduh! Siap dilampirkan ke WhatsApp.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Ukuran Nota:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'a6_portrait', label: '📄 A6 Vertikal (105x148)' },
                { id: 'a6_landscape', label: '📑 A6 Horizontal (148x105)' },
                { id: 'thermal_58', label: '🧾 Thermal 58mm (Tebal)' },
                { id: 'a5_landscape', label: 'A5 Horizontal' },
                { id: 'a5_portrait', label: 'A5 Vertikal' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setPrintFormat(f.id as PrintFormat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    printFormat === f.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition"
              title="Print langsung ke printer kertas atau struk"
            >
              <Printer className="h-4 w-4" />
              <span>Print Nota</span>
            </button>

            <button
              onClick={handleSavePdf}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 transition"
              title="Simpan sebagai dokumen PDF"
            >
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Save PDF</span>
            </button>

            <button
              onClick={handleSaveJpg}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Unduh gambar JPG nota beresolusi tinggi"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Save JPG</span>
            </button>

            <button
              onClick={handleOpenWaModal}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              title="Kirim rincian nota & gambar nota langsung ke WhatsApp pelanggan"
            >
              <Share2 className="h-4 w-4" />
              <span>Kirim WA</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thermal Note Quick Edit Banner */}
        {printFormat === 'thermal_58' && (
          <div className="no-print flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Edit3 className="h-3.5 w-3.5" />
              <span className="font-semibold">Catatan Footer Struk Thermal 58mm:</span>
            </div>
            <button
              onClick={() => setIsEditingThermal(!isEditingThermal)}
              className="font-bold underline"
            >
              {isEditingThermal ? 'Tutup Edit' : 'Edit Teks Struk'}
            </button>
          </div>
        )}

        {isEditingThermal && printFormat === 'thermal_58' && (
          <div className="no-print border-b border-slate-200 p-4 dark:border-slate-800">
            <textarea
              value={thermalNote}
              onChange={e => setThermalNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}

        {/* Paper Container Viewport */}
        <div className="flex-1 overflow-y-auto bg-slate-200/60 p-4 sm:p-8 dark:bg-slate-950/70">
          <div className="mx-auto flex justify-center">
            {/* 1. THERMAL 58MM - ARIAL BOLD & TANPA QR CODE (Sesuai Permintaan) */}
            {printFormat === 'thermal_58' && (
              <div
                ref={receiptRef}
                className="print-area print-thermal-58 w-[340px] rounded-lg border-2 border-black bg-white p-4 shadow-xl text-black"
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '1.25',
                }}
              >
                {/* Header */}
                <div className="text-center">
                  {settings.showReceiptLogo !== false && (settings.receiptLogoUrl || settings.logoUrl) && (
                    <img
                      src={settings.receiptLogoUrl || settings.logoUrl}
                      alt="Logo Nota"
                      className="h-9 max-w-[120px] mx-auto object-contain mb-1.5 filter grayscale contrast-200"
                    />
                  )}
                  <h2 className="text-base font-black tracking-wider uppercase" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {settings.shopName}
                  </h2>
                  <p className="text-[10px] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>{settings.tagline}</p>
                  <p className="text-[10px] font-bold mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>{settings.address}</p>
                  <p className="text-[10px] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>WA: {settings.phone}</p>
                  <div className="my-2 border-b-2 border-dashed border-black"></div>
                </div>

                {/* Nota Info */}
                <div className="space-y-0.5 text-[11px] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="flex justify-between">
                    <span>NO. NOTA:</span>
                    <span className="font-black text-xs">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TANGGAL :</span>
                    <span>{transaction.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KASIR   :</span>
                    <span>{transaction.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KLIEN   :</span>
                    <span className="truncate max-w-[170px] uppercase font-black">{transaction.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TELP/HP :</span>
                    <span>{transaction.customerPhone}</span>
                  </div>
                  <div className="my-2 border-b-2 border-dashed border-black"></div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-[11px] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-black text-[11px]">
                        {idx + 1}. {item.productName}
                      </div>
                      <div className="flex justify-between pl-2 font-bold">
                        <span>
                          {item.width && item.length ? `${item.width}x${item.length}m ` : ''}
                          {item.qty} {item.unit} x {formatRupiah(item.pricePerUnit)}
                        </span>
                        <span className="font-black text-[11px]">{formatRupiah(item.subtotal)}</span>
                      </div>
                      {item.notes && (
                        <div className="pl-2 text-[9px] font-bold italic">* {item.notes}</div>
                      )}
                    </div>
                  ))}
                  <div className="my-2 border-b-2 border-dashed border-black"></div>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between">
                      <span>DISKON:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  {transaction.rounding !== 0 && (
                    <div className="flex justify-between">
                      <span>PEMBULATAN:</span>
                      <span>{formatRupiah(transaction.rounding)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1 border-t-2 border-black">
                    <span>TOTAL AKHIR:</span>
                    <span className="text-sm font-black">{formatRupiah(transaction.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>TELAH DIBAYAR:</span>
                    <span>{formatRupiah(transaction.dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-0.5 border-t border-black">
                    <span>SISA TAGIHAN:</span>
                    <span className="text-sm font-black">{formatRupiah(transaction.remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1 uppercase">
                    <span>STATUS:</span>
                    <span className="font-black">[{transaction.paymentStatus}]</span>
                  </div>
                </div>

                {/* Footer Note - TANPA QR CODE SESUAI PERMINTAAN */}
                <div className="mt-3 border-t-2 border-dashed border-black pt-2 text-center text-[10px] font-bold leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <p>{thermalNote || settings.thermalCustomNotes || 'Barang yang sudah dicetak tidak dapat dibatalkan.'}</p>
                  <p className="mt-1 font-black text-xs">*** TERIMA KASIH ***</p>
                </div>
              </div>
            )}

            {/* 2. A6 VERTIKAL (PORTRAIT: 105mm x 148mm) - Primary choice requested */}
            {printFormat === 'a6_portrait' && (
              <div
                ref={receiptRef}
                className="print-area print-a6-portrait w-[420px] rounded-xl border border-slate-300 bg-white p-5 shadow-xl text-slate-900"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    {settings.showReceiptLogo !== false && (settings.receiptLogoUrl || settings.logoUrl) ? (
                      <img
                        src={settings.receiptLogoUrl || settings.logoUrl}
                        alt="Logo Nota"
                        className="h-10 w-10 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white font-black text-lg">
                        SM
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                        {settings.shopName}
                      </h3>
                      <p className="text-[10px] text-slate-600 leading-tight">{settings.tagline}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{settings.address}</p>
                      <p className="text-[9px] text-slate-500 font-mono">WA: {settings.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      NOTA A6
                    </span>
                    <p className="mt-1 font-mono text-xs font-black text-blue-900">
                      {transaction.invoiceNumber}
                    </p>
                    <p className="text-[9px] text-slate-500">{transaction.createdAt}</p>
                  </div>
                </div>

                {/* Customer Meta */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Pelanggan:</span>
                    <span className="font-bold text-slate-900 block">{transaction.customerName}</span>
                    <span className="font-mono text-slate-600 block">{transaction.customerPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-semibold">Status / Kasir:</span>
                    <span
                      className={`font-black uppercase inline-block rounded px-1.5 py-0.2 text-[9px] ${
                        transaction.paymentStatus === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {transaction.paymentStatus}
                    </span>
                    <span className="block text-slate-500 mt-0.5">Kasir: {transaction.cashierName}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mt-2.5 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 font-bold uppercase text-slate-600">
                      <tr>
                        <th className="py-1.5 px-2">Item</th>
                        <th className="py-1.5 px-1.5 text-center">Qty</th>
                        <th className="py-1.5 px-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2">
                            <span className="font-bold text-slate-900 block">{item.productName}</span>
                            {item.width && item.length && (
                              <span className="text-[9px] text-slate-500 block">
                                {item.width}x{item.length}m ({item.areaM2}m²)
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[8px] text-blue-700 italic block">
                                * {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-bold">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & QR Code */}
                <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-2 text-[10px]">
                  {/* QR Tracking */}
                  <div className="flex items-center gap-2">
                    <svg
                      width="58"
                      height="58"
                      viewBox={`0 0 ${qrMatrix.length * 3.2} ${qrMatrix.length * 3.2}`}
                      className="shape-rendering-crispEdges"
                    >
                      <path d={qrSvgPath} fill="#000" />
                    </svg>
                    <div className="text-[8px] text-slate-500 leading-tight">
                      <p className="font-bold text-slate-800">Scan Lacak</p>
                      <p>Cek progres cetak pesanan online</p>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-0.5 text-right font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total:</span>
                      <span className="font-mono font-bold">{formatRupiah(transaction.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>DP/Bayar:</span>
                      <span className="font-mono">{formatRupiah(transaction.dpAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-0.5 text-rose-600 font-black text-[11px]">
                      <span>Sisa:</span>
                      <span className="font-mono">{formatRupiah(transaction.remainingAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-5 flex justify-between text-center text-[9px] text-slate-600">
                  <div className="w-24">
                    <p>Pelanggan,</p>
                    <div className="mt-7 border-b border-slate-300"></div>
                    <p className="mt-0.5 truncate">{transaction.customerName}</p>
                  </div>
                  <div className="w-24">
                    <p>Kasir,</p>
                    <div className="mt-7 border-b border-slate-300"></div>
                    <p className="mt-0.5 truncate">{transaction.cashierName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. A6 HORIZONTAL (LANDSCAPE: 148mm x 105mm) - Primary choice requested */}
            {printFormat === 'a6_landscape' && (
              <div
                ref={receiptRef}
                className="print-area print-a6-landscape w-full max-w-[620px] rounded-xl border border-slate-300 bg-white p-4 sm:p-5 shadow-xl text-slate-900"
              >
                {/* Horizontal Header with Service Type & Logo */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    {settings.showReceiptLogo !== false && (settings.receiptLogoUrl || settings.logoUrl) ? (
                      <img
                        src={settings.receiptLogoUrl || settings.logoUrl}
                        alt="Logo Nota"
                        className="h-9 w-9 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white font-black text-sm">
                        SM
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase text-slate-900 leading-tight">
                          {settings.shopName}
                        </h3>
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[8px] font-black uppercase text-blue-900 border border-blue-300">
                          Layanan: Digital Printing & Reklame
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {settings.address} · WA: {settings.phone}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-blue-900 block">
                      {transaction.invoiceNumber}
                    </span>
                    <span className="text-[9px] text-slate-400 block">{transaction.createdAt}</span>
                  </div>
                </div>

                {/* 2-Column Body */}
                <div className="mt-2.5 grid grid-cols-12 gap-3 text-[10px]">
                  {/* Left: Customer & QR */}
                  <div className="col-span-5 border-r border-slate-200 pr-2 space-y-2">
                    <div className="rounded bg-slate-50 p-2">
                      <span className="text-slate-400 text-[8px] block uppercase font-bold">
                        Pelanggan:
                      </span>
                      <p className="font-bold text-slate-900 text-[11px] truncate">
                        {transaction.customerName}
                      </p>
                      <p className="font-mono text-[9px] text-slate-600">{transaction.customerPhone}</p>
                      <p className="text-[9px] font-bold text-blue-700 uppercase mt-0.5">
                        Tipe: {transaction.customerType}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        width="50"
                        height="50"
                        viewBox={`0 0 ${qrMatrix.length * 3.2} ${qrMatrix.length * 3.2}`}
                        className="shape-rendering-crispEdges shrink-0"
                      >
                        <path d={qrSvgPath} fill="#000" />
                      </svg>
                      <div className="text-[8px] text-slate-500 leading-tight">
                        <p className="font-bold text-slate-800">Scan Lacak</p>
                        <p>Cek status nota di HP</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Items & Totals */}
                  <div className="col-span-7 flex flex-col justify-between">
                    <div className="max-h-28 overflow-y-auto">
                      <table className="w-full text-left text-[9px]">
                        <thead className="bg-slate-100 font-bold uppercase text-slate-600 sticky top-0">
                          <tr>
                            <th className="py-1 px-1">Item</th>
                            <th className="py-1 px-1 text-center">Qty</th>
                            <th className="py-1 px-1 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {transaction.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-1 px-1 truncate max-w-[120px]">
                                <span className="font-bold text-slate-900 block">{it.productName}</span>
                                {it.notes && (
                                  <span className="text-[8px] text-blue-700 italic block">
                                    {it.notes}
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1 text-center font-mono">
                                {it.qty} {it.unit}
                              </td>
                              <td className="py-1 px-1 text-right font-mono font-bold">
                                {formatRupiah(it.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Bar */}
                    <div className="border-t border-slate-200 pt-1.5 space-y-0.5 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="font-mono">{formatRupiah(transaction.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>DP / Bayar:</span>
                        <span className="font-mono">{formatRupiah(transaction.dpAmount)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-black text-[11px] border-t border-slate-200 pt-0.5">
                        <span>Sisa:</span>
                        <span className="font-mono">{formatRupiah(transaction.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer notes & signatures */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[8px] text-slate-500">
                  <p>*Nota resmi sah. Pengambilan barang wajib membawa nota ini.</p>
                  <p>Kasir: {transaction.cashierName}</p>
                </div>
              </div>
            )}

            {/* 4. A5 LANDSCAPE & A5 PORTRAIT FALLBACKS */}
            {(printFormat === 'a5_landscape' || printFormat === 'a5_portrait') && (
              <div
                ref={receiptRef}
                className={`print-area bg-white p-6 sm:p-8 text-slate-900 shadow-md border border-slate-200 transition ${
                  printFormat === 'a5_landscape'
                    ? 'w-full max-w-[760px] print-a5-landscape'
                    : 'w-full max-w-[560px] print-a5-portrait'
                }`}
              >
                <div className="flex justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white font-extrabold text-xl">
                      SM
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 uppercase">
                        {settings.shopName}
                      </h2>
                      <p className="text-xs text-slate-600">{settings.tagline}</p>
                      <p className="text-[11px] text-slate-500">{settings.address} · WA: {settings.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-blue-900 block">
                      {transaction.invoiceNumber}
                    </span>
                    <span className="text-xs text-slate-500">{transaction.createdAt}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs grid grid-cols-2">
                  <div>
                    <span className="text-slate-400 block">Pelanggan:</span>
                    <span className="font-bold text-slate-900 text-sm">{transaction.customerName}</span>
                    <span className="font-mono text-slate-600 block">{transaction.customerPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Status:</span>
                    <span className="font-bold uppercase text-blue-700">
                      {transaction.paymentStatus} ({transaction.productionStatus})
                    </span>
                    <span className="block text-slate-500">Kasir: {transaction.cashierName}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Item Pesanan</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Harga</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaction.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block">{it.productName}</span>
                            {it.notes && (
                              <span className="text-[11px] text-blue-600 italic block">
                                * {it.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {it.qty} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatRupiah(it.pricePerUnit)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-3">
                    <svg
                      width="65"
                      height="65"
                      viewBox={`0 0 ${qrMatrix.length * 3.2} ${qrMatrix.length * 3.2}`}
                      className="shape-rendering-crispEdges"
                    >
                      <path d={qrSvgPath} fill="#000" />
                    </svg>
                    <span className="text-[10px] text-slate-500">Scan QR untuk pelacakan online</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>Total: <span className="font-mono font-bold text-sm">{formatRupiah(transaction.grandTotal)}</span></div>
                    <div>DP: <span className="font-mono font-bold text-emerald-700">{formatRupiah(transaction.dpAmount)}</span></div>
                    <div className="text-rose-600 font-bold text-sm">Sisa: <span className="font-mono">{formatRupiah(transaction.remainingAmount)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHATSAPP SHARE MODAL WITH RECEIPT IMAGE (Sesuai Permintaan) */}
      {isWaModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
          <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Kirim Nota & Gambar via WhatsApp
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kirim ke: {transaction.customerName} ({transaction.customerPhone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Guidance Banner */}
              <div className="rounded-2xl border border-emerald-800/80 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>Gambar Nota Otomatis Disiapkan!</span>
                </p>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  Format gambar mengikuti ukuran nota yang Anda pilih (<b>{printFormat.toUpperCase()}</b>). Tekan <b>Salin Gambar</b> lalu tempelkan (Ctrl+V) di chat WhatsApp, atau unduh gambar untuk dilampirkan.
                </p>
              </div>

              {/* Nota Image Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Pratinjau Gambar Nota:</span>
                  <span className="text-[10px] text-slate-400 font-mono">Format: {printFormat.toUpperCase()}</span>
                </label>
                <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-3 flex justify-center max-h-64 overflow-y-auto">
                  {waImageUrl ? (
                    <img
                      src={waImageUrl}
                      alt="Pratinjau Gambar Nota"
                      className="rounded-lg max-h-56 object-contain shadow-lg border border-slate-800"
                    />
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500">
                      Memuat gambar nota...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Image */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyWaImage}
                  className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-900/60 transition shadow-sm"
                >
                  <Copy className="h-4 w-4 text-cyan-400" />
                  <span>Salin Gambar (Ctrl+V)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWaImage}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-sm"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Unduh File Gambar</span>
                </button>
              </div>

              {/* WhatsApp Text Preview */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Isi Pesan Teks WhatsApp:
                </span>
                <p className="font-mono text-[11px] text-slate-300 whitespace-pre-line bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 max-h-28 overflow-y-auto">
                  {buildWhatsAppMessage(settings.waTemplate, {
                    nama: transaction.customerName,
                    toko: settings.shopName,
                    nota: transaction.invoiceNumber,
                    status: transaction.productionStatus.toUpperCase(),
                    detailProduk: transaction.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', '),
                    total: formatRupiah(transaction.grandTotal),
                    dp: formatRupiah(transaction.dpAmount),
                    sisa: formatRupiah(transaction.remainingAmount),
                    link: trackingUrl,
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-900/90">
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  handleShareWhatsApp();
                  setIsWaModalOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
              >
                <Share2 className="h-4 w-4" />
                <span>Buka WhatsApp & Kirim Pesan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
