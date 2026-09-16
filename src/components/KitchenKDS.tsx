import React, { useState } from 'react';
import { Order, KitchenStatus } from '../types.ts';
import { formatRupiah, formatTime, getElapsedTimeMinutes } from '../utils/formatters.ts';
import { announceOrderToKitchen, playKitchenChime } from '../utils/audio.ts';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  BellRing, 
  Clock, 
  MapPin, 
  Flame, 
  Snowflake, 
  CheckCircle2, 
  AlertCircle, 
  UserX, 
  Sparkles, 
  ArrowRight,
  Filter,
  BatteryLow,
  UserCheck,
  PhoneOff,
  Package
} from 'lucide-react';

interface KitchenKDSProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: KitchenStatus) => Promise<void>;
  onMarkArrived: (orderId: string) => Promise<void>;
  onMarkNoShow: (orderId: string) => Promise<void>;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
}

export const KitchenKDS: React.FC<KitchenKDSProps> = ({
  orders,
  onUpdateStatus,
  onMarkArrived,
  onMarkNoShow,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'waiting_arrival' | 'cooking' | 'ready'>('all');
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // Active kitchen orders (exclude finished / completed unless needed)
  const activeOrders = orders.filter(o => o.kitchenStatus !== 'selesai');

  // Filtered orders
  const displayedOrders = activeOrders.filter(o => {
    if (filterMode === 'waiting_arrival') return o.kitchenStatus === 'menunggu_kedatangan';
    if (filterMode === 'cooking') return o.kitchenStatus === 'antrean_dapur' || o.kitchenStatus === 'sedang_dimasak';
    if (filterMode === 'ready') return o.kitchenStatus === 'siap_diambil';
    return true;
  });

  // Sound test button
  const handleTestAudio = async () => {
    setIsTestingAudio(true);
    try {
      await announceOrderToKitchen('Pre-Order Meja 02', 'Nasi Goreng Pedas satu, Es Kopi Susu satu');
    } finally {
      setIsTestingAudio(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar for Kitchen Display */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white shadow-inner">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg sm:text-xl text-amber-50">Layar Dapur Terpadu (KDS)</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
                Live Kitchen Feed
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Sinkronisasi real-time pesanan Pre-Order HP & Kasir Meja dengan peringatan suara cerdas.
            </p>
          </div>
        </div>

        {/* Audio TTS Controls & Test Speaker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime + TTS Test button */}
          <button
            id="btn-test-chime-tts"
            onClick={handleTestAudio}
            disabled={isTestingAudio}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <BellRing className={`w-4 h-4 ${isTestingAudio ? 'animate-bounce' : ''}`} />
            <span>{isTestingAudio ? 'Berbicara...' : 'Uji Coba Alarm Suara & Bel TTS'}</span>
          </button>

          {/* Toggle Audio */}
          <button
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              audioAlertsEnabled
                ? 'bg-stone-800 border-emerald-500/50 text-emerald-400'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
          >
            {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioAlertsEnabled ? 'TTS Aktif' : 'TTS Senyap'}</span>
          </button>
        </div>
      </div>

      {/* Operational Filter Tabs & Counts */}
      <div className="space-y-3 border-b border-stone-200 pb-3">
        {/* Emergency notice for dead/lowbat phones if any preorders are waiting */}
        {activeOrders.some(o => o.kitchenStatus === 'menunggu_kedatangan') && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500 text-stone-950 rounded-lg font-bold">
                <BatteryLow className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-stone-900">
                  Prosedur Darurat HP Pelanggan Mati / Lowbat:
                </span>
                <p className="text-[11px] text-stone-700">
                  Jika pelanggan sudah tiba di kafe namun baterai ponselnya habis sehingga tidak bisa klik "Saya Sudah Sampai", klik tombol hijau <strong>"Konfirmasi Pelanggan Hadir (Manual)"</strong> pada tiket pesanan. Pesanan sensitif suhu akan langsung otomatis dipindahkan ke antrean masak.
                </p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {activeOrders.filter(o => o.kitchenStatus === 'menunggu_kedatangan').length} Menunggu Kedatangan
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Semua Tiket', count: activeOrders.length },
              { 
                key: 'waiting_arrival', 
                label: '⏳ Menunggu Pelanggan Tiba', 
                count: activeOrders.filter(o => o.kitchenStatus === 'menunggu_kedatangan').length 
              },
              { 
                key: 'cooking', 
                label: '🍳 Antrean & Dimasak', 
                count: activeOrders.filter(o => o.kitchenStatus === 'antrean_dapur' || o.kitchenStatus === 'sedang_dimasak').length 
              },
              { 
                key: 'ready', 
                label: '☕ Siap Diambil', 
                count: activeOrders.filter(o => o.kitchenStatus === 'siap_diambil').length 
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterMode(tab.key as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterMode === tab.key
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  filterMode === tab.key ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 text-stone-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-stone-500 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Waktu penyajian ideal: &lt; 8 menit</span>
          </div>
        </div>
      </div>

      {/* TICKET CARDS GRID */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">Semua Pesanan Bersih & Selesai</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Dapur sedang santai. Tiket baru dari HP pelanggan atau kasir akan muncul secara otomatis di layar ini disertai alarm bel & suara TTS.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {displayedOrders.map(order => {
            const elapsed = getElapsedTimeMinutes(order.createdAt);
            const isPreOrder = order.source === 'preorder';
            const isWaiting = order.kitchenStatus === 'menunggu_kedatangan';
            const hasJustArrived = isPreOrder && order.hasArrived && order.kitchenStatus === 'antrean_dapur';
            const hasSensitive = order.items.some(i => i.isSensitive);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all flex flex-col justify-between ${
                  hasJustArrived
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/20 animate-pulse'
                    : isWaiting
                    ? 'border-stone-300 bg-stone-50/40 opacity-90'
                    : order.kitchenStatus === 'siap_diambil'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-amber-400'
                }`}
              >
                {/* Ticket Top Header */}
                <div className={`p-4 border-b flex items-start justify-between ${
                  hasJustArrived
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : isWaiting
                    ? 'bg-stone-100 text-stone-800'
                    : order.kitchenStatus === 'siap_diambil'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 text-white'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono font-extrabold text-base">{order.id}</span>
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                        isPreOrder 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}>
                        {isPreOrder ? '📱 Pre-Order HP' : '📟 Kasir Meja'}
                      </span>
                      {order.isTakeaway && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white border border-orange-300 shadow-sm animate-bounce">
                          <Package className="w-3 h-3" />
                          <span>TAKEAWAY / BUNGKUS</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold mt-0.5 truncate max-w-[180px]">
                      {order.customerName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold flex items-center justify-end space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m lalu</span>
                    </div>
                    <div className="text-[10px] opacity-80">{formatTime(order.createdAt)} WIB</div>
                  </div>
                </div>

                {/* SENSITIVITY & ARRIVAL STATUS BANNER */}
                {order.isTakeaway && (
                  <div className="bg-orange-500 text-white px-3 py-1.5 text-xs font-black flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-1.5">
                      <Package className="w-4 h-4 text-white animate-pulse" />
                      <span>PACKING BUNGKUS / KEMASAN TAKEAWAY</span>
                    </div>
                    <span className="text-[10px] bg-white text-orange-700 px-2 py-0.5 rounded-full font-extrabold uppercase">
                      Gunakan Paper Bag &amp; Box
                    </span>
                  </div>
                )}

                {isWaiting ? (
                  <div className="bg-amber-100/70 border-b border-amber-200 p-2.5 text-xs text-amber-950 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
                    <div>
                      <strong className="block text-amber-900">Menunggu Kedatangan Pelanggan</strong>
                      <span className="text-[11px] text-amber-800">
                        {order.estimatedArrival} • Menu sensitif ditahan agar tidak rusak
                      </span>
                    </div>
                  </div>
                ) : hasJustArrived ? (
                  <div className="bg-amber-400 p-2.5 text-xs text-stone-950 flex items-center space-x-2 font-extrabold">
                    <MapPin className="w-4 h-4 text-stone-950 shrink-0 animate-bounce" />
                    <div>
                      <span>PELANGGAN TELAH SAMPAI DI KAFE!</span>
                      <p className="text-[10px] font-medium text-stone-900">Segera racik menu kopi es / makanan hangat sekarang!</p>
                    </div>
                  </div>
                ) : null}

                {/* Order Items Ticket Body */}
                <div className="p-4 space-y-3 divide-y divide-stone-100">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs pt-1 first:pt-0">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-stone-900 font-mono w-6">
                              {item.quantity}×
                            </span>
                            <span className="font-bold text-stone-800">{item.name}</span>
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-amber-700 font-semibold pl-8">
                              ↳ Catatan: "{item.notes}"
                            </div>
                          )}
                        </div>

                        {item.isSensitive && (
                          <span 
                            title="Sensitif Suhu" 
                            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1"
                          >
                            <Snowflake className="w-3 h-3 text-cyan-600" />
                            <span>Sensitif</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Payment & Security Status */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                    <span>
                      {order.paymentMethod.toUpperCase()} • {formatRupiah(order.totalAmount)}
                    </span>
                    {order.isNonRefundable && (
                      <span className="text-emerald-700 font-semibold">
                        Lunas (Anti No-Show)
                      </span>
                    )}
                  </div>
                </div>

                {/* Kitchen Action Buttons */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center space-x-2">
                  {order.kitchenStatus === 'menunggu_kedatangan' ? (
                    <div className="w-full space-y-2">
                      {/* Tombol Darurat jika HP Pelanggan Mati / Lowbat */}
                      <button
                        id={`btn-manual-arrival-${order.id}`}
                        onClick={() => onMarkArrived(order.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 text-center"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-100 shrink-0" />
                        <span>Konfirmasi Pelanggan Hadir (Manual)</span>
                      </button>

                      <div className="flex items-center justify-between space-x-2 pt-0.5">
                        <span className="text-[10px] text-stone-500 flex items-center space-x-1">
                          <BatteryLow className="w-3.5 h-3.5 text-amber-600" />
                          <span>Darurat HP Mati/Lowbat</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => onUpdateStatus(order.id, 'sedang_dimasak')}
                            className="px-2 py-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100"
                          >
                            Masak Langsung
                          </button>
                          <button
                            onClick={() => onMarkNoShow(order.id)}
                            title="Pelanggan tidak datang (No-Show). Dana tetap masuk ke kafe."
                            className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 flex items-center space-x-1"
                          >
                            <UserX className="w-3 h-3" />
                            <span>No-Show</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : order.kitchenStatus === 'antrean_dapur' ? (
                    <button
                      id={`btn-cook-${order.id}`}
                      onClick={() => onUpdateStatus(order.id, 'sedang_dimasak')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Flame className="w-4 h-4 text-amber-200" />
                      <span>Mulai Memasak / Meracik</span>
                    </button>
                  ) : order.kitchenStatus === 'sedang_dimasak' ? (
                    <button
                      id={`btn-ready-${order.id}`}
                      onClick={() => onUpdateStatus(order.id, 'siap_diambil')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai Masak & Siap Diambil</span>
                    </button>
                  ) : order.kitchenStatus === 'siap_diambil' ? (
                    <button
                      id={`btn-complete-${order.id}`}
                      onClick={() => onUpdateStatus(order.id, 'selesai')}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>Pelanggan Telah Menerima</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
