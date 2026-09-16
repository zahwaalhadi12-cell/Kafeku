import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_INGREDIENTS, INITIAL_MENU, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_STAFF } from './src/data/mockData.ts';
import { Order, Ingredient, MenuItem, CafeSettings, StaffUser, CafeTable, TopSellingItem } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent database for the session
  let menuDatabase: MenuItem[] = [...INITIAL_MENU];
  let inventoryDatabase: Ingredient[] = [...INITIAL_INGREDIENTS];
  let ordersDatabase: Order[] = [...INITIAL_ORDERS];
  let settingsDatabase: CafeSettings = {
    ...INITIAL_SETTINGS,
    tables: INITIAL_SETTINGS.tables.map(t => ({ ...t })),
  };
  let staffDatabase: StaffUser[] = [...INITIAL_STAFF.map(s => ({ ...s }))];

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

  // 1. Get menu
  app.get('/api/menu', (req, res) => {
    res.json({ success: true, data: menuDatabase });
  });

  // Create new menu item
  app.post('/api/menu', (req, res) => {
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
    res.status(201).json({ success: true, data: newMenuItem });
  });

  // Edit menu item
  app.put('/api/menu/:id', (req, res) => {
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

    res.json({ success: true, data: menuDatabase[index] });
  });

  // Toggle menu item stock (Tersedia / Habis)
  app.patch('/api/menu/:id/toggle-stock', (req, res) => {
    const { id } = req.params;
    const item = menuDatabase.find(m => m.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    }

    item.isAvailable = item.isAvailable === false ? true : false;
    res.json({ success: true, data: item });
  });

  // Delete menu item
  app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = menuDatabase.length;
    menuDatabase = menuDatabase.filter(m => m.id !== id);

    if (menuDatabase.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    }

    res.json({ success: true, message: 'Menu berhasil dihapus' });
  });

  // ================= CAFE SETTINGS & TABLES =================
  app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: settingsDatabase });
  });

  app.put('/api/settings', (req, res) => {
    const { cafeName, location, phone, openTime, closeTime, isPreOrderEnabled, preOrderNotice, notificationSound } = req.body;

    if (cafeName !== undefined) settingsDatabase.cafeName = cafeName;
    if (location !== undefined) settingsDatabase.location = location;
    if (phone !== undefined) settingsDatabase.phone = phone;
    if (openTime !== undefined) settingsDatabase.openTime = openTime;
    if (closeTime !== undefined) settingsDatabase.closeTime = closeTime;
    if (isPreOrderEnabled !== undefined) settingsDatabase.isPreOrderEnabled = Boolean(isPreOrderEnabled);
    if (preOrderNotice !== undefined) settingsDatabase.preOrderNotice = preOrderNotice;
    if (notificationSound !== undefined) settingsDatabase.notificationSound = notificationSound;

    res.json({ success: true, data: settingsDatabase });
  });

  // Add new table
  app.post('/api/settings/tables', (req, res) => {
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
    res.status(201).json({ success: true, data: newTable });
  });

  // Update table status
  app.patch('/api/settings/tables/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, capacity, name } = req.body;

    const table = settingsDatabase.tables.find(t => t.id === id);
    if (!table) {
      return res.status(404).json({ success: false, error: 'Meja tidak ditemukan' });
    }

    if (status) table.status = status;
    if (capacity) table.capacity = Number(capacity);
    if (name) table.name = name;

    res.json({ success: true, data: table });
  });

  // Delete table
  app.delete('/api/settings/tables/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = settingsDatabase.tables.length;
    settingsDatabase.tables = settingsDatabase.tables.filter(t => t.id !== id);

    if (settingsDatabase.tables.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Meja tidak ditemukan' });
    }

    res.json({ success: true, message: 'Meja berhasil dihapus' });
  });

  // ================= STAFF & ACCESS CONTROL (RBAC) =================
  app.get('/api/staff', (req, res) => {
    res.json({ success: true, data: staffDatabase });
  });

  app.post('/api/staff', (req, res) => {
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
    res.status(201).json({ success: true, data: newStaff });
  });

  app.patch('/api/staff/:id', (req, res) => {
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

    res.json({ success: true, data: staff });
  });

  app.delete('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    if (staffDatabase.length <= 1) {
      return res.status(400).json({ success: false, error: 'Minimal harus ada 1 akun pengelola tersisa' });
    }

    staffDatabase = staffDatabase.filter(s => s.id !== id);
    res.json({ success: true, message: 'Karyawan berhasil dihapus' });
  });

  // 2. Get inventory
  app.get('/api/inventory', (req, res) => {
    res.json({ success: true, data: inventoryDatabase });
  });

  // Restock inventory
  app.post('/api/inventory/restock', (req, res) => {
    const { ingredientId, amount } = req.body;
    const item = inventoryDatabase.find(i => i.id === ingredientId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Bahan baku tidak ditemukan' });
    }
    item.stock += Number(amount) || 0;
    res.json({ success: true, data: item });
  });

  // 3. Get orders
  app.get('/api/orders', (req, res) => {
    // Sort orders newest first
    const sorted = [...ordersDatabase].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ success: true, data: sorted });
  });

  // 4. Create new order (From Pre-Order HP or Kasir Tablet)
  app.post('/api/orders', (req, res) => {
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
    };

    // Deduct stock in real-time
    const { warnings } = deductStockForOrder(newOrder.items);

    ordersDatabase.unshift(newOrder);

    res.status(201).json({
      success: true,
      data: newOrder,
      inventoryWarnings: warnings,
    });
  });

  // 5. Customer "Saya Sudah Sampai" trigger
  app.patch('/api/orders/:id/arrived', (req, res) => {
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

    res.json({ success: true, data: order });
  });

  // 6. Update Kitchen Status
  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = ordersDatabase.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    order.kitchenStatus = status;
    res.json({ success: true, data: order });
  });

  // 7. Mark as No-Show (Anti No-Show policy enforcement)
  app.post('/api/orders/:id/noshow', (req, res) => {
    const { id } = req.params;
    const order = ordersDatabase.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    order.paymentStatus = 'cancelled_noshow';
    order.kitchenStatus = 'selesai';
    res.json({
      success: true,
      message: 'Pesanan ditandai No-Show. Dana tidak dikembalikan (Kebijakan Perlindungan Kafe).',
      data: order,
    });
  });

  // 8. Offline synchronization endpoint for Cashier POS
  app.post('/api/orders/sync-offline', (req, res) => {
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
      }
    }

    res.json({
      success: true,
      syncedCount: synced.length,
      data: synced,
      warnings: allWarnings,
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
