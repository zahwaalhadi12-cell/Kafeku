import React, { useState } from 'react';
import { FinancialReport, Ingredient, Order } from '../types.ts';
import { formatRupiah, formatTime } from '../utils/formatters.ts';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  ShieldCheck, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  Layers,
  ArrowDownUp,
  RefreshCw
} from 'lucide-react';

interface OwnerDashboardProps {
  report: FinancialReport;
  ingredients: Ingredient[];
  orders: Order[];
  onRestock: (ingredientId: string, amount: number) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  report,
  ingredients,
  orders,
  onRestock,
  onRefreshData,
}) => {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(1000);
  const [isRestocking, setIsRestocking] = useState(false);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    setIsRestocking(true);
    try {
      await onRestock(selectedIngredient.id, restockAmount);
      setSelectedIngredient(null);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-700" />
            <span>Laporan Keuangan & Stok Gudang Kafe</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Data real-time penjualan hybrid (Pre-Order HP + Kasir Meja) dan pemotongan otomatis stok bahan baku.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-stone-500" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 HIGHLIGHT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omset Hari Ini</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            {formatRupiah(report.totalRevenue)}
          </div>
          <p className="text-[11px] text-stone-500 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dari total {report.totalOrders} transaksi berhasil</span>
          </p>
        </div>

        {/* Pre-Order vs Kasir */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Omset Pre-Order HP</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-950">
            {formatRupiah(report.preOrderRevenue)}
          </div>
          <div className="text-[11px] text-stone-500">
            Kasir Meja Walk-In: <strong>{formatRupiah(report.cashierRevenue)}</strong>
          </div>
        </div>

        {/* Anti No-Show Protection */}
        <div className="bg-white rounded-2xl border border-amber-300 p-5 shadow-xs space-y-2 bg-gradient-to-br from-white to-amber-50/50">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider">Anti No-Show Protection</span>
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-900">
            {formatRupiah(report.noShowProtectedRevenue)}
          </div>
          <p className="text-[11px] text-stone-600 leading-tight">
            Dana diselamatkan dari {report.noShowCount} pesanan batal/tidak hadir via kebijakan No-Refund QRIS.
          </p>
        </div>

        {/* Nilai Stok Bahan Baku */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Valuasi Stok Bahan Baku</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-950">
            {formatRupiah(report.inventoryValue)}
          </div>
          <p className="text-[11px] text-stone-500">
            {ingredients.filter(i => i.stock <= i.minStock).length} bahan baku mendekati batas minim
          </p>
        </div>
      </div>

      {/* Breakdown Channels & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metrik Metode Pembayaran */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Pemisahan Saluran Pembayaran</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                <span>QRIS Dinamis / E-Wallet (Pre-Order Digital)</span>
                <span className="font-mono">{formatRupiah(report.qrisRevenue)}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2.5 rounded-full" 
                  style={{ width: `${report.totalRevenue ? (report.qrisRevenue / report.totalRevenue) * 100 : 50}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                <span>Uang Tunai Cash (Kasir Tablet Manual)</span>
                <span className="font-mono">{formatRupiah(report.cashRevenue)}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-600 h-2.5 rounded-full" 
                  style={{ width: `${report.totalRevenue ? (report.cashRevenue / report.totalRevenue) * 100 : 50}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Penjelasan Kebijakan Anti No-Show untuk Owner */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3 text-xs text-amber-950">
          <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Kaidah Anti No-Show KafeKu</span>
          </div>
          <p className="leading-relaxed text-stone-700">
            Pada kafe konvensional, pesanan pre-order yang tidak dibayar di muka sering berujung <em>food waste</em> (susu basi, es mencair, nasi dingin terbuang). 
          </p>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 font-medium text-stone-800 space-y-1">
            <strong>Keuntungan untuk Pemilik Kafe:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-1">
              <li>100% pesanan Pre-Order wajib lunas via QRIS sebelum tiket diteruskan.</li>
              <li>Jika tamu batal sepihak, dana tidak dikembalikan (No-Refund).</li>
              <li>Biaya bahan baku (COGS) dan margin keuntungan kafe tetap 100% aman.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* REAL-TIME INVENTORY MANAGEMENT (STOK BAHAN BAKU) */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
              <Package className="w-5 h-5 text-amber-700" />
              <span>Inventori & Pemotongan Otomatis Bahan Baku</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Tiap kali menu dipesan di kasir atau pre-order, resep bahan baku langsung dipotong otomatis dari database.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg self-start sm:self-auto">
            {ingredients.length} Bahan Baku Terdaftar
          </span>
        </div>

        {/* Ingredients Table */}
        {ingredients.some(item => item.stock < 5) && (
          <div className="bg-red-50 border-2 border-red-400 p-3.5 rounded-xl flex items-center justify-between text-xs text-red-950 shadow-xs animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="font-extrabold text-red-900 block">Peringatan Kritis: Bahan Baku dengan Stok Tipis (&lt; 5)!</span>
                <span className="text-[11px] text-red-800">
                  Beberapa bahan tersisa kurang dari 5 satuan. Segera lakukan restock agar operasional pesanan tidak terganggu.
                </span>
              </div>
            </div>
            <span className="px-2 py-1 bg-red-600 text-white rounded-lg font-bold text-[10px] uppercase">
              {ingredients.filter(item => item.stock < 5).length} Bahan Kritis
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-4">Nama Bahan</th>
                <th className="pb-3 px-4">Sisa Stok</th>
                <th className="pb-3 px-4">Batas Aman (Min)</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {ingredients.map(item => {
                const isCriticalLow = item.stock < 5;
                const isMinStockLow = item.stock <= item.minStock;

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${
                      isCriticalLow 
                        ? 'bg-red-100/80 hover:bg-red-100 border-l-4 border-l-red-600 text-red-950 font-bold' 
                        : isMinStockLow
                        ? 'bg-amber-50/60 hover:bg-amber-50'
                        : 'hover:bg-stone-50/80'
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isCriticalLow ? 'text-red-900 font-extrabold text-sm' : 'text-stone-900'}`}>
                          {item.name}
                        </span>
                        {isCriticalLow && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-600 text-white shadow-xs animate-pulse">
                            Stok Tipis (&lt;5)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-bold ${isCriticalLow ? 'text-red-700 text-sm font-extrabold' : 'text-stone-800'}`}>
                      {item.stock.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">
                      {item.minStock.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      {isCriticalLow ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-600 text-white border border-red-700 shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-white" />
                          <span>KRITIS &lt; 5 {item.unit}</span>
                        </span>
                      ) : isMinStockLow ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Stok Menipis!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aman</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIngredient(item);
                          setRestockAmount(item.unit === 'gram' ? 2000 : item.unit === 'ml' ? 3000 : 20);
                        }}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs ${
                          isCriticalLow
                            ? 'bg-red-600 hover:bg-red-700 text-white font-extrabold'
                            : 'bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECENT TRANSACTION LOG */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
          <ArrowDownUp className="w-4 h-4 text-amber-700" />
          <span>Buku Transaksi Terakhir (Hybrid Feed)</span>
        </h3>

        <div className="divide-y divide-stone-100">
          {orders.slice(0, 8).map(order => (
            <div key={order.id} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-stone-900">{order.id}</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    order.source === 'preorder' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {order.source === 'preorder' ? 'Pre-Order HP' : 'Kasir Meja'}
                  </span>
                  <span className="text-stone-500">• {order.customerName}</span>
                </div>
                <div className="text-stone-500">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="font-mono font-bold text-stone-900">{formatRupiah(order.totalAmount)}</div>
                <div className="text-[10px] text-stone-400">
                  {order.paymentMethod.toUpperCase()} • {formatTime(order.createdAt)} WIB
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESTOCK MODAL */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">Restock Bahan Baku</h3>
              <p className="text-xs text-stone-500">
                Tambah persediaan untuk: <strong className="text-stone-800">{selectedIngredient.name}</strong>
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Jumlah Tambahan ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockAmount}
                  onChange={e => setRestockAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] text-stone-600">
                Stok saat ini: {selectedIngredient.stock} {selectedIngredient.unit}.<br />
                Setelah restock: <strong>{selectedIngredient.stock + restockAmount} {selectedIngredient.unit}</strong>.
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isRestocking}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {isRestocking ? 'Menyimpan...' : 'Simpan Stok Baru'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIngredient(null)}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
