import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Layers,
  ChevronDown,
  Printer,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenQuickTrack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickTrack }) => {
  const {
    currentUser,
    logout,
    theme,
    toggleTheme,
    switchRoleQuick,
    currentPage,
    setCurrentPage,
    unpaidTransactions,
    pendingProductionTransactions,
    setShowAlertModal,
  } = useApp();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'pos':
        return 'Buat Nota & Kasir (POS)';
      case 'transactions':
        return 'Data Transaksi & Nota';
      case 'customers':
        return 'Data Pelanggan & Piutang';
      case 'customer-reports':
        return 'Laporan Order Pelanggan';
      case 'cashflow':
        return 'Alur Kas Operasional';
      case 'products':
        return 'Produk, Kategori & Stok';
      case 'expenses':
        return 'Pengeluaran Kas';
      case 'financial-reports':
        return 'Laporan Keuangan & Laba Rugi';
      case 'users':
        return 'Kelola Akun & Pengguna';
      case 'settings':
        return 'Pengaturan Toko & Preferensi';
      default:
        return 'SM DIGITAL PRINTING';
    }
  };

  const urgentAlertCount = unpaidTransactions.length + pendingProductionTransactions.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      {/* Zone 1 & 2: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold uppercase tracking-wider text-blue-600 sm:inline dark:text-blue-400">
            SM POS v1.0
          </span>
          <span className="hidden text-slate-300 sm:inline dark:text-slate-700">/</span>
          <h1 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
            {getPageTitle(currentPage)}
          </h1>
        </div>
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Track Search Button */}
        <button
          onClick={onOpenQuickTrack}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 sm:px-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Lacak Pesanan Cepat"
        >
          <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden md:inline">Cek Nota</span>
        </button>

        {/* Urgent Alerts Bell (Unpaid / Pending production) */}
        <button
          onClick={() => setShowAlertModal(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Peringatan Nota Belum Lunas & Antrean Produksi"
        >
          <Bell className="h-4 w-4" />
          {urgentAlertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {urgentAlertCount}
            </span>
          )}
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Quick Role Switcher (Allows testing Pemilik / Kasir / Operator) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="hidden items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 lg:flex dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
            title="Ganti Peran Cepat untuk Demo"
          >
            <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="capitalize">Role: {currentUser?.role || 'Guest'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Ganti Peran Akun:
              </div>
              {(['pemilik', 'kasir', 'operator'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    switchRoleQuick(role);
                    setShowRoleDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition ${
                    currentUser?.role === role
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{role}</span>
                  {currentUser?.role === role && <span className="text-[10px]">Aktif</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-900 text-xs font-bold text-white dark:bg-blue-600">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-semibold leading-none text-slate-900 dark:text-white">
                {currentUser?.name || 'Pengguna'}
              </p>
              <p className="text-[10px] capitalize leading-none text-slate-500 dark:text-slate-400">
                {currentUser?.role || 'Akses Terbatas'}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-slate-500 capitalize dark:text-slate-400">
                  Peran: {currentUser?.role} ({currentUser?.username})
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentPage('landing');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Lihat Landing Page Publik</span>
                </button>
                {currentUser?.role === 'pemilik' && (
                  <button
                    onClick={() => {
                      setCurrentPage('users');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Kelola Pengguna</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
