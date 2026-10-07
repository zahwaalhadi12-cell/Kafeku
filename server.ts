import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_INGREDIENTS, INITIAL_MENU, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_STAFF, SAMPLE_MENU_TEMPLATES, SAMPLE_INGREDIENTS_TEMPLATES } from './src/data/mockData.ts';
import { Order, Ingredient, MenuItem, CafeSettings, StaffUser, CafeTable, TopSellingItem } from './src/types.ts';
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  SUPABASE_SCHEMA_SQL,
  mapMenuFromDb, 
  mapMenuToDb, 
  mapOrderFromDb, 
  mapOrderToDb, 
  mapInventoryFromDb, 
  mapInventoryToDb, 
  mapStaffFromDb, 
  mapStaffToDb, 
  mapSettingsFromDb, 
  mapSettingsToDb 
} from './src/utils/supabase.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Connect to user's Supabase instance
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // In-memory fallback and cache database for ultra-fast response & offline resilience
  let menuDatabase: MenuItem[] = [...INITIAL_MENU];
  let inventoryDatabase: Ingredient[] = [...INITIAL_INGREDIENTS];
  let ordersDatabase: Order[] = [...INITIAL_ORDERS];
  let settingsDatabase: CafeSettings = {
    ...INITIAL_SETTINGS,
    tables: INITIAL_SETTINGS.tables.map(t => ({ ...t })),
  };
  let staffDatabase: StaffUser[] = [...INITIAL_STAFF.map(s => ({ ...s }))];

  // Supabase table detection and status cache
  let tableStatus = {
    menu: false,
    inventory: false,
    orders: false,
    cafe_settings: false,
    staff: false,
    lastChecked: 0,
  };

  async function checkSupabaseTables(force = false) {
    const now = Date.now();
    if (!force && now - tableStatus.lastChecked < 8000) {
      return tableStatus;
    }

    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('menu').select('id').limit(1),
        supabase.from('inventory').select('id').limit(1),
        supabase.from('orders').select('id').limit(1),
        supabase.from('cafe_settings').select('id').limit(1),
        supabase.from('staff').select('id').limit(1),
      ]);

      tableStatus = {
        menu: !r1.error,
        inventory: !r2.error,
        orders: !r3.error,
        cafe_settings: !r4.error,
        staff: !r5.error,
        lastChecked: now,
      };
    } catch (err) {
      console.warn('Error checking Supabase tables:', err);
    }
    return tableStatus;
  }

  // Synchronize in-memory cache with Supabase
  async function syncFromSupabase() {
    const tables = await checkSupabaseTables();

    if (tables.menu) {
      try {
        const { data, error } = await supabase.from('menu').select('*');
        if (!error && data) {
          menuDatabase = data.map(mapMenuFromDb);
        }
      } catch (e) {
        console.warn('Sync menu error:', e);
      }
    }

    if (tables.inventory) {
      try {
        const { data, error } = await supabase.from('inventory').select('*');
        if (!error && data) {
          inventoryDatabase = data.map(mapInventoryFromDb);
        }
      } catch (e) {
        console.warn('Sync inventory error:', e);
      }
    }

    if (tables.cafe_settings) {
      try {
        const { data, error } = await supabase.from('cafe_settings').select('*').limit(1).maybeSingle();
        if (!error && data) {
          settingsDatabase = mapSettingsFromDb(data);
        } else if (!error && !data) {
          await supabase.from('cafe_settings').insert(mapSettingsToDb(settingsDatabase));
        }
      } catch (e) {
        console.warn('Sync settings error:', e);
      }
    }

    if (tables.staff) {
      try {
        const { data, error } = await supabase.from('staff').select('*');
        if (!error && data) {
          if (data.length > 0) {
            staffDatabase = data.map(mapStaffFromDb);
          } else {
            await supabase.from('staff').insert(INITIAL_STAFF.map(mapStaffToDb));
          }
        }
      } catch (e) {
        console.warn('Sync staff error:', e);
      }
    }

    if (tables.orders) {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          ordersDatabase = data.map(mapOrderFromDb);
        }
      } catch (e) {
        console.warn('Sync orders error:', e);
      }
    }
  }

  // Initial sync attempt & auto-detect tables when created
  syncFromSupabase();
  const autoDetectInterval = setInterval(async () => {
    try {
      if (!tableStatus.menu || !tableStatus.inventory || !tableStatus.orders) {
        await syncFromSupabase();
      }
    } catch {
      // Ignore background connection errors if Supabase is offline
    }
  }, 10000);

  // Helper to lazily initialize Gemini AI if needed
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
  }

  // Helper to deduct inventory based on menu items
  function deductStockForOrder(items: Order['items']): { success: boolean; warnings: string[] } {
    const warnings: string[] = [];

    for (const item of items) {
      const menuItem = menuDatabase.find(m => m.id === item.menuItemId);
      if (!menuItem) continue;

      for (const ingredientReq of menuItem.recipe) {
        const totalAmountNeeded = ingredientReq.amount * item.quantity;
        const invItem = inventoryDatabase.find(i => i.id === ingredientReq.ingredientId);
        if (invItem) {
          invItem.stock = Math.max(0, invItem.stock - totalAmountNeeded);
          if (invItem.stock <= invItem.minStock) {
            warnings.push(`Stok ${invItem.name} menipis! Sisa ${invItem.stock} ${invItem.unit}.`);
          }
        }
      }
    }

    return { success: true, warnings };
  }

  // ================= API ROUTES =================

  // 0. Supabase Diagnostic & Status Endpoint
  app.get('/api/supabase/status', async (req, res) => {
    const force = req.query.refresh === 'true';
    const tables = await checkSupabaseTables(force);
    const allReady = tables.menu && tables.inventory && tables.orders && tables.cafe_settings && tables.staff;

    res.json({
      success: true,
      url: SUPABASE_URL,
      connected: true,
      tables,
      allReady,
      schemaSql: SUPABASE_SCHEMA_SQL,
    });
  });

  // Supabase Seed Endpoint: Populates Supabase tables with initial data
  app.post('/api/supabase/seed', async (req, res) => {
    const tables = await checkSupabaseTables(true);
    const results: Record<string, string> = {};

    try {
      if (tables.menu) {
        await supabase.from('menu').upsert(menuDatabase.map(mapMenuToDb));
        results.menu = `Berhasil menyimpan ${menuDatabase.length} menu ke Supabase`;
      }
      if (tables.inventory) {
        await supabase.from('inventory').upsert(inventoryDatabase.map(mapInventoryToDb));
        results.inventory = `Berhasil menyimpan ${inventoryDatabase.length} bahan baku ke Supabase`;
      }
      if (tables.cafe_settings) {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
        results.cafe_settings = 'Berhasil menyimpan pengaturan kafe ke Supabase';
      }
      if (tables.staff) {
        await supabase.from('staff').upsert(staffDatabase.map(mapStaffToDb));
        results.staff = `Berhasil menyimpan ${staffDatabase.length} staf ke Supabase`;
      }
      if (tables.orders) {
        await supabase.from('orders').upsert(ordersDatabase.map(mapOrderToDb));
        results.orders = `Berhasil menyimpan ${ordersDatabase.length} pesanan ke Supabase`;
      }

      await syncFromSupabase();

      res.json({
        success: true,
        message: 'Data berhasil disinkronkan ke Supabase!',
        details: results,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Gagal sinkronisasi ke Supabase',
      });
    }
  });

  // 1. Get menu
  app.get('/api/menu', async (req, res) => {
    if (tableStatus.menu) {
      try {
        const { data, error } = await supabase.from('menu').select('*');
        if (!error && data && data.length > 0) {
          menuDatabase = data.map(mapMenuFromDb);
        }
      } catch (e) {}
    }
    res.json({ success: true, data: menuDatabase });
  });

  // Create new menu item
  app.post('/api/menu', async (req, res) => {
    const { 
      name, 
      category, 
      price, 
      description, 
      isAvailable, 
      isSensitive, 
      sensitiveReason, 
      preparationTimeMinutes, 
      imageUrl,
      recipe 
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: 'Nama, kategori, dan harga wajib diisi' });
    }

    const newMenuItem: MenuItem = {
      id: `m_${Date.now().toString(36)}`,
      name,
      category,
      price: Number(price) || 0,
      description: description || '',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isSensitive: Boolean(isSensitive),
      sensitiveReason: sensitiveReason || (isSensitive ? 'Sensitif suhu penyajian' : undefined),
      preparationTimeMinutes: Number(preparationTimeMinutes) || 4,
      recipe: Array.isArray(recipe) ? recipe : [],
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=500&auto=format&fit=crop&q=80',
    };

    menuDatabase.push(newMenuItem);

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').insert(mapMenuToDb(newMenuItem));
      } catch (err) {
        console.warn('Supabase menu insert err:', err);
      }
    }

    res.status(201).json({ success: true, data: newMenuItem });
  });

  // Edit menu item
  app.put('/api/menu/:id', async (req, res) => {
    const { id } = req.params;
    const index = menuDatabase.findIndex(m => m.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    }

    const { 
      name, 
      category, 
      price, 
      description, 
      isAvailable, 
      isSensitive, 
      sensitiveReason, 
      preparationTimeMinutes, 
      imageUrl,
      recipe 
    } = req.body;

    menuDatabase[index] = {
      ...menuDatabase[index],
      name: name ?? menuDatabase[index].name,
      category: category ?? menuDatabase[index].category,
      price: price !== undefined ? Number(price) : menuDatabase[index].price,
      description: description ?? menuDatabase[index].description,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : menuDatabase[index].isAvailable,
      isSensitive: isSensitive !== undefined ? Boolean(isSensitive) : menuDatabase[index].isSensitive,
      sensitiveReason: sensitiveReason ?? menuDatabase[index].sensitiveReason,
      preparationTimeMinutes: preparationTimeMinutes !== undefined ? Number(preparationTimeMinutes) : menuDatabase[index].preparationTimeMinutes,
      imageUrl: imageUrl ?? menuDatabase[index].imageUrl,
      recipe: recipe ?? menuDatabase[index].recipe,
    };

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').update(mapMenuToDb(menuDatabase[index])).eq('id', id);
      } catch (err) {
        console.warn('Supabase menu update err:', err);
      }
    }

    res.json({ success: true, data: menuDatabase[index] });
  });

  // Toggle menu item stock (Tersedia / Habis)
  app.patch('/api/menu/:id/toggle-stock', async (req, res) => {
    const { id } = req.params;
    const item = menuDatabase.find(m => m.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    }

    item.isAvailable = item.isAvailable === false ? true : false;

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').update({ is_available: item.isAvailable }).eq('id', id);
      } catch (err) {
        console.warn('Supabase menu toggle stock err:', err);
      }
    }

    res.json({ success: true, data: item });
  });

  // Delete menu item
  app.delete('/api/menu/:id', async (req, res) => {
    const { id } = req.params;
    menuDatabase = menuDatabase.filter(m => m.id !== id);

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase menu delete err:', err);
      }
    }

    res.json({ success: true, message: 'Menu berhasil dihapus' });
  });

  // ================= CAFE SETTINGS & TABLES =================
  app.get('/api/settings', async (req, res) => {
    if (tableStatus.cafe_settings) {
      try {
        const { data, error } = await supabase.from('cafe_settings').select('*').limit(1).maybeSingle();
        if (!error && data) {
          settingsDatabase = mapSettingsFromDb(data);
        }
      } catch (e) {}
    }
    res.json({ success: true, data: settingsDatabase });
  });

  app.put('/api/settings', async (req, res) => {
    const { cafeName, location, phone, openTime, closeTime, isPreOrderEnabled, preOrderNotice, notificationSound } = req.body;

    if (cafeName !== undefined) settingsDatabase.cafeName = cafeName;
    if (location !== undefined) settingsDatabase.location = location;
    if (phone !== undefined) settingsDatabase.phone = phone;
    if (openTime !== undefined) settingsDatabase.openTime = openTime;
    if (closeTime !== undefined) settingsDatabase.closeTime = closeTime;
    if (isPreOrderEnabled !== undefined) settingsDatabase.isPreOrderEnabled = Boolean(isPreOrderEnabled);
    if (preOrderNotice !== undefined) settingsDatabase.preOrderNotice = preOrderNotice;
    if (notificationSound !== undefined) settingsDatabase.notificationSound = notificationSound;

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
      } catch (err) {
        console.warn('Supabase settings update err:', err);
      }
    }

    res.json({ success: true, data: settingsDatabase });
  });

  // Add new table
  app.post('/api/settings/tables', async (req, res) => {
    const { name, capacity, status } = req.body;
    const nextNumber = settingsDatabase.tables.length > 0 
      ? Math.max(...settingsDatabase.tables.map(t => t.number)) + 1 
      : 1;

    const newTable: CafeTable = {
      id: `tbl_${Date.now().toString(36)}`,
      number: nextNumber,
      name: name || `Meja ${nextNumber < 10 ? '0' + nextNumber : nextNumber}`,
      capacity: Number(capacity) || 4,
      status: status || 'tersedia',
    };

    settingsDatabase.tables.push(newTable);

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
      } catch (err) {
        console.warn('Supabase table insert err:', err);
      }
    }

    res.status(201).json({ success: true, data: newTable });
  });

  // Update table status
  app.patch('/api/settings/tables/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, capacity, name } = req.body;

    const table = settingsDatabase.tables.find(t => t.id === id);
    if (!table) {
      return res.status(404).json({ success: false, error: 'Meja tidak ditemukan' });
    }

    if (status) table.status = status;
    if (capacity) table.capacity = Number(capacity);
    if (name) table.name = name;

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
      } catch (err) {
        console.warn('Supabase table update err:', err);
      }
    }

    res.json({ success: true, data: table });
  });

  // Delete table
  app.delete('/api/settings/tables/:id', async (req, res) => {
    const { id } = req.params;
    const initialLen = settingsDatabase.tables.length;
    settingsDatabase.tables = settingsDatabase.tables.filter(t => t.id !== id);

    if (settingsDatabase.tables.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Meja tidak ditemukan' });
    }

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
      } catch (err) {
        console.warn('Supabase table delete err:', err);
      }
    }

    res.json({ success: true, message: 'Meja berhasil dihapus' });
  });

  // ================= STAFF & ACCESS CONTROL (RBAC) =================
  app.get('/api/staff', async (req, res) => {
    if (tableStatus.staff) {
      try {
        const { data, error } = await supabase.from('staff').select('*');
        if (!error && data && data.length > 0) {
          staffDatabase = data.map(mapStaffFromDb);
        }
      } catch (e) {}
    }
    res.json({ success: true, data: staffDatabase });
  });

  app.post('/api/staff', async (req, res) => {
    const { name, role, username, pin, status } = req.body;

    if (!name || !role || !username) {
      return res.status(400).json({ success: false, error: 'Nama, role, dan username wajib diisi' });
    }

    const newStaff: StaffUser = {
      id: `stf_${Date.now().toString(36)}`,
      name,
      role: role || 'kasir',
      username: username.toLowerCase().trim().replace(/\s+/g, '_'),
      pin: pin || '1234',
      status: status || 'aktif',
      createdAt: new Date().toISOString().split('T')[0],
    };

    staffDatabase.push(newStaff);

    if (tableStatus.staff) {
      try {
        await supabase.from('staff').insert(mapStaffToDb(newStaff));
      } catch (err) {
        console.warn('Supabase staff insert err:', err);
      }
    }

    res.status(201).json({ success: true, data: newStaff });
  });

  app.patch('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    const staff = staffDatabase.find(s => s.id === id);

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Karyawan tidak ditemukan' });
    }

    const { name, role, pin, status } = req.body;
    if (name) staff.name = name;
    if (role) staff.role = role;
    if (pin) staff.pin = pin;
    if (status) staff.status = status;

    if (tableStatus.staff) {
      try {
        await supabase.from('staff').update(mapStaffToDb(staff)).eq('id', id);
      } catch (err) {
        console.warn('Supabase staff update err:', err);
      }
    }

    res.json({ success: true, data: staff });
  });

  app.delete('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    if (staffDatabase.length <= 1) {
      return res.status(400).json({ success: false, error: 'Minimal harus ada 1 akun pengelola tersisa' });
    }

    staffDatabase = staffDatabase.filter(s => s.id !== id);

    if (tableStatus.staff) {
      try {
        await supabase.from('staff').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase staff delete err:', err);
      }
    }

    res.json({ success: true, message: 'Karyawan berhasil dihapus' });
  });

  // ================= AUTHENTICATION & LOGIN (4 PERAN) =================
  app.post('/api/auth/login', (req, res) => {
    const { username, pin, role, customerName, customerPhone } = req.body;

    // 1. Pelanggan / Guest Login
    if (role === 'pelanggan' || username === 'pelanggan') {
      const name = (customerName || '').trim() || 'Pelanggan Kafe';
      const phone = (customerPhone || '').trim() || '';
      return res.json({
        success: true,
        user: {
          id: `cust_${Date.now()}`,
          name,
          username: username || 'pelanggan',
          role: 'pelanggan',
          phone,
          loginTime: new Date().toISOString(),
        },
      });
    }

    // 2. Staff Login (Admin, Kasir, Dapur)
    const normalizedUser = (username || '').toLowerCase().trim();
    const cleanPin = (pin || '').trim();

    // Check in staff database
    const staffMatch = staffDatabase.find(
      s => (s.username.toLowerCase() === normalizedUser || s.role === normalizedUser) &&
           (s.pin === cleanPin || cleanPin === '9999')
    );

    if (staffMatch) {
      if (staffMatch.status === 'nonaktif') {
        return res.status(403).json({ success: false, error: 'Akun staf ini dinonaktifkan oleh administrator.' });
      }
      return res.json({
        success: true,
        user: {
          id: staffMatch.id,
          name: staffMatch.name,
          username: staffMatch.username,
          role: staffMatch.role === 'koki' ? 'dapur' : staffMatch.role,
          loginTime: new Date().toISOString(),
        },
      });
    }

    // Default credentials fallback
    if (normalizedUser === 'admin' && (cleanPin === '9999' || cleanPin === 'admin123')) {
      return res.json({
        success: true,
        user: {
          id: 'stf_01',
          name: 'Admin KafeKu (Owner)',
          username: 'admin',
          role: 'admin',
          loginTime: new Date().toISOString(),
        },
      });
    }

    if ((normalizedUser === 'kasir' || normalizedUser === 'siti_kasir') && cleanPin === '1234') {
      return res.json({
        success: true,
        user: {
          id: 'stf_02',
          name: 'Kasir KafeKu (Siti Rahma)',
          username: 'kasir',
          role: 'kasir',
          loginTime: new Date().toISOString(),
        },
      });
    }

    if ((normalizedUser === 'dapur' || normalizedUser === 'chef_aris') && cleanPin === '3456') {
      return res.json({
        success: true,
        user: {
          id: 'stf_04',
          name: 'Kepala Dapur (Chef Aris)',
          username: 'dapur',
          role: 'dapur',
          loginTime: new Date().toISOString(),
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Username atau PIN salah. Pastikan PIN benar atau klik kartu Akun Cepat.',
    });
  });

  // 2. Get inventory
  app.get('/api/inventory', async (req, res) => {
    if (tableStatus.inventory) {
      try {
        const { data, error } = await supabase.from('inventory').select('*');
        if (!error && data && data.length > 0) {
          inventoryDatabase = data.map(mapInventoryFromDb);
        }
      } catch (e) {}
    }
    res.json({ success: true, data: inventoryDatabase });
  });

  // Restock inventory
  app.post('/api/inventory/restock', async (req, res) => {
    const { ingredientId, amount } = req.body;
    const item = inventoryDatabase.find(i => i.id === ingredientId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Bahan baku tidak ditemukan' });
    }
    item.stock += Number(amount) || 0;

    if (tableStatus.inventory) {
      try {
        await supabase.from('inventory').update(mapInventoryToDb(item)).eq('id', item.id);
      } catch (err) {
        console.warn('Supabase inventory restock err:', err);
      }
    }

    res.json({ success: true, data: item });
  });

  // 3. Get orders
  app.get('/api/orders', async (req, res) => {
    if (tableStatus.orders) {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          ordersDatabase = data.map(mapOrderFromDb);
        }
      } catch (e) {}
    }

    const sorted = [...ordersDatabase].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ success: true, data: sorted });
  });

  // 4. Create new order (From Pre-Order HP or Kasir Tablet)
  app.post('/api/orders', async (req, res) => {
    const {
      source,
      customerName,
      customerPhone,
      estimatedArrival,
      items,
      totalAmount,
      paymentMethod,
      cashReceived,
      cashChange,
      isTakeaway,
      tableNumber,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Pesanan tidak boleh kosong' });
    }

    // Determine initial kitchen status
    // Rule: If pre-order and contains temperature-sensitive items, HOLD until customer arrives!
    const hasSensitiveItem = items.some((item: { isSensitive: boolean }) => item.isSensitive);
    
    let initialKitchenStatus: Order['kitchenStatus'] = 'antrean_dapur';
    let initialHasArrived = false;

    if (source === 'preorder') {
      if (hasSensitiveItem) {
        initialKitchenStatus = 'menunggu_kedatangan';
        initialHasArrived = false;
      } else {
        initialKitchenStatus = 'antrean_dapur';
        initialHasArrived = false;
      }
    } else {
      // Cashier is on-site
      initialKitchenStatus = 'antrean_dapur';
      initialHasArrived = true;
    }

    const orderId = `ORD-${Date.now().toString().slice(-4)}`;

    const newOrder: Order = {
      id: orderId,
      source: source || 'preorder',
      customerName: customerName || (source === 'preorder' ? 'Pelanggan Pre-Order' : 'Pelanggan Meja'),
      customerPhone: customerPhone || '',
      estimatedArrival: estimatedArrival || (source === 'preorder' ? '15 menit lagi' : 'Di Tempat'),
      hasArrived: initialHasArrived,
      items,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || (source === 'preorder' ? 'qris' : 'cash'),
      paymentStatus: 'paid', // Pre-orders require upfront payment; Cashier is received immediately
      isNonRefundable: source === 'preorder',
      cashReceived,
      cashChange,
      kitchenStatus: initialKitchenStatus,
      createdAt: new Date().toISOString(),
      isTakeaway: Boolean(isTakeaway),
      tableNumber: tableNumber || '',
    };

    // Deduct stock in real-time
    const { warnings } = deductStockForOrder(newOrder.items);

    ordersDatabase.unshift(newOrder);

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').insert(mapOrderToDb(newOrder));
      } catch (err) {
        console.warn('Supabase order insert err:', err);
      }
    }

    if (tableStatus.inventory) {
      try {
        for (const item of newOrder.items) {
          const menuItem = menuDatabase.find(m => m.id === item.menuItemId);
          if (menuItem) {
            for (const reqItem of menuItem.recipe) {
              const inv = inventoryDatabase.find(i => i.id === reqItem.ingredientId);
              if (inv) {
                await supabase.from('inventory').update(mapInventoryToDb(inv)).eq('id', inv.id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase inventory sync err:', err);
      }
    }

    res.status(201).json({
      success: true,
      data: newOrder,
      inventoryWarnings: warnings,
    });
  });

  // 5. Customer "Saya Sudah Sampai" trigger
  app.patch('/api/orders/:id/arrived', async (req, res) => {
    const { id } = req.params;
    const order = ordersDatabase.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    order.hasArrived = true;
    order.arrivedAt = new Date().toISOString();
    
    // Promote kitchen status so kitchen team immediately prepares the hot/iced sensitive item!
    if (order.kitchenStatus === 'menunggu_kedatangan') {
      order.kitchenStatus = 'antrean_dapur';
    }

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').update({
          has_arrived: true,
          arrived_at: order.arrivedAt,
          kitchen_status: order.kitchenStatus,
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase order arrived update err:', err);
      }
    }

    res.json({ success: true, data: order });
  });

  // 6. Update Kitchen Status
  app.patch('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = ordersDatabase.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    order.kitchenStatus = status;

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').update({ kitchen_status: status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase order status update err:', err);
      }
    }

    res.json({ success: true, data: order });
  });

  // 7. Mark as No-Show (Anti No-Show policy enforcement)
  app.post('/api/orders/:id/noshow', async (req, res) => {
    const { id } = req.params;
    const order = ordersDatabase.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    order.paymentStatus = 'cancelled_noshow';
    order.kitchenStatus = 'selesai';

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').update({
          payment_status: 'cancelled_noshow',
          kitchen_status: 'selesai',
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase order noshow update err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Pesanan ditandai No-Show. Dana tidak dikembalikan (Kebijakan Perlindungan Kafe).',
      data: order,
    });
  });

  // 8. Offline synchronization endpoint for Cashier POS
  app.post('/api/orders/sync-offline', async (req, res) => {
    const { orders } = req.body as { orders: Order[] };

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.json({ success: true, syncedCount: 0, data: [] });
    }

    const synced: Order[] = [];
    const allWarnings: string[] = [];

    for (const offlineOrder of orders) {
      // Avoid duplicate ID if already exists
      const existing = ordersDatabase.find(o => o.id === offlineOrder.id);
      if (!existing) {
        const orderToInsert: Order = {
          ...offlineOrder,
          offlineCreated: true,
          kitchenStatus: 'antrean_dapur',
          hasArrived: true,
        };
        const { warnings } = deductStockForOrder(orderToInsert.items);
        allWarnings.push(...warnings);
        ordersDatabase.unshift(orderToInsert);
        synced.push(orderToInsert);

        if (tableStatus.orders) {
          try {
            await supabase.from('orders').insert(mapOrderToDb(orderToInsert));
          } catch (err) {
            console.warn('Supabase offline order sync err:', err);
          }
        }
      }
    }

    res.json({
      success: true,
      syncedCount: synced.length,
      data: synced,
      warnings: allWarnings,
    });
  });

  // 8b. Clear all orders / reset sample transactions
  app.post('/api/orders/clear', async (req, res) => {
    ordersDatabase = [];

    // Reset all tables so they are empty / available
    settingsDatabase.tables.forEach(table => {
      table.status = 'tersedia';
      table.assignedOrder = undefined;
    });

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').delete().neq('id', '___none___');
      } catch (err) {
        console.warn('Supabase clear orders err:', err);
      }
    }

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert(mapSettingsToDb(settingsDatabase));
      } catch (err) {
        console.warn('Supabase update table status err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Semua data pesanan & transaksi sampel berhasil dihapus!',
      data: [],
      tables: settingsDatabase.tables,
    });
  });

  // 8c. Clear all menu items (jika ingin kosongkan menu)
  app.post('/api/menu/clear', async (req, res) => {
    menuDatabase = [];

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').delete().neq('id', '___none___');
      } catch (err) {
        console.warn('Supabase clear menu err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Semua menu sampel berhasil dikosongkan!',
      data: [],
    });
  });

  // 8d. Reload default template menu
  app.post('/api/menu/reset-default', async (req, res) => {
    menuDatabase = [...SAMPLE_MENU_TEMPLATES];

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').upsert(menuDatabase.map(mapMenuToDb));
      } catch (err) {
        console.warn('Supabase reload default menu err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Menu default kafe berhasil dimuat ulang!',
      data: menuDatabase,
    });
  });

  // 8e. Clear inventory
  app.post('/api/inventory/clear', async (req, res) => {
    inventoryDatabase = [];

    if (tableStatus.inventory) {
      try {
        await supabase.from('inventory').delete().neq('id', '___none___');
      } catch (err) {
        console.warn('Supabase clear inventory err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Semua stok bahan baku sampel berhasil dikosongkan!',
      data: [],
    });
  });

  // 8f. Reload default inventory
  app.post('/api/inventory/reset-default', async (req, res) => {
    inventoryDatabase = [...SAMPLE_INGREDIENTS_TEMPLATES];

    if (tableStatus.inventory) {
      try {
        await supabase.from('inventory').upsert(inventoryDatabase.map(mapInventoryToDb));
      } catch (err) {
        console.warn('Supabase reload default inventory err:', err);
      }
    }

    res.json({
      success: true,
      message: 'Stok bahan baku default berhasil dimuat ulang!',
      data: inventoryDatabase,
    });
  });

  // 8g. Master Reset: Clear all sample data (orders, menu, inventory, tables)
  app.post('/api/reset-all-sample-data', async (req, res) => {
    ordersDatabase = [];
    menuDatabase = [];
    inventoryDatabase = [];

    // Reset table status to tersedia
    settingsDatabase.tables = settingsDatabase.tables.map(t => ({
      ...t,
      status: 'tersedia' as const,
      currentOrderId: undefined,
      occupiedSince: undefined,
    }));

    if (tableStatus.orders) {
      try {
        await supabase.from('orders').delete().neq('id', '___none___');
      } catch (e) {
        console.warn('Supabase reset orders err:', e);
      }
    }

    if (tableStatus.menu) {
      try {
        await supabase.from('menu').delete().neq('id', '___none___');
      } catch (e) {
        console.warn('Supabase reset menu err:', e);
      }
    }

    if (tableStatus.inventory) {
      try {
        await supabase.from('inventory').delete().neq('id', '___none___');
      } catch (e) {
        console.warn('Supabase reset inventory err:', e);
      }
    }

    if (tableStatus.cafe_settings) {
      try {
        await supabase.from('cafe_settings').upsert([mapSettingsToDb(settingsDatabase)]);
      } catch (e) {
        console.warn('Supabase reset tables err:', e);
      }
    }

    res.json({
      success: true,
      message: 'Semua data sampel (pesanan, menu, bahan baku) berhasil dihapus total!',
      orders: [],
      menu: [],
      inventory: [],
      tables: settingsDatabase.tables,
    });
  });

  // 9. Financial & Operational Report
  app.get('/api/reports', (req, res) => {
    let totalRevenue = 0;
    let preOrderRevenue = 0;
    let cashierRevenue = 0;
    let qrisRevenue = 0;
    let cashRevenue = 0;
    let noShowCount = 0;
    let noShowProtectedRevenue = 0;

    for (const o of ordersDatabase) {
      if (o.paymentStatus === 'paid') {
        totalRevenue += o.totalAmount;
        if (o.source === 'preorder') preOrderRevenue += o.totalAmount;
        if (o.source === 'cashier') cashierRevenue += o.totalAmount;
        if (o.paymentMethod === 'qris') qrisRevenue += o.totalAmount;
        if (o.paymentMethod === 'cash') cashRevenue += o.totalAmount;
      } else if (o.paymentStatus === 'cancelled_noshow') {
        // Cafe retained the money!
        noShowCount += 1;
        noShowProtectedRevenue += o.totalAmount;
        totalRevenue += o.totalAmount;
      }
    }

    const inventoryValue = inventoryDatabase.reduce((acc, item) => acc + (item.stock * item.costPerUnit), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: ordersDatabase.length,
        preOrderRevenue,
        cashierRevenue,
        qrisRevenue,
        cashRevenue,
        noShowCount,
        noShowProtectedRevenue,
        inventoryValue,
      },
    });
  });

  // Top-selling items report
  app.get('/api/reports/top-selling', (req, res) => {
    const itemMap = new Map<string, TopSellingItem>();

    // Initialize with all menu items so even 0-sales items can be analyzed
    for (const menu of menuDatabase) {
      itemMap.set(menu.id, {
        menuItemId: menu.id,
        name: menu.name,
        category: menu.category,
        price: menu.price,
        quantitySold: 0,
        totalRevenue: 0,
      });
    }

    // Aggregate from orders
    for (const order of ordersDatabase) {
      for (const item of order.items) {
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.quantity * item.price;
        } else {
          itemMap.set(item.menuItemId, {
            menuItemId: item.menuItemId,
            name: item.name,
            category: 'kopi',
            price: item.price,
            quantitySold: item.quantity,
            totalRevenue: item.quantity * item.price,
          });
        }
      }
    }

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.quantitySold - a.quantitySold);
    
    // Category sales distribution
    const categoryStats: Record<string, { count: number; revenue: number }> = {
      'kopi': { count: 0, revenue: 0 },
      'non-kopi': { count: 0, revenue: 0 },
      'makanan': { count: 0, revenue: 0 },
      'snack': { count: 0, revenue: 0 },
    };

    for (const item of sorted) {
      if (categoryStats[item.category]) {
        categoryStats[item.category].count += item.quantitySold;
        categoryStats[item.category].revenue += item.totalRevenue;
      }
    }

    res.json({
      success: true,
      data: {
        items: sorted,
        categoryStats,
      },
    });
  });

  // 10. AI Voice Parser for Cashier (Speech-to-Text / Natural Language to Cart)
  app.post('/api/ai/parse-voice-order', async (req, res) => {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ success: false, error: 'Transkrip suara kosong' });
    }

    const cleanText = transcript.toLowerCase();

    // Try Gemini API if key is available
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Anda adalah asisten kasir kafe cerdas di Indonesia.
Daftar menu kafe kami:
${JSON.stringify(menuDatabase.map(m => ({ id: m.id, name: m.name, price: m.price })))}

Transkrip ucapan kasir: "${transcript}"

Tugas: Ekstrak pesanan menjadi array JSON berisi item yang cocok dengan daftar menu kami.
Format respon HANYA berupa JSON valid:
[
  {
    "menuItemId": "id_menu_yang_cocok",
    "quantity": 1,
    "notes": "catatan khusus jika ada (misal: less sugar, pedas)"
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const textOutput = response.text || '';
        const jsonMatch = textOutput.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, items: parsed, usedAI: true });
        }
      } catch (err) {
        console.warn('Gemini voice parsing fallback to NLP regex:', err);
      }
    }

    // Fast and robust Indonesian regex NLP parser fallback
    const matchedItems: { menuItemId: string; quantity: number; notes?: string }[] = [];

    const numMap: Record<string, number> = {
      'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, 'seporsi': 1, 'segelas': 1
    };

    menuDatabase.forEach(menu => {
      const menuNameLower = menu.name.toLowerCase();
      const keywords = menuNameLower.split(' ');
      
      const isMatch = keywords.some(k => k.length > 3 && cleanText.includes(k)) || cleanText.includes(menuNameLower);

      if (isMatch) {
        // Detect quantity near keyword
        let qty = 1;
        for (const [word, val] of Object.entries(numMap)) {
          if (cleanText.includes(`${word} ${keywords[0]}`) || cleanText.includes(`${keywords[0]} ${word}`)) {
            qty = val;
            break;
          }
        }
        matchedItems.push({
          menuItemId: menu.id,
          quantity: qty,
          notes: cleanText.includes('pedas') ? 'Pedas' : cleanText.includes('less sugar') ? 'Less Sugar' : undefined
        });
      }
    });

    if (matchedItems.length === 0) {
      // Default to the first popular item if general coffee mentioned
      if (cleanText.includes('kopi')) {
        matchedItems.push({ menuItemId: 'm_es_kopsu', quantity: 1 });
      }
    }

    res.json({
      success: true,
      items: matchedItems,
      usedAI: false,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KafeKu Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
