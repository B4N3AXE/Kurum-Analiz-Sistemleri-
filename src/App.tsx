import React, { useState, useEffect } from 'react';
import { User, Ogrenci } from './types';
import Dashboard, { getTopicAnalysisForStudent, TYT_SUBJECT_TOPICS, LGS_SUBJECT_TOPICS, AYT_SAY_SUBJECT_TOPICS, AYT_EA_SUBJECT_TOPICS, AYT_SOZ_SUBJECT_TOPICS } from './components/Dashboard';
import OgrenciPaneli from './components/OgrenciPaneli';
import PdfOkuyucu from './components/PdfOkuyucu';
import Mesajlar from './components/Mesajlar';
import Tanimlar from './components/Tanimlar';
import Abonelik from './components/Abonelik';
import RiskLimitleri from './components/RiskLimitleri';
import AiChatWidget from './components/AiChatWidget';
import { Home, Layers, Users, Sparkles, Mail, Settings, LogOut, Award, Shield, LayoutDashboard, UserCheck, LogIn, ChevronRight, HelpCircle, AlertCircle, GraduationCap, Activity, Calendar, Clock, Check, Zap, TrendingUp, Coins, MessageSquare, BookOpen, CheckCircle, ArrowRight, Star, FileText, Menu, X, Instagram, Key, Target, Eye, Send, Trash2, Play, Pause, RotateCcw, Plus, Square, CheckSquare } from 'lucide-react';
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
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Intro Animation State
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  // PWA & Installation States
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroComplete(true);
    }, 2600); // 2.6 seconds centered intro, then slide into place!
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    // Detect iOS devices
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    if (isIosDevice) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPwaBanner(true), 6000);
        return () => clearTimeout(timer);
      }
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setPwaPrompt(e);
        const dismissed = localStorage.getItem('pwa-android-dismissed');
        if (!dismissed) {
          const timer = setTimeout(() => setShowPwaBanner(true), 6000);
          return () => clearTimeout(timer);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    console.log(`K.A.S. Kurulum tercihi: ${outcome}`);
    setPwaPrompt(null);
    setShowPwaBanner(false);
  };

  const handleDismissPwa = () => {
    if (isIos) {
      localStorage.setItem('pwa-ios-dismissed', 'true');
    } else {
      localStorage.setItem('pwa-android-dismissed', 'true');
    }
    setShowPwaBanner(false);
  };

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
  const [childReport, setChildReport] = useState<{
    student: Ogrenci;
    sonuclar: any[];
    notlar: any[];
    ders_programi?: any[];
    tavsiyeler?: any[];
    veli_notlari?: any[];
  } | null>(null);
  const [childAiSummary, setChildAiSummary] = useState<string | null>(null);
  const [loadingChildAi, setLoadingChildAi] = useState(false);
  const [loadingChild, setLoadingChild] = useState(false);
  const [veliChartTab, setVeliChartTab] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');
  const [newVeliNote, setNewVeliNote] = useState('');

  // Student profile lookups
  const [studentReport, setStudentReport] = useState<{
    student: Ogrenci;
    sonuclar: any[];
    notlar: any[];
    ders_programi?: any[];
    tavsiyeler?: any[];
    konu_takip?: any[];
    calisma_seanslari?: any[];
    haftalik_gorevler?: any[];
  } | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentChartTab, setStudentChartTab] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');
  const [isEditingTargetNet, setIsEditingTargetNet] = useState(false);
  const [tempTargetNet, setTempTargetNet] = useState<number>(95);
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);
  const [studentSelectedKarneExamId, setStudentSelectedKarneExamId] = useState<number | null>(null);

  // Expanded Student Panel states (Features 1, 2, 4)
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(25);
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerSubject, setTimerSubject] = useState<string>('Matematik');
  const [expandedChecklistSubject, setExpandedChecklistSubject] = useState<string | null>(null);
  const [studentKonuTakipTab, setStudentKonuTakipTab] = useState<'tyt' | 'ayt'>('tyt');
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskDay, setNewTaskDay] = useState<string>('Pazartesi');
  const [newTaskSubject, setNewTaskSubject] = useState<string>('Matematik');

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
  const [previewTab, setPreviewTab] = useState<'admin' | 'student' | 'pdf' | 'birebir' | 'risk' | 'ai_reco'>('admin');
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'kvkk' | 'terms' | 'legal' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === 'pomodoro') {
            if (prev <= 1) {
              setTimerIsRunning(false);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerMode]);

  // Synchronize student active study timer state with server (Features 1, 2, 4)
  useEffect(() => {
    if (!user || user.rol !== 'ogrenci' || !token) return;

    const reportActiveSession = async () => {
      try {
        await fetch(`/api/ogrenci/${user.id}/aktif-seans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            ders_adi: timerSubject,
            mod: timerMode,
            kalan_sure: timerSeconds,
            toplam_sure: timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0,
            calisiyor: timerIsRunning
          })
        });
      } catch (err) {
        // Fail silently in development/sandbox if server isn't ready
      }
    };

    // Report immediately on change
    reportActiveSession();

    // Report periodically (every 10 seconds) if timer is running
    let heartbeatInterval: any = null;
    if (timerIsRunning) {
      heartbeatInterval = setInterval(() => {
        reportActiveSession();
      }, 10000);
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [user, token, timerIsRunning, timerSeconds, timerSubject, timerMode, pomodoroMinutes]);

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
        const data = await resDetail.json();
        setStudentReport(data);
        if (data.student && data.student.hedef_net) {
          setTempTargetNet(data.student.hedef_net);
        }
      }
    } catch (err) {
      console.error("Öğrenci bilgisi yükleme hatası:", err);
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleSaveTargetNet = async (newVal: number) => {
    if (!studentReport || !token) return;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ hedef_net: newVal })
      });
      if (res.ok) {
        setStudentReport(prev => prev ? {
          ...prev,
          student: {
            ...prev.student,
            hedef_net: newVal
          }
        } : null);
        setIsEditingTargetNet(false);
      }
    } catch (err) {
      console.error("Öğrenci hedef net güncellenemedi:", err);
    }
  };

  const handleToggleTopic = async (topicKey: string, currentStatus: boolean) => {
    if (!studentReport || !token) return;
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}/konu-takip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ konu_key: topicKey, tamamlandi: newStatus })
      });
      if (res.ok) {
        setStudentReport(prev => {
          if (!prev) return null;
          const existingList = prev.konu_takip || [];
          const exists = existingList.some(kt => kt.konu_key === topicKey);
          let newList;
          if (exists) {
            newList = existingList.map(kt => kt.konu_key === topicKey ? { ...kt, tamamlandi: newStatus, tarih: new Date().toISOString() } : kt);
          } else {
            newList = [...existingList, { id: Date.now(), ogrenci_id: prev.student.id, konu_key: topicKey, tamamlandi: newStatus, tarih: new Date().toISOString() }];
          }
          return {
            ...prev,
            konu_takip: newList
          };
        });
      }
    } catch (err) {
      console.error("Konu tamamlanma durumu değiştirilemedi:", err);
    }
  };

  const handleSaveTimerSession = async (courseName: string, durationSeconds: number) => {
    if (!studentReport || !token || durationSeconds <= 0) return;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}/calisma-seanslari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ ders_adi: courseName, sure: durationSeconds })
      });
      if (res.ok) {
        const savedSession = await res.json();
        setStudentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            calisma_seanslari: [savedSession, ...(prev.calisma_seanslari || [])]
          };
        });
        setTimerSeconds(timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0);
        setTimerIsRunning(false);
      }
    } catch (err) {
      console.error("Çalışma seansı kaydedilemedi:", err);
    }
  };

  const handleCreateWeeklyTask = async () => {
    if (!studentReport || !token || !newTaskText.trim()) return;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}/haftalik-gorevler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          gorev_metni: newTaskText.trim(),
          ders_adi: newTaskSubject,
          gun: newTaskDay
        })
      });
      if (res.ok) {
        const savedTask = await res.json();
        setStudentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            haftalik_gorevler: [...(prev.haftalik_gorevler || []), savedTask]
          };
        });
        setNewTaskText('');
      }
    } catch (err) {
      console.error("Haftalık görev oluşturulamadı:", err);
    }
  };

  const handleToggleWeeklyTask = async (taskId: number, currentCompleted: boolean) => {
    if (!studentReport || !token) return;
    const newStatus = !currentCompleted;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}/haftalik-gorevler/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ tamamlandi: newStatus })
      });
      if (res.ok) {
        setStudentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            haftalik_gorevler: (prev.haftalik_gorevler || []).map(t => t.id === taskId ? { ...t, tamamlandi: newStatus } : t)
          };
        });
      }
    } catch (err) {
      console.error("Görev tamamlanma durumu değiştirilemedi:", err);
    }
  };

  const handleDeleteWeeklyTask = async (taskId: number) => {
    if (!studentReport || !token) return;
    try {
      const res = await fetch(`/api/ogrenci/${studentReport.student.id}/haftalik-gorevler/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      if (res.ok) {
        setStudentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            haftalik_gorevler: (prev.haftalik_gorevler || []).filter(t => t.id !== taskId)
          };
        });
      }
    } catch (err) {
      console.error("Görev silinemedi:", err);
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
          
          setLoadingChildAi(true);
          const aiRes = await fetch(`/api/ogrenci/${child.id}/ai-veli-ozeti`, { headers: { 'Authorization': sessionToken } });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            setChildAiSummary(aiData.ozet);
          }
          setLoadingChildAi(false);
        }
      }
    } catch (err) {
      console.error("Veli çocuk bilgisi yükleme hatası:", err);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleAddVeliNote = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newVeliNote.trim() || !childReport || !token) return;

    try {
      const res = await fetch(`/api/ogrenci/${childReport.student.id}/veli-not`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          veli_id: user?.id,
          veli_adi: user?.ad_soyad,
          not_metni: newVeliNote
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChildReport(prev => prev ? {
          ...prev,
          veli_notlari: [data.veliNot, ...(prev.veli_notlari || [])]
        } : null);
        setNewVeliNote('');
      }
    } catch (err) {
      console.error("Veli geri bildirim ekleme hatası:", err);
    }
  };

  const handleDeleteVeliNoteInParentPanel = async (noteId: number) => {
    if (!childReport || !token) return;
    try {
      const res = await fetch(`/api/ogrenci/${childReport.student.id}/veli-not/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setChildReport(prev => prev ? {
          ...prev,
          veli_notlari: (prev.veli_notlari || []).filter(n => n.id !== noteId)
        } : null);
      }
    } catch (err) {
      console.error("Veli geri bildirim silme hatası:", err);
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
    <div className={`bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-300 ${isLoggedIn ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
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
        <div className="flex-1 flex flex-col min-h-screen bg-slate-950 relative overflow-hidden">
          
          {/* 1. INTRO ANIMATION SCREEN (Centered Logo flying into place) */}
          <div 
            className={`fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 transition-all duration-1000 ease-in-out ${
              (!isIntroComplete && !showAuthScreen) 
                ? "opacity-100 pointer-events-auto" 
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="text-center space-y-8 flex flex-col items-center justify-center">
              {!isIntroComplete && !showAuthScreen && (
                <motion.div 
                  layoutId="hero-logo-card"
                  className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] p-1.5 bg-slate-950 rounded-[2.5rem] border border-slate-900 shadow-2xl relative overflow-hidden"
                  transition={{ type: "spring", stiffness: 45, damping: 14 }}
                >
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-40"></div>
                  <img 
                    src="/logo.svg" 
                    alt="K.A.S Logo" 
                    className="w-full h-full object-contain rounded-[2.2rem] shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
              
              <div className={`space-y-2 max-w-md mx-auto transition-all duration-500 ${
                (!isIntroComplete && !showAuthScreen) ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}>
                <span className="text-[11px] font-black tracking-[0.25em] text-blue-400 uppercase block">YAPAY ZEKA DESTEKLİ EĞİTİM YÖNETİMİ</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-500 tracking-tight leading-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">Yapay Zeka Destekli</span><br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-extrabold mt-1 inline-block">Kurum Analiz Sistemine Hoş Geldiniz</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Gelişmiş yapay zeka algoritmalarıyla, yüklediğiniz PDF sınav sonuçlarını saniyeler içinde analiz edin, veli ve öğrencilerinizle anlık paylaşın.</p>
              </div>
            </div>
          </div>

          {/* Left Side: Professional SaaS Marketing & Pitch Panel (Scrollable) */}
          <div className={`flex-1 ${showAuthScreen ? 'hidden' : 'flex flex-col'} lg:h-screen lg:overflow-y-auto px-6 md:px-12 lg:px-16 py-12 lg:py-20 space-y-16 scrollbar-thin bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}>
            
            {/* Header / Brand */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={isIntroComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex items-center justify-between border-b border-slate-900/40 pb-4 max-w-7xl mx-auto w-full"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-blue-600/5 rounded-xl border border-slate-800 shadow-lg shadow-blue-500/5">
                  <img src="/favicon.svg" alt="Kurum Analiz Logo" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Yapay Zeka Destekli Eğitim Yönetimi</span>
                  <h1 className="text-lg font-black text-slate-100 flex items-center gap-1.5 leading-none">
                    Kurum Analiz <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800/80 font-semibold px-2 py-0.5 rounded-full tracking-wide">Yapay Zeka Altyapısı</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-400">
                  <a href="#nasil-calisir" className="hover:text-blue-400 transition">Nasıl Çalışır?</a>
                  <a href="#ozellikler" className="hover:text-blue-400 transition">Özellikler</a>
                  <a href="#fiyatlandirma" className="hover:text-blue-400 transition">Abonelik & Deneme</a>
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
            </motion.div>
 
            {/* Inner Marketing Wrapper (Centers and boundaries the content when full-width) */}
            <div className="max-w-7xl mx-auto w-full space-y-16 flex-1">
 
              {/* Hero Section with 2-Column Layout */}
              <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
                {/* Hero Text Column */}
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  animate={isIntroComplete ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className="flex-1 space-y-6"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/10 shadow-inner">
                    <Sparkles size={11} className="animate-pulse text-blue-400" /> Yapay Zeka Destekli %94 Zaman Tasarrufu & Eğitim Otomasyonu
                  </span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400">
                    Eğitim Kurumları İçin <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">Yapay Zeka Destekli Kurum Analiz</span> Sistemi
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold max-w-xl">
                    Gelişmiş yapay zeka algoritmalarıyla, yüklediğiniz PDF sınav sonuçlarını saniyeler içinde analiz edin. Birebir ders programlarını ve veli bilgilendirmelerini tek ekrandan yöneterek kurumunuza zaman kazandırın, veli memnuniyetini zirveye taşıyın.
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
                </motion.div>
 
                  {/* Hero Logo Column */}
                  <div className="w-full lg:w-[420px] flex justify-center items-center">
                    {isIntroComplete && (
                      <motion.div 
                        layoutId="hero-logo-card"
                        className="relative group p-1.5 bg-slate-950 rounded-[2.5rem] border border-slate-900 shadow-2xl overflow-hidden w-full max-w-sm lg:max-w-none cursor-pointer"
                        transition={{ type: "spring", stiffness: 45, damping: 14 }}
                      >
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <img 
                          src="/logo.svg" 
                          alt="Kurum Analiz Sistemleri Logo" 
                          className="w-full aspect-square object-contain rounded-[2.2rem] shadow-inner transform group-hover:scale-[1.02] transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    )}
                  </div>
              </div>

            {/* Nasıl Çalışır? - İlk Defa Girenler İçin Hızlı Başlangıç Kılavuzu */}
            <div id="nasil-calisir" className="space-y-6 scroll-mt-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black rounded-md uppercase tracking-wider">PRESTİJLİ BAŞLANGIÇ</span>
                <h3 className="text-sm font-bold text-slate-200">Yapay Zeka Destekli Kurum Analiz Nasıl Çalışır? (3 Adımda Tam Otomasyon)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Yapay Zeka Destekli Kurum Analiz ve Birebir Ders Yönetim Platformu ile dijital dönüşümünüzü tamamlamak çok kolay. Karmaşık kurulum süreçleriyle vakit kaybetmeden, sadece 3 basit adımda geleceğin eğitim teknolojisine geçiş yapın:
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
                  <h3 className="text-2xl font-extrabold text-slate-100">Kurum Analiz Sistemi Panel Tasarımını Keşfedin</h3>
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
                  { id: "birebir", label: "Birebir Planlama" },
                  { id: "risk", label: "Akademik Risk Limitleri" },
                  { id: "ai_reco", label: "Yapay Zeka Tavsiye & Tahmin" }
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

                  {previewTab === 'risk' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">AKADEMİK RİSK SINIRLARI</span>
                          <h4 className="text-sm font-extrabold text-slate-100">Dinamik Risk Eşikleri & Erken Uyarı Sistemi</h4>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black">Erken Müdahale</span>
                      </div>

                      {/* Threshold Configurator */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { exam: "TYT Eşiği", math: "20.0 Net", verbal: "25.0 Net", total: "60.0 Net", alert: "3 Öğrenci Riskte", color: "border-red-500/30 bg-red-500/5 text-red-400 animate-pulse" },
                          { exam: "AYT Eşiği", math: "15.0 Net", verbal: "15.0 Net", total: "45.0 Net", alert: "Güvenli Limit", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
                          { exam: "LGS Eşiği", math: "10.0 Net", verbal: "14.0 Net", total: "55.0 Net", alert: "1 Öğrenci Riskte", color: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400" }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-slate-200">{item.exam}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${item.color}`}>{item.alert}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                                <span className="text-slate-500 block">Matematik</span>
                                <span className="text-slate-300 font-bold">{item.math}</span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                                <span className="text-slate-500 block">Türkçe</span>
                                <span className="text-slate-300 font-bold">{item.verbal}</span>
                              </div>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-900 flex justify-between items-center text-[9px]">
                              <span className="text-slate-400 font-bold">Toplam Net Limiti</span>
                              <span className="text-blue-400 font-black font-mono">{item.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Early Warning alert banner */}
                      <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-300 leading-relaxed">
                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="font-extrabold block text-red-400 uppercase text-[9px] mb-0.5">⚠️ KRİTİK AKADEMİK RİSK UYARISI:</span>
                          Son yapılan <span className="text-slate-100 font-bold">3D Türkiye Geneli TYT-1</span> sınavında Türkçe ve Matematik branşlarında belirlenen risk limitinin altında kalan 3 öğrencimiz için otomatik etüt ve ek birebir ders takvimi planlanması önerilmektedir.
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'ai_reco' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">YAPAY ZEKA DESTEKLİ ANALİZ</span>
                          <h4 className="text-sm font-extrabold text-slate-100">Başarı Projeksiyonu & Akıllı Tavsiye Motoru</h4>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black">Yapay Zeka</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* WMA Trend analysis prediction widget */}
                        <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-3.5 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">📈 SONRAKİ SINAV BAŞARI TAHMİNİ</span>
                            <span className="text-[11px] text-slate-300 font-semibold leading-relaxed block">
                              Öğrencinin son 3 deneme sınavı netleri, ağırlıklı hareketli ortalama ve sönümlü eğilim analiziyle değerlendirilmiştir.
                            </span>
                          </div>

                          <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-500 block">ÖNCEKİ ORTALAMA</span>
                              <span className="text-base font-black text-slate-400 font-mono">72.50 Net</span>
                            </div>
                            <div className="text-blue-500">
                              <ArrowRight size={16} />
                            </div>
                            <div className="space-y-0.5 text-right">
                              <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider">🎯 TAHMİNİ HEDEF NET</span>
                              <span className="text-lg font-black text-emerald-400 font-mono">78.40 Net</span>
                            </div>
                          </div>

                          <div className="text-[8px] text-slate-500 font-bold text-center uppercase tracking-wider">
                            Güven Aralığı: %94 • Son 3 Sınav Verisi Analiz Edildi
                          </div>
                        </div>

                        {/* AI advice widget */}
                        <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider block">💡 K.A.S DERS TAVSİYESİ</span>
                            <h5 className="text-xs font-extrabold text-slate-200 mt-1">Matematik Gelişim Stratejisi</h5>
                          </div>
                          
                          <p className="text-[10px] text-slate-300 leading-relaxed font-medium bg-slate-950 p-3 rounded-xl border border-slate-900">
                            "Matematik dersinde formülleri ezberlemek yerine mantığını anlamaya odaklanmalı ve çözemediğin her sorunun video çözümünü mutlaka izleyerek boşlukları kapatmalısın."
                          </p>

                          <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-black uppercase tracking-wider">
                            <Sparkles className="text-purple-400 shrink-0" size={10} />
                            <span>Yapay Zeka Tarafından Otomatik Üretilmiştir</span>
                          </div>
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
                <h3 className="text-2xl font-extrabold text-slate-100">Kurum Analiz Sistemi Hangi Problemleri Çözer?</h3>
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
                  <h3 className="text-xl font-black text-slate-100">Yapay Zeka Destekli Kurum Analiz Eğitim Teknolojileri</h3>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-xs rounded-full">
                  Güvenilir Eğitim Çözümü
                </div>
              </div>

              <div className="space-y-5">
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Kurum Analiz Sistemi, eğitim sektörünün içinden gelen deneyimli eğitimciler, rehberlik koordinatörleri ve yazılım mühendisleri tarafından kurulan profesyonel, yapay zeka destekli bir eğitim otomasyon platformudur. Amacımız, modern teknolojiyi geleneksel eğitim disipliniyle birleştirerek kurumların yönetimsel yükünü azaltmak ve başarı oranlarını artırmaktır.
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
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider font-sans">KOLAY ENTEGRASYON & PRESTİJLİ HİZMET</span>
                <h3 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">Kurum Analiz Sistemi Üyelik ve Deneme Süreci</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Hiçbir ek maliyet veya taahhüt altına girmeden platformumuzu hemen test edin. Kurumunuzun büyüklüğüne ve ihtiyaçlarına göre en esnek üyelik çözümleri sisteme giriş yaptıktan sonra sunulmaktadır.
                </p>
              </div>

              {/* Pricing Grid (2 Cards layout without price tags) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Free Trial Card */}
                <div className="border border-slate-850 bg-slate-900/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between hover:border-slate-800 transition-all duration-300">
                  <div className="space-y-4">
                    <div>
                      <span className="bg-slate-800/80 text-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                        KART GEREKMEZ • ANINDA ERİŞİM
                      </span>
                      <h4 className="text-base font-black text-slate-100 mt-2">14 Günlük Ücretsiz Deneme</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Sistemi risksiz ve sınırsız test edin</span>
                    </div>
                    
                    <div className="bg-slate-950/60 border border-slate-900/80 px-4 py-3 rounded-2xl flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Deneme Süresi:</span>
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">14 Gün Tam Sürüm</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-bold">
                      *Kredi kartı veya ödeme bilgisi girmeden anında profil oluşturun.
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
                    EN POPÜLER • SINIRSIZ SEÇENEK
                  </span>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-black text-slate-100 mt-2">Kurum Analiz Sınırsız Premium</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Sınırsız Öğrenci, Veli, Şube & Altyapı</span>
                    </div>
                    
                    <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-3 rounded-2xl flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Üyelik Tipi:</span>
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Kurumsal Lisans</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-bold leading-relaxed">
                      *Kurumunuzun büyüklüğüne ve öğrenci sayınıza göre esnek lisanslama ve indirim avantajları giriş panelinizde tanımlanır.
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
                    Sisteme Kaydol & Planları Gör 💎
                  </button>
                </div>

              </div>

              {/* Informational Guidance Warning Banner for payments */}
              <div className="max-w-4xl mx-auto bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-2 text-center">
                <span className="font-extrabold uppercase text-[10px] text-blue-400 tracking-wider block">💳 LİSANSLAMA VE ABONELİK SİSTEMİ</span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-2xl mx-auto">
                  Kurum Analiz Sistemi'nde ödemeler ve lisans yükseltmeleri, kayıt olup sisteme giriş yaptıktan sonra <strong>Kurum Paneli'ndeki "Abonelik" sekmesinden</strong> şeffaf bir şekilde yönetilir. Önceden kart bilgisi girmeden ücretsiz denemenizi dilediğiniz an başlatabilirsiniz.
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
                    <span className="text-xs font-black text-slate-200 tracking-wider">KURUM ANALİZ SİSTEMLERİ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    Eğitim kurumlarında zaman tasarrufu, veri doğruluğu ve veli memnuniyeti sağlayan yapay zeka destekli yeni nesil SaaS bulut otomasyonu.
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
                <p className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
                  <span>Bu site</span>
                  <a
                    href="https://www.instagram.com/cagriscn.21/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 font-black hover:underline inline-flex items-center gap-0.5"
                  >
                    <Instagram size={11} className="inline shrink-0" />
                    <span>cagriscn.21</span>
                  </a>
                  <span>tarafından geliştirilmiştir.</span>
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
                  {/* Mobile Drawer Logo Header */}
                  <div className="flex items-center gap-2.5 px-2 py-2 border-b border-slate-900 mb-2">
                    <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
                      <img src="/favicon.svg" alt="K.A.S Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider block leading-none">KURUM ANALİZ</span>
                      <span className="text-xs font-black text-slate-200 tracking-wide">SİSTEMLERİ</span>
                    </div>
                  </div>
                  
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

                    {/* Tab: KAS.ai AI Chatbot */}
                    <button
                      onClick={() => { setCurrentTab("kas-ai"); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer relative overflow-hidden group border ${
                        currentTab === "kas-ai"
                          ? "bg-indigo-600 text-white border-indigo-500/50 shadow"
                          : "bg-gradient-to-r from-indigo-950/40 to-blue-950/40 text-indigo-300 border-indigo-900/40 hover:border-indigo-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles size={14} className="text-indigo-400 group-hover:animate-bounce" />
                        <span className="font-extrabold tracking-wide">KAS.ai Asistanı</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
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
                  {user.rol === 'admin' && (
                    <div className="bg-slate-900/60 border border-slate-850/60 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Lisans Durumu</span>
                        <span className="text-[10px] text-slate-300 font-extrabold">
                          {currentSubscription === 'trial' ? `Deneme Sürümü (${trialTimeLeftStr || `${trialDaysLeft} Gün`})` : "Sınırsız Premium 💎"}
                        </span>
                      </div>
                      {currentSubscription === 'trial' && (
                        <button
                          onClick={() => { setCurrentTab('abonelik'); setIsMobileMenuOpen(false); }}
                          className="text-[9px] bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded-lg"
                        >
                          Yükselt ⚡
                        </button>
                      )}
                    </div>
                  )}

                  {/* Permanent PWA install triggers in mobile drawer */}
                  {(pwaPrompt || isIos) && (
                    <div className="bg-slate-900/50 border border-blue-500/10 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Uygulama Sürümü</span>
                        <span className="text-[10px] text-blue-400 font-extrabold flex items-center gap-1">
                          📱 Mobil Uygulamayı Yükle
                        </span>
                      </div>
                      <button
                        onClick={() => { setShowPwaBanner(true); setIsMobileMenuOpen(false); }}
                        className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <Zap size={10} /> Yükle
                      </button>
                    </div>
                  )}

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
          <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-4 space-y-4 z-10 shrink-0 overflow-y-auto scrollbar-thin">
            
            {/* Sidebar Logo Header */}
            <div className="flex items-center gap-2.5 px-2 py-3 border-b border-slate-800/60 mb-2 shrink-0">
              <div className="p-1 bg-blue-600/5 rounded-lg border border-slate-800">
                <img src="/favicon.svg" alt="K.A.S Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider block leading-none">KURUM ANALİZ</span>
                <span className="text-xs font-black text-slate-200 tracking-wide">SİSTEMLERİ</span>
              </div>
            </div>

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

              {/* Button: KAS.ai Chatbot (All roles) */}
              <button
                onClick={() => setCurrentTab("kas-ai")}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer shrink-0 relative overflow-hidden group border ${
                  currentTab === "kas-ai"
                    ? "bg-indigo-600 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                    : "bg-gradient-to-r from-indigo-950/40 to-blue-950/40 text-indigo-300 border-indigo-900/40 hover:border-indigo-800 hover:text-white"
                }`}
              >
                <div className="absolute -inset-x-20 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse"></div>
                <div className="flex items-center gap-3">
                  <Sparkles size={15} className={`text-indigo-400 group-hover:animate-bounce ${currentTab === "kas-ai" ? 'text-white' : ''}`} />
                  <span className="font-extrabold tracking-wide">KAS.ai Asistanı</span>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
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

              {user.rol === 'admin' && (
                <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Lisans Durumu</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded block text-center ${
                    currentSubscription === 'trial' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {currentSubscription === 'trial' ? `Deneme Sürümü (${trialTimeLeftStr || `${trialDaysLeft} Gün`})` : "Sınırsız Premium 💎"}
                  </span>
                  {currentSubscription === 'trial' && (
                    <button 
                      onClick={() => setCurrentTab('abonelik')}
                      className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold underline block text-center w-full mt-1 cursor-pointer"
                    >
                      Şimdi Paketini Yükselt ⚡
                    </button>
                  )}
                </div>
              )}

              {/* Permanent PWA install triggers in desktop sidebar */}
              {(pwaPrompt || isIos) && (
                <div className="bg-gradient-to-tr from-slate-950/60 to-slate-900/40 border border-blue-500/10 p-3.5 rounded-2xl space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📱</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">K.A.S. Mobil Uygulaması</span>
                  </div>
                  <button
                    onClick={() => setShowPwaBanner(true)}
                    className="text-[10px] w-full bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 font-extrabold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap size={10} /> Uygulamayı Yükle
                  </button>
                </div>
              )}

              <div className="text-[10px] text-slate-500 font-bold space-y-0.5 px-1 pt-2 border-t border-slate-800/40">
                <p>Kurum Analiz Sistemi v1.5</p>
                <p className="text-[9px] text-slate-600 font-semibold">© 2026 K.A.S Portal • Premium</p>
              </div>
            </div>
          </aside>

          {/* Core App Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800">
            <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            
            {user.rol === 'admin' && currentSubscription === 'trial' && trialDaysLeft <= 0 ? (
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

                {/* MOUNT VIEW: KAS.ai Assistant */}
                <div className={currentTab === "kas-ai" ? "h-full min-h-[600px] w-full max-w-7xl mx-auto px-2 sm:px-4 block" : "hidden"}>
                   <AiChatWidget
                    isOpen={true}
                    onClose={() => setCurrentTab("dashboard")}
                    user={user}
                    token={token}
                    mode="full"
                  />
                </div>
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
                        Sınıfı: {childReport.student.sinif_adi} • Sınav Gelişim Alanı: {childReport.student.alan} • Öğrencinin Seçtiği Yıl Sonu Hedef Neti: <span className="text-amber-400 font-extrabold">{childReport.student.hedef_net || 95} Net</span>
                      </p>
                    </div>

                    {/* AI Haftalık Durum Özeti */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-800/30 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-blue-400" size={16} />
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">Yapay Zeka Destekli Haftalık Durum Özeti</span>
                      </div>
                      {loadingChildAi ? (
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                          Yapay Zeka öğrencinin son durumunu analiz ediyor...
                        </div>
                      ) : childAiSummary ? (
                        <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                          {childAiSummary}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">Özet yüklenemedi.</p>
                      )}
                    </div>

                    {/* Akademik Gelişim Değerlendirme Kartı */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider block">📈 Gelişim Trendi Değerlendirmesi</span>
                        {(() => {
                          if (!childReport.sonuclar || childReport.sonuclar.length === 0) {
                            return <p className="text-xs text-slate-400 leading-normal font-semibold">Değerlendirme için en az 1 deneme sonucu gerekiyor.</p>;
                          }
                          const sonuclar = childReport.sonuclar;
                          if (sonuclar.length === 1) {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-amber-400 uppercase tracking-tight block">İlk Veri Girişi</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Öğrencimizin ilk deneme sonucu kaydedildi. Sonraki sınavlarda gelişim grafiği otomatik olarak analiz edilmeye başlanacaktır.</p>
                              </div>
                            );
                          }
                          const lastVal = Number(sonuclar[sonuclar.length - 1].toplam_net);
                          const prevVal = Number(sonuclar[sonuclar.length - 2].toplam_net);
                          const diff = lastVal - prevVal;
                          
                          if (diff > 4) {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-tight block">Hızlı Gelişim Gösteriyor 🚀</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Son sınava göre <strong className="text-emerald-400 font-black">+{diff.toFixed(1)} netlik</strong> belirgin bir artış gösterdi. Çalışma disiplini son derece yüksek gidiyor.</p>
                              </div>
                            );
                          } else if (diff > 0) {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-blue-400 uppercase tracking-tight block">Yükseliş Eğiliminde 📈</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Son sınavda <strong className="text-blue-400 font-black">+{diff.toFixed(1)} net</strong> artış yaşandı. İstikrarlı çalışmasını sürdürürse hedef netine rahatça ulaşacaktır.</p>
                              </div>
                            );
                          } else if (diff > -3) {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-slate-300 uppercase tracking-tight block">Stabil / Kararlı Seviye 📊</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Net seviyesi benzer düzeylerde korundu ({diff.toFixed(1)} net değişim). Konu eksiklikleri giderilerek sıçrama yapması hedeflenmeli.</p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-rose-400 uppercase tracking-tight block">Performans Düşüşü / Odaklanma Uyarısı ⚠️</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Son sınavda <strong className="text-rose-400 font-black">{diff.toFixed(1)} netlik</strong> bir gerileme görüldü. Deneme sınavı analizleri incelenerek moral desteği sağlanmalı.</p>
                              </div>
                            );
                          }
                        })()}
                      </div>

                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">🎯 Yıl Sonu Hedefi Analizi</span>
                        {(() => {
                          const target = childReport.student.hedef_net || 95;
                          if (!childReport.sonuclar || childReport.sonuclar.length === 0) {
                            return <p className="text-xs text-slate-400 leading-normal font-semibold">Yıl sonu hedef analizi için sınav skoru bekleniyor.</p>;
                          }
                          const lastNet = Number(childReport.sonuclar[childReport.sonuclar.length - 1].toplam_net);
                          const remaining = target - lastNet;
                          const pct = Math.min(100, Math.max(0, (lastNet / target) * 100));

                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-300">Hedefe Yakınlık: %{pct.toFixed(0)}</span>
                                <span className="text-[10px] font-extrabold text-amber-400">Hedef: {target} Net</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                                {remaining <= 0 ? (
                                  <span className="text-emerald-400 font-bold">Harika! Yıl sonu hedef neti şimdiden yakalanmış durumda 🚀</span>
                                ) : remaining <= 10 ? (
                                  <span>Hedefe <strong className="text-emerald-400 font-black">{remaining.toFixed(1)} net</strong> kaldı. Öğrencimiz son derece yakın seviyede!</span>
                                ) : remaining <= 25 ? (
                                  <span>Hedefe <strong className="text-blue-400 font-black">{remaining.toFixed(1)} net</strong> uzaklıkta. Gelişim ivmesiyle yakalanabilir düzeyde.</span>
                                ) : (
                                  <span>Hedefe <strong className="text-amber-400 font-black">{remaining.toFixed(1)} net</strong> mesafe var. Tempolu konu tekrarları planlanmalı.</span>
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">🛡️ Akademik Risk & Destek İhtiyacı</span>
                        {(() => {
                          if (!childReport.sonuclar || childReport.sonuclar.length === 0) {
                            return <p className="text-xs text-slate-400 leading-normal font-semibold">Risk analizi için en az 1 deneme sonucu bekleniyor.</p>;
                          }
                          const last = childReport.sonuclar[childReport.sonuclar.length - 1];
                          const lowCourses: string[] = [];
                          
                          const tytMathLimit = 18;
                          const tytTurLimit = 22;
                          const tytFenLimit = 10;
                          
                          if (last.matematik_net < tytMathLimit) lowCourses.push("Matematik");
                          if (last.turkce_net < tytTurLimit) lowCourses.push("Türkçe");
                          if (last.fen_net < tytFenLimit) lowCourses.push("Fen Bilimleri");

                          if (lowCourses.length === 0) {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-tight block">Risk Bulunmuyor ✅</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Tüm derslerdeki net ortalamaları okul sınır limitlerinin üzerinde seyrediyor. Mevcut tempoyu koruması yeterlidir.</p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-rose-400 uppercase tracking-tight block">Kritik Ders Takviyesi Gerekli ⚠️</span>
                                <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                                  <strong className="text-rose-400 font-black">{lowCourses.join(', ')}</strong> alanlarında net seviyesi kritik alt sınırda. Bu konular için ek soru çözümü ve rehberlik görüşmesi önerilir.
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deneme Sınavları Net Gelişim Grafiği</h4>
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                            {(['TYT', 'AYT', 'LGS'] as const).map((t) => {
                              const count = childReport.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === t).length;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setVeliChartTab(t)}
                                  className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md transition-all ${
                                    veliChartTab === t
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                                  }`}
                                >
                                  {t} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {(() => {
                          const filteredSonuclar = childReport.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === veliChartTab);
                          const scaleMax = veliChartTab === 'TYT' ? 120 : veliChartTab === 'AYT' ? 80 : 90;
                          const scaleValues = veliChartTab === 'TYT' 
                            ? [0, 25, 50, 75, 100, 120] 
                            : veliChartTab === 'AYT' 
                              ? [0, 20, 40, 60, 80] 
                              : [0, 15, 30, 45, 60, 75, 90];

                          if (filteredSonuclar.length === 0) {
                            return (
                              <div className="h-40 flex items-center justify-center text-slate-500 text-xs italic">
                                Öğrencinin henüz {veliChartTab} türünde girilmiş bir sınav sonucu bulunmamaktadır.
                              </div>
                            );
                          }

                          return (
                            <div>
                              <svg viewBox="0 0 500 150" className="w-full h-40 overflow-visible">
                                {scaleValues.map((val, i) => {
                                  const y = 150 - (val / scaleMax) * 130 - 10;
                                  return (
                                    <g key={i}>
                                      <line x1="30" y1={y} x2="500" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                                      <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                                    </g>
                                  );
                                })}

                                {(() => {
                                  const points: string[] = [];
                                  const count = filteredSonuclar.length;
                                  const stepX = (500 - 80) / count;

                                  filteredSonuclar.forEach((res, index) => {
                                    const x = 40 + index * stepX;
                                    const y = 150 - (res.toplam_net / scaleMax) * 130 - 10;
                                    points.push(`${x},${y}`);
                                  });

                                  const projectedNet = getProjectedNet(filteredSonuclar);
                                  const projX = 40 + count * stepX;
                                  const projY = 150 - (projectedNet / scaleMax) * 130 - 10;
                                  const lastX = 40 + (count - 1) * stepX;
                                  const lastY = 150 - (Number(filteredSonuclar[count - 1].toplam_net) / scaleMax) * 130 - 10;

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
                                      {filteredSonuclar.map((res, index) => {
                                        const x = 40 + index * stepX;
                                        const y = 150 - (res.toplam_net / scaleMax) * 130 - 10;
                                        return (
                                          <g key={index}>
                                            <circle cx={x} cy={y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                                            <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-bold font-mono" textAnchor="middle">{res.toplam_net}</text>
                                            <text x={x} y="148" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_adi.substring(0, 10)}...</text>
                                          </g>
                                        );
                                      })}

                                      {/* Projected upcoming exam point */}
                                      <g>
                                        <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                                        <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                                        <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black font-mono" textAnchor="middle">{projectedNet}</text>
                                        <text x={projX} y="148" fill="#f59e0b" className="text-[8px] font-black tracking-wider uppercase" textAnchor="middle">Sıradaki (Beklenen 🎯)</text>
                                      </g>
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                                  <span>Gerçekleşen {veliChartTab} Netleri</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                                  <span className="text-amber-400">Gelecek Sınav Projeksiyonu</span>
                                </span>
                                <span className="text-slate-600 font-medium">• Limit: {scaleMax} Net</span>
                              </div>
                            </div>
                          );
                        })()}
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
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tüm Sınav Karneleri</h4>
                          <span className="text-[10px] text-amber-400 font-bold animate-pulse">Sınava Tıklayın 🔍</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-3">Herhangi bir denemeye tıklayarak öğrencimizin ders bazlı netlerini ve detaylı gelişim analizini görebilirsiniz.</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="text-slate-500 text-[9px] uppercase font-bold border-b border-slate-800">
                                <th className="pb-2">Sınav Adı</th>
                                <th className="pb-2">Ders Netleri (T/S/M/F)</th>
                                <th className="pb-2 text-center">Toplam Net</th>
                                <th className="pb-2 text-right">Puan</th>
                                <th className="pb-2 text-right">Detay</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {childReport.sonuclar.map((r, idx) => (
                                <tr 
                                  key={idx}
                                  onClick={() => setSelectedExamDetail(r)}
                                  className="cursor-pointer hover:bg-slate-800/50 transition-colors group"
                                >
                                  <td className="py-2.5 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{r.sinav_adi}</td>
                                  <td className="py-2.5 font-mono text-slate-400 text-[11px]">{r.turkce_net}/{r.sosyal_net}/{r.matematik_net}/{r.fen_net}</td>
                                  <td className="py-2.5 text-center font-bold text-slate-200">{r.toplam_net}</td>
                                  <td className="py-2.5 text-right font-black text-blue-400">{r.puan}</td>
                                  <td className="py-2.5 text-right text-slate-500 group-hover:text-amber-400 transition-colors">
                                    <Eye size={14} className="inline" />
                                  </td>
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

                    {/* Sınav Karşılaştırma Tablosu (Önceki vs Bu Sınav) */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                        <span>📊 Önceki Sınav vs. Son Sınav Karşılaştırması</span>
                      </h4>
                      {(() => {
                        const allExams = childReport.sonuclar || [];
                        if (allExams.length < 2) {
                          return <div className="text-center py-6 text-xs text-slate-500">Karşılaştırma yapabilmek için en az 2 sınav sonucu gereklidir.</div>;
                        }
                        
                        // Select the last two exams (assuming they are sorted by date ascending)
                        const currentExam = allExams[allExams.length - 1];
                        const previousExam = allExams[allExams.length - 2];
                        
                        const branches = [
                          { key: 'turkce_net', label: 'Türkçe' },
                          { key: 'matematik_net', label: 'Matematik' },
                          { key: 'sosyal_net', label: 'Sosyal / Diğer' },
                          { key: 'fen_net', label: 'Fen' },
                          { key: 'toplam_net', label: 'Toplam' }
                        ];

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-800/60 text-slate-400">
                                  <th className="py-2 px-3 font-semibold">Ders / Branş</th>
                                  <th className="py-2 px-3 font-semibold">{previousExam.sinav_adi} <br/><span className="text-[9px] font-normal text-slate-500">{previousExam.tarih}</span></th>
                                  <th className="py-2 px-3 font-semibold text-white">{currentExam.sinav_adi} <br/><span className="text-[9px] font-normal text-slate-400">{currentExam.tarih}</span></th>
                                  <th className="py-2 px-3 font-semibold text-right">Değişim</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/30">
                                {branches.map(branch => {
                                  const prevVal = Number(previousExam[branch.key]) || 0;
                                  const currVal = Number(currentExam[branch.key]) || 0;
                                  const diff = currVal - prevVal;
                                  
                                  return (
                                    <tr key={branch.key} className="hover:bg-slate-900/30 transition-colors">
                                      <td className="py-2 px-3 font-medium text-slate-300">{branch.label}</td>
                                      <td className="py-2 px-3 font-mono text-slate-400">{prevVal.toFixed(2)}</td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-200">{currVal.toFixed(2)}</td>
                                      <td className="py-2 px-3 font-mono text-right font-extrabold">
                                        {diff > 0 ? (
                                          <span className="text-emerald-400">+{diff.toFixed(2)}</span>
                                        ) : diff < 0 ? (
                                          <span className="text-rose-400">{diff.toFixed(2)}</span>
                                        ) : (
                                          <span className="text-slate-500">0.00</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Veli & Öğretmen İletişim ve Tavsiye Portalı */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Left: Öğretmen Ders Tavsiyeleri */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
                        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-2">
                              <BookOpen size={14} className="text-emerald-400" />
                              <span>Branş Öğretmenlerimizin Ders Çalışma Tavsiyeleri</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">Ders öğretmenlerinin konuları pekiştirme, soru ödevi ve kaynak tavsiyeleri.</p>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            📖 Branş Bazlı
                          </span>
                        </div>
                        
                        {!(childReport.tavsiyeler && childReport.tavsiyeler.length > 0) ? (
                          <div className="text-center py-10 text-xs text-slate-500 italic font-semibold">Ders öğretmenleri tarafından henüz eklenmiş çalışma tavsiyesi bulunmuyor.</div>
                        ) : (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {childReport.tavsiyeler.map(t => (
                              <div key={t.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-700 transition">
                                <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                                      {t.ders_adi}
                                    </span>
                                    <span className="text-xs font-black text-slate-300">{t.ogretmen_adi}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    {t.tarih ? new Date(t.tarih).toLocaleDateString('tr-TR') : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{t.tavsiye_metni}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Veli Geri Bildirim & Ev Takip Notu Ekleme */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
                        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-2">
                              <Home size={14} className="text-purple-400" />
                              <span>Okul Yönetimi & Öğretmenlerimize Geri Bildirim</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">Öğrencimizin evdeki çalışma disiplini, ödev düzeni veya gözlemlerini iletebilirsiniz.</p>
                          </div>
                          <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                            🏠 Ev Geri Bildirim
                          </span>
                        </div>

                        {/* Interactive Form */}
                        <form onSubmit={handleAddVeliNote} className="space-y-3">
                          <textarea
                            placeholder="Evdeki çalışma durumu, motivasyonu veya danışmak istediğiniz konuları buraya detaylıca yazın..."
                            value={newVeliNote}
                            onChange={e => setNewVeliNote(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-purple-500 placeholder-slate-600 resize-none shadow-inner"
                          />
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition shadow shadow-purple-500/20 cursor-pointer"
                            >
                              <Send size={13} /> Geri Bildirim Gönder
                            </button>
                          </div>
                        </form>

                        {/* Active Feedback List from this Parent */}
                        {childReport.veli_notlari && childReport.veli_notlari.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-slate-800/40">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Önceki Gönderimleriniz</span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {childReport.veli_notlari.map(n => (
                                <div key={n.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-700 transition">
                                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                                    <span className="text-xs font-black text-purple-400">Gönderen: Siz</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-slate-500 font-bold">
                                        {n.tarih ? new Date(n.tarih).toLocaleDateString('tr-TR') : ''}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteVeliNoteInParentPanel(n.id)}
                                        className="text-slate-600 hover:text-red-400 transition"
                                        title="Sil"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                                </div>
                              ))}
                            </div>
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
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                            <Target size={20} />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Yıl Sonu Hedef Netim 🎯</span>
                            {isEditingTargetNet ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  value={tempTargetNet}
                                  onChange={e => setTempTargetNet(Number(e.target.value))}
                                  className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-100 font-bold font-mono focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  onClick={() => handleSaveTargetNet(tempTargetNet)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded transition"
                                >
                                  Kaydet
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingTargetNet(false);
                                    setTempTargetNet(studentReport.student.hedef_net || 95);
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded transition"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-lg font-black text-slate-100 font-mono">
                                  {studentReport.student.hedef_net || 95}
                                </span>
                                <button
                                  onClick={() => setIsEditingTargetNet(true)}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold transition"
                                >
                                  Değiştir
                                </button>
                              </div>
                            )}
                          </div>
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

                    {/* ENHANCED STUDENT ENGAGEMENT TOOLS (FEATURES 1, 2, 4) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                      
                      {/* FEATURE 4: HAFTALIK GÖREVLERİM */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <CheckSquare size={16} className="text-emerald-400" />
                              <span>Haftalık Çalışma Görevlerim</span>
                            </h4>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/20">
                              {(() => {
                                const list = studentReport.haftalik_gorevler || [];
                                const completed = list.filter((t: any) => t.tamamlandi).length;
                                return list.length > 0 ? `%${Math.round((completed / list.length) * 100)}` : '%0';
                              })()}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: (() => {
                                  const list = studentReport.haftalik_gorevler || [];
                                  const completed = list.filter((t: any) => t.tamamlandi).length;
                                  return list.length > 0 ? `${(completed / list.length) * 100}%` : '0%';
                                })()
                              }}
                            />
                          </div>

                          {/* Task List */}
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {!(studentReport.haftalik_gorevler && studentReport.haftalik_gorevler.length > 0) ? (
                              <div className="text-center py-8 text-slate-500 text-xs italic">
                                Bu hafta için atanmış görevin yok. Kendine bir görev ekleyerek başla!
                              </div>
                            ) : (
                              (studentReport.haftalik_gorevler || []).map((task: any) => (
                                <div 
                                  key={task.id} 
                                  className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition ${
                                    task.tamamlandi 
                                      ? 'bg-slate-950/20 border-slate-850 opacity-60' 
                                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 flex-1">
                                    <button 
                                      onClick={() => handleToggleWeeklyTask(task.id, task.tamamlandi)}
                                      className={`mt-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer`}
                                    >
                                      {task.tamamlandi ? (
                                        <CheckCircle size={15} className="text-emerald-400" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded border-2 border-slate-600 hover:border-emerald-500 transition" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <p className={`text-xs font-semibold leading-snug ${task.tamamlandi ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                        {task.gorev_metni}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded uppercase">
                                          {task.ders_adi}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-500">
                                          📅 {task.gun}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteWeeklyTask(task.id)}
                                    className="text-slate-600 hover:text-red-400 p-1 rounded transition cursor-pointer"
                                    title="Sil"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Add Task Form */}
                        <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hızlı Görev Ekle</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="örn: Limit konusu test çözümü..."
                              value={newTaskText}
                              onChange={e => setNewTaskText(e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={handleCreateWeeklyTask}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
                              title="Görev Ekle"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newTaskSubject}
                              onChange={e => setNewTaskSubject(e.target.value)}
                              className="bg-slate-950 border border-slate-850 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                            >
                              <option value="Matematik">Matematik</option>
                              <option value="Türkçe">Türkçe</option>
                              <option value="Fizik">Fizik</option>
                              <option value="Kimya">Kimya</option>
                              <option value="Biyoloji">Biyoloji</option>
                              <option value="Coğrafya">Coğrafya</option>
                              <option value="Tarih">Tarih</option>
                              <option value="Felsefe">Felsefe</option>
                            </select>
                            <select
                              value={newTaskDay}
                              onChange={e => setNewTaskDay(e.target.value)}
                              className="bg-slate-950 border border-slate-850 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                            >
                              {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* FEATURE 2: ÇALIŞMA SEANSI VE KRONOMETRE */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <Clock size={16} className="text-indigo-400" />
                              <span>Çalışma Seansı & Kronometre</span>
                            </h4>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-bold tracking-wider">
                              Odak Modu
                            </span>
                          </div>

                          {/* Mode tabs */}
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                            <button
                              onClick={() => {
                                setTimerIsRunning(false);
                                setTimerMode('pomodoro');
                                setTimerSeconds(pomodoroMinutes * 60);
                              }}
                              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all ${
                                timerMode === 'pomodoro'
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              ⏲️ Pomodoro ({pomodoroMinutes} Dk)
                            </button>
                            <button
                              onClick={() => {
                                setTimerIsRunning(false);
                                setTimerMode('stopwatch');
                                setTimerSeconds(0);
                              }}
                              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all ${
                                timerMode === 'stopwatch'
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              ⏱️ Kronometre (Sayaç)
                            </button>
                          </div>

                          {/* Pomodoro custom minutes adjuster */}
                          {timerMode === 'pomodoro' && (
                            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Süre Ayarı:</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={timerIsRunning || pomodoroMinutes <= 5}
                                  onClick={() => {
                                    const next = Math.max(5, pomodoroMinutes - 5);
                                    setPomodoroMinutes(next);
                                    setTimerSeconds(next * 60);
                                  }}
                                  className="text-xs bg-slate-900 border border-slate-800 text-slate-300 font-black rounded w-6 h-6 flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 select-none cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="180"
                                  disabled={timerIsRunning}
                                  value={pomodoroMinutes}
                                  onChange={e => {
                                    const mins = Math.max(1, Math.min(180, Number(e.target.value)));
                                    setPomodoroMinutes(mins);
                                    if (!timerIsRunning) {
                                      setTimerSeconds(mins * 60);
                                    }
                                  }}
                                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center font-bold font-mono text-indigo-400 disabled:opacity-50"
                                />
                                <span className="text-[10px] text-slate-500 font-bold">dk</span>
                                <button
                                  type="button"
                                  disabled={timerIsRunning || pomodoroMinutes >= 180}
                                  onClick={() => {
                                    const next = Math.min(180, pomodoroMinutes + 5);
                                    setPomodoroMinutes(next);
                                    setTimerSeconds(next * 60);
                                  }}
                                  className="text-xs bg-slate-900 border border-slate-800 text-slate-300 font-black rounded w-6 h-6 flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 select-none cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Timer Clock Circle Face */}
                          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 border border-slate-850 rounded-2xl relative overflow-hidden group">
                            {timerIsRunning && (
                              <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                            )}
                            <div className="text-3xl font-black text-slate-100 font-mono tracking-widest drop-shadow-md">
                              {(() => {
                                const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
                                const s = (timerSeconds % 60).toString().padStart(2, '0');
                                return `${m}:${s}`;
                              })()}
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                              {timerSubject} Çalışılıyor
                            </span>
                          </div>

                          {/* Settings and controls */}
                          <div className="flex gap-2 items-center">
                            <select
                              value={timerSubject}
                              onChange={e => setTimerSubject(e.target.value)}
                              disabled={timerIsRunning}
                              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-medium flex-1 cursor-pointer disabled:opacity-50"
                            >
                              <option value="Matematik">📐 Matematik</option>
                              <option value="Türkçe">📚 Türkçe</option>
                              <option value="Fizik">⚡ Fizik</option>
                              <option value="Kimya">🧪 Kimya</option>
                              <option value="Biyoloji">🧬 Biyoloji</option>
                              <option value="Coğrafya">🌍 Coğrafya</option>
                              <option value="Tarih">⏳ Tarih</option>
                              <option value="Sözel">✍️ Diğer Konular</option>
                            </select>

                            {/* Clock Controls */}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setTimerIsRunning(!timerIsRunning)}
                                className={`p-2 rounded-lg text-white font-bold transition flex items-center justify-center cursor-pointer ${
                                  timerIsRunning 
                                    ? 'bg-amber-600 hover:bg-amber-500' 
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                }`}
                                title={timerIsRunning ? 'Duraklat' : 'Başlat'}
                              >
                                {timerIsRunning ? <Pause size={13} /> : <Play size={13} />}
                              </button>
                              <button
                                onClick={() => {
                                  setTimerIsRunning(false);
                                  setTimerSeconds(timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs transition flex items-center justify-center cursor-pointer"
                                title="Sıfırla"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Save Session Action */}
                        <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-2">
                          <button
                            onClick={() => {
                              const calculatedSecs = timerMode === 'pomodoro' ? (pomodoroMinutes * 60 - timerSeconds) : timerSeconds;
                              const mins = Math.max(1, Math.round(calculatedSecs / 60));
                              handleSaveTimerSession(timerSubject, mins);
                            }}
                            disabled={timerSeconds === (timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Zap size={11} /> Seansı Kaydet ({timerMode === 'pomodoro' ? `${Math.max(1, Math.round((pomodoroMinutes * 60 - timerSeconds) / 60))} dk` : `${Math.round(timerSeconds / 60)} dk`})
                          </button>

                          {/* Today's total work history */}
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1 uppercase">
                            <span>Bugün Toplam:</span>
                            <span className="text-indigo-400 font-extrabold font-mono text-xs">
                              {(() => {
                                const list = studentReport.calisma_seanslari || [];
                                const total = list.reduce((sum: number, x: any) => sum + (x.sure || 0), 0);
                                return `${total} Dakika`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FEATURE 1: KONU TAKİBİ (SUBJECT & TOPIC CHECKLIST) */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                        {(() => {
                          const isLgs = studentReport.student.alan === 'LGS' || studentReport.student.sinif_adi?.toLowerCase().includes('lgs');
                          let subjMap: Record<string, any> = isLgs ? LGS_SUBJECT_TOPICS : TYT_SUBJECT_TOPICS;
                          if (!isLgs) {
                            if (studentKonuTakipTab === 'ayt') {
                              if (studentReport.student.alan === 'Sayısal') {
                                subjMap = AYT_SAY_SUBJECT_TOPICS;
                              } else if (studentReport.student.alan === 'Sözel') {
                                subjMap = AYT_SOZ_SUBJECT_TOPICS;
                              } else if (studentReport.student.alan === 'Eşit Ağırlık') {
                                subjMap = AYT_EA_SUBJECT_TOPICS;
                              } else {
                                subjMap = AYT_SAY_SUBJECT_TOPICS;
                              }
                            }
                          }

                          const studentDoneKeys = (studentReport.konu_takip || [])
                            .filter((kt: any) => kt.tamamlandi)
                            .map((kt: any) => kt.konu_key.toLowerCase());
                          
                          let totalTopicsCount = 0;
                          let checkedCount = 0;
                          Object.entries(subjMap).forEach(([subjKey, topics]: [string, any]) => {
                            totalTopicsCount += topics.length;
                            topics.forEach((t: any) => {
                              const uniqueKey = `${subjKey}_${t.ad}`.toLowerCase();
                              if (studentDoneKeys.includes(uniqueKey)) {
                                checkedCount++;
                              }
                            });
                          });

                          return (
                            <>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    <BookOpen size={16} className="text-blue-400" />
                                    <span>Konu Takip Çizelgesi</span>
                                  </h4>
                                  <span className="text-[10px] bg-blue-500/10 text-blue-400 font-extrabold px-2 py-0.5 rounded border border-blue-500/20 uppercase font-mono">
                                    {checkedCount} / {totalTopicsCount} Konu
                                  </span>
                                </div>

                                {/* TYT / AYT Tab Switcher for Student View */}
                                {!isLgs && (
                                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStudentKonuTakipTab('tyt');
                                        setExpandedChecklistSubject(null);
                                      }}
                                      className={`flex-1 py-1.5 px-3 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                                        studentKonuTakipTab === 'tyt'
                                          ? 'bg-blue-600 text-white shadow'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      TYT
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStudentKonuTakipTab('ayt');
                                        setExpandedChecklistSubject(null);
                                      }}
                                      className={`flex-1 py-1.5 px-3 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                                        studentKonuTakipTab === 'ayt'
                                          ? 'bg-blue-600 text-white shadow'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      AYT ({studentReport.student.alan || 'Sayısal'})
                                    </button>
                                  </div>
                                )}

                                {/* Subject expanders */}
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {Object.entries(subjMap).map(([subjKey, topics]: [string, any]) => {
                                    const displayNames: Record<string, string> = {
                                      turkce: 'Türkçe Bölümü',
                                      matematik: 'Matematik & Geometri',
                                      sosyal: 'Sosyal Bilimler',
                                      fen: 'Fen Bilimleri',
                                      ayt_matematik: 'AYT Matematik',
                                      ayt_fizik: 'AYT Fizik',
                                      ayt_kimya: 'AYT Kimya',
                                      ayt_biyoloji: 'AYT Biyoloji',
                                      ayt_edebiyat: 'AYT Türk Dili ve Ed.',
                                      ayt_tarih1: 'AYT Tarih-1',
                                      ayt_cografya1: 'AYT Coğrafya-1',
                                      ayt_tarih2: 'AYT Tarih-2',
                                      ayt_cografya2: 'AYT Coğrafya-2',
                                      ayt_felsefe_grubu: 'AYT Felsefe Grubu',
                                      ayt_din: 'AYT Din Kültürü'
                                    };

                                    const isExpanded = expandedChecklistSubject === subjKey;
                                    const subjTopicsDoneCount = topics.filter((t: any) => studentDoneKeys.includes(`${subjKey}_${t.ad}`.toLowerCase())).length;
                                    const completionRatio = Math.round((subjTopicsDoneCount / topics.length) * 100) || 0;

                                    return (
                                      <div key={subjKey} className="bg-slate-950/60 border border-slate-850 rounded-xl overflow-hidden transition animate-fade-in">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedChecklistSubject(isExpanded ? null : subjKey)}
                                          className="w-full flex items-center justify-between p-3 hover:bg-slate-950/90 transition text-left cursor-pointer"
                                        >
                                          <div>
                                            <h5 className="text-xs font-black text-slate-200">{displayNames[subjKey] || subjKey}</h5>
                                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                              {subjTopicsDoneCount} / {topics.length} Konu (%{completionRatio})
                                            </span>
                                          </div>
                                          <ChevronRight size={14} className={`text-slate-400 transform transition ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>

                                        {isExpanded && (
                                          <div className="p-2 bg-slate-950/30 border-t border-slate-900 space-y-1.5">
                                            {topics.slice(0, 8).map((topic: any) => {
                                              const uniqueKey = `${subjKey}_${topic.ad}`.toLowerCase();
                                              const isDone = studentDoneKeys.includes(uniqueKey);
                                              return (
                                                <div 
                                                  key={topic.ad} 
                                                  className="flex items-center justify-between gap-2 p-2 bg-slate-900/40 border border-slate-850/60 rounded-lg hover:border-slate-800 transition"
                                                >
                                                  <span className={`text-[11px] font-semibold leading-normal flex-1 ${isDone ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                    {topic.ad}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleTopic(uniqueKey, isDone)}
                                                    className="relative flex items-center justify-center cursor-pointer focus:outline-none"
                                                  >
                                                    <motion.div
                                                      animate={{
                                                        scale: isDone ? [1, 1.2, 1] : 1,
                                                        backgroundColor: isDone ? "rgba(59, 130, 246, 0.2)" : "rgba(15, 23, 42, 0.4)",
                                                        borderColor: isDone ? "#3b82f6" : "#475569"
                                                      }}
                                                      transition={{
                                                        backgroundColor: { type: "spring", stiffness: 300, damping: 20 },
                                                        borderColor: { type: "spring", stiffness: 300, damping: 20 },
                                                        scale: { duration: 0.3, ease: "easeInOut" }
                                                      }}
                                                      className="w-5 h-5 rounded-md border flex items-center justify-center shadow-inner"
                                                    >
                                                      <AnimatePresence>
                                                        {isDone && (
                                                          <motion.svg
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                            className="w-3.5 h-3.5 text-blue-400 stroke-[3.5]"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                          >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                          </motion.svg>
                                                        )}
                                                      </AnimatePresence>
                                                    </motion.div>
                                                  </button>
                                                </div>
                                              );
                                            })}
                                            {topics.length > 8 && (
                                              <p className="text-[9px] text-slate-500 text-center font-bold pt-1">
                                                + {topics.length - 8} Konu daha var
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>Müfredat Uyumu:</span>
                                <span className="text-emerald-400 font-black font-mono">MEB Güncel</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                    </div>

                    {/* SVG Progress chart & focus areas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deneme Sınavları Net Gelişimim</h4>
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                            {(['TYT', 'AYT', 'LGS'] as const).map((t) => {
                              const count = studentReport.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === t).length;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setStudentChartTab(t)}
                                  className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md transition-all ${
                                    studentChartTab === t
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                                  }`}
                                >
                                  {t} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {(() => {
                          const filteredSonuclar = studentReport.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === studentChartTab);
                          const scaleMax = studentChartTab === 'TYT' ? 120 : studentChartTab === 'AYT' ? 80 : 90;
                          const scaleValues = studentChartTab === 'TYT' 
                            ? [0, 25, 50, 75, 100, 120] 
                            : studentChartTab === 'AYT' 
                              ? [0, 20, 40, 60, 80] 
                              : [0, 15, 30, 45, 60, 75, 90];

                          if (filteredSonuclar.length === 0) {
                            return (
                              <div className="h-40 flex items-center justify-center text-slate-500 text-xs italic">
                                Henüz {studentChartTab} türünde girilmiş bir sınav sonucun bulunmamaktadır.
                              </div>
                            );
                          }

                          return (
                            <div>
                              <svg viewBox="0 0 500 150" className="w-full h-40 overflow-visible">
                                {scaleValues.map((val, i) => {
                                  const y = 150 - (val / scaleMax) * 130 - 10;
                                  return (
                                    <g key={i}>
                                      <line x1="30" y1={y} x2="500" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                                      <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                                    </g>
                                  );
                                })}

                                {(() => {
                                  const points: string[] = [];
                                  const count = filteredSonuclar.length;
                                  const stepX = (500 - 80) / count;

                                  filteredSonuclar.forEach((res, index) => {
                                    const x = 40 + index * stepX;
                                    const y = 150 - (res.toplam_net / scaleMax) * 130 - 10;
                                    points.push(`${x},${y}`);
                                  });

                                  const projectedNet = getProjectedNet(filteredSonuclar);
                                  const projX = 40 + count * stepX;
                                  const projY = 150 - (projectedNet / scaleMax) * 130 - 10;
                                  const lastX = 40 + (count - 1) * stepX;
                                  const lastY = 150 - (Number(filteredSonuclar[count - 1].toplam_net) / scaleMax) * 130 - 10;

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
                                      {filteredSonuclar.map((res, index) => {
                                        const x = 40 + index * stepX;
                                        const y = 150 - (res.toplam_net / scaleMax) * 130 - 10;
                                        return (
                                          <g key={index}>
                                            <circle cx={x} cy={y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                                            <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-bold font-mono" textAnchor="middle">{res.toplam_net}</text>
                                            <text x={x} y="148" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_adi.substring(0, 10)}...</text>
                                          </g>
                                        );
                                      })}

                                      {/* Projected upcoming exam point */}
                                      <g>
                                        <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                                        <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                                        <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black font-mono" textAnchor="middle">{projectedNet}</text>
                                        <text x={projX} y="148" fill="#f59e0b" className="text-[8px] font-black tracking-wider uppercase" textAnchor="middle">Sıradaki (Beklenen 🎯)</text>
                                      </g>
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                                  <span>Gerçekleşen {studentChartTab} Netleri</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                                  <span className="text-amber-400">Gelecek Sınav Projeksiyonu</span>
                                </span>
                                <span className="text-slate-600 font-medium">• Limit: {scaleMax} Net</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Course by course nets */}
                      <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs text-slate-450 font-black uppercase tracking-widest border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-400" />
                            <span>Son Sınav Net Analizim</span>
                          </h4>
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
                                    const pct = Math.round(Math.min(100, Math.max(0, (c.net / c.max) * 100)));
                                    return (
                                      <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.color}`}></span>
                                            {c.name}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-medium text-[11px]">{c.net} / {c.max} Net</span>
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">%{pct} Başarı</span>
                                          </div>
                                        </div>
                                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900/60 shadow-inner">
                                          <div className={`h-full ${c.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
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
                          <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-xs text-indigo-300 mt-5 leading-relaxed shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
                            <span className="font-black uppercase block text-[10px] text-indigo-400 mb-1 flex items-center gap-1.5 tracking-wider">
                              <Sparkles size={11} className="text-indigo-400" />
                              <span>K.A.S Akıllı Çalışma Önerisi</span>
                            </span>
                            {(() => {
                              const last = studentReport.sonuclar[studentReport.sonuclar.length - 1];
                              const minCourse = [
                                { name: 'Türkçe', ratio: last.turkce_net / 40, reco: '📚 Paragrafta hız kazanmak ve odaklanmak için her gün mutlaka süre tutarak 25 paragraf sorusu çözmeyi ihmal etme!' },
                                { name: 'Matematik', ratio: last.matematik_net / 40, reco: '📐 Matematik netlerinde sıçrama için temel konuları (Problemler & Üçgenler) her gün tekrar edip soru çözümleri videolarını izle!' },
                                { name: 'Sosyal', ratio: last.sosyal_net / 20, reco: '🌍 Coğrafya harita bilgisi ve tarih kavramları sözlüğü çalışarak hızlıca net artışı sağlayabilirsin.' },
                                { name: 'Fen', ratio: last.fen_net / 20, reco: '🧪 Fen bilimlerinde TYT Kimya ve Biyoloji soru bankalarından her akşam 2 adet ünite testi çözerek netleri sabitle!' }
                              ].sort((a, b) => a.ratio - b.ratio)[0];
                              return <p className="text-slate-300 font-medium text-[11px] mt-1">{minCourse.reco}</p>;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DETAYLI KONU ANALİZLİ SINAV KARNESİ (ÖĞRENCİ İÇİN YENİ EK) */}
                    {studentReport.sonuclar.length > 0 && (
                      (() => {
                        const activeExamResult = studentReport.sonuclar.find(r => r.id === studentSelectedKarneExamId) || 
                          studentReport.sonuclar[studentReport.sonuclar.length - 1];

                        const topicAnalysis = getTopicAnalysisForStudent(
                          studentReport.student.id,
                          activeExamResult.id,
                          activeExamResult.tur || (activeExamResult as any).sinav_turu || 'TYT',
                          {
                            turkce: activeExamResult.turkce_net,
                            matematik: activeExamResult.matematik_net,
                            sosyal: activeExamResult.sosyal_net,
                            fen: activeExamResult.fen_net
                          }
                        );

                        // Aggregate failures across ALL exams for warnings
                        const aggregateTopicFailures = () => {
                          const topicStats: Record<string, { topic: string; subject: string; correct: number; incorrect: number; total: number }> = {};
                          
                          studentReport.sonuclar.forEach(r => {
                            const analysis = getTopicAnalysisForStudent(
                              studentReport.student.id,
                              r.id,
                              r.tur || (r as any).sinav_turu || 'TYT',
                              {
                                turkce: r.turkce_net,
                                matematik: r.matematik_net,
                                sosyal: r.sosyal_net,
                                fen: r.fen_net
                              }
                            );
                            
                            const addStats = (subjectName: string, topicsList: any[]) => {
                              if (!topicsList) return;
                              topicsList.forEach(t => {
                                const key = `${subjectName}-${t.ad}`;
                                if (!topicStats[key]) {
                                  topicStats[key] = {
                                    topic: t.ad,
                                    subject: subjectName,
                                    correct: 0,
                                    incorrect: 0,
                                    total: 0
                                  };
                                }
                                topicStats[key].correct += t.d;
                                topicStats[key].incorrect += t.y;
                                topicStats[key].total += t.soru;
                              });
                            };
                            
                            addStats("TÜRKÇE", analysis.turkce);
                            addStats("MATEMATİK", analysis.matematik);
                            addStats("SOSYAL BİLGİLER", analysis.sosyal);
                            addStats("FEN BİLİMLERİ", analysis.fen);
                          });
                          
                          return Object.values(topicStats)
                            .map(ts => {
                              const successRate = ts.total > 0 ? Math.round((ts.correct / ts.total) * 100) : 100;
                              return {
                                ...ts,
                                successRate
                              };
                            })
                            .filter(ts => ts.incorrect > 0 || ts.successRate < 70)
                            .sort((a, b) => b.incorrect - a.incorrect || a.successRate - b.successRate);
                        };

                        const weakTopics = aggregateTopicFailures();
                        
                        const getTopicAdvice = (subject: string, topic: string, incorrects: number, successRate: number) => {
                          const normalizedTopic = topic.toLowerCase();
                          let advice = "Bu konuda son denemelerde hedefin altında başarı sağlanmıştır. Konu anlatımı tekrar edilip eksikler kapatılmalıdır.";
                          
                          if (normalizedTopic.includes("yazım")) {
                            advice = "Yazım kuralları kuramsal tekrarları yapılmalı, TDK güncel kılavuzu taranmalı ve her gün 15 kural sorusu çözülmelidir.";
                          } else if (normalizedTopic.includes("noktalama")) {
                            advice = "Noktalama işaretlerinin işlevleri özetlenmeli, özellikle virgülün kullanılmadığı yerlere dikkat edilerek 50 soru çözülmelidir.";
                          } else if (normalizedTopic.includes("paragraf") || normalizedTopic.includes("anlam")) {
                            advice = "Okuma anlama ve odaklanma hızı artırılmalı, günlük 20 paragraf sorusu süreli (dakika tutarak) çözülmelidir.";
                          } else if (normalizedTopic.includes("dil bilgisi") || normalizedTopic.includes("ögeleri") || normalizedTopic.includes("ekler")) {
                            advice = "Sözcük yapısı ve cümle ögeleri kuralları formülleştirilerek çalışılmalı, soru bankasından karma testler taranmalıdır.";
                          } else if (normalizedTopic.includes("problem")) {
                            advice = "Denklem kurma ve oran-orantı temelleri zayıf. Her gün farklı tiplerden (sayı, kesir, hız) 15 problem çözülmelidir.";
                          } else if (normalizedTopic.includes("sayılar") || normalizedTopic.includes("rasyonel")) {
                            advice = "Temel sayı kümeleri ve rasyonel işlemlerde işlem hatası yapılıyor. Sorularda işlemleri yazarak yapması önerilir.";
                          } else if (normalizedTopic.includes("mutlak değer") || normalizedTopic.includes("eşitsizlik")) {
                            advice = "Mutlak değer özellikleri (pozitif/negatif dışarı çıkış kuralları) formül özet kartlarına yazılmalı ve pekiştirilmelidir.";
                          } else if (normalizedTopic.includes("geometri") || normalizedTopic.includes("açılar") || normalizedTopic.includes("üçgen") || normalizedTopic.includes("dörtgen")) {
                            advice = "Şekil görme pratiği eksik. Geometride üçgen/açı kuralları özet kartı yapılmalı, her soruda yardımcı çizimler yapılmalıdır.";
                          } else if (normalizedTopic.includes("fonksiyonlar")) {
                            advice = "Fonksiyon tanım kümeleri ve grafik okuma eksik. Grafik sorularında x ve y eksen değerlerini eşleştirme pratiği yapılmalıdır.";
                          } else if (normalizedTopic.includes("fizik") || normalizedTopic.includes("ısı") || normalizedTopic.includes("kuvvet") || normalizedTopic.includes("dalga") || normalizedTopic.includes("basınç")) {
                            advice = "Fiziksel formüllerin günlük hayattaki sözel mantık yorumları kavranmalı, MEB kazanım testleri taranmalıdır.";
                          } else if (normalizedTopic.includes("kimya") || normalizedTopic.includes("atom") || normalizedTopic.includes("periyodik") || normalizedTopic.includes("etkileşim")) {
                            advice = "Kimya element adlandırmaları, atom modelleri ve etkileşim kuralları ezberlenmeli, kavram haritası çıkarılmalıdır.";
                          } else if (normalizedTopic.includes("hücre") || normalizedTopic.includes("biyoloji") || normalizedTopic.includes("canlılar") || normalizedTopic.includes("kalıtım")) {
                            advice = "Biyoloji konu ezberleri eksik kalmış. Görsel şemalar (soyağacı, hücre organelleri) çizilerek hafızaya alınmalıdır.";
                          }
                          
                          return {
                            title: `${subject} - ${topic}`,
                            stats: `Geçmiş denemelerde ${incorrects} yanlış yapıldı (Başarı: %${successRate})`,
                            advice
                          };
                        };

                        const topWeakTopics = weakTopics.slice(0, 3).map(ts => getTopicAdvice(ts.subject, ts.topic, ts.incorrect, ts.successRate));

                        const renderSubjectPanel = (title: string, net: number, topicsList: any[], borderTheme: string, textTheme: string) => {
                          if (!topicsList || topicsList.length === 0) return null;
                          return (
                            <div className={`bg-slate-900/40 border ${borderTheme} rounded-2xl p-4 space-y-3`}>
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <span className={`text-xs font-black uppercase tracking-wider ${textTheme}`}>{title}</span>
                                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 ${textTheme}`}>{net} NET</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                  <thead>
                                    <tr className="text-slate-500 font-extrabold border-b border-slate-850/50 text-[10px] uppercase">
                                      <th className="pb-1.5">Konu Adı</th>
                                      <th className="pb-1.5 text-center w-8">S</th>
                                      <th className="pb-1.5 text-center w-8">D</th>
                                      <th className="pb-1.5 text-center w-8">Y</th>
                                      <th className="pb-1.5 text-center w-8">B</th>
                                      <th className="pb-1.5 text-center w-12">Başarı</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850/20 font-medium">
                                    {topicsList.map((t: any, idx: number) => {
                                      const successRate = t.soru > 0 ? Math.round((t.d / t.soru) * 100) : 100;
                                      let rateColor = "text-emerald-400";
                                      let rateBg = "bg-emerald-950/40 border-emerald-900/50";
                                      if (successRate < 40) {
                                        rateColor = "text-rose-400";
                                        rateBg = "bg-rose-950/40 border-rose-900/50";
                                      } else if (successRate < 75) {
                                        rateColor = "text-amber-400";
                                        rateBg = "bg-amber-950/40 border-amber-900/50";
                                      }
                                      
                                      return (
                                        <tr key={idx} className="hover:bg-slate-900/20">
                                          <td className="py-2 pr-2 font-semibold text-slate-300">{t.ad}</td>
                                          <td className="py-2 text-center font-bold text-slate-400">{t.soru}</td>
                                          <td className="py-2 text-center font-extrabold text-emerald-400">{t.d}</td>
                                          <td className="py-2 text-center font-extrabold text-rose-400">{t.y}</td>
                                          <td className="py-2 text-center font-bold text-slate-500">{t.b}</td>
                                          <td className="py-2 text-center">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${rateBg} ${rateColor}`}>
                                              %{successRate}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-6">
                            {/* Dynamic AI Study Recommendations based on aggregations */}
                            {topWeakTopics.length > 0 && (
                              <div className="bg-amber-950/10 border border-amber-900/40 rounded-2xl p-5 space-y-2 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs text-amber-400 font-black uppercase tracking-wider">
                                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                                  <span>Yapay Zeka Destekli Akademik Gelişim & Konu Analizi Uyarıların</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                  Geçmiş tüm deneme sınavların analiz edilerek en çok hata yaptığın ve odaklanması gereken kritik konular aşağıda listelenmiştir:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                  {topWeakTopics.map((item, idx) => (
                                    <div key={idx} className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1.5 flex flex-col justify-between hover:border-amber-900/60 transition">
                                      <div>
                                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block truncate">{item.title}</span>
                                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{item.stats}</span>
                                        <p className="text-[10px] text-slate-300 leading-relaxed font-semibold mt-1.5">
                                          {item.advice}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Karne Render and Selector */}
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-tight flex items-center gap-2">
                                    <Award size={16} className="text-indigo-400" />
                                    <span>Sınav Karnem & Konu Analizlerim</span>
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-bold block mt-0.5">Konu düzeyinde doğru, yanlış ve başarı oranların analizi</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Sınav Seçimi:</span>
                                  <select
                                    value={studentSelectedKarneExamId || activeExamResult.id}
                                    onChange={(e) => setStudentSelectedKarneExamId(Number(e.target.value))}
                                    className="bg-slate-950 border border-slate-850 hover:border-slate-750 text-xs font-black text-indigo-400 rounded-xl px-3 py-1.5 focus:outline-none"
                                  >
                                    {studentReport.sonuclar.map((r) => (
                                      <option key={r.id} value={r.id}>{r.sinav_adi} ({r.tur || (r as any).sinav_turu || 'TYT'})</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-400">
                                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Öğrenci</span>
                                  <span className="text-slate-200 font-black block truncate mt-0.5">{studentReport.student.ad_soyad}</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Sınıf / Alan</span>
                                  <span className="text-slate-200 font-black block mt-0.5">{studentReport.student.sinif_adi} • {studentReport.student.alan}</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Sınav Adı</span>
                                  <span className="text-slate-200 font-black block truncate mt-0.5">{activeExamResult.sinav_adi}</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Sınav Türü</span>
                                  <span className="text-indigo-400 font-black block mt-0.5">{activeExamResult.tur || (activeExamResult as any).sinav_turu || 'TYT'}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                                <div className="space-y-6">
                                  {renderSubjectPanel("TÜRKÇE", activeExamResult.turkce_net, topicAnalysis.turkce, "border-cyan-900/40 bg-cyan-950/5", "text-cyan-400")}
                                  {renderSubjectPanel("SOSYAL BİLGİLER", activeExamResult.sosyal_net, topicAnalysis.sosyal, "border-amber-900/40 bg-amber-950/5", "text-amber-400")}
                                </div>
                                <div className="space-y-6">
                                  {renderSubjectPanel("MATEMATİK", activeExamResult.matematik_net, topicAnalysis.matematik, "border-blue-900/40 bg-blue-950/5", "text-blue-400")}
                                  {renderSubjectPanel("FEN BİLİMLERİ", activeExamResult.fen_net, topicAnalysis.fen, "border-emerald-900/40 bg-emerald-950/5", "text-emerald-400")}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* Interactive targets checklist */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Sınav karnelerim */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tüm Sınav Karnelerim</h4>
                          <span className="text-[10px] text-amber-400 font-bold animate-pulse">Sınava Tıklayın 🔍</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-3">Herhangi bir denemeye tıklayarak ders bazlı netlerinizi ve başarı analizlerini detaylıca görebilirsiniz.</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="text-slate-500 text-[9px] uppercase font-bold border-b border-slate-800">
                                <th className="pb-2">Sınav Adı</th>
                                <th className="pb-2 text-center">Net Dağılımı (T/S/M/F)</th>
                                <th className="pb-2 text-center">Toplam Net</th>
                                <th className="pb-2 text-right">Puan</th>
                                <th className="pb-2 text-right">Detay</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {studentReport.sonuclar.map((r, idx) => (
                                <tr 
                                  key={idx}
                                  onClick={() => setSelectedExamDetail(r)}
                                  className="cursor-pointer hover:bg-slate-800/50 transition-colors group"
                                >
                                  <td className="py-2.5 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{r.sinav_adi}</td>
                                  <td className="py-2.5 text-center font-mono text-slate-400 text-[11px]">{r.turkce_net}/{r.sosyal_net}/{r.matematik_net}/{r.fen_net}</td>
                                  <td className="py-2.5 text-center font-bold text-slate-200">{r.toplam_net}</td>
                                  <td className="py-2.5 text-right font-black text-blue-400">{r.puan}</td>
                                  <td className="py-2.5 text-right text-slate-500 group-hover:text-amber-400 transition-colors">
                                    <Eye size={14} className="inline" />
                                  </td>
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

                      {/* Öğretmen Tavsiyeleri */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Öğretmenlerimin Ders Çalışma Tavsiyeleri</h4>
                        {!(studentReport.tavsiyeler && studentReport.tavsiyeler.length > 0) ? (
                          <div className="text-center py-6 text-xs text-slate-500">Öğretmenleriniz henüz ders bazlı tavsiye eklememiş.</div>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {studentReport.tavsiyeler.map(t => (
                              <div key={t.id} className="bg-slate-950/60 p-3 border border-slate-850 rounded-xl space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                                      {t.ders_adi}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{t.ogretmen_adi}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-medium">
                                    {t.tarih ? new Date(t.tarih).toLocaleDateString('tr-TR') : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{t.tavsiye_metni}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Modern Global Footer */}
                <div className="mt-12 border-t border-slate-800/60 pt-6 pb-2 text-center space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kurum Analiz Sistemi (K.A.S) © 2026</p>
                  <p className="text-[9px] text-slate-600 font-semibold">Tüm Hakları Saklıdır.</p>
                </div>
              </div>
            )}
          </>
        )}
            </main>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedExamDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setSelectedExamDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-slate-950/20 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-blue-500/10">
                    Sınav Karnesi Detayı
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/10">
                    {selectedExamDetail.sinav_adi?.toUpperCase().includes('LGS') ? 'LGS' : selectedExamDetail.sinav_adi?.toUpperCase().includes('AYT') ? 'AYT' : 'TYT'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">{selectedExamDetail.sinav_adi}</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{selectedExamDetail.tarih || 'Sınav Tarihi Belirtilmemiş'}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Score and Total Net stats row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl text-center space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Toplam Net</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">{selectedExamDetail.toplam_net}</span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl text-center space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Sınav Puanı</span>
                    <span className="text-2xl font-black text-blue-400 font-mono">{selectedExamDetail.puan}</span>
                  </div>
                </div>

                {/* Course Breakdowns */}
                <div className="space-y-4">
                  <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-800 pb-1.5">Ders Bazlı Detaylı Analiz</h4>
                  {(() => {
                    const isLGS = selectedExamDetail.sinav_adi?.toUpperCase().includes('LGS') || selectedExamDetail.sinav_turu === 'LGS';
                    const maxTurkce = isLGS ? 20 : 40;
                    const maxSosyal = isLGS ? 10 : 20;
                    const maxMatematik = isLGS ? 20 : 40;
                    const maxFen = isLGS ? 20 : 20;

                    const courses = [
                      { name: "Türkçe", net: selectedExamDetail.turkce_net, max: maxTurkce, color: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
                      { name: "Sosyal Bilimler", net: selectedExamDetail.sosyal_net, max: maxSosyal, color: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
                      { name: "Matematik", net: selectedExamDetail.matematik_net, max: maxMatematik, color: "bg-indigo-500", text: "text-indigo-400", bg: "bg-indigo-500/10" },
                      { name: "Fen Bilimleri", net: selectedExamDetail.fen_net, max: maxFen, color: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" }
                    ];

                    return (
                      <div className="space-y-3.5">
                        {courses.map((c, i) => {
                          const pct = Math.min(100, Math.max(0, (c.net / c.max) * 100));
                          return (
                            <div key={i} className="bg-slate-950/20 border border-slate-850 p-3 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${c.color}`}></span>
                                  <span className="text-xs font-bold text-slate-300">{c.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-slate-100 font-mono">{c.net}</span>
                                  <span className="text-[10px] text-slate-500 font-medium font-mono"> / {c.max} Net</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                  <div className={`h-full ${c.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-wider">
                                  <span>Başarı Oranı</span>
                                  <span className={c.text}>{pct.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Sınav Akıllı Öneri */}
                <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-2xl text-[11px] text-indigo-300 leading-relaxed">
                  <span className="font-extrabold uppercase block text-[9px] text-indigo-400 mb-1">🎯 K.A.S Sınav Tavsiyesi:</span>
                  {(() => {
                    const minCourse = [
                      { name: 'Türkçe', ratio: selectedExamDetail.turkce_net / (selectedExamDetail.sinav_adi?.toUpperCase().includes('LGS') ? 20 : 40), reco: 'Türkçe netlerini arttırmak için okuma hızını arttıracak çalışmalar yapmalı ve paragraf soru çözümlerinde süre tutmayı alışkanlık haline getirmelisin.' },
                      { name: 'Matematik', ratio: selectedExamDetail.matematik_net / (selectedExamDetail.sinav_adi?.toUpperCase().includes('LGS') ? 20 : 40), reco: 'Matematik dersinde formülleri ezberlemek yerine mantığını anlamaya odaklanmalı ve çözemediğin her sorunun çözüm videosunu mutlaka izlemelisin.' },
                      { name: 'Sosyal Bilimler', ratio: selectedExamDetail.sosyal_net / (selectedExamDetail.sinav_adi?.toUpperCase().includes('LGS') ? 10 : 20), reco: 'Sosyal netleri için temel kavramlar sözlüğüne göz gezdirebilir ve dökümanlardan konu özetleri okuyarak hızlıca net artışı sağlayabilirsin.' },
                      { name: 'Fen Bilimleri', ratio: selectedExamDetail.fen_net / 20, reco: 'Fen bilimleri için her gün düzenli olarak 1-2 ünite değerlendirme testi çözerek formül ve bilgi boşluklarını kapatmalısın.' }
                    ].sort((a, b) => a.ratio - b.ratio)[0];
                    return minCourse.reco;
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center">
                <button
                  onClick={() => setSelectedExamDetail(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2 rounded-xl transition"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating KAS.ai Assistant Trigger for Landing Page */}
      {!isLoggedIn && !isAiChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
          {/* Greeting Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            onClick={() => setIsAiChatOpen(true)}
            className="bg-slate-900/95 text-slate-100 px-4 py-3 rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 text-xs font-semibold max-w-[240px] leading-relaxed relative pointer-events-auto cursor-pointer select-none group hover:border-indigo-400 transition-all"
          >
            {/* Pulsing indicator */}
            <span className="flex h-2 w-2 absolute top-2 right-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <div className="pr-2">
              <span className="text-indigo-400 font-extrabold block text-[10px] uppercase tracking-wider mb-0.5">KAS.ai Yapay Zeka:</span>
              <span className="text-slate-200">Merhaba! Size nasıl yardımcı olabilirim?</span>
            </div>
            {/* Arrow */}
            <div className="absolute right-5 -bottom-1.5 w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/30 rotate-45"></div>
          </motion.div>

          {/* Floating Action Button */}
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAiChatOpen(true)}
            className="pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/35 border border-indigo-400/30 cursor-pointer relative overflow-hidden group focus:outline-none"
          >
            {/* Pulsing Background Wave */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -inset-x-20 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50 group-hover:animate-pulse"></div>
            <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-300 animate-pulse text-white" />
          </motion.button>
        </div>
      )}

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showPwaBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 bg-slate-900/98 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-2xl shadow-blue-500/5 z-50 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/15 flex items-center justify-center shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100">K.A.S Uygulamasını Yükleyin</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Kurum Analiz portalını telefonunuza veya bilgisayarınıza bir uygulama gibi yükleyerek anında erişim sağlayın.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissPwa}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {isIos ? (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <p className="font-bold text-blue-400">iOS (Safari) Kurulum Adımları:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Tarayıcı altındaki <span className="font-bold text-slate-200">"Paylaş" (Share)</span> butonuna tıklayın.</li>
                  <li>Açılan menüden <span className="font-bold text-slate-200">"Ana Ekrana Ekle" (Add to Home Screen)</span> seçeneğini seçin.</li>
                  <li>Sağ üstteki <span className="font-bold text-slate-200">"Ekle"</span> butonuna tıklayarak işlemi tamamlayın.</li>
                </ol>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={handleInstallClick}
                  disabled={!pwaPrompt}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  <Zap size={14} /> Şimdi Yükle
                </button>
                <button
                  onClick={handleDismissPwa}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Daha Sonra
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoggedIn && <AiChatWidget
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        user={user}
        token={token}
      />}
    </div>
  );
}
