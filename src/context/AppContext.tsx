import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Customer,
  Expense,
  ExpenseCategory,
  PaymentStatus,
  Product,
  ProductCategory,
  ProductionStatus,
  ShopSettings,
  Transaction,
  UserAccount,
  UserRole,
} from '../types';
import {
  initialCategories,
  initialCustomers,
  initialExpenseCategories,
  initialExpenses,
  initialProducts,
  initialShopSettings,
  initialTransactions,
  initialUsers,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  currentPage: string;
  setCurrentPage: (page: string) => void;

  activeTrackingNota: string | null;
  setActiveTrackingNota: (nota: string | null) => void;

  selectedReceiptTransaction: Transaction | null;
  setSelectedReceiptTransaction: (trx: Transaction | null) => void;

  // Data collections
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'totalDebt' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  categories: ProductCategory[];
  addCategory: (cat: Omit<ProductCategory, 'id'>) => ProductCategory;
  updateCategory: (id: string, cat: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  products: Product[];
  addProduct: (prod: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  transactions: Transaction[];
  addTransaction: (trx: Omit<Transaction, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'historyLogs'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  updateProductionStatus: (id: string, status: ProductionStatus, note?: string) => void;
  settlePayment: (id: string, additionalPay: number, paymentMethod: string, note?: string) => void;
  deleteTransaction: (id: string) => void;

  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;

  expenseCategories: ExpenseCategory[];
  addExpenseCategory: (cat: Omit<ExpenseCategory, 'id'>) => ExpenseCategory;

  settings: ShopSettings;
  updateSettings: (updates: Partial<ShopSettings>) => void;

  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  // Alerts
  unpaidTransactions: Transaction[];
  pendingProductionTransactions: Transaction[];
  showAlertModal: boolean;
  setShowAlertModal: (show: boolean) => void;

  // Backup & Restore
  resetDataToDefault: () => void;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => boolean;

  // Toast Notifications
  toasts: { id: number; message: string; type: 'success' | 'info' | 'error' }[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: number) => void;

  // Sound feedback
  playPosBeep: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_PREFIX = 'SM_PRINTING_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}THEME`);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}THEME`, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // User auth state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}USERS`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}CURRENT_USER`);
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation state
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [activeTrackingNota, setActiveTrackingNota] = useState<string | null>(null);
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<Transaction | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  // Entities
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}CUSTOMERS`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}CATEGORIES`);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}PRODUCTS`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}TRANSACTIONS`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}EXPENSE_CATEGORIES`);
    return saved ? JSON.parse(saved) : initialExpenseCategories;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}EXPENSES`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}SETTINGS`);
    return saved ? JSON.parse(saved) : initialShopSettings;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}USERS`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}CURRENT_USER`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}CURRENT_USER`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}CUSTOMERS`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}CATEGORIES`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}PRODUCTS`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}TRANSACTIONS`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}EXPENSE_CATEGORIES`, JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}SETTINGS`, JSON.stringify(settings));
  }, [settings]);

  // Toast notifications state (single active notification to prevent stacking/piling up)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    // Keep only the single newest notification so they never pile up or overlap
    setToasts([{ id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Audio feedback for POS
  const playPosBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext not available or allowed yet
    }
  };

  // Auth methods
  const login = (username: string, password: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      showToast('Username tidak ditemukan!', 'error');
      return { success: false, message: 'Username tidak ditemukan!' };
    }
    if (user.password !== password) {
      showToast('Password salah!', 'error');
      return { success: false, message: 'Password salah!' };
    }
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.name}!`, 'success');
    if (user.role === 'operator') {
      setCurrentPage('transactions');
    } else {
      setCurrentPage('dashboard');
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentPage('landing');
    showToast('Anda telah berhasil keluar (Logout).', 'info');
  };

  const switchRoleQuick = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      showToast(`Beralih peran ke: ${role.toUpperCase()}`, 'info');
      if (role === 'operator') {
        setCurrentPage('transactions');
      } else {
        setCurrentPage('dashboard');
      }
    }
  };

  // Customer methods
  const addCustomer = (data: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'totalDebt' | 'createdAt'>) => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      totalDebt: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`Pelanggan "${data.name}" berhasil ditambahkan!`, 'success');
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Data pelanggan berhasil diperbarui!', 'success');
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Data pelanggan berhasil dihapus!', 'info');
  };

  // Category methods
  const addCategory = (cat: Omit<ProductCategory, 'id'>) => {
    const newCat: ProductCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Kategori "${cat.name}" berhasil ditambahkan!`, 'success');
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<ProductCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Kategori berhasil diperbarui!', 'success');
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Kategori berhasil dihapus!', 'info');
  };

  // Product methods
  const addProduct = (prod: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    showToast(`Produk "${prod.name}" berhasil ditambahkan!`, 'success');
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Data produk berhasil diperbarui!', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Produk berhasil dihapus!', 'info');
  };

  // Transaction methods
  const addTransaction = (data: Omit<Transaction, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'historyLogs'>) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = String(transactions.length + 1).padStart(3, '0');
    const invoiceNumber = `SM-${yearMonth}-${seq}`;
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newTrx: Transaction = {
      ...data,
      id: `trx-${Date.now()}`,
      invoiceNumber,
      createdAt: nowStr,
      updatedAt: nowStr,
      paidAt: data.paymentStatus === 'lunas' ? nowStr : undefined,
      historyLogs: [
        {
          time: nowStr,
          actor: currentUser?.name || 'Kasir',
          action: `Nota Dibuat (${data.paymentStatus === 'lunas' ? 'Lunas' : data.paymentStatus === 'dp' ? `DP Rp ${data.dpAmount.toLocaleString('id-ID')}` : 'Belum Lunas'})`,
        },
      ],
    };

    setTransactions(prev => [newTrx, ...prev]);

    // Update customer spending and debt
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === data.customerId || c.name === data.customerName) {
          return {
            ...c,
            totalOrders: c.totalOrders + 1,
            totalSpent: c.totalSpent + data.grandTotal,
            totalDebt: c.totalDebt + data.remainingAmount,
          };
        }
        return c;
      })
    );

    showToast(`Nota ${invoiceNumber} berhasil disimpan & dibuat!`, 'success');
    return newTrx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...updates,
            updatedAt: nowStr,
          };
        }
        return t;
      })
    );
    showToast('Data transaksi berhasil diperbarui!', 'success');
  };

  const updateProductionStatus = (id: string, status: ProductionStatus, note?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const statusLabels: Record<ProductionStatus, string> = {
      antrean: 'Masuk Antrean',
      desain: 'Tahap Desain / Setting',
      cetak: 'Sedang Proses Cetak',
      finishing: 'Proses Finishing',
      siap_ambil: 'Siap Diambil di Kasir',
      selesai: 'Selesai / Sudah Diambil',
    };

    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newLog = {
            time: nowStr,
            actor: currentUser?.name || 'Operator',
            action: `Status diubah ke: ${statusLabels[status]}`,
            note,
          };
          return {
            ...t,
            productionStatus: status,
            updatedAt: nowStr,
            historyLogs: [newLog, ...t.historyLogs],
          };
        }
        return t;
      })
    );

    showToast(`Status produksi diperbarui ke: ${statusLabels[status]}!`, 'success');
  };

  const settlePayment = (id: string, additionalPay: number, paymentMethod: string, note?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newPaid = t.dpAmount + additionalPay;
          const newRemaining = Math.max(0, t.grandTotal - newPaid);
          const newStatus: PaymentStatus = newRemaining === 0 ? 'lunas' : 'dp';

          const newLog = {
            time: nowStr,
            actor: currentUser?.name || 'Kasir',
            action: `Pembayaran ${newStatus === 'lunas' ? 'LUNAS' : 'Tambahan'}: Rp ${additionalPay.toLocaleString('id-ID')} (${paymentMethod})`,
            note,
          };

          // Also reduce customer debt
          setCustomers(cList =>
            cList.map(c => {
              if (c.id === t.customerId) {
                return {
                  ...c,
                  totalDebt: Math.max(0, c.totalDebt - additionalPay),
                };
              }
              return c;
            })
          );

          return {
            ...t,
            dpAmount: newPaid,
            remainingAmount: newRemaining,
            paymentStatus: newStatus,
            paidAt: newStatus === 'lunas' ? nowStr : t.paidAt,
            updatedAt: nowStr,
            historyLogs: [newLog, ...t.historyLogs],
          };
        }
        return t;
      })
    );

    showToast(`Pelunasan Rp ${additionalPay.toLocaleString('id-ID')} berhasil disimpan!`, 'success');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Transaksi nota berhasil dihapus!', 'info');
  };

  // Expenses
  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast(`Pengeluaran Rp ${exp.amount.toLocaleString('id-ID')} berhasil dicatat!`, 'success');
    return newExp;
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Catatan pengeluaran berhasil dihapus!', 'info');
  };

  const addExpenseCategory = (cat: Omit<ExpenseCategory, 'id'>) => {
    const newCat: ExpenseCategory = {
      ...cat,
      id: `expcat-${Date.now()}`,
    };
    setExpenseCategories(prev => [...prev, newCat]);
    showToast(`Kategori biaya "${cat.name}" berhasil dibuat!`, 'success');
    return newCat;
  };

  // Settings
  const updateSettings = (updates: Partial<ShopSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    showToast('Pengaturan toko berhasil disimpan!', 'success');
  };

  // User accounts
  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    showToast(`Akun @${userData.username} berhasil dibuat!`, 'success');
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ...updates } : null));
    }
    showToast('Data akun pengguna berhasil diperbarui!', 'success');
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Akun pengguna berhasil dihapus!', 'info');
  };

  // Unpaid & Pending queries
  const unpaidTransactions = transactions.filter(t => t.paymentStatus !== 'lunas');
  const pendingProductionTransactions = transactions.filter(
    t => t.productionStatus !== 'selesai' && t.productionStatus !== 'siap_ambil'
  );

  // Backup & Restore
  const resetDataToDefault = () => {
    setCustomers(initialCustomers);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setTransactions(initialTransactions);
    setExpenses(initialExpenses);
    setExpenseCategories(initialExpenseCategories);
    setShopSettingsSafe(initialShopSettings);
    setUsers(initialUsers);
    localStorage.clear();
    showToast('Semua data berhasil di-reset ke bawaan demo!', 'info');
  };

  const setShopSettingsSafe = (s: ShopSettings) => setSettings(s);

  const exportBackupJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shop: 'SM DIGITAL PRINTING',
      customers,
      categories,
      products,
      transactions,
      expenses,
      expenseCategories,
      settings,
      users,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sm_digital_printing_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File backup JSON berhasil diunduh!', 'success');
  };

  const importBackupJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers) setCustomers(data.customers);
      if (data.categories) setCategories(data.categories);
      if (data.products) setProducts(data.products);
      if (data.transactions) setTransactions(data.transactions);
      if (data.expenses) setExpenses(data.expenses);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      showToast('Data berhasil di-restore dari file backup!', 'success');
      return true;
    } catch {
      showToast('Gagal me-restore data backup (file corrupt/tidak valid)!', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        switchRoleQuick,
        theme,
        toggleTheme,
        currentPage,
        setCurrentPage,
        activeTrackingNota,
        setActiveTrackingNota,
        selectedReceiptTransaction,
        setSelectedReceiptTransaction,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        transactions,
        addTransaction,
        updateTransaction,
        updateProductionStatus,
        settlePayment,
        deleteTransaction,
        expenses,
        addExpense,
        deleteExpense,
        expenseCategories,
        addExpenseCategory,
        settings,
        updateSettings,
        users,
        addUser,
        updateUser,
        deleteUser,
        unpaidTransactions,
        pendingProductionTransactions,
        showAlertModal,
        setShowAlertModal,
        resetDataToDefault,
        exportBackupJson,
        importBackupJson,
        toasts,
        showToast,
        removeToast,
        playPosBeep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
