import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  ArrowRight,
  Receipt,
  Download,
  Filter,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/currency';
import { downloadExcel, downloadPdfTable, triggerPrint } from '../../utils/export';

export const CustomerReportView: React.FC = () => {
  const { customers, transactions, setSelectedReceiptTransaction, showToast } = useApp();

  type DateRangeKey = 'hari_ini' | 'kemarin' | '7_hari' | 'bulan_ini' | 'bulan_kemarin' | 'custom';
  const [dateRange, setDateRange] = useState<DateRangeKey>('bulan_ini');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-10-07');
  const [searchName, setSearchName] = useState('');
  const [selectedCustDetail, setSelectedCustDetail] = useState<string | null>(null);

  const todayStr = '2026-10-07';
  const yesterdayStr = '2026-10-06';
  const currentMonthStr = '2026-10';
  const lastMonthStr = '2026-09';

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const datePart = t.createdAt.split(' ')[0];
      if (dateRange === 'hari_ini') return datePart === todayStr;
      if (dateRange === 'kemarin') return datePart === yesterdayStr;
      if (dateRange === 'bulan_ini') return datePart.startsWith(currentMonthStr);
      if (dateRange === 'bulan_kemarin') return datePart.startsWith(lastMonthStr);
      if (dateRange === '7_hari') return datePart >= '2026-10-01' && datePart <= '2026-10-07';
      if (dateRange === 'custom') return datePart >= customStart && datePart <= customEnd;
      return true;
    });
  }, [transactions, dateRange, customStart, customEnd]);

  // Aggregate stats per customer
  const customerStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        name: string;
        phone: string;
        type: string;
        orderCount: number;
        totalSpent: number;
        totalPaid: number;
        totalDebt: number;
        invoices: typeof transactions;
      }
    > = {};

    filteredTransactions.forEach(t => {
      const key = t.customerName;
      if (!statsMap[key]) {
        statsMap[key] = {
          name: t.customerName,
          phone: t.customerPhone,
          type: t.customerType,
          orderCount: 0,
          totalSpent: 0,
          totalPaid: 0,
          totalDebt: 0,
          invoices: [],
        };
      }
      statsMap[key].orderCount += 1;
      statsMap[key].totalSpent += t.grandTotal;
      statsMap[key].totalPaid += t.dpAmount;
      statsMap[key].totalDebt += t.remainingAmount;
      statsMap[key].invoices.push(t);
    });

    return Object.values(statsMap).filter(st =>
      st.name.toLowerCase().includes(searchName.toLowerCase())
    );
  }, [filteredTransactions, searchName]);

  // Export to Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      'Nama Pelanggan',
      'No. WhatsApp',
      'Jenis Pelanggan',
      'Jumlah Order',
      'Total Nilai Order (Rp)',
      'Total Terbayar (Rp)',
      'Sisa Piutang (Rp)',
    ];

    const rows = customerStats.map(c => [
      c.name,
      c.phone,
      c.type.toUpperCase(),
      c.orderCount,
      formatRupiah(c.totalSpent),
      formatRupiah(c.totalPaid),
      formatRupiah(c.totalDebt),
    ]);

    downloadExcel(`Laporan_Order_Pelanggan_${dateRange}_${new Date().toISOString().split('T')[0]}`, headers, rows, 'Laporan Pelanggan');
    showToast('Laporan order pelanggan berhasil diexport ke file Excel!', 'success');
  };

  // Export to PDF (.pdf)
  const handleExportPdf = () => {
    const headers = [
      'Nama Pelanggan',
      'No. WhatsApp',
      'Jenis',
      'Jml Order',
      'Total Nilai (Rp)',
      'Terbayar (Rp)',
      'Piutang (Rp)',
    ];

    const rows = customerStats.map(c => [
      c.name,
      c.phone,
      c.type.toUpperCase(),
      c.orderCount,
      formatRupiah(c.totalSpent),
      formatRupiah(c.totalPaid),
      formatRupiah(c.totalDebt),
    ]);

    downloadPdfTable({
      filename: `Laporan_Order_Pelanggan_${dateRange}_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKAP ORDER & TRANSAKSI PELANGGAN',
      subtitle: `Periode: ${dateRange.toUpperCase()} · Total ${customerStats.length} Pelanggan`,
      headers,
      rows,
    });
    showToast('Dokumen PDF laporan order pelanggan berhasil diunduh!', 'success');
  };

  const activeCustomerForDetail = customerStats.find(c => c.name === selectedCustDetail);

  return (
    <div className="space-y-5">
      {/* Date & Period Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'kemarin', label: 'Kemarin' },
            { id: '7_hari', label: '7 Hari Terakhir' },
            { id: 'bulan_ini', label: 'Bulan Ini' },
            { id: 'bulan_kemarin', label: 'Bulan Kemarin' },
            { id: 'custom', label: 'Pilihan Tanggal' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDateRange(p.id as DateRangeKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                dateRange === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            title="Cetak atau Unduh Dokumen PDF Laporan"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold">Total Nilai Order Pelanggan</span>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white">
            {formatRupiah(customerStats.reduce((a, b) => a + b.totalSpent, 0))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold">Telah Terbayar (Masuk Kas)</span>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(customerStats.reduce((a, b) => a + b.totalPaid, 0))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold">Sisa Piutang Belum Lunas</span>
          <p className="mt-1 font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatRupiah(customerStats.reduce((a, b) => a + b.totalDebt, 0))}
          </p>
        </div>
      </div>

      {/* Customer Aggregate Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Cari nama pelanggan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5">Nama Pelanggan</th>
                <th className="py-3 px-3.5">Jenis Klien</th>
                <th className="py-3 px-3.5 text-center">Total Order</th>
                <th className="py-3 px-3.5 text-right">Total Belanja</th>
                <th className="py-3 px-3.5 text-right">Telah Bayar</th>
                <th className="py-3 px-3.5 text-right">Sisa Piutang</th>
                <th className="py-3 px-3.5 text-center">Rincian & Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {customerStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                customerStats.map(c => (
                  <tr key={c.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{c.phone}</p>
                    </td>

                    <td className="py-3.5 px-3.5">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase dark:bg-blue-950 dark:text-blue-300">
                        {c.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-center font-bold">
                      {c.orderCount} Nota
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(c.totalSpent)}
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-semibold text-emerald-600">
                      {formatRupiah(c.totalPaid)}
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-bold">
                      <span className={c.totalDebt > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {formatRupiah(c.totalDebt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedCustDetail(c.name)}
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                      >
                        Detail & Export PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL / EXPORT PER NAMA PELANGGAN */}
      {activeCustomerForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Laporan Order Pelanggan: {activeCustomerForDetail.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Periode: {dateRange} · {activeCustomerForDetail.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                <div>
                  <span className="text-[10px] text-slate-400">Total Belanja</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(activeCustomerForDetail.totalSpent)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Telah Dibayar</span>
                  <p className="font-mono font-bold text-emerald-600">
                    {formatRupiah(activeCustomerForDetail.totalPaid)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Sisa Piutang</span>
                  <p className="font-mono font-bold text-rose-600">
                    {formatRupiah(activeCustomerForDetail.totalDebt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">
                  Daftar Nota Transaksi Periode Ini ({activeCustomerForDetail.invoices.length} Nota)
                </h4>
                {activeCustomerForDetail.invoices.map(inv => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600">{inv.invoiceNumber}</span>
                      <span className="ml-2 text-[10px] text-slate-400">{inv.createdAt}</span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {inv.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold block">{formatRupiah(inv.grandTotal)}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        [{inv.paymentStatus}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                onClick={() => {
                  showToast(`Membuka dialog cetak/PDF laporan untuk ${activeCustomerForDetail.name}...`, 'info');
                  triggerPrint();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Export PDF Pelanggan Ini</span>
              </button>

              <button
                onClick={() => setSelectedCustDetail(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
