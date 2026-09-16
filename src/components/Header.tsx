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
  BellRing,
  Info,
  Settings
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
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Cafe Brand */}
          <div className="flex items-center space-x-3">
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
              <p className="text-xs text-stone-400 hidden sm:block">
                Pre-Order Cerdas • Kasir Offline-Ready • Kitchen TTS
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
            <button
              id="nav-customer-tab"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'cashier'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>Kasir POS</span>
              {isOfflineMode && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping ml-1" />
              )}
            </button>

            <button
              id="nav-kitchen-tab"
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
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
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'owner'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan & Stok</span>
              <span className="sm:hidden">Owner</span>
            </button>

            <button
              id="nav-admin-tab"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
          <div className="flex items-center space-x-2">
            {/* Audio TTS toggle */}
            <button
              id="btn-toggle-tts-audio"
              onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
              title={audioAlertsEnabled ? 'Suara Dapur (TTS) Aktif' : 'Suara Dapur (TTS) Senyap'}
              className={`p-2 rounded-lg border transition-colors ${
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
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
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

            {/* MVP Estimation Info Button */}
            <button
              id="btn-open-estimate"
              onClick={onOpenEstimate}
              className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Estimasi Biaya & Waktu MVP</span>
              <span className="lg:hidden">Info MVP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
