import { MenuItem, Ingredient, Order, CafeSettings, StaffUser, CafeTable } from '../types.ts';

// Data Sampel / Template (Hanya dimuat jika pengguna sengaja memilih 'Muat Ulang Template')
export const SAMPLE_INGREDIENTS_TEMPLATES: Ingredient[] = [
  { id: 'ing_coffee', name: 'Biji Kopi Arabika Blend', stock: 4500, unit: 'gram', minStock: 1000, costPerUnit: 350 },
  { id: 'ing_milk', name: 'Susu Segar Pasteurisasi', stock: 12000, unit: 'ml', minStock: 3000, costPerUnit: 25 },
  { id: 'ing_aren', name: 'Gula Aren Organik Cair', stock: 3500, unit: 'ml', minStock: 800, costPerUnit: 40 },
  { id: 'ing_matcha', name: 'Pure Uji Matcha Powder', stock: 850, unit: 'gram', minStock: 200, costPerUnit: 800 },
  { id: 'ing_rice', name: 'Beras Premium', stock: 8000, unit: 'gram', minStock: 2000, costPerUnit: 18 },
  { id: 'ing_egg', name: 'Telur Ayam Omega', stock: 48, unit: 'butir', minStock: 15, costPerUnit: 2500 },
  { id: 'ing_croissant', name: 'Dough Croissant Par-Baked', stock: 24, unit: 'pcs', minStock: 8, costPerUnit: 12000 },
  { id: 'ing_potato', name: 'Potongan Kentang Belgia', stock: 5000, unit: 'gram', minStock: 1500, costPerUnit: 45 },
  { id: 'ing_cup', name: 'Eco Paper Cup & Lid', stock: 320, unit: 'pcs', minStock: 50, costPerUnit: 1200 },
];

export const SAMPLE_MENU_TEMPLATES: MenuItem[] = [
  {
    id: 'm_es_kopsu',
    name: 'Es Kopi Susu Gula Aren',
    category: 'kopi',
    price: 24000,
    description: 'Espresso ganda, susu segar creamy, gula aren organik asli, dan es kristal higienis.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Suhu Dingin (Es cepat mencair jika didiamkan >7 menit)',
    preparationTimeMinutes: 3,
    recipe: [
      { ingredientId: 'ing_coffee', amount: 18, unit: 'gram' },
      { ingredientId: 'ing_milk', amount: 150, unit: 'ml' },
      { ingredientId: 'ing_aren', amount: 25, unit: 'ml' },
      { ingredientId: 'ing_cup', amount: 1, unit: 'pcs' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_hot_cappuccino',
    name: 'Hot Cappuccino Velvety',
    category: 'kopi',
    price: 28000,
    description: 'Espresso aromatik dengan tekstur microfoam susu lembut berbusa tebal.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Suhu Panas (Microfoam kempes & suhu turun jika dibiarkan)',
    preparationTimeMinutes: 4,
    recipe: [
      { ingredientId: 'ing_coffee', amount: 18, unit: 'gram' },
      { ingredientId: 'ing_milk', amount: 180, unit: 'ml' },
      { ingredientId: 'ing_cup', amount: 1, unit: 'pcs' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_matcha_latte',
    name: 'Iced Uji Matcha Latte',
    category: 'non-kopi',
    price: 32000,
    description: 'Teh hijau Matcha Jepang murni dengan susu segar bertekstur lembut.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Suhu Dingin (Pemisahan lapisan matcha dan es mencair)',
    preparationTimeMinutes: 3,
    recipe: [
      { ingredientId: 'ing_matcha', amount: 12, unit: 'gram' },
      { ingredientId: 'ing_milk', amount: 180, unit: 'ml' },
      { ingredientId: 'ing_cup', amount: 1, unit: 'pcs' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_cold_brew',
    name: 'Artisan Cold Brew Botol',
    category: 'kopi',
    price: 30000,
    description: 'Kopi seduh dingin 16 jam dalam botol kaca higienis. Aman disimpan dingin.',
    isSensitive: false,
    sensitiveReason: 'Tahan Suhu (Tersedia dalam botol chiller tertutup rapat)',
    preparationTimeMinutes: 1,
    recipe: [
      { ingredientId: 'ing_coffee', amount: 25, unit: 'gram' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_nasi_goreng',
    name: 'Nasi Goreng Kafe Spesial',
    category: 'makanan',
    price: 38000,
    description: 'Nasi goreng bumbu racikan rempah khas, telur ceplok omega, acar, dan kerupuk gurih.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Kerapuhan Rasa (Harus dimasak panas mengepul saat disantap)',
    preparationTimeMinutes: 7,
    recipe: [
      { ingredientId: 'ing_rice', amount: 200, unit: 'gram' },
      { ingredientId: 'ing_egg', amount: 1, unit: 'butir' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_croissant_butter',
    name: 'Croissant Butter Panggang',
    category: 'snack',
    price: 26000,
    description: 'Pastry mentega Prancis dengan lapisan renyah flaky dan aroma butter harum.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Tekstur (Dipanggang ulang agar renyah hangat saat tamu tiba)',
    preparationTimeMinutes: 5,
    recipe: [
      { ingredientId: 'ing_croissant', amount: 1, unit: 'pcs' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'm_truffle_fries',
    name: 'Truffle Fries Renyah',
    category: 'snack',
    price: 30000,
    description: 'Kentang goreng renyah dengan aroma minyak truffle putih dan taburan keju parmesan.',
    isSensitive: true,
    sensitiveReason: 'Sensitif Kerenyahan (Kentang lemas jika dibiarkan terlalu lama)',
    preparationTimeMinutes: 6,
    recipe: [
      { ingredientId: 'ing_potato', amount: 180, unit: 'gram' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  },
];

// Data Awal Bersih (Tanpa Sampel / Zero-Data Ready)
export const INITIAL_INGREDIENTS: Ingredient[] = [];
export const INITIAL_MENU: MenuItem[] = [];
export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TABLES: CafeTable[] = [
  { id: 'tbl_01', number: 1, name: 'Meja 01', capacity: 2, status: 'tersedia' },
  { id: 'tbl_02', number: 2, name: 'Meja 02', capacity: 4, status: 'tersedia' },
  { id: 'tbl_03', number: 3, name: 'Meja 03', capacity: 2, status: 'tersedia' },
  { id: 'tbl_04', number: 4, name: 'Meja 04', capacity: 4, status: 'tersedia' },
  { id: 'tbl_05', number: 5, name: 'Meja 05', capacity: 6, status: 'tersedia' },
  { id: 'tbl_06', number: 6, name: 'Meja 06', capacity: 2, status: 'tersedia' },
  { id: 'tbl_07', number: 7, name: 'Meja 07', capacity: 4, status: 'tersedia' },
  { id: 'tbl_08', number: 8, name: 'Meja 08', capacity: 4, status: 'tersedia' },
  { id: 'tbl_09', number: 9, name: 'Meja 09', capacity: 6, status: 'tersedia' },
  { id: 'tbl_10', number: 10, name: 'Meja 10', capacity: 8, status: 'tersedia' },
];

export const INITIAL_SETTINGS: CafeSettings = {
  cafeName: 'KafeKu Senopati',
  location: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
  phone: '0812-9876-5432',
  openTime: '08:00',
  closeTime: '22:00',
  isPreOrderEnabled: true,
  preOrderNotice: 'Pre-order dibuka setiap hari pkl 08:00 - 21:30 WIB. Sistem Anti No-Show aktif.',
  notificationSound: 'ting_klasik',
  tables: INITIAL_TABLES,
};

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'stf_01',
    name: 'Admin KafeKu (Owner)',
    role: 'admin',
    username: 'admin',
    pin: '9999',
    status: 'aktif',
    createdAt: '2026-01-01',
  },
  {
    id: 'stf_02',
    name: 'Kasir KafeKu (Siti Rahma)',
    role: 'kasir',
    username: 'kasir',
    pin: '1234',
    status: 'aktif',
    createdAt: '2026-02-10',
  },
  {
    id: 'stf_03',
    name: 'Doni Pratama (Kasir 2)',
    role: 'kasir',
    username: 'doni_kasir',
    pin: '2345',
    status: 'aktif',
    createdAt: '2026-03-01',
  },
  {
    id: 'stf_04',
    name: 'Kepala Dapur (Chef Aris)',
    role: 'koki',
    username: 'dapur',
    pin: '3456',
    status: 'aktif',
    createdAt: '2026-01-15',
  },
  {
    id: 'stf_05',
    name: 'Bayu Pamungkas (Koki 2)',
    role: 'koki',
    username: 'bayu_koki',
    pin: '4567',
    status: 'aktif',
    createdAt: '2026-02-20',
  },
];

// Akun Demo Bawaan untuk Login dan Pemisahan 4 Peran
export const DEFAULT_ACCOUNTS = [
  {
    role: 'admin' as const,
    roleTitle: 'Admin & Pengelola',
    badge: 'AKSES PENUH',
    username: 'admin',
    pin: '9999',
    name: 'Admin KafeKu (Owner)',
    description: 'Akses penuh kelola menu, inventori bahan, karyawan, meja, omzet, dan konfigurasi kafe.',
    color: 'from-stone-800 to-stone-950',
    accentColor: 'text-amber-400',
    borderColor: 'border-stone-700',
  },
  {
    role: 'pelanggan' as const,
    roleTitle: 'Pelanggan Kafe',
    badge: 'PRE-ORDER & MEJA',
    username: 'pelanggan',
    pin: '1234',
    name: 'Pelanggan / Tamu',
    description: 'Akses khusus pemesanan mandiri, bayar QRIS, estimasi kedatangan, dan tombol "Saya Sudah Sampai".',
    color: 'from-amber-600 to-amber-800',
    accentColor: 'text-amber-300',
    borderColor: 'border-amber-400',
  },
  {
    role: 'kasir' as const,
    roleTitle: 'Kasir (POS)',
    badge: 'TERMINAL KASIR',
    username: 'kasir',
    pin: '1234',
    name: 'Siti Rahma (Kasir)',
    description: 'Layar kasir walk-in, pembayaran tunai, kalkulator kembalian aman, dan cetak struk thermal.',
    color: 'from-blue-600 to-indigo-800',
    accentColor: 'text-blue-300',
    borderColor: 'border-blue-400',
  },
  {
    role: 'dapur' as const,
    roleTitle: 'Dapur (KDS)',
    badge: 'DISPLAY MASAK KOKI',
    username: 'dapur',
    pin: '3456',
    name: 'Chef Aris (Kepala Dapur)',
    description: 'Display tiket masak koki, antrean pesanan, dan panggilan otomatis suara Text-to-Speech (TTS).',
    color: 'from-orange-600 to-red-700',
    accentColor: 'text-orange-300',
    borderColor: 'border-orange-400',
  },
];

