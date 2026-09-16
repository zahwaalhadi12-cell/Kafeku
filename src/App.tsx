import React, { useState, useEffect, useRef } from 'react';
import { Header, AppTab } from './components/Header.tsx';
import { CustomerPreOrder } from './components/CustomerPreOrder.tsx';
import { CashierPOS } from './components/CashierPOS.tsx';
import { KitchenKDS } from './components/KitchenKDS.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { AdminSettings } from './components/AdminSettings.tsx';
import { MvpEstimateModal } from './components/MvpEstimateModal.tsx';
import { MenuItem, Order, Ingredient, FinancialReport, KitchenStatus, CafeSettings, StaffUser } from './types.ts';
import { INITIAL_MENU, INITIAL_INGREDIENTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_STAFF } from './data/mockData.ts';
import { announceOrderToKitchen } from './utils/audio.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('customer');
  const [menuList, setMenuList] = useState<MenuItem[]>(INITIAL_MENU);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [settings, setSettings] = useState<CafeSettings>(INITIAL_SETTINGS);
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(null);
  const [report, setReport] = useState<FinancialReport>({
    totalRevenue: 194000,
    totalOrders: 3,
    preOrderRevenue: 140000,
    cashierRevenue: 54000,
    qrisRevenue: 140000,
    cashRevenue: 54000,
    noShowCount: 0,
    noShowProtectedRevenue: 0,
    inventoryValue: 1250000,
  });

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [showEstimateModal, setShowEstimateModal] = useState<boolean>(false);

  // Keep track of previous orders count to trigger audio TTS on newly created orders
  const prevOrderCountRef = useRef<number>(orders.length);

  // Load data from backend API
  const fetchAllData = async () => {
    try {
      // 1. Fetch menu
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) {
        const menuJson = await menuRes.json();
        if (menuJson.success && menuJson.data) setMenuList(menuJson.data);
      }

      // 2. Fetch inventory
      const invRes = await fetch('/api/inventory');
      if (invRes.ok) {
        const invJson = await invRes.json();
        if (invJson.success && invJson.data) setIngredients(invJson.data);
      }

      // 3. Fetch orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        if (ordersJson.success && ordersJson.data) {
          const newOrders: Order[] = ordersJson.data;

          // Check if a new order was added by someone else while audio is enabled
          if (newOrders.length > prevOrderCountRef.current && audioAlertsEnabled) {
            const newest = newOrders[0];
            const itemsStr = newest.items.map(i => `${i.name} ${i.quantity}`).join(', ');
            announceOrderToKitchen(
              newest.source === 'preorder' ? `Pre-Order ${newest.customerName}` : 'Kasir',
              itemsStr
            );
          }
          prevOrderCountRef.current = newOrders.length;
          setOrders(newOrders);
        }
      }

      // 4. Fetch reports
      const reportsRes = await fetch('/api/reports');
      if (reportsRes.ok) {
        const reportsJson = await reportsRes.json();
        if (reportsJson.success && reportsJson.data) setReport(reportsJson.data);
      }

      // 5. Fetch cafe operational settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.success && settingsJson.data) setSettings(settingsJson.data);
      }

      // 6. Fetch staff roster
      const staffRes = await fetch('/api/staff');
      if (staffRes.ok) {
        const staffJson = await staffRes.json();
        if (staffJson.success && staffJson.data) setStaffList(staffJson.data);
      }
    } catch {
      // Server might be booting or offline
    }
  };

  useEffect(() => {
    fetchAllData();

    // Poll every 5 seconds for real-time updates across screens
    const interval = setInterval(() => {
      if (!isOfflineMode) {
        fetchAllData();
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isOfflineMode, audioAlertsEnabled]);

  // Create new order handler
  const handleCreateOrder = async (orderPayload: Partial<Order>): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const createdOrder: Order = json.data;
        setOrders(prev => [createdOrder, ...prev]);
        prevOrderCountRef.current += 1;

        // Trigger TTS sound notification
        if (audioAlertsEnabled) {
          const itemsStr = createdOrder.items.map(i => `${i.name} ${i.quantity}`).join(', ');
          announceOrderToKitchen(
            createdOrder.source === 'preorder' ? `Pre-Order ${createdOrder.customerName}` : 'Kasir',
            itemsStr
          );
        }

        // Refresh inventory & reports
        fetchAllData();
        return createdOrder;
      }
    } catch (e) {
      console.error('Failed to create order', e);
    }
    return null;
  };

  // Customer triggers "Saya Sudah Sampai" or Staff triggers "Konfirmasi Pelanggan Hadir (Manual)"
  const handleMarkArrived = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/arrived`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? json.data : o));

        // Audio announcement for kitchen
        if (audioAlertsEnabled) {
          announceOrderToKitchen(
            json.data.customerName,
            'Pelanggan telah sampai di kafe! Segera racik menu pesanan sekarang.'
          );
        }
        return;
      }
    } catch (e) {
      console.error('Failed to mark arrived on server, fallback to local state', e);
    }

    // Local fallback (offline mode or network hiccup)
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          hasArrived: true,
          arrivedAt: new Date().toISOString(),
          kitchenStatus: o.kitchenStatus === 'menunggu_kedatangan' ? 'antrean_dapur' : o.kitchenStatus,
        };
      }
      return o;
    }));

    if (audioAlertsEnabled) {
      const targetOrder = orders.find(o => o.id === orderId);
      announceOrderToKitchen(
        targetOrder ? targetOrder.customerName : 'Pelanggan',
        'Pelanggan telah sampai di kafe! Segera racik menu pesanan sekarang.'
      );
    }
  };

  // Kitchen updates ticket status
  const handleUpdateStatus = async (orderId: string, status: KitchenStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? json.data : o));
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  // Mark customer as No-Show (Protected non-refundable revenue retained)
  const handleMarkNoShow = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/noshow`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? json.data : o));
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to mark no-show', e);
    }
  };

  // Cashier POS orders offline sync
  const handleSyncOfflineQueue = async (offlineOrders: Order[]): Promise<number> => {
    try {
      const res = await fetch('/api/orders/sync-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: offlineOrders }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAllData();
        return json.syncedCount || offlineOrders.length;
      }
    } catch (e) {
      console.error('Failed to sync offline orders', e);
    }
    return 0;
  };

  // Restock inventory ingredient
  const handleRestock = async (ingredientId: string, amount: number) => {
    try {
      const res = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId, amount }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to restock', e);
    }
  };

  // Active counts for header badges
  const activeOrderCount = orders.filter(o => o.source === 'preorder' && o.kitchenStatus !== 'selesai').length;
  const kitchenWaitingCount = orders.filter(o => o.kitchenStatus === 'menunggu_kedatangan' || o.kitchenStatus === 'antrean_dapur').length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-200">
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeOrderCount={activeOrderCount}
        kitchenWaitingCount={kitchenWaitingCount}
        isOfflineMode={isOfflineMode}
        setIsOfflineMode={setIsOfflineMode}
        audioAlertsEnabled={audioAlertsEnabled}
        setAudioAlertsEnabled={setAudioAlertsEnabled}
        onOpenEstimate={() => setShowEstimateModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Active Staff Persona Notification Bar */}
        {currentStaffUser && (
          <div className="bg-amber-900 text-amber-100 px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Mode Simulasi Karyawan Aktif: <strong>{currentStaffUser.name}</strong> ({currentStaffUser.role.toUpperCase()}) - KafeKu Senopati
              </span>
            </div>
            <button
              onClick={() => {
                setCurrentStaffUser(null);
                setActiveTab('admin');
              }}
              className="text-amber-200 hover:text-white font-bold underline cursor-pointer text-[11px]"
            >
              Keluar ke Mode Admin
            </button>
          </div>
        )}

        {/* Access Control Interceptor */}
        {currentStaffUser && currentStaffUser.role === 'kasir' && activeTab !== 'cashier' ? (
          <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-bold text-xl">
              🔒
            </div>
            <h3 className="font-extrabold text-stone-900 text-lg">Akses Dibatasi (Role: Kasir)</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              Akun <strong>{currentStaffUser.name}</strong> hanya memiliki izin untuk mengoperasikan layar Kasir POS.
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setActiveTab('cashier')}
                className="bg-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-900 shadow-xs"
              >
                Buka Kasir POS
              </button>
              <button
                onClick={() => {
                  setCurrentStaffUser(null);
                  setActiveTab('admin');
                }}
                className="bg-stone-100 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-stone-200"
              >
                Kembali ke Admin
              </button>
            </div>
          </div>
        ) : currentStaffUser && currentStaffUser.role === 'koki' && activeTab !== 'kitchen' ? (
          <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mx-auto font-bold text-xl">
              🍳
            </div>
            <h3 className="font-extrabold text-stone-900 text-lg">Akses Dibatasi (Role: Koki)</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              Akun <strong>{currentStaffUser.name}</strong> hanya memiliki izin untuk mengoperasikan layar Dapur (KDS).
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setActiveTab('kitchen')}
                className="bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-orange-700 shadow-xs"
              >
                Buka Dapur KDS
              </button>
              <button
                onClick={() => {
                  setCurrentStaffUser(null);
                  setActiveTab('admin');
                }}
                className="bg-stone-100 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-stone-200"
              >
                Kembali ke Admin
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'customer' && (
              <CustomerPreOrder
                menuList={menuList}
                orders={orders}
                onCreateOrder={handleCreateOrder}
                onMarkArrived={handleMarkArrived}
                isOfflineMode={isOfflineMode}
                settings={settings}
              />
            )}

            {activeTab === 'cashier' && (
              <CashierPOS
                menuList={menuList}
                onOrderCreated={(newOrder) => {
                  setOrders(prev => [newOrder, ...prev]);
                  prevOrderCountRef.current += 1;
                  fetchAllData();
                }}
                isOfflineMode={isOfflineMode}
                setIsOfflineMode={setIsOfflineMode}
                onSyncOfflineQueue={handleSyncOfflineQueue}
                tables={settings.tables}
                orders={orders}
                onMarkArrived={handleMarkArrived}
              />
            )}

            {activeTab === 'kitchen' && (
              <KitchenKDS
                orders={orders}
                onUpdateStatus={handleUpdateStatus}
                onMarkArrived={handleMarkArrived}
                onMarkNoShow={handleMarkNoShow}
                audioAlertsEnabled={audioAlertsEnabled}
                setAudioAlertsEnabled={setAudioAlertsEnabled}
              />
            )}

            {activeTab === 'owner' && (
              <OwnerDashboard
                report={report}
                ingredients={ingredients}
                orders={orders}
                onRestock={handleRestock}
                onRefreshData={fetchAllData}
              />
            )}

            {activeTab === 'admin' && (
              <AdminSettings
                menuList={menuList}
                settings={settings}
                staffList={staffList}
                currentStaffUser={currentStaffUser}
                report={report}
                onUpdateMenu={setMenuList}
                onUpdateSettings={setSettings}
                onUpdateStaff={setStaffList}
                onSwitchStaffUser={setCurrentStaffUser}
                onRefreshAll={fetchAllData}
              />
            )}
          </>
        )}
      </main>

      {/* MVP Estimation & Timeline Modal */}
      <MvpEstimateModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
      />
    </div>
  );
}
