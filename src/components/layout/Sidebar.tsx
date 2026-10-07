import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  UserCheck,
  Wallet,
  Package,
  TrendingDown,
  BarChart3,
  UserCog,
  Settings,
  Globe,
  LogOut,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, currentUser, logout, settings, unpaidTransactions } = useApp();

  const role = currentUser?.role || 'kasir';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: number;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      roles: ['pemilik', 'kasir', 'operator'],
    },
    {
      id: 'pos',
      label: 'Buat Nota (POS)',
      icon: ShoppingCart,
      roles: ['pemilik', 'kasir'],
    },
    {
      id: 'transactions',
      label: 'Data Transaksi',
      icon: Receipt,
      roles: ['pemilik', 'kasir', 'operator'],
      badge: unpaidTransactions.length > 0 ? unpaidTransactions.length : undefined,
    },
    {
      id: 'customers',
      label: 'Data Pelanggan',
      icon: Users,
      roles: ['pemilik', 'kasir'],
    },
    {
      id: 'customer-reports',
      label: 'Laporan Pelanggan',
      icon: UserCheck,
      roles: ['pemilik', 'kasir'],
    },
    {
      id: 'cashflow',
      label: 'Alur Kas',
      icon: Wallet,
      roles: ['pemilik', 'kasir'],
    },
    {
      id: 'products',
      label: 'Produk & Stok',
      icon: Package,
      roles: ['pemilik', 'kasir', 'operator'],
    },
    {
      id: 'expenses',
      label: 'Pengeluaran Kas',
      icon: TrendingDown,
      roles: ['pemilik', 'kasir'],
    },
    {
      id: 'financial-reports',
      label: 'Laporan Keuangan',
      icon: BarChart3,
      roles: ['pemilik'],
    },
    {
      id: 'users',
      label: 'Kelola Akun',
      icon: UserCog,
      roles: ['pemilik'],
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      roles: ['pemilik', 'kasir'],
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-[#0B132B] text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
        {settings.showWebLogo !== false && (settings.webLogoUrl || settings.logoUrl) ? (
          <img
            src={settings.webLogoUrl || settings.logoUrl}
            alt="Logo"
            className="h-10 w-10 object-contain rounded-xl bg-white/10 p-1 border border-slate-700/80 shadow-md"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 shadow-md shadow-blue-900/30">
            <Printer className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-extrabold tracking-wide text-white">
            {settings.shopName || 'SM DIGITAL PRINTING'}
          </span>
          <span className="text-[10px] font-medium text-cyan-400">
            Sistem Kasir v1.0
          </span>
        </div>
      </div>

      {/* Role Pill Indicator */}
      <div className="mx-4 mt-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Status Akses:</span>
          <span className="rounded bg-blue-950 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-300 border border-blue-800">
            {role}
          </span>
        </div>
        <div className="mt-1 truncate text-[11px] font-medium text-slate-200">
          {currentUser?.name}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-700/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Public Link & Logout */}
      <div className="border-t border-slate-800 p-3 space-y-1.5">
        <button
          onClick={() => setCurrentPage('landing')}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Landing Page Web</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar (Log Out)</span>
        </button>
      </div>
    </aside>
  );
};
