import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  Printer,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/currency';

export const AlertUnpaidModal: React.FC = () => {
  const {
    showAlertModal,
    setShowAlertModal,
    unpaidTransactions,
    pendingProductionTransactions,
    setCurrentPage,
    setSelectedReceiptTransaction,
    updateProductionStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'unpaid' | 'pending'>('unpaid');

  if (!showAlertModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Peringatan Operasional & Antrean
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau nota belum lunas dan pesanan yang belum selesai dikerjakan
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlertModal(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex border-b border-slate-100 px-5 pt-3 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition ${
              activeTab === 'unpaid'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Nota Belum Lunas ({unpaidTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`ml-6 flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Belum Dikerjakan / Antrean ({pendingProductionTransactions.length})</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'unpaid' ? (
            unpaidTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                Semua nota saat ini telah lunas! Tidak ada piutang tertunggak.
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidTransactions.map(trx => (
                  <div
                    key={trx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 dark:border-rose-900/30 dark:bg-rose-950/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                          {trx.invoiceNumber}
                        </span>
                        <span className="text-[10px] rounded bg-rose-200/80 px-1.5 py-0.5 font-bold uppercase text-rose-900 dark:bg-rose-900 dark:text-rose-200">
                          {trx.paymentStatus === 'dp' ? 'Uang Muka (DP)' : 'Belum Lunas'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                        {trx.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total: {formatRupiah(trx.grandTotal)} · Terbayar: {formatRupiah(trx.dpAmount)}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-200/40">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block">Sisa Hutang / Piutang:</span>
                        <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                          {formatRupiah(trx.remainingAmount)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowAlertModal(false);
                          setCurrentPage('transactions');
                        }}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-700 transition"
                      >
                        <span>Kelola Nota</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : pendingProductionTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              Semua order telah selesai diproduksi dan diserahkan!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProductionTransactions.map(trx => (
                <div
                  key={trx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {trx.invoiceNumber}
                      </span>
                      <span className="text-[10px] rounded bg-blue-200/80 px-1.5 py-0.5 font-bold uppercase text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                        {trx.productionStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      {trx.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {trx.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(' · ')}
                    </p>
                    {trx.deadline && (
                      <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        Target Deadline: {trx.deadline}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        updateProductionStatus(trx.id, 'cetak', 'Dijalankan dari peringatan antrean');
                      }}
                      className="rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300"
                    >
                      Mulai Cetak
                    </button>
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        setCurrentPage('transactions');
                      }}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <span>Lihat Detail</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xs text-slate-500">
            Total Perhatian: {unpaidTransactions.length} Belum Lunas · {pendingProductionTransactions.length} Belum Selesai
          </p>
          <button
            onClick={() => {
              setShowAlertModal(false);
              setCurrentPage('transactions');
            }}
            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            Buka Semua Transaksi &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
