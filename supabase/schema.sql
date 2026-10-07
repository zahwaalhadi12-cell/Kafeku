-- KafeKu Supabase Database Setup Script
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
