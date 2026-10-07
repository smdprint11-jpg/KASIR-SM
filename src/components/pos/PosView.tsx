import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  RotateCcw,
  Info,
  Calendar,
  AlertCircle,
  Copy,
  Package,
  Users,
  UserCheck,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CustomerType,
  PaymentMethod,
  PaymentStatus,
  TransactionItem,
  UnitType,
} from '../../types';
import { applyRounding, formatRupiah, formatNumber } from '../../utils/currency';

export const PosView: React.FC = () => {
  const {
    products,
    customers,
    addCustomer,
    addTransaction,
    settings,
    currentUser,
    setSelectedReceiptTransaction,
    playPosBeep,
    showToast,
  } = useApp();

  // 1. Data Pelanggan
  const [customerName, setCustomerName] = useState<string>('PELANGGAN SM PRINTING');
  const [customerPhone, setCustomerPhone] = useState<string>('6285777753227');
  const [customerType, setCustomerType] = useState<CustomerType>('umum');
  const [showCustSuggestions, setShowCustSuggestions] = useState<boolean>(false);
  const [isCustPickerModalOpen, setIsCustPickerModalOpen] = useState<boolean>(false);
  const [custModalSearch, setCustModalSearch] = useState<string>('');

  // Matching customers as user types in input
  const matchingCustomers = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q) return customers.slice(0, 5);
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerName]);

  // Is current customer an existing saved customer?
  const matchedCustomerObj = useMemo(() => {
    return customers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase());
  }, [customers, customerName]);

  const handleSelectCustomer = (c: { name: string; phone: string; type: CustomerType }) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone && c.phone !== '-' ? c.phone : '');
    setCustomerType(c.type);
    setShowCustSuggestions(false);
    setIsCustPickerModalOpen(false);
    showToast(`Pelanggan "${c.name}" terpilih! No. WA & Tipe disinkronkan.`, 'success');
  };

  // 2. Service Tab / Mode Calculator
  type ServiceTab = 'meteran' | 'fotocopy' | 'satuan';
  const [activeTab, setActiveTab] = useState<ServiceTab>('meteran');

  // Calculator Fields
  // Product options based on tab
  const tabProducts = useMemo(() => {
    if (activeTab === 'meteran') {
      return products.filter(p => p.unit === 'meter' || p.isCustomDimension);
    }
    if (activeTab === 'fotocopy') {
      return products.filter(p => p.unit === 'lembar' || p.categoryId === 'cat-fotocopy');
    }
    return products.filter(p => p.unit !== 'meter' && !p.isCustomDimension);
  }, [products, activeTab]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    tabProducts[0]?.id || products[0]?.id || ''
  );

  // Sync selected product if tab changes
  React.useEffect(() => {
    if (tabProducts.length > 0) {
      setSelectedProductId(tabProducts[0].id);
    }
  }, [activeTab, tabProducts]);

  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || tabProducts[0] || products[0];
  }, [products, selectedProductId, tabProducts]);

  // Dimension inputs (Panjang x Lebar)
  const [dimWidth, setDimWidth] = useState<number>(1);
  const [dimLength, setDimLength] = useState<number>(1);
  const [qty, setQty] = useState<number>(1);

  // Finishing & Mata Ayam options (Pilih atau Manual)
  const finishingOptions = [
    'Mata Ayam 4 Pojok (Plong)',
    'Mata Ayam Keliling (Jarak 1m)',
    'Selongsong Kiri - Kanan (Bambu)',
    'Selongsong Atas - Bawah',
    'Lebihan Putih Keliling 2cm',
    'Potong Pas Gambar (Tanpa Lebih)',
    'Laminasi Dingin Doff Anti-Gores',
    'Laminasi Dingin Glossy Kilap',
    'Jilid Spiral Kawat + Cover Mika',
    'Jilid Lakban Hitam + Mika',
    'Lipat Tengah & Stapler',
    'Tanpa Finishing (Polos)',
  ];
  const [isFinishingManual, setIsFinishingManual] = useState<boolean>(false);
  const [selectedFinishing, setSelectedFinishing] = useState<string>(finishingOptions[0]);
  const [customFinishingText, setCustomFinishingText] = useState<string>('');

  // Bahan Cetak (Pilih dari Produk atau Manual)
  const [isMaterialManual, setIsMaterialManual] = useState<boolean>(false);
  const [customMaterialText, setCustomMaterialText] = useState<string>('');

  // Harga (Otomatis dari Produk / Segmen atau Manual)
  const [isPriceManual, setIsPriceManual] = useState<boolean>(false);
  const [customPriceValue, setCustomPriceValue] = useState<number>(0);

  // Items List in Nota
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);

  // Bottom Options
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.toISOString().split('T')[0]} 17:00`;
  });

  // Bulatan Harga (User requested menu bulatan harga)
  type RoundingMenuOption = 'none' | '500' | '1000' | 'manual';
  const [roundingMenu, setRoundingMenu] = useState<RoundingMenuOption>(
    (settings.roundingRule as RoundingMenuOption) || '500'
  );
  const [manualRoundingValue, setManualRoundingValue] = useState<number>(0);

  // Helper to get price per customer segment
  const getProductPrice = (prod = activeProduct, type = customerType): number => {
    if (!prod) return 0;
    switch (type) {
      case 'member':
        return prod.priceMember;
      case 'seller':
        return prod.priceSeller;
      case 'instansi':
        return prod.priceInstansi;
      case 'umum':
      default:
        return prod.priceUmum;
    }
  };

  // Add Item to Nota
  const handleAddItem = () => {
    if (!activeProduct) return;
    playPosBeep();

    // Determine price
    const baseAutoPrice = getProductPrice(activeProduct, customerType);
    const finalPrice = isPriceManual && customPriceValue > 0 ? customPriceValue : baseAutoPrice;

    // Determine finishing notes
    const finalFinishing = isFinishingManual
      ? (customFinishingText.trim() || 'Custom Finishing')
      : (selectedFinishing !== 'Tanpa Finishing (Polos)' ? selectedFinishing : undefined);

    // Determine material
    const finalMaterial = isMaterialManual
      ? (customMaterialText.trim() || 'Bahan Kustom')
      : activeProduct.material;

    let effectiveArea: number | undefined = undefined;
    let itemSubtotal = 0;

    if (activeTab === 'meteran' || activeProduct.isCustomDimension) {
      const area = parseFloat((dimWidth * dimLength).toFixed(2));
      effectiveArea = area < 1 ? 1 : area; // Minimum 1 m2 standard printing rule
      itemSubtotal = Math.round(effectiveArea * qty * finalPrice);
    } else {
      itemSubtotal = Math.round(qty * finalPrice);
    }

    const newItem: TransactionItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: activeProduct.id,
      productName: activeProduct.name,
      unit: activeProduct.unit,
      width: activeTab === 'meteran' ? dimWidth : undefined,
      length: activeTab === 'meteran' ? dimLength : undefined,
      areaM2: effectiveArea,
      qty,
      pricePerUnit: finalPrice,
      subtotal: itemSubtotal,
      material: finalMaterial,
      notes: finalFinishing,
    };

    setCartItems(prev => [...prev, newItem]);
    showToast(`Berhasil menambahkan "${activeProduct.name}" ke nota!`, 'success');
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(it => it.id !== id));
    showToast('Item berhasil dihapus dari nota', 'info');
  };

  // Subtotal, Discount, Rounding, Grand Total
  const subtotal = cartItems.reduce((acc, it) => acc + it.subtotal, 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // Apply Bulatan Harga
  const { roundedTotal, roundingDiff } = useMemo(() => {
    return applyRounding(afterDiscount, roundingMenu, manualRoundingValue);
  }, [afterDiscount, roundingMenu, manualRoundingValue]);

  const totalAkhir = roundedTotal;

  // Sisa Piutang
  const sisaPiutang = Math.max(0, totalAkhir - paidAmount);

  // Set paid to Lunas / DP 50%
  const handleSetPaidFull = () => {
    setPaidAmount(totalAkhir);
  };
  const handleSetPaidHalf = () => {
    setPaidAmount(Math.round(totalAkhir / 2));
  };
  const handleSetPaidZero = () => {
    setPaidAmount(0);
  };

  // Submit and create Nota Resmi
  const handleSaveAndCreateNota = () => {
    if (cartItems.length === 0) {
      showToast('Daftar pesanan masih kosong! Silakan tambahkan item terlebih dahulu.', 'error');
      return;
    }

    // Determine payment status
    let statusBayar: PaymentStatus = 'lunas';
    if (paidAmount >= totalAkhir) {
      statusBayar = 'lunas';
    } else if (paidAmount > 0) {
      statusBayar = 'dp';
    } else {
      statusBayar = 'belum_lunas';
    }

    // Find or link customer
    let custId = 'cust-walkin';
    const existingCust = customers.find(
      c => c.name.toLowerCase() === customerName.trim().toLowerCase()
    );
    if (existingCust) {
      custId = existingCust.id;
    } else if (customerName.trim()) {
      const newC = addCustomer({
        name: customerName.trim(),
        phone: customerPhone.trim() || '-',
        address: '-',
        type: customerType,
      });
      custId = newC.id;
    }

    const createdTrx = addTransaction({
      customerId: custId,
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone.trim() || '-',
      customerType,
      items: cartItems,
      subtotal,
      discount: discountAmount,
      rounding: roundingDiff,
      grandTotal: totalAkhir,
      dpAmount: paidAmount,
      remainingAmount: sisaPiutang,
      paymentStatus: statusBayar,
      productionStatus: 'antrean',
      paymentMethod,
      cashierName: currentUser?.name || 'Kasir',
      notes: orderNotes.trim() || undefined,
      deadline,
    });

    // Reset fields
    setCartItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setOrderNotes('');

    // Open receipt modal
    setSelectedReceiptTransaction(createdTrx);
    showToast(`Nota resmi ${createdTrx.invoiceNumber} berhasil dibuat! Siap cetak atau kirim WA.`, 'success');
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* 1. MODAL-LIKE HEADER (As shown in screenshot) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Input Nota & Pesanan Percetakan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kalkulator otomatis spanduk meteran, fotocopy lembaran, finishing & ATK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            KASIR: {currentUser?.name || 'Staf'}
          </span>
        </div>
      </div>

      {/* 2. CUSTOMER DATA ROW WITH AUTOMATIC CUSTOMER PICKER */}
      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Data Pelanggan & Pemesan
            </span>
            {matchedCustomerObj && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <UserCheck className="h-3 w-3" />
                <span>Pelanggan Terdaftar ({matchedCustomerObj.type.toUpperCase()})</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCustPickerModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Pilih Pelanggan Otomatis ({customers.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Customer Name with Autocomplete Suggestions */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-600 dark:text-slate-300 font-bold">
                Nama Pelanggan *
              </label>
              {customerName && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerType('umum');
                  }}
                  className="text-[10px] font-semibold text-rose-500 hover:underline"
                >
                  Reset / Baru
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={e => {
                  setCustomerName(e.target.value);
                  setShowCustSuggestions(true);
                }}
                onFocus={() => setShowCustSuggestions(true)}
                placeholder="Ketik atau pilih nama pelanggan..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCustSuggestions(!showCustSuggestions)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showCustSuggestions && matchingCustomers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Pilih Cepat Pelanggan Tersimpan:
                </div>
                {matchingCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{c.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">{c.phone || '-'}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {c.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1.5">
              No. WhatsApp / HP
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Contoh: 6285777753227"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1.5">
              Tipe Segmen Pelanggan
            </label>
            <select
              value={customerType}
              onChange={e => setCustomerType(e.target.value as CustomerType)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="umum">Umum (Retail / Satuan)</option>
              <option value="instansi">Instansi / Sekolah (Kantor)</option>
              <option value="member">Member Khusus (Diskon Pelanggan)</option>
              <option value="seller">Reseller / Advertising (Harga Grosir)</option>
            </select>
          </div>
        </div>
      </div>

      {/* MODAL PILIH PELANGGAN OTOMATIS */}
      {isCustPickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih Data Pelanggan Otomatis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih untuk otomatis mengisi nama, nomor telepon WhatsApp, dan segmen harga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustPickerModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={custModalSearch}
                  onChange={e => setCustModalSearch(e.target.value)}
                  placeholder="Cari nama pelanggan atau nomor HP..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {customers
                .filter(c => {
                  const q = custModalSearch.toLowerCase();
                  return c.name.toLowerCase().includes(q) || c.phone.includes(q);
                })
                .map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-[11px] font-mono text-slate-500">{c.phone || '-'}</p>
                      {c.address && c.address !== '-' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.address}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {c.type}
                      </span>
                      <p className="text-[10px] text-slate-400">{c.totalOrders} order</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="border-t border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCustPickerModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. KALKULATOR SPESIFIKASI LAYANAN */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <Calculator className="h-4 w-4 text-cyan-500" />
            <span>Kalkulator Spesifikasi Layanan</span>
          </div>

          {/* Segmented Mode Selector Buttons (as in image) */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { id: 'meteran', label: 'Meteran (Banner/Stiker)' },
              { id: 'fotocopy', label: 'Print / Fotocopy' },
              { id: 'satuan', label: 'ATK / Satuan' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ServiceTab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Calculator Inputs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Bahan Cetak (Pilihan Produk atau Ketik Manual) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 dark:text-slate-300 font-bold">
                Bahan Cetak *
              </label>
              <button
                type="button"
                onClick={() => setIsMaterialManual(!isMaterialManual)}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {isMaterialManual ? '← Pilih Produk' : '+ Bahan Manual'}
              </button>
            </div>

            {isMaterialManual ? (
              <input
                type="text"
                value={customMaterialText}
                onChange={e => setCustomMaterialText(e.target.value)}
                placeholder="Ketik nama bahan manual..."
                className="w-full rounded-xl border border-cyan-300 bg-cyan-50/40 p-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-cyan-500 dark:border-cyan-700 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {tabProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatRupiah(getProductPrice(p, customerType))} /{p.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dimensi (Panjang x Lebar) meter - only for meteran */}
          <div className="lg:col-span-1">
            <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
              {activeTab === 'meteran'
                ? 'Dimensi (Panjang x Lebar) meter'
                : 'Ukuran Dokumen / Satuan'}
            </label>
            {activeTab === 'meteran' ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={dimWidth}
                  onChange={e => setDimWidth(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-center font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="P"
                  title="Panjang (meter)"
                />
                <span className="text-slate-400 font-bold">x</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={dimLength}
                  onChange={e => setDimLength(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-center font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="L"
                  title="Lebar (meter)"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Format: {activeProduct?.unit.toUpperCase() || 'PCS'}
              </div>
            )}
          </div>

          {/* Finishing (Pilihan Daftar atau Ketik Manual) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 dark:text-slate-300 font-bold">
                Finishing & Pengerjaan
              </label>
              <button
                type="button"
                onClick={() => setIsFinishingManual(!isFinishingManual)}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {isFinishingManual ? '← Pilih Opsi' : '+ Finishing Manual'}
              </button>
            </div>

            {isFinishingManual ? (
              <input
                type="text"
                value={customFinishingText}
                onChange={e => setCustomFinishingText(e.target.value)}
                placeholder="Contoh: Mata ayam 6 buah, selongsong..."
                className="w-full rounded-xl border border-cyan-300 bg-cyan-50/40 p-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-cyan-500 dark:border-cyan-700 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              <select
                value={selectedFinishing}
                onChange={e => setSelectedFinishing(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {finishingOptions.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Harga & Qty */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 dark:text-slate-300 font-bold">
                Jumlah Qty & Harga
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!isPriceManual) {
                    setCustomPriceValue(getProductPrice(activeProduct, customerType));
                  }
                  setIsPriceManual(!isPriceManual);
                }}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {isPriceManual ? '← Harga Produk' : '+ Harga Manual'}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-1/2">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-center font-mono text-xs font-bold text-slate-900 shadow-sm focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  title={`Jumlah (${activeProduct?.unit || 'Pcs'})`}
                />
              </div>

              <div className="w-1/2">
                {isPriceManual ? (
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={customPriceValue || ''}
                    onChange={e => setCustomPriceValue(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Harga Rp"
                    className="w-full rounded-xl border border-amber-300 bg-amber-50/50 p-2.5 text-right font-mono text-xs font-bold text-amber-900 shadow-sm focus:border-amber-500 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-200"
                    title="Harga satuan manual (Rp)"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setCustomPriceValue(getProductPrice(activeProduct, customerType));
                      setIsPriceManual(true);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-right font-mono text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="Klik untuk ubah harga manual"
                  >
                    {formatRupiah(getProductPrice(activeProduct, customerType))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add to Bill Button */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambahkan ke Daftar Nota</span>
          </button>
        </div>
      </div>

      {/* 4. DAFTAR RINCIAN PESANAN TABLE (As in image) */}
      <div className="mt-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2.5">
          Daftar Rincian Pesanan
        </h3>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5">Produk & Spesifikasi</th>
                <th className="py-3 px-3.5">Keterangan / Finishing</th>
                <th className="py-3 px-3.5 text-center">Qty</th>
                <th className="py-3 px-3.5 text-right">Harga</th>
                <th className="py-3 px-3.5 text-right">Subtotal</th>
                <th className="py-3 px-3.5 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {cartItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-xs italic text-slate-400 dark:text-slate-500"
                  >
                    Belum ada item pesanan yang ditambahkan.
                  </td>
                </tr>
              ) : (
                cartItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.productName}
                      </p>
                      {item.width && item.length && (
                        <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                          Ukuran: {item.width} x {item.length} m ({item.areaM2} m²)
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                      {item.notes || '-'}
                    </td>

                    <td className="py-3 px-3.5 text-center font-mono font-bold">
                      {item.qty} {item.unit}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatRupiah(item.pricePerUnit)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(item.subtotal)}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Hapus Baris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: Catatan, Metode Bayar & Ringkasan Keuangan (With Bulatan Harga) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Catatan & Metode Bayar */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Tambahan Nota
            </label>
            <textarea
              rows={3}
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="Contoh: File via WA / Ambil jam 4 sore..."
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="tunai">💵 Tunai (Cash)</option>
              <option value="qris">📱 QRIS Dinamis</option>
              <option value="transfer_bca">🏦 Transfer Bank BCA</option>
              <option value="transfer_mandiri">🏦 Transfer Bank Mandiri</option>
              <option value="transfer_bri">🏦 Transfer Bank BRI</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Target Deadline Selesai:
            </label>
            <input
              type="text"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Right Column: Pricing & MENU BULATAN HARGA */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Subtotal:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {/* Diskon */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-600 dark:text-slate-400">Diskon (Rp):</span>
            <input
              type="number"
              min="0"
              value={discountAmount || ''}
              onChange={e => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-right font-mono font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* MENU BULATAN HARGA (Requested by user) */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
                Menu Bulatan Harga:
              </span>
              {roundingDiff !== 0 && (
                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400">
                  {roundingDiff > 0 ? `+${formatRupiah(roundingDiff)}` : formatRupiah(roundingDiff)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'none', label: 'Tanpa Bulat' },
                { id: '500', label: 'Bulat 500' },
                { id: '1000', label: 'Bulat 1.000' },
                { id: 'manual', label: 'Manual' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRoundingMenu(opt.id as RoundingMenuOption)}
                  className={`rounded-lg py-1 px-1 text-center text-[10px] font-bold transition ${
                    roundingMenu === opt.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {roundingMenu === 'manual' && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Nominal Bulat Manual (Rp):</span>
                <input
                  type="number"
                  value={manualRoundingValue || ''}
                  onChange={e => setManualRoundingValue(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 rounded border border-blue-200 bg-white px-2 py-0.5 text-right font-mono dark:border-blue-800 dark:bg-slate-900"
                />
              </div>
            )}
          </div>

          {/* TOTAL AKHIR */}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900 dark:border-slate-700 dark:text-white">
            <span>TOTAL AKHIR:</span>
            <span className="font-mono text-base text-blue-600 dark:text-cyan-400">
              {formatRupiah(totalAkhir)}
            </span>
          </div>

          {/* Jumlah Bayar (DP / Lunas) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Jumlah Bayar (DP / Lunas):
              </span>
              <input
                type="number"
                min="0"
                value={paidAmount || ''}
                onChange={e => setPaidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-right font-mono text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Helper Buttons for DP / Lunas */}
            <div className="flex justify-end gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={handleSetPaidFull}
                className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Bayar Lunas
              </button>
              <button
                type="button"
                onClick={handleSetPaidHalf}
                className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
              >
                DP 50%
              </button>
              <button
                type="button"
                onClick={handleSetPaidZero}
                className="rounded bg-slate-200 px-2 py-0.5 font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
              >
                Nol (Tempo)
              </button>
            </div>
          </div>

          {/* SISA PIUTANG (Colored in red as in image) */}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-black text-rose-600 dark:border-slate-700 dark:text-rose-400">
            <span>SISA PIUTANG:</span>
            <span className="font-mono text-sm">{formatRupiah(sisaPiutang)}</span>
          </div>
        </div>
      </div>

      {/* 6. FOOTER BUTTONS: Batal & Simpan & Buat Nota Resmi */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setCartItems([])}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleSaveAndCreateNota}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:brightness-110 transition"
        >
          <Printer className="h-4 w-4" />
          <span>Simpan & Buat Nota Resmi</span>
        </button>
      </div>
    </div>
  );
};
