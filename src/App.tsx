import React, { useState, useEffect } from 'react';
import { User, Ogrenci } from './types';
import Dashboard from './components/Dashboard';
import OgrenciPaneli from './components/OgrenciPaneli';
import PdfOkuyucu from './components/PdfOkuyucu';
import Mesajlar from './components/Mesajlar';
import Tanimlar from './components/Tanimlar';
import Abonelik from './components/Abonelik';
import RiskLimitleri from './components/RiskLimitleri';
import { Layers, Users, Sparkles, Mail, Settings, LogOut, Award, Shield, LayoutDashboard, UserCheck, LogIn, ChevronRight, HelpCircle, AlertCircle, GraduationCap, Activity, Calendar, Clock, Check, Zap, TrendingUp, Coins, MessageSquare, BookOpen, CheckCircle, ArrowRight, Star, FileText, Menu, X, Instagram, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper function to calculate expected net projection for the next practice exam
export const getProjectedNet = (sonuclar: any[]): number => {
  if (!sonuclar || sonuclar.length === 0) return 0;
  // If there's only one exam, we project a slight standard improvement of +1.5 nets as goal, bounded by max 120
  if (sonuclar.length === 1) return Math.min(120, Number((Number(sonuclar[0].toplam_net) + 1.5).toFixed(1)));

  // Calculate weighted moving average
  let totalWeight = 0;
  let weightedSum = 0;
  for (let i = 0; i < sonuclar.length; i++) {
    const w = i + 1;
    weightedSum += Number(sonuclar[i].toplam_net) * w;
    totalWeight += w;
  }
  const weightedAvg = weightedSum / totalWeight;

  // Calculate weighted trend (consecutive differences)
  let trendSum = 0;
  let trendWeight = 0;
  for (let i = 1; i < sonuclar.length; i++) {
    const diff = Number(sonuclar[i].toplam_net) - Number(sonuclar[i - 1].toplam_net);
    const w = i;
    trendSum += diff * w;
    trendWeight += w;
  }
  const avgTrend = trendWeight > 0 ? (trendSum / trendWeight) : 0;

  // Damp the trend slightly to be realistic and bound it to prevent weird extreme fluctuations
  const dampedTrend = avgTrend * 0.55;
  const boundedTrend = Math.max(-8, Math.min(8, dampedTrend));

  // Add trend to weighted average
  const projectedValue = weightedAvg + dampedTrend;

  // Let's also give a small baseline boost (+0.5 net) representing learning/progression over time
  const withBoost = projectedValue + 0.5;

  return Math.max(0, Math.min(120, Number(withBoost.toFixed(1))));
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Forgot Password flow states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPasswordInput, setResetNewPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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

  const [trialTimeLeftStr, setTrialTimeLeftStr] = useState<string>('');

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
    // Check if there is a custom simulated trial days left
    const simulated = localStorage.getItem('kas_simulated_trial_days');
    if (simulated !== null) {
      const simVal = parseInt(simulated, 10);
      setTrialDaysLeft(Math.max(0, simVal));
      setTrialTimeLeftStr(`${simVal} Gün`);
      return;
    }

    let endIso = user?.deneme_bitis;
    if (!endIso) {
      const savedStart = localStorage.getItem('kas_trial_start');
      if (!savedStart) {
        const now = new Date();
        localStorage.setItem('kas_trial_start', now.toISOString());
        endIso = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        const start = new Date(savedStart);
        endIso = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const endTime = new Date(endIso).getTime();
    const nowTime = currentTime.getTime();
    const diffMs = endTime - nowTime;

    if (diffMs <= 0) {
      setTrialDaysLeft(0);
      setTrialTimeLeftStr("Süre Doldu 🔒");
    } else {
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Ensure trialDaysLeft stays positive until exact expiration to match older checks
      setTrialDaysLeft(days + (hours > 0 || minutes > 0 || seconds > 0 ? 1 : 0));

      let text = "";
      if (days > 0) {
        text = `${days} Gün ${hours} Saat ${minutes} Dakika`;
      } else if (hours > 0) {
        text = `${hours} Saat ${minutes} Dakika ${seconds} Saniye`;
      } else {
        text = `${minutes} Dakika ${seconds} Saniye`;
      }
      setTrialTimeLeftStr(text);
    }
  }, [user, currentTime]);

  useEffect(() => {
    // Check local storage for persistent login session
    const storedUser = localStorage.getItem('kas_user');
    const storedToken = localStorage.getItem('kas_token');
    let currentUserKurumId = 'guest';

    if (storedUser && storedToken) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setToken(storedToken);
      setIsLoggedIn(true);
      currentUserKurumId = String(u.kurum_id);

      // Load specific plan for this user's institution
      const plan = u.abonelik_turu || localStorage.getItem(`kas_subscription_plan_kurum_${u.kurum_id}`) || 'trial';
      setCurrentSubscription(plan);
      localStorage.setItem(`kas_subscription_plan_kurum_${u.kurum_id}`, plan);
      localStorage.setItem('kas_subscription_plan', plan);

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

    // Check for PayTR redirect query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      localStorage.setItem('kas_subscription_plan', 'premium');
      if (currentUserKurumId !== 'guest') {
        localStorage.setItem(`kas_subscription_plan_kurum_${currentUserKurumId}`, 'premium');
      }
      setCurrentSubscription('premium');
      // Clean query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'fail') {
      window.history.replaceState({}, document.title, window.location.pathname);
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

        // Load institution specific subscription plan from backend first, fallback to localStorage/trial
        const plan = data.user.abonelik_turu || localStorage.getItem(`kas_subscription_plan_kurum_${data.user.kurum_id}`) || 'trial';
        setCurrentSubscription(plan);
        localStorage.setItem(`kas_subscription_plan_kurum_${data.user.kurum_id}`, plan);
        localStorage.setItem('kas_subscription_plan', plan);

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

    // 1. Kurum Adı validation
    if (regKurum.trim().length < 6) {
      setRegError("Kurum adı en az 6 karakter olmalıdır.");
      return;
    }

    // 2. Ad Soyad validation
    const cleanName = regName.trim();
    const nameParts = cleanName.split(/\s+/);
    if (nameParts.length < 2 || cleanName.length < 5) {
      setRegError("Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam girin (en az 2 kelime).");
      return;
    }
    const nameRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/;
    if (!nameRegex.test(cleanName)) {
      setRegError("Ad Soyad alanında sadece harfler kullanılabilir.");
      return;
    }

    // 3. Telefon validation
    const cleanPhone = regPhone.replace(/[\s()-]/g, '');
    const phoneRegex = /^(05|5)\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setRegError("Lütfen geçerli bir cep telefonu numarası girin (örn: 05551234567).");
      return;
    }

    // 4. E-posta validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) {
      setRegError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    // 5. Şifre validation
    if (regPassword.length < 6) {
      setRegError("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }
    if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
      setRegError("Şifreniz güvenlik için en az bir harf ve bir rakam içermelidir.");
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

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(resetEmailInput)) {
      setResetError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmailInput })
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess("Şifre sıfırlama kodunuz e-posta adresinize başarıyla gönderildi. Lütfen gelen kutunuzu (ve gereksiz/spam klasörünü) kontrol edin.");
        setResetStep('code');
      } else {
        setResetError(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      setResetError("Sunucu ile bağlantı kurulamadı.");
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetCodeInput.trim().length !== 6) {
      setResetError("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmailInput, code: resetCodeInput })
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess("Kod doğrulandı! Lütfen yeni şifrenizi girin.");
        setResetStep('password');
      } else {
        setResetError(data.error || "Girdiğiniz kod hatalı.");
      }
    } catch (err) {
      setResetError("Sunucu ile bağlantı kurulamadı.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetNewPasswordInput.length < 6) {
      setResetError("Yeni şifreniz en az 6 karakter olmalıdır.");
      return;
    }
    if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(resetNewPasswordInput) || !/[0-9]/.test(resetNewPasswordInput)) {
      setResetError("Şifreniz en az bir harf ve bir rakam içermelidir.");
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmailInput, code: resetCodeInput, yeni_sifre: resetNewPasswordInput })
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess("Şifreniz başarıyla güncellendi! Yeni şifrenizle otomatik olarak giriş yapılıyor...");
        setTimeout(() => {
          setShowForgotPasswordModal(false);
          // Set inputs to trigger successful login
          setEmail(resetEmailInput);
          setSifre(resetNewPasswordInput);
          // Perform login
          handleLogin(null as any, { email: resetEmailInput, sifre: resetNewPasswordInput });
        }, 2500);
      } else {
        setResetError(data.error || "Şifre sıfırlanamadı.");
      }
    } catch (err) {
      setResetError("Sunucu ile bağlantı kurulamadı.");
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
        <header className="hidden md:flex bg-slate-900 border-b border-slate-800/80 px-6 py-3.5 justify-between items-center z-20 shadow-md">
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
                      {isAnnualBilling ? "*Yıllık peşin (₺9.000) faturalandırılır." : "*Aylık (₺950) faturalandırılır."}
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
                  <div className="pt-1">
                    <a
                      href="https://www.instagram.com/kurum_analiz_sistemleri/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 border border-purple-500/20 hover:border-pink-500/35 rounded-xl text-slate-300 hover:text-pink-400 text-[10px] font-bold transition duration-300"
                    >
                      <Instagram size={11} className="text-pink-500" />
                      <span>@kurum_analiz_sistemleri</span>
                    </a>
                  </div>
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
                      <span className="text-blue-400">✉</span> k.a.s@kurumanaliz.com
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-400">📞</span> +90 542 610 5632
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-400">📸</span> <a href="https://www.instagram.com/kurum_analiz_sistemleri/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition">@kurum_analiz_sistemleri</a>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-blue-400 shrink-0 mt-0.5">📍</span> 
                      <span>Esentepe Mah. Büyükdere Cad. No:127 Astoria Towers A Blok Kat:8 Şişli / İstanbul</span>
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
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPasswordModal(true);
                          setResetStep('email');
                          setResetEmailInput('');
                          setResetCodeInput('');
                          setResetNewPasswordInput('');
                          setResetError('');
                          setResetSuccess('');
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer focus:outline-none transition-colors"
                      >
                        Şifremi Unuttum?
                      </button>
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

          {/* FORGOT PASSWORD MODAL POPUP */}
          {showForgotPasswordModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-left">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 bg-slate-950/50 p-2 rounded-xl border border-slate-800 transition cursor-pointer text-xs font-bold"
                >
                  ✕ Kapat
                </button>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                    <Key size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-100 font-sans">
                    Şifremi Sıfırla
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {resetStep === 'email' && "Kayıtlı e-posta adresinizi girerek 6 haneli güvenlik kodu talep edin."}
                    {resetStep === 'code' && "E-postanıza (veya simülasyon olarak aşağıya) gönderilen 6 haneli sıfırlama kodunu girin."}
                    {resetStep === 'password' && "Lütfen hesabınız için yeni, güvenli bir şifre belirleyin."}
                  </p>
                </div>

                {resetError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={15} /> {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <CheckCircle size={15} /> {resetSuccess}
                  </div>
                )}

                {/* STEP 1: REQUEST CODE */}
                {resetStep === 'email' && (
                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">E-posta Adresi</label>
                      <input
                        type="email"
                        required
                        placeholder="ornek@kurum.com"
                        value={resetEmailInput}
                        onChange={e => setResetEmailInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/10 flex justify-center items-center gap-2 cursor-pointer"
                    >
                      Sıfırlama Kodu Gönder ⚡
                    </button>
                  </form>
                )}

                {/* STEP 2: VERIFY CODE */}
                {resetStep === 'code' && (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">6 Haneli Doğrulama Kodu</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={resetCodeInput}
                        onChange={e => setResetCodeInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-center tracking-widest font-black text-slate-100 text-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/10 flex justify-center items-center gap-2 cursor-pointer"
                    >
                      Kodu Doğrula 🔍
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetStep('email')}
                      className="w-full text-slate-400 hover:text-slate-300 text-[11px] font-bold text-center block mt-2 cursor-pointer"
                    >
                      Geri Dön (E-posta Değiştir)
                    </button>
                  </form>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {resetStep === 'password' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Yeni Şifre</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={resetNewPasswordInput}
                        onChange={e => setResetNewPasswordInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[9px] text-slate-500 font-bold mt-1 block leading-normal">
                        Güvenlik için en az 6 karakter, 1 harf ve 1 rakam içermelidir.
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/10 flex justify-center items-center gap-2 cursor-pointer"
                    >
                      Şifreyi Güncelle & Giriş Yap 🎉
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

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
        </div>
      ) : (
        /* REGISTERED USER WORKSPACE SIDEBAR + VIEWS SYSTEM */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
          
          {/* Mobile Header Bar */}
          <div className="md:hidden w-full bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
                <img src="/favicon.svg" alt="K.A.S" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block leading-none">Kurum Analiz</span>
                <h1 className="text-xs font-black text-slate-100 tracking-wide max-w-[140px] truncate">{user.kurum_adi || "Kurum Kayıtlı Değil"}</h1>
              </div>
            </div>

            {/* Current Tab Badge */}
            <div className="bg-slate-950/60 border border-slate-800/60 px-2 py-0.5 rounded-lg">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {currentTab === 'dashboard' && 'ÖZET'}
                {currentTab === 'veli-panel' && 'KARNE'}
                {currentTab === 'ogrenci-panel' && 'KARNEM'}
                {currentTab === 'ogrenci' && 'ÖĞRENCİLER'}
                {currentTab === 'pdf' && 'PDF OKUYUCU'}
                {currentTab === 'mesaj' && 'MESAJLAR'}
                {currentTab === 'abonelik' && 'ABONELİK'}
                {currentTab === 'tanimlar_sinif' && 'Sınıflar'}
                {currentTab === 'tanimlar_ogrenci' && 'Öğrenciler'}
                {currentTab === 'tanimlar_ogretmen' && 'Öğretmenler'}
                {currentTab === 'tanimlar_rehber' && 'Rehberler'}
                {currentTab === 'tanimlar_veli' && 'Veliler'}
                {currentTab === 'tanimlar_sinav' && 'Sınavlar'}
                {currentTab === 'tanimlar_ders_programi' && 'Ders Prog.'}
                {currentTab === 'risk_limitleri' && 'Risk'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 cursor-pointer transition flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-0 top-[53px] bottom-0 bg-slate-950/98 backdrop-blur-xl z-40 p-4 flex flex-col justify-between overflow-y-auto border-t border-slate-900 md:hidden"
              >
                <div className="space-y-4">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1">Menü Seçenekleri</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {/* Tab: Dashboard (All staff roles) */}
                    {user.rol !== 'veli' && user.rol !== 'ogrenci' && (
                      <button
                        onClick={() => { setCurrentTab('dashboard'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'dashboard'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <LayoutDashboard size={14} /> Genel Özet
                      </button>
                    )}

                    {/* Tab: Veli Panel */}
                    {user.rol === 'veli' && (
                      <button
                        onClick={() => { setCurrentTab('veli-panel'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'veli-panel'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <Award size={14} /> Gelişim Karnesi
                      </button>
                    )}

                    {/* Tab: Student Panel */}
                    {user.rol === 'ogrenci' && (
                      <button
                        onClick={() => { setCurrentTab('ogrenci-panel'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'ogrenci-panel'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <Award size={14} /> Gelişim Karnem
                      </button>
                    )}

                    {/* Tab: Öğrenci Yönetimi */}
                    {user.rol !== 'admin' && user.rol !== 'veli' && user.rol !== 'ogrenci' && (
                      <button
                        onClick={() => { setCurrentTab('ogrenci'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'ogrenci'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <Users size={14} /> Öğrenci Yönetimi
                      </button>
                    )}

                    {/* Tab: PDF Sonuç Okuma */}
                    {(user.rol === 'admin' || user.rol === 'rehber') && (
                      <button
                        onClick={() => { setCurrentTab('pdf'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'pdf'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <Sparkles size={14} /> PDF Sınav Okuyucu
                      </button>
                    )}

                    {/* Tab: Mesajlaşma */}
                    <button
                      onClick={() => { setCurrentTab('mesaj'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                        currentTab === 'mesaj'
                          ? "bg-blue-600 text-white shadow"
                          : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                      }`}
                    >
                      <Mail size={14} /> Mesaj Merkezi
                    </button>

                    {/* Tab: Abonelik & Ödeme */}
                    {user.rol === 'admin' && (
                      <button
                        onClick={() => { setCurrentTab('abonelik'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer ${
                          currentTab === 'abonelik'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }`}
                      >
                        <Coins size={14} /> Abonelik & Ödeme
                      </button>
                    )}
                  </div>

                  {/* Admin Specific Kurum Tanımları in Mobile Drawer */}
                  {user.rol === 'admin' && (
                    <div className="pt-3 border-t border-slate-900 space-y-1.5">
                      <div className="px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Kurum Tanımları (Admin)
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => { setCurrentTab('tanimlar_sinif'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_sinif' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Layers size={11} /> Sınıflar
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_ogrenci'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_ogrenci' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Users size={11} /> Öğrenciler
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_ogretmen'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_ogretmen' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Users size={11} /> Öğretmenler
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_rehber'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_rehber' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Award size={11} /> Rehberler
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_veli'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_veli' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Shield size={11} /> Veliler
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_sinav'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_sinav' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <BookOpen size={11} /> Sınavlar
                        </button>
                        <button
                          onClick={() => { setCurrentTab('tanimlar_ders_programi'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'tanimlar_ders_programi' ? "bg-blue-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Calendar size={11} /> Programlar
                        </button>
                        <button
                          onClick={() => { setCurrentTab('risk_limitleri'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold rounded-lg w-full text-left transition cursor-pointer ${
                            currentTab === 'risk_limitleri' ? "bg-amber-600 text-white" : "bg-slate-900/40 text-slate-400"
                          }`}
                        >
                          <Activity size={11} /> Risk Tanımı
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-900 mt-6 space-y-3">
                  {/* License Info */}
                  <div className="bg-slate-900/60 border border-slate-850/60 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Lisans Durumu</span>
                      <span className="text-[10px] text-slate-300 font-extrabold">
                        {currentSubscription === 'trial' ? `Deneme Sürümü (${trialTimeLeftStr || `${trialDaysLeft} Gün`})` : "Sınırsız Premium 💎"}
                      </span>
                    </div>
                    {user.rol === 'admin' && currentSubscription === 'trial' && (
                      <button
                        onClick={() => { setCurrentTab('abonelik'); setIsMobileMenuOpen(false); }}
                        className="text-[9px] bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded-lg"
                      >
                        Yükselt ⚡
                      </button>
                    )}
                  </div>

                  {/* Profile & Logout */}
                  <div className="flex items-center justify-between bg-slate-900/30 p-2.5 rounded-2xl border border-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-xs text-blue-400">
                        {user.ad_soyad[0]}
                      </div>
                      <div>
                        <span className="text-[11px] font-black block text-slate-200">{user.ad_soyad}</span>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-extrabold">{user.rol}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 cursor-pointer transition text-[10px] font-black flex items-center gap-1.5"
                    >
                      <LogOut size={12} /> Çıkış
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Navigation (Desktop Only) */}
          <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-4 space-y-4 z-10 shrink-0">
            
            {/* Nav tabs list */}
            <div className="flex flex-col gap-1 w-full">
              
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
                  {currentSubscription === 'trial' ? `Deneme Sürümü (${trialTimeLeftStr || `${trialDaysLeft} Gün`})` : "Sınırsız Premium 💎"}
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
                  trialTimeLeftStr={trialTimeLeftStr}
                  onUpgradeSuccess={(newPlan) => {
                    setCurrentSubscription(newPlan);
                    localStorage.setItem('kas_subscription_plan', newPlan);
                    if (user && user.kurum_id) {
                      localStorage.setItem(`kas_subscription_plan_kurum_${user.kurum_id}`, newPlan);
                    }
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
                    trialTimeLeftStr={trialTimeLeftStr}
                    onUpgradeSuccess={(newPlan) => {
                      setCurrentSubscription(newPlan);
                      localStorage.setItem('kas_subscription_plan', newPlan);
                      if (user && user.kurum_id) {
                        localStorage.setItem(`kas_subscription_plan_kurum_${user.kurum_id}`, newPlan);
                      }
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
                                // We use division by count to leave a slot at the end for the projection point
                                const stepX = (500 - 80) / count;

                                childReport.sonuclar.forEach((res, index) => {
                                  const x = 40 + index * stepX;
                                  const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                  points.push(`${x},${y}`);
                                });

                                // Calculate the expected projection for the upcoming practice exam
                                const projectedNet = getProjectedNet(childReport.sonuclar);
                                const projX = 40 + count * stepX;
                                const projY = 150 - (projectedNet / 120) * 130 - 10;
                                const lastX = 40 + (count - 1) * stepX;
                                const lastY = 150 - (Number(childReport.sonuclar[count - 1].toplam_net) / 120) * 130 - 10;

                                return (
                                  <>
                                    {/* Actual scores path */}
                                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points.join(' ')} />
                                    
                                    {/* Projection dashed line from last actual to projected */}
                                    <line 
                                      x1={lastX} 
                                      y1={lastY} 
                                      x2={projX} 
                                      y2={projY} 
                                      stroke="#f59e0b" 
                                      strokeWidth="2.5" 
                                      strokeDasharray="4,4" 
                                    />

                                    {/* Actual points */}
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

                                    {/* Projected upcoming exam point */}
                                    <g>
                                      <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                                      <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                                      <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black" textAnchor="middle">{projectedNet}</text>
                                      <text x={projX} y="148" fill="#f59e0b" className="text-[8px] font-black tracking-wider uppercase" textAnchor="middle">Sıradaki (Beklenen 🎯)</text>
                                    </g>
                                  </>
                                );
                              })()}
                            </svg>
                            <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                                <span>Gerçekleşen Netler</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                                <span className="text-amber-400">Gelecek Sınav Projeksiyonu (Beklenen Net)</span>
                              </span>
                              <span className="text-slate-600 font-medium">• Yatay: Denemeler | Dikey: Net Skorları</span>
                            </div>
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
                                // We use division by count to leave a slot at the end for the projection point
                                const stepX = (500 - 80) / count;

                                studentReport.sonuclar.forEach((res, index) => {
                                  const x = 40 + index * stepX;
                                  const y = 150 - (res.toplam_net / 120) * 130 - 10;
                                  points.push(`${x},${y}`);
                                });

                                // Calculate the expected projection for the upcoming practice exam
                                const projectedNet = getProjectedNet(studentReport.sonuclar);
                                const projX = 40 + count * stepX;
                                const projY = 150 - (projectedNet / 120) * 130 - 10;
                                const lastX = 40 + (count - 1) * stepX;
                                const lastY = 150 - (Number(studentReport.sonuclar[count - 1].toplam_net) / 120) * 130 - 10;

                                return (
                                  <>
                                    {/* Actual scores path */}
                                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points.join(' ')} />
                                    
                                    {/* Projection dashed line from last actual to projected */}
                                    <line 
                                      x1={lastX} 
                                      y1={lastY} 
                                      x2={projX} 
                                      y2={projY} 
                                      stroke="#f59e0b" 
                                      strokeWidth="2.5" 
                                      strokeDasharray="4,4" 
                                    />

                                    {/* Actual points */}
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

                                    {/* Projected upcoming exam point */}
                                    <g>
                                      <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                                      <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                                      <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black" textAnchor="middle">{projectedNet}</text>
                                      <text x={projX} y="148" fill="#f59e0b" className="text-[8px] font-black tracking-wider uppercase" textAnchor="middle">Sıradaki (Beklenen 🎯)</text>
                                    </g>
                                  </>
                                );
                              })()}
                            </svg>
                            <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                                <span>Gerçekleşen Netler</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                                <span className="text-amber-400">Gelecek Sınav Projeksiyonu (Beklenen Net)</span>
                              </span>
                              <span className="text-slate-600 font-medium">• Yatay: Denemeler | Dikey: Net Skorları</span>
                            </div>
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
