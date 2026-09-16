import React from 'react';
import { 
  Calculator, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Layers, 
  Tablet, 
  Printer, 
  Volume2, 
  ShieldCheck, 
  X, 
  ExternalLink,
  ChevronRight,
  Server
} from 'lucide-react';

interface MvpEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MvpEstimateModal: React.FC<MvpEstimateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Calculator className="w-3.5 h-3.5 text-amber-700" />
            <span>Proposal & Rencana Eksekusi Proyek KafeKu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            Estimasi Waktu & Biaya Pengembangan MVP "KafeKu"
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Jawaban lengkap dan terstruktur atas pertanyaan Bapak/Ibu pemilik ide kafe mengenai roadmap pengerjaan, estimasi biaya, dan spesifikasi teknologi produksi.
          </p>
        </div>

        {/* 1. RANGKUMAN WAKTU & BIAYA (HIGHLIGHTS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Estimasi Durasi Pengerjaan</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              4 – 6 Minggu
            </div>
            <p className="text-xs text-stone-600 pt-1">
              (1 hingga 1.5 bulan sampai siap uji coba operasional kafe langsung)
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" />
              <span>Estimasi Biaya Software (MVP)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-mono">
              Rp 25jt – Rp 38jt
            </div>
            <p className="text-xs text-stone-600 pt-1">
              (Full-stack: Web Pre-Order HP + Kasir POS Offline + Kitchen TTS + Database)
            </p>
          </div>
        </div>

        {/* 2. ROADMAP SPRINT PENGERJAAN (TIMELINE DETAIL) */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Rincian Tahapan Pengerjaan (Sprint Roadmap)</span>
          </h3>

          <div className="space-y-3">
            {[
              {
                sprint: 'Sprint 1 (Minggu 1 – 2)',
                title: 'Arsitektur Database, Backend API & Kasir Hybrid (Offline Mode)',
                desc: 'Membangun skema database (menu, stok bahan baku, resep), API transaksi, modul Kasir POS tablet dengan penyimpanan lokal (IndexedDB / local queue), dan fungsi cetak struk thermal.',
                icon: <Server className="w-4 h-4 text-amber-600" />
              },
              {
                sprint: 'Sprint 2 (Minggu 3)',
                title: 'Sistem Pre-Order HP & Fitur "Saya Sudah Sampai"',
                desc: 'Membangun aplikasi pelanggan mobile/PWA, pengaturan jam kedatangan, integrasi payment gateway QRIS resmi (Midtrans/Xendit) dengan kebijakan Anti No-Show (No-Refund), dan tombol interaktif "Saya Sudah Sampai".',
                icon: <Clock className="w-4 h-4 text-blue-600" />
              },
              {
                sprint: 'Sprint 3 (Minggu 4)',
                title: 'Kitchen Display System (KDS) & Alarm Suara Pintar (TTS)',
                desc: 'Sinkronisasi real-time antrean dapur, pembedaan menu sensitif suhu, integrasi Web Audio chime dan Web Speech API Text-to-Speech bahasa Indonesia untuk koki di jam sibuk.',
                icon: <Volume2 className="w-4 h-4 text-purple-600" />
              },
              {
                sprint: 'Sprint 4 (Minggu 5 – 6)',
                title: 'Integrasi Hardware Kasir, Pengujian Offline, Uji Lapangan & Rilis',
                desc: 'Uji konektivitas printer thermal Bluetooth/USB, simulasi internet putus di lokasi kafe, evaluasi respons koki, pelatihan staf kasir, dan deployment server production.',
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              }
            ].map((step, idx) => (
              <div key={idx} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start space-x-3 text-xs">
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-stone-200">
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-amber-800">{step.sprint}:</span>
                    <span className="font-bold text-stone-900">{step.title}</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. RINCIAN BIAYA & INFRASTRUKTUR */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Estimasi Biaya Operasional & Hardware Tambahan Kafe</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Biaya Operasional Bulanan */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900">Biaya Bulanan (Cloud & Gateway)</h4>
              <ul className="space-y-1.5 text-stone-600">
                <li className="flex justify-between">
                  <span>Server Backend & Database:</span>
                  <span className="font-mono font-bold text-stone-800">Rp 150rb – 300rb / bln</span>
                </li>
                <li className="flex justify-between">
                  <span>Fee MDR QRIS Bank Indonesia:</span>
                  <span className="font-mono font-bold text-stone-800">0.7% per transaksi</span>
                </li>
                <li className="flex justify-between">
                  <span>Domain Web (.id / .com):</span>
                  <span className="font-mono font-bold text-stone-800">Rp 150rb / tahun</span>
                </li>
              </ul>
            </div>

            {/* Rekomendasi Hardware Fisik */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900">Hardware Fisik Kafe (Investasi Sekali)</h4>
              <ul className="space-y-1.5 text-stone-600">
                <li className="flex justify-between">
                  <span>Tablet Kasir (Android 10"):</span>
                  <span className="font-mono font-bold text-stone-800">± Rp 2.200.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Tablet Dapur KDS (Android 10"):</span>
                  <span className="font-mono font-bold text-stone-800">± Rp 2.200.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Printer Thermal Kasir Bluetooth:</span>
                  <span className="font-mono font-bold text-stone-800">± Rp 450.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Speaker Bluetooth Dapur (TTS):</span>
                  <span className="font-mono font-bold text-stone-800">± Rp 250.000</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. NILAI TAMBAH KAFEKU */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-stone-800 space-y-1.5">
          <div className="font-bold text-amber-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Keunggulan Kompetitif Arsitektur Ini:</span>
          </div>
          <p className="text-stone-700 leading-relaxed">
            MVP yang telah kita bangun ini sudah langsung membuktikan konsep di lapangan: <strong>Anti No-Show</strong> menjamin tidak ada uang terbuang, <strong>"Saya Sudah Sampai"</strong> menjamin es tidak mencair dan makanan tetap panas mengepul, <strong>Kasir Offline</strong> menjaga kelancaran saat mati internet, dan <strong>Alarm Suara Dapur</strong> mempercepat output koki tanpa kebingungan membaca tablet.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm"
          >
            Tutup & Kembali ke Aplikasi
          </button>
        </div>
      </div>
    </div>
  );
};
