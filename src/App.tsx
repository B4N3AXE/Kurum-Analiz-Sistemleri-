import React, { useState, useEffect } from 'react';
import { User, Ogrenci } from './types';
import Dashboard from './components/Dashboard';
import OgrenciPaneli from './components/OgrenciPaneli';
import PdfOkuyucu from './components/PdfOkuyucu';
import Mesajlar from './components/Mesajlar';
import Tanimlar from './components/Tanimlar';
import Abonelik from './components/Abonelik';
import RiskLimitleri from './components/RiskLimitleri';
import { Layers, Users, Sparkles, Mail, Settings, LogOut, Award, Shield, LayoutDashboard, UserCheck, LogIn, ChevronRight, HelpCircle, AlertCircle, GraduationCap, Activity, Calendar, Clock, Check, Zap, TrendingUp, Coins, MessageSquare, BookOpen, CheckCircle, ArrowRight, Star, FileText } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regKurum, setRegKurum] = useState('Atatürk Anadolu Lisesi');
  const [regTuru, setRegTuru] = useState('Anadolu Lisesi');
  const [regError, setRegError] = useState('');

  // Parent profile lookups
  const [childReport, setChildReport] = useState<{ student: Ogrenci; sonuclar: any[]; notlar: any[]; ders_programi?: any[] } | null>(null);
  const [loadingChild, setLoadingChild] = useState(false);

  // Student profile lookups
  const [studentReport, setStudentReport] = useState<{ student: Ogrenci; sonuclar: any[]; notlar: any[]; ders_programi?: any[] } | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // SaaS Marketing & Sales states
  const [currentSubscription, setCurrentSubscription] = useState<string>(() => localStorage.getItem('kas_subscription_plan') || 'trial');
  
  // Trial calculations: Default 14 days, decreases dynamically
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    const savedStart = localStorage.getItem('kas_trial_start');
    if (!savedStart) {
      const now = new Date();
      localStorage.setItem('kas_trial_start', now.toISOString());
      return 14;
    }
    const startDate = new Date(savedStart);
    const diffTime = Math.max(0, new Date().getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const left = 14 - diffDays;
    
    // Check if there is a custom simulated trial days left (highly useful for user testing)
    const simulated = localStorage.getItem('kas_simulated_trial_days');
    if (simulated !== null) {
      return Math.max(0, parseInt(simulated, 10));
    }
    
    return left < 0 ? 0 : left;
  });

  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [studentCountSlider, setStudentCountSlider] = useState(150);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<'admin' | 'student' | 'pdf' | 'birebir'>('admin');
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'kvkk' | 'terms' | 'legal' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    // Check local storage for persistent login session
    const storedUser = localStorage.getItem('kas_user');
    const storedToken = localStorage.getItem('kas_token');
    if (storedUser && storedToken) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setToken(storedToken);
      setIsLoggedIn(true);
      if (u.rol === 'veli') {
        setCurrentTab('veli-panel');
        loadChildReportForVeli(u.id, storedToken);
      } else if (u.rol === 'ogrenci') {
        setCurrentTab('ogrenci-panel');
        loadReportForStudent(u.id - 10000, storedToken);
      } else {
        setCurrentTab('dashboard');
      }
    }
  }, []);

  const loadReportForStudent = async (studentId: number, sessionToken: string) => {
    setLoadingStudent(true);
    try {
      const resDetail = await fetch(`/api/ogrenci/${studentId}`, { headers: { 'Authorization': sessionToken } });
      if (resDetail.ok) {
        setStudentReport(await resDetail.json());
      }
    } catch (err) {
      console.error("Öğrenci bilgisi yükleme hatası:", err);
    } finally {
      setLoadingStudent(false);
    }
  };

  const loadChildReportForVeli = async (veliId: number, sessionToken: string) => {
    setLoadingChild(true);
    try {
      // Find children first
      const res = await fetch(`/api/ogrenci?kurum_id=1`, { headers: { 'Authorization': sessionToken } });
      if (res.ok) {
        const list: Ogrenci[] = await res.json();
        const child = list.find(o => o.veli_id === veliId);
        if (child) {
          const resDetail = await fetch(`/api/ogrenci/${child.id}`, { headers: { 'Authorization': sessionToken } });
          if (resDetail.ok) {
            setChildReport(await resDetail.json());
          }
        }
      }
    } catch (err) {
      console.error("Veli çocuk bilgisi yükleme hatası:", err);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, customCredentials?: { email: string; sifre: string }) => {
    if (e) e.preventDefault();
    setLoginError('');

    const targetEmail = customCredentials ? customCredentials.email : email;
    const targetSifre = customCredentials ? customCredentials.sifre : sifre;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, sifre: targetSifre })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setIsLoggedIn(true);
        localStorage.setItem('kas_user', JSON.stringify(data.user));
        localStorage.setItem('kas_token', data.token);

        if (data.user.rol === 'veli') {
          setCurrentTab('veli-panel');
          loadChildReportForVeli(data.user.id, data.token);
        } else if (data.user.rol === 'ogrenci') {
          setCurrentTab('ogrenci-panel');
          loadReportForStudent(data.user.id - 10000, data.token);
        } else {
          setCurrentTab('dashboard');
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.error || "Giriş başarısız.");
      }
    } catch (err) {
      setLoginError("Sunucu bağlantısı kurulamadı.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPassword || !regPhone || !regKurum) {
      setRegError("Lütfen gerekli tüm alanları doldurun.");
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_soyad: regName,
          email: regEmail,
          sifre: regPassword,
          telefon: regPhone,
          kurum_adi: regKurum,
          kurum_turu: regTuru
        })
      });

      if (res.ok) {
        // Automatically login with registration info
        handleLogin(null as any, { email: regEmail, sifre: regPassword });
        setIsRegistering(false);
      } else {
        const errData = await res.json();
        setRegError(errData.error || "Kayıt işlemi başarısız.");
      }
    } catch (err) {
      setRegError("Sunucu hatası.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setIsLoggedIn(false);
    localStorage.removeItem('kas_user');
    localStorage.removeItem('kas_token');
    setChildReport(null);
    setEmail('');
    setSifre('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-300">
      
      {/* HEADER BANNER - Always visible when logged in, displaying Institution Name */}
      {isLoggedIn && user && (
        <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-3.5 flex justify-between items-center z-20 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
              <img src="/favicon.svg" alt="K.A.S" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Kurum Analiz Sistemi</span>
              <h1 className="text-sm font-black text-slate-100 tracking-wide">{user.kurum_adi || "Kurum Kayıtlı Değil"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="text-right">
              <span className="text-slate-200 block font-bold">{user.ad_soyad}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user.rol}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 rounded-lg border border-slate-750 text-slate-400 transition cursor-pointer"
              title="Güvenli Çıkış"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>
      )}

      {/* Main UI body */}
      {!isLoggedIn ? (
        /* PREMIUM HIGH-CONVERTING SaaS LANDING & AUTH PAGE */
        <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
          
          {/* Left Side: Professional SaaS Marketing & Pitch Panel (Scrollable) */}
          <div className={`flex-1 ${showAuthScreen ? 'hidden' : 'flex flex-col'} lg:h-screen lg:overflow-y-auto px-6 md:px-12 lg:px-16 py-12 lg:py-20 space-y-16 scrollbar-thin bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}>
            
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-slate-900/40 pb-4 max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-blue-600/5 rounded-xl border border-slate-800 shadow-lg shadow-blue-500/5">
                  <img src="/favicon.svg" alt="K.A.S Logo" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Kişiselleştirilmiş Eğitim Yönetimi</span>
                  <h1 className="text-lg font-black text-slate-100 flex items-center gap-1.5 leading-none">
                    K.A.S <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800/80 font-semibold px-2 py-0.5 rounded-full tracking-wide">Kurumsal Portal</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-400">
                  <a href="#nasil-calisir" className="hover:text-blue-400 transition">Nasıl Çalışır?</a>
                  <a href="#ozellikler" className="hover:text-blue-400 transition">Özellikler</a>
                  <a href="#fiyatlandirma" className="hover:text-blue-400 transition">Fiyatlar</a>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setShowAuthScreen(true);
                  }}
                  className="px-3.5 py-1.5 bg-transparent border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setShowAuthScreen(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Kurum Kaydı (Ücretsiz)
                </button>
              </div>
            </div>

            {/* Inner Marketing Wrapper (Centers and boundaries the content when full-width) */}
            <div className="max-w-5xl mx-auto w-full space-y-16 flex-1">

              {/* Hero Section with 2-Column Layout */}
              <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
                {/* Hero Text Column */}
                <div className="flex-1 space-y-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/10 shadow-inner">
                    <Sparkles size={11} className="animate-pulse text-blue-400" /> %94 Zaman Tasarrufu & Akıllı Eğitim Otomasyonu
                  </span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400">
                    Eğitim Kurumları İçin <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">Akıllı Takip & Analiz</span> Portali
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold max-w-xl">
                    Sınav analizlerini, birebir ders programlarını ve veli bilgilendirmelerini tek ekrandan yönetin. Kurumunuza zaman kazandırın, veli memnuniyetini zirveye taşıyın.
                  </p>
                  
                  {/* Trust Badge Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 max-w-xl">
                    {[
                      { value: "%94", label: "Zaman Tasarrufu", desc: "Sınav girişi & planlama" },
                      { value: "3 Sn", label: "Yapay Zeka Analiz", desc: "PDF/OCR okuma hızı" },
                      { value: "50+", label: "Aktif Eğitim Kurumu", desc: "Atatürk, Limit vb." }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/30 border border-slate-900 p-3.5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
                        <span className="block text-2xl font-black text-blue-400 tracking-tight">{stat.value}</span>
                        <span className="block text-[11px] font-extrabold text-slate-200 mt-0.5">{stat.label}</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5 font-medium leading-none">{stat.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                 {/* Hero Logo Column */}
                <div className="w-full lg:w-[420px] flex justify-center items-center">
                  <div className="relative group p-1.5 bg-slate-950 rounded-[2.5rem] border border-slate-900 shadow-2xl overflow-hidden w-full max-w-sm lg:max-w-none">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                    <img 
                      src="/logo.svg" 
                      alt="Kurum Analiz Sistemleri Logo" 
                      className="w-full aspect-square object-contain rounded-[2.2rem] shadow-inner transform group-hover:scale-[1.02] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

            {/* Nasıl Çalışır? - İlk Defa Girenler İçin Hızlı Başlangıç Kılavuzu */}
            <div id="nasil-calisir" className="space-y-6 scroll-mt-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black rounded-md uppercase tracking-wider">PRESTİJLİ BAŞLANGIÇ</span>
                <h3 className="text-sm font-bold text-slate-200">K.A.S Nasıl Çalışır? (3 Adımda Tam Otomasyon)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                K.A.S Kurum Analiz ve Birebir Ders Yönetim Platformu ile dijital dönüşümünüzü tamamlamak çok kolay. Karmaşık kurulum süreçleriyle vakit kaybetmeden, sadece 3 basit adımda geleceğin eğitim teknolojisine geçiş yapın:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    step: "1",
                    title: "Saniyeler İçinde Dijitalleşin",
                    desc: "Sağ üstteki 'Kurum Kaydı' butonuyla kurumunuzu hemen kaydedin. Bürokrasiyi ve evrak işlerini sıfıra indirerek, kurumunuza özel şık ve prestijli dijital paneli saniyeler içinde yayına alın.",
                    badge: "Yönetici Kurulumu",
                    badgeColor: "text-blue-400 border-blue-500/10 bg-blue-500/5"
                  },
                  {
                    step: "2",
                    title: "Eğitim Kadronuzu Dahil Edin",
                    desc: "Öğretmen, rehber ve sınıf yapılarınızı zahmetsizce sisteme ekleyin. Eğitimcileriniz, öğrencileriniz ve velileriniz için özel, kurumsal şifreli giriş panelleri sistem tarafından otomatik üretilir.",
                    badge: "Eğitimci & Sınıf Entegrasyonu",
                    badgeColor: "text-amber-400 border-amber-500/10 bg-amber-500/5"
                  },
                  {
                    step: "3",
                    title: "Analiz ve Birebir Gücünü Keşfedin",
                    desc: "Çakışmasız 1-1 özel ders programlarını tek tıkla dağıtın. Sınav net analizlerini velilere otomatik ulaştırarak ve gelişim grafiklerini şeffafça paylaşarak veli memnuniyetinizi zirveye taşıyın.",
                    badge: "Akıllı Süreç Yönetimi",
                    badgeColor: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-900/30 border border-slate-900/80 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-44 hover:border-slate-800 transition">
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="h-6 w-6 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center">
                            {item.step}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-200">{item.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Product Preview & Live Tour Mockup Section */}
            <div id="panel-onizleme" className="space-y-6 scroll-mt-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">CANLI SİSTEM DEMOLARI</span>
                  <h3 className="text-2xl font-extrabold text-slate-100">K.A.S Panel Tasarımını Keşfedin</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xl">
                    Sistemimizin nasıl göründüğünü ve çalıştığını merak mı ediyorsunuz? Aşağıdaki interaktif sekmelere tıklayarak modüllerimizin canlı arayüz tasarımlarını inceleyin.
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Canlı Demo Modu
                </div>
              </div>

              {/* Tour Navigation Tabs */}
              <div className="flex flex-wrap gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-900">
                {[
                  { id: "admin", label: "Yönetici Paneli" },
                  { id: "student", label: "Öğrenci & Veli Ekranı" },
                  { id: "pdf", label: "PDF Sınav Okuyucu" },
                  { id: "birebir", label: "Birebir Planlama" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      previewTab === tab.id
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Browser / Mockup Container Frame */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
                
                {/* Browser window top bar */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/60"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/60"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/60"></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-850 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-500 select-none w-1/2 text-center truncate">
                    https://app.kurumanalizsistemleri.com/demo/{previewTab}-portal
                  </div>
                  <div className="w-12"></div>
                </div>

                {/* Mock Content depending on selected tab */}
                <div className="p-6 min-h-[340px] bg-slate-950/90 text-slate-200 flex flex-col justify-between">
                  {previewTab === 'admin' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">YÖNETİCİ PANELİ</span>
                          <h4 className="text-sm font-extrabold text-slate-100">Eğitim Kurumu Yönetim Merkezi</h4>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black">Admin Aktif</span>
                      </div>

                      {/* Mock Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Toplam Öğrenci", val: "148 Öğrenci", trend: "+%12 bu ay", color: "text-blue-400" },
                          { label: "Haftalık Birebir", val: "412 Atama", trend: "%98.2 katılım", color: "text-purple-400" },
                          { label: "Ortalama Sınav Başarısı", val: "%76.4 Başarı", trend: "%3.2 artış", color: "text-emerald-400" },
                          { label: "Aktif Öğretmen", val: "18 Öğretmen", trend: "%100 doluluk", color: "text-amber-400" }
                        ].map((m, idx) => (
                          <div key={idx} className="bg-slate-900/50 border border-slate-900 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold block">{m.label}</span>
                            <span className={`text-sm font-black block ${m.color}`}>{m.val}</span>
                            <span className="text-[8px] text-slate-600 block font-semibold">{m.trend}</span>
                          </div>
                        ))}
                      </div>

                      {/* Mock Table */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Son Sınav Sonuçları (TYT-1 Deneme)</span>
                        <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden text-[10px]">
                          <div className="grid grid-cols-4 bg-slate-900 px-3 py-2 text-slate-400 font-extrabold border-b border-slate-900">
                            <span>Öğrenci Adı</span>
                            <span>Sınıfı</span>
                            <span>Branş Dağılımı</span>
                            <span className="text-right">Toplam Net</span>
                          </div>
                          {[
                            { name: "Canan Demir", cls: "12-SAY", br: "Türkçe: 35D, Mat: 34D, Fen: 18D", net: "94.50" },
                            { name: "Burak Yılmaz", cls: "12-EA", br: "Türkçe: 32D, Mat: 28D, Sos: 17D", net: "82.25" },
                            { name: "Gizem Çelik", cls: "Mezun-SAY", br: "Türkçe: 38D, Mat: 36D, Fen: 19D", net: "103.75" }
                          ].map((row, idx) => (
                            <div key={idx} className="grid grid-cols-4 px-3 py-2.5 border-b border-slate-900/50 text-slate-300 font-medium hover:bg-slate-900/20">
                              <span className="font-bold text-slate-200">{row.name}</span>
                              <span className="text-slate-500">{row.cls}</span>
                              <span className="text-slate-400 truncate">{row.br}</span>
                              <span className="text-right text-blue-400 font-black">{row.net}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'student' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">ÖĞRENCİ & VELİ EKRANI</span>
                          <h4 className="text-sm font-extrabold text-slate-100">Öğrenci Gelişim Karnesi & Programı</h4>
                        </div>
                        <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black">Mobil Uyumlu</span>
                      </div>

                      {/* Mock Student Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Student Info Card */}
                        <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400">
                              AY
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-200 block">Ahmet Yılmaz</span>
                              <span className="text-[9px] text-slate-500 font-bold block">12-Sayısal • No: 1245</span>
                            </div>
                          </div>
                          
                          {/* Subject Breakdown Bars */}
                          <div className="space-y-2 pt-1">
                            {[
                              { sub: "Türkçe", net: "32.50 Net", pct: "w-[82%]", color: "bg-blue-500" },
                              { sub: "Matematik", net: "31.75 Net", pct: "w-[79%]", color: "bg-purple-500" },
                              { sub: "Fen Bilimleri", net: "14.25 Net", pct: "w-[55%]", color: "bg-emerald-500" }
                            ].map((s, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-[8px] font-bold text-slate-400">
                                  <span>{s.sub}</span>
                                  <span>{s.net}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div className={`h-full ${s.color} ${s.pct} rounded-full`}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lessons Schedule Box */}
                        <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-2.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Haftalık Birebir Programı</span>
                          <div className="space-y-2">
                            {[
                              { day: "Salı", time: "14:30", teacher: "Elif Kaya (Matematik)", topic: "Türev ve Limit Çözümü" },
                              { day: "Çarşamba", time: "16:15", teacher: "Canan Koç (Fizik)", topic: "Optik ve Dalgalar Soru Analizi" }
                            ].map((sched, idx) => (
                              <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-[9px]">
                                <div className="space-y-0.5">
                                  <span className="text-slate-200 block font-black">{sched.teacher}</span>
                                  <span className="text-slate-500 font-medium block">{sched.topic}</span>
                                </div>
                                <div className="text-right">
                                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded font-black block">{sched.day}</span>
                                  <span className="text-slate-400 block font-mono mt-0.5 font-bold">{sched.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'pdf' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">YAPAY ZEKA PDF OKUYUCU</span>
                          <h4 className="text-sm font-extrabold text-slate-100">OCR Sınav Dosyası Analiz Sihirbazı</h4>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">Otomatik Eşleştirme</span>
                      </div>

                      {/* Drag Drop Mockup */}
                      <div className="border border-dashed border-slate-800 bg-slate-900/10 rounded-2xl p-6 text-center space-y-2 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/5 border border-slate-850 flex items-center justify-center text-blue-400 animate-pulse">
                          <Sparkles size={16} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-200 block">Sınav Dosyasını Sürükleyip Bırakın</span>
                          <span className="text-[9px] text-slate-500 block">3D, Bilgi Sarmal, Özdebir PDF veya Excel listeleri desteklenir</span>
                        </div>
                      </div>

                      {/* AI Parsing log console */}
                      <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl font-mono text-[9px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <span>[OKU]</span>
                          <span>'BilgiSarmal_TYT_Deneme_1.pdf' dosyası analiz ediliyor...</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>[OKU]</span>
                          <span>Dosya yapısı belirlendi. 142 satır / veri algılandı.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>[OKU]</span>
                          <span>T.C. No ve Öğrenci ad-soyad sütunları otomatik eşleştirildi.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span>[OKU]</span>
                          <span>✓ Tamamlandı. Veriler sisteme aktarıldı, 142 veli SMS'i hazırlandı!</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'birebir' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">BİREBİR PLANLAMA MOTORU</span>
                          <h4 className="text-sm font-extrabold text-slate-100">Çakışma Kontrollü Akıllı Haftalık Planlayıcı</h4>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black">Çakışmasız Atama</span>
                      </div>

                      {/* Mock Appointment Creator Form */}
                      <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block">ÖĞRENCİ SEÇİN</span>
                            <div className="bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-slate-200 font-semibold">
                              Gizem Çelik (Mezun-SAY)
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block">ÖĞRETMEN VE BRANŞ SEÇİN</span>
                            <div className="bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-slate-200 font-semibold">
                              Murat Yalçın (Geometri)
                            </div>
                          </div>
                        </div>

                        {/* Interactive Status Indicator bar */}
                        <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={13} />
                            <span>Öğrenci ve Öğretmen için bu saat dilimi uygun. Çakışma bulunmadı.</span>
                          </div>
                          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase text-[8px]">SAAT UYGUN</span>
                        </div>

                        <div className="flex justify-end">
                          <button type="button" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition">
                            Birebir Dersi Kaydet & Veliyi Bilgilendir
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trust footer block inside mockup */}
                  <div className="border-t border-slate-900/80 pt-4 flex justify-between items-center text-[9px] text-slate-500 font-bold mt-4">
                    <span>Eğitim Kurumları Yönetim ve Analiz Altyapısı</span>
                    <span>Güvenli • SSL Korumalı</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Features */}
            <div id="ozellikler" className="space-y-6 scroll-mt-6">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">TEKNOLOJİK ALTYAPI</span>
                <h3 className="text-2xl font-extrabold text-slate-100">K.A.S Hangi Problemleri Çözer?</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    icon: <Activity className="text-blue-400" size={18} />,
                    title: "Hızlı Sınav & PDF/OCR Okuma",
                    desc: "YKS denemeleri, kurum içi tarama sonuçları veya Excel tablolarını doğrudan sisteme sürükleyin. Yapay zeka motorumuz netleri çıkarır, öğrencileri otomatik eşleştirir."
                  },
                  {
                    icon: <Calendar className="text-amber-400" size={18} />,
                    title: "Kişiselleştirilmiş Birebir Ders Planlama",
                    desc: "Her öğrenciye özel haftalık ek ders, soru çözüm veya rehberlik görüşme takvimi oluşturun. Öğrenciler ve veliler kendi ekranlarında anında güncel dersleri takip etsin."
                  },
                  {
                    icon: <Mail className="text-purple-400" size={18} />,
                    title: "Gelişmiş Veli Bilgilendirme Sistemi",
                    desc: "Velilere SMS kalitesinde anlık karne, gelişim grafik analizi, öğretmen görüşme raporu ve devamsızlık bildirimlerini tek tıkla ulaştırın."
                  },
                  {
                    icon: <Shield className="text-emerald-400" size={18} />,
                    title: "Güvenli ve Hızlı Bulut Altyapısı",
                    desc: "Verileriniz şifrelenmiş olarak saklanır. Yedekleme dertlerini unutun. İstediğiniz cihazdan (tablet, telefon veya PC) saniyeler içinde bağlanın."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-slate-900/20 border border-slate-900 rounded-2xl hover:bg-slate-900/40 hover:border-slate-800 transition duration-300">
                    <div className="h-10 w-10 shrink-0 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shadow-inner">
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biz Kimiz & Neden Biz? Section */}
            <div id="biz-kimiz" className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 lg:p-8 space-y-6 relative overflow-hidden scroll-mt-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Award size={12} /> BİZ KİMİZ & NEDEN BİZ?
                  </span>
                  <h3 className="text-xl font-black text-slate-100">K.A.S Eğitim Teknolojileri</h3>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-xs rounded-full">
                  Güvenilir Eğitim Çözümü
                </div>
              </div>

              <div className="space-y-5">
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  K.A.S, eğitim sektörünün içinden gelen deneyimli eğitimciler, rehberlik koordinatörleri ve yazılım mühendisleri tarafından kurulan profesyonel bir eğitim otomasyon platformudur. Amacımız, modern teknolojiyi geleneksel eğitim disipliniyle birleştirerek kurumların yönetimsel yükünü azaltmak ve başarı oranlarını artırmaktır.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Eğitimci Odaklı Yaklaşım",
                      desc: "Biz de sahada çalıştık! Sınav takipleri, ders çakışmaları ve veli bildirimlerinin yarattığı stresi çok iyi bildiğimiz için sistemi tamamen pratiklik üzerine kurguladık."
                    },
                    {
                      title: "Zaman ve Maliyet Tasarrufu",
                      desc: "Haftalık manuel ders dağıtımları günlerinizi değil saniyelerinizi alır. Kağıt karneleri, SMS maliyetlerini ve karmaşık Excel tablolarını hayatınızdan tamamen çıkarıyoruz."
                    },
                    {
                      title: "%100 Veli Memnuniyeti",
                      desc: "Öğrencilerin gelişim grafiklerini ve ders planlarını şeffaf bir şekilde velilerle paylaşarak kurumunuzun veli nezdindeki kurumsal ciddiyetini ve bağlılığını en üst seviyeye çıkarıyoruz."
                    },
                    {
                      title: "Sürekli Gelişen Bulut Altyapısı",
                      desc: "Yedekleme ve sunucu kurulumu gerektirmeden, her hafta eklenen yeni analiz araçları ve özelliklerle sisteminizi her zaman güncel ve güvende tutuyoruz."
                    }
                  ].map((feat, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1.5 hover:border-blue-500/20 transition-all">
                      <span className="text-xs font-black text-blue-400 block">{feat.title}</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div id="fiyatlandirma" className="space-y-6 scroll-mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider font-sans">ŞEFFAF VE TEK FİYAT</span>
                  <h3 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">K.A.S Sınırsız Portal Lisansı</h3>
                </div>

                {/* Billing Toggle Switcher */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsAnnualBilling(false)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${!isAnnualBilling ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Aylık Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnnualBilling(true)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition flex items-center gap-1 ${isAnnualBilling ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Yıllık Ödeme <span className="bg-emerald-500 text-slate-950 font-black text-[8px] px-1 rounded-md">%20 İndirim</span>
                  </button>
                </div>
              </div>

              {/* Pricing Grid (2 Cards layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Free Trial Card */}
                <div className="border border-slate-850 bg-slate-900/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between hover:border-slate-800 transition-all duration-300">
                  <div className="space-y-4">
                    <div>
                      <span className="bg-slate-800/80 text-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                        KART GEREKMEZ
                      </span>
                      <h4 className="text-base font-black text-slate-100 mt-2">14 Günlük Ücretsiz Deneme</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Sistemi risksiz test edin</span>
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-50 tracking-tight">₺0</span>
                      <span className="text-[10px] font-bold text-slate-500">/ 14 gün</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-bold">
                      *Hiçbir taahhüt veya kredi kartı bilgisi gerekmez.
                    </span>

                    <div className="border-t border-slate-900/60 pt-4 space-y-2">
                      {[
                        "Tüm Gelişmiş Modüllere Erişim",
                        "Öğrenci & Öğretmen Tanımlama",
                        "Sınırlandırılmamış PDF Analiz Hakkı",
                        "Birebir Ders ve Etüt Programlama",
                        "Rehberlik Görüşme Günlükleri",
                        "Deneme Sonrası Verileriniz Silinmez"
                      ].map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                          <CheckCircle size={12} className="text-blue-500 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setRegKurum("");
                      setShowAuthScreen(true);
                      setTimeout(() => {
                        document.getElementById('auth-form-card')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-850"
                  >
                    Ücretsiz Denemeyi Başlat ⚡
                  </button>
                </div>

                {/* Sınırsız Premium Card */}
                <div className="border border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between relative hover:border-blue-500/50 transition-all duration-300">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider border border-blue-400">
                    EN POPÜLER • TEK LİSANS
                  </span>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-black text-slate-100 mt-2">K.A.S Sınırsız Premium</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Sınırsız Öğrenci, Veli ve Şube</span>
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-50 tracking-tight">
                        {isAnnualBilling ? "₺750" : "₺950"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">/aylık</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-bold">
                      {isAnnualBilling ? "*Yıllık peşin (₺9.000) faturalandırılır." : "*Aylık faturalandırılır, iptal edilebilir."}
                    </span>

                    <div className="border-t border-slate-900/60 pt-4 space-y-2">
                      {[
                        "Tüm SaaS Özellikleri & Modüller Sınırsız",
                        "Yapay Zeka Destekli PDF Sınav Okuyucu",
                        "Akıllı Birebir Ders Çakışma Engelleyici",
                        "Veli Gelişim Raporları & Anlık Karneler",
                        "Rehberlik & Görüşme Günlükleri",
                        "7/24 WhatsApp & Telefon Destek Hattı",
                        "Sürekli Güncellenen Bulut Altyapısı"
                      ].map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                          <CheckCircle size={12} className="text-blue-500 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setRegKurum("");
                      setShowAuthScreen(true);
                      setTimeout(() => {
                        document.getElementById('auth-form-card')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15"
                  >
                    Deneme Başlat & Premium'a Geç 💎
                  </button>
                </div>

              </div>

              {/* Informational Guidance Warning Banner for payments */}
              <div className="max-w-4xl mx-auto bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-2 text-center">
                <span className="font-extrabold uppercase text-[10px] text-blue-400 tracking-wider block">💳 ÖDEME SİSTEMİ HAKKINDA BİLGİLENDİRME</span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-2xl mx-auto">
                  Güvenlik ve kurum-hesap eşleştirmesi nedeniyle kredi kartı ile lisans satın alma/yükseltme işlemleri <strong>yalnızca kayıt olup sisteme giriş yaptıktan sonra Kurum Paneli içerisindeki "Abonelik" sekmesinden</strong> yapılmaktadır. Kayıt esnasında sizden kredi kartı bilgisi kesinlikle istenmez.
                </p>
              </div>
            </div>

            {/* S.S.S. Accordion */}
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">SIKÇA SORULAN SORULAR</span>
                <h3 className="text-2xl font-extrabold text-slate-100">Kafanıza Takılanlar</h3>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: "Sınav PDF'lerini sisteme nasıl yükleyebiliriz?",
                    a: "Yönetici paneli 'Hızlı Sınav Analizi' sekmesinden, 3D, Bilgi Sarmal veya Özdebir gibi popüler deneme sınavı sonuç listelerini PDF formatında doğrudan sürükleyip bırakabilirsiniz. Yapay zekamız tablo sütunlarını otomatik algılayıp öğrencilere atar."
                  },
                  {
                    q: "Öğrenci ve Veliler sistemi nasıl kullanacak?",
                    a: "Veliler sisteme yöneticinin tanımladığı e-posta ile, öğrenciler ise sadece T.C. Kimlik numaraları ile şifresiz, güvenli giriş yapabilirler. Kendilerine özel mobil uyumlu ekranlardan ders programlarını, YKS sayaçlarını ve sınav analizlerini anlık görebilirler."
                  },
                  {
                    q: "Birebir Ders Programı çakışmaları nasıl engellenir?",
                    a: "Sistem, bir öğretmen veya öğrenciye aynı saat diliminde iki farklı ders atanmasını engeller. Tam otomatik çakışma kontrolü sayesinde karmaşık ders planlama süreçleriniz saniyelere iner."
                  },
                  {
                    q: "Kendi kurum logomuzu ekleyebilir miyiz?",
                    a: "Evet, kurumsal lisansta kendi logonuzu, renklerinizi ekleyebilir ve veli bildirimlerini kendi kurumsal başlığınızla özelleştirebilirsiniz."
                  },
                  {
                    q: "14 günlük deneme süresi bittiğinde ne olur? Otomatik ücret çekilir mi?",
                    a: "Hayır, K.A.S'ta kayıt esnasında kredi kartı bilgisi istenmez. 14 gün boyunca tüm özellikleri tamamen ücretsiz ve sınırsız olarak test edersiniz. Süre sonunda memnun kalırsanız dilediğiniz paketi seçerek devam edebilirsiniz."
                  },
                  {
                    q: "KVKK ve Veri Güvenliği mevzuatına uyumlu mu?",
                    a: "Evet, sistemimiz %100 KVKK uyumludur. Öğrenci, öğretmen ve veli verileri güvenli bulut altyapımızda yüksek standartlarda şifrelenerek korunur ve üçüncü taraflarla kesinlikle paylaşılmaz."
                  },
                  {
                    q: "Kullanım için ek donanım, barkod okuyucu veya sunucu gerekir mi?",
                    a: "Kesinlikle hayır. K.A.S bulut tabanlı bir SaaS platformudur. Herhangi bir bilgisayar, tablet veya akıllı telefondan web tarayıcısı üzerinden sisteme anında erişebilirsiniz. Ek bir kuruluma veya donanıma ihtiyaç yoktur."
                  },
                  {
                    q: "Veli ve öğrencilere bildirimler ücretsiz mi ulaştırılıyor?",
                    a: "Evet. Tüm karne gönderimleri, birebir ders bildirimleri ve rehberlik raporları veli ve öğrenci paneline anlık, sınırsız ve tamamen ücretsiz ulaştırılır. Ekstra bir SMS maliyetiniz bulunmaz."
                  }
                ].map((item, idx) => {
                  const isOpen = activeFaqIndex === idx;
                  return (
                    <div key={idx} className="border border-slate-900 bg-slate-900/10 rounded-2xl overflow-hidden transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/30 transition text-xs md:text-sm font-extrabold text-slate-200 cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronRight size={16} className={`text-slate-400 transform transition-transform duration-300 ${isOpen ? "rotate-90 text-blue-400" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed font-semibold animate-fade-in border-t border-slate-900/50 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-4">KURUMSAL YORUMLAR</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                  </div>
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                    "Sınav analizlerini manuel girmek günlerimizi alıyordu. K.A.S sayesinde PDF listeyi sürükleyip bırakıyoruz ve 3 saniyede tüm velilere gelişim karneleri gidiyor. Muazzam bir SaaS."
                  </p>
                  <div>
                    <span className="block text-[11px] font-black text-slate-100">Ahmet Kemal Kaya</span>
                    <span className="block text-[9px] text-slate-500 font-bold">Limit VIP Kurs Merkezi Müdürü</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                  </div>
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                    "Öğretmenlerimizin ve rehberlik ekibimizin veliyle olan iletişimini tek bir platforma topladık. Birebir derslerin takibi ve çakışma engelleme modülü işimizi çok kolaylaştırdı."
                  </p>
                  <div>
                    <span className="block text-[11px] font-black text-slate-100">Zeynep Şahin</span>
                    <span className="block text-[9px] text-slate-500 font-bold">Atatürk Lisesi Eğitim Koordinatörü</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-12 border-t border-slate-900/60 mt-16 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                
                {/* Brand & Socials Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
                      <img src="/favicon.svg" alt="K.A.S" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-black text-slate-200 tracking-wider">K.A.S KURUMSAL</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    Eğitim kurumlarında zaman tasarrufu, veri doğruluğu ve veli memnuniyeti sağlayan yeni nesil SaaS bulut otomasyonu.
                  </p>
                </div>

                {/* Legal & Policies Column */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Yasal & Kurumsal</span>
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => setActivePolicy('kvkk')}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-200 text-left transition cursor-pointer"
                    >
                      KVKK Aydınlatma Metni
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePolicy('privacy')}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-200 text-left transition cursor-pointer"
                    >
                      Gizlilik Politikası
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePolicy('terms')}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-200 text-left transition cursor-pointer"
                    >
                      Kullanım Koşulları
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePolicy('legal')}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-200 text-left transition cursor-pointer"
                    >
                      Yasal Uyarı
                    </button>
                  </div>
                </div>

                {/* Contact Column */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">İletişim & Destek</span>
                  <div className="space-y-2 text-[10px] text-slate-400 font-bold leading-normal">
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-400">✉</span> cagriiscen26@gmail.com
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-400">📞</span> +90 542 610 5632
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-400">📍</span> Türkiye (Online Hizmet)
                    </p>
                  </div>
                </div>

              </div>

              {/* Bottom Copyright and disclaimer */}
              <div className="pt-6 border-t border-slate-900/40 text-center space-y-2">
                <p className="text-[10px] text-slate-500 font-bold">
                  © 2026 K.A.S SaaS Inc. Tüm hakları saklıdır. Eğitim Kurumları Yönetim ve Birebir Ders Otomasyon Platformu.
                </p>
                <p className="text-[8px] text-slate-600 font-semibold leading-relaxed">
                  * K.A.S platformu üzerindeki tüm analizler, grafikler ve istatistiksel raporlar eğitim standartlarına ve başarı kriterlerine uygun olarak hazırlanmakta olup, eğitim süreçlerinde yüksek verimlilik sağlamaktadır.
                </p>
              </div>
            </div>

            {/* POLICY DIALOGS MODAL POPUP */}
            {activePolicy && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative">
                  <button
                    type="button"
                    onClick={() => setActivePolicy(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 bg-slate-950/50 p-2 rounded-xl border border-slate-800 transition cursor-pointer text-xs font-bold"
                  >
                    ✕ Kapat
                  </button>

                  {activePolicy === 'privacy' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Shield className="text-blue-400" size={18} />
                        <span>Gizlilik Politikası</span>
                      </h3>
                      <div className="text-xs text-slate-300 leading-relaxed space-y-3 font-semibold text-left">
                        <p><strong>1. Veri Sorumlusu</strong></p>
                        <p>K.A.S Eğitim Teknolojileri A.Ş. olarak kişisel verilerinizin güvenliğine ve gizliliğine büyük önem veriyoruz. Bu politika, platformumuz üzerinden toplanan verilerin nasıl işlendiğini açıklar.</p>
                        <p><strong>2. Toplanan Veriler ve İşleme Amaçları</strong></p>
                        <p>Kurum kayıt esnasında toplanan yönetici adı, telefon numarası, e-posta adresi ile öğrencilere ait sınav netleri, ders programı bilgileri yalnızca eğitim süreçlerinin analizi ve velilerin bilgilendirilmesi amacıyla işlenmektedir.</p>
                        <p><strong>3. Verilerin Saklanması ve Güvenliği</strong></p>
                        <p>Tüm verileriniz Türkiye lokasyonlu, SSL şifreli ve yüksek güvenlik standartlarına sahip güvenli bulut sunucularımızda saklanır. Yetkisiz erişimlerin engellenmesi için her türlü teknik tedbir alınmaktadır.</p>
                        <p><strong>4. Üçüncü Taraflarla Paylaşım</strong></p>
                        <p>Kişisel verileriniz yasal zorunluluklar haricinde hiçbir şekilde üçüncü şahıslarla, reklam verenlerle veya iş ortaklarıyla paylaşılmaz.</p>
                      </div>
                    </div>
                  )}

                  {activePolicy === 'kvkk' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Shield className="text-blue-400" size={18} />
                        <span>KVKK Aydınlatma Metni</span>
                      </h3>
                      <div className="text-xs text-slate-300 leading-relaxed space-y-3 font-semibold text-left">
                        <p><strong>6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında Aydınlatma Beyanı</strong></p>
                        <p>İşbu aydınlatma metni, veri sorumlusu sıfatıyla K.A.S Eğitim Teknolojileri tarafından, platformumuzu kullanan Kurum Yöneticileri, Öğretmenler, Veliler ve Öğrencileri bilgilendirmek amacıyla hazırlanmıştır.</p>
                        <p><strong>1. Kişisel Verilerin İşlenme Amacı</strong></p>
                        <p>Öğrencilerin eğitim performanslarının analizi, deneme sınavı sonuçlarının takibi, birebir derslerin planlanması, veli bilgilendirme süreçlerinin yönetilmesi ve sisteme güvenli giriş sağlanması amaçlarıyla sınırlı olarak işlenmektedir.</p>
                        <p><strong>2. İşlenen Verilerin Kimlere Aktarılabileceği</strong></p>
                        <p>Kişisel verileriniz, Kanun’un 8. ve 9. maddelerinde belirtilen şartlar dahilinde yalnızca yetkili kamu kurum ve kuruluşlarına yasal zorunluluk kapsamında aktarılabilecek olup, bunun dışında hiçbir özel kurumla paylaşılmamaktadır.</p>
                        <p><strong>3. Veri Sahibinin Hakları</strong></p>
                        <p>KVKK'nın 11. maddesi uyarınca dilediğiniz zaman veri sorumlusuna başvurarak kişisel verilerinizin; işlenip işlenmediğini öğrenme, işlenme amacına uygun kullanılıp kullanılmadığını sorma, eksik veya yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz.</p>
                      </div>
                    </div>
                  )}

                  {activePolicy === 'terms' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                        <FileText className="text-blue-400" size={18} />
                        <span>Kullanım Koşulları</span>
                      </h3>
                      <div className="text-xs text-slate-300 leading-relaxed space-y-3 font-semibold text-left">
                        <p><strong>1. Taraflar ve Tanımlar</strong></p>
                        <p>K.A.S Eğitim Teknolojileri platformuna üye olan veya deneme sürümü başlatan tüm eğitim kurumları ve kullanıcılar, bu Kullanım Koşullarını peşinen kabul etmiş sayılır.</p>
                        <p><strong>2. Hizmet Kapsamı ve Değişiklikler</strong></p>
                        <p>K.A.S, eğitim kurumlarının sınav analizi, ders programlama ve veli takibi gibi süreçlerini bulut tabanlı bir yazılım aracılığıyla yönetmelerini sağlar. K.A.S, hizmet kalitesini artırmak amacıyla platform üzerinde güncelleme ve değişiklik yapma hakkını saklı tutar.</p>
                        <p><strong>3. Fikri Mülkiyet ve Haklar</strong></p>
                        <p>Sistemde yer alan tüm kodlar, tasarımlar, logolar ve yazılımsal altyapı K.A.S Eğitim Teknolojileri'ne aittir. İzinsiz kopyalanması, dağıtılması veya tersine mühendislik yapılması yasaktır.</p>
                        <p><strong>4. Sorumluluk Sınırları</strong></p>
                        <p>Kullanıcıların kendi şifrelerini güvenli bir şekilde saklamaları kendi sorumluluğundadır. Üçüncü şahısların eline geçen kullanıcı hesap bilgileri ve bunlardan doğan veri kayıplarından platformumuz sorumlu tutulamaz.</p>
                      </div>
                    </div>
                  )}

                  {activePolicy === 'legal' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                        <AlertCircle className="text-blue-400" size={18} />
                        <span>Yasal Uyarı</span>
                      </h3>
                      <div className="text-xs text-slate-300 leading-relaxed space-y-3 font-semibold text-left">
                        <p><strong>Yasal Sorumluluk Beyanı</strong></p>
                        <p>K.A.S portalında yer alan tüm veriler, analiz sonuçları ve grafikler yalnızca eğitim kurumlarına yardımcı nitelikte istatistiksel raporlar sunmaktadır. Kararların veya akademik yönlendirmelerin nihai sorumluluğu eğitim kurumu yöneticilerine ve velilere aittir.</p>
                        <p><strong>Marka ve Telif Hakları</strong></p>
                        <p>'K.A.S' ve 'Kurum Analiz Sistemleri' tescilli markalar olup, sistem arayüzleri ve marka unsurlarının izinsiz ticari amaçla taklit edilmesi veya kullanılması durumunda yasal işlem başlatılacaktır.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActivePolicy(null)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Anladım, Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}

            </div> {/* Inner Marketing Wrapper end */}
          </div> {/* Left Side end */}

          {/* Right Side: Centered Standalone Login / Signup Console */}
          <div 
            id="auth-form-card" 
            className={`w-full ${!showAuthScreen ? 'hidden' : 'flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 py-12'} relative overflow-hidden`}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-slate-950 -z-10"></div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl"></div>

            <div className="w-full max-w-[460px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 md:p-8 rounded-3xl relative z-10 shadow-2xl space-y-6">
              
              {/* Back to Home Header */}
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                <button
                  type="button"
                  onClick={() => { setShowAuthScreen(false); setLoginError(''); setRegError(''); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-850 cursor-pointer"
                >
                  ← Ana Sayfaya Dön
                </button>
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
                    <img src="/favicon.svg" alt="K.A.S" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 tracking-wider">K.A.S PORTAL</span>
                </div>
              </div>

              {/* Premium Header Tab Switcher */}
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-850 mb-4 relative z-10">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setLoginError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                  !isRegistering
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn size={13} /> Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setRegError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                  isRegistering
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles size={13} /> Kurum Kaydı (İlk Giriş)
              </button>
            </div>

            {!isRegistering ? (
              /* LOGIN FORM */
              <div className="space-y-6 relative z-10 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                    <UserCheck className="text-blue-400" size={18} />
                    <span>Hesabınıza Giriş Yapın</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Yönetici, Öğretmen, Rehber, Veli veya Öğrenci bilgilerinizle sisteme erişin.</p>
                </div>

                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 animate-shake">
                     <AlertCircle size={15} /> {loginError}
                  </div>
                )}

                <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">E-posta Adresi veya Öğrenci T.C. No</label>
                    <input
                      type="text"
                      required
                      placeholder="admin@kas.com veya T.C. Kimlik No"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Şifre / Öğrenci T.C. No</label>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={sifre}
                      onChange={e => setSifre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md shadow-blue-500/10 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <LogIn size={14} /> Kurum Paneline Giriş Yap
                  </button>
                </form>

                <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-xl space-y-1.5 text-[11px] text-slate-400 leading-normal">
                  <span className="font-extrabold uppercase text-[9px] text-blue-400 tracking-wider block">💡 ÖNEMLİ NOT:</span>
                  Öğretmen, Rehber Öğretmen ve Veliler, yöneticileri tarafından eklendikten sonra doğrudan bu alandan giriş sağlayabilirler.
                </div>
              </div>
            ) : (
              /* REGISTER FORM */
              <div className="space-y-6 relative z-10 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                    <Sparkles className="text-blue-400" size={18} />
                    <span>Yeni Kurum Kayıt Formu</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Eğitim merkezinizi ve ilk yönetici (Admin) hesabınızı tanımlayın.</p>
                </div>

                {/* Informational Guidance Warning Banner */}
                <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[11px] p-3.5 rounded-xl space-y-1">
                  <span className="font-extrabold uppercase block tracking-wider text-amber-300">⚠️ KURUM YÖNETİCİSİ DİKKATİNE</span>
                  <p className="leading-normal font-medium">
                    Bu form <strong>sadece kendi eğitim kurumunu kurmak ve sistemi yönetmek isteyen yöneticiler (Admin)</strong> içindir.
                  </p>
                </div>

                {regError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={15} /> {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Kurum Adı *</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Limit Kurs Merkezi"
                        value={regKurum}
                        onChange={e => setRegKurum(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Kurum Türü *</label>
                      <select
                        value={regTuru}
                        onChange={e => setRegTuru(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                      >
                        <option value="Anadolu Lisesi">Anadolu Lisesi</option>
                        <option value="Fen Lisesi">Fen Lisesi</option>
                        <option value="Özel Kurs / Etüt">Özel Kurs / Etüt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider font-bold">Yönetici Adı Soyadı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider font-bold">İletişim Cep Telefonu *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0555..."
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">E-posta (Giriş) *</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@limit.com"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider font-bold">Şifre *</label>
                      <input
                        type="password"
                        required
                        placeholder="Şifre"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md flex justify-center items-center gap-2 cursor-pointer mt-2"
                  >
                    <Sparkles size={14} /> Kurulumu Başlat ve Kaydol
                  </button>
                </form>
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        /* REGISTERED USER WORKSPACE SIDEBAR + VIEWS SYSTEM */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 bg-slate-900 md:border-r border-b md:border-b-0 border-slate-800/80 p-4 space-y-4 z-10 flex flex-row md:flex-col justify-between md:justify-start gap-2 overflow-x-auto md:overflow-visible">
            
            {/* Nav tabs list */}
            <div className="flex md:flex-col gap-1 w-full overflow-x-auto md:overflow-visible scrollbar-none">
              
              {/* Tab: Dashboard (All staff roles) */}
              {user.rol !== 'veli' && user.rol !== 'ogrenci' && (
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'dashboard'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <LayoutDashboard size={15} /> Genel Özet
                </button>
              )}

              {/* Tab: Veli Panel (Only Parent) */}
              {user.rol === 'veli' && (
                <button
                  onClick={() => setCurrentTab('veli-panel')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'veli-panel'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Award size={15} /> Gelişim Karnesi
                </button>
              )}

              {/* Tab: Student Panel (Only Student) */}
              {user.rol === 'ogrenci' && (
                <button
                  onClick={() => setCurrentTab('ogrenci-panel')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'ogrenci-panel'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Award size={15} /> Gelişim Karnem
                </button>
              )}

              {/* Tab: Öğrenci Yönetimi (Öğretmen, Rehber) */}
              {user.rol !== 'admin' && user.rol !== 'veli' && user.rol !== 'ogrenci' && (
                <button
                  onClick={() => setCurrentTab('ogrenci')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'ogrenci'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Users size={15} /> Öğrenci Yönetimi
                </button>
              )}

              {/* Tab: PDF Sonuç Okuma (Admin, Rehber) */}
              {(user.rol === 'admin' || user.rol === 'rehber') && (
                <button
                  onClick={() => setCurrentTab('pdf')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'pdf'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Sparkles size={15} /> PDF Sınav Okuyucu
                </button>
              )}

              {/* Tab: Mesajlaşma (All roles) */}
              <button
                onClick={() => setCurrentTab('mesaj')}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                  currentTab === 'mesaj'
                    ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                }`}
              >
                <Mail size={15} /> Mesaj Merkezi
              </button>

              {/* Tab: Abonelik & Ödeme (Only Admin) */}
              {user.rol === 'admin' && (
                <button
                  onClick={() => setCurrentTab('abonelik')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'abonelik'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Coins size={15} /> Abonelik & Ödeme
                </button>
              )}

              {/* Kurum Yönetimi / Tanımlamalar Sub-Tabs (Only Admin) */}
              {user.rol === 'admin' && (
                <div className="pt-2 mt-2 border-t border-slate-800/40 space-y-1 w-full shrink-0">
                  <div className="px-3.5 py-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    Kurum Tanımları
                  </div>

                  <button
                    onClick={() => setCurrentTab('tanimlar_sinif')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_sinif'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Layers size={13} /> Sınıf Tanımları
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_ogrenci')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_ogrenci'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Users size={13} /> Öğrenci Yönetimi
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_ogretmen')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_ogretmen'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Users size={13} /> Öğretmen Kadrosu
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_rehber')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_rehber'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Award size={13} /> Rehberlik Ekibi
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_veli')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_veli'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Shield size={13} /> Veliler
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_sinav')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_sinav'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <BookOpen size={13} /> Sınav Tanımları
                  </button>

                  <button
                    onClick={() => setCurrentTab('tanimlar_ders_programi')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'tanimlar_ders_programi'
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Calendar size={13} /> Ders Programları
                  </button>

                  <button
                    onClick={() => setCurrentTab('risk_limitleri')}
                    className={`flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                      currentTab === 'risk_limitleri'
                        ? "bg-amber-600 text-white shadow shadow-amber-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                    }`}
                  >
                    <Activity size={13} className="text-amber-500" /> Risk Limitleri
                  </button>
                </div>
              )}
            </div>

            {/* Canlı Saat ve Tarih Göstergesi (Desktop Only) */}
            <div className="hidden md:block pt-3 border-t border-slate-800/60 mt-auto space-y-3 shrink-0">
              <div className="bg-slate-950/40 border border-slate-850/60 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Clock size={10} className="text-blue-400" /> Güncel Zaman</span>
                  <span className="text-blue-400 font-mono font-bold">CANLI</span>
                </div>
                
                <div className="space-y-0.5">
                  <span className="block text-2xl font-black text-slate-100 font-mono tracking-tight leading-none">
                    {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Lisans Durumu</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded block text-center ${
                  currentSubscription === 'trial' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}>
                  {currentSubscription === 'trial' ? `Deneme Sürümü (${trialDaysLeft} Gün)` : "Sınırsız Premium 💎"}
                </span>
                {user.rol === 'admin' && currentSubscription === 'trial' && (
                  <button 
                    onClick={() => setCurrentTab('abonelik')}
                    className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold underline block text-center w-full mt-1 cursor-pointer"
                  >
                    Şimdi Paketini Yükselt ⚡
                  </button>
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-bold space-y-0.5 px-1">
                <p>Kurum Analiz Sistemi v1.5</p>
                <p className="text-[9px] text-slate-600 font-semibold">© 2026 K.A.S Portal • Premium</p>
              </div>
            </div>
          </aside>

          {/* Core App Viewport */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            
            {currentSubscription === 'trial' && trialDaysLeft <= 0 ? (
              user.rol === 'admin' && currentTab === 'abonelik' ? (
                <Abonelik 
                  user={user} 
                  token={token} 
                  currentPlan={currentSubscription}
                  trialDaysLeft={trialDaysLeft}
                  setTrialDaysLeft={setTrialDaysLeft}
                  onUpgradeSuccess={(newPlan) => {
                    setCurrentSubscription(newPlan);
                    localStorage.setItem('kas_subscription_plan', newPlan);
                    setTrialDaysLeft(14);
                    localStorage.removeItem('kas_simulated_trial_days');
                  }} 
                />
              ) : (
                <div className="bg-slate-900 border border-red-500/20 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto my-12 animate-fade-in shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl"></div>
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Shield size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
                      Kullanım Süreniz Dolmuştur! 🔒
                    </span>
                    <h3 className="text-2xl font-black text-slate-100 font-sans">
                      Deneme Süreniz Sona Erdi
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      {user.rol === 'admin' 
                        ? "K.A.S Portal'ın 14 günlük ücretsiz deneme süresi sona ermiştir. Kurumunuzun verilerine, öğrenci analizlerine ve diğer tüm modüllere erişmeye devam etmek için lütfen lisans paketinizi yükseltin."
                        : "Kurumunuzun 14 günlük deneme süresi sona ermiştir. Devam etmek için kurum yöneticisinin (Admin) lisans paketini yenilemesi gerekmektedir. Lütfen okul idaresi ile iletişime geçin."
                      }
                    </p>
                  </div>

                  {user.rol === 'admin' ? (
                    <button
                      onClick={() => setCurrentTab('abonelik')}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-500/10 animate-bounce"
                    >
                      <Coins size={15} /> Şimdi Lisansı Yükselt & Ödeme Yap
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-bold border border-slate-800 bg-slate-950/40 px-4 py-2.5 rounded-xl">
                      Sistem Yöneticisine Bilgilendirme İletildi
                    </div>
                  )}
                </div>
              )
            ) : (
              <>
                {/* MOUNT VIEW: Dashboard */}
                {currentTab === 'dashboard' && user.rol !== 'veli' && (
                  <Dashboard user={user} token={token} />
                )}

                {/* MOUNT VIEW: Student Lifecycle Panel */}
                {(currentTab === 'ogrenci' || currentTab === 'tanimlar_ogrenci') && user.rol !== 'veli' && (
                  <OgrenciPaneli user={user} token={token} />
                )}

                {/* MOUNT VIEW: AI Parser PDF Reader */}
                {currentTab === 'pdf' && (user.rol === 'admin' || user.rol === 'rehber') && (
                  <PdfOkuyucu user={user} token={token} />
                )}

                {/* MOUNT VIEW: Messenger Hub */}
                {currentTab === 'mesaj' && (
                  <Mesajlar user={user} token={token} />
                )}

                {/* MOUNT VIEW: Configurations & Staff management */}
                {currentTab === 'tanimlar' && user.rol === 'admin' && (
                  <Tanimlar user={user} token={token} />
                )}

                {/* MOUNT VIEW: Individual Sub-tabs from Sidebar */}
                {currentTab.startsWith('tanimlar_') && currentTab !== 'tanimlar_ogrenci' && user.rol === 'admin' && (
                  <Tanimlar 
                    user={user} 
                    token={token} 
                    activeTab={currentTab.replace('tanimlar_', '') as any}
                    setActiveTab={(tab) => setCurrentTab(`tanimlar_${tab}`)}
                  />
                )}

                {/* MOUNT VIEW: Risk Threshold Settings */}
                {currentTab === 'risk_limitleri' && user.rol === 'admin' && (
                  <RiskLimitleri user={user} token={token} />
                )}

                {/* MOUNT VIEW: Abonelik & Ödeme */}
                {currentTab === 'abonelik' && user.rol === 'admin' && (
                  <Abonelik 
                    user={user} 
                    token={token} 
                    currentPlan={currentSubscription}
                    trialDaysLeft={trialDaysLeft}
                    setTrialDaysLeft={setTrialDaysLeft}
                    onUpgradeSuccess={(newPlan) => {
                      setCurrentSubscription(newPlan);
                      localStorage.setItem('kas_subscription_plan', newPlan);
                      setTrialDaysLeft(14);
                      localStorage.removeItem('kas_simulated_trial_days');
                    }} 
                  />
                )}

            {/* MOUNT VIEW: Individual Child performance report for Parent (Veli Paneli) */}
            {currentTab === 'veli-panel' && user.rol === 'veli' && (
              <div className="space-y-6">
                {loadingChild ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : !childReport ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 border-dashed rounded-xl bg-slate-950/20">
                    Hesabınıza atanmış kayıtlı aktif bir öğrenci bulunamadı. Lütfen kurum yönetimiyle iletişime geçin.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Welcome Header */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                      <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Veli Bilgilendirme Ekranı</span>
                      <h3 className="text-xl font-bold text-slate-100 mt-2">Öğrenci: <strong className="text-blue-400 font-extrabold">{childReport.student.ad_soyad}</strong></h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Sınıfı: {childReport.student.sinif_adi} • Sınav Gelişim Alanı: {childReport.student.alan}
                      </p>
                    </div>

                    {/* Haftalık Birebir Ders Programı */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-400" />
                        <span>Öğrencimin Haftalık Birebir Ders Programı</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"].map(day => {
                          const dayLessons = (childReport.ders_programi || [])
                            .filter((dp: any) => dp.gun === day)
                            .sort((a: any, b: any) => a.saat.localeCompare(b.saat));

                          return (
                            <div key={day} className="bg-slate-950/50 border border-slate-800/85 rounded-xl p-3.5 space-y-3 flex flex-col">
                              <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 text-center border-b border-slate-800 pb-2">
                                {day}
                              </span>
                              <div className="space-y-2.5 flex-1">
                                {dayLessons.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 text-center py-6 italic font-medium">Bugün Ders Yok</p>
                                ) : (
                                  dayLessons.map((lesson: any) => (
                                    <div key={lesson.id} className="bg-slate-900/80 border border-slate-850 rounded-lg p-2.5 space-y-1 hover:border-slate-750 transition">
                                      <span className="text-[9px] font-bold text-blue-400 font-mono flex items-center gap-1">
                                        <Clock size={8} /> {lesson.saat}
                                      </span>
                                      <h5 className="text-xs font-extrabold text-slate-200 line-clamp-1">{lesson.ders_adi}</h5>
                                      <p className="text-[10px] text-slate-500 truncate">{lesson.ogretmen_adi}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SVG Progress chart */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Deneme Sınavları Toplam Net Grafiği</h4>
                        {childReport.sonuclar.length === 0 ? (
                          <div className="h-40 flex items-center justify-center text-slate-500 text-xs">Henüz sınav sonucu girilmemiş.</div>
                        ) : (
                          <div>
                            <svg viewBox="0 0 500 150" className="w-full h-40 overflow-visible">
                              {[0, 25, 50, 75, 100, 120].map((val, i) => {
                                const y = 150 - (val / 120) * 130 - 10;
                                return (
                                  <g key={i}>
                                    <line x1="30" y1={y} x2="500" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                                    <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                                  </g>
                                );
                              })}

                              {(() => {
                                const points: string[] = [];
                                const count = childReport.sonuclar.length;
                                const stepX = (500 - 50) / (count > 1 ? count - 1 : 1);

                                childReport.sonuclar.forEach((res, index) => {
                                  const x = 40 + index * stepX;
                                  const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                  points.push(`${x},${y}`);
                                });

                                return (
                                  <>
                                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points.join(' ')} />
                                    {childReport.sonuclar.map((res, index) => {
                                      const x = 40 + index * stepX;
                                      const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                      return (
                                        <g key={index}>
                                          <circle cx={x} cy={y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                                          <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-bold" textAnchor="middle">{res.toplam_net}</text>
                                          <text x={x} y="148" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_adi.substring(0, 8)}...</text>
                                        </g>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Course by course nets */}
                      <div className="md:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Son Sınav Net Analizi</h4>
                        {childReport.sonuclar.length === 0 ? (
                          <div className="h-40 flex items-center justify-center text-slate-500 text-xs">Sınav net verisi yok.</div>
                        ) : (
                          (() => {
                            const last = childReport.sonuclar[childReport.sonuclar.length - 1];
                            const courses = [
                              { name: "Türkçe", net: last.turkce_net, max: 40, color: "bg-blue-500" },
                              { name: "Sosyal", net: last.sosyal_net, max: 20, color: "bg-amber-500" },
                              { name: "Matematik", net: last.matematik_net, max: 40, color: "bg-indigo-500" },
                              { name: "Fen Bilimleri", net: last.fen_net, max: 20, color: "bg-emerald-500" }
                            ];
                            return (
                              <div className="space-y-4">
                                {courses.map((c, i) => {
                                  const pct = Math.min(100, Math.max(0, (c.net / c.max) * 100));
                                  return (
                                    <div key={i} className="space-y-1">
                                      <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-300">{c.name}</span>
                                        <span className="text-slate-200">{c.net} <span className="text-slate-500 text-[10px]">/ {c.max}</span></span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                        <div className={`h-full ${c.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>

                    {/* Counseling notes, Detailed listing */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sınav listesi */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Tüm Sınav Karneleri</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="text-slate-500 text-[9px] uppercase font-bold border-b border-slate-800">
                                <th className="pb-2">Sınav Adı</th>
                                <th className="pb-2">Ders Netleri (T/S/M/F)</th>
                                <th className="pb-2 text-center">Toplam Net</th>
                                <th className="pb-2 text-right">Puan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {childReport.sonuclar.map((r, idx) => (
                                <tr key={idx}>
                                  <td className="py-2.5 font-bold text-slate-200">{r.sinav_adi}</td>
                                  <td className="py-2.5 font-mono text-slate-400 text-[11px]">{r.turkce_net}/{r.sosyal_net}/{r.matematik_net}/{r.fen_net}</td>
                                  <td className="py-2.5 text-center font-bold text-slate-200">{r.toplam_net}</td>
                                  <td className="py-2.5 text-right font-black text-blue-400">{r.puan}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Counseling logs */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Rehberlik & Görüşme Değerlendirmeleri</h4>
                        {childReport.notlar.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-500">Henüz eklenmiş bir değerlendirme kaydı yok.</div>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {childReport.notlar.map(n => (
                              <div key={n.id} className="bg-slate-950 p-3 border border-slate-850 rounded-xl space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-blue-400">{n.rehber_adi} (Rehber)</span>
                                  <span className="text-slate-500">{n.tarih}</span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MOUNT VIEW: Individual Student performance report for Student (Öğrenci Paneli) */}
            {currentTab === 'ogrenci-panel' && user.rol === 'ogrenci' && (
              <div className="space-y-6">
                {loadingStudent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : !studentReport ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 border-dashed rounded-xl bg-slate-950/20">
                    Öğrenci karneniz yüklenemedi veya henüz aktif bir kaydınız bulunamadı. Lütfen kurumunuzla iletişime geçin.
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    {/* Welcome Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl"></div>
                      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="bg-blue-500/10 text-blue-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
                            Öğrenci Gelişim Portalı
                          </span>
                          <h3 className="text-2xl font-black text-slate-100 mt-3">
                            Merhaba, <strong className="text-blue-400 font-extrabold">{studentReport.student.ad_soyad}</strong>! 👋
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            Sınıfın: <span className="text-slate-200 font-bold">{studentReport.student.sinif_adi || 'Sınıf Yok'}</span> • Alanın: <span className="text-slate-200 font-bold">{studentReport.student.alan}</span> • Durum: <span className="text-emerald-400 font-extrabold">Aktif Öğrenci</span>
                          </p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl px-5 py-3 text-right">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Hedef YKS Geri Sayım</span>
                          <span className="text-lg font-black text-blue-400 font-mono tracking-tight block">348 Gün kaldı!</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Interactive Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                          <Award size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Son Deneme Neti</span>
                          <span className="text-lg font-black text-slate-100 font-mono">
                            {studentReport.sonuclar.length > 0 ? studentReport.sonuclar[studentReport.sonuclar.length - 1].toplam_net : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Ortalama Netin</span>
                          <span className="text-lg font-black text-slate-100 font-mono">
                            {studentReport.sonuclar.length > 0 
                              ? (studentReport.sonuclar.reduce((sum, r) => sum + Number(r.toplam_net), 0) / studentReport.sonuclar.length).toFixed(2)
                              : '-'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <Layers size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Sınav Sayısı</span>
                          <span className="text-lg font-black text-slate-100 font-mono">{studentReport.sonuclar.length} Sınav</span>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                          <UserCheck size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Öğrenci Hesabı</span>
                          <span className="text-xs font-black text-slate-100 uppercase tracking-wide">TC ile Giriş</span>
                        </div>
                      </div>
                    </div>

                    {/* Haftalık Birebir Ders Programı */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-400" />
                        <span>Haftalık Birebir Ders Programım</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"].map(day => {
                          const dayLessons = (studentReport.ders_programi || [])
                            .filter((dp: any) => dp.gun === day)
                            .sort((a: any, b: any) => a.saat.localeCompare(b.saat));

                          return (
                            <div key={day} className="bg-slate-950/50 border border-slate-800/85 rounded-xl p-3.5 space-y-3 flex flex-col">
                              <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 text-center border-b border-slate-800 pb-2">
                                {day}
                              </span>
                              <div className="space-y-2.5 flex-1">
                                {dayLessons.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 text-center py-6 italic font-medium">Bugün Ders Yok</p>
                                ) : (
                                  dayLessons.map((lesson: any) => (
                                    <div key={lesson.id} className="bg-slate-900/80 border border-slate-850 rounded-lg p-2.5 space-y-1 hover:border-slate-750 transition">
                                      <span className="text-[9px] font-bold text-blue-400 font-mono flex items-center gap-1">
                                        <Clock size={8} /> {lesson.saat}
                                      </span>
                                      <h5 className="text-xs font-extrabold text-slate-200 line-clamp-1">{lesson.ders_adi}</h5>
                                      <p className="text-[10px] text-slate-500 truncate">{lesson.ogretmen_adi}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SVG Progress chart & focus areas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Deneme Sınavları Net Gelişimim</h4>
                        {studentReport.sonuclar.length === 0 ? (
                          <div className="h-40 flex items-center justify-center text-slate-500 text-xs border border-slate-850 rounded-xl bg-slate-950/20">Henüz sınav sonucu girilmemiş.</div>
                        ) : (
                          <div>
                            <svg viewBox="0 0 500 150" className="w-full h-40 overflow-visible">
                              {[0, 25, 50, 75, 100, 120].map((val, i) => {
                                const y = 150 - (val / 120) * 130 - 10;
                                return (
                                  <g key={i}>
                                    <line x1="30" y1={y} x2="500" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                                    <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                                  </g>
                                );
                              })}

                              {(() => {
                                const points: string[] = [];
                                const count = studentReport.sonuclar.length;
                                const stepX = (500 - 50) / (count > 1 ? count - 1 : 1);

                                studentReport.sonuclar.forEach((res, index) => {
                                  const x = 40 + index * stepX;
                                  const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                  points.push(`${x},${y}`);
                                });

                                return (
                                  <>
                                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points.join(' ')} />
                                    {studentReport.sonuclar.map((res, index) => {
                                      const x = 40 + index * stepX;
                                      const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                      return (
                                        <g key={index}>
                                          <circle cx={x} cy={y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                                          <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-bold" textAnchor="middle">{res.toplam_net}</text>
                                          <text x={x} y="148" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_adi.substring(0, 8)}...</text>
                                        </g>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Course by course nets */}
                      <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Son Sınav Net Analizim</h4>
                          {studentReport.sonuclar.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-slate-500 text-xs">Sınav net verisi yok.</div>
                          ) : (
                            (() => {
                              const last = studentReport.sonuclar[studentReport.sonuclar.length - 1];
                              const courses = [
                                { name: "Türkçe", net: last.turkce_net, max: 40, color: "bg-blue-500" },
                                { name: "Sosyal", net: last.sosyal_net, max: 20, color: "bg-amber-500" },
                                { name: "Matematik", net: last.matematik_net, max: 40, color: "bg-indigo-500" },
                                { name: "Fen Bilimleri", net: last.fen_net, max: 20, color: "bg-emerald-500" }
                              ];
                              return (
                                <div className="space-y-4">
                                  {courses.map((c, i) => {
                                    const pct = Math.min(100, Math.max(0, (c.net / c.max) * 100));
                                    return (
                                      <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                          <span className="text-slate-300">{c.name}</span>
                                          <span className="text-slate-200">{c.net} <span className="text-slate-500 text-[10px]">/ {c.max}</span></span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                          <div className={`h-full ${c.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* Smart recommendation widget */}
                        {studentReport.sonuclar.length > 0 && (
                          <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl text-[11px] text-indigo-300 mt-4 leading-normal">
                            <span className="font-extrabold uppercase block text-[9px] text-indigo-400 mb-1">💡 K.A.S Akıllı Öneri:</span>
                            {(() => {
                              const last = studentReport.sonuclar[studentReport.sonuclar.length - 1];
                              const minCourse = [
                                { name: 'Türkçe', ratio: last.turkce_net / 40, reco: '📚 Paragrafta hız kazanmak ve odaklanmak için her gün mutlaka süre tutarak 25 paragraf sorusu çözmeyi ihmal etme!' },
                                { name: 'Matematik', ratio: last.matematik_net / 40, reco: '📐 Matematik netlerinde sıçrama için temel konuları (Problemler & Üçgenler) her gün tekrar edip soru çözümleri videolarını izle!' },
                                { name: 'Sosyal', ratio: last.sosyal_net / 20, reco: '🌍 Coğrafya harita bilgisi ve tarih kavramları sözlüğü çalışarak hızlıca net artışı sağlayabilirsin.' },
                                { name: 'Fen', ratio: last.fen_net / 20, reco: '🧪 Fen bilimlerinde TYT Kimya ve Biyoloji soru bankalarından her akşam 2 adet ünite testi çözerek netleri sabitle!' }
                              ].sort((a, b) => a.ratio - b.ratio)[0];
                              return minCourse.reco;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive targets checklist */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sınav karnelerim */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Tüm Sınav Karnelerim</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="text-slate-500 text-[9px] uppercase font-bold border-b border-slate-800">
                                <th className="pb-2">Sınav Adı</th>
                                <th className="pb-2 text-center">Net Dağılımı (T/S/M/F)</th>
                                <th className="pb-2 text-center">Toplam Net</th>
                                <th className="pb-2 text-right">Puan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {studentReport.sonuclar.map((r, idx) => (
                                <tr key={idx}>
                                  <td className="py-2.5 font-bold text-slate-200">{r.sinav_adi}</td>
                                  <td className="py-2.5 text-center font-mono text-slate-400 text-[11px]">{r.turkce_net}/{r.sosyal_net}/{r.matematik_net}/{r.fen_net}</td>
                                  <td className="py-2.5 text-center font-bold text-slate-200">{r.toplam_net}</td>
                                  <td className="py-2.5 text-right font-black text-blue-400">{r.puan}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Danışmanımın Değerlendirmeleri */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Rehber Öğretmenimin Görüşme Değerlendirmeleri</h4>
                        {studentReport.notlar.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-500">Rehber öğretmeniniz tarafından henüz bir değerlendirme eklenmemiş.</div>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {studentReport.notlar.map(n => (
                              <div key={n.id} className="bg-slate-950 p-3 border border-slate-850 rounded-xl space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-blue-400">{n.rehber_adi || 'Rehber Öğretmen'}</span>
                                  <span className="text-slate-500">{n.tarih}</span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
        </div>
      )}
    </div>
  );
}
