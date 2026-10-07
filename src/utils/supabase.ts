import { createClient } from '@supabase/supabase-js';
import { MenuItem, Ingredient, Order, CafeSettings, StaffUser } from '../types.ts';

// Supabase configuration provided by the user
export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  'https://yuyrqhqngjfikkhfwern.supabase.co';

export const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eXJxaHFuZ2pmaWtraGZ3ZXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTYzNTIsImV4cCI6MjEwNjI5MjM1Mn0.LM_zI10Li77VE-XYW6ywKyHiNiEUFTnh4cHf5FmGQ48';

// Create isomorphic Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// SQL Schema script for user to run in Supabase SQL editor if tables need to be created
export const SUPABASE_SCHEMA_SQL = `-- KafeKu Supabase Database Setup Script
-- Project URL: https://yuyrqhqngjfikkhfwern.supabase.co
-- Salin dan jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yuyrqhqngjfikkhfwern/sql/new

-- 1. Tabel Menu Makanan & Minuman
CREATE TABLE IF NOT EXISTS public.menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('kopi', 'non-kopi', 'makanan', 'snack')),
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  sensitive_reason TEXT,
  preparation_time_minutes INTEGER DEFAULT 4,
  image_url TEXT,
  recipe JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Inventori Bahan Baku
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_stock NUMERIC NOT NULL DEFAULT 5,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Pesanan (Pre-Order & Kasir POS)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'preorder' CHECK (source IN ('preorder', 'cashier')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  estimated_arrival TEXT DEFAULT '',
  has_arrived BOOLEAN NOT NULL DEFAULT false,
  arrived_at TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'qris' CHECK (payment_method IN ('qris', 'cash', 'ewallet')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled_noshow')),
  is_non_refundable BOOLEAN NOT NULL DEFAULT false,
  cash_received NUMERIC,
  cash_change NUMERIC,
  kitchen_status TEXT NOT NULL DEFAULT 'antrean_dapur' CHECK (kitchen_status IN ('menunggu_kedatangan', 'antrean_dapur', 'sedang_dimasak', 'siap_diambil', 'selesai')),
  offline_created BOOLEAN DEFAULT false,
  is_takeaway BOOLEAN DEFAULT false,
  table_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Pengaturan Kafe & Meja
CREATE TABLE IF NOT EXISTS public.cafe_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  cafe_name TEXT NOT NULL DEFAULT 'KafeKu Specialty & Artisan Coffee',
  location TEXT DEFAULT 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  phone TEXT DEFAULT '0812-9876-5432',
  open_time TEXT DEFAULT '08:00',
  close_time TEXT DEFAULT '22:00',
  is_pre_order_enabled BOOLEAN DEFAULT true,
  pre_order_notice TEXT DEFAULT 'Pre-Order siap diproses. Minuman sensitif suhu mulai diracik saat Anda tiba.',
  notification_sound TEXT DEFAULT 'ting_klasik',
  tables JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Staf & Karyawan
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kasir', 'koki')),
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL DEFAULT '1234',
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Penuh untuk Anon Key
DROP POLICY IF EXISTS "Public access for menu" ON public.menu;
CREATE POLICY "Public access for menu" ON public.menu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for inventory" ON public.inventory;
CREATE POLICY "Public access for inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for orders" ON public.orders;
CREATE POLICY "Public access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for cafe_settings" ON public.cafe_settings;
CREATE POLICY "Public access for cafe_settings" ON public.cafe_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for staff" ON public.staff;
CREATE POLICY "Public access for staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- Aktifkan Realtime Publikasi (Aman & Idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'inventory') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`;

// Helper converters between DB snake_case and TypeScript camelCase

export function mapMenuFromDb(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    description: row.description || '',
    isAvailable: row.is_available ?? true,
    isSensitive: Boolean(row.is_sensitive),
    sensitiveReason: row.sensitive_reason || undefined,
    preparationTimeMinutes: row.preparation_time_minutes ?? 4,
    recipe: row.recipe || [],
    imageUrl: row.image_url || '',
  };
}

export function mapMenuToDb(item: MenuItem): any {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    description: item.description,
    is_available: item.isAvailable ?? true,
    is_sensitive: item.isSensitive,
    sensitive_reason: item.sensitiveReason ?? null,
    preparation_time_minutes: item.preparationTimeMinutes,
    recipe: item.recipe,
    image_url: item.imageUrl,
  };
}

export function mapOrderFromDb(row: any): Order {
  return {
    id: row.id,
    source: row.source,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || '',
    estimatedArrival: row.estimated_arrival || '',
    hasArrived: Boolean(row.has_arrived),
    arrivedAt: row.arrived_at || undefined,
    items: row.items || [],
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    isNonRefundable: Boolean(row.is_non_refundable),
    cashReceived: row.cash_received != null ? Number(row.cash_received) : undefined,
    cashChange: row.cash_change != null ? Number(row.cash_change) : undefined,
    kitchenStatus: row.kitchen_status,
    offlineCreated: Boolean(row.offline_created),
    isTakeaway: Boolean(row.is_takeaway),
    tableNumber: row.table_number || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapOrderToDb(order: Order): any {
  return {
    id: order.id,
    source: order.source,
    customer_name: order.customerName,
    customer_phone: order.customerPhone || '',
    estimated_arrival: order.estimatedArrival || '',
    has_arrived: Boolean(order.hasArrived),
    arrived_at: order.arrivedAt || null,
    items: order.items,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    is_non_refundable: Boolean(order.isNonRefundable),
    cash_received: order.cashReceived ?? null,
    cash_change: order.cashChange ?? null,
    kitchen_status: order.kitchenStatus,
    offline_created: Boolean(order.offlineCreated),
    is_takeaway: Boolean(order.isTakeaway),
    table_number: order.tableNumber || '',
    created_at: order.createdAt,
  };
}

export function mapInventoryFromDb(row: any): Ingredient {
  return {
    id: row.id,
    name: row.name,
    stock: Number(row.stock),
    unit: row.unit,
    minStock: Number(row.min_stock),
    costPerUnit: Number(row.cost_per_unit),
  };
}

export function mapInventoryToDb(item: Ingredient): any {
  return {
    id: item.id,
    name: item.name,
    stock: item.stock,
    unit: item.unit,
    min_stock: item.minStock,
    cost_per_unit: item.costPerUnit,
  };
}

export function mapStaffFromDb(row: any): StaffUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    username: row.username,
    pin: row.pin,
    status: row.status,
    createdAt: row.created_at || new Date().toISOString().split('T')[0],
  };
}

export function mapStaffToDb(staff: StaffUser): any {
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    username: staff.username,
    pin: staff.pin,
    status: staff.status,
    created_at: staff.createdAt,
  };
}

export function mapSettingsFromDb(row: any): CafeSettings {
  return {
    cafeName: row.cafe_name,
    location: row.location || '',
    phone: row.phone || '',
    openTime: row.open_time || '08:00',
    closeTime: row.close_time || '22:00',
    isPreOrderEnabled: row.is_pre_order_enabled ?? true,
    preOrderNotice: row.pre_order_notice || '',
    notificationSound: row.notification_sound || 'ting_klasik',
    tables: row.tables || [],
  };
}

export function mapSettingsToDb(settings: CafeSettings): any {
  return {
    id: 'default',
    cafe_name: settings.cafeName,
    location: settings.location,
    phone: settings.phone,
    open_time: settings.openTime,
    close_time: settings.closeTime,
    is_pre_order_enabled: settings.isPreOrderEnabled,
    pre_order_notice: settings.preOrderNotice,
    notification_sound: settings.notificationSound || 'ting_klasik',
    tables: settings.tables,
    updated_at: new Date().toISOString(),
  };
}
