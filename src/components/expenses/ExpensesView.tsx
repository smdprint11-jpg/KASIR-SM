import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  Tag,
  X,
  ChevronDown,
  Download,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { downloadCsv, downloadJson, triggerPrint } from '../../utils/export';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    expenseCategories,
    addExpenseCategory,
    currentUser,
    showToast,
  } = useApp();

  type PeriodKey = 'hari_ini' | 'kemarin' | '7_hari' | 'bulan_ini' | 'bulan_kemarin' | 'custom';
  const [period, setPeriod] = useState<PeriodKey>('hari_ini');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-10-07');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState('2026-10-07');
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer' | 'lainnya'>('tunai');

  // Category manage modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const todayStr = '2026-10-07';
  const yesterdayStr = '2026-10-06';
  const currentMonthStr = '2026-10';
  const lastMonthStr = '2026-09';

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      let matchPeriod = true;
      if (period === 'hari_ini') matchPeriod = d === todayStr;
      else if (period === 'kemarin') matchPeriod = d === yesterdayStr;
      else if (period === '7_hari') matchPeriod = d >= '2026-10-01' && d <= '2026-10-07';
      else if (period === 'bulan_ini') matchPeriod = d.startsWith(currentMonthStr);
      else if (period === 'bulan_kemarin') matchPeriod = d.startsWith(lastMonthStr);
      else if (period === 'custom') matchPeriod = d >= customStart && d <= customEnd;

      const matchCat = selectedCatFilter === 'all' || e.categoryId === selectedCatFilter;
      const matchSearch =
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchPeriod && matchCat && matchSearch;
    });
  }, [expenses, period, customStart, customEnd, selectedCatFilter, searchQuery]);

  const totalExpenseAmount = filteredExpenses.reduce((a, b) => a + b.amount, 0);

  const handleOpenAdd = () => {
    setCategoryId(expenseCategories[0]?.id || '');
    setDescription('');
    setAmount(0);
    setDate('2026-10-07');
    setPaymentMethod('tunai');
    setIsModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (!description.trim() || amount <= 0) {
      showToast('Deskripsi dan nominal pengeluaran wajib diisi dengan benar!', 'error');
      return;
    }

    const catObj = expenseCategories.find(c => c.id === categoryId);
    addExpense({
      date,
      categoryId,
      categoryName: catObj?.name || 'Operasional',
      description: description.trim(),
      amount,
      paymentMethod,
      recordedBy: currentUser?.name || 'Kasir',
    });

    showToast(`Pengeluaran "${description.trim()}" sebesar ${formatRupiah(amount)} berhasil dicatat!`, 'success');
    setIsModalOpen(false);
  };

  const handleAddCategorySubmit = () => {
    if (!newCatName.trim()) return;
    addExpenseCategory({
      name: newCatName.trim(),
    });
    showToast(`Kategori "${newCatName.trim()}" berhasil ditambahkan!`, 'success');
    setNewCatName('');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Tanggal',
      'Kategori Pengeluaran',
      'Keterangan / Pembelian Barang',
      'Metode Bayar',
      'Nominal (Rp)',
      'Dicatat Oleh',
    ];

    const rows = filteredExpenses.map(e => [
      e.date,
      e.categoryName,
      e.description,
      e.paymentMethod.toUpperCase(),
      e.amount,
      e.recordedBy,
    ]);

    downloadCsv(`Pengeluaran_Kas_SM_Printing_${period}_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast('Data pengeluaran kas berhasil diexport ke file Excel (CSV)!', 'success');
  };

  const handleExportJson = () => {
    downloadJson(`Pengeluaran_Kas_SM_Printing_${period}_${new Date().toISOString().split('T')[0]}`, filteredExpenses);
    showToast('Data pengeluaran kas berhasil diexport ke format JSON!', 'success');
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>Kategori Pengeluaran</span>
          </button>

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
            onClick={triggerPrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm dark:border-rose-950/60 dark:bg-rose-950/20">
        <div>
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
            Total Pengeluaran Kas ({period})
          </span>
          <p className="mt-1 font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatRupiah(totalExpenseAmount)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi pengeluaran..."
              className="rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <select
            value={selectedCatFilter}
            onChange={e => setSelectedCatFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">Semua Kategori</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Keterangan / Pembelian</th>
                <th className="py-3 px-3.5">Metode Bayar</th>
                <th className="py-3 px-3.5 text-right">Jumlah Pengeluaran</th>
                <th className="py-3 px-3.5 text-center">Dicatat Oleh</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada catatan pengeluaran pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {exp.date}
                    </td>

                    <td className="py-3.5 px-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {exp.categoryName}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-800 font-semibold dark:text-slate-200">
                      {exp.description}
                    </td>

                    <td className="py-3.5 px-3.5 uppercase font-mono text-[11px] text-slate-500">
                      {exp.paymentMethod}
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(exp.amount)}
                    </td>

                    <td className="py-3.5 px-3.5 text-center text-slate-500 text-[11px]">
                      {exp.recordedBy}
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pengeluaran "${exp.description}"?`)) {
                            deleteExpense(exp.id);
                            showToast(`Pengeluaran "${exp.description}" berhasil dihapus.`, 'info');
                          }
                        }}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Catat Pengeluaran Kas Toko
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tanggal:</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Kategori Pengeluaran:
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Keterangan / Pembelian Barang:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Beli 1 Roll Flexy 280g, Token Listrik, dll."
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nominal Pengeluaran (Rp):
                </label>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono text-base font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Metode Pembayaran:
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="tunai">💵 Tunai Kasir</option>
                  <option value="transfer">🏦 Transfer Bank</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleSaveExpense}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Simpan Pengeluaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGE MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Kelola Kategori Pengeluaran
              </h4>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Kategori baru (misal: Maintenance Mesin)..."
                  className="flex-1 rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  onClick={handleAddCategorySubmit}
                  className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700"
                >
                  + Tambah
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto dark:divide-slate-800">
                {expenseCategories.map(c => (
                  <div key={c.id} className="py-2 font-semibold text-slate-700 dark:text-slate-300">
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
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
