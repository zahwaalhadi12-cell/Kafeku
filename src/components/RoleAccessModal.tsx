import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Smartphone, 
  Tablet, 
  ChefHat, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Layers, 
  Tv, 
  Printer, 
  Monitor, 
  ShieldCheck,
  Download,
  Info
} from 'lucide-react';
import { AppTab } from './Header.tsx';

interface RoleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: AppTab) => void;
  cafeName?: string;
}

interface RoleLinkInfo {
  id: AppTab;
  title: string;
  roleName: string;
  tagline: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  deviceSuggestion: string;
  description: string;
  features: string[];
}

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({
  isOpen,
  onClose,
  onSwitchTab,
  cafeName = 'KafeKu',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [standaloneMode, setStandaloneMode] = useState<boolean>(true);
  const [selectedRoleForQr, setSelectedRoleForQr] = useState<AppTab>('kitchen');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const roles: RoleLinkInfo[] = [
    {
      id: 'customer',
      title: 'Pelanggan (Pre-Order & QR Meja)',
      roleName: 'Pelanggan Kafe',
      tagline: 'Pesan dari HP, bayar QRIS & tombol "Saya Sudah Sampai"',
      path: '/customer',
      icon: Smartphone,
      accentColor: 'from-amber-600 to-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeText: 'Paling Sering Digunakan Tamu',
      deviceSuggestion: 'Smartphone Pelanggan / QR Code Akrilik Meja',
      description: 'Link publik untuk tamu yang ingin memesan pre-order sebelum tiba atau scan QR code saat duduk di meja kafe.',
      features: [
        'Katalog menu lengkap & status stok otomatis',
        'Pilihan Takeaway / Bungkus vs Makan di Meja',
        'Pembayaran QRIS instan & kebijakan anti no-show',
        'Tombol "Saya Sudah Sampai" penahan menu sensitif suhu'
      ]
    },
    {
      id: 'cashier',
      title: 'Kasir POS (Point of Sale)',
      roleName: 'Kasir / Barista',
      tagline: 'Transaksi cepat walk-in, offline-ready & cetak struk',
      path: '/cashier',
      icon: Tablet,
      accentColor: 'from-blue-600 to-indigo-800',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
      badgeText: 'Kios Kasir / Counter Bar',
      deviceSuggestion: 'Tablet 10-12 inch / PC Desktop Kasir Meja',
      description: 'Layar kerja khusus staf kasir untuk mencatat pesanan tamu langsung, input uang tunai, kalkulator kembalian, dan cetak struk thermal.',
      features: [
        'Pilihan meja & Takeaway / Bungkus cepat',
        'Proteksi uang kurang (tombol struk otomatis terkunci jika uang kurang)',
        'Tombol minus (-) & silang (X) pembatalan item cepat',
        'Mode offline darurat jika koneksi internet/listrik padam',
        'Konfirmasi manual kehadiran tamu jika baterai HP tamu habis'
      ]
    },
    {
      id: 'kitchen',
      title: 'Dapur (Kitchen Display System / KDS)',
      roleName: 'Koki & Barista Dapur',
      tagline: 'Tiket masak real-time, label TAKEAWAY & suara alarm TTS',
      path: '/kitchen',
      icon: ChefHat,
      accentColor: 'from-orange-600 to-red-700',
      badgeBg: 'bg-orange-100 text-orange-950 border-orange-300',
      badgeText: 'Layar Monitor Dapur',
      deviceSuggestion: 'Tablet Wall-Mount / Smart TV / Monitor Touchscreen Dapur',
      description: 'Layar monitor untuk stasiun peracikan minuman barista dan juru masak dapur. Dilengkapi suara alarm TTS otomatis memanggil menu.',
      features: [
        'Label mencolok oranye "TAKEAWAY / BUNGKUS" (kemasan box/paper bag)',
        'Peringatan otomatis saat tamu menekan "Saya Sudah Sampai"',
        'Alarm suara chime & pembacaan pesanan suara bahasa Indonesia (TTS)',
        'Tombol update status: Menunggu -> Antrean -> Dimasak -> Siap Diambil'
      ]
    },
    {
      id: 'owner',
      title: 'Laporan & Stok (Owner Dashboard)',
      roleName: 'Pemilik Kafe / Investor',
      tagline: 'Pantau omzet real-time, profit & peringatan stok < 5',
      path: '/owner',
      icon: BarChart3,
      accentColor: 'from-emerald-600 to-teal-800',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeText: 'Dashboard Pemilik',
      deviceSuggestion: 'Laptop / iPad / Smartphone Pribadi Pemilik',
      description: 'Tinjauan performa bisnis harian untuk memantau omzet pesanan pre-order vs kasir, dana selamat dari no-show, dan stok gudang.',
      features: [
        'Total omzet harian & rincian pembayaran (QRIS vs Tunai)',
        'Nilai proteksi Anti No-Show non-refundable',
        'Peringatan merah menyala untuk bahan baku stok tipis (< 5 porsi)',
        'Formulir restock cepat bahan baku langsung ke sistem'
      ]
    },
    {
      id: 'admin',
      title: 'Admin & Pengaturan Sistem',
      roleName: 'Store Manager / Super Admin',
      tagline: 'Kelola menu makanan, karyawan, meja & variasi suara',
      path: '/admin',
      icon: Settings,
      accentColor: 'from-stone-700 to-stone-900',
      badgeBg: 'bg-stone-200 text-stone-900 border-stone-300',
      badgeText: 'Manajemen Sistem',
      deviceSuggestion: 'Laptop / PC Manager Toko',
      description: 'Pusat kontrol operasional untuk mengedit harga menu, mengatur denah meja, jam buka/tutup kafe, dan memilih 4 jenis suara bel notifikasi.',
      features: [
        'Katalog resep menu & saklar stok habis/tersedia',
        'Pengaturan 4 variasi suara bel pesanan (Ting, Ceria, Retro, Kasir)',
        'Manajemen akun staf kasir & koki dengan PIN login',
        'Pengaturan jam operasional & pesan pengumuman pre-order'
      ]
    },
  ];

  const getFullUrl = (role: RoleLinkInfo) => {
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const query = standaloneMode ? `?role=${role.id}&standalone=true` : `?role=${role.id}`;
    return `${origin}/${query}`;
  };

  // Generate QR Code whenever selected role or standalone mode changes
  useEffect(() => {
    if (!isOpen) return;
    const targetRole = roles.find(r => r.id === selectedRoleForQr) || roles[0];
    const fullUrl = getFullUrl(targetRole);

    setQrLoading(true);
    QRCode.toDataURL(fullUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1c1917', // stone-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        setQrDataUrl(url);
        setQrLoading(false);
      })
      .catch(err => {
        console.error('Failed to generate QR code', err);
        setQrLoading(false);
      });
  }, [isOpen, selectedRoleForQr, standaloneMode, baseUrl]);

  const handleCopyLink = async (role: RoleLinkInfo) => {
    const url = getFullUrl(role);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(role.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback prompt if clipboard fails
      prompt('Salin link akses role ini:', url);
    }
  };

  const handleOpenLink = (role: RoleLinkInfo) => {
    const url = getFullUrl(role);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSwitchTabNow = (tab: AppTab) => {
    if (onSwitchTab) {
      onSwitchTab(tab);
      onClose();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${selectedRoleForQr}-${cafeName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (!isOpen) return null;

  const currentRoleForQr = roles.find(r => r.id === selectedRoleForQr) || roles[0];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL TOP HEADER */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-start justify-between border-b border-stone-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-600 text-white font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-amber-50">
                  Pusat Link Akses Peran & Kios Perangkat
                </h2>
                <span className="text-xs text-amber-300 font-medium">
                  {cafeName} • Ekosistem Hybrid Terintegrasi
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 max-w-2xl pt-1">
              Buka atau pasang tautan khusus di masing-masing perangkat (Tablet Kasir, Layar Monitor Dapur KDS, HP Pelanggan di Meja, dan Dashboard Owner) secara terpisah.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS BAR: KIOSK MODE TOGGLE */}
        <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="chk-standalone-mode"
              checked={standaloneMode}
              onChange={e => setStandaloneMode(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
            />
            <label htmlFor="chk-standalone-mode" className="font-bold text-stone-800 cursor-pointer flex items-center space-x-1">
              <span>Mode Kios Standalone (Kunci Tampilan Khusus Peran)</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                ?standalone=true
              </span>
            </label>
          </div>

          <div className="text-[11px] text-stone-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {standaloneMode 
                ? 'Layar perangkat hanya menampilkan peran target tanpa tombol navigasi membingungkan'
                : 'Layar tetap menyertakan semua tombol tab navigasi global'}
            </span>
          </div>
        </div>

        {/* MODAL MAIN CONTENT BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TWO COLUMNS: ROLES CARDS (LEFT) & LIVE QR CODE / DEPLOYMENT (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDE: LIST OF ROLE ACCESS LINKS (7 COLS) */}
            <div className="lg:col-span-7 space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
                <span>Daftar Link Akses Terpisah per Peran ({roles.length})</span>
              </h3>

              {roles.map((role) => {
                const IconComponent = role.icon;
                const fullUrl = getFullUrl(role);
                const isSelectedForQr = selectedRoleForQr === role.id;
                const isCopied = copiedId === role.id;

                return (
                  <div
                    key={role.id}
                    className={`rounded-2xl border p-4 transition-all space-y-3 ${
                      isSelectedForQr
                        ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Header of Role Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${role.accentColor} text-white shadow-xs shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="font-extrabold text-stone-900 text-sm">{role.title}</h4>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${role.badgeBg}`}>
                              {role.badgeText}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">{role.tagline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Target Device suggestion */}
                    <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/80 text-[11px] text-stone-600 flex items-center justify-between">
                      <span className="font-semibold text-stone-700">Perangkat Rekomendasi:</span>
                      <span className="font-mono text-stone-900 font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                        {role.deviceSuggestion}
                      </span>
                    </div>

                    {/* URL Box & Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5">
                        <div className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 font-mono text-[11px] text-stone-800 truncate select-all">
                          {fullUrl}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyLink(role)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-stone-900 hover:bg-stone-800 text-white'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin!' : 'Salin Link'}</span>
                        </button>

                        {/* Open in New Tab Button */}
                        <button
                          onClick={() => handleOpenLink(role)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                          title="Buka tampilan di tab browser baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Tab Baru</span>
                        </button>

                        {/* Show QR Code button */}
                        <button
                          onClick={() => setSelectedRoleForQr(role.id)}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isSelectedForQr
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Lihat QR Code</span>
                        </button>

                        {/* Switch Here Button */}
                        {onSwitchTab && (
                          <button
                            onClick={() => handleSwitchTabNow(role.id)}
                            className="text-[11px] text-stone-400 hover:text-stone-700 underline font-semibold ml-auto px-1 py-1"
                          >
                            Beralih Layar Ini
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDE: INTERACTIVE QR CODE & HARDWARE DEPLOYMENT GUIDE (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* QR Code Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm text-center space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                      Scan QR Code Instan
                    </span>
                    <h4 className="font-extrabold text-stone-900 text-sm">
                      {currentRoleForQr.roleName}
                    </h4>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-full border border-amber-300">
                    {standaloneMode ? 'Kios Aktif' : 'Standar'}
                  </span>
                </div>

                {/* QR Canvas / Image */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col items-center justify-center min-h-[220px]">
                  {qrLoading ? (
                    <div className="text-xs text-stone-400 animate-pulse">Membuat QR Code...</div>
                  ) : qrDataUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={qrDataUrl} 
                        alt={`QR Code ${currentRoleForQr.title}`} 
                        className="w-48 h-48 mx-auto rounded-xl shadow-xs border border-stone-200 bg-white p-2"
                      />
                      <p className="text-[11px] text-stone-500 font-medium">
                        Arahkan kamera smartphone atau tablet untuk membuka langsung
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400">Gagal memuat QR</div>
                  )}
                </div>

                {/* Download QR button */}
                <button
                  onClick={handleDownloadQr}
                  disabled={!qrDataUrl}
                  className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Unduh Gambar QR Code (.PNG)</span>
                </button>
              </div>

              {/* Deployment Tips & Hardware Guides */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-5 shadow-sm space-y-3.5 border border-stone-800">
                <div className="flex items-center space-x-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    Panduan Deploy di Kafe Fisik
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-stone-300 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      <strong>Tablet Dapur (KDS):</strong> Buka link Dapur di browser Google Chrome / Safari tablet dapur. Tekan menu browser lalu pilih <em>"Tambahkan ke Layar Utama" (Add to Home Screen)</em>.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      <strong>Kunci Mode Kios:</strong> Di iPad gunakan fitur <em>Guided Access</em>, atau di Android aktifkan <em>App Pinning</em> agar staf tidak keluar dari layar kasir/dapur.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      <strong>Stiker QR Meja Tamu:</strong> Unduh QR Code Pelanggan dan tempelkan pada akrilik meja 01, meja 02, dsb. Tamu cukup scan untuk memesan pre-order di jalan atau saat duduk.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-stone-500 font-medium">
            URL Base Aktif: <span className="font-mono text-stone-800 font-bold">{baseUrl || 'https://...'}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
