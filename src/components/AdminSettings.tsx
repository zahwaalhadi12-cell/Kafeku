import React, { useState, useEffect, useRef } from 'react';
import { 
  MenuItem, 
  MenuCategory, 
  CafeSettings, 
  CafeTable, 
  StaffUser, 
  StaffRole,
  FinancialReport,
  TopSellingItem,
  NotificationSound
} from '../types.ts';
import { formatRupiah } from '../utils/formatters.ts';
import { playNotificationSound } from '../utils/audio.ts';
import { 
  Settings, 
  UtensilsCrossed, 
  LayoutGrid, 
  Users, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  ShieldAlert, 
  Smartphone, 
  Tablet, 
  ChefHat, 
  Flame, 
  Snowflake, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter, 
  Check, 
  X, 
  Power, 
  UserCheck, 
  Key,
  RefreshCw,
  Award,
  Store,
  MapPin,
  Phone,
  Volume2,
  Play,
  Layers,
  Database,
  Copy,
  ExternalLink,
  AlertCircle,
  Upload,
  Camera,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

// Client-side image compressor for seamless local upload without external URLs
const compressImageFile = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Kurasi Foto Menu Estetik Cepat (Tanpa Perlu Ketik URL)
const MENU_IMAGE_PRESETS: Record<MenuCategory, { title: string; url: string }[]> = {
  kopi: [
    { title: 'Es Kopi Susu Aren', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80' },
    { title: 'Hot Cappuccino', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
    { title: 'Iced Americano', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80' },
    { title: 'Caramel Macchiato', url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=80' },
    { title: 'Manual Brew V60', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' },
  ],
  'non-kopi': [
    { title: 'Uji Matcha Latte', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80' },
    { title: 'Cokelat Hangat', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80' },
    { title: 'Earl Grey Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80' },
    { title: 'Fresh Lemon Tea', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80' },
    { title: 'Taro Latte', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80' },
  ],
  makanan: [
    { title: 'Nasi Goreng Spesial', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80' },
    { title: 'Chicken Katsu Don', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80' },
    { title: 'Spaghetti Creamy', url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=80' },
    { title: 'Burger Daging Sapi', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  ],
  snack: [
    { title: 'Croissant Butter', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80' },
    { title: 'Truffle French Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80' },
    { title: 'Churros Cokelat', url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&auto=format&fit=crop&q=80' },
    { title: 'Roti Panggang Kaya', url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500&auto=format&fit=crop&q=80' },
  ],
};

interface AdminSettingsProps {
  menuList: MenuItem[];
  settings: CafeSettings;
  staffList: StaffUser[];
  currentStaffUser: StaffUser | null;
  report: FinancialReport;
  onUpdateMenu: (menu: MenuItem[]) => void;
  onUpdateSettings: (newSettings: CafeSettings) => void;
  onUpdateStaff: (staff: StaffUser[]) => void;
  onSwitchStaffUser: (user: StaffUser | null) => void;
  onRefreshAll: () => Promise<void>;
  onOpenRoleAccess?: () => void;
}

export type AdminSubTab = 'menu' | 'tables_ops' | 'staff' | 'financial_summary' | 'supabase_db';

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  menuList,
  settings,
  staffList,
  currentStaffUser,
  report,
  onUpdateMenu,
  onUpdateSettings,
  onUpdateStaff,
  onSwitchStaffUser,
  onRefreshAll,
  onOpenRoleAccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('menu');

  // Menu Management state
  const [searchMenuQuery, setSearchMenuQuery] = useState('');
  const [filterMenuCategory, setFilterMenuCategory] = useState<'all' | MenuCategory>('all');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Menu Form state
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState<MenuCategory>('kopi');
  const [menuFormPrice, setMenuFormPrice] = useState<number>(25000);
  const [menuFormDesc, setMenuFormDesc] = useState('');
  const [menuFormAvailable, setMenuFormAvailable] = useState<boolean>(true);
  const [menuFormSensitive, setMenuFormSensitive] = useState<boolean>(false);
  const [menuFormSensitiveReason, setMenuFormSensitiveReason] = useState('');
  const [menuFormPrepTime, setMenuFormPrepTime] = useState<number>(4);
  const [menuFormImage, setMenuFormImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Table Management state
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  // Staff Management state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormRole, setStaffFormRole] = useState<StaffRole>('kasir');
  const [staffFormUsername, setStaffFormUsername] = useState('');
  const [staffFormPin, setStaffFormPin] = useState('1234');
  const [staffFormStatus, setStaffFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  // Top Selling Items state
  const [topSellingData, setTopSellingData] = useState<{
    items: TopSellingItem[];
    categoryStats: Record<string, { count: number; revenue: number }>;
  } | null>(null);
  const [isLoadingTopSelling, setIsLoadingTopSelling] = useState(false);

  // Settings form
  const [cafeNameInput, setCafeNameInput] = useState(settings.cafeName || 'KafeKu Senopati');
  const [locationInput, setLocationInput] = useState(settings.location || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan');
  const [phoneInput, setPhoneInput] = useState(settings.phone || '0812-8888-9999');
  const [openTimeInput, setOpenTimeInput] = useState(settings.openTime || '08:00');
  const [closeTimeInput, setCloseTimeInput] = useState(settings.closeTime || '22:00');
  const [preOrderNoticeInput, setPreOrderNoticeInput] = useState(settings.preOrderNotice || '');
  const [notificationSoundInput, setNotificationSoundInput] = useState<NotificationSound>(settings.notificationSound || 'ting_klasik');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Synchronize local settings inputs when props change
  useEffect(() => {
    setCafeNameInput(settings.cafeName || 'KafeKu Senopati');
    setLocationInput(settings.location || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan');
    setPhoneInput(settings.phone || '0812-8888-9999');
    setOpenTimeInput(settings.openTime || '08:00');
    setCloseTimeInput(settings.closeTime || '22:00');
    setPreOrderNoticeInput(settings.preOrderNotice || '');
    setNotificationSoundInput(settings.notificationSound || 'ting_klasik');
  }, [settings]);

  // Fetch top-selling items when switching to financial summary tab
  const fetchTopSelling = async () => {
    setIsLoadingTopSelling(true);
    try {
      const res = await fetch('/api/reports/top-selling');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTopSellingData(json.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingTopSelling(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'financial_summary') {
      fetchTopSelling();
    }
    if (activeSubTab === 'supabase_db') {
      fetchSupabaseStatus();
    }
  }, [activeSubTab]);

  // Supabase Database state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    url: string;
    tables: {
      menu: boolean;
      inventory: boolean;
      orders: boolean;
      cafe_settings: boolean;
      staff: boolean;
    };
    allReady: boolean;
    schemaSql: string;
  } | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchSupabaseStatus = async (refresh = false) => {
    setIsLoadingSupabase(true);
    try {
      const res = await fetch(`/api/supabase/status${refresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSupabaseStatus(json);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Supabase status:', err);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const handleSeedSupabase = async () => {
    setIsSeedingSupabase(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/supabase/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSeedMessage({
          type: 'success',
          text: 'Data awal (menu, stok bahan baku, meja, staf, & pesanan) berhasil disinkronkan ke Supabase!',
        });
        await fetchSupabaseStatus(true);
        await onRefreshAll();
      } else {
        setSeedMessage({
          type: 'error',
          text: json.error || 'Gagal sinkronisasi data ke Supabase. Pastikan tabel telah dibuat di SQL Editor.',
        });
      }
    } catch (err: any) {
      setSeedMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat menghubungi server.',
      });
    } finally {
      setIsSeedingSupabase(false);
    }
  };

  const handleCopySql = () => {
    if (supabaseStatus?.schemaSql) {
      navigator.clipboard.writeText(supabaseStatus.schemaSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleCopyUrl = () => {
    if (supabaseStatus?.url) {
      navigator.clipboard.writeText(supabaseStatus.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Sample Data Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleClearOrders = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/orders/clear', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await onRefreshAll();
        setResetFeedback({
          type: 'success',
          text: 'Berhasil! Semua data pesanan & transaksi sampel telah dihapus. Riwayat transaksi, antrean dapur, dan omzet kini bersih (Rp 0).',
        });
      }
    } catch {
      setResetFeedback({ type: 'info', text: 'Gagal menghubungi server untuk menghapus pesanan.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearMenu = async () => {
    setIsResetting(true);
    try {
      onUpdateMenu([]);
      const res = await fetch('/api/menu/clear', { method: 'POST' });
      await res.json().catch(() => ({ success: true }));
      setResetFeedback({
        type: 'success',
        text: 'Berhasil! Semua menu sampel telah dikosongkan.',
      });
    } catch {
      onUpdateMenu([]);
      setResetFeedback({ type: 'info', text: 'Menu telah dikosongkan secara lokal.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetMenu = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/menu/reset-default', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        onUpdateMenu(json.data);
        await onRefreshAll();
        setResetFeedback({
          type: 'success',
          text: 'Menu template default berhasil dimuat ulang!',
        });
      }
    } catch {
      setResetFeedback({ type: 'info', text: 'Gagal memuat ulang menu template.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearInventory = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/inventory/clear', { method: 'POST' });
      await res.json().catch(() => ({ success: true }));
      await onRefreshAll();
      setResetFeedback({
        type: 'success',
        text: 'Semua stok bahan baku sampel telah dikosongkan.',
      });
    } catch {
      setResetFeedback({ type: 'info', text: 'Bahan baku telah dikosongkan.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetInventory = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/inventory/reset-default', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        await onRefreshAll();
        setResetFeedback({
          type: 'success',
          text: 'Bahan baku template default berhasil dimuat ulang!',
        });
      }
    } catch {
      setResetFeedback({ type: 'info', text: 'Gagal memuat ulang bahan baku.' });
    } finally {
      setIsResetting(false);
    }
  };

  // Master: Hapus Semua Data Sampel Sekaligus (Pesanan, Menu, Bahan Baku)
  const handleClearAllSampleData = async () => {
    setIsResetting(true);
    try {
      onUpdateMenu([]);
      const res = await fetch('/api/reset-all-sample-data', { method: 'POST' });
      await res.json().catch(() => ({ success: true }));
      await onRefreshAll();
      setResetFeedback({
        type: 'success',
        text: 'Semua data sampel (pesanan, menu, bahan baku) telah berhasil dihapus total!',
      });
    } catch {
      onUpdateMenu([]);
      setResetFeedback({ type: 'info', text: 'Data sampel berhasil dibersihkan secara lokal.' });
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  // Handle local image file upload from device / gallery / camera
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 600, 600, 0.82);
      setMenuFormImage(compressedDataUrl);
      setResetFeedback({
        type: 'success',
        text: `Foto "${file.name}" berhasil diunggah dari perangkat!`,
      });
    } catch (err) {
      console.error('Gagal membaca gambar:', err);
      setResetFeedback({
        type: 'info',
        text: 'Gagal memproses file foto. Pastikan format gambar valid (JPG/PNG/WEBP).',
      });
    } finally {
      setIsCompressingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle open Menu modal
  const handleOpenAddMenu = () => {
    setEditingMenuItem(null);
    setMenuFormName('');
    setMenuFormCategory('kopi');
    setMenuFormPrice(25000);
    setMenuFormDesc('');
    setMenuFormAvailable(true);
    setMenuFormSensitive(false);
    setMenuFormSensitiveReason('');
    setMenuFormPrepTime(4);
    setMenuFormImage('');
    setShowUrlInput(false);
    setShowMenuModal(true);
  };

  const handleOpenEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuFormName(item.name);
    setMenuFormCategory(item.category);
    setMenuFormPrice(item.price);
    setMenuFormDesc(item.description);
    setMenuFormAvailable(item.isAvailable !== false);
    setMenuFormSensitive(item.isSensitive);
    setMenuFormSensitiveReason(item.sensitiveReason || '');
    setMenuFormPrepTime(item.preparationTimeMinutes || 4);
    setMenuFormImage(item.imageUrl || '');
    setShowUrlInput(Boolean(item.imageUrl && !item.imageUrl.startsWith('data:')));
    setShowMenuModal(true);
  };

  // Save menu item (Create or Update)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormName.trim()) return;

    const payload = {
      name: menuFormName.trim(),
      category: menuFormCategory,
      price: Number(menuFormPrice) || 0,
      description: menuFormDesc.trim(),
      isAvailable: menuFormAvailable,
      isSensitive: menuFormSensitive,
      sensitiveReason: menuFormSensitiveReason.trim() || (menuFormSensitive ? 'Sensitif suhu penyajian' : undefined),
      preparationTimeMinutes: Number(menuFormPrepTime) || 4,
      imageUrl: menuFormImage.trim() || 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    };

    try {
      if (editingMenuItem) {
        // Edit PUT
        const res = await fetch(`/api/menu/${editingMenuItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          onUpdateMenu(menuList.map(m => m.id === editingMenuItem.id ? json.data : m));
        }
      } else {
        // Create POST
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          onUpdateMenu([...menuList, json.data]);
        }
      }
      setShowMenuModal(false);
    } catch (err) {
      console.error('Failed to save menu', err);
    }
  };

  // Toggle stock availability
  const handleToggleMenuStock = async (itemId: string) => {
    try {
      const res = await fetch(`/api/menu/${itemId}/toggle-stock`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success && json.data) {
        onUpdateMenu(menuList.map(m => m.id === itemId ? json.data : m));
      }
    } catch (err) {
      console.error('Failed to toggle stock', err);
    }
  };

  // Deletion modal state (replaces window.confirm for iframe reliability)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'menu' | 'table' | 'staff';
    id: string;
    name: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Delete menu item trigger
  const handleDeleteMenu = (itemId: string, itemName: string) => {
    setDeleteConfirmation({
      type: 'menu',
      id: itemId,
      name: itemName,
    });
  };

  // Delete table trigger
  const handleDeleteTable = (tableId: string, tableName: string) => {
    setDeleteConfirmation({
      type: 'table',
      id: tableId,
      name: tableName,
    });
  };

  // Delete staff trigger
  const handleDeleteStaff = (staffId: string, staffName: string) => {
    setDeleteConfirmation({
      type: 'staff',
      id: staffId,
      name: staffName,
    });
  };

  // Execute deletion without any window.confirm (works inside iframes)
  const handleExecuteDelete = async () => {
    if (!deleteConfirmation) return;
    setIsDeletingItem(true);
    const { type, id, name } = deleteConfirmation;

    try {
      if (type === 'menu') {
        // Optimistic removal from state immediately
        onUpdateMenu(menuList.filter(m => m.id !== id));
        try {
          const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
          await res.json().catch(() => ({ success: true }));
        } catch (e) {
          console.warn('Network error during menu delete:', e);
        }
        setResetFeedback({
          type: 'success',
          text: `Menu "${name}" berhasil dihapus dari daftar katalog!`,
        });
      } else if (type === 'table') {
        onUpdateSettings({
          ...settings,
          tables: settings.tables.filter(t => t.id !== id),
        });
        try {
          const res = await fetch(`/api/settings/tables/${id}`, { method: 'DELETE' });
          await res.json().catch(() => ({ success: true }));
        } catch (e) {
          console.warn('Network error during table delete:', e);
        }
        setResetFeedback({
          type: 'success',
          text: `Meja "${name}" berhasil dihapus dari denah kafe!`,
        });
      } else if (type === 'staff') {
        try {
          const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
          const json = await res.json().catch(() => ({ success: false }));
          if (json.success !== false) {
            onUpdateStaff(staffList.filter(s => s.id !== id));
            setResetFeedback({
              type: 'success',
              text: `Akun karyawan "${name}" berhasil dihapus!`,
            });
          } else {
            setResetFeedback({
              type: 'info',
              text: json.error || 'Gagal menghapus karyawan.',
            });
          }
        } catch (e) {
          console.warn('Network error during staff delete:', e);
        }
      }
    } catch (err) {
      console.error('Failed to execute delete', err);
    } finally {
      setIsDeletingItem(false);
      setDeleteConfirmation(null);
    }
  };

  // Save Operational Hours, Identity, Sound & Pre-Order Toggle
  const handleSaveOperationalSettings = async (overridePreOrder?: boolean, overrideSound?: NotificationSound) => {
    setIsSavingSettings(true);
    const newPreOrderState = overridePreOrder !== undefined ? overridePreOrder : settings.isPreOrderEnabled;
    const soundToSave = overrideSound !== undefined ? overrideSound : notificationSoundInput;
    const payload = {
      cafeName: cafeNameInput.trim() || 'KafeKu Senopati',
      location: locationInput.trim() || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
      phone: phoneInput.trim() || '0812-8888-9999',
      openTime: openTimeInput,
      closeTime: closeTimeInput,
      isPreOrderEnabled: newPreOrderState,
      preOrderNotice: preOrderNoticeInput,
      notificationSound: soundToSave,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        onUpdateSettings(json.data);
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestSound = (sound: NotificationSound) => {
    setIsTestingSound(true);
    playNotificationSound(sound);
    setTimeout(() => setIsTestingSound(false), 600);
  };

  // Table Status change
  const handleUpdateTableStatus = async (tableId: string, status: CafeTable['status']) => {
    try {
      const res = await fetch(`/api/settings/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const updatedTables = settings.tables.map(t => t.id === tableId ? json.data : t);
        onUpdateSettings({ ...settings, tables: updatedTables });
      }
    } catch (err) {
      console.error('Failed to update table status', err);
    }
  };

  // Add Table
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTableName.trim() || undefined,
          capacity: Number(newTableCapacity) || 4,
          status: 'tersedia',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        onUpdateSettings({
          ...settings,
          tables: [...settings.tables, json.data],
        });
        setShowTableModal(false);
        setNewTableName('');
      }
    } catch (err) {
      console.error('Failed to add table', err);
    }
  };

  // Staff Save
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormName.trim() || !staffFormUsername.trim()) return;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffFormName.trim(),
          role: staffFormRole,
          username: staffFormUsername.trim(),
          pin: staffFormPin.trim() || '1234',
          status: staffFormStatus,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        onUpdateStaff([...staffList, json.data]);
        setShowStaffModal(false);
        setStaffFormName('');
        setStaffFormUsername('');
      }
    } catch (err) {
      console.error('Failed to create staff', err);
    }
  };

  // Filtered menu
  const filteredMenuList = menuList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchMenuQuery.toLowerCase());
    const matchesCat = filterMenuCategory === 'all' || item.category === filterMenuCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusat Kendali KafeKu Senopati</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Admin & Pengaturan Sistem
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Kelola katalog menu makanan/minuman, kontrol ketersediaan meja, atur jam buka & sakelar pre-order, kelola hak akses staf kasir/dapur, dan pantau performa penjualan terlaris.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            {onOpenRoleAccess && (
              <button
                id="btn-admin-open-role-access"
                onClick={onOpenRoleAccess}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer border border-amber-500/40"
              >
                <Layers className="w-4 h-4 text-amber-200" />
                <span>Pusat Link Akses Peran & Deploy Kios</span>
              </button>
            )}

            <button
              id="btn-admin-clear-sample-data"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border border-red-700/60"
              title="Hapus data pesanan sample dan bersihkan transaksi"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Bersihkan Data Sample</span>
            </button>
          </div>
        </div>

        {/* Current Active Staff Badge & Fast Switcher */}
        <div className="bg-stone-800/90 border border-stone-700 rounded-2xl p-4 w-full md:w-auto text-xs space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-400 font-semibold">Profil Aktif Saat Ini:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
              currentStaffUser?.role === 'kasir' 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : currentStaffUser?.role === 'koki'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {currentStaffUser ? currentStaffUser.role : 'Admin Utama'}
            </span>
          </div>
          <div className="font-bold text-stone-100 text-sm">
            {currentStaffUser ? currentStaffUser.name : 'Owner / Administrator'}
          </div>
          <div className="text-[11px] text-stone-400">
            {currentStaffUser?.role === 'kasir' && '⚠️ Hak akses dibatasi ke halaman Kasir POS'}
            {currentStaffUser?.role === 'koki' && '⚠️ Hak akses dibatasi ke halaman Dapur (KDS)'}
            {(!currentStaffUser || currentStaffUser.role === 'admin') && '✓ Akses penuh ke seluruh modul sistem'}
          </div>
        </div>
      </div>

      {/* Feedback banner for sample data reset */}
      {resetFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
          resetFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetFeedback.text}</span>
          </div>
          <button
            onClick={() => setResetFeedback(null)}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          id="tab-admin-menu"
          onClick={() => setActiveSubTab('menu')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'menu'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Kelola Menu ({menuList.length})</span>
        </button>

        <button
          id="tab-admin-tables"
          onClick={() => setActiveSubTab('tables_ops')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'tables_ops'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Meja & Operasional Kafe</span>
        </button>

        <button
          id="tab-admin-staff"
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'staff'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Karyawan ({staffList.length})</span>
        </button>

        <button
          id="tab-admin-reports"
          onClick={() => setActiveSubTab('financial_summary')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'financial_summary'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Laporan & Menu Terlaris</span>
        </button>

        <button
          id="tab-admin-supabase"
          onClick={() => setActiveSubTab('supabase_db')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'supabase_db'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Database Supabase</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>
      </div>

      {/* ================= SECTION 1: KELOLA MENU ================= */}
      {activeSubTab === 'menu' && (
        <div className="space-y-6">
          {/* Action Bar: Search, Category Filter, and Add Menu Button */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari nama menu atau deskripsi..."
                  value={searchMenuQuery}
                  onChange={e => setSearchMenuQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center space-x-1 overflow-x-auto text-xs">
                {(['all', 'kopi', 'non-kopi', 'makanan', 'snack'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterMenuCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all capitalize ${
                      filterMenuCategory === cat
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'all' ? 'Semua' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              {menuList.length > 0 && (
                <button
                  id="btn-admin-empty-menu"
                  onClick={handleClearMenu}
                  disabled={isResetting}
                  className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors cursor-pointer"
                  title="Hapus semua menu dan mulai dari katalog kosong"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Menu ({menuList.length})</span>
                </button>
              )}

              {/* Button Tambah Menu Baru */}
              <button
                id="btn-add-new-menu"
                onClick={handleOpenAddMenu}
                className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>
          </div>

          {/* Menu Table / Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuList.map(item => {
              const isAvailable = item.isAvailable !== false;
              return (
                <div 
                  key={item.id} 
                  id={`admin-menu-card-${item.id}`}
                  className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between space-y-3 ${
                    isAvailable ? 'border-stone-200 shadow-xs' : 'border-red-200 bg-red-50/20 opacity-80'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Category & Stock Status badge */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-stone-100 text-stone-700 tracking-wider">
                        {item.category}
                      </span>

                      {/* Stock availability toggle switch */}
                      <button
                        id={`btn-toggle-stock-${item.id}`}
                        onClick={() => handleToggleMenuStock(item.id)}
                        title="Klik untuk mengubah status ketersediaan stok"
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-red-600'}`} />
                        <span>{isAvailable ? 'Stok Tersedia' : 'Stok Habis'}</span>
                      </button>
                    </div>

                    {/* Image & Title */}
                    <div className="flex space-x-3 items-start">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100 shadow-2xs" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200 shadow-2xs">
                          <UtensilsCrossed className="w-6 h-6 text-amber-600" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-extrabold text-stone-900 text-sm leading-tight truncate">
                          {item.name}
                        </h3>
                        <div className="text-amber-800 font-bold font-mono text-xs">
                          {formatRupiah(item.price)}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>Racik ±{item.preparationTimeMinutes || 4} mnt</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Temperature Sensitivity Tag */}
                    {item.isSensitive && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center space-x-1.5">
                        {item.sensitiveReason?.toLowerCase().includes('dingin') || item.sensitiveReason?.toLowerCase().includes('es') ? (
                          <Snowflake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="truncate">{item.sensitiveReason || 'Sensitif suhu penyajian'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit & Hapus */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-end space-x-2">
                    <button
                      id={`btn-edit-menu-${item.id}`}
                      onClick={() => handleOpenEditMenu(item)}
                      className="flex items-center space-x-1 text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      id={`btn-delete-menu-${item.id}`}
                      onClick={() => handleDeleteMenu(item.id, item.name)}
                      className="flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuList.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center text-stone-500 text-sm border border-stone-200 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-stone-900 text-base">
                  {menuList.length === 0 ? 'Katalog Menu Kafe Anda Masih Kosong' : 'Tidak Ada Menu yang Sesuai'}
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {menuList.length === 0
                    ? 'Aplikasi siap digunakan. Tambahkan hidangan atau racikan kopi pertama Anda sekarang!'
                    : 'Tidak ada menu yang sesuai dengan kata kunci pencarian atau filter kategori yang dipilih.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  id="btn-empty-add-first-menu"
                  onClick={handleOpenAddMenu}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu Baru Sekarang</span>
                </button>
                {menuList.length === 0 && (
                  <button
                    id="btn-empty-load-template-menu"
                    onClick={handleResetMenu}
                    disabled={isResetting}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Muat Contoh Menu Template</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 2: TEMPAT & OPERASIONAL KAFE ================= */}
      {activeSubTab === 'tables_ops' && (
        <div className="space-y-6">
          {/* Card: Sakelar Pre-Order Pintar & Jam Buka/Tutup */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Sakelar Utama Pre-Order Pintar */}
            <div className={`rounded-3xl p-6 border transition-all ${
              settings.isPreOrderEnabled 
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs' 
                : 'bg-red-50/70 border-red-300 text-red-950 shadow-xs'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    Sistem Kontrol Utama
                  </span>
                  <h3 className="text-lg font-extrabold flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-amber-700" />
                    <span>Sistem Pre-Order Pintar</span>
                  </h3>
                </div>

                {/* Big Toggle */}
                <button
                  id="btn-toggle-preorder-system"
                  onClick={() => handleSaveOperationalSettings(!settings.isPreOrderEnabled)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.isPreOrderEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.isPreOrderEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 text-xs leading-relaxed">
                {settings.isPreOrderEnabled ? (
                  <p className="text-emerald-900 font-medium">
                    ✓ <strong>Sistem Aktif:</strong> Pelanggan dapat memesan dari HP, mengatur estimasi menit kedatangan, membayar via QRIS, dan menekan tombol "Saya Sudah Sampai".
                  </p>
                ) : (
                  <p className="text-red-900 font-medium">
                    ⚠️ <strong>Sistem Dinonaktifkan:</strong> Pelanggan yang membuka halaman Pre-Order akan melihat pengumuman bahwa pre-order sementara ditutup oleh kasir/manajemen.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 text-xs">
                <span className="text-stone-500 block mb-1 font-semibold">Pesan Pengumuman untuk Pelanggan:</span>
                <input
                  type="text"
                  value={preOrderNoticeInput}
                  onChange={e => setPreOrderNoticeInput(e.target.value)}
                  placeholder="Misal: Pre-order ditutup sementara saat jam sibuk..."
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Jam Operasional Buka & Tutup */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-700" />
                    <span>Jam Operasional {settings.cafeName}</span>
                  </h3>
                  <p className="text-xs text-stone-500">Atur batas waktu operasional layanan meja & pre-order harian</p>
                </div>

                <button
                  id="btn-save-ops-hours"
                  disabled={isSavingSettings}
                  onClick={() => handleSaveOperationalSettings()}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <label className="block text-xs font-extrabold text-stone-700">Jam Buka Kafe (WIB)</label>
                  <input
                    type="time"
                    value={openTimeInput}
                    onChange={e => setOpenTimeInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-stone-500 block">Dapur mulai menerima pesanan pagi</span>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <label className="block text-xs font-extrabold text-stone-700">Jam Tutup Kafe (WIB)</label>
                  <input
                    type="time"
                    value={closeTimeInput}
                    onChange={e => setCloseTimeInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-stone-500 block">Last order pre-order otomatis ditutup</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Pengaturan jam operasional dan status pre-order langsung tersinkronisasi ke antarmuka pelanggan dan tablet kasir POS secara real-time.</span>
              </div>
            </div>
          </div>

          {/* CARD: PENGATURAN IDENTITAS TOKO & SUARA NOTIFIKASI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 1. Pengaturan Identitas Toko */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base flex items-center space-x-2">
                    <Store className="w-5 h-5 text-amber-700" />
                    <span>Pengaturan Identitas Toko</span>
                  </h3>
                  <p className="text-xs text-stone-500">Nama, alamat, dan kontak untuk header aplikasi serta struk kasir</p>
                </div>
                <button
                  id="btn-save-identity"
                  disabled={isSavingSettings}
                  onClick={() => handleSaveOperationalSettings()}
                  className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Identitas'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nama Kafe / Restoran</span>
                  </label>
                  <input
                    id="input-settings-cafe-name"
                    type="text"
                    value={cafeNameInput}
                    onChange={e => setCafeNameInput(e.target.value)}
                    placeholder="Contoh: KafeKu Senopati"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>Alamat Lengkap</span>
                  </label>
                  <input
                    id="input-settings-location"
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="Jl. Senopati No. 45, Jakarta Selatan"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nomor Telepon / WhatsApp Kafe</span>
                  </label>
                  <input
                    id="input-settings-phone"
                    type="text"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="0812-8888-9999"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-stone-800"
                  />
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                  💡 Identitas ini otomatis tercetak pada bagian kop kertas struk thermal dan kop navigasi seluruh aplikasi.
                </div>
              </div>
            </div>

            {/* 2. Pengaturan Suara Notifikasi */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-amber-700" />
                    <span>Pengaturan Suara Notifikasi</span>
                  </h3>
                  <p className="text-xs text-stone-500">Pilih jenis audio chime saat ada pesanan baru masuk ke Kasir dan KDS</p>
                </div>
              </div>

              {/* 4 Sound variations */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'ting_klasik' as NotificationSound,
                    title: 'Ting! Klasik',
                    desc: 'Suara lonceng bel kafe standar (two-tone dining chime)',
                    badge: 'Standar Kafe'
                  },
                  {
                    id: 'dering_ceria' as NotificationSound,
                    title: 'Dering Ceria',
                    desc: 'Melodi santai 3 nada naik (arpeggio jazz lofi)',
                    badge: 'Santai'
                  },
                  {
                    id: 'retro_game' as NotificationSound,
                    title: 'Retro Game',
                    desc: 'Efek sound pixel 8-bit energik yang seru & jelas terdengar',
                    badge: '8-Bit Arcade'
                  },
                  {
                    id: 'kasir_digital' as NotificationSound,
                    title: 'Suara Kasir Digital',
                    desc: 'Dua kali bip register POS modern profesional',
                    badge: 'Modern POS'
                  }
                ].map((s) => {
                  const isSelected = notificationSoundInput === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setNotificationSoundInput(s.id);
                        handleSaveOperationalSettings(undefined, s.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="notification_sound_choice"
                          checked={isSelected}
                          onChange={() => {
                            setNotificationSoundInput(s.id);
                            handleSaveOperationalSettings(undefined, s.id);
                          }}
                          className="mt-1 h-4 w-4 text-amber-700 border-stone-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs text-stone-900">{s.title}</span>
                            <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                              {s.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{s.desc}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSound(s.id);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 rounded-xl text-stone-700 text-xs font-bold transition-all border border-stone-200"
                        title="Dengarkan Contoh Suara"
                      >
                        <Play className="w-3 h-3 fill-current text-amber-700" />
                        <span>Tes Suara</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span>Profil suara terpilih: <strong className="text-stone-900">{notificationSoundInput}</strong></span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Tersimpan Otomatis
                </span>
              </div>
            </div>
          </div>

          {/* DENAH & MANAJEMEN MEJA (Meja 1 sampai Meja 10+) */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base flex items-center space-x-2">
                  <LayoutGrid className="w-5 h-5 text-amber-700" />
                  <span>Denah Meja & Tempat Duduk ({settings.tables.length} Meja)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Ubah status meja (Tersedia, Terisi, Ditutup) untuk mengontrol alur pelanggan makan di tempat.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Stats */}
                <div className="hidden md:flex items-center space-x-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    {settings.tables.filter(t => t.status === 'tersedia').length} Tersedia
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                    {settings.tables.filter(t => t.status === 'terisi').length} Terisi
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-800">
                    {settings.tables.filter(t => t.status === 'ditutup').length} Ditutup
                  </span>
                </div>

                <button
                  id="btn-add-table"
                  onClick={() => setShowTableModal(true)}
                  className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Meja</span>
                </button>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {settings.tables.map(table => {
                const isAvailable = table.status === 'tersedia';
                const isOccupied = table.status === 'terisi';
                const isClosed = table.status === 'ditutup';

                return (
                  <div
                    key={table.id}
                    id={`admin-table-${table.id}`}
                    className={`rounded-2xl border p-3.5 space-y-3 transition-all flex flex-col justify-between ${
                      isAvailable
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : isOccupied
                        ? 'bg-blue-50/50 border-blue-300'
                        : 'bg-stone-100 border-stone-300 opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-stone-900 font-mono">
                          {table.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isAvailable
                            ? 'bg-emerald-600 text-white'
                            : isOccupied
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-600 text-white'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Kapasitas: <strong>{table.capacity} Kursi</strong>
                      </div>
                      {table.assignedOrder && (
                        <div className="text-[10px] text-blue-700 font-mono font-bold truncate">
                          Order: {table.assignedOrder}
                        </div>
                      )}
                    </div>

                    {/* Fast Status Selector */}
                    <div className="space-y-1.5 pt-2 border-t border-stone-200/80">
                      <label className="block text-[10px] text-stone-500 font-semibold">Ubah Status:</label>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                        <button
                          onClick={() => handleUpdateTableStatus(table.id, 'tersedia')}
                          className={`py-1 rounded-md transition-colors ${
                            isAvailable ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-emerald-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          Buka
                        </button>
                        <button
                          onClick={() => handleUpdateTableStatus(table.id, 'terisi')}
                          className={`py-1 rounded-md transition-colors ${
                            isOccupied ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          Terisi
                        </button>
                        <button
                          onClick={() => handleUpdateTableStatus(table.id, 'ditutup')}
                          className={`py-1 rounded-md transition-colors ${
                            isClosed ? 'bg-stone-700 text-white' : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                          }`}
                        >
                          Tutup
                        </button>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          id={`btn-delete-table-${table.id}`}
                          onClick={() => handleDeleteTable(table.id, table.name)}
                          className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer hover:underline"
                        >
                          Hapus Meja
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: MANAJEMEN KARYAWAN & HAK AKSES ================= */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          {/* Policy Info Card */}
          <div className="bg-stone-900 rounded-3xl p-6 text-white border border-stone-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sistem Hak Akses Karyawan (RBAC)</span>
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  Pengaturan Akun & Pembatasan Layar
                </h3>
              </div>

              <button
                id="btn-add-staff"
                onClick={() => setShowStaffModal(true)}
                className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Karyawan</span>
              </button>
            </div>

            {/* Quick RBAC Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 space-y-2">
                <div className="flex items-center space-x-2 text-blue-400 font-bold">
                  <Tablet className="w-4 h-4" />
                  <span>Role: Kasir POS</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  <strong>Hak Akses Khusus:</strong> Hanya dapat mengakses halaman Kasir POS, mencatat pesanan tunai meja, input suara lisan, dan mencetak struk thermal.
                </p>
              </div>

              <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 space-y-2">
                <div className="flex items-center space-x-2 text-red-400 font-bold">
                  <ChefHat className="w-4 h-4" />
                  <span>Role: Koki Dapur</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  <strong>Hak Akses Khusus:</strong> Hanya dapat mengakses layar Dapur (KDS), memantau antrean pesanan panas/es, alarm suara TTS, dan menandai status pesanan.
                </p>
              </div>

              <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Role: Owner / Admin</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  <strong>Akses Penuh:</strong> Dapat membuka seluruh modul (Pelanggan, Kasir, Dapur, Gudang Stok, Laporan Keuangan, dan Pengaturan Admin).
                </p>
              </div>
            </div>
          </div>

          {/* Test Access Switcher Widget */}
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-700" />
                <h4 className="font-extrabold text-stone-900 text-sm">
                  Simulator Login Karyawan (Coba Hak Akses Langsung)
                </h4>
              </div>
              <span className="text-[11px] text-amber-900 font-medium">
                Klik salah satu profil di bawah untuk menguji pembatasan hak akses:
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => onSwitchStaffUser(null)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  !currentStaffUser || currentStaffUser.role === 'admin'
                    ? 'bg-stone-900 text-white shadow-sm ring-2 ring-amber-500'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Utama (Akses Semua)</span>
              </button>

              {staffList.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => onSwitchStaffUser(staff)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentStaffUser?.id === staff.id
                      ? 'bg-amber-600 text-white shadow-sm ring-2 ring-stone-900'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {staff.role === 'kasir' ? (
                    <Tablet className="w-3.5 h-3.5 text-blue-600" />
                  ) : staff.role === 'koki' ? (
                    <ChefHat className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{staff.name} ({staff.role.toUpperCase()})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Staff List Table */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <h4 className="font-extrabold text-stone-900 text-sm">
                Daftar Akun Karyawan Terdaftar ({staffList.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Karyawan</th>
                    <th className="py-3 px-4">Role & Akses</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">PIN Akses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {staffList.map(staff => (
                    <tr key={staff.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {staff.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          staff.role === 'kasir'
                            ? 'bg-blue-100 text-blue-800'
                            : staff.role === 'koki'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {staff.role === 'kasir' && <Tablet className="w-3 h-3 mr-0.5" />}
                          {staff.role === 'koki' && <ChefHat className="w-3 h-3 mr-0.5" />}
                          {staff.role === 'admin' && <Shield className="w-3 h-3 mr-0.5" />}
                          <span>{staff.role === 'kasir' ? 'Kasir (POS Only)' : staff.role === 'koki' ? 'Koki (KDS Only)' : 'Admin'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        @{staff.username}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-bold">
                          {staff.pin}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {staff.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {staff.role !== 'admin' && (
                          <button
                            id={`btn-delete-staff-${staff.id}`}
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: LAPORAN KEUANGAN RINGKAS & MENU TERLARIS ================= */}
      {activeSubTab === 'financial_summary' && (
        <div className="space-y-6">
          {/* Quick Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-amber-700" />
                <span>Laporan Keuangan & Analisis Penjualan Menu Terlaris</span>
              </h3>
              <p className="text-xs text-stone-500">
                Data real-time akumulasi transaksi hari ini berdasarkan pesanan pelanggan dan kasir
              </p>
            </div>

            <button
              onClick={fetchTopSelling}
              disabled={isLoadingTopSelling}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTopSelling ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Pendapatan</span>
              <div className="text-2xl font-extrabold text-stone-900 font-mono">
                {formatRupiah(report.totalRevenue)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{report.totalOrders} Transaksi Sukses</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Pembayaran QRIS</span>
              <div className="text-2xl font-extrabold text-blue-900 font-mono">
                {formatRupiah(report.qrisRevenue)}
              </div>
              <span className="text-[11px] text-stone-500 block">Pre-Order & Non-Tunai</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Pembayaran Tunai (Cash)</span>
              <div className="text-2xl font-extrabold text-emerald-900 font-mono">
                {formatRupiah(report.cashRevenue)}
              </div>
              <span className="text-[11px] text-stone-500 block">Kasir Manual POS</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Proteksi Anti No-Show</span>
              <div className="text-2xl font-extrabold text-amber-900 font-mono">
                {formatRupiah(report.noShowProtectedRevenue)}
              </div>
              <span className="text-[11px] text-amber-800 font-semibold block">{report.noShowCount} Pelanggan Tidak Hadir (Dana Aman)</span>
            </div>
          </div>

          {/* GRAFIK & PERFORMA PENJUALAN MENU TERLARIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Top Selling Ranked List with Progress Bars (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm">Peringkat Menu Paling Laris</h4>
                    <p className="text-[11px] text-stone-500">Berdasarkan total porsi/gelas yang terjual hari ini</p>
                  </div>
                </div>
              </div>

              {topSellingData ? (
                <div className="space-y-4">
                  {(() => {
                    const maxSold = Math.max(...topSellingData.items.map(i => i.quantitySold), 1);
                    return topSellingData.items.map((item, idx) => {
                      const percentage = Math.round((item.quantitySold / maxSold) * 100);
                      const isTop1 = idx === 0 && item.quantitySold > 0;

                      return (
                        <div key={item.menuItemId} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 font-bold text-stone-900">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                idx === 0 ? 'bg-amber-500 text-white font-extrabold' :
                                idx === 1 ? 'bg-stone-300 text-stone-800 font-bold' :
                                idx === 2 ? 'bg-amber-700/60 text-white font-bold' :
                                'bg-stone-100 text-stone-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span>{item.name}</span>
                              {isTop1 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                  ★ Terfavorit
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-extrabold text-stone-900">
                                {item.quantitySold} terjual
                              </span>
                              <span className="text-stone-400 font-mono text-[11px] ml-2">
                                ({formatRupiah(item.totalRevenue)})
                              </span>
                            </div>
                          </div>

                          {/* Graphical Visual Bar */}
                          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTop1 ? 'bg-amber-600' : 'bg-stone-800'
                              }`}
                              style={{ width: `${Math.max(percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-stone-400">
                  Memuat data performa menu terlaris...
                </div>
              )}
            </div>

            {/* Category Breakdown & Insights (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <h4 className="font-extrabold text-stone-900 text-sm">
                  Distribusi Kategori Penjualan
                </h4>

                {topSellingData?.categoryStats ? (
                  <div className="space-y-3 text-xs">
                    {[
                      { key: 'kopi', label: '☕ Kategori Kopi', color: 'bg-amber-600' },
                      { key: 'non-kopi', label: '🍵 Kategori Non-Kopi', color: 'bg-emerald-600' },
                      { key: 'makanan', label: '🍛 Kategori Makanan', color: 'bg-red-600' },
                      { key: 'snack', label: '🥐 Kategori Snack & Pastry', color: 'bg-stone-600' },
                    ].map(cat => {
                      const stat = topSellingData.categoryStats[cat.key] || { count: 0, revenue: 0 };
                      return (
                        <div key={cat.key} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-stone-900">{cat.label}</div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {stat.count} porsi terjual
                            </div>
                          </div>
                          <div className="text-right font-mono font-bold text-amber-900">
                            {formatRupiah(stat.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Business Insight Tip */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span>Rekomendasi Manajemen KafeKu:</span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  Menu sensitif es seperti <strong>Es Kopi Susu Gula Aren</strong> menjadi kontributor volume terbesar. Penggunaan fitur <em>"Saya Sudah Sampai"</em> berhasil mencegah komplain es mencair hingga 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 5: DATABASE SUPABASE ================= */}
      {activeSubTab === 'supabase_db' && (
        <div className="space-y-6">
          {/* Supabase Status Banner */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Koneksi Supabase Cloud Database</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                  <span>Supabase PostgreSQL Integration</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                    Aktif & Terhubung
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Aplikasi KafeKu terhubung langsung ke project Supabase Anda. Semua perubahan menu, pesanan pelanggan, stok bahan baku, denah meja, dan akun karyawan dapat disimpan secara permanen di cloud PostgreSQL.
                </p>

                {/* Connection Credentials Badge */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <div className="flex items-center space-x-2 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700 font-mono">
                    <span className="text-stone-400">URL:</span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {supabaseStatus?.url || 'https://yuyrqhqngjfikkhfwern.supabase.co'}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      className="text-stone-400 hover:text-white p-1 rounded-md transition-colors"
                      title="Salin URL"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700 font-mono text-[11px]">
                    <span className="text-stone-400">Key:</span>
                    <span className="text-stone-300">eyJhbGciOiJIUz...4cHf5FmGQ48</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-700 text-stone-300 text-[10px] font-semibold">anon public</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Banner */}
              <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => fetchSupabaseStatus(true)}
                  disabled={isLoadingSupabase}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupabase ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isLoadingSupabase ? 'Memeriksa...' : 'Cek Status Tabel'}</span>
                </button>

                <button
                  onClick={handleSeedSupabase}
                  disabled={isSeedingSupabase}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeedingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSeedingSupabase ? 'Menyinkronkan...' : 'Sinkronkan / Seed Data Awal'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/yuyrqhqngjfikkhfwern/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buka Supabase SQL Editor</span>
                </a>
              </div>
            </div>
          </div>

          {/* Feedback message banner if any */}
          {seedMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 ${
              seedMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <div className="flex items-center space-x-2">
                {seedMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{seedMessage.text}</span>
              </div>
              <button
                onClick={() => setSeedMessage(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Table Readiness Status Grid */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Status Tabel Database KafeKu</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Berikut adalah status ketersediaan tabel di project Supabase <span className="font-mono font-bold text-stone-700">yuyrqhqngjfikkhfwern</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-500 font-medium">Status Keseluruhan:</span>
                {supabaseStatus?.allReady ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Semua Tabel Siap</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Menunggu Eksekusi SQL di Supabase</span>
                  </span>
                )}
              </div>
            </div>

            {/* Table Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. menu */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">public.menu</span>
                  {supabaseStatus?.tables?.menu ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Terhubung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Perlu SQL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Menyimpan katalog menu makanan & kopi, harga, foto, kategori, dan resep bahan.
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  Data Lokal: {menuList.length} menu
                </div>
              </div>

              {/* 2. inventory */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">public.inventory</span>
                  {supabaseStatus?.tables?.inventory ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Terhubung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Perlu SQL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Menyimpan stok bahan baku kopi (biji kopi, susu segar, sirup, cup takeaway).
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  Pengurangan stok real-time saat pesanan dibuat
                </div>
              </div>

              {/* 3. orders */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">public.orders</span>
                  {supabaseStatus?.tables?.orders ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Terhubung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Perlu SQL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Seluruh transaksi pre-order, QRIS, kasir POS tunai, status dapur & takeaway.
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  Sinkronisasi live dengan layar dapur (KDS)
                </div>
              </div>

              {/* 4. cafe_settings */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">public.cafe_settings</span>
                  {supabaseStatus?.tables?.cafe_settings ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Terhubung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Perlu SQL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Konfigurasi nama kafe, jam operasional buka/tutup, suara bel, dan daftar meja.
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  {settings.tables.length} meja kafe terdaftar
                </div>
              </div>

              {/* 5. staff */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">public.staff</span>
                  {supabaseStatus?.tables?.staff ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Terhubung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Perlu SQL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Akun staf kasir, koki dapur, owner, dan hak akses PIN operasional.
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  {staffList.length} akun staf terdaftar
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide: 3 Easy Steps */}
          <div className="bg-stone-900 rounded-3xl p-6 sm:p-7 text-white space-y-4 border border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white text-xs">
                  SQL
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Panduan Membuat Tabel di Supabase (1 Kali Saja)</h3>
                  <p className="text-xs text-stone-400">Jalankan script di bawah ini pada SQL Editor Supabase</p>
                </div>
              </div>

              <button
                onClick={handleCopySql}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Script SQL</span>
                  </>
                )}
              </button>
            </div>

            {/* Steps List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/80 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center">1</span>
                  <span className="font-bold text-stone-200">Salin Script SQL</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Klik tombol <strong>"Salin Script SQL"</strong> di pojok kanan atas atau di bawah. Script sudah mencakup tabel Menu, Stok, Pesanan, Settings, dan Staff.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/80 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center">2</span>
                  <span className="font-bold text-stone-200">Buka SQL Editor Supabase</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Buka tab baru: <a href="https://supabase.com/dashboard/project/yuyrqhqngjfikkhfwern/sql/new" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">supabase.com/.../sql/new</a> lalu tempel (Paste) script dan klik <strong>RUN</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/80 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center">3</span>
                  <span className="font-bold text-stone-200">Klik "Sinkronkan Data Awal"</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Setelah tabel dibuat, klik tombol <strong>"Sinkronkan / Seed Data Awal"</strong> di atas. Seluruh data KafeKu langsung terisi ke database Supabase Anda!
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative pt-2">
              <div className="flex items-center justify-between bg-stone-950 px-4 py-2 rounded-t-2xl border-x border-t border-stone-800 text-[11px] text-stone-400">
                <span className="font-mono text-emerald-400">supabase-schema.sql</span>
                <button
                  onClick={handleCopySql}
                  className="hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSql ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
              <pre className="p-4 bg-stone-950/90 rounded-b-2xl border border-stone-800 text-stone-300 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                <code>{supabaseStatus?.schemaSql || `-- Script SQL Schema KafeKu Supabase
CREATE TABLE IF NOT EXISTS public.menu ( ... );
CREATE TABLE IF NOT EXISTS public.inventory ( ... );
CREATE TABLE IF NOT EXISTS public.orders ( ... );
CREATE TABLE IF NOT EXISTS public.cafe_settings ( ... );
CREATE TABLE IF NOT EXISTS public.staff ( ... );`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT MENU ================= */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-700" />
                <span>{editingMenuItem ? 'Edit Menu KafeKu' : 'Tambah Menu Baru'}</span>
              </h3>
              <button 
                onClick={() => setShowMenuModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              {/* Nama Menu */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Caramel Macchiato Iced"
                  value={menuFormName}
                  onChange={e => setMenuFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              {/* Kategori & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Kategori *</label>
                  <select
                    value={menuFormCategory}
                    onChange={e => setMenuFormCategory(e.target.value as MenuCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
                  >
                    <option value="kopi">☕ Kopi</option>
                    <option value="non-kopi">🍵 Non-Kopi</option>
                    <option value="makanan">🍛 Makanan</option>
                    <option value="snack">🥐 Snack & Pastry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Harga (Rupiah) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={menuFormPrice}
                    onChange={e => setMenuFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Deskripsi Menu *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jelaskan cita rasa, bahan racikan, atau keunikan menu..."
                  value={menuFormDesc}
                  onChange={e => setMenuFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Stok Awal */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">Status Stok Menu</span>
                  <span className="text-[11px] text-stone-500">Tentukan apakah menu ini langsung bisa dipesan pelanggan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setMenuFormAvailable(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                      menuFormAvailable ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                    }`}
                  >
                    Tersedia
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuFormAvailable(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                      !menuFormAvailable ? 'bg-red-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                    }`}
                  >
                    Habis
                  </button>
                </div>
              </div>

              {/* Sensitivitas Suhu */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Sensitif Suhu (Tahan di Dapur hingga Kedatangan)</span>
                  <input
                    type="checkbox"
                    checked={menuFormSensitive}
                    onChange={e => setMenuFormSensitive(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                </div>
                {menuFormSensitive && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] text-stone-600 font-semibold">Alasan Sensitivitas Suhu:</label>
                    <input
                      type="text"
                      placeholder="Misal: Es cepat mencair jika didiamkan >7 menit"
                      value={menuFormSensitiveReason}
                      onChange={e => setMenuFormSensitiveReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Foto / Gambar Menu (Bisa Unggah Langsung Tanpa URL) */}
              <div className="space-y-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-stone-900 flex items-center space-x-1.5 text-xs">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Foto / Gambar Menu</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Bisa Tanpa URL</span>
                  </span>
                </div>

                {/* Hidden input file for picking from device/camera */}
                <input
                  ref={fileInputRef}
                  id="menu-form-file-picker"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileSelect}
                />

                {/* Pratinjau atau Tombol Unggah File */}
                {menuFormImage ? (
                  <div className="bg-white rounded-2xl p-3 border border-stone-200 flex items-center space-x-3 shadow-xs">
                    <img
                      src={menuFormImage}
                      alt="Pratinjau Menu"
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-700 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Foto Berhasil Terpasang</span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {menuFormImage.startsWith('data:') ? 'Foto dari perangkat Anda (tersimpan lokal)' : 'Foto estetik pilihan'}
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          id="btn-change-menu-image"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCompressingImage}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Ganti Foto</span>
                        </button>
                        <button
                          type="button"
                          id="btn-remove-menu-image"
                          onClick={() => setMenuFormImage('')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold border border-red-200 flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Foto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-upload-menu-image-card"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingImage}
                    className="w-full border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-50 rounded-2xl p-4 text-center transition-all cursor-pointer group flex flex-col items-center justify-center space-y-1.5 active:scale-[0.99]"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-colors shadow-2xs">
                      {isCompressingImage ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div className="font-extrabold text-stone-900 text-xs">
                      {isCompressingImage ? 'Sedang memproses gambar...' : 'Klik untuk Unggah Foto dari HP / Komputer'}
                    </div>
                    <p className="text-[11px] text-stone-500 max-w-sm">
                      Bisa langsung ambil dari Galeri atau Kamera. Foto otomatis dikompres ringan tanpa perlu mencari link URL.
                    </p>
                  </button>
                )}

                {/* Galeri Cepat Foto Estetik Sesuai Kategori */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-700 font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Atau pilih cepat foto estetik ({menuFormCategory}):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MENU_IMAGE_PRESETS[menuFormCategory]?.map((preset, idx) => {
                      const isSelected = menuFormImage === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMenuFormImage(preset.url)}
                          className={`p-1.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/50 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50 shadow-2xs'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 bg-stone-100"
                          />
                          <span className="text-[10px] font-bold text-stone-800 truncate leading-tight">
                            {preset.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accordion: Opsi Lanjutan Input URL */}
                <div className="pt-1 border-t border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{showUrlInput ? '▼ Sembunyikan input URL eksternal' : '▶ Atau masukkan URL eksternal secara manual (opsional)'}</span>
                  </button>
                  {showUrlInput && (
                    <div className="pt-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={menuFormImage.startsWith('data:') ? '' : menuFormImage}
                        onChange={e => setMenuFormImage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 gap-2">
                {editingMenuItem ? (
                  <button
                    type="button"
                    id="btn-delete-menu-from-modal"
                    onClick={() => {
                      const itemToDelete = editingMenuItem;
                      setShowMenuModal(false);
                      handleDeleteMenu(itemToDelete.id, itemToDelete.name);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-extrabold text-xs border border-red-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Hapus Menu Ini</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowMenuModal(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-menu-modal"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    {editingMenuItem ? 'Simpan Perubahan' : 'Tambah Menu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH MEJA ================= */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4 text-amber-700" />
                <span>Tambah Meja Baru Kafe</span>
              </h3>
              <button 
                onClick={() => setShowTableModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama / Nomor Meja</label>
                <input
                  type="text"
                  placeholder="Misal: Meja 11, Meja Outdoor 01"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Kapasitas Kursi</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={e => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs"
                >
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH KARYAWAN ================= */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-700" />
                <span>Buat Akun Karyawan & Hak Akses</span>
              </h3>
              <button 
                onClick={() => setShowStaffModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dimas Saputra"
                  value={staffFormName}
                  onChange={e => setStaffFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Role / Hak Akses *</label>
                  <select
                    value={staffFormRole}
                    onChange={e => setStaffFormRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold bg-white"
                  >
                    <option value="kasir">Kasir (POS Only)</option>
                    <option value="koki">Koki Dapur (KDS Only)</option>
                    <option value="admin">Owner / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="dimas_kasir"
                    value={staffFormUsername}
                    onChange={e => setStaffFormUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">PIN Cepat (4 Digit) *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={staffFormPin}
                  onChange={e => setStaffFormPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                {staffFormRole === 'kasir' && 'Akun ini hanya dapat membuka halaman Kasir POS dan mencatat transaksi.'}
                {staffFormRole === 'koki' && 'Akun ini hanya dapat membuka layar Dapur (KDS) dan mengatur antrean.'}
                {staffFormRole === 'admin' && 'Akun ini memiliki izin penuh ke seluruh navigasi dan konfigurasi sistem.'}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BERSIHKAN DATA SAMPLE ================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">Bersihkan Data Sample KafeKu</h3>
                  <p className="text-xs text-stone-500">Hapus data demo/contoh agar sistem bersih untuk operasional kafe Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Master Option: Hapus SEMUA Data Sampel Sekaligus */}
              <div className="p-4 rounded-2xl border-2 border-red-500 bg-red-950 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-white flex items-center space-x-2 text-sm">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Hapus SEMUA Data Sampel Sekaligus</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white uppercase tracking-wider">
                    Total Reset
                  </span>
                </div>
                <p className="text-red-200 text-[11px] leading-relaxed">
                  Menghapus semua pesanan & antrean, mengosongkan seluruh menu sampel, mengosongkan bahan baku, dan mereset status meja kembali bersih untuk awal penggunaan kafe Anda.
                </p>
                <div className="pt-1">
                  <button
                    id="btn-admin-clear-all-samples"
                    onClick={handleClearAllSampleData}
                    disabled={isResetting}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isResetting ? 'Sedang Membersihkan Total...' : 'Bersihkan Semua Data Sample Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Option 1: Hapus Semua Pesanan Sample */}
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-stone-900 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>1. Hapus Semua Pesanan Sampel (Direkomendasikan)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                    Reset Transaksi
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Menghapus semua antrean di layar <strong>Dapur (KDS)</strong>, riwayat transaksi di <strong>Kasir (POS)</strong>, mereset omzet ke <strong>Rp 0</strong>, dan mengosongkan status seluruh meja kembali menjadi <em>Tersedia</em>.
                </p>
                <div className="pt-1">
                  <button
                    onClick={async () => {
                      await handleClearOrders();
                      setShowResetModal(false);
                    }}
                    disabled={isResetting}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isResetting ? 'Sedang Menghapus...' : 'Hapus Semua Pesanan Sampel Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Kelola Menu */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-stone-900 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>2. Kelola Katalog Menu Makanan & Minuman</span>
                  </div>
                  <span className="text-stone-500 font-mono text-[11px]">{menuList.length} menu aktif</span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Kosongkan menu jika Anda ingin mendaftarkan menu kafe Anda sendiri dari nol, atau muat ulang menu template standar.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={async () => {
                      await handleClearMenu();
                      setShowResetModal(false);
                    }}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Kosongkan Menu ({menuList.length})
                  </button>
                  <button
                    onClick={async () => {
                      await handleResetMenu();
                      setShowResetModal(false);
                    }}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-stone-800 text-white hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Muat Ulang Menu Template
                  </button>
                </div>
              </div>

              {/* Option 3: Kelola Bahan Baku */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-stone-900 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>3. Kelola Bahan Baku & Inventori</span>
                  </div>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Kosongkan atau muat ulang daftar bahan baku default (biji kopi, susu, sirup aren, cup takeaway).
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={async () => {
                      await handleClearInventory();
                      setShowResetModal(false);
                    }}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Kosongkan Bahan Baku
                  </button>
                  <button
                    onClick={async () => {
                      await handleResetInventory();
                      setShowResetModal(false);
                    }}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-stone-800 text-white hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Muat Ulang Bahan Baku Template
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS (MENU / MEJA / KARYAWAN) ================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-stone-900">
                {deleteConfirmation.type === 'menu' && 'Hapus Menu Dari Katalog?'}
                {deleteConfirmation.type === 'table' && 'Hapus Meja Dari Denah?'}
                {deleteConfirmation.type === 'staff' && 'Hapus Akun Karyawan?'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-stone-950 font-black">"{deleteConfirmation.name}"</strong>? Item ini akan dihapus secara permanen dari sistem kafe.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeletingItem}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-action"
                onClick={handleExecuteDelete}
                disabled={isDeletingItem}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingItem ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
