import React from 'react';
import { 
  Coffee, 
  Smartphone, 
  Tablet, 
  ChefHat, 
  BarChart3, 
  Calculator, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Layers,
  ArrowLeftRight,
  Database
} from 'lucide-react';

export type AppTab = 'customer' | 'cashier' | 'kitchen' | 'owner' | 'admin' | 'estimate';

interface HeaderProps {
  cafeName?: string;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activeOrderCount: number;
  kitchenWaitingCount: number;
  isOfflineMode: boolean;
  setIsOfflineMode: (val: boolean) => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (val: boolean) => void;
  onOpenEstimate: () => void;
  onOpenRoleAccess: () => void;
  isStandalone?: boolean;
  onExitStandalone?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cafeName = 'KafeKu',
  activeTab,
  setActiveTab,
  activeOrderCount,
  kitchenWaitingCount,
  isOfflineMode,
  setIsOfflineMode,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
  onOpenEstimate,
  onOpenRoleAccess,
  isStandalone = false,
  onExitStandalone,
}) => {
  // If in Standalone Kiosk Mode, show a focused kiosk header
  if (isStandalone) {
    const roleTitles: Record<AppTab, { label: string; badge: string; color: string }> = {
      customer: { label: 'Pre-Order Mandiri Pelanggan', badge: 'KIOS PELANGGAN', color: 'bg-amber-600' },
      cashier: { label: 'Terminal Kasir & POS Meja', badge: 'KIOS KASIR POS', color: 'bg-blue-600' },
      kitchen: { label: 'Display Antrean Masak Dapur (KDS)', badge: 'KIOS DAPUR KDS', color: 'bg-orange-600' },
      owner: { label: 'Dashboard Laporan & Omzet', badge: 'KIOS OWNER', color: 'bg-emerald-600' },
      admin: { label: 'Sistem Admin & Konfigurasi', badge: 'KIOS ADMIN', color: 'bg-stone-700' },
      estimate: { label: 'Estimasi MVP', badge: 'INFO', color: 'bg-amber-600' },
    };

    const currentRole = roleTitles[activeTab] || roleTitles.kitchen;

    return (
      <header className="sticky top-0 z-40 bg-stone-950 border-b border-stone-800 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Kiosk Left Identity */}
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${currentRole.color} flex items-center justify-center text-white shadow-inner font-bold text-sm`}>
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-white">{cafeName}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                    {currentRole.badge}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
                  {currentRole.label} • Mode Kios Terkunci
                </p>
              </div>
            </div>

            {/* Kiosk Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Audio toggle */}
              <button
                onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                title={audioAlertsEnabled ? 'Suara Dapur (TTS) Aktif' : 'Suara Dapur (TTS) Senyap'}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  audioAlertsEnabled
                    ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Offline Indicator */}
              <button
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                title={isOfflineMode ? 'Koneksi Offline' : 'Koneksi Online'}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  isOfflineMode
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}
              >
                {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-red-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="hidden sm:inline">{isOfflineMode ? 'Offline' : 'Online'}</span>
              </button>

              {/* Supabase status badge in kiosk */}
              <div 
                title="Supabase Database: Online & Terhubung"
                className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-emerald-400 text-[10px] font-mono font-bold"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase</span>
              </div>

              {/* Role Links Hub button */}
              <button
                onClick={onOpenRoleAccess}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 text-xs font-bold transition-colors cursor-pointer"
                title="Buka Pusat Link Akses & QR Code Peran"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Link Role</span>
              </button>

              {/* Exit Standalone button */}
              {onExitStandalone && (
                <button
                  onClick={onExitStandalone}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Tampilkan semua tab navigasi sistem"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Buka Semua Role</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Cafe Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-inner">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-amber-50">{cafeName}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Hybrid Ecosystem
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden lg:block">
                Pre-Order Cerdas • Kasir Offline-Ready • Kitchen TTS
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            <button
              id="nav-customer-tab"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'customer'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Pelanggan</span>
              {activeOrderCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-400 text-stone-900 rounded-full font-bold">
                  {activeOrderCount}
                </span>
              )}
            </button>

            <button
              id="nav-cashier-tab"
              onClick={() => setActiveTab('cashier')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'cashier'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>Kasir (POS)</span>
            </button>

            <button
              id="nav-kitchen-tab"
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kitchen'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Dapur (KDS)</span>
              {kitchenWaitingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold animate-pulse">
                  {kitchenWaitingCount}
                </span>
              )}
            </button>

            <button
              id="nav-owner-tab"
              onClick={() => setActiveTab('owner')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'owner'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan & Stok</span>
              <span className="sm:hidden">Laporan</span>
            </button>

            <button
              id="nav-admin-tab"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Admin & Pengaturan</span>
              <span className="md:hidden">Admin</span>
            </button>
          </nav>

          {/* Quick Utility Tools */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* PUSAT LINK AKSES ROLE BUTTON */}
            <button
              id="btn-open-role-access"
              onClick={onOpenRoleAccess}
              title="Buka Pusat Link Akses & QR Code untuk masing-masing role (Pelanggan, Kasir, Dapur, Owner, Admin)"
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all border border-amber-500 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Link Akses Role</span>
              <span className="sm:hidden">Role</span>
            </button>

            {/* Audio TTS toggle */}
            <button
              id="btn-toggle-tts-audio"
              onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
              title={audioAlertsEnabled ? 'Suara Dapur (TTS) Aktif' : 'Suara Dapur (TTS) Senyap'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                audioAlertsEnabled
                  ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Offline Simulator Switch */}
            <button
              id="btn-toggle-sim-offline"
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              title={isOfflineMode ? 'Koneksi Offline (Simulasi Mati Lampu/Internet)' : 'Koneksi Online Normal'}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isOfflineMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden md:inline">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Online</span>
                </>
              )}
            </button>

            {/* Supabase Database Fast Indicator */}
            <button
              id="btn-header-supabase"
              onClick={() => setActiveTab('admin')}
              title="Database Cloud: Supabase (Terhubung). Klik untuk melihat detail & status tabel."
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-950/70 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden lg:inline font-mono font-bold">Supabase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* MVP Estimation Info Button */}
            <button
              id="btn-open-estimate"
              onClick={onOpenEstimate}
              className="hidden xl:flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Info MVP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
