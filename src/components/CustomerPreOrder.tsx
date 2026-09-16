import React, { useState } from 'react';
import { MenuItem, Order, OrderItem, CafeSettings } from '../types.ts';
import { formatRupiah, formatTime } from '../utils/formatters.ts';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  QrCode, 
  ShoppingBag, 
  Sparkles, 
  Flame, 
  Snowflake, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight,
  Send,
  Ban,
  Coffee,
  Package
} from 'lucide-react';

interface CustomerPreOrderProps {
  menuList: MenuItem[];
  orders: Order[];
  onCreateOrder: (orderData: Partial<Order>) => Promise<Order | null>;
  onMarkArrived: (orderId: string) => Promise<void>;
  isOfflineMode: boolean;
  settings?: CafeSettings;
}

export const CustomerPreOrder: React.FC<CustomerPreOrderProps> = ({
  menuList,
  orders,
  onCreateOrder,
  onMarkArrived,
  isOfflineMode,
  settings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'kopi' | 'non-kopi' | 'makanan' | 'snack'>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('Budi Santoso');
  const [customerPhone, setCustomerPhone] = useState('08123456789');
  const [diningOption, setDiningOption] = useState<'takeaway' | string>('takeaway');
  const [arrivalMinutes, setArrivalMinutes] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [pendingOrderPayload, setPendingOrderPayload] = useState<Partial<Order> | null>(null);

  // Filter menu
  const filteredMenu = selectedCategory === 'all' 
    ? menuList 
    : menuList.filter(m => m.category === selectedCategory);

  // Customer's active pre-orders (from this session / filtered by preorder)
  const customerOrders = orders.filter(o => o.source === 'preorder');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        isSensitive: item.isSensitive,
        notes: '',
      }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const totalCartAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasSensitiveInCart = cart.some(i => i.isSensitive);

  const handleCheckoutInitiate = () => {
    if (cart.length === 0) return;

    const arrivalLabel = `${arrivalMinutes} menit lagi (sekitar ${new Date(Date.now() + arrivalMinutes * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;

    const isTakeawayOrder = diningOption === 'takeaway';
    const chosenTable = isTakeawayOrder ? undefined : diningOption;

    const orderPayload: Partial<Order> = {
      source: 'preorder',
      customerName,
      customerPhone,
      isTakeaway: isTakeawayOrder,
      tableNumber: chosenTable,
      estimatedArrival: arrivalLabel,
      items: cart,
      totalAmount: totalCartAmount,
      paymentMethod: 'qris',
      paymentStatus: 'paid',
      isNonRefundable: true,
    };

    setPendingOrderPayload(orderPayload);
    setShowQrisModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingOrderPayload) return;
    setIsSubmitting(true);
    try {
      await onCreateOrder(pendingOrderPayload);
      setCart([]);
      setShowQrisModal(false);
      setPendingOrderPayload(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Offline Alert if simulated */}
      {isOfflineMode && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>Mode offline aktif. Pada sistem nyata, pre-order membutuhkan koneksi internet untuk verifikasi QRIS.</span>
          </div>
        </div>
      )}

      {/* Hero Banner for Pre-Order & "Saya Sudah Sampai" Concept */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-stone-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Pre-Order Pintar KafeKu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-50">
            Pesan di Jalan, Tiba Langsung Santap Dalam Kondisi Sempurna
          </h1>
          <p className="text-stone-300 text-sm leading-relaxed">
            Tidak perlu khawatir es kopi Anda mencair atau croissant Anda mendingin. Khusus menu sensitif suhu, dapur kami baru mulai meracik begitu Anda menekan tombol <strong className="text-amber-300">"Saya Sudah Sampai"</strong> di kafe!
          </p>
        </div>

        {/* Anti No-Show Protection Policy Strip */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Kebijakan Anti No-Show:</span>
            <span className="text-stone-300">Wajib bayar QRIS di awal. No-Refund jika batal sepihak untuk melindungi bahan baku segar.</span>
          </div>
          <div className="flex items-center space-x-3 text-stone-300 font-medium">
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka {settings?.openTime || '08:00'} - {settings?.closeTime || '22:00'} WIB</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>KafeKu Senopati</span>
            </div>
          </div>
        </div>
      </div>

      {/* BANNER JIKA SISTEM PRE-ORDER DINONAKTIFKAN OLEH ADMIN */}
      {settings && settings.isPreOrderEnabled === false && (
        <div className="bg-red-50 border-2 border-red-300 text-red-950 p-4 rounded-2xl flex items-start space-x-3 shadow-xs">
          <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-sm text-red-900">
              Sistem Pre-Order Pintar Sedang Ditutup Sementara
            </h4>
            <p className="text-red-800 leading-relaxed font-medium">
              {settings.preOrderNotice || 'Mohon maaf, sistem pre-order saat ini sedang dinonaktifkan oleh manajemen kafe. Anda tetap dapat melakukan pemesanan langsung di kasir KafeKu Senopati.'}
            </p>
          </div>
        </div>
      )}

      {/* Info Meja & Tempat Duduk Real-Time */}
      {settings?.tables && (
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-stone-700">
            <Coffee className="w-4 h-4 text-amber-700" />
            <span className="font-bold">Ketersediaan Meja Saat Ini:</span>
            <span className="font-extrabold text-emerald-700">
              {settings.tables.filter(t => t.status === 'tersedia').length} Meja Tersedia
            </span>
            <span className="text-stone-400">dari total {settings.tables.length} meja</span>
          </div>
          <span className="text-stone-500 text-[11px]">
            {settings.tables.filter(t => t.status === 'terisi').length} meja terisi • {settings.tables.filter(t => t.status === 'ditutup').length} meja reservasi/tutup
          </span>
        </div>
      )}

      {/* ACTIVE ORDERS TRACKER - WITH THE PROMINENT "SAYA SUDAH SAMPAI" BUTTON */}
      {customerOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <span>Pesanan Pre-Order Aktif Anda ({customerOrders.length})</span>
            </h2>
            <span className="text-xs text-stone-500">Live Status Dapur</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerOrders.map(order => {
              const hasSensitive = order.items.some(i => i.isSensitive);
              const isWaitingArrival = order.kitchenStatus === 'menunggu_kedatangan' && !order.hasArrived;

              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                    isWaitingArrival 
                      ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/30' 
                      : order.kitchenStatus === 'siap_diambil'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-stone-900">{order.id}</span>
                        <span className="text-xs text-stone-500">• {formatTime(order.createdAt)}</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Estimasi kedatangan: <strong>{order.estimatedArrival}</strong>
                      </p>
                    </div>

                    {/* Status Pill */}
                    <div className="text-right">
                      {isWaitingArrival ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Menunggu Kedatangan</span>
                        </span>
                      ) : order.kitchenStatus === 'antrean_dapur' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <span>Antrean Dapur</span>
                        </span>
                      ) : order.kitchenStatus === 'sedang_dimasak' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
                          <span>Sedang Dimasak / Diracik</span>
                        </span>
                      ) : order.kitchenStatus === 'siap_diambil' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Siap Diambil di Kasir</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                          Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-stone-50 rounded-xl p-3 divide-y divide-stone-200/60 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-800">{item.quantity}x</span>
                          <span className="text-stone-700">{item.name}</span>
                          {item.isSensitive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Sensitif Suhu
                            </span>
                          )}
                        </div>
                        <span className="text-stone-600 font-mono">{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-bold text-stone-900">
                      <span>Total (QRIS Lunas):</span>
                      <span className="text-amber-700 font-mono">{formatRupiah(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Anti No-Show Tag */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pembayaran Digital Terverifikasi</span>
                    </span>
                    <span className="text-stone-400">Non-Refundable Policy</span>
                  </div>

                  {/* CORE FEATURE: "SAYA SUDAH SAMPAI" BUTTON */}
                  {isWaitingArrival && (
                    <div className="space-y-2 pt-1">
                      <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                        <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Menu Sensitif Ditahan Dapur:</strong> Barista & koki menunggu kedatangan Anda agar rasa tetap maksimal.
                        </div>
                      </div>

                      <button
                        id={`btn-arrived-${order.id}`}
                        onClick={() => onMarkArrived(order.id)}
                        className="w-full group relative overflow-hidden bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-sm uppercase tracking-wide border-2 border-amber-400/50 cursor-pointer"
                      >
                        <span className="absolute inset-0 w-full h-full bg-white/10 animate-pulse pointer-events-none" />
                        <MapPin className="w-5 h-5 text-amber-200 animate-bounce" />
                        <span>SAYA SUDAH SAMPAI DI KAFE!</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                  {order.hasArrived && order.kitchenStatus !== 'selesai' && order.kitchenStatus !== 'siap_diambil' && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Anda Sudah Tiba!</strong> Dapur sedang menyiapkan menu pesanan Anda dalam kondisi paling segar.
                      </span>
                    </div>
                  )}

                  {order.kitchenStatus === 'siap_diambil' && (
                    <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pesanan Siap! Silakan ambil di konter barista.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MAIN PRE-ORDERING LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Menu Catalog (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-stone-200">
            {[
              { key: 'all', label: 'Semua Menu' },
              { key: 'kopi', label: '☕ Kopi' },
              { key: 'non-kopi', label: '🍵 Non-Kopi' },
              { key: 'makanan', label: '🍛 Makanan Hangat' },
              { key: 'snack', label: '🥐 Snack & Pastry' },
            ].map(cat => (
              <button
                key={cat.key}
                id={`cat-${cat.key}`}
                onClick={() => setSelectedCategory(cat.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMenu.map(item => {
              const inCart = cart.find(i => i.menuItemId === item.id);
              const isAvailable = item.isAvailable !== false;

              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                    isAvailable 
                      ? 'border-stone-200 shadow-sm hover:shadow-md' 
                      : 'border-red-200 bg-stone-50/60 opacity-75'
                  }`}
                >
                  <div>
                    {/* Item Image with Sensitivity Badge */}
                    <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          !isAvailable ? 'grayscale-40' : ''
                        }`} 
                      />

                      {/* Stock badge if out of stock */}
                      {!isAvailable && (
                        <div className="absolute top-2.5 right-2.5 bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm tracking-wider uppercase">
                          Stok Habis
                        </div>
                      )}

                      {item.isSensitive ? (
                        <div className="absolute top-2.5 left-2.5 bg-stone-900/90 backdrop-blur-xs text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
                          {item.category === 'kopi' || item.category === 'non-kopi' ? (
                            <Snowflake className="w-3 h-3 text-cyan-400" />
                          ) : (
                            <Flame className="w-3 h-3 text-amber-400" />
                          )}
                          <span>Sensitif Suhu (Dimasak Saat Tiba)</span>
                        </div>
                      ) : (
                        <div className="absolute top-2.5 left-2.5 bg-stone-900/80 text-emerald-300 text-[10px] font-semibold px-2 py-1 rounded-lg">
                          Siap Standby
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-stone-900 text-sm">{item.name}</h3>
                        <span className="font-mono font-bold text-amber-800 text-sm">
                          {formatRupiah(item.price)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      {item.sensitiveReason && (
                        <p className="text-[11px] text-amber-800/90 font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                          {item.sensitiveReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="p-4 pt-0">
                    {!isAvailable ? (
                      <button
                        disabled
                        className="w-full bg-stone-200 text-stone-500 font-bold text-xs py-2.5 px-3 rounded-xl cursor-not-allowed text-center"
                      >
                        Menu Sedang Habis
                      </button>
                    ) : inCart ? (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-stone-100 shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm text-amber-900 px-3">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold hover:bg-amber-800 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`add-to-cart-${item.id}`}
                        onClick={() => addToCart(item)}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah ke Pre-Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pre-Order Cart & Arrival Setup */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-stone-900 text-base">Keranjang Pre-Order</h2>
            </div>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} Item
            </span>
          </div>

          {/* Customer Input info */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Nama Pemesan</label>
              <input
                id="input-customer-name"
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-semibold mb-1">Nomor WhatsApp (Untuk Notifikasi)</label>
              <input
                id="input-customer-phone"
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                placeholder="0812xxxxxxx"
              />
            </div>

            {/* Opsi Tempat / Bungkus */}
            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Tipe Pesanan / Meja</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  id="btn-customer-takeaway"
                  onClick={() => setDiningOption('takeaway')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                    diningOption === 'takeaway'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Takeaway / Bungkus</span>
                </button>
                <button
                  type="button"
                  id="btn-customer-dinein"
                  onClick={() => {
                    const firstTable = settings?.tables?.find(t => t.status === 'tersedia');
                    setDiningOption(firstTable ? `Meja ${firstTable.number}` : 'Meja 01');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                    diningOption !== 'takeaway'
                      ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Makan di Tempat</span>
                </button>
              </div>

              {diningOption !== 'takeaway' && (
                <div className="mt-2">
                  <label className="block text-[11px] text-stone-500 font-semibold mb-1">Nomor Meja yang Ingin Ditempati:</label>
                  <select
                    id="select-customer-table"
                    value={diningOption}
                    onChange={e => setDiningOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Takeaway / Bungkus (Bawa Pulang)">Takeaway / Bungkus (Bawa Pulang)</option>
                    {settings?.tables && settings.tables.length > 0 ? (
                      settings.tables.map(t => (
                        <option 
                          key={t.id} 
                          value={t.name}
                          disabled={t.status === 'ditutup'}
                        >
                          {t.name} ({t.capacity} Kursi) {t.status === 'terisi' ? '- Terisi' : t.status === 'ditutup' ? '- Ditutup' : '- Tersedia'}
                        </option>
                      ))
                    ) : (
                      Array.from({ length: 10 }).map((_, i) => (
                        <option key={i} value={`Meja ${i + 1 < 10 ? '0' + (i + 1) : (i + 1)}`}>
                          Meja {i + 1 < 10 ? '0' + (i + 1) : (i + 1)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {diningOption === 'takeaway' && (
                <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-lg font-medium">
                  📦 <strong>Pesanan Bungkus:</strong> Tim barista/dapur akan menyiapkan kemasan takeaway dan cup bawa pulang anti-tumpah.
                </p>
              )}
            </div>

            {/* Smart Arrival Setup */}
            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Kapan Anda Tiba di Kafe?</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[10, 15, 25, 40].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setArrivalMinutes(mins)}
                    className={`py-1.5 text-center rounded-lg text-xs font-semibold border transition-all ${
                      arrivalMinutes === mins
                        ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    +{mins} Menit
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Perkiraan jam tiba: <strong>{new Date(Date.now() + arrivalMinutes * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
              </p>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Keranjang masih kosong. Pilih menu di samping untuk mulai pre-order.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.menuItemId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 pr-2">
                    <div className="font-semibold text-stone-900">{item.name}</div>
                    <div className="text-stone-500 font-mono">
                      {formatRupiah(item.price)} × {item.quantity}
                    </div>
                    {item.isSensitive && (
                      <span className="inline-block text-[10px] text-amber-700 font-bold">
                        • Masak Saat Tiba
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-stone-800 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Anti No-Show Warning in Checkout box */}
          {hasSensitiveInCart && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1 text-amber-800">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Anti No-Show & Kualitas Rasa</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">
                Pesanan Anda mengandung menu sensitif suhu. Menu akan segera dimasak setelah Anda tiba & menekan tombol "Saya Sudah Sampai".
              </p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatRupiah(totalCartAmount)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Biaya Layanan Kemasan</span>
              <span className="font-mono text-emerald-600">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-100">
              <span>Total Bayar</span>
              <span className="font-mono text-amber-800">{formatRupiah(totalCartAmount)}</span>
            </div>
          </div>

          {/* Submit Pre-Order button */}
          <button
            id="btn-checkout-qris"
            disabled={cart.length === 0 || (settings ? settings.isPreOrderEnabled === false : false)}
            onClick={handleCheckoutInitiate}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>
              {settings && settings.isPreOrderEnabled === false 
                ? 'Pre-Order Dinonaktifkan Oleh Manajemen'
                : 'Bayar QRIS & Kirim Pre-Order'}
            </span>
          </button>
        </div>
      </div>

      {/* QRIS PAYMENT SIMULATOR MODAL */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS Dinamis KafeKu</span>
              </div>
              <h3 className="font-extrabold text-stone-900 text-lg">Pindai untuk Membayar</h3>
              <p className="text-xs text-stone-500">Mendukung BCA, Mandiri, GoPay, OVO, ShopeePay, Dana</p>
            </div>

            {/* Realistic Simulated QR Code Box */}
            <div className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl p-5 inline-block mx-auto shadow-inner">
              <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-xs flex flex-col items-center justify-center border border-stone-200">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-stone-900 rounded-lg">
                  {/* Visual simulated QR bits */}
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-xs ${
                        i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35 
                          ? 'bg-white' 
                          : 'bg-stone-900'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <p className="font-mono font-bold text-stone-800 text-sm mt-3">
                {formatRupiah(totalCartAmount)}
              </p>
            </div>

            {/* Anti No-Show reminder */}
            <div className="text-[11px] text-stone-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left space-y-1">
              <div className="font-bold text-amber-900 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Ketentuan No-Refund Pre-Order:</span>
              </div>
              <p className="text-stone-600 leading-tight">
                Setelah pembayaran sukses, pesanan akan diteruskan ke dapur kafe. Dana tidak dapat dibatalkan atau ditarik kembali demi kelayakan stok.
              </p>
            </div>

            {/* Simulated Payment Trigger */}
            <div className="space-y-2">
              <button
                id="btn-confirm-qris-paid"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Simulasi Pembayaran Berhasil'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
              >
                Batal / Ubah Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
