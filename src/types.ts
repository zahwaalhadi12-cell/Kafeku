export type MenuCategory = 'kopi' | 'non-kopi' | 'makanan' | 'snack';

export interface IngredientRecipe {
  ingredientId: string;
  amount: number; // e.g. 18 for 18g coffee
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  isAvailable?: boolean; // Status Stok: Tersedia (true) atau Habis (false)
  isSensitive: boolean; // True for temperature sensitive items (es cepat cair / makanan cepat dingin)
  sensitiveReason?: string; // e.g. "Es Kopi Susu sensitif es mencair"
  preparationTimeMinutes: number;
  recipe: IngredientRecipe[];
  imageUrl: string;
}

export interface CafeTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'tersedia' | 'terisi' | 'ditutup';
  assignedOrder?: string; // e.g. "ORD-1003"
}

export type NotificationSound = 'ting_klasik' | 'dering_ceria' | 'retro_game' | 'kasir_digital';

export interface CafeSettings {
  cafeName: string;
  location: string;
  phone?: string;
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "22:00"
  isPreOrderEnabled: boolean;
  preOrderNotice: string;
  notificationSound?: NotificationSound;
  tables: CafeTable[];
}

export type StaffRole = 'admin' | 'kasir' | 'koki';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  username: string;
  pin: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  category: MenuCategory;
  price: number;
  quantitySold: number;
  totalRevenue: number;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isSensitive: boolean;
}

export type OrderSource = 'preorder' | 'cashier';
export type PaymentMethod = 'qris' | 'cash' | 'ewallet';
export type PaymentStatus = 'paid' | 'pending' | 'cancelled_noshow';
export type KitchenStatus = 
  | 'menunggu_kedatangan' // Pre-order sensitive item holding until arrival
  | 'antrean_dapur'      // Ready to prepare / queue in kitchen
  | 'sedang_dimasak'     // Actively brewing / cooking
  | 'siap_diambil'       // Done, ready on pickup counter
  | 'selesai';           // Completed

export interface Order {
  id: string;
  source: OrderSource;
  customerName: string;
  customerPhone?: string;
  estimatedArrival?: string; // e.g. "10 menit lagi (14:35)"
  hasArrived: boolean;
  arrivedAt?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  isNonRefundable: boolean;
  cashReceived?: number;
  cashChange?: number;
  kitchenStatus: KitchenStatus;
  createdAt: string;
  offlineCreated?: boolean;
  isTakeaway?: boolean;
  tableNumber?: string;
}

export interface FinancialReport {
  totalRevenue: number;
  totalOrders: number;
  preOrderRevenue: number;
  cashierRevenue: number;
  qrisRevenue: number;
  cashRevenue: number;
  noShowCount: number;
  noShowProtectedRevenue: number;
  inventoryValue: number;
}
