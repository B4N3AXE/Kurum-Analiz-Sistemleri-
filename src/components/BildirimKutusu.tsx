import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Award, 
  AlertCircle, 
  Info, 
  Calendar, 
  ArrowRight, 
  Clock, 
  Filter, 
  X, 
  ChevronRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'sinav' | 'odev' | 'calisma' | 'duyuru' | 'risk';
  time: string;
  read: boolean;
  linkTab?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface BildirimKutusuProps {
  user: {
    id: number;
    ad_soyad: string;
    rol: string;
    kurum_adi?: string;
    kurum_id?: number;
  };
  onNavigate?: (tab: string) => void;
}

export default function BildirimKutusu({ user, onNavigate }: BildirimKutusuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'sinav' | 'odev' | 'duyuru'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);

  // Fetch real unread messages from backend
  useEffect(() => {
    const fetchMessages = () => {
      const token = localStorage.getItem('kas_token');
      if (!token) return;

      fetch(`/api/mesaj?user_id=${user.id}&rol=${user.rol}&_t=${Date.now()}`, {
        headers: { 'Authorization': token }
      })
      .then(res => res.ok ? res.json() : [])
      .then((messages: any[]) => { console.log("FETCHED MESSAGES:", messages);
        const unreadMsgs = messages.filter(m => Number(m.alici_id) === Number(user.id) && !m.okundu);
        const converted: NotificationItem[] = unreadMsgs.map(m => ({
          id: `msg_${m.id}`,
          title: `Yeni Mesaj: ${m.konu || 'Bilgilendirme'}`,
          message: `${m.gonderen_adi || 'Bilinmeyen'}: ${m.mesaj}`,
          type: 'duyuru',
          time: new Date(m.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          linkTab: 'mesaj',
          priority: 'high'
        }));
        setDbNotifications(converted);
      })
      .catch(console.error);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Every 15 seconds
    return () => clearInterval(interval);
  }, [user.id, user.rol]);

  // Generate role-specific initial notifications
  useEffect(() => {
    const storageKey = `kas_notifications_user_${user.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear dummy data
        if (!parsed.some(p => p.id === 'n1' || p.id === 'n1_admin')) {
            setNotifications(parsed);
        } else {
            setNotifications([]);
            localStorage.removeItem(storageKey);
        }
        return;
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }

    // Default notifications generated per role
    let defaultList: NotificationItem[] = [];

    if (false && user.rol === 'ogrenci') { // Dummy notifications disabled for live
      defaultList = [
        {
          id: 'n1',
          title: '3D Türkiye Geneli TYT Deneme Sonucu Açıklandı',
          message: 'Son denemede Toplam 34.25 Net yaptın. Matematik ve Türkçe netlerinde belirgin bir yükseliş var! 🚀',
          type: 'sinav',
          time: '10 dakika önce',
          read: false,
          linkTab: 'ogrenci-panel',
          priority: 'high'
        },
        {
          id: 'n2',
          title: 'Yeni Haftalık Çalışma Görevi',
          message: 'Matematik öğretmeniniz "Fonksiyonlar ve Analitik Geometri - 150 Soru" ödevini tanımladı.',
          type: 'odev',
          time: '1 saat önce',
          read: false,
          linkTab: 'ogrenci-panel',
          priority: 'medium'
        },
        {
          id: 'n3',
          title: 'Çalışma Seansı Tebriği! 👏',
          message: 'Bugün toplam 120 dakika Pomodoro çalışma hedefini başarıyla tamamladın.',
          type: 'calisma',
          time: '3 saat önce',
          read: true,
          linkTab: 'ogrenci-panel',
          priority: 'low'
        },
        {
          id: 'n4',
          title: 'K.A.S Akıllı Rehberlik Tavsiyesi',
          message: 'Fen Bilimleri netlerini artırmak için günlük 25 paragraf ve soru çözümü öneriliyor.',
          type: 'duyuru',
          time: 'Dün',
          read: true,
          linkTab: 'kas-ai',
          priority: 'medium'
        }
      ];
    } else if (false && user.rol === 'veli') {
      defaultList = [
        {
          id: 'n1',
          title: 'Öğrencinizin Son Deneme Karne Raporu',
          message: 'Çocuğunuzun 3D Türkiye Geneli TYT Denemesi karnesi hazırlandı. Toplam Net: 34.25 (Gelişim: +2.5 Net).',
          type: 'sinav',
          time: '15 dakika önce',
          read: false,
          linkTab: 'veli-panel',
          priority: 'high'
        },
        {
          id: 'n2',
          title: 'Evde Günlük Çalışma Bildirimi',
          message: 'Öğrenciniz bugün sistemde 120 dakika verimli Pomodoro ders çalışma seansı gerçekleştirdi.',
          type: 'calisma',
          time: '2 saat önce',
          read: false,
          linkTab: 'veli-panel',
          priority: 'medium'
        },
        {
          id: 'n3',
          title: 'Rehberlik Görüşme Notu',
          message: 'Branş öğretmenlerimiz öğrencimizin motivasyon durumunun ve çalışma disiplininin çok yüksek olduğunu belirtti.',
          type: 'duyuru',
          time: 'Dün',
          read: true,
          linkTab: 'veli-panel',
          priority: 'low'
        }
      ];
    } else if (user.rol === 'ogretmen' || user.rol === 'rehber') {
      defaultList = [
        {
          id: 'n1',
          title: 'Başarı Risk Grubu Uyarısı ⚠️',
          message: 'Sınıfınızdaki 2 öğrencinin son deneme netleri hedef limitin %15 altında kaldı.',
          type: 'risk',
          time: '20 dakika önce',
          read: false,
          linkTab: 'ogrenci',
          priority: 'high'
        },
        {
          id: 'n2',
          title: 'Ödev Teslim Kontrolü',
          message: '12-A sınıfından 18 öğrenci haftalık Matematik etüt ödevini teslim etti.',
          type: 'odev',
          time: '1 saat önce',
          read: false,
          linkTab: 'ogrenci',
          priority: 'medium'
        },
        {
          id: 'n3',
          title: 'Yeni Veli Mesajı',
          message: 'Ahmet Yılmaz velisi evdeki çalışma düzeni hakkında rehberlik notu bıraktı.',
          type: 'duyuru',
          time: '4 saat önce',
          read: true,
          linkTab: 'mesaj',
          priority: 'medium'
        }
      ];
    } else if (false) { // Dummy disabled for admin
      // Admin
      defaultList = [
        {
          id: 'n1',
          title: 'Kurum Deneme Sınavı Raporu Hazır',
          message: 'Tüm sınıfların katıldığı son TYT denemesinin kurum genel başarı ve derece sıralaması oluşturuldu.',
          type: 'sinav',
          time: '10 dakika önce',
          read: false,
          linkTab: 'dashboard',
          priority: 'high'
        },
        {
          id: 'n2',
          title: 'Aktif Çalışma Odası Canlı Bildirimi',
          message: 'Şu an kurumunuzda 14 öğrenci canlı Pomodoro çalışma seansında aktif.',
          type: 'calisma',
          time: '30 dakika önce',
          read: false,
          linkTab: 'dashboard',
          priority: 'low'
        },
        {
          id: 'n3',
          title: 'K.A.S Sistem Güvenlik ve Lisans Durumu',
          message: 'Kurumsal lisansınız aktif. Tüm yedeklemeler ve Firestore veri senkronizasyonu tamamlandı.',
          type: 'duyuru',
          time: 'Dün',
          read: true,
          linkTab: 'abonelik',
          priority: 'low'
        }
      ];
    }

    setNotifications(defaultList);
    localStorage.setItem(storageKey, JSON.stringify(defaultList));
  }, [user.id, user.rol]);

  // Save changes to localStorage
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    localStorage.setItem(`kas_notifications_user_${user.id}`, JSON.stringify(items));
  };

  const allNotifications = [...dbNotifications, ...notifications];
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    
    // Attempt to mark db messages as read too
    dbNotifications.forEach(n => markAsRead(n.id));
  };

  const markAsRead = (id: string) => {
    if (id.startsWith('msg_')) {
      const msgId = id.replace('msg_', '');
      const token = localStorage.getItem('kas_token');
      if (token) {
        fetch(`/api/mesaj/${msgId}/oku`, {
          method: 'PUT',
          headers: { 'Authorization': token }
        }).catch(console.error);
        setDbNotifications(prev => prev.filter(n => n.id !== id));
      }
      return;
    }
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id.startsWith('msg_')) {
      markAsRead(id); // essentially dismissing it
      return;
    }
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.linkTab && onNavigate) {
      onNavigate(item.linkTab);
      setIsOpen(false);
    }
  };

  const filteredList = allNotifications.filter(item => {
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'sinav') return item.type === 'sinav';
    if (activeFilter === 'odev') return item.type === 'odev';
    if (activeFilter === 'duyuru') return item.type === 'duyuru' || item.type === 'calisma' || item.type === 'risk';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sinav':
        return <Award size={16} className="text-amber-400" />;
      case 'odev':
        return <BookOpen size={16} className="text-blue-400" />;
      case 'calisma':
        return <Clock size={16} className="text-emerald-400" />;
      case 'risk':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'duyuru':
      default:
        return <Sparkles size={16} className="text-indigo-400" />;
    }
  };

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sinav':
        return <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Sınav / Karne</span>;
      case 'odev':
        return <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Ödev & Görev</span>;
      case 'calisma':
        return <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Çalışma Odası</span>;
      case 'risk':
        return <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Risk Uyarısı</span>;
      case 'duyuru':
      default:
        return <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Duyuru / Sistem</span>;
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center group shadow-md"
        title="Bildirim Kutusunu Aç"
        aria-label="Bildirimler"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-blue-400 animate-pulse group-hover:scale-110 transition-transform" />
        ) : (
          <Bell size={18} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
        )}

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer Overlay & Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing dropdown */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-w-[92vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col divide-y divide-slate-800/80"
            >
              {/* Header Bar */}
              <div className="p-4 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-100 tracking-tight">Bildirim Kutusu</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-blue-600/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/30">
                          {unreadCount} Yeni
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {user.ad_soyad} • {user.rol.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-2 py-1 rounded-lg hover:bg-blue-500/10 transition flex items-center gap-1 cursor-pointer"
                      title="Tümünü Okundu İşaretle"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden sm:inline">Tümünü Okundu Say</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-3 py-2 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tümü ({notifications.length})
                </button>

                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Okunmamış ({unreadCount})
                </button>

                <button
                  onClick={() => setActiveFilter('sinav')}
                  className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'sinav'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sınavlar
                </button>

                <button
                  onClick={() => setActiveFilter('odev')}
                  className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'odev'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ödevler
                </button>

                <button
                  onClick={() => setActiveFilter('duyuru')}
                  className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'duyuru'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Duyuru & Sistem
                </button>
              </div>

              {/* Notification List Container */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 bg-slate-800/50 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold">Bildirim bulunmuyor</p>
                    <p className="text-[10px] text-slate-500">
                      Seçilen filtrede henüz kayıtlı bir bildirim yok.
                    </p>
                  </div>
                ) : (
                  filteredList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 transition flex items-start gap-3 cursor-pointer group hover:bg-slate-800/40 relative ${
                        !item.read ? 'bg-blue-950/20 border-l-2 border-l-blue-500' : ''
                      }`}
                    >
                      {/* Left Icon Badge */}
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                        !item.read 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'bg-slate-800/60 border-slate-700/50'
                      }`}>
                        {getIcon(item.type)}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {getTypeBadge(item.type)}
                            {!item.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping shrink-0" />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                            {item.time}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold leading-snug truncate ${
                          !item.read ? 'text-slate-100 font-black' : 'text-slate-300'
                        }`}>
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed line-clamp-2">
                          {item.message}
                        </p>

                        {item.linkTab && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-blue-400 group-hover:text-blue-300">
                            <span>Detayları İncele</span>
                            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>

                      {/* Delete action button */}
                      <button
                        onClick={(e) => deleteNotification(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition rounded hover:bg-slate-800 cursor-pointer shrink-0"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-950/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold px-4">
                <span>K.A.S Akıllı Bildirim Servisi</span>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate(user.rol === 'ogrenci' ? 'ogrenci-panel' : user.rol === 'veli' ? 'veli-panel' : 'dashboard');
                    setIsOpen(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Tüm Paneli Aç <ArrowRight size={11} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
