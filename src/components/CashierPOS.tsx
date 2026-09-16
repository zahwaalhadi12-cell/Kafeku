import React, { useState, useEffect } from 'react';
import { MenuItem, Order, OrderItem, CafeTable } from '../types.ts';
import { formatRupiah, formatTime } from '../utils/formatters.ts';
import { 
  Tablet, 
  Mic, 
  MicOff, 
  Printer, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Receipt, 
  Coffee,
  X,
  CreditCard,
  BatteryLow,
  UserCheck,
  PhoneOff,
  Search,
  Snowflake,
  Clock
} from 'lucide-react';

interface CashierPOSProps {
  menuList: MenuItem[];
  onOrderCreated: (order: Order) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  onSyncOfflineQueue: (orders: Order[]) => Promise<number>;
  tables?: CafeTable[];
  orders?: Order[];
  onMarkArrived?: (orderId: string) => Promise<void>;
}

export const CashierPOS: React.FC<CashierPOSProps> = ({
  menuList,
  onOrderCreated,
  isOfflineMode,
  setIsOfflineMode,
  onSyncOfflineQueue,
  tables,
  orders = [],
  onMarkArrived,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'kopi' | 'non-kopi' | 'makanan' | 'snack'>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Meja 01');
  const [tableNumber, setTableNumber] = useState('01');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Emergency Arrival State for Dead/Lowbat Customer Phones
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [arrivalSearchTerm, setArrivalSearchTerm] = useState('');
  const [arrivalNotice, setArrivalNotice] = useState<string | null>(null);
  const [isConfirmingArrival, setIsConfirmingArrival] = useState<string | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Local offline queue state (stored in localStorage)
  const [offlineQueue, setOfflineQueue] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load offline queue from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('KAFEKU_OFFLINE_QUEUE');
      if (saved) {
        setOfflineQueue(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveOfflineQueue = (queue: Order[]) => {
    setOfflineQueue(queue);
    try {
      localStorage.setItem('KAFEKU_OFFLINE_QUEUE', JSON.stringify(queue));
    } catch {
      // ignore
    }
  };

  const filteredMenu = selectedCategory === 'all'
    ? menuList
    : menuList.filter(m => m.category === selectedCategory);

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const changeAmount = Math.max(0, cashReceived - totalAmount);

  // Add item to POS cart
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

  // Quick Cash preset buttons
  const setQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  // Process and parse spoken voice order
  const processVoiceOrder = async (text: string) => {
    if (!text.trim()) return;
    setVoiceProcessing(true);
    setVoiceNotice(null);

    try {
      const res = await fetch('/api/ai/parse-voice-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        // Add extracted items to cart
        data.items.forEach((parsedItem: { menuItemId: string; quantity: number; notes?: string }) => {
          const menuItem = menuList.find(m => m.id === parsedItem.menuItemId);
          if (menuItem) {
            setCart(prev => {
              const existing = prev.find(i => i.menuItemId === menuItem.id);
              if (existing) {
                return prev.map(i => i.menuItemId === menuItem.id 
                  ? { ...i, quantity: i.quantity + (parsedItem.quantity || 1), notes: parsedItem.notes || i.notes } 
                  : i
                );
              }
              return [...prev, {
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: parsedItem.quantity || 1,
                isSensitive: menuItem.isSensitive,
                notes: parsedItem.notes || '',
              }];
            });
          }
        });
        setVoiceNotice(`Berhasil mengenali ${data.items.length} menu dari suara!`);
      } else {
        setVoiceNotice('Menu tidak terdeteksi dari ucapan. Coba sebutkan menu yang terdaftar.');
      }
    } catch {
      setVoiceNotice('Gagal memproses suara. Silakan pilih menu di layar.');
    } finally {
      setVoiceProcessing(false);
    }
  };

  // Browser Speech Recognition trigger
  const toggleSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceNotice('Browser ini belum mendukung Web Speech API langsung. Gunakan tombol simulasi suara di bawah.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setTranscriptText('Mendengarkan pesanan kasir...');

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscriptText(text);
        setIsListening(false);
        processVoiceOrder(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('Gagal merekam suara. Anda dapat menggunakan tombol contoh suara di bawah.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      setVoiceNotice('Izin mikrofon diperlukan untuk input lisan.');
    }
  };

  // Submit Order (Either Online or Offline)
  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;

    const orderId = `KAS-${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: orderId,
      source: 'cashier',
      customerName: customerName || `Pelanggan Meja ${tableNumber}`,
      items: cart,
      totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      isNonRefundable: false,
      cashReceived: cashReceived || totalAmount,
      cashChange: changeAmount,
      hasArrived: true,
      kitchenStatus: 'antrean_dapur',
      createdAt: new Date().toISOString(),
      offlineCreated: isOfflineMode,
    };

    if (isOfflineMode) {
      // Offline fallback: Store into local queue
      const updatedQueue = [...offlineQueue, newOrder];
      saveOfflineQueue(updatedQueue);
      setLastCompletedOrder(newOrder);
      setShowReceiptModal(true);
      // Reset cart
      setCart([]);
      setCashReceived(0);
    } else {
      // Online mode: Send to backend
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        });
        const data = await res.json();
        if (data.success) {
          onOrderCreated(data.data);
          setLastCompletedOrder(data.data);
          setShowReceiptModal(true);
          // Reset
          setCart([]);
          setCashReceived(0);
        }
      } catch (e) {
        // Fallback to offline queue if network fails unexpectedly
        const updatedQueue = [...offlineQueue, newOrder];
        saveOfflineQueue(updatedQueue);
        setLastCompletedOrder(newOrder);
        setShowReceiptModal(true);
        setCart([]);
      }
    }
  };

  // Trigger sync of offline queue
  const handleSyncNow = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const syncedCount = await onSyncOfflineQueue(offlineQueue);
      if (syncedCount > 0) {
        saveOfflineQueue([]);
        setVoiceNotice(`Sukses sinkronisasi ${syncedCount} transaksi offline ke server pusat!`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Emergency Manual Arrival Confirmation for Cashier (Dead/Lowbat Phone)
  const handleConfirmArrivalManual = async (orderId: string, custName: string) => {
    if (!onMarkArrived) return;
    setIsConfirmingArrival(orderId);
    try {
      await onMarkArrived(orderId);
      setArrivalNotice(`Berhasil! Kehadiran "${custName}" telah dikonfirmasi manual. Pesanan sensitif suhu langsung otomatis masuk ke antrean masak dapur (KDS).`);
    } catch (err) {
      console.error('Gagal konfirmasi kehadiran manual', err);
    } finally {
      setIsConfirmingArrival(null);
    }
  };

  const waitingPreOrders = orders.filter(
    o => o.source === 'preorder' && o.kitchenStatus === 'menunggu_kedatangan'
  );

  const filteredArrivalOrders = orders.filter(o => {
    if (o.source !== 'preorder') return false;
    if (arrivalSearchTerm.trim()) {
      const term = arrivalSearchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(term))
      );
    }
    return o.kitchenStatus === 'menunggu_kedatangan' || (!o.hasArrived && o.kitchenStatus !== 'selesai');
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Notice after manual arrival confirmation */}
      {arrivalNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-emerald-950 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm text-emerald-900">Kehadiran Pelanggan Dikonfirmasi!</h5>
              <p className="text-xs text-emerald-800 font-medium">{arrivalNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setArrivalNotice(null)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EMERGENCY MANUAL ARRIVAL BAR FOR CASHIER (HP MATI / LOWBAT) */}
      <div className="bg-white rounded-2xl border border-amber-300 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold shrink-0">
              <BatteryLow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-stone-900 text-sm">
                  Darurat HP Pelanggan Mati / Lowbat
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  waitingPreOrders.length > 0 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {waitingPreOrders.length} Pre-Order Menunggu
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Jika HP pelanggan mati saat tiba di kafe, kasir dapat menekan <strong>"Konfirmasi Pelanggan Hadir (Manual)"</strong> agar pesanan sensitif suhu langsung diproses di dapur KDS.
              </p>
            </div>
          </div>

          <button
            id="btn-open-emergency-arrival"
            onClick={() => setShowArrivalModal(true)}
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-200" />
            <span>Cari / Konfirmasi Hadir ({waitingPreOrders.length})</span>
          </button>
        </div>

        {/* Quick inline list of waiting preorders for 1-click confirmation */}
        {waitingPreOrders.length > 0 && (
          <div className="pt-2 border-t border-amber-100">
            <div className="text-[11px] font-bold text-stone-700 mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Daftar Cepat Pelanggan Pre-Order yang Belum Konfirmasi:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {waitingPreOrders.map(order => (
                <div 
                  key={order.id}
                  className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-xs text-stone-900">{order.customerName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {order.id} • Est: {order.estimatedArrival}
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                      {order.items.length} item
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-700 space-y-0.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="truncate">{it.quantity}x {it.name}</span>
                        {it.isSensitive && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded ml-1 shrink-0">
                            Sensitif Suhu
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    id={`btn-pos-arrival-${order.id}`}
                    disabled={isConfirmingArrival === order.id}
                    onClick={() => handleConfirmArrivalManual(order.id, order.customerName)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white text-xs font-extrabold py-2 px-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-100" />
                    <span>
                      {isConfirmingArrival === order.id ? 'Mengonfirmasi...' : 'Konfirmasi Pelanggan Hadir (Manual)'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Offline Status & Sync Banner */}
      {isOfflineMode ? (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-stone-950 rounded-xl font-bold">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Mode Kasir Offline Aktif (Simulasi Internet Mati)</h4>
              <p className="text-xs text-amber-900/80">
                Semua pesanan tunai dicatat ke memori tablet lokal. Struk cetak tetap jalan lancar tanpa lag.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-white text-stone-800 rounded-lg shadow-xs">
              Antrean Offline: {offlineQueue.length}
            </span>
            <button
              onClick={() => setIsOfflineMode(false)}
              className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800"
            >
              Nyalakan Internet
            </button>
          </div>
        </div>
      ) : offlineQueue.length > 0 ? (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl font-bold">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Internet Tersedia Kembali!</h4>
              <p className="text-xs text-emerald-800">
                Ada {offlineQueue.length} pesanan kasir yang dicatat saat offline. Siap disinkronkan ke database server & dapur.
              </p>
            </div>
          </div>
          <button
            id="btn-sync-offline-queue"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      ) : null}

      {/* Main Cashier POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Voice Assistant + Menu Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Lisan / Voice Order Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Input Pesanan Lisan (Voice POS)</h3>
                  <p className="text-[11px] text-stone-500">Ramah untuk kasir & pelanggan lansia: sebutkan menu pesanan langsung</p>
                </div>
              </div>

              {/* Mic trigger */}
              <button
                id="btn-trigger-mic"
                onClick={toggleSpeechRecognition}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? 'Mendengarkan...' : 'Bicara Sekarang'}</span>
              </button>
            </div>

            {/* Quick Test Voice Simulator Buttons */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-stone-500 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Uji Coba Cepat Ucapan:</span>
              </span>
              {[
                'Es Kopi Susu dua dan Nasi Goreng satu pedas',
                'Hot Cappuccino satu dan Croissant Butter satu',
                'Iced Matcha Latte dua dan Truffle Fries satu',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscriptText(sample);
                    processVoiceOrder(sample);
                  }}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 transition-colors font-medium"
                >
                  "{sample}"
                </button>
              ))}
            </div>

            {/* Transcript Display */}
            {transcriptText && (
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-stone-500">Ucapan:</span>
                  <span className="text-stone-900 italic font-medium">"{transcriptText}"</span>
                </div>
                {voiceProcessing && <span className="text-amber-600 text-[11px] animate-pulse">Memproses AI...</span>}
              </div>
            )}

            {voiceNotice && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{voiceNotice}</span>
              </div>
            )}
          </div>

          {/* POS Category filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'kopi', label: '☕ Kopi' },
              { key: 'non-kopi', label: '🍵 Non-Kopi' },
              { key: 'makanan', label: '🍛 Makanan' },
              { key: 'snack', label: '🥐 Snack' },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* POS Fast Touch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredMenu.map(item => {
              const inCart = cart.find(i => i.menuItemId === item.id);
              const isAvailable = item.isAvailable !== false;

              return (
                <button
                  key={item.id}
                  id={`pos-item-${item.id}`}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && addToCart(item)}
                  className={`rounded-xl border text-left p-3 transition-all relative flex flex-col justify-between h-28 ${
                    !isAvailable
                      ? 'bg-stone-100 border-red-200 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/20'
                      : 'bg-white border-stone-200 hover:border-amber-500 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-stone-900 line-clamp-1">{item.name}</span>
                      {!isAvailable && (
                        <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ml-1">
                          Habis
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-amber-800">
                      {formatRupiah(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
                    <span className="text-stone-400 font-medium capitalize">{item.category}</span>
                    {inCart ? (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    ) : isAvailable ? (
                      <span className="text-stone-400 group-hover:text-stone-700 font-bold">+</span>
                    ) : (
                      <span className="text-red-500 font-bold text-[10px]">✕</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cash Register & Thermal Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center space-x-2">
                <Tablet className="w-5 h-5 text-amber-700" />
                <span>Kasir Tunai KafeKu</span>
              </h3>
              <p className="text-xs text-stone-500">Mode On-Site / Pelanggan Walk-In</p>
            </div>
            {isOfflineMode ? (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1">
                <WifiOff className="w-3 h-3 text-red-500" />
                <span>Offline</span>
              </span>
            ) : (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Online</span>
              </span>
            )}
          </div>

          {/* Table / Customer name info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-stone-600 font-semibold">Pilih Meja</label>
                {tables && tables.length > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {tables.filter(t => t.status === 'tersedia').length} Kosong
                  </span>
                )}
              </div>

              {tables && tables.length > 0 ? (
                <select
                  value={tableNumber}
                  onChange={e => {
                    setTableNumber(e.target.value);
                    setCustomerName(`Pelanggan Meja ${e.target.value}`);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold bg-white"
                >
                  {tables.map(tbl => (
                    <option key={tbl.id} value={tbl.number < 10 ? '0' + tbl.number : String(tbl.number)}>
                      {tbl.name} ({tbl.status.toUpperCase()} • {tbl.capacity} Kursi)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  placeholder="01"
                />
              )}
            </div>
          </div>

          {/* Cart item summary */}
          <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-6 text-center text-stone-400 text-xs">
                Belum ada pesanan yang dipilih. Ketuk menu atau gunakan suara.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.menuItemId} className="py-2 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 pr-2">
                    <div className="font-semibold text-stone-900">{item.name}</div>
                    <div className="text-stone-500 font-mono">
                      {formatRupiah(item.price)} × {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
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

          {/* Cash Payment Section */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-stone-600">Total Tagihan:</span>
              <span className="text-lg font-extrabold font-mono text-stone-900">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {/* Quick Cash Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Pilihan Uang Tunai Cepat:</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickCash(totalAmount)}
                  className="py-1.5 text-center text-xs font-bold bg-white border border-stone-300 rounded-lg hover:bg-stone-100"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCash(50000)}
                  className="py-1.5 text-center text-xs font-bold bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-mono"
                >
                  50k
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCash(100000)}
                  className="py-1.5 text-center text-xs font-bold bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-mono"
                >
                  100k
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCash(200000)}
                  className="py-1.5 text-center text-xs font-bold bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-mono"
                >
                  200k
                </button>
              </div>
            </div>

            {/* Cash Received Input */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Uang Diterima (Rp)</label>
                <input
                  id="input-cash-received"
                  type="number"
                  value={cashReceived || ''}
                  onChange={e => setCashReceived(Number(e.target.value) || 0)}
                  placeholder={totalAmount.toString()}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Kembalian</label>
                <div className="px-3 py-2 rounded-xl bg-white border border-stone-300 font-mono font-extrabold text-emerald-700">
                  {formatRupiah(changeAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Submit and Print Receipt Button */}
          <div className="space-y-2">
            <button
              id="btn-complete-cashier-order"
              disabled={cart.length === 0 || (cashReceived > 0 && cashReceived < totalAmount)}
              onClick={handleCompleteOrder}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Simpan & Cetak Struk Kertas</span>
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="w-full py-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Kosongkan Pesanan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* THERMAL PAPER RECEIPT PREVIEW MODAL */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 relative">
            <button 
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Thermal Receipt Paper Style */}
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-dashed border-stone-300 font-mono text-xs text-stone-800 space-y-3 shadow-inner">
              <div className="text-center space-y-1">
                <div className="font-extrabold text-sm tracking-wider text-stone-900">KAFEKU SIGNATURE</div>
                <div className="text-[10px] text-stone-500">Jl. Senopati Raya No. 42, Jakarta</div>
                <div className="text-[10px] text-stone-500">Telp: 021-5551234</div>
                <div className="border-b border-dashed border-stone-300 pt-2" />
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Struk:</span>
                  <span className="font-bold">{lastCompletedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>Tablet 01 (Hybrid)</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{formatTime(lastCompletedOrder.createdAt)} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{lastCompletedOrder.customerName}</span>
                </div>
                {lastCompletedOrder.offlineCreated && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Mode:</span>
                    <span>Offline Cache Synced</span>
                  </div>
                )}
                <div className="border-b border-dashed border-stone-300 pt-1" />
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-[11px]">
                {lastCompletedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <div>{item.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {item.quantity} × {formatRupiah(item.price)}
                      </div>
                    </div>
                    <div className="font-bold">{formatRupiah(item.price * item.quantity)}</div>
                  </div>
                ))}
                <div className="border-b border-dashed border-stone-300 pt-1" />
              </div>

              {/* Totals & Cash */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-extrabold text-stone-900 text-xs">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(lastCompletedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TUNAI:</span>
                  <span>{formatRupiah(lastCompletedOrder.cashReceived || lastCompletedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>KEMBALIAN:</span>
                  <span>{formatRupiah(lastCompletedOrder.cashChange || 0)}</span>
                </div>
                <div className="border-b border-dashed border-stone-300 pt-2" />
              </div>

              <div className="text-center text-[10px] text-stone-500 pt-1">
                Terima kasih atas kunjungan Anda!<br />
                Kritik & saran: halo@kafeku.id
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Thermal</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY ARRIVAL MODAL (HP PELANGGAN MATI / LOWBAT) */}
      {showArrivalModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500 text-stone-950 rounded-xl">
                  <BatteryLow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Konfirmasi Kehadiran Pelanggan (Manual)</h3>
                  <p className="text-xs text-stone-400">
                    Prosedur darurat saat HP pelanggan mati/lowbat saat tiba di KafeKu Senopati
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArrivalModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search bar */}
            <div className="p-4 border-b border-stone-200 bg-stone-50 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={arrivalSearchTerm}
                  onChange={e => setArrivalSearchTerm(e.target.value)}
                  placeholder="Ketik nama pelanggan, nomor meja, atau ID pesanan..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                {arrivalSearchTerm && (
                  <button
                    onClick={() => setArrivalSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                <span>
                  Menampilkan {filteredArrivalOrders.length} pesanan pre-order
                </span>
                <span className="font-bold text-amber-800">
                  {waitingPreOrders.length} belum konfirmasi kehadiran
                </span>
              </div>
            </div>

            {/* Orders list */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {filteredArrivalOrders.length === 0 ? (
                <div className="p-8 text-center text-stone-500 space-y-2">
                  <PhoneOff className="w-8 h-8 text-stone-300 mx-auto" />
                  <div className="font-bold text-xs text-stone-700">Tidak ada pesanan pre-order yang cocok</div>
                  <p className="text-[11px] text-stone-400">
                    Pastikan pelanggan telah melakukan checkout dan pembayaran QRIS pada aplikasi Pre-Order.
                  </p>
                </div>
              ) : (
                filteredArrivalOrders.map(order => {
                  const isWaiting = order.kitchenStatus === 'menunggu_kedatangan';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isWaiting
                          ? 'bg-white border-amber-300 shadow-xs'
                          : 'bg-stone-50 border-stone-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-stone-900">{order.customerName}</span>
                            <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 flex items-center space-x-2 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Est. Tiba: <strong>{order.estimatedArrival}</strong></span>
                            </span>
                            <span>•</span>
                            <span>Total: <strong>{formatRupiah(order.totalAmount)}</strong> (QRIS Lunas)</span>
                          </div>
                        </div>

                        <div>
                          {isWaiting ? (
                            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase flex items-center space-x-1 border border-amber-300">
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Tiba</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase flex items-center space-x-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{order.kitchenStatus.replace(/_/g, ' ')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items list with sensitivity */}
                      <div className="bg-stone-50 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="font-bold text-[11px] text-stone-600">Rincian Menu:</div>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-stone-800">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold w-5">{it.quantity}x</span>
                              <span className="font-medium">{it.name}</span>
                            </div>
                            {it.isSensitive ? (
                              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded flex items-center space-x-1">
                                <Snowflake className="w-3 h-3 text-cyan-600" />
                                <span>Sensitif Suhu (Masak saat tiba)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400">Siap santap</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Button */}
                      <div>
                        {isWaiting ? (
                          <button
                            id={`btn-confirm-modal-${order.id}`}
                            disabled={isConfirmingArrival === order.id}
                            onClick={() => handleConfirmArrivalManual(order.id, order.customerName)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4 text-emerald-100" />
                            <span>
                              {isConfirmingArrival === order.id
                                ? 'Sedang Memproses & Mengirim ke Dapur...'
                                : 'Konfirmasi Pelanggan Hadir (Manual)'}
                            </span>
                          </button>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-2 rounded-xl flex items-center justify-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Pelanggan sudah dikonfirmasi tiba ({order.kitchenStatus})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">
                💡 Saat tombol diklik, dapur KDS otomatis menyuarakan alarm TTS dan memulai proses memasak.
              </span>
              <button
                onClick={() => setShowArrivalModal(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
