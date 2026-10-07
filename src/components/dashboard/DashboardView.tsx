import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  AlertTriangle,
  Clock,
  Printer,
  PlusCircle,
  Users,
  Receipt,
  ArrowRight,
  Calendar,
  Layers,
  CheckCircle,
  FileText,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber } from '../../utils/currency';
import { ProductionStatus } from '../../types';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    expenses,
    unpaidTransactions,
    pendingProductionTransactions,
    setCurrentPage,
    setShowAlertModal,
    setSelectedReceiptTransaction,
  } = useApp();

  // Date Filter State
  type DateFilter = 'hari_ini' | 'kemarin' | 'bulan_ini' | 'custom';
  const [dateFilter, setDateFilter] = useState<DateFilter>('hari_ini');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-07');

  // Today's date reference
  const todayStr = '2026-10-07';
  const yesterdayStr = '2026-10-06';
  const currentMonthPrefix = '2026-10';

  // Filter transactions based on date filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      const trxDate = trx.createdAt.split(' ')[0];
      if (dateFilter === 'hari_ini') return trxDate === todayStr;
      if (dateFilter === 'kemarin') return trxDate === yesterdayStr;
      if (dateFilter === 'bulan_ini') return trxDate.startsWith(currentMonthPrefix);
      if (dateFilter === 'custom') {
        return trxDate >= customStartDate && trxDate <= customEndDate;
      }
      return true;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate]);

  // Filter expenses based on date filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = exp.date;
      if (dateFilter === 'hari_ini') return expDate === todayStr;
      if (dateFilter === 'kemarin') return expDate === yesterdayStr;
      if (dateFilter === 'bulan_ini') return expDate.startsWith(currentMonthPrefix);
      if (dateFilter === 'custom') {
        return expDate >= customStartDate && expDate <= customEndDate;
      }
      return true;
    });
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  // Calculate metrics
  const totalIncome = filteredTransactions.reduce((acc, t) => acc + (t.dpAmount || t.grandTotal), 0);
  const totalGrossOrder = filteredTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const totalExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netIncome = totalIncome - totalExpense;

  // Breakdown by payment methods
  const cashIncome = filteredTransactions
    .filter(t => t.paymentMethod === 'tunai')
    .reduce((acc, t) => acc + (t.dpAmount || t.grandTotal), 0);

  const qrisIncome = filteredTransactions
    .filter(t => t.paymentMethod === 'qris')
    .reduce((acc, t) => acc + (t.dpAmount || t.grandTotal), 0);

  const transferIncome = filteredTransactions
    .filter(t => t.paymentMethod.startsWith('transfer'))
    .reduce((acc, t) => acc + (t.dpAmount || t.grandTotal), 0);

  // Production status breakdown
  const productionCounts: Record<ProductionStatus, number> = {
    antrean: transactions.filter(t => t.productionStatus === 'antrean').length,
    desain: transactions.filter(t => t.productionStatus === 'desain').length,
    cetak: transactions.filter(t => t.productionStatus === 'cetak').length,
    finishing: transactions.filter(t => t.productionStatus === 'finishing').length,
    siap_ambil: transactions.filter(t => t.productionStatus === 'siap_ambil').length,
    selesai: transactions.filter(t => t.productionStatus === 'selesai').length,
  };

  // Weekly data for chart (last 7 days)
  const weeklyData = [
    { day: 'Kamis', date: '01/10', income: 420000 },
    { day: 'Jumat', date: '02/10', income: 680000 },
    { day: 'Sabtu', date: '03/10', income: 890000 },
    { day: 'Minggu', date: '04/10', income: 350000 },
    { day: 'Senin', date: '05/10', income: 720000 },
    { day: 'Selasa', date: '06/10', income: 650000 },
    { day: 'Rabu', date: '07/10', income: totalIncome || 520000 },
  ];

  const maxWeekly = Math.max(...weeklyData.map(d => d.income), 1000000);

  // Monthly data for trend (6 months)
  const monthlyData = [
    { month: 'Mei', income: 14200000, expense: 7800000 },
    { month: 'Jun', income: 16500000, expense: 9100000 },
    { month: 'Jul', income: 18900000, expense: 10400000 },
    { month: 'Agu', income: 19400000, expense: 11200000 },
    { month: 'Sep', income: 21800000, expense: 12500000 },
    { month: 'Okt', income: 23500000, expense: 13100000 },
  ];

  const maxMonthly = Math.max(...monthlyData.map(m => m.income));

  return (
    <div className="space-y-6">
      {/* 1. TOP URGENT ALERT BANNER (NOTA BELUM LUNAS / BELUM DIKERJAKAN) */}
      {(unpaidTransactions.length > 0 || pendingProductionTransactions.length > 0) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Pemberitahuan Operasional Toko
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Ada <span className="font-bold underline">{unpaidTransactions.length} nota belum lunas</span> dan{' '}
                <span className="font-bold underline">{pendingProductionTransactions.length} pesanan</span> masih dalam antrean/proses pengerjaan.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition shrink-0"
          >
            <span>Buka Rincian Peringatan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. DATE FILTER BAR & QUICK ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'kemarin', label: 'Kemarin' },
            { id: 'bulan_ini', label: 'Bulan Ini' },
            { id: 'custom', label: 'Pilihan Tanggal' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as DateFilter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                dateFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          )}
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentPage('pos')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Buat Nota Baru</span>
          </button>
          <button
            onClick={() => setCurrentPage('expenses')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            <span>Catat Pengeluaran</span>
          </button>
          <button
            onClick={() => setCurrentPage('customers')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span>Pelanggan</span>
          </button>
        </div>
      </div>

      {/* 3. FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow (Cash received) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pemasukan Kas ({dateFilter === 'hari_ini' ? 'Hari Ini' : 'Periode Terpilih'})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatRupiah(totalIncome)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Dari {filteredTransactions.length} transaksi nota
          </p>
        </div>

        {/* Total Outflow (Expenses) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pengeluaran Kas ({dateFilter === 'hari_ini' ? 'Hari Ini' : 'Periode'})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatRupiah(totalExpense)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Bahan baku, utilitas & operasional
          </p>
        </div>

        {/* Net Cashflow (Saldo Bersih) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Saldo Bersih Kas
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-2 font-mono text-xl sm:text-2xl font-bold ${
              netIncome >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netIncome)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Pemasukan dikurangi pengeluaran
          </p>
        </div>

        {/* Total Piutang Belum Lunas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Piutang Pelanggan Tertunggak
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatRupiah(
              unpaidTransactions.reduce((acc, t) => acc + t.remainingAmount, 0)
            )}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Dari {unpaidTransactions.length} nota belum lunas
          </p>
        </div>
      </div>

      {/* 4. PAYMENT CHANNEL BREAKDOWN (TUNAI, QRIS, TRANSFER) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Rincian Pembayaran Berdasarkan Kanal ({dateFilter === 'hari_ini' ? 'Hari Ini' : 'Periode'})
        </h4>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tunai */}
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Uang Tunai (Cash)</p>
              <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatRupiah(cashIncome)}
              </p>
            </div>
          </div>

          {/* QRIS */}
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">QRIS Dinamis</p>
              <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatRupiah(qrisIncome)}
              </p>
            </div>
          </div>

          {/* Transfer Bank */}
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transfer Bank (BCA/Mandiri/BRI)</p>
              <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatRupiah(transferIncome)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRODUCTION STATUS SUMMARY (REAL-TIME STATUS PRODUKSI) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Status Produksi Cetak Real-Time
          </h4>
          <button
            onClick={() => setCurrentPage('transactions')}
            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            Lihat Antrean Produksi &rarr;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'antrean', label: '1. Antrean', count: productionCounts.antrean, color: 'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800' },
            { key: 'desain', label: '2. Setting/Desain', count: productionCounts.desain, color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50' },
            { key: 'cetak', label: '3. Sedang Cetak', count: productionCounts.cetak, color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50 animate-pulse' },
            { key: 'finishing', label: '4. Finishing', count: productionCounts.finishing, color: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50' },
            { key: 'siap_ambil', label: '5. Siap Ambil', count: productionCounts.siap_ambil, color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/50' },
            { key: 'selesai', label: '6. Selesai', count: productionCounts.selesai, color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setCurrentPage('transactions')}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition hover:scale-[1.02] ${stat.color}`}
            >
              <span className="text-xs font-semibold">{stat.label}</span>
              <span className="mt-1 font-mono text-2xl font-black">{stat.count}</span>
              <span className="text-[10px] opacity-75">Nota</span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. GRAFIK BULAT (DONUT / PIE CHARTS) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <PieChart className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Grafik Bulat (Donut Charts)
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualisasi proporsi pembayaran dan status pesanan cetak
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            Periode: {dateFilter === 'hari_ini' ? 'Hari Ini' : dateFilter === 'kemarin' ? 'Kemarin' : 'Bulan Ini'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donut Chart 1: Metode Pembayaran */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              1. Komposisi Metode Pembayaran (Omset)
            </h5>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0" style={{ width: 170, height: 170 }}>
                <svg width={170} height={170} viewBox="0 0 160 160" className="-rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="22"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {(() => {
                    const totalPay = (cashIncome + qrisIncome + transferIncome) || 1;
                    const cCirc = 2 * Math.PI * 62;
                    let acc = 0;
                    const items = [
                      { val: cashIncome, color: '#059669' }, // Emerald
                      { val: qrisIncome, color: '#2563eb' }, // Blue
                      { val: transferIncome, color: '#4f46e5' }, // Indigo
                    ];
                    return items.map((it, idx) => {
                      if (it.val <= 0) return null;
                      const ratio = it.val / totalPay;
                      const dash = `${ratio * cCirc} ${cCirc}`;
                      const offset = -acc * cCirc;
                      acc += ratio;
                      return (
                        <circle
                          key={idx}
                          cx="80"
                          cy="80"
                          r="62"
                          fill="transparent"
                          stroke={it.color}
                          strokeWidth="22"
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Kas</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                    {formatRupiah(totalIncome)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                {[
                  { label: 'Uang Tunai (Cash)', val: cashIncome, color: '#059669' },
                  { label: 'QRIS Dinamis', val: qrisIncome, color: '#2563eb' },
                  { label: 'Transfer Bank', val: transferIncome, color: '#4f46e5' },
                ].map((item, idx) => {
                  const totalPay = (cashIncome + qrisIncome + transferIncome) || 1;
                  const pct = Math.round((item.val / totalPay) * 100);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className="text-slate-900 dark:text-slate-100">{formatRupiah(item.val)}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Donut Chart 2: Status Pelunasan Nota */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              2. Status Pelunasan Nota Pelanggan
            </h5>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0" style={{ width: 170, height: 170 }}>
                <svg width={170} height={170} viewBox="0 0 160 160" className="-rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="22"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {(() => {
                    const lunasCount = filteredTransactions.filter(t => t.paymentStatus === 'lunas').length;
                    const dpCount = filteredTransactions.filter(t => t.paymentStatus === 'dp').length;
                    const belumCount = filteredTransactions.filter(t => t.paymentStatus === 'belum_lunas').length;
                    const totalCount = (lunasCount + dpCount + belumCount) || 1;
                    const cCirc = 2 * Math.PI * 62;
                    let acc = 0;
                    const items = [
                      { val: lunasCount, color: '#10b981' }, // Emerald
                      { val: dpCount, color: '#f59e0b' }, // Amber
                      { val: belumCount, color: '#f43f5e' }, // Rose
                    ];
                    return items.map((it, idx) => {
                      if (it.val <= 0) return null;
                      const ratio = it.val / totalCount;
                      const dash = `${ratio * cCirc} ${cCirc}`;
                      const offset = -acc * cCirc;
                      acc += ratio;
                      return (
                        <circle
                          key={idx}
                          cx="80"
                          cy="80"
                          r="62"
                          fill="transparent"
                          stroke={it.color}
                          strokeWidth="22"
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Nota</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {filteredTransactions.length} Nota
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                {(() => {
                  const lunasCount = filteredTransactions.filter(t => t.paymentStatus === 'lunas').length;
                  const dpCount = filteredTransactions.filter(t => t.paymentStatus === 'dp').length;
                  const belumCount = filteredTransactions.filter(t => t.paymentStatus === 'belum_lunas').length;
                  const totalCount = (lunasCount + dpCount + belumCount) || 1;
                  return [
                    { label: 'Nota Lunas', count: lunasCount, color: '#10b981' },
                    { label: 'Uang Muka (DP)', count: dpCount, color: '#f59e0b' },
                    { label: 'Belum Lunas / Tempo', count: belumCount, color: '#f43f5e' },
                  ].map((item, idx) => {
                    const pct = Math.round((item.count / totalCount) * 100);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-slate-900 dark:text-slate-100">{item.count} Nota</span>
                          <span className="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. DIAGRAM & GRAFIK TREN (DIAGRAM BATANG & DIAGRAM AREA/GARIS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagram 1: Diagram Batang & Kurva Area Pemasukan Mingguan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diagram Pemasukan Mingguan (7 Hari)
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diagram aktivitas penjualan harian percetakan
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              7 Hari: {formatRupiah(weeklyData.reduce((a, b) => a + b.income, 0))}
            </span>
          </div>

          {/* Bar Diagram Container */}
          <div className="mt-6 flex h-48 items-end gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
            {weeklyData.map((item, idx) => {
              const heightPct = Math.round((item.income / maxWeekly) * 100);
              const isToday = idx === weeklyData.length - 1;
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white group-hover:block dark:bg-slate-800 z-10 shadow-lg pointer-events-none">
                    {formatRupiah(item.income)}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPct, 12)}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 relative ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-700 to-cyan-500 shadow-md shadow-blue-500/20'
                        : 'bg-blue-300 hover:bg-blue-400 dark:bg-blue-900/60 dark:hover:bg-blue-800'
                    }`}
                  >
                    {isToday && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
                        Kini
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {item.day}
                    </span>
                    <span className="block text-[9px] text-slate-400">{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagram 2: Diagram Komparasi Pemasukan & Pengeluaran Bulanan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diagram Arus Kas Bulanan (6 Bulan)
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan pemasukan vs pengeluaran operasional
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded bg-blue-600"></span> Masuk
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="h-2.5 w-2.5 rounded bg-rose-500"></span> Keluar
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
            {monthlyData.map((item, idx) => {
              const incPct = Math.round((item.income / maxMonthly) * 100);
              const expPct = Math.round((item.expense / maxMonthly) * 100);
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <div className="absolute -top-8 hidden rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white group-hover:block dark:bg-slate-800 z-10 shadow-lg pointer-events-none whitespace-nowrap">
                    +{formatRupiah(item.income)} / -{formatRupiah(item.expense)}
                  </div>
                  <div className="flex w-full items-end justify-center gap-1.5 h-full">
                    <div
                      style={{ height: `${incPct}%` }}
                      className="w-1/2 rounded-t-md bg-blue-600 transition-all hover:bg-blue-500"
                    ></div>
                    <div
                      style={{ height: `${expPct}%` }}
                      className="w-1/2 rounded-t-md bg-rose-400 transition-all hover:bg-rose-500"
                    ></div>
                  </div>
                  <span className="mt-2 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. RECENT TRANSACTIONS TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Transaksi Terkini
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar nota cetak terbaru
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('transactions')}
            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            Lihat Semua Transaksi &rarr;
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-3">No. Nota</th>
                <th className="py-2.5 px-3">Pelanggan</th>
                <th className="py-2.5 px-3">Rincian Item</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Status Bayar</th>
                <th className="py-2.5 px-3 text-center">Produksi</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {transactions.slice(0, 5).map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {trx.invoiceNumber}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {trx.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {trx.customerPhone}
                    </p>
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate text-slate-600 dark:text-slate-300">
                    {trx.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(trx.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        trx.paymentStatus === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : trx.paymentStatus === 'dp'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}
                    >
                      {trx.paymentStatus === 'lunas'
                        ? 'LUNAS'
                        : trx.paymentStatus === 'dp'
                        ? 'DP'
                        : 'BELUM'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {trx.productionStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedReceiptTransaction(trx)}
                      className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                      title="Cetak / Lihat Nota"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
