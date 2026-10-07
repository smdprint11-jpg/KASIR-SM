import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Layers,
  Tag,
  DollarSign,
  Info,
  X,
  Upload,
  Globe,
  Image as ImageIcon,
  ChevronDown,
  Download,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, UnitType } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { downloadCsv, downloadJson, triggerPrint } from '../../utils/export';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [unit, setUnit] = useState<UnitType>('meter');
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');
  const [priceUmum, setPriceUmum] = useState<number>(0);
  const [priceMember, setPriceMember] = useState<number>(0);
  const [priceSeller, setPriceSeller] = useState<number>(0);
  const [priceInstansi, setPriceInstansi] = useState<number>(0);
  const [isCustomDimension, setIsCustomDimension] = useState(false);
  const [stock, setStock] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showOnLandingPage, setShowOnLandingPage] = useState<boolean>(true);

  // Category manage modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setUnit('meter');
    setMaterial('');
    setDescription('');
    setPriceUmum(20000);
    setPriceMember(18000);
    setPriceSeller(15000);
    setPriceInstansi(19000);
    setIsCustomDimension(true);
    setStock(100);
    setImageUrl('');
    setShowOnLandingPage(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setCategoryId(prod.categoryId);
    setUnit(prod.unit);
    setMaterial(prod.material);
    setDescription(prod.description);
    setPriceUmum(prod.priceUmum);
    setPriceMember(prod.priceMember);
    setPriceSeller(prod.priceSeller);
    setPriceInstansi(prod.priceInstansi);
    setIsCustomDimension(!!prod.isCustomDimension);
    setStock(prod.stock || 0);
    setImageUrl(prod.imageUrl || '');
    setShowOnLandingPage(prod.showOnLandingPage !== false);
    setIsProductModalOpen(true);
  };

  const handleToggleLandingPage = (prod: Product) => {
    const nextState = prod.showOnLandingPage === false ? true : false;
    updateProduct(prod.id, { showOnLandingPage: nextState });
    showToast(
      `Produk "${prod.name}" ${nextState ? 'kini ditampilkan' : 'disembunyikan'} di Landing Page!`,
      nextState ? 'success' : 'info'
    );
  };

  const handleSaveProduct = () => {
    if (!name.trim()) {
      showToast('Nama produk wajib diisi!', 'error');
      return;
    }

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: name.trim(),
        categoryId,
        unit,
        material: material.trim(),
        description: description.trim(),
        priceUmum,
        priceMember,
        priceSeller,
        priceInstansi,
        isCustomDimension,
        stock,
        imageUrl: imageUrl.trim() || undefined,
        showOnLandingPage,
      });
      showToast(`Produk "${name.trim()}" berhasil diperbarui!`, 'success');
    } else {
      addProduct({
        name: name.trim(),
        categoryId,
        unit,
        material: material.trim(),
        description: description.trim(),
        priceUmum,
        priceMember,
        priceSeller,
        priceInstansi,
        isCustomDimension,
        stock,
        imageUrl: imageUrl.trim() || undefined,
        showOnLandingPage,
      });
      showToast(`Produk baru "${name.trim()}" berhasil ditambahkan!`, 'success');
    }

    setIsProductModalOpen(false);
  };

  const handleAddCategorySubmit = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      icon: 'Tag',
      description: newCatDesc.trim(),
    });
    showToast(`Kategori "${newCatName.trim()}" berhasil dibuat!`, 'success');
    setNewCatName('');
    setNewCatDesc('');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Keterangan Bahan',
      'Harga Umum (Rp)',
      'Harga Member (Rp)',
      'Harga Reseller (Rp)',
      'Harga Instansi (Rp)',
      'Stok',
      'Hitung Dimensi Meteran',
    ];

    const rows = filteredProducts.map(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || '-';
      return [
        p.name,
        cat,
        p.unit,
        p.material,
        p.priceUmum,
        p.priceMember,
        p.priceSeller,
        p.priceInstansi,
        p.stock || 0,
        p.isCustomDimension ? 'YA' : 'TIDAK',
      ];
    });

    downloadCsv(`Katalog_Produk_Stok_SM_Printing_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast('Katalog produk dan stok berhasil diexport ke file Excel (CSV)!', 'success');
  };

  const handleExportJson = () => {
    downloadJson(`Katalog_Produk_Stok_SM_Printing_${new Date().toISOString().split('T')[0]}`, filteredProducts);
    showToast('Data produk & stok berhasil diexport ke format JSON!', 'success');
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
              placeholder="Cari produk, spesifikasi bahan atau kategori..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">Semua Kategori ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>Kelola Kategori</span>
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
            onClick={handleOpenAddProduct}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3.5 text-center">Foto</th>
                <th className="py-3 px-3.5">Nama Produk</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Satuan</th>
                <th className="py-3 px-3.5">Bahan / Spesifikasi</th>
                <th className="py-3 px-3.5 text-right">Harga Umum</th>
                <th className="py-3 px-3.5 text-right">Harga Member</th>
                <th className="py-3 px-3.5 text-right">Harga Reseller</th>
                <th className="py-3 px-3.5 text-center">Stok</th>
                <th className="py-3 px-3.5 text-center">Web Publik</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const catName = categories.find(c => c.id === p.categoryId)?.name || '-';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Thumbnail Preview */}
                      <td className="py-3.5 px-3 text-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-10 w-10 mx-auto rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                            {p.isCustomDimension && (
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                (Hitung Meteran Panjang × Lebar)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300">
                        {catName}
                      </td>

                      <td className="py-3.5 px-3.5 uppercase font-mono text-[11px] text-slate-500">
                        {p.unit}
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-500 max-w-[180px] truncate">
                        {p.material}
                      </td>

                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(p.priceUmum)}
                      </td>

                      <td className="py-3.5 px-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {formatRupiah(p.priceMember)}
                      </td>

                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(p.priceSeller)}
                      </td>

                      <td className="py-3.5 px-3.5 text-center font-mono">
                        {p.stock !== undefined ? p.stock : '∞'}
                      </td>

                      {/* Tampil di Landing Page Toggle */}
                      <td className="py-3.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleLandingPage(p)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                            p.showOnLandingPage !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                          title="Klik untuk tampilkan / sembunyikan di Web Landing Page"
                        >
                          {p.showOnLandingPage !== false ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Tampil</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Sembunyi</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Produk"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin hapus produk "${p.name}"?`)) {
                                deleteProduct(p.id);
                                showToast(`Produk "${p.name}" berhasil dihapus.`, 'info');
                              }
                            }}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT CREATE/EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingProductId ? 'Edit Data Produk' : 'Tambah Produk Percetakan Baru'}
              </h4>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nama Produk:</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Banner Spanduk Flexy 280g..."
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Kategori:</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Satuan Unit:</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as UnitType)}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="meter">Meter (Per m² atau m lari)</option>
                    <option value="pcs">Pcs (Satuan)</option>
                    <option value="lembar">Lembar (A3+ / Folio / Plano)</option>
                    <option value="paket">Paket (Display + Cetak)</option>
                    <option value="rim">Rim (500 Lembar)</option>
                    <option value="box">Box (Kotak Kartu Nama)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Keterangan Bahan / Gramatur / Finishing:
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  placeholder="Contoh: Flexy China 280 gsm Glossy, Art Paper 150g, Vinyl Matte..."
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Pricing Grid per Client Type */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="block font-bold text-slate-800 dark:text-slate-200">
                  Tingkat Harga per Jenis Pelanggan (Rp):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500">1. Harga Umum:</label>
                    <input
                      type="number"
                      value={priceUmum}
                      onChange={e => setPriceUmum(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">2. Harga Member:</label>
                    <input
                      type="number"
                      value={priceMember}
                      onChange={e => setPriceMember(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">
                      3. Harga Reseller / Seller:
                    </label>
                    <input
                      type="number"
                      value={priceSeller}
                      onChange={e => setPriceSeller(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">
                      4. Harga Instansi / Sekolah:
                    </label>
                    <input
                      type="number"
                      value={priceInstansi}
                      onChange={e => setPriceInstansi(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Stok Tersedia:
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="customDimCheck"
                    checked={isCustomDimension}
                    onChange={e => setIsCustomDimension(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <label htmlFor="customDimCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kalkulasi Ukuran Meteran (P x L)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Deskripsi Singkat / Catatan:
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Thumbnail Gambar Produk & Tampil di Landing Page */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-850 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-cyan-600" />
                    <span>Thumbnail Gambar Produk</span>
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnLandingPage}
                      onChange={e => setShowOnLandingPage(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">
                      Tampil di Landing Page
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  {imageUrl ? (
                    <div className="relative h-16 w-16 shrink-0 rounded-xl border border-slate-200 overflow-hidden shadow-sm dark:border-slate-700">
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-0.5 right-0.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-rose-600 transition"
                        title="Hapus gambar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                      <ImageIcon className="h-6 w-6 opacity-40" />
                      <span className="text-[9px] mt-0.5">No Foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Upload className="h-3.5 w-3.5 text-blue-600" />
                        <span>Upload File Foto</span>
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
                                  setImageUrl(evt.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">atau paste link gambar di bawah</span>
                    </div>

                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://.../thumbnail.jpg"
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Kelola Kategori Produk Percetakan
              </h4>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
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
                  placeholder="Nama Kategori Baru..."
                  className="flex-1 rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  onClick={handleAddCategorySubmit}
                  className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700"
                >
                  + Tambah
                </button>
              </div>

              {/* List Categories */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto dark:divide-slate-800">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between py-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
