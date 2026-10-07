import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  MessageCircle,
  ChevronDown,
  Download,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerType } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { downloadExcel, downloadPdfTable, triggerPrint } from '../../utils/export';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, transactions, setSelectedReceiptTransaction, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Customer Modal (Create & Edit)
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<CustomerType>('umum');

  // Customer Order History Modal
  const [selectedCustHistory, setSelectedCustHistory] = useState<Customer | null>(null);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [customers, searchQuery, filterType]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setAddress('');
    setType('umum');
    setIsOpenModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingId(cust.id);
    setName(cust.name);
    setPhone(cust.phone);
    setAddress(cust.address);
    setType(cust.type);
    setIsOpenModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Nama pelanggan wajib diisi!', 'error');
      return;
    }

    if (editingId) {
      updateCustomer(editingId, {
        name: name.trim(),
        phone: phone.trim() || '-',
        address: address.trim() || '-',
        type,
      });
      showToast(`Data pelanggan "${name.trim()}" berhasil diperbarui!`, 'success');
    } else {
      addCustomer({
        name: name.trim(),
        phone: phone.trim() || '-',
        address: address.trim() || '-',
        type,
      });
      showToast(`Pelanggan baru "${name.trim()}" berhasil didaftarkan!`, 'success');
    }

    setIsOpenModal(false);
  };

  // Export to Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      'Nama Pelanggan',
      'No. WhatsApp',
      'Alamat',
      'Jenis Pelanggan',
      'Total Order',
      'Total Belanja (Rp)',
      'Sisa Piutang (Rp)',
      'Tgl Terdaftar',
    ];

    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.address,
      c.type.toUpperCase(),
      c.totalOrders,
      formatRupiah(c.totalSpent),
      formatRupiah(c.totalDebt),
      c.createdAt,
    ]);

    downloadExcel(`Data_Pelanggan_${new Date().toISOString().split('T')[0]}`, headers, rows, 'Pelanggan');
    showToast('Data pelanggan berhasil diexport ke format Excel!', 'success');
  };

  // Export to PDF (.pdf)
  const handleExportPdf = () => {
    const headers = [
      'Nama Pelanggan',
      'No. WhatsApp',
      'Alamat',
      'Jenis',
      'Total Order',
      'Total Belanja',
      'Piutang',
    ];

    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.address.substring(0, 20),
      c.type.toUpperCase(),
      c.totalOrders,
      formatRupiah(c.totalSpent),
      formatRupiah(c.totalDebt),
    ]);

    downloadPdfTable({
      filename: `Data_Pelanggan_${new Date().toISOString().split('T')[0]}`,
      title: 'DAFTAR REKAP DATA PELANGGAN & PIUTANG',
      subtitle: `Total: ${filteredCustomers.length} Pelanggan Terdaftar`,
      headers,
      rows,
    });
    showToast('Dokumen PDF data pelanggan berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggan, no telepon, atau alamat..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">Semua Tipe</option>
            <option value="umum">Umum</option>
            <option value="instansi">Instansi / Sekolah</option>
            <option value="member">Member</option>
            <option value="seller">Reseller / Seller</option>
          </select>
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
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
            title="Cetak Dokumen PDF"
          >
            <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5">Nama Pelanggan</th>
                <th className="py-3 px-3.5">No. WhatsApp</th>
                <th className="py-3 px-3.5">Alamat</th>
                <th className="py-3 px-3.5 text-center">Jenis Klien</th>
                <th className="py-3 px-3.5 text-right">Total Belanja</th>
                <th className="py-3 px-3.5 text-right">Sisa Piutang</th>
                <th className="py-3 px-3.5 text-center">Riwayat Order</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada pelanggan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                      <p className="text-[10px] text-slate-400">Terdaftar: {cust.createdAt}</p>
                    </td>

                    <td className="py-3.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>{cust.phone}</span>
                        {cust.phone && cust.phone !== '-' && (
                          <a
                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-500 max-w-[180px] truncate">
                      {cust.address}
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase dark:bg-blue-950/70 dark:text-blue-300">
                        {cust.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(cust.totalSpent)}
                    </td>

                    <td className="py-3.5 px-3.5 text-right font-mono font-bold">
                      <span
                        className={
                          cust.totalDebt > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {formatRupiah(cust.totalDebt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedCustHistory(cust)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                      >
                        {cust.totalOrders} Nota &rarr;
                      </button>
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Pelanggan"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin hapus pelanggan "${cust.name}"?`)) {
                              deleteCustomer(cust.id);
                              showToast(`Pelanggan "${cust.name}" berhasil dihapus.`, 'info');
                            }
                          }}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h4>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nama Lengkap / Instansi:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nomor WhatsApp:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Alamat Pengiriman / Domisili:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Jenis Pelanggan (Pengaruh ke Tingkat Harga di POS):
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CustomerType)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="umum">Umum (Harga Normal)</option>
                  <option value="instansi">Instansi / Sekolah (Harga Institusi)</option>
                  <option value="member">Member Khusus (Harga Diskon)</option>
                  <option value="seller">Reseller / Advertising (Harga Grosir Termurah)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsOpenModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER TRANSACTION HISTORY MODAL */}
      {selectedCustHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Riwayat Nota: {selectedCustHistory.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tipe: {selectedCustHistory.type} · No HP: {selectedCustHistory.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
              {transactions
                .filter(t => t.customerId === selectedCustHistory.id || t.customerName === selectedCustHistory.name)
                .map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {t.invoiceNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {t.paymentStatus}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                        {t.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-400">{t.createdAt}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(t.grandTotal)}
                        </span>
                        {t.remainingAmount > 0 && (
                          <span className="block text-[10px] font-bold text-rose-600">
                            Sisa: {formatRupiah(t.remainingAmount)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedReceiptTransaction(t)}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                      >
                        Buka Nota
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
