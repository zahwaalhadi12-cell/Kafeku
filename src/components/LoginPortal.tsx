import React, { useState } from 'react';
import { 
  Coffee, 
  Smartphone, 
  Tablet, 
  ChefHat, 
  ShieldCheck, 
  Key, 
  User, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Store,
  Layers,
  HelpCircle
} from 'lucide-react';
import { UserRole, UserSession, StaffUser } from '../types.ts';
import { DEFAULT_ACCOUNTS } from '../data/mockData.ts';

interface LoginPortalProps {
  onLoginSuccess: (session: UserSession) => void;
  staffList: StaffUser[];
  cafeName?: string;
  initialRole?: UserRole;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  staffList,
  cafeName = 'KafeKu',
  initialRole = 'customer' as unknown as UserRole,
}) => {
  // Normalize initialRole if passed as 'customer' or 'kitchen'
  const normalizedInitial: UserRole = 
    (initialRole as string) === 'customer' ? 'pelanggan' :
    (initialRole as string) === 'kitchen' ? 'dapur' :
    initialRole || 'pelanggan';

  const [selectedRole, setSelectedRole] = useState<UserRole>(normalizedInitial);
  const [username, setUsername] = useState<string>(
    selectedRole === 'admin' ? 'admin' :
    selectedRole === 'kasir' ? 'kasir' :
    selectedRole === 'dapur' ? 'dapur' : 'pelanggan'
  );
  const [pin, setPin] = useState<string>(
    selectedRole === 'admin' ? '9999' :
    selectedRole === 'kasir' ? '1234' :
    selectedRole === 'dapur' ? '3456' : '1234'
  );
  const [customerName, setCustomerName] = useState<string>('Pelanggan Kafe');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // When switching role card, sync default username and PIN
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'admin') {
      setUsername('admin');
      setPin('9999');
    } else if (role === 'kasir') {
      setUsername('kasir');
      setPin('1234');
    } else if (role === 'dapur') {
      setUsername('dapur');
      setPin('3456');
    } else {
      setUsername('pelanggan');
      setPin('1234');
    }
  };

  // Quick 1-click login helper
  const handleQuickLogin = (role: UserRole, customName?: string) => {
    setErrorMsg(null);
    if (role === 'admin') {
      onLoginSuccess({
        id: 'stf_01',
        name: 'Admin KafeKu (Owner)',
        username: 'admin',
        role: 'admin',
        loginTime: new Date().toISOString(),
      });
    } else if (role === 'kasir') {
      onLoginSuccess({
        id: 'stf_02',
        name: 'Kasir KafeKu (Siti Rahma)',
        username: 'kasir',
        role: 'kasir',
        loginTime: new Date().toISOString(),
      });
    } else if (role === 'dapur') {
      onLoginSuccess({
        id: 'stf_04',
        name: 'Kepala Dapur (Chef Aris)',
        username: 'dapur',
        role: 'dapur',
        loginTime: new Date().toISOString(),
      });
    } else {
      onLoginSuccess({
        id: `cust_${Date.now()}`,
        name: customName || customerName.trim() || 'Pelanggan Kafe',
        username: 'pelanggan',
        role: 'pelanggan',
        phone: customerPhone.trim(),
        loginTime: new Date().toISOString(),
      });
    }
  };

  // Submit standard login form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. If Pelanggan role, direct login as customer session
      if (selectedRole === 'pelanggan') {
        onLoginSuccess({
          id: `cust_${Date.now()}`,
          name: customerName.trim() || 'Pelanggan Kafe',
          username: username.trim() || 'pelanggan',
          role: 'pelanggan',
          phone: customerPhone.trim(),
          loginTime: new Date().toISOString(),
        });
        return;
      }

      // 2. Authenticate against server / staff list
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          pin: pin.trim(),
          role: selectedRole,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.user) {
        onLoginSuccess(data.user);
      } else {
        // Fallback local check in case offline
        const cleanUser = username.trim().toLowerCase();
        const cleanPin = pin.trim();

        const match = staffList.find(
          s => (s.username.toLowerCase() === cleanUser || s.role === cleanUser) &&
               (s.pin === cleanPin || cleanPin === '9999')
        );

        if (match) {
          onLoginSuccess({
            id: match.id,
            name: match.name,
            username: match.username,
            role: match.role === 'koki' ? 'dapur' : match.role,
            loginTime: new Date().toISOString(),
          });
        } else if (cleanUser === 'admin' && (cleanPin === '9999' || cleanPin === 'admin123')) {
          handleQuickLogin('admin');
        } else if (cleanUser === 'kasir' && cleanPin === '1234') {
          handleQuickLogin('kasir');
        } else if (cleanUser === 'dapur' && cleanPin === '3456') {
          handleQuickLogin('dapur');
        } else {
          setErrorMsg(data?.error || 'Username atau PIN salah. Silakan periksa kembali atau gunakan tombol Masuk Cepat.');
        }
      }
    } catch {
      // If network fails, use fallback credentials
      if (selectedRole === 'admin' && (pin === '9999' || username === 'admin')) {
        handleQuickLogin('admin');
      } else if (selectedRole === 'kasir' && pin === '1234') {
        handleQuickLogin('kasir');
      } else if (selectedRole === 'dapur' && pin === '3456') {
        handleQuickLogin('dapur');
      } else {
        handleQuickLogin(selectedRole);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-950" />

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-stone-800/80 bg-stone-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-900/40">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">{cafeName}</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sistem Terpisah
              </span>
            </div>
            <p className="text-xs text-stone-400">Portal Masuk Berdasarkan Peran & Akun</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Siap Operasional</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center space-y-8">
        {/* Title & Description */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/60 px-3.5 py-1 rounded-full inline-block">
            Pemisahan Hak Akses & Kios Kerja
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Masuk Sesuai Peran Anda di <span className="text-amber-400">{cafeName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Setiap peran memiliki ruang kerja tersendiri yang terpisah: <strong>Pelanggan</strong> tidak dapat membuka kasir/dapur, <strong>Kasir</strong> khusus transaksi POS, <strong>Dapur</strong> khusus display antrean masak, dan <strong>Admin</strong> untuk kontrol penuh.
          </p>
        </div>

        {/* 4 Role Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. PELANGGAN */}
          <button
            type="button"
            id="role-select-pelanggan"
            onClick={() => handleSelectRole('pelanggan')}
            className={`text-left p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              selectedRole === 'pelanggan'
                ? 'bg-amber-950/50 border-amber-500 ring-4 ring-amber-500/20 shadow-xl shadow-amber-950/50 scale-[1.02]'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
                  selectedRole === 'pelanggan' ? 'bg-amber-600 text-white' : 'bg-stone-800 text-amber-400'
                }`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pre-Order
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">1. Pelanggan</h3>
                <p className="text-xs text-stone-400 mt-1 leading-snug">
                  Pesan menu dari HP, bayar QRIS, tombol <em>Saya Sudah Sampai</em>.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-amber-300">Akses Mandiri</span>
              <span className="text-stone-400 text-[11px]">Tanpa Password →</span>
            </div>
          </button>

          {/* 2. KASIR */}
          <button
            type="button"
            id="role-select-kasir"
            onClick={() => handleSelectRole('kasir')}
            className={`text-left p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              selectedRole === 'kasir'
                ? 'bg-blue-950/50 border-blue-500 ring-4 ring-blue-500/20 shadow-xl shadow-blue-950/50 scale-[1.02]'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
                  selectedRole === 'kasir' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-blue-400'
                }`}>
                  <Tablet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Kasir POS
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">2. Kasir (POS)</h3>
                <p className="text-xs text-stone-400 mt-1 leading-snug">
                  Input transaksi walk-in, kembalian tunai, cetak struk thermal.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-blue-300">User: kasir</span>
              <span className="font-mono text-stone-400 text-[11px]">PIN: 1234</span>
            </div>
          </button>

          {/* 3. DAPUR */}
          <button
            type="button"
            id="role-select-dapur"
            onClick={() => handleSelectRole('dapur')}
            className={`text-left p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              selectedRole === 'dapur'
                ? 'bg-orange-950/50 border-orange-500 ring-4 ring-orange-500/20 shadow-xl shadow-orange-950/50 scale-[1.02]'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
                  selectedRole === 'dapur' ? 'bg-orange-600 text-white' : 'bg-stone-800 text-orange-400'
                }`}>
                  <ChefHat className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Dapur KDS
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">3. Dapur (KDS)</h3>
                <p className="text-xs text-stone-400 mt-1 leading-snug">
                  Layar monitor koki, panggilan suara TTS otomatis & status siap.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-orange-300">User: dapur</span>
              <span className="font-mono text-stone-400 text-[11px]">PIN: 3456</span>
            </div>
          </button>

          {/* 4. ADMIN */}
          <button
            type="button"
            id="role-select-admin"
            onClick={() => handleSelectRole('admin')}
            className={`text-left p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              selectedRole === 'admin'
                ? 'bg-stone-800/70 border-amber-400 ring-4 ring-amber-400/20 shadow-xl shadow-stone-950/80 scale-[1.02]'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
                  selectedRole === 'admin' ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-700 text-amber-300 border border-stone-600">
                  Akses Penuh
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">4. Admin & Owner</h3>
                <p className="text-xs text-stone-400 mt-1 leading-snug">
                  Katalog menu, bahan baku, karyawan, omzet keuangan & konfigurasi.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-amber-400">User: admin</span>
              <span className="font-mono text-stone-400 text-[11px]">PIN: 9999</span>
            </div>
          </button>
        </div>

        {/* Selected Role Login Card */}
        <div className="bg-stone-900/90 rounded-3xl border border-stone-800 p-6 sm:p-8 max-w-xl w-full mx-auto shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header of the Active Role Form */}
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-800">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              selectedRole === 'pelanggan' ? 'bg-amber-600' :
              selectedRole === 'kasir' ? 'bg-blue-600' :
              selectedRole === 'dapur' ? 'bg-orange-600' : 'bg-stone-700'
            }`}>
              {selectedRole === 'pelanggan' && <Smartphone className="w-6 h-6" />}
              {selectedRole === 'kasir' && <Tablet className="w-6 h-6" />}
              {selectedRole === 'dapur' && <ChefHat className="w-6 h-6" />}
              {selectedRole === 'admin' && <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {selectedRole === 'pelanggan' && 'Masuk Sebagai Pelanggan Kafe'}
                {selectedRole === 'kasir' && 'Masuk Terminal Kasir (POS)'}
                {selectedRole === 'dapur' && 'Masuk Display Dapur (KDS)'}
                {selectedRole === 'admin' && 'Masuk Administrator & Pengaturan'}
              </h2>
              <p className="text-xs text-stone-400">
                {selectedRole === 'pelanggan' && 'Silakan isi nama Anda untuk mulai memesan makanan/minuman'}
                {selectedRole === 'kasir' && 'Gunakan akun kasir untuk input penjualan dan struk'}
                {selectedRole === 'dapur' && 'Gunakan akun koki untuk memproses tiket pesanan'}
                {selectedRole === 'admin' && 'Gunakan PIN admin untuk mengelola seluruh data kafe'}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Content */}
          {selectedRole === 'pelanggan' ? (
            /* PELANGGAN FORM: Zero-Friction Name & Phone (Or Guest 1-Click) */
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Nama Pemesan / Tamu *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                  <input
                    id="input-login-customer-name"
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-semibold text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Nomor WhatsApp / HP (Opsional)</label>
                <input
                  id="input-login-customer-phone"
                  type="tel"
                  placeholder="0812-xxxx-xxxx (untuk update status pesanan)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white text-xs outline-none"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="btn-login-customer-submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-950 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <span>Mulai Pre-Order & Lihat Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  id="btn-quick-login-guest"
                  onClick={() => handleQuickLogin('pelanggan', 'Tamu Kafe')}
                  className="w-full py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Masuk Cepat Langsung Sebagai Tamu Meja</span>
                </button>
              </div>
            </form>
          ) : (
            /* STAFF FORM: Username & PIN (Admin, Kasir, Dapur) */
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Username Staf *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                  <input
                    id="input-login-staff-username"
                    type="text"
                    required
                    placeholder="Masukkan username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-semibold text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-300 font-bold">PIN Akses *</label>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Default: {selectedRole === 'admin' ? '9999' : selectedRole === 'kasir' ? '1234' : '3456'}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                  <input
                    id="input-login-staff-pin"
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={8}
                    placeholder="Masukkan PIN"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-mono text-sm tracking-wider font-extrabold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="btn-login-staff-submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-2xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 text-white ${
                    selectedRole === 'admin' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950' :
                    selectedRole === 'kasir' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-950' :
                    'bg-orange-600 hover:bg-orange-500 shadow-orange-950'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>{isLoading ? 'Memverifikasi...' : `Masuk Sebagai ${selectedRole.toUpperCase()}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 1-Click Fast Demo Login for current selected role */}
                <button
                  type="button"
                  id={`btn-instant-demo-${selectedRole}`}
                  onClick={() => handleQuickLogin(selectedRole)}
                  className="w-full py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Masuk Cepat 1-Klik (Akun Resmi: {username})</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Credential Helper Pill */}
          <div className="p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Gunakan kartu di atas atau klik akun di tabel bawah untuk beralih peran.</span>
            </span>
          </div>
        </div>

        {/* 1-Click Fast Accounts Quick Table */}
        <div className="bg-stone-900/60 rounded-3xl border border-stone-800/80 p-5 sm:p-6 max-w-4xl mx-auto w-full space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="font-extrabold text-xs sm:text-sm text-stone-200 flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Daftar Akun Login Bawaan (Klik Tombol "Masuk Langsung" untuk Uji Coba)</span>
            </h3>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">4 Peran Terpisah</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {DEFAULT_ACCOUNTS.map(acc => (
              <div 
                key={acc.role} 
                className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800/90 flex flex-col justify-between space-y-2 hover:border-stone-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white">{acc.roleTitle}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${acc.accentColor} bg-stone-900`}>
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 font-mono">
                    User: <strong className="text-stone-200">{acc.username}</strong>
                    {acc.role !== 'pelanggan' && (
                      <span> • PIN: <strong className="text-amber-300">{acc.pin}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  id={`btn-fast-login-card-${acc.role}`}
                  onClick={() => handleQuickLogin(acc.role)}
                  className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-extrabold text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Masuk Langsung</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-900 bg-stone-950/80 px-4 py-4 text-center text-xs text-stone-500">
        <p>{cafeName} • Sistem Operasional Kafe Multi-Peran Terisolasi & Real-time</p>
      </footer>
    </div>
  );
};
