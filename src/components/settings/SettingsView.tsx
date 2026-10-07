import React, { useState } from 'react';
import {
  Settings,
  Save,
  Printer,
  MessageSquare,
  CreditCard,
  AlertOctagon,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Building,
  Globe,
  Share2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrintFormat, RoundingOption, ShopSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDataToDefault,
    exportBackupJson,
    importBackupJson,
    showToast,
  } = useApp();

  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    showToast('Pengaturan toko dan preferensi berhasil disimpan!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTogglePaymentChannel = (channelId: string) => {
    setForm(prev => ({
      ...prev,
      paymentChannels: prev.paymentChannels.map(ch =>
        ch.id === channelId ? { ...ch, active: !ch.active } : ch
      ),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = importBackupJson(content);
        if (ok) {
          setImportStatus('Data berhasil di-restore dari backup!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setImportStatus('Gagal membaca file JSON backup!');
        }
      }
    };
    reader.readAsText(file);
  };

  const insertTagIntoWa = (tag: string) => {
    setForm(prev => ({
      ...prev,
      waTemplate: prev.waTemplate + ' ' + tag,
    }));
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. TOKO & PREFERENSI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Pengaturan Toko & Identitas Nota
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nama Toko:</label>
              <input
                type="text"
                value={form.shopName}
                onChange={e => setForm({ ...form, shopName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Slogan / Jenis Layanan:
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={e => setForm({ ...form, tagline: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Logo untuk Web */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>Logo untuk Web (Header & Sidebar)</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showWebLogo !== false}
                    onChange={e => setForm({ ...form, showWebLogo: e.target.checked })}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Tampilkan Logo di Web
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                {form.webLogoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm dark:border-slate-700">
                    <img src={form.webLogoUrl} alt="Logo Web" className="h-full w-full object-contain p-0.5" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, webLogoUrl: '' })}
                      className="absolute top-0 right-0 bg-slate-900/80 p-0.5 text-white hover:bg-rose-600 transition"
                      title="Hapus"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    <ImageIcon className="h-5 w-5 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Upload className="h-3 w-3 text-blue-600" />
                      <span>Upload Logo Web</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = evt => {
                              if (evt.target?.result) {
                                setForm({ ...form, webLogoUrl: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.webLogoUrl || ''}
                    onChange={e => setForm({ ...form, webLogoUrl: e.target.value })}
                    placeholder="Atau link URL logo web..."
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Logo untuk Nota */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-emerald-600" />
                  <span>Logo untuk Nota & Struk Cetak</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showReceiptLogo !== false}
                    onChange={e => setForm({ ...form, showReceiptLogo: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Tampilkan Logo di Nota
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                {form.receiptLogoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm dark:border-slate-700">
                    <img src={form.receiptLogoUrl} alt="Logo Nota" className="h-full w-full object-contain p-0.5" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, receiptLogoUrl: '' })}
                      className="absolute top-0 right-0 bg-slate-900/80 p-0.5 text-white hover:bg-rose-600 transition"
                      title="Hapus"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    <ImageIcon className="h-5 w-5 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Upload className="h-3 w-3 text-emerald-600" />
                      <span>Upload Logo Nota</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = evt => {
                              if (evt.target?.result) {
                                setForm({ ...form, receiptLogoUrl: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.receiptLogoUrl || ''}
                    onChange={e => setForm({ ...form, receiptLogoUrl: e.target.value })}
                    placeholder="Atau link URL logo nota..."
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Link Web Publik Cek Pesanan / Tracking:
              </label>
              <input
                type="text"
                value={form.publicTrackingUrl}
                onChange={e => setForm({ ...form, publicTrackingUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">
                Alamat Toko (Tampil di Nota & Struk):
              </label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                No. Telp Toko / Nota:
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                No. WhatsApp Customer Service (CS):
              </label>
              <input
                type="text"
                value={form.whatsappCS}
                onChange={e => setForm({ ...form, whatsappCS: e.target.value })}
                placeholder="081298765432"
                className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Akun Instagram:
              </label>
              <input
                type="text"
                value={form.socialMedia.instagram}
                onChange={e =>
                  setForm({
                    ...form,
                    socialMedia: { ...form.socialMedia, instagram: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Facebook / Web:</label>
              <input
                type="text"
                value={form.socialMedia.facebook}
                onChange={e =>
                  setForm({
                    ...form,
                    socialMedia: { ...form.socialMedia, facebook: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. CETAK NOTA & PEMBULATAN */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Metode Cetak Nota & Pembulatan Harga
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Format Cetak Default:
              </label>
              <select
                value={form.defaultPrintFormat}
                onChange={e => setForm({ ...form, defaultPrintFormat: e.target.value as PrintFormat })}
                className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="a5_landscape">A5 Landscape (Rapi 2 Kolom)</option>
                <option value="a5_portrait">A5 Portrait</option>
                <option value="a6_landscape">A6 Landscape</option>
                <option value="a6_portrait">A6 Portrait</option>
                <option value="thermal_58">Thermal 58mm (Struk Kasir Mini)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Aturan Pembulatan Harga Otomatis:
              </label>
              <select
                value={form.roundingRule}
                onChange={e => setForm({ ...form, roundingRule: e.target.value as RoundingOption })}
                className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="none">Tanpa Pembulatan (Sesuai Pecahan Asli)</option>
                <option value="500">Bulatkan ke Atas Kelipatan Rp 500</option>
                <option value="1000">Bulatkan ke Atas Kelipatan Rp 1.000</option>
                <option value="manual">Manual Input di Kasir POS</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">
                Catatan / Teks Footer Struk Thermal 58mm (Font Tebal/Bold):
              </label>
              <textarea
                value={form.thermalCustomNotes}
                onChange={e => setForm({ ...form, thermalCustomNotes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 3. TEMPLATE PESAN WHATSAPP */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Template Pesan WhatsApp Pelanggan
              </h3>
              <p className="text-[11px] text-slate-500">
                Pesan otomatis yang dikirim ke nomor WA pelanggan saat klik tombol kirim nota
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            {/* Tag Buttons */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-slate-400 mr-1 font-semibold">Klik Tag Keyword:</span>
              {[
                '[NAMA]',
                '[TOKO]',
                '[NOTA]',
                '[STATUS]',
                '[DETAIL_PRODUK]',
                '[TOTAL]',
                '[DP]',
                '[SISA]',
                '[LINK]',
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTagIntoWa(tag)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              value={form.waTemplate}
              onChange={e => setForm({ ...form, waTemplate: e.target.value })}
              rows={8}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* 4. REKENING BANK & QRIS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Rekening Bank & QRIS
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            {form.bankAccounts.map((b, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={b.bank}
                  onChange={e => {
                    const newB = [...form.bankAccounts];
                    newB[idx].bank = e.target.value;
                    setForm({ ...form, bankAccounts: newB });
                  }}
                  placeholder="Bank (BCA/Mandiri)"
                  className="rounded-lg border border-slate-200 p-2 font-bold dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="text"
                  value={b.accountNumber}
                  onChange={e => {
                    const newB = [...form.bankAccounts];
                    newB[idx].accountNumber = e.target.value;
                    setForm({ ...form, bankAccounts: newB });
                  }}
                  placeholder="No. Rekening"
                  className="rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="text"
                  value={b.accountName}
                  onChange={e => {
                    const newB = [...form.bankAccounts];
                    newB[idx].accountName = e.target.value;
                    setForm({ ...form, bankAccounts: newB });
                  }}
                  placeholder="Atas Nama"
                  className="rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 5. CHANNEL PEMBAYARAN DI POS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Metode Pembayaran POS Aktif
              </h3>
              <p className="text-[11px] text-slate-500">
                Metode yang aktif akan muncul saat membuat nota dan pelunasan nota
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {form.paymentChannels.map(ch => (
              <label
                key={ch.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{ch.name}</span>
                <input
                  type="checkbox"
                  checked={ch.active}
                  onChange={() => handleTogglePaymentChannel(ch.id)}
                  className="h-4 w-4 rounded text-blue-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Semua Perubahan</span>
          </button>
        </div>
      </form>

      {/* 6. ZONA BAHAYA (BACKUP, RESTORE & RESET) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-950 dark:bg-rose-950/20">
        <div className="flex items-center gap-2.5 pb-4 border-b border-rose-200/70 dark:border-rose-900/50">
          <AlertOctagon className="h-5 w-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">
              6. Zona Bahaya & Backup Data Toko
            </h3>
            <p className="text-[11px] text-rose-700 dark:text-rose-400">
              Backup seluruh database transaksi, produk, pelanggan, atau reset ke pengaturan awal
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="mt-3 rounded-lg bg-white p-2.5 text-xs font-bold text-rose-800 shadow dark:bg-slate-800 dark:text-rose-300">
            {importStatus}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Export JSON */}
          <button
            type="button"
            onClick={exportBackupJson}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Download Backup Data (.JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Restore / Import Data Backup</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Reset All */}
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA dan mengembalikan ke data awal demo toko?'
                )
              ) {
                resetDataToDefault();
                showToast('Data berhasil di-reset ke data bawaan demo!', 'info');
                setTimeout(() => window.location.reload(), 1000);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Data ke Bawaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
