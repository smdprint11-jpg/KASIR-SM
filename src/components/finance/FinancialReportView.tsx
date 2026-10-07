import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Filter,
  ChevronDown,
  Download,
  FileText,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/currency';
import { downloadCsv, downloadJson, triggerPrint } from '../../utils/export';

export const FinancialReportView: React.FC = () => {
  const { transactions, expenses, expenseCategories, categories, showToast } = useApp();

  type PeriodKey = 'hari_ini' | '7_hari' | 'bulan_ini' | 'custom';
  const [period, setPeriod] = useState<PeriodKey>('bulan_ini');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-10-07');

  // Category filter multi-selection with checkboxes
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    expenseCategories.map(c => c.id)
  );
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategoryIds(expenseCategories.map(c => c.id));
    showToast('Semua kategori pengeluaran dipilih', 'info');
  };

  const handleDeselectAllCategories = () => {
    setSelectedCategoryIds([]);
    showToast('Semua kategori pengeluaran tidak dicentang', 'info');
  };

  const todayStr = '2026-10-07';
  const currentMonthStr = '2026-10';

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = t.createdAt.split(' ')[0];
      if (period === 'hari_ini') return d === todayStr;
      if (period === '7_hari') return d >= '2026-10-01' && d <= '2026-10-07';
      if (period === 'bulan_ini') return d.startsWith(currentMonthStr);
      if (period === 'custom') return d >= customStart && d <= customEnd;
      return true;
    });
  }, [transactions, period, customStart, customEnd]);

  // Filter expenses based on multi-select checked categories
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      let matchPeriod = true;
      if (period === 'hari_ini') matchPeriod = d === todayStr;
      else if (period === '7_hari') matchPeriod = d >= '2026-10-01' && d <= '2026-10-07';
      else if (period === 'bulan_ini') matchPeriod = d.startsWith(currentMonthStr);
      else if (period === 'custom') matchPeriod = d >= customStart && d <= customEnd;

      // Checkbox multi-category matching
      const matchCat = selectedCategoryIds.length === 0 || selectedCategoryIds.includes(e.categoryId);
      return matchPeriod && matchCat;
    });
  }, [expenses, period, customStart, customEnd, selectedCategoryIds]);

  // Financial aggregates
  const totalGrossSales = filteredTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const totalCashCollected = filteredTransactions.reduce(
    (acc, t) => acc + (t.dpAmount > 0 ? t.dpAmount : t.grandTotal),
    0
  );
  const totalDebtCustomer = filteredTransactions.reduce((acc, t) => acc + t.remainingAmount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netIncome = totalCashCollected - totalExpenses;

  // Breakdown by expense category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.categoryName] = (map[e.categoryName] || 0) + e.amount;
    });
    return Object.entries(map).map(([cat, total]) => ({ category: cat, total }));
  }, [filteredExpenses]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Komponen Keuangan', 'Nilai (Rp)', 'Keterangan'];
    const rows = [
      ['Total Penjualan Kotor (Gross Sales)', totalGrossSales, 'Nilai seluruh nota pesanan dibuat'],
      ['Total Kas Masuk Terkumpul (Net Inflow)', totalCashCollected, 'Uang tunai, QRIS, dan transfer masuk kas'],
      ['Sisa Piutang / Hutang Pelanggan', totalDebtCustomer, 'Tagihan belum lunas dari pelanggan'],
      ['Total Pengeluaran Kas (Total Expenses)', totalExpenses, 'Biaya bahan baku, mesin, utilitas'],
      ['Laba Bersih Kas (Net Cashflow / Profit)', netIncome, 'Kas masuk dikurangi pengeluaran operasional'],
    ];

    downloadCsv(`Laporan_Keuangan_Laba_Rugi_SM_Printing_${period}_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast('Laporan keuangan berhasil diexport ke file Excel (CSV)!', 'success');
  };

  const handleExportJson = () => {
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalGrossSales,
        totalCashCollected,
        totalDebtCustomer,
        totalExpenses,
        netIncome,
      },
      expenseBreakdown,
      categoriesFiltered: selectedCategoryIds,
    };
    downloadJson(`Laporan_Keuangan_SM_Printing_${period}_${new Date().toISOString().split('T')[0]}`, reportData);
    showToast('Laporan keuangan berhasil diexport ke file JSON!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: '7_hari', label: '7 Hari Terakhir' },
            { id: 'bulan_ini', label: 'Bulan Ini' },
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Select Checkbox Dropdown Kategori */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Centang Kategori ({selectedCategoryIds.length}/{expenseCategories.length})</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isCatDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Pilih Kategori</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllCategories}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {expenseCategories.map(cat => {
                    const isChecked = selectedCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 rounded-xl p-2 text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50/70 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                            : 'hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCategory(cat.id)}
                          className="h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <div className="flex flex-col flex-1 truncate">
                          <span className="font-bold truncate">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[10px] text-slate-400 truncate">{cat.description}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCatDropdownOpen(false)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

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
                onClick={handleExportCsv}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export File Excel (.csv)</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Export File Data (.json)</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              showToast('Membuka dialog cetak / PDF laporan keuangan...', 'info');
              triggerPrint();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pemasukan Kas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pemasukan Kas (Inflow)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {formatRupiah(totalCashCollected)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Bruto order: {formatRupiah(totalGrossSales)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pengeluaran Kas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatRupiah(totalExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Biaya operasional & bahan baku
          </p>
        </div>

        {/* Saldo Akhir (Laba Kas) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Akhir (Laba Kas)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-2 font-mono text-2xl font-black ${
              netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netIncome)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Surplus / Margin kas periode ini
          </p>
        </div>

        {/* Piutang Pelanggan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Piutang Pelanggan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatRupiah(totalDebtCustomer)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Tagihan belum terlunasi
          </p>
        </div>
      </div>

      {/* Financial Statement & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ringkasan Laba Rugi Sederhana */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Laporan Laba Rugi Kas Sederhana
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Total Penjualan Nota (Bruto):</span>
              <span className="font-mono font-bold">{formatRupiah(totalGrossSales)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-600">
              <span>(-) Piutang Belum Tertagih:</span>
              <span className="font-mono font-bold">-{formatRupiah(totalDebtCustomer)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-emerald-600">
              <span>(=) Total Kas Masuk Diterima:</span>
              <span className="font-mono">{formatRupiah(totalCashCollected)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-600">
              <span>(-) Total Beban Pengeluaran Kas:</span>
              <span className="font-mono font-bold">-{formatRupiah(totalExpenses)}</span>
            </div>

            <div className="flex justify-between py-3 font-extrabold text-sm border-t-2 border-slate-900 text-slate-900 dark:border-slate-700 dark:text-white">
              <span>(=) Saldo Akhir Kas Bersih:</span>
              <span className="font-mono text-base text-blue-600 dark:text-blue-400">
                {formatRupiah(netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Rincian Pengeluaran per Kategori */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Distribusi Biaya per Kategori
          </h4>

          {expenseBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Tidak ada rincian pengeluaran pada periode ini.
            </p>
          ) : (
            <div className="space-y-3">
              {expenseBreakdown.map((item, idx) => {
                const pct = totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="font-mono">{formatRupiah(item.total)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-blue-600"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
