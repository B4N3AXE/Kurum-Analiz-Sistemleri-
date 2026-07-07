import React, { useState, useEffect } from 'react';
import { User, Ogrenci } from './types';
import Dashboard from './components/Dashboard';
import OgrenciPaneli from './components/OgrenciPaneli';
import PdfOkuyucu from './components/PdfOkuyucu';
import Mesajlar from './components/Mesajlar';
import Tanimlar from './components/Tanimlar';
import { Layers, Users, Sparkles, Mail, Settings, LogOut, Award, Shield, LayoutDashboard, UserCheck, LogIn, ChevronRight, HelpCircle, AlertCircle, GraduationCap, Activity, Calendar, Clock, Check, Zap, TrendingUp, Coins, MessageSquare, BookOpen, CheckCircle, ArrowRight, Star } from 'lucide-react';

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
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [studentCountSlider, setStudentCountSlider] = useState(150);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
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
            <div className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Layers size={18} />
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
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                  <Layers size={22} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Kişiselleştirilmiş Eğitim Yönetimi</span>
                  <h1 className="text-lg font-black text-slate-100 flex items-center gap-1.5 leading-none">
                    K.A.S <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/15 font-black px-1.5 py-0.5 rounded-md">PRO SaaS v2.1</span>
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

              {/* Hero Section */}
              <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/10 shadow-inner">
                <Sparkles size={11} className="animate-pulse text-blue-400" /> %94 Zaman Tasarrufu & Akıllı Eğitim Otomasyonu
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400">
                Eğitim Kurumunuz İçin <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">Uçtan Uca Takip & Satış</span> SaaS Çözümü
              </h2>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium max-w-2xl">
                YKS hazırlık sınavı PDF'lerini 3 saniyede okuyun, öğrencilerinize özel 1-1 birebir dersleri ve haftalık programları saniyeler içinde planlayın. Velilere otomatik gelişim raporları ve gerçek zamanlı bildirimler göndererek okulunuzun marka değerini katlayın.
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
                  <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">ŞEFFAF LİSANSLAMA</span>
                  <h3 className="text-2xl font-extrabold text-slate-100">Büyümenize Uygun Fiyatlandırma</h3>
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

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Gelişim (Growth)",
                    limit: "Maksimum 120 Öğrenci",
                    priceMonthly: 750,
                    priceAnnual: 599,
                    features: ["Yönetici & Öğretmen Girişleri", "Canlı YKS Sınav Analizi", "OCR / PDF Sonuç Taraması", "Öğrenci & Veli Raporları", "Haftalık Birebir Ders Planlama", "E-posta Destek Hattı"],
                    cta: "Gelişim'i Dene",
                    popular: false,
                    color: "border-slate-900 bg-slate-900/10"
                  },
                  {
                    title: "Profesyonel (Pro)",
                    limit: "Maksimum 350 Öğrenci",
                    priceMonthly: 1500,
                    priceAnnual: 1199,
                    features: ["Gelişim'deki Tüm Özellikler", "Akıllı Rehberlik & Görüşme Günlüğü", "Gelişmiş SVG Grafik Çıktıları", "YKS Hedef ve Sayaç Entegrasyonu", "7/24 Telefon & Whatsapp Desteği", "Özel Veri Aktarım Desteği"],
                    cta: "En Popüler Seçenek",
                    popular: true,
                    color: "border-blue-500/45 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                  },
                  {
                    title: "Kurumsal (Enterprise)",
                    limit: "Sınırsız Öğrenci & Çoklu Şube",
                    priceMonthly: 2500,
                    priceAnnual: 1999,
                    features: ["Profesyonel'deki Tüm Özellikler", "Multi-Şube Yönetim Portalı", "Özel Kurum Logosu & Domain", "Özel API ve Dışa Aktarımlar", "Yıllık Taahhüt Avantajları", "Özel Müşteri Başarı Temsilcisi"],
                    cta: "Kurumsal İletişim",
                    popular: false,
                    color: "border-slate-900 bg-slate-900/10"
                  }
                ].map((plan, i) => (
                  <div key={i} className={`border rounded-3xl p-6 space-y-6 flex flex-col justify-between relative ${plan.color} hover:border-slate-750 transition-all duration-300`}>
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider border border-blue-400">
                        EN POPÜLER
                      </span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-100">{plan.title}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{plan.limit}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-50 tracking-tight">
                          {plan.popular && plan.popular 
                            ? (isAnnualBilling ? "₺1.199" : "₺1.500") 
                            : plan.title.includes("Gelişim") 
                              ? (isAnnualBilling ? "₺599" : "₺750") 
                              : (isAnnualBilling ? "₺1.999" : "₺2.500")
                          }
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">/aylık</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block font-bold">
                        {isAnnualBilling ? "*Yıllık peşin faturalandırılır." : "*Aylık faturalandırılır, iptal edilebilir."}
                      </span>

                      <div className="border-t border-slate-900/60 pt-4 space-y-2">
                        {plan.features.map((f, idx) => (
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
                        setRegKurum(`Atatürk Anadolu Lisesi (SaaS ${plan.title.split(' ')[0]})`);
                        setShowAuthScreen(true);
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        plan.popular 
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10"
                          : "bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-850"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
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
            <div className="text-center text-[10px] text-slate-500 font-bold pt-8 border-t border-slate-900/40">
              © 2026 K.A.S SaaS Inc. Tüm hakları saklıdır. Eğitim Kurumları Yönetim ve Birebir Ders Otomasyon Platformu.
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
                  <div className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <Layers size={14} />
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

              {/* Tab: Öğrenci Yönetimi (Admin, Öğretmen, Rehber) */}
              {user.rol !== 'veli' && user.rol !== 'ogrenci' && (
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

              {/* Tab: Kurum Ayarları / Tanımlamalar (Only Admin) */}
              {user.rol === 'admin' && (
                <button
                  onClick={() => setCurrentTab('tanimlar')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 ${
                    currentTab === 'tanimlar'
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <Settings size={15} /> Kurum Yönetimi
                </button>
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

              <div className="text-[10px] text-slate-500 font-bold space-y-0.5 px-1">
                <p>Kurum Analiz Sistemi v1.5</p>
                <p className="text-[9px] text-slate-600 font-semibold">© 2026 K.A.S Portal • Premium</p>
              </div>
            </div>
          </aside>

          {/* Core App Viewport */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            
            {/* MOUNT VIEW: Dashboard */}
            {currentTab === 'dashboard' && user.rol !== 'veli' && (
              <Dashboard user={user} token={token} />
            )}

            {/* MOUNT VIEW: Student Lifecycle Panel */}
            {currentTab === 'ogrenci' && user.rol !== 'veli' && (
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
          </main>
        </div>
      )}
    </div>
  );
}
