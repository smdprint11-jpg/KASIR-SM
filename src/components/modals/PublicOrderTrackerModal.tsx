import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Package,
  Layers,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/currency';
import { ProductionStatus } from '../../types';
import { generateQrMatrix, getQrSvgPath } from '../../utils/qrCode';

interface PublicOrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: string;
}

export const PublicOrderTrackerModal: React.FC<PublicOrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialInvoice,
}) => {
  const { transactions, settings, openWhatsAppOrder } = useApp() as any;
  const [searchNota, setSearchNota] = useState('');
  const [searchedTrx, setSearchedTrx] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialInvoice) {
      setSearchNota(initialInvoice);
      handleSearch(initialInvoice);
    } else {
      setSearchNota('');
      setSearchedTrx(null);
      setHasSearched(false);
    }
  }, [initialInvoice, isOpen]);

  if (!isOpen) return null;

  const handleSearch = (query = searchNota) => {
    const clean = query.trim().toUpperCase();
    if (!clean) return;
    const found = transactions.find(
      (t: any) =>
        t.invoiceNumber.toUpperCase() === clean ||
        t.customerPhone.includes(clean) ||
        t.invoiceNumber.toUpperCase().endsWith(clean)
    );
    setSearchedTrx(found || null);
    setHasSearched(true);
  };

  const steps: { key: ProductionStatus; label: string; desc: string }[] = [
    { key: 'antrean', label: 'Antrean Masuk', desc: 'Nota diterima kasir' },
    { key: 'desain', label: 'Cek File & Setting', desc: 'Penyesuaian ukuran & RIP file' },
    { key: 'cetak', label: 'Sedang Cetak', desc: 'Mesin plotter / printer beroperasi' },
    { key: 'finishing', label: 'Finishing & QC', desc: 'Mata ayam, potong, laminasi, jilid' },
    { key: 'siap_ambil', label: 'Siap Diambil', desc: 'Pesanan rapi di kasir pengambilan' },
    { key: 'selesai', label: 'Pesanan Selesai', desc: 'Telah diserahkan ke pelanggan' },
  ];

  const getStepIndex = (status: ProductionStatus) => {
    return steps.findIndex(s => s.key === status);
  };

  const currentStepIdx = searchedTrx ? getStepIndex(searchedTrx.productionStatus) : 0;

  // Tracking link
  const trackingLink = `${window.location.origin}/#track?nota=${searchedTrx?.invoiceNumber || ''}`;
  const qrMatrix = searchedTrx ? generateQrMatrix(trackingLink) : [];
  const qrPath = searchedTrx ? getQrSvgPath(qrMatrix, 3) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pelacakan Pesanan Real-time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lacak progres cetak pesanan di {settings.shopName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchNota}
                onChange={e => setSearchNota(e.target.value)}
                placeholder="Masukkan Nomor Nota (Contoh: SM-202610-001) atau No HP..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Lacak Nota
            </button>
          </form>

          {/* Quick Demo Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Contoh nota siap dicek:</span>
            {transactions.slice(0, 3).map((trx: any) => (
              <button
                key={trx.id}
                type="button"
                onClick={() => {
                  setSearchNota(trx.invoiceNumber);
                  handleSearch(trx.invoiceNumber);
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-blue-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
              >
                {trx.invoiceNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {searchedTrx ? (
            <div className="space-y-6">
              {/* Order Meta Card */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                      {searchedTrx.invoiceNumber}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {searchedTrx.customerName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Diterima: {searchedTrx.createdAt} · Kasir: {searchedTrx.cashierName}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        searchedTrx.paymentStatus === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : searchedTrx.paymentStatus === 'dp'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}
                    >
                      Status Bayar:{' '}
                      {searchedTrx.paymentStatus === 'lunas'
                        ? 'LUNAS'
                        : searchedTrx.paymentStatus === 'dp'
                        ? 'UANG MUKA (DP)'
                        : 'BELUM LUNAS'}
                    </span>
                    {searchedTrx.deadline && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Target Selesai: {searchedTrx.deadline}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-blue-200/50 pt-3 text-center dark:border-blue-900/40">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Biaya</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {formatRupiah(searchedTrx.grandTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Telah Dibayar (DP)</p>
                    <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(searchedTrx.dpAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Sisa Tagihan</p>
                    <p
                      className={`font-mono text-sm font-bold ${
                        searchedTrx.remainingAmount > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formatRupiah(searchedTrx.remainingAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div>
                <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tahapan Pengerjaan Produksi
                </h5>
                <div className="space-y-3">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50/40 dark:border-blue-500/50 dark:bg-blue-950/30'
                            : isDone
                            ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                            : 'border-slate-100 bg-slate-50/40 opacity-50 dark:border-slate-800 dark:bg-slate-800/20'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : isCurrent ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white animate-pulse">
                              <Clock className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-400 dark:border-slate-700">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-blue-700 dark:text-blue-400'
                                  : isDone
                                  ? 'text-emerald-800 dark:text-emerald-300'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Sedang Berjalan
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Daftar Pesanan ({searchedTrx.items.length} Item)
                </h5>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {searchedTrx.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.width && item.length
                            ? `${item.width} x ${item.length} m (${item.areaM2} m²) · `
                            : ''}
                          {item.qty} {item.unit} @ {formatRupiah(item.pricePerUnit)}
                          {item.notes ? ` · Catatan: ${item.notes}` : ''}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code and Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-1.5 shadow-sm">
                    <svg
                      width="75"
                      height="75"
                      viewBox={`0 0 ${qrMatrix.length * 3} ${qrMatrix.length * 3}`}
                      className="shape-rendering-crispEdges"
                    >
                      <path d={qrPath} fill="#000" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Kode QR Pelacakan
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Scan dengan kamera ponsel untuk membuka nota online ini
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${settings.whatsappCS}?text=Halo%20SM%20Digital%20Printing,%20saya%20mau%20konfirmasi%20nota%20${searchedTrx.invoiceNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Hubungi CS WhatsApp</span>
                </a>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                Nota Tidak Ditemukan
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pastikan nomor nota yang Anda masukkan sudah benar (misal: SM-202610-001)
              </p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-blue-500/40" />
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                Cari Nomor Nota Anda
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ketik nomor nota pada kolom pencarian di atas untuk melihat status cetak
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
