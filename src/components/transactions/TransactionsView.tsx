import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  CreditCard,
  DollarSign,
  Check,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentStatus, ProductionStatus, Transaction } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { downloadExcel, downloadPdfTable, openWhatsApp, triggerPrint, buildWhatsAppMessage } from '../../utils/export';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    setSelectedReceiptTransaction,
    updateTransaction,
    updateProductionStatus,
    settlePayment,
    deleteTransaction,
    settings,
    showToast,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterProduction, setFilterProduction] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');

  // Detail Modal State
  const [selectedDetailTrx, setSelectedDetailTrx] = useState<Transaction | null>(null);

  // Settle Payment Modal State
  const [settleModalTrx, setSettleModalTrx] = useState<Transaction | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<string>('tunai');
  const [settleNote, setSettleNote] = useState<string>('Pelunasan di kasir');

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      const matchSearch =
        trx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.customerPhone.includes(searchQuery);

      const matchPayment = filterPayment === 'all' || trx.paymentStatus === filterPayment;
      const matchProduction = filterProduction === 'all' || trx.productionStatus === filterProduction;
      const matchCustomer = filterCustomer === 'all' || trx.customerName === filterCustomer;

      return matchSearch && matchPayment && matchProduction && matchCustomer;
    });
  }, [transactions, searchQuery, filterPayment, filterProduction, filterCustomer]);

  // Unique customer names for filter
  const uniqueCustomerNames = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.customerName)));
  }, [transactions]);

  // Production status options & badge colors
  const statusConfig: Record<
    ProductionStatus,
    { label: string; badgeClass: string; dotClass: string }
  > = {
    antrean: {
      label: 'Antrean',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dotClass: 'bg-slate-400',
    },
    desain: {
      label: 'Setting/Desain',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      dotClass: 'bg-indigo-500',
    },
    cetak: {
      label: 'Sedang Cetak',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700',
      dotClass: 'bg-blue-500 animate-ping',
    },
    finishing: {
      label: 'Finishing',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      dotClass: 'bg-amber-500',
    },
    siap_ambil: {
      label: 'Siap Ambil',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
      dotClass: 'bg-purple-500',
    },
    selesai: {
      label: 'Selesai',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      dotClass: 'bg-emerald-500',
    },
  };

  // Status sequence for scroll / step navigation (up & down)
  const statusSequence: ProductionStatus[] = [
    'antrean',
    'desain',
    'cetak',
    'finishing',
    'siap_ambil',
    'selesai',
  ];

  const handleStepStatus = (trx: Transaction, direction: 'up' | 'down') => {
    const curIdx = statusSequence.indexOf(trx.productionStatus);
    let nextIdx = curIdx;
    if (direction === 'down') {
      // scroll ke bawah / maju ke tahapan berikutnya
      nextIdx = Math.min(statusSequence.length - 1, curIdx + 1);
    } else {
      // scroll ke atas / mundur ke tahapan sebelumnya
      nextIdx = Math.max(0, curIdx - 1);
    }
    const targetStatus = statusSequence[nextIdx];
    if (targetStatus !== trx.productionStatus) {
      updateProductionStatus(trx.id, targetStatus, `Diubah ke ${statusConfig[targetStatus].label}`);
      showToast(`Status nota ${trx.invoiceNumber} diubah ke ${statusConfig[targetStatus].label}!`, 'success');
    }
  };

  const handleSetQuickStatus = (trx: Transaction, targetStatus: ProductionStatus) => {
    if (trx.productionStatus !== targetStatus) {
      updateProductionStatus(trx.id, targetStatus, `Diubah cepat ke ${statusConfig[targetStatus].label}`);
      showToast(`Status nota ${trx.invoiceNumber} menjadi ${statusConfig[targetStatus].label}!`, 'success');
    }
  };

  const handlePaymentStatusChange = (trx: Transaction, newStatus: PaymentStatus) => {
    if (newStatus === trx.paymentStatus) return;
    if (newStatus === 'lunas') {
      updateTransaction(trx.id, {
        paymentStatus: 'lunas',
        remainingAmount: 0,
        dpAmount: trx.grandTotal,
        paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      showToast(`Status pembayaran nota ${trx.invoiceNumber} diubah ke LUNAS!`, 'success');
    } else if (newStatus === 'dp') {
      openSettleModal(trx);
    } else {
      updateTransaction(trx.id, {
        paymentStatus: 'belum_lunas',
        remainingAmount: trx.grandTotal,
        dpAmount: 0,
      });
      showToast(`Status pembayaran nota ${trx.invoiceNumber} diubah ke BELUM LUNAS!`, 'info');
    }
  };

  const handleProductionStatusChange = (trx: Transaction, newStatus: ProductionStatus) => {
    if (newStatus === trx.productionStatus) return;
    updateProductionStatus(trx.id, newStatus, `Diubah ke ${statusConfig[newStatus].label}`);
    showToast(`Status produksi nota ${trx.invoiceNumber} diubah ke ${statusConfig[newStatus].label}!`, 'success');
  };

  // Export to Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      'No. Nota',
      'Tanggal',
      'Nama Pelanggan',
      'No. Telepon',
      'Tipe Pelanggan',
      'Rincian Item',
      'Total Akhir (Rp)',
      'DP / Terbayar (Rp)',
      'Sisa Tagihan (Rp)',
      'Status Bayar',
      'Status Produksi',
      'Kasir',
    ];

    const rows = filteredTransactions.map(t => [
      t.invoiceNumber,
      t.createdAt,
      t.customerName,
      t.customerPhone,
      t.customerType.toUpperCase(),
      t.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join('; '),
      formatRupiah(t.grandTotal),
      formatRupiah(t.dpAmount),
      formatRupiah(t.remainingAmount),
      t.paymentStatus.toUpperCase(),
      t.productionStatus.toUpperCase(),
      t.cashierName,
    ]);

    downloadExcel(`Laporan_Transaksi_${new Date().toISOString().split('T')[0]}`, headers, rows, 'Data Transaksi');
    showToast('Laporan transaksi berhasil diexport ke format Excel!', 'success');
  };

  // Export to PDF Document (.pdf)
  const handleExportPdf = () => {
    const headers = [
      'No. Nota',
      'Tanggal',
      'Pelanggan',
      'Item Pesanan',
      'Total (Rp)',
      'Terbayar (Rp)',
      'Sisa (Rp)',
      'Status Bayar',
      'Produksi',
    ];

    const rows = filteredTransactions.map(t => [
      t.invoiceNumber,
      t.createdAt.split(' ')[0],
      t.customerName.substring(0, 15),
      t.items.map(i => `${i.qty} ${i.productName}`).join(', ').substring(0, 25),
      formatRupiah(t.grandTotal),
      formatRupiah(t.dpAmount),
      formatRupiah(t.remainingAmount),
      t.paymentStatus.toUpperCase(),
      t.productionStatus.toUpperCase(),
    ]);

    downloadPdfTable({
      filename: `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKAP DATA TRANSAKSI & NOTA',
      subtitle: `Total: ${filteredTransactions.length} Transaksi · Periode Aktif`,
      headers,
      rows,
      shopName: settings.shopName || 'SM DIGITAL PRINTING',
    });
    showToast('Dokumen PDF data transaksi berhasil diunduh!', 'success');
  };

  // WhatsApp quick share
  const handleShareWhatsApp = (trx: Transaction) => {
    const itemsList = trx.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName}${it.width && it.length ? ` (${it.width}x${it.length}m)` : ''} - ${it.qty} ${it.unit} = ${formatRupiah(it.subtotal)}`
      )
      .join('\n');

    const trackingUrl = `${window.location.origin}/#track?nota=${trx.invoiceNumber}`;
    const msg = buildWhatsAppMessage(settings.waTemplate, {
      nama: trx.customerName,
      toko: settings.shopName,
      nota: trx.invoiceNumber,
      status: trx.productionStatus.toUpperCase(),
      detailProduk: itemsList,
      total: formatRupiah(trx.grandTotal),
      dp: formatRupiah(trx.dpAmount),
      sisa: formatRupiah(trx.remainingAmount),
      link: trackingUrl,
    });

    openWhatsApp(trx.customerPhone, msg);
    showToast(`Membuka WhatsApp untuk mengirim nota ke ${trx.customerName}...`, 'info');
  };

  // Open settle modal
  const openSettleModal = (trx: Transaction) => {
    setSettleModalTrx(trx);
    setSettleAmount(trx.remainingAmount);
    setSettleMethod('tunai');
    setSettleNote('Pelunasan di kasir');
  };

  const handleConfirmSettle = () => {
    if (!settleModalTrx) return;
    settlePayment(settleModalTrx.id, settleAmount, settleMethod, settleNote);
    showToast(`Pelunasan nota ${settleModalTrx.invoiceNumber} sebesar ${formatRupiah(settleAmount)} berhasil dicatat!`, 'success');
    setSettleModalTrx(null);
  };

  return (
    <div className="space-y-5">
      {/* Search & Top Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari No. Nota (SM-202610-...), Nama Klien, atau No Telepon..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Menu Export Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm"
              >
                <Download className="h-4 w-4 text-emerald-600" />
                <span>Menu Export</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 group-hover:block z-30">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Export File Excel (.xls)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                >
                  <FileText className="h-4 w-4 text-rose-600" />
                  <span>Export Dokumen PDF (.pdf)</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              title="Cetak atau Unduh Dokumen PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak PDF Ringkasan</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns with Visual Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Bayar */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Status Pembayaran:
            </label>
            <select
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Jenis Status Pembayaran</option>
              <option value="lunas">🟢 Lunas Selesai</option>
              <option value="dp">🟡 Uang Muka (DP)</option>
              <option value="belum_lunas">🔴 Belum Lunas (Tempo)</option>
            </select>
          </div>

          {/* Status Produksi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Status Pengerjaan Produksi:
            </label>
            <select
              value={filterProduction}
              onChange={e => setFilterProduction(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Status Produksi</option>
              <option value="antrean">1. Antrean</option>
              <option value="desain">2. Setting / Desain</option>
              <option value="cetak">3. Sedang Cetak</option>
              <option value="finishing">4. Finishing</option>
              <option value="siap_ambil">5. Siap Ambil</option>
              <option value="selesai">6. Selesai</option>
            </select>
          </div>

          {/* Pelanggan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Filter Nama Pelanggan:
            </label>
            <select
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Pelanggan ({uniqueCustomerNames.length})</option>
              {uniqueCustomerNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">No. Nota</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Item Pesanan</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Status Bayar</th>
                <th className="py-3.5 px-4 text-center">Status Produksi</th>
                <th className="py-3.5 px-4 text-center">Aksi Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(trx => {
                  const currentProd = statusConfig[trx.productionStatus] || statusConfig.antrean;
                  const isPaid = trx.paymentStatus === 'lunas';
                  const isDp = trx.paymentStatus === 'dp';

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* No. Nota */}
                      <td className="py-4 px-4 font-mono font-black text-blue-600 dark:text-cyan-400 whitespace-nowrap">
                        {trx.invoiceNumber}
                      </td>

                      {/* Tanggal */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {trx.createdAt}
                      </td>

                      {/* Pelanggan & Tipe */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {trx.customerName}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              trx.customerType === 'seller'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : trx.customerType === 'instansi'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : trx.customerType === 'member'
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {trx.customerType}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">
                          {trx.customerPhone}
                        </p>
                      </td>

                      {/* Item list */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {trx.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join('; ')}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {trx.items.length} item
                        </span>
                      </td>

                      {/* Total & Remaining */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {formatRupiah(trx.grandTotal)}
                        </span>
                        {trx.remainingAmount > 0 ? (
                          <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 block">
                            Sisa: {formatRupiah(trx.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Lunas
                          </span>
                        )}
                      </td>

                      {/* Status Pembayaran (Menu Pilihan Ke Bawah / Dropdown) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Dropdown Menu Pilihan Ke Bawah Status Bayar */}
                          <div className="relative inline-block w-36">
                            <select
                              value={trx.paymentStatus}
                              onChange={e => handlePaymentStatusChange(trx, e.target.value as PaymentStatus)}
                              className={`w-full appearance-none rounded-xl border py-1.5 pl-3 pr-8 text-[11px] font-extrabold cursor-pointer transition shadow-sm focus:outline-none ${
                                isPaid
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isDp
                                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              <option value="lunas">🟢 Lunas</option>
                              <option value="dp">🟡 DP (Uang Muka)</option>
                              <option value="belum_lunas">🔴 Belum Lunas</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
                          </div>

                          {/* Pembeda Warna Jenis Transaksi (Metode Pembayaran) */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                                trx.paymentMethod === 'tunai'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : trx.paymentMethod === 'qris'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                              }`}
                            >
                              {trx.paymentMethod === 'tunai'
                                ? '💵 Tunai'
                                : trx.paymentMethod === 'qris'
                                ? '📱 QRIS'
                                : '🏦 Transfer'}
                            </span>

                            {trx.remainingAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => openSettleModal(trx)}
                                className="rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black text-white hover:bg-rose-700 transition shadow-sm"
                                title="Input Pelunasan"
                              >
                                + Bayar
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Produksi (Menu Pilihan Ke Bawah / Dropdown) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {/* Dropdown Menu Pilihan Ke Bawah Status Produksi */}
                          <div className="relative inline-block w-40">
                            <select
                              value={trx.productionStatus}
                              onChange={e => handleProductionStatusChange(trx, e.target.value as ProductionStatus)}
                              className={`w-full appearance-none rounded-xl border py-1.5 pl-3 pr-8 text-[11px] font-extrabold cursor-pointer transition shadow-sm focus:outline-none ${currentProd.badgeClass}`}
                            >
                              <option value="antrean">⏳ 1. Antrean</option>
                              <option value="desain">🎨 2. Setting / Desain</option>
                              <option value="cetak">🖨️ 3. Sedang Cetak</option>
                              <option value="finishing">✂️ 4. Finishing</option>
                              <option value="siap_ambil">📦 5. Siap Ambil</option>
                              <option value="selesai">✅ 6. Selesai</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
                          </div>

                          <span className="text-[9px] text-slate-400 font-medium">
                            Klik menu untuk ubah status
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Rincian */}
                          <button
                            onClick={() => setSelectedDetailTrx(trx)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            title="Lihat Rincian"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Print / Save A6 / Thermal */}
                          <button
                            onClick={() => setSelectedReceiptTransaction(trx)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white transition"
                            title="Cetak Nota A6 / Thermal"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* WhatsApp Share */}
                          <button
                            onClick={() => handleShareWhatsApp(trx)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition"
                            title="Kirim ke WhatsApp"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedDetailTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400">
                  {selectedDetailTrx.invoiceNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rincian Transaksi Lengkap
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailTrx(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-400 block font-semibold">Pelanggan:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedDetailTrx.customerName}
                  </span>
                  <span className="block text-slate-500 font-mono">
                    {selectedDetailTrx.customerPhone}
                  </span>
                  <span className="block text-slate-500">
                    Tipe: {selectedDetailTrx.customerType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Waktu & Petugas:</span>
                  <span>Tgl: {selectedDetailTrx.createdAt}</span>
                  <span className="block">Kasir: {selectedDetailTrx.cashierName}</span>
                  <span className="block">Metode: {selectedDetailTrx.paymentMethod}</span>
                  {selectedDetailTrx.deadline && (
                    <span className="block font-bold text-amber-600 mt-1">
                      Deadline: {selectedDetailTrx.deadline}
                    </span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Daftar Barang ({selectedDetailTrx.items.length} Item)
                </h4>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {selectedDetailTrx.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.width && item.length
                            ? `${item.width} x ${item.length} m (${item.areaM2} m²) · `
                            : ''}
                          {item.qty} {item.unit} @ {formatRupiah(item.pricePerUnit)}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-blue-600 dark:text-cyan-400 italic">
                            Finishing: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-1.5 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatRupiah(selectedDetailTrx.subtotal)}</span>
                </div>
                {selectedDetailTrx.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span className="font-mono font-semibold">-{formatRupiah(selectedDetailTrx.discount)}</span>
                  </div>
                )}
                {selectedDetailTrx.rounding !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Pembulatan:</span>
                    <span className="font-mono">{formatRupiah(selectedDetailTrx.rounding)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1.5 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400">
                    {formatRupiah(selectedDetailTrx.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Sudah Dibayar (DP):</span>
                  <span className="font-mono">{formatRupiah(selectedDetailTrx.dpAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-rose-600 border-t border-slate-200 pt-1 dark:border-slate-700">
                  <span>Sisa Piutang:</span>
                  <span className="font-mono">{formatRupiah(selectedDetailTrx.remainingAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedReceiptTransaction(selectedDetailTrx);
                  setSelectedDetailTrx(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Nota Ini</span>
              </button>

              <button
                onClick={() => setSelectedDetailTrx(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE PAYMENT MODAL */}
      {settleModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pelunasan Pembayaran Nota
                </h4>
                <p className="text-xs font-mono text-blue-600 dark:text-cyan-400">
                  {settleModalTrx.invoiceNumber} · {settleModalTrx.customerName}
                </p>
              </div>
              <button
                onClick={() => setSettleModalTrx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
                <span className="text-slate-500 block font-semibold">Sisa Tagihan Tertunggak:</span>
                <span className="font-mono text-lg font-black text-rose-600 dark:text-rose-400">
                  {formatRupiah(settleModalTrx.remainingAmount)}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                  Nominal Pelunasan (Rp):
                </label>
                <input
                  type="number"
                  max={settleModalTrx.remainingAmount}
                  value={settleAmount}
                  onChange={e => setSettleAmount(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-sm font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                  Metode Pembayaran:
                </label>
                <select
                  value={settleMethod}
                  onChange={e => setSettleMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="tunai">💵 Uang Tunai (Cash)</option>
                  <option value="qris">📱 QRIS Dinamis</option>
                  <option value="transfer_bca">🏦 Transfer BCA</option>
                  <option value="transfer_mandiri">🏦 Transfer Mandiri</option>
                  <option value="transfer_bri">🏦 Transfer BRI</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSettleModalTrx(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSettle}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Simpan Pelunasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
