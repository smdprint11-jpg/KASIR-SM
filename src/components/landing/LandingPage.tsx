import React, { useState, useMemo } from 'react';
import {
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  LogIn,
  Package,
  Sparkles,
  Phone,
  MapPin,
  MessageCircle,
  Copy,
  Scissors,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface LandingPageProps {
  onOpenTracker: (invoice?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenTracker }) => {
  const {
    login,
    theme,
    toggleTheme,
    settings,
    switchRoleQuick,
    transactions,
    products,
    categories,
  } = useApp();

  const [inputNota, setInputNota] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState('pemilik');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeCatFilter, setActiveCatFilter] = useState<string>('all');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNota.trim()) return;
    onOpenTracker(inputNota.trim());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const result = login(username, password);
    if (!result.success) {
      setLoginError(result.message || 'Login gagal!');
    } else {
      setIsLoginModalOpen(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchRoleQuick(role);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070D1F] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* 1. TOP BAR NAVIGATION */}
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#070D1F]/90 px-6 backdrop-blur-md lg:px-12">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          {settings.showWebLogo !== false && (settings.webLogoUrl || settings.logoUrl) ? (
            <img
              src={settings.webLogoUrl || settings.logoUrl}
              alt="Logo"
              className="h-11 w-11 object-contain rounded-2xl bg-white/10 p-1 border border-slate-700/80 shadow-md"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 shadow-lg shadow-blue-600/30">
              <Printer className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <span className="block text-lg font-black tracking-wider text-white">
              {settings.shopName || 'SM DIGITAL PRINTING'}
            </span>
            <span className="block text-[11px] font-medium tracking-wide text-cyan-400">
              Pusat Percetakan Modern & Fotocopy
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <a href="#lacak" className="hover:text-cyan-400 transition">
            Lacak Nota
          </a>
          <a href="#layanan" className="hover:text-cyan-400 transition">
            Layanan
          </a>
          <a href="#produk" className="hover:text-cyan-400 transition">
            Katalog & Harga
          </a>
          <a href="#kontak" className="hover:text-cyan-400 transition">
            Kontak CS
          </a>
        </nav>

        {/* Actions Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition"
            title="Ganti Tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:brightness-110 transition"
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk Kasir / Staf</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:px-12 lg:pt-24 lg:pb-32">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Kualitas Tajam CMYK · Berkecepatan Tinggi · Pelacakan Online</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white max-w-4xl mx-auto leading-tight">
            Solusi Percetakan Digital & Fotocopy Modern Presisi Tinggi
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Dari spanduk banner outdoor berukuran raksasa, stiker label kemasan cutting, brosur
            offset digital, hingga fotocopy dokumen penting. Pantau progres pengerjaan pesanan
            Anda secara transparan dan real-time.
          </p>

          {/* Real-time Order Tracking Box in Hero */}
          <div id="lacak" className="mt-10 mx-auto max-w-2xl rounded-2xl border border-blue-500/40 bg-slate-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 text-left">
              <Search className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Lacak Status Nota Pesanan Anda Sekarang:
              </span>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputNota}
                onChange={e => setInputNota(e.target.value)}
                placeholder="Masukkan Nomor Nota (Contoh: SM-202610-001)..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
              >
                <span>Cek Progres Cetak</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 text-left">
              <span>Coba lacak nota demo:</span>
              {transactions.slice(0, 3).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenTracker(t.invoiceNumber)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 hover:border-cyan-500 transition"
                >
                  {t.invoiceNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. LAYANAN & SPESIFIKASI */}
      <section id="layanan" className="border-t border-slate-800/80 bg-[#0A1227] px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Layanan Utama
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white">
              Kebutuhan Cetak Terlengkap Dalam Satu Tempat
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400">
              Dikerjakan dengan mesin digital printing mutakhir untuk hasil warna memukau dan daya tahan optimal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Outdoor & Spanduk Banner',
                desc: 'Flexy 280g, Korea 440g, Korchin tebal tahan cuaca panas dan hujan, X-Banner, Roll Up display.',
                tag: 'Mulai Rp 15.000 / m²',
                icon: Printer,
              },
              {
                title: 'Stiker & Label Cutting Kemasan',
                desc: 'Stiker Vinyl waterproof, Chromo glossy, transparan, kiss-cut pola bebas siap tempel botol & makanan.',
                tag: 'Kiss-cut Presisi',
                icon: Scissors,
              },
              {
                title: 'Digital Offset A3+ Cepat',
                desc: 'Cetak brosur, flyer, kartu nama 2 sisi laminasi doff/glossy, sertifikat, poster promosi tajam.',
                tag: 'Art Paper & Carton',
                icon: Layers,
              },
              {
                title: 'Fotocopy & Penjilidan Dokumen',
                desc: 'Fotocopy B/W & Full Color kecepatan tinggi, jilid spiral kawat mika, hardcover skripsi rapi.',
                tag: 'Hasil Pekat & Bersih',
                icon: Copy,
              },
              {
                title: 'Merchandise & Souvenir Custom',
                desc: 'Cetak mug keramik sublimasi, gantungan kunci, pin promosi, lanyard, dan ID Card instansi.',
                tag: 'Bisa Satuan & Lusinan',
                icon: Package,
              },
              {
                title: 'Desain Grafis & Setting File',
                desc: 'Layanan asistensi tata letak, RIP file warna, vectoring logo, dan setting siap cetak presisi.',
                tag: 'Operator Berpengalaman',
                icon: Sparkles,
              },
            ].map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm hover:border-blue-500/50 hover:bg-slate-900 transition"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-cyan-400 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">{srv.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{srv.desc}</p>
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                    <span>{srv.tag}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. KATALOG HARGA PREVIEW & PRODUK WEB */}
      <section id="produk" className="border-t border-slate-800/80 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Katalog Produk & Transparansi Biaya
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                Daftar Produk & Layanan Cetak
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Harga live terintegrasi langsung dengan database kasir. Tersedia tarif khusus Umum, Member, dan Reseller Percetakan.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActiveCatFilter('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeCatFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              Semua Produk ({products.filter(p => p.showOnLandingPage !== false).length})
            </button>
            {categories.map(cat => {
              const count = products.filter(
                p => p.categoryId === cat.id && p.showOnLandingPage !== false
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCatFilter(cat.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeCatFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards with Thumbnails & Real Data */}
          {(() => {
            const visibleProducts = products.filter(
              p =>
                p.showOnLandingPage !== false &&
                (activeCatFilter === 'all' || p.categoryId === activeCatFilter)
            );

            if (visibleProducts.length === 0) {
              return (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 text-xs">
                  Belum ada produk yang ditampilkan di kategori ini.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {visibleProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-900 transition shadow-lg"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center text-slate-600">
                            <ImageIcon className="h-8 w-8 opacity-40 mb-1" />
                            <span className="text-[10px]">Percetakan Modern</span>
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/80 px-2 py-0.5 text-[9px] font-black uppercase text-cyan-300 backdrop-blur-md border border-slate-700/80">
                          /{prod.unit}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="rounded bg-blue-950/80 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-blue-800">
                            {categories.find(c => c.id === prod.categoryId)?.name || 'Produk'}
                          </span>
                          {prod.isCustomDimension && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold text-slate-300">
                              Meteran (P x L)
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                          {prod.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {prod.material}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-slate-800/80 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-slate-400">Harga Umum:</span>
                          <span className="font-mono text-base font-black text-cyan-300">
                            Rp {prod.priceUmum.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Reseller Cetak:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            Rp {prod.priceSeller.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Member Khusus:</span>
                          <span className="font-mono font-semibold text-blue-300">
                            Rp {prod.priceMember.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* 5. KONTAK & FOOTER */}
      <footer id="kontak" className="border-t border-slate-800 bg-[#050A18] px-6 py-16 lg:px-12 text-xs text-slate-400">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {settings.showWebLogo !== false && (settings.webLogoUrl || settings.logoUrl) ? (
                <img
                  src={settings.webLogoUrl || settings.logoUrl}
                  alt="Logo"
                  className="h-10 w-10 object-contain rounded-xl bg-white/10 p-1 border border-slate-800 shadow-sm"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  SM
                </div>
              )}
              <span className="text-base font-black text-white">{settings.shopName}</span>
            </div>
            <p className="leading-relaxed">{settings.tagline}</p>
            <p className="mt-3 flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>{settings.address}</span>
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Jam Operasional Toko</h4>
            <div className="space-y-1.5">
              <p className="flex justify-between">
                <span>Senin - Jumat:</span>
                <span className="text-white font-mono">08:00 - 21:00 WIB</span>
              </p>
              <p className="flex justify-between">
                <span>Sabtu:</span>
                <span className="text-white font-mono">08:00 - 18:00 WIB</span>
              </p>
              <p className="flex justify-between">
                <span>Minggu:</span>
                <span className="text-amber-400 font-semibold">Tutup / Janji Khusus</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Hubungi Langsung</h4>
            <p className="mb-3">
              Konsultasi file cetak, penawaran instansi, dan informasi harga grosir:
            </p>
            <a
              href={`https://wa.me/${settings.whatsappCS}?text=Halo%20SM%20Digital%20Printing,%20saya%20ingin%20tanya%20layanan%20cetak`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-md hover:bg-emerald-500 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat CS WhatsApp: {settings.phone}</span>
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-6xl pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p>© 2026 {settings.shopName}. Hak Cipta Dilindungi.</p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-cyan-400 hover:underline font-semibold"
          >
            Portal Login Staf Kasir & Operator &rarr;
          </button>
        </div>
      </footer>

      {/* MULTI LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B132B] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Login Multi User SM POS</h3>
                  <p className="text-[11px] text-slate-400">Masuk ke sistem kasir percetakan</p>
                </div>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Role Fill Buttons for effortless testing */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                Pilih Akses Cepat (1-Klik Masuk Demo):
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pemilik')}
                  className="rounded-lg bg-purple-900/40 border border-purple-700/60 py-2 font-bold text-purple-300 hover:bg-purple-800/50 transition text-center"
                >
                  👑 Pemilik
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('kasir')}
                  className="rounded-lg bg-blue-900/40 border border-blue-700/60 py-2 font-bold text-blue-300 hover:bg-blue-800/50 transition text-center"
                >
                  💼 Kasir
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('operator')}
                  className="rounded-lg bg-amber-900/40 border border-amber-700/60 py-2 font-bold text-amber-300 hover:bg-amber-800/50 transition text-center"
                >
                  ⚙️ Operator
                </button>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3 text-xs">
              {loginError && (
                <div className="rounded-lg bg-rose-950/80 border border-rose-800 p-2 text-rose-300 font-semibold text-[11px]">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="pemilik / kasir / operator"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition text-xs mt-2"
              >
                Masuk ke Aplikasi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
