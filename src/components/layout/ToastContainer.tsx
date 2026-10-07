import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] pointer-events-none max-w-md w-full px-4 flex justify-center">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-slideDown max-w-sm sm:max-w-md w-full ${
              isSuccess
                ? 'bg-slate-900/90 text-white border-emerald-500/40 shadow-emerald-950/30'
                : isError
                ? 'bg-rose-950/90 text-rose-100 border-rose-500/50 shadow-rose-950/40'
                : 'bg-slate-900/90 text-white border-blue-500/40 shadow-blue-950/30'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-inner ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isError
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                ) : isError ? (
                  <AlertCircle className="h-4.5 w-4.5" />
                ) : (
                  <Info className="h-4.5 w-4.5" />
                )}
              </div>
              <p className="text-xs font-bold leading-snug truncate sm:whitespace-normal">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
