import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileSpreadsheet,
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Download,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/currency';
import { downloadExcel, downloadPdfTable, triggerPrint } from '../../utils/export';

export const CashflowView: React.FC = () => {
  const { transactions, expenses, showToast } = useApp();

  type PeriodKey = 'hari_ini' | 'kemarin' | '7_hari' | 'bulan_ini' | 'bulan_kemarin' | 'custom';
  const [period, setPeriod] = useState<PeriodKey>('hari_ini');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-10-07');

  const todayStr = '2026-10-07';
  const yesterdayStr = '2026-10-06';
  const currentMonthStr = '2026-10';
  const lastMonthStr = '2026-09';

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = t.createdAt.split(' ')[0];
      if (period === 'hari_ini') return d === todayStr;
      if (period === 'kemarin') return d === yesterdayStr;
      if (period === '7_hari') return d >= '2026-10-01' && d <= '2026-10-07';
      if (period === 'bulan_ini') return d.startsWith(currentMonthStr);
      if (period === 'bulan_kemarin') return d.startsWith(lastMonthStr);
      if (period === 'custom') return d >= customStart && d <= customEnd;
      return true;
    });
  }, [transactions, period, customStart, customEnd]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      if (period === 'hari_ini') return d === todayStr;
      if (period === 'kemarin') return d === yesterdayStr;
      if (period === '7_hari') return d >= '2026-10-01' && d <= '2026-10-07';
      if (period === 'bulan_ini') return d.startsWith(currentMonthStr);
      if (period === 'bulan_kemarin') return d.startsWith(lastMonthStr);
      if (period === 'custom') return d >= customStart && d <= customEnd;
      return true;
    });
  }, [expenses, period, customStart, customEnd]);

  // Combined ledger entries
  interface LedgerEntry {
    id: string;
    date: string;
    type: 'in' | 'out';
    category: string;
    description: string;
    channel: string;
    amount: number;
    actor: string;
  }

  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    const list: LedgerEntry[] = [];

    // Add Inflows from POS transactions
    filteredTransactions.forEach(t => {
      const paid = t.dpAmount > 0 ? t.dpAmount : t.grandTotal;
      if (paid > 0) {
        list.push({
          id: `in-${t.id}`,
          date: t.createdAt,
          type: 'in',
          category: 'Penjualan Nota Kasir',
          description: `Nota #${t.invoiceNumber} (${t.customerName})`,
          channel: t.paymentMethod,
          amount: paid,
          actor: t.cashierName,
        });
      }
    });

    // Add Outflows from expenses
    filteredExpenses.forEach(e => {
      list.push({
        id: `out-${e.id}`,
        date: `${e.date} 09:00`,
        type: 'out',
        category: e.categoryName,
        description: e.description,
        channel: e.paymentMethod,
        amount: e.amount,
        actor: e.recordedBy,
      });
    });

    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, filteredExpenses]);

  // Totals
  const totalIn = ledgerEntries.filter(l => l.type === 'in').reduce((a, b) => a + b.amount, 0);
  const totalOut = ledgerEntries.filter(l => l.type === 'out').reduce((a, b) => a + b.amount, 0);
  const netBalance = totalIn - totalOut;

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      'Waktu / Tanggal',
      'Arus Kas',
      'Kategori',
      'Deskripsi / Keterangan',
      'Kanal Pembayaran',
      'Nominal (Rp)',
      'Petugas',
    ];

    const rows = ledgerEntries.map(l => [
      l.date,
      l.type === 'in' ? 'UANG MASUK' : 'UANG KELUAR',
      l.category,
      l.description,
      l.channel,
      formatRupiah(l.amount),
      l.actor,
    ]);

    downloadExcel(`Laporan_Alur_Kas_${period}_${new Date().toISOString().split('T')[0]}`, headers, rows, 'Alur Kas');
    showToast('Laporan alur kas berhasil diexport ke format Excel!', 'success');
  };

  // Export PDF (.pdf)
  const handleExportPdf = () => {
    const headers = [
      'Waktu',
      'Arus Kas',
      'Kategori',
      'Keterangan',
      'Metode',
      'Nominal (Rp)',
    ];

    const rows = ledgerEntries.map(l => [
      l.date.split(' ')[0],
      l.type === 'in' ? 'MASUK (+)' : 'KELUAR (-)',
      l.category.substring(0, 18),
      l.description.substring(0, 25),
      l.channel,
      formatRupiah(l.amount),
    ]);

    downloadPdfTable({
      filename: `Laporan_Alur_Kas_${period}_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKAP BUKU KAS (ALUR KAS KELUAR/MASUK)',
      subtitle: `Periode: ${period.toUpperCase()} · Masuk: ${formatRupiah(totalIn)} · Keluar: ${formatRupiah(totalOut)} · Saldo Bersih: ${formatRupiah(netBalance)}`,
      headers,
      rows,
    });
    showToast('Dokumen PDF laporan alur kas berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'kemarin', label: 'Kemarin' },
            { id: '7_hari', label: '7 Hari Lalu' },
            { id: 'bulan_ini', label: 'Bulan Ini' },
            { id: 'bulan_kemarin', label: 'Bulan Kemarin' },
            { id: 'custom', label: 'Pilihan Tanggal' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}

          {period === 'custom' && (
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
            title="Cetak atau Unduh Dokumen PDF Alur Kas"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF Alur Kas</span>
          </button>
        </div>
      </div>

      {/* Summary 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflow */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-950/60 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Total Kas Masuk (Inflow)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatRupiah(totalIn)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600/80">
            Dari pelunasan nota & DP pelanggan
          </p>
        </div>

        {/* Total Outflow */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm dark:border-rose-950/60 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Total Kas Keluar (Outflow)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400">
            {formatRupiah(totalOut)}
          </p>
          <p className="mt-1 text-[11px] text-rose-600/80">
            Pengeluaran bahan & operasional
          </p>
        </div>

        {/* Net Saldo */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm dark:border-blue-950/60 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              Saldo Akhir Kas Bersih
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-2 font-mono text-xl sm:text-2xl font-bold ${
              netBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netBalance)}
          </p>
          <p className="mt-1 text-[11px] text-blue-600/80">
            Arus kas bersih periode ini
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5">Waktu</th>
                <th className="py-3 px-3.5 text-center">Jenis Arus</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Keterangan / Transaksi</th>
                <th className="py-3 px-3.5">Kanal Bayar</th>
                <th className="py-3 px-3.5 text-right">Nominal</th>
                <th className="py-3 px-3.5 text-center">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada aktivitas alur kas pada periode ini.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {l.date}
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          l.type === 'in'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {l.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                      {l.category}
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300 max-w-[260px] truncate">
                      {l.description}
                    </td>

                    <td className="py-3.5 px-3.5 capitalize text-slate-500">
                      {l.channel.replace('_', ' ')}
                    </td>

                    <td
                      className={`py-3.5 px-3.5 text-right font-mono font-bold ${
                        l.type === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {l.type === 'in' ? '+' : '-'} {formatRupiah(l.amount)}
                    </td>

                    <td className="py-3.5 px-3.5 text-center text-slate-500 text-[11px]">
                      {l.actor}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
