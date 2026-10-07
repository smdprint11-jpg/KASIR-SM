export type UserRole = 'pemilik' | 'kasir' | 'operator';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // In production this would be hashed; client state allows demo password edit
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export type CustomerType = 'umum' | 'instansi' | 'member' | 'seller';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  totalOrders: number;
  totalSpent: number;
  totalDebt: number; // Piutang belum lunas
  createdAt: string;
}

export type UnitType = 'meter' | 'pcs' | 'lembar' | 'paket' | 'rim' | 'roll' | 'box';

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  unit: UnitType;
  material: string;
  priceUmum: number;
  priceMember: number;
  priceSeller: number;
  priceInstansi: number;
  description: string;
  stock?: number;
  isCustomDimension?: boolean; // If true, calculates length * width in meters
  imageUrl?: string;
  showOnLandingPage?: boolean;
}

export type PaymentStatus = 'lunas' | 'dp' | 'belum_lunas';

export type ProductionStatus = 
  | 'antrean'
  | 'desain'
  | 'cetak'
  | 'finishing'
  | 'siap_ambil'
  | 'selesai';

export type PaymentMethod = 
  | 'tunai'
  | 'qris'
  | 'transfer_bca'
  | 'transfer_mandiri'
  | 'transfer_bri'
  | 'transfer_bni'
  | 'lainnya';

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  unit: UnitType;
  width?: number; // In meters (for banner/spanduk/stiker)
  length?: number; // In meters
  areaM2?: number; // width * length
  qty: number;
  pricePerUnit: number;
  subtotal: number;
  material?: string;
  notes?: string;
}

export interface TransactionHistoryLog {
  time: string;
  actor: string;
  action: string;
  note?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string; // e.g. SM-202610-001
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  customerAddress?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  rounding: number;
  grandTotal: number;
  dpAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  productionStatus: ProductionStatus;
  paymentMethod: PaymentMethod;
  cashierName: string;
  notes?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  historyLogs: TransactionHistoryLog[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  paymentMethod: 'tunai' | 'transfer' | 'lainnya';
  recordedBy: string;
  receiptProofUrl?: string;
}

export type PrintFormat = 
  | 'a5_landscape'
  | 'a5_portrait'
  | 'a6_landscape'
  | 'a6_portrait'
  | 'thermal_58';

export type RoundingOption = 'none' | '500' | '1000' | 'manual';

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentChannelConfig {
  id: string;
  name: string;
  active: boolean;
  type: 'cash' | 'qris' | 'bank' | 'ewallet';
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  logoUrl: string;
  webLogoUrl?: string;
  receiptLogoUrl?: string;
  showWebLogo?: boolean;
  showReceiptLogo?: boolean;
  address: string;
  phone: string;
  whatsappCS: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    website: string;
  };
  bankAccounts: BankAccount[];
  qrisUrl: string;
  publicTrackingUrl: string;
  defaultPrintFormat: PrintFormat;
  roundingRule: RoundingOption;
  waTemplate: string;
  paymentChannels: PaymentChannelConfig[];
  thermalCustomNotes: string;
  thermalBoldFont: boolean;
  termsAndConditions: string;
  landingSlogan?: string;
  dashboardTitle?: string;
  landingHeadline?: string;
  landingSubheadline?: string;
  landingBgStyle?: 'dark-cyber' | 'navy-mesh' | 'glass-gradient' | 'custom-image';
  landingCustomBgUrl?: string;
}
