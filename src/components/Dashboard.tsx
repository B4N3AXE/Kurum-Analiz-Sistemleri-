
import { io } from 'socket.io-client';

import React, { useState, useEffect } from 'react';
import { User, SinavTanim } from '../types';
import { 
  Clock, Calendar, AlertTriangle, TrendingUp, Users, BookOpen, Layers,
  Search, Filter, ArrowUpRight, ArrowDownRight, Sparkles, GraduationCap, 
  ChevronRight, ChevronLeft, ChevronDown, Award, Check, Info, FileText
} from 'lucide-react';

interface DashboardProps {
  user: User;
  token: string;
}

interface TrendData {
  sinav_adi: string;
  tarih: string;
  ortalama_net: number;
  en_yuksek_net: number;
  tur: string;
}

interface RiskStudent {
  id: number;
  ad_soyad: string;
  sinif_adi: string;
  alan: string;
  son_net: number;
  durum: string;
}

export const TYT_SUBJECT_TOPICS = {
  turkce: [
    { ad: "Sözcükte ve Söz Öbeklerinde Anlam", soru: 4 },
    { ad: "Cümlenin Anlamı ve Yorumu", soru: 3 },
    { ad: "Yazım Kuralları", soru: 2 },
    { ad: "Noktalama İşaretleri", soru: 2 },
    { ad: "Ad Soylu Sözcükler", soru: 2 },
    { ad: "Ekler ve Sözcük Yapısı", soru: 1 },
    { ad: "Cümlenin Ögeleri", soru: 1 },
    { ad: "Paragrafın Yapısı", soru: 3 },
    { ad: "Anlatım Teknikleri & Düşünce Geliştirme", soru: 1 },
    { ad: "Paragrafta Anlam & Yorum", soru: 21 }
  ],
  matematik: [
    { ad: "Rasyonel Sayılar", soru: 2 },
    { ad: "Üslü ve Köklü İfadeler", soru: 2 },
    { ad: "Sayılar (Temel Kavramlar)", soru: 3 },
    { ad: "1. Dereceden Denklem & Eşitsizlik", soru: 2 },
    { ad: "Mutlak Değer", soru: 1 },
    { ad: "Kümeler", soru: 1 },
    { ad: "Mantık", soru: 1 },
    { ad: "Fonksiyonlar", soru: 1 },
    { ad: "Bölünebilme ve EBOB-EKOK", soru: 1 },
    { ad: "Veri ve İstatistik", soru: 1 },
    { ad: "Problemler (Sayı, Yaş, Hız vb.)", soru: 12 },
    { ad: "Permütasyon, Kombinasyon, Olasılık", soru: 2 },
    { ad: "Doğru ve Üçgende Açılar", soru: 2 },
    { ad: "Üçgende Alan, Eşlik ve Benzerlik", soru: 3 },
    { ad: "Çokgenler ve Dörtgenler", soru: 3 },
    { ad: "Uzay Geometri (Katı Cisimler)", soru: 2 }
  ],
  sosyal: [
    { ad: "İlk ve Orta Çağlarda Türk Dünyası", soru: 1 },
    { ad: "Selçuklu ve Osmanlı Dönemi", soru: 1 },
    { ad: "Devrimler Çağında Devlet-Toplum", soru: 1 },
    { ad: "Milli Mücadele Dönemi", soru: 1 },
    { ad: "Atatürkçülük ve İnkılap Tarihi", soru: 1 },
    { ad: "Doğal Sistemler (Coğrafya)", soru: 2 },
    { ad: "Beşeri Sistemler (Coğrafya)", soru: 1 },
    { ad: "Küresel Ortam: Bölgeler & Ülkeler", soru: 1 },
    { ad: "Çevre ve Toplum", soru: 1 },
    { ad: "Felsefeyi Tanıma & Akımlar", soru: 2 },
    { ad: "Felsefenin Temel Konuları", soru: 3 },
    { ad: "Din Kül. (İnanç, Değerler, Ahlak)", soru: 5 }
  ],
  fen: [
    { ad: "Fizik Bilimine Giriş & Isı Sıcaklık", soru: 2 },
    { ad: "Basınç, Kaldırma Kuvveti, Hareket", soru: 2 },
    { ad: "Elektrik, Manyetizma & Dalgalar", soru: 3 },
    { ad: "Kimya Bilimi & Atom Periyodik Sistem", soru: 2 },
    { ad: "Kimyasal Türler Arası Etkileşimler", soru: 3 },
    { ad: "Kimyanın Temel Yasaları & Karışımlar", soru: 2 },
    { ad: "Canlılar Dünyası & Yaşam Bilimi", soru: 2 },
    { ad: "Hücre ve Hücre Bölünmeleri", soru: 2 },
    { ad: "Kalıtımın Genel İlkeleri & Ekosistem", soru: 2 }
  ]
};


export const AYT_SAY_SUBJECT_TOPICS = {
  ayt_matematik: [
    { ad: "Polinomlar", soru: 2 },
    { ad: "2. Dereceden Denklemler", soru: 1 },
    { ad: "Parabol", soru: 1 },
    { ad: "Eşitsizlikler", soru: 1 },
    { ad: "Logaritma", soru: 2 },
    { ad: "Diziler", soru: 1 },
    { ad: "Limit ve Süreklilik", soru: 2 },
    { ad: "Türev", soru: 4 },
    { ad: "İntegral", soru: 4 },
    { ad: "Trigonometri", soru: 4 },
  ],
  ayt_fizik: [
    { ad: "Vektörler ve Bağıl Hareket", soru: 2 },
    { ad: "Newton'un Hareket Yasaları", soru: 1 },
    { ad: "İş, Güç ve Enerji", soru: 1 },
    { ad: "Atışlar", soru: 1 },
    { ad: "Elektrik ve Manyetizma", soru: 3 },
    { ad: "Çembersel Hareket", soru: 2 },
    { ad: "Basit Harmonik Hareket", soru: 1 },
    { ad: "Dalgalar ve Optik", soru: 2 },
    { ad: "Modern Fizik", soru: 1 }
  ],
  ayt_kimya: [
    { ad: "Modern Atom Teorisi", soru: 2 },
    { ad: "Gazlar", soru: 1 },
    { ad: "Sıvı Çözeltiler", soru: 2 },
    { ad: "Kimyasal Tepkimelerde Enerji", soru: 1 },
    { ad: "Kimyasal Tepkimelerde Hız", soru: 1 },
    { ad: "Kimyasal Denge", soru: 2 },
    { ad: "Asit Baz Dengesi", soru: 1 },
    { ad: "Elektrokimya", soru: 2 },
    { ad: "Organik Kimya", soru: 1 }
  ],
  ayt_biyoloji: [
    { ad: "Sinir Sistemi", soru: 1 },
    { ad: "Endokrin Sistem", soru: 1 },
    { ad: "Duyu Organları", soru: 1 },
    { ad: "Destek ve Hareket Sistemi", soru: 1 },
    { ad: "Sindirim Sistemi", soru: 1 },
    { ad: "Dolaşım ve Bağışıklık Sistemi", soru: 2 },
    { ad: "Solunum Sistemi", soru: 1 },
    { ad: "Üriner Sistem", soru: 1 },
    { ad: "Üreme Sistemi", soru: 1 },
    { ad: "Bitki Biyolojisi", soru: 2 },
    { ad: "Hücresel Solunum", soru: 1 }
  ]
};

export const AYT_EA_SUBJECT_TOPICS = {
  ayt_matematik: AYT_SAY_SUBJECT_TOPICS.ayt_matematik,
  ayt_edebiyat: [
    { ad: "Anlam Bilgisi", soru: 4 },
    { ad: "Şiir Bilgisi", soru: 3 },
    { ad: "İslamiyet Öncesi ve Geçiş Dönemi", soru: 1 },
    { ad: "Divan Edebiyatı", soru: 5 },
    { ad: "Tanzimat Edebiyatı", soru: 2 },
    { ad: "Servetifünun ve Fecriati", soru: 2 },
    { ad: "Milli Edebiyat", soru: 2 },
    { ad: "Cumhuriyet Dönemi Edebiyatı", soru: 4 },
    { ad: "Edebi Akımlar", soru: 1 }
  ],
  ayt_tarih1: [
    { ad: "Tarih ve Zaman", soru: 1 },
    { ad: "İnsanlığın İlk Dönemleri", soru: 1 },
    { ad: "Orta Çağ'da Dünya", soru: 1 },
    { ad: "İlk ve Orta Çağlarda Türk Dünyası", soru: 1 },
    { ad: "İslam Medeniyetinin Doğuşu", soru: 1 },
    { ad: "Türklerin İslamiyet'i Kabulü", soru: 1 },
    { ad: "Osmanlı Devleti (Kuruluş ve Yükselme)", soru: 2 },
    { ad: "Atatürk İlke ve İnkılapları", soru: 2 }
  ],
  ayt_cografya1: [
    { ad: "Doğal Sistemler", soru: 2 },
    { ad: "Beşeri Sistemler", soru: 2 },
    { ad: "Mekansal Bir Sentez: Türkiye", soru: 1 },
    { ad: "Küresel Ortam: Bölgeler", soru: 1 }
  ]
};

export const AYT_SOZ_SUBJECT_TOPICS = {
  ayt_edebiyat: AYT_EA_SUBJECT_TOPICS.ayt_edebiyat,
  ayt_tarih1: AYT_EA_SUBJECT_TOPICS.ayt_tarih1,
  ayt_cografya1: AYT_EA_SUBJECT_TOPICS.ayt_cografya1,
  ayt_tarih2: [
    { ad: "Tarih Bilimi", soru: 1 },
    { ad: "İlk Çağ Uygarlıkları", soru: 1 },
    { ad: "İslam Tarihi", soru: 1 },
    { ad: "Türk-İslam Devletleri", soru: 2 },
    { ad: "Osmanlı Siyasi Tarihi", soru: 3 },
    { ad: "Milli Mücadele Dönemi", soru: 2 },
    { ad: "Çağdaş Türk ve Dünya Tarihi", soru: 1 }
  ],
  ayt_cografya2: [
    { ad: "Doğal ve Beşeri Sistemler", soru: 3 },
    { ad: "Türkiye'nin Ekonomik Coğrafyası", soru: 2 },
    { ad: "Küresel Ortam ve Çevre", soru: 3 }
  ],
  ayt_felsefe_grubu: [
    { ad: "Psikolojiye Giriş", soru: 2 },
    { ad: "Öğrenme, Bellek, Düşünme", soru: 2 },
    { ad: "Sosyolojiye Giriş", soru: 2 },
    { ad: "Toplumsal Yapı", soru: 2 },
    { ad: "Klasik Mantık", soru: 2 },
    { ad: "Sembolik Mantık", soru: 2 }
  ],
  ayt_din: [
    { ad: "İnanç ve İbadet", soru: 2 },
    { ad: "Hz. Muhammed'in Hayatı", soru: 2 },
    { ad: "Vahiy ve Akıl", soru: 2 }
  ]
};

export const LGS_SUBJECT_TOPICS = {
  turkce: [
    { ad: "Sözcükte Anlam", soru: 3 },
    { ad: "Cümlede Anlam", soru: 3 },
    { ad: "Paragrafta Anlam ve Yorum", soru: 8 },
    { ad: "Yazım ve Noktalama", soru: 2 },
    { ad: "Sözel Mantık ve Muhakeme", soru: 2 },
    { ad: "Fiilimsiler ve Cümlenin Ögeleri", soru: 2 }
  ],
  matematik: [
    { ad: "Çarpanlar ve Katlar", soru: 2 },
    { ad: "Üslü İfadeler", soru: 3 },
    { ad: "Kareköklü İfadeler", soru: 3 },
    { ad: "Veri Analizi", soru: 2 },
    { ad: "Basit Olayların Olma Olasılığı", soru: 2 },
    { ad: "Cebirsel İfadeler ve Özdeşlikler", soru: 3 },
    { ad: "Doğrusal Denklemler ve Eşitsizlikler", soru: 3 },
    { ad: "Üçgenler ve Dönüşüm Geometrisi", soru: 2 }
  ],
  sosyal: [
    { ad: "Bir Kahraman Doğuyor", soru: 3 },
    { ad: "Milli Uyanış: Bağımsızlık Yolunda", soru: 3 },
    { ad: "Milli Bir Destan: Ya İstiklal Ya Ölüm!", soru: 4 }
  ],
  fen: [
    { ad: "Mevsimler ve İklim", soru: 3 },
    { ad: "DNA ve Genetik Kod", soru: 4 },
    { ad: "Basınç", soru: 3 },
    { ad: "Madde ve Endüstri", soru: 4 },
    { ad: "Basit Makineler", soru: 3 },
    { ad: "Enerji Dönüşümleri & Çevre", soru: 3 }
  ]
};

export function getTopicAnalysisForStudent(
  studentId: number,
  examId: number,
  examType: string,
  subjectNets: { turkce: number; matematik: number; sosyal: number; fen: number }
) {
  const isLgs = examType === 'LGS';
  const subjects = isLgs ? LGS_SUBJECT_TOPICS : TYT_SUBJECT_TOPICS;
  const randomSeed = (studentId * 17 + examId * 31) % 100;

  const generateForSubject = (subjKey: 'turkce' | 'matematik' | 'sosyal' | 'fen', netScore: number) => {
    const topics = subjects[subjKey];
    if (!topics) return [];
    
    const totalQuestions = topics.reduce((acc, t) => acc + t.soru, 0);
    let totalD = Math.min(totalQuestions, Math.max(0, Math.ceil(netScore)));
    let totalY = 0;

    if (netScore > 0 && netScore < totalQuestions) {
      const extraWrong = 1 + (randomSeed % 4);
      totalY = extraWrong;
      totalD = Math.min(totalQuestions - totalY, Math.round(netScore + totalY * 0.25));
    } else if (netScore <= 0) {
      totalD = 0;
      totalY = Math.min(totalQuestions, Math.round(Math.abs(netScore) * 4) || 2);
    }

    const results = topics.map((t) => {
      const share = t.soru / totalQuestions;
      let d = Math.round(totalD * share);
      let y = Math.round(totalY * share);

      if (d + y > t.soru) {
        if (d > y) d = t.soru - y;
        else y = t.soru - d;
      }

      return {
        ad: t.ad,
        soru: t.soru,
        d: d,
        y: y,
        b: t.soru - (d + y)
      };
    });

    let currentSumD = results.reduce((acc, r) => acc + r.d, 0);
    let diffD = totalD - currentSumD;
    let attempts = 0;
    while (diffD !== 0 && attempts < 50) {
      attempts++;
      const idx = (randomSeed + attempts) % results.length;
      const r = results[idx];
      if (diffD > 0 && (r.d + r.y < r.soru)) {
        r.d++;
        diffD--;
      } else if (diffD < 0 && r.d > 0) {
        r.d--;
        diffD++;
      }
    }

    let currentSumY = results.reduce((acc, r) => acc + r.y, 0);
    let diffY = totalY - currentSumY;
    attempts = 0;
    while (diffY !== 0 && attempts < 50) {
      attempts++;
      const idx = (randomSeed + attempts * 3) % results.length;
      const r = results[idx];
      if (diffY > 0 && (r.d + r.y < r.soru)) {
        r.y++;
        diffY--;
      } else if (diffY < 0 && r.y > 0) {
        r.y--;
        diffY++;
      }
    }

    results.forEach((r) => {
      r.b = r.soru - (r.d + r.y);
      if (r.b < 0) r.b = 0;
    });

    return results;
  };

  return {
    turkce: generateForSubject('turkce', subjectNets.turkce),
    matematik: generateForSubject('matematik', subjectNets.matematik),
    sosyal: generateForSubject('sosyal', subjectNets.sosyal),
    fen: generateForSubject('fen', subjectNets.fen)
  };
}

export default function Dashboard({ user, token }: DashboardProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalClasses: 0,
    totalExams: 0,
    riskCount: 0,
    averageTytNet: 0,
    activeStudyingCount: 0,
    riskStudents: [] as RiskStudent[],
    trends: [] as TrendData[],
    recentExams: [] as any[],
    thresholds: { TYT: 60, AYT: 45, LGS: 55 } as Record<string, number>,
    classAnalysis: [] as any[],
    teacherAnalysis: [] as any[]
  });

  const getDynamicInsights = () => {
    if (stats.totalExams === 0 && stats.totalStudents === 0) {
      return {
        oneriler: "Kurumunuza ait henüz yeterli veri bulunmuyor. Analiz için öğrencileri ve sınav sonuçlarını sisteme ekleyin.",
        basari: "Veri bekleniyor. Sınav analizleri yüklendiğinde kurum gelişim grafikleri burada oluşacaktır.",
        risk: "Sistemde risk grubunu belirlemek için sınav sonuçlarına ihtiyaç duyulmaktadır.",
        calisma: "Öğrencilerinizi kütüphane ve etüt modülünü kullanmaya teşvik ederek çalışma verilerini oluşturun.",
        akilli: "K.A.S. yapay zeka asistanı, kurumunuzun veri akışı başladığında size özel stratejiler üretecektir."
      };
    }

    if (stats.totalExams === 0) {
      return {
        oneriler: "Öğrencileriniz sisteme kayıtlı ancak henüz sınav verisi girilmemiş. İlk deneme sınavı sonuçlarını yükleyin.",
        basari: "Öğrenci profilleriniz hazır. Sınav analizleri yüklendiğinde başarı raporları aktifleşecektir.",
        risk: "Risk analizi yapabilmek için öğrencilerin sınavlardaki performans verilerine ihtiyaç var.",
        calisma: "Öğrencilerin bireysel çalışma sürelerini artırmak için Pomodoro ve kütüphane teşviki yapabilirsiniz.",
        akilli: "Sınav verileri yüklendiğinde K.A.S. eksik konuları belirleyerek otomatik etüt planı oluşturabilir."
      };
    }

    let basariText = `Genel sınav ortalaması ${stats.averageTytNet > 0 ? stats.averageTytNet : 0} net seviyesinde.`;
    if (stats.trends && stats.trends.length > 1) {
      const son = stats.trends[stats.trends.length - 1].ortalama_net;
      const onceki = stats.trends[stats.trends.length - 2].ortalama_net;
      if (son > onceki) {
        basariText = `Son denemede ortalama netlerde ${(son - onceki).toFixed(1)} netlik artış kaydedildi.`;
      } else if (son < onceki) {
        basariText = `Son denemede ortalama netlerde ${(onceki - son).toFixed(1)} netlik bir düşüş gözlendi.`;
      }
    }

    return {
      oneriler: stats.riskCount > 0 ? `Risk grubundaki ${stats.riskCount} öğrenci için ek etüt ve birebir destek planlaması yapılması önerilir.` : "Öğrencilerin genel ilerleyişi hedeflere uygun ilerliyor, mevcut etüt programını koruyabilirsiniz.",
      basari: basariText,
      risk: stats.riskCount > 0 ? `Eşik netin altında kalan ${stats.riskCount} öğrenci için rehberlik servisiyle iletişime geçilmesi öneriliyor.` : "Şu an belirlenen başarı eşiklerinin altında kalan, kritik seviyede riskli öğrenci bulunmuyor.",
      calisma: stats.activeStudyingCount > 0 ? `Şu an kütüphanede ${stats.activeStudyingCount} öğrenci aktif olarak çalışıyor. Odak süreleri verimli seviyede.` : "Genel etüt katılımını artırmak için öğrencilere deneme sonrası eksik konu bildirimleri gönderebilirsiniz.",
      akilli: "Gelecek haftaki denemeler öncesi K.A.S. sistemi üzerinden düşük ortalamalı dersler için toplu etüt çağrısı açabilirsiniz."
    };
  };

  const dynamicInsights = getDynamicInsights();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeChartTab, setActiveChartTab] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');

  // Teacher dashboard specific states
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('HEPSİ');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const [activeStudentTab, setActiveStudentTab] = useState<'netler' | 'dersler' | 'program'>('netler');
  const [activeDetailsTab, setActiveDetailsTab] = useState<'gelisim' | 'karne'>('gelisim');
  const [selectedKarneExamId, setSelectedKarneExamId] = useState<number | null>(null);

  // Teacher statistics & Gelişim Takip states
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [selectedClassStats, setSelectedClassStats] = useState<string>('HEPSİ');
  const [selectedSubjectStats, setSelectedSubjectStats] = useState<'turkce' | 'matematik' | 'sosyal' | 'fen'>('matematik');
  
  // Interventions, notes and parent message composition
  const [studentNoteInput, setStudentNoteInput] = useState('');
  const [parentMessageText, setParentMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Calendar states
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  useEffect(() => {
    if (user.rol === 'ogretmen') {
      const fetchStudentsAndProfile = async () => {
        try {
          // Fetch student list
          const resStudents = await fetch(`/api/ogrenci?kurum_id=${user.kurum_id}&aktif=true`, {
            headers: { 'Authorization': token }
          });
          if (resStudents.ok) {
            const data = await resStudents.json();
            setStudents(data);
          }

          // Fetch teacher profile
          const resTeachers = await fetch(`/api/ogretmen`, {
            headers: { 'Authorization': token }
          });
          if (resTeachers.ok) {
            const teachersList = await resTeachers.json();
            const me = teachersList.find((t: any) => t.id === user.id);
            if (me) {
              setTeacherProfile(me);
              // Set default selected class stats to first assigned class if available
              if (me.siniflar && me.siniflar.length > 0) {
                setSelectedClassStats('HEPSİ');
              }
            }
          }
        } catch (err) {
          console.error("Error fetching teacher dashboard data:", err);
        }
      };
      fetchStudentsAndProfile();
    }
  }, [user.kurum_id, user.rol, user.id, token]);

  // YKS/LGS countdown state (June 19, 2027 at 10:15 vs June 6, 2027 at 09:30)
  const [countdownType, setCountdownType] = useState<'YKS' | 'LGS'>('YKS');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // Clock interval
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Countdown calculations
    const yksDate = new Date('2027-06-19T10:15:00').getTime();
    const lgsDate = new Date('2027-06-06T09:30:00').getTime();

    const updateCountdown = () => {
      const targetDate = countdownType === 'YKS' ? yksDate : lgsDate;
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, mins, secs });
    };

    updateCountdown();
    const cInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(cInterval);
  }, [countdownType]);

  useEffect(() => {
    const fetchStats = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/dashboard/stats?kurum_id=${user.kurum_id}&rol=${user.rol}&user_id=${user.id}`, {
          headers: { 'Authorization': token }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Stats fetching error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    
    fetchStats(false);
    
    // Fallback polling
    const interval = setInterval(() => {
      fetchStats(true);
    }, 15000); 
    
    // Real-time socket connection
    const socket = io(); // Connects to the same host
    socket.emit('join_kurum', user.kurum_id);
    
    socket.on('session_update', (newSession) => {
       setStats((prev: any) => {
          if (!prev) return prev;
          let students = prev.activeStudyingStudents ? [...prev.activeStudyingStudents] : [];
          const idx = students.findIndex((s: any) => s.id === newSession.id);
          
          if (!newSession.calisiyor) {
             if (idx !== -1) students.splice(idx, 1);
          } else {
             if (idx !== -1) {
                students[idx] = newSession;
             } else {
                students.push(newSession);
             }
          }
          
          return { ...prev, activeStudyingStudents: students, activeStudyingCount: students.length };
       });
    });

    return () => {
       clearInterval(interval);
       socket.disconnect();
    };
  }, [user.kurum_id, user.rol, user.id, token]);

  // Live timer tick for active studying students
  useEffect(() => {
    if (!stats.activeStudyingStudents || stats.activeStudyingStudents.length === 0) return;
    
    const tickInterval = setInterval(() => {
      setStats(prev => {
        if (!prev.activeStudyingStudents) return prev;
        
        const updatedStudents = prev.activeStudyingStudents.map((stud: any) => {
          if (!stud.calisiyor) return stud;
          
          let newKalan = stud.kalan_sure;
          if (stud.mod === 'pomodoro') {
             newKalan = Math.max(0, newKalan - 1);
          } else {
             newKalan = newKalan + 1; // stopwatch mode actually increments
          }
          return { ...stud, kalan_sure: newKalan };
        });
        
        return { ...prev, activeStudyingStudents: updatedStudents };
      });
    }, 1000);
    
    return () => clearInterval(tickInterval);
  }, [stats.activeStudyingStudents?.length]);

  const renderCalendar = () => {
    const today = new Date();
    const year = calendarYear;
    const month = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const weekDays = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

    const blankDays = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);
    const dayCells = Array.from({ length: totalDays }, (_, i) => i + 1);
    const allCells = [...blankDays, ...dayCells];

    // Navigate month handlers
    const handlePrevMonth = () => {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(prev => prev - 1);
      } else {
        setCalendarMonth(prev => prev - 1);
      }
      setSelectedCalendarDate(null);
    };

    const handleNextMonth = () => {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(prev => prev + 1);
      } else {
        setCalendarMonth(prev => prev + 1);
      }
      setSelectedCalendarDate(null);
    };

    const handleToday = () => {
      setCalendarMonth(today.getMonth());
      setCalendarYear(today.getFullYear());
      setSelectedCalendarDate(null);
    };

    // Filter exams for this calendar view's month
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthExams = (stats.recentExams || []).filter(e => {
      if (!e.tarih) return false;
      const examDateOnly = e.tarih.includes('T') ? e.tarih.split('T')[0] : e.tarih;
      return examDateOnly.startsWith(monthPrefix);
    }).sort((a, b) => a.tarih.localeCompare(b.tarih));

    // If a day is selected, filter to that day
    const selectedExams = selectedCalendarDate 
      ? (stats.recentExams || []).filter(e => {
          if (!e.tarih) return false;
          const examDateOnly = e.tarih.includes('T') ? e.tarih.split('T')[0] : e.tarih;
          return examDateOnly === selectedCalendarDate;
        })
      : [];

    const formatDateTurkish = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      } catch {
        return dateStr;
      }
    };

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-950/20 flex flex-col gap-4">
        {/* Calendar Header with Controls */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/15">
              <Calendar size={14} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Kurum Sınav Planı</h4>
              <p className="text-[9px] text-slate-500 font-bold">Canlı Takvim Senkronizasyonu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
              title="Önceki Ay"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition cursor-pointer"
              title="Bugüne Git"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
              title="Sonraki Ay"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Current Month and Year Label */}
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-extrabold text-blue-400 text-sm">
            {monthNames[month]} {year}
          </span>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {monthExams.length} Sınav Tanımlı
          </span>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
          {weekDays.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {allCells.map((d, index) => {
            if (d === null) {
              return <div key={`empty-${index}`} className="py-2"></div>;
            }

            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedCalendarDate === cellDateStr;
            
            // Check if there are exams on this day
            const dayExams = (stats.recentExams || []).filter(e => {
              if (!e.tarih) return false;
              const examDateOnly = e.tarih.includes('T') ? e.tarih.split('T')[0] : e.tarih;
              return examDateOnly === cellDateStr;
            });
            const hasExams = dayExams.length > 0;

            return (
              <button
                key={`day-${d}`}
                type="button"
                onClick={() => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  setSelectedCalendarDate(selectedCalendarDate === dateStr ? null : dateStr);
                }}
                className={`py-1.5 rounded-lg font-bold flex flex-col items-center justify-center relative cursor-pointer group transition duration-150 min-h-[38px] ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-500"
                    : isToday
                    ? "bg-blue-950/60 text-blue-400 border border-blue-500/30"
                    : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <span className="z-10 text-[11px] font-mono font-bold">{d}</span>
                
                {/* Exam Indicator (Minik işaret) */}
                {hasExams && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 animate-pulse ${
                    isSelected ? "bg-white" : "bg-indigo-400"
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-850/60 my-1"></div>

        {/* Dynamic Exam List under Calendar */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {selectedCalendarDate ? (
                <>📅 Seçili Günün Sınavları ({formatDateTurkish(selectedCalendarDate)})</>
              ) : (
                <>🗓️ Bu Ayın Sınavları ({monthNames[month]})</>
              )}
            </span>
            {selectedCalendarDate && (
              <button
                type="button"
                onClick={() => setSelectedCalendarDate(null)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-extrabold uppercase cursor-pointer"
              >
                Hepsini Göster
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {selectedCalendarDate ? (
              selectedExams.length === 0 ? (
                <div className="text-[10px] text-slate-500 italic py-3 text-center bg-slate-950/20 border border-slate-900 rounded-xl">
                  Bu tarihte tanımlanmış bir sınav bulunmamaktadır.
                </div>
              ) : (
                selectedExams.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-xl bg-indigo-950/15 border border-indigo-500/20">
                    <div className="overflow-hidden mr-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-1.5 py-0.5 rounded mb-1">
                        {e.tur}
                      </span>
                      <h5 className="text-[11px] font-black text-slate-200 leading-tight truncate">{e.ad}</h5>
                    </div>
                    {e.katilimci_sayisi > 0 ? (
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-emerald-400 font-black block">{e.ortalama_net} Net</span>
                        <span className="text-[8px] text-slate-500 font-bold block">{e.katilimci_sayisi} Katılım</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-bold shrink-0">Henüz Uygulanmadı</span>
                    )}
                  </div>
                ))
              )
            ) : monthExams.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic py-4 text-center bg-slate-950/20 border border-slate-900 rounded-xl">
                Bu ay için tanımlanmış sınav bulunmamaktadır.
              </div>
            ) : (
              monthExams.map(e => {
                const examDateOnly = e.tarih?.includes('T') ? e.tarih.split('T')[0] : e.tarih;
                const examDay = examDateOnly ? Number(examDateOnly.split('-')[2]) : 1;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedCalendarDate(examDateOnly)}
                    className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-950/30 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/30 transition text-slate-300"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-center shrink-0">
                        <span className="text-[10px] font-black font-mono leading-none text-slate-200">{examDay}</span>
                        <span className="text-[6.5px] font-extrabold text-slate-500 uppercase tracking-tight leading-none mt-0.5">
                          {monthNames[month].substring(0, 3)}
                        </span>
                      </div>
                      <div className="overflow-hidden text-left">
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase mr-1.5 ${
                          e.tur === 'TYT' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                          e.tur === 'AYT' ? 'bg-purple-500/5 text-purple-400 border-purple-500/10' :
                          'bg-amber-500/5 text-amber-400 border-amber-500/10'
                        }`}>
                          {e.tur}
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-300 leading-tight">{e.ad}</span>
                      </div>
                    </div>
                    <ChevronRight size={10} className="text-slate-600 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const fetchStudentDetail = async (studentId: number) => {
    setLoadingStudentDetails(true);
    setSelectedStudentDetails(null);
    setSelectedKarneExamId(null);
    setActiveDetailsTab('gelisim');
    try {
      const res = await fetch(`/api/ogrenci/${studentId}`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedStudentDetails(data);
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  const handleAddNote = async (studentId: number) => {
    if (!studentNoteInput.trim()) return;
    setNoteSuccess(false);
    try {
      const res = await fetch(`/api/ogrenci/${studentId}/not`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token 
        },
        body: JSON.stringify({
          rehber_id: user.id,
          not_metni: studentNoteInput.trim()
        })
      });
      if (res.ok) {
        setStudentNoteInput('');
        setNoteSuccess(true);
        // Reload details to show the new note instantly
        const resDetail = await fetch(`/api/ogrenci/${studentId}`, {
          headers: { 'Authorization': token }
        });
        if (resDetail.ok) {
          const detailData = await resDetail.json();
          setSelectedStudentDetails(detailData);
        }
        setTimeout(() => setNoteSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error adding student note:", err);
    }
  };

  const handleSendParentMessage = async (parentUserId: number, studentId: number, studentName: string) => {
    if (!parentMessageText.trim()) return;
    setIsSendingMessage(true);
    setMessageSuccess(false);
    try {
      const res = await fetch(`/api/mesaj`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          gonderen_id: user.id,
          alici_id: parentUserId,
          ogrenci_id: studentId,
          konu: `${studentName} Gelişim Durumu (Öğretmen Bilgilendirmesi)`,
          mesaj: parentMessageText.trim()
        })
      });
      if (res.ok) {
        setParentMessageText('');
        setMessageSuccess(true);
        setTimeout(() => setMessageSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Error sending parent message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Find max net for chart bounding box
  const maxNetValue = stats.trends.length > 0 ? Math.max(...stats.trends.map(t => Math.max(t.ortalama_net, t.en_yuksek_net))) : 100;
  const chartHeight = 160;
  const chartWidth = 500;

  return (
    <div className="space-y-6">
      {user.rol === 'ogretmen' && (
        <div className="bg-gradient-to-r from-blue-900/20 via-slate-900 to-indigo-900/10 border border-blue-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="space-y-1 z-10">
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/10 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
              <GraduationCap size={12} className="animate-pulse" /> Öğretmen Çalışma Alanı
            </span>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              Hoş Geldiniz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">{user.ad_soyad}</span> 🧑‍🏫
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Atandığınız sınıfların genel başarı durumunu, ders ortalamalarını ve bireysel gelişim grafiklerini tek ekrandan analiz edin.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-3 rounded-xl z-10">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase block leading-tight">ATANDIĞINIZ SINIFLAR</span>
              <span className="text-xs font-bold text-blue-400">
                {stats.classAnalysis?.map((c: any) => c.sinif_adi).join(', ') || 'Yükleniyor...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upper Widgets: Countdown and Clock */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* YKS/LGS Timer */}
        <div className="md:col-span-8 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Clock className="text-blue-500 animate-pulse" size={20} />
                {countdownType === 'YKS' ? '2027 YKS Sayacı' : '2027 LGS Sayacı'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {countdownType === 'YKS'
                  ? '19 Haziran 2027 - Saat: 10:15 Hedefine Kalan Zaman'
                  : '6 Haziran 2027 - Saat: 09:30 LGS Sınavına Kalan Zaman'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setCountdownType('YKS')}
                className={`text-[9px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  countdownType === 'YKS' ? 'bg-blue-600 text-white shadow shadow-blue-500/15' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                YKS
              </button>
              <button
                type="button"
                onClick={() => setCountdownType('LGS')}
                className={`text-[9px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  countdownType === 'LGS' ? 'bg-purple-600 text-white shadow shadow-purple-500/15' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LGS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center my-4 z-10">
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl">
              <span className={`block text-2xl md:text-3xl font-black ${countdownType === 'YKS' ? 'text-blue-400' : 'text-purple-400'}`}>{countdown.days}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gün</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl">
              <span className="block text-2xl md:text-3xl font-black text-indigo-400">{countdown.hours}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Saat</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl">
              <span className="block text-2xl md:text-3xl font-black text-cyan-400">{countdown.mins}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dakika</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl">
              <span className="block text-2xl md:text-3xl font-black text-emerald-400">{countdown.secs}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Saniye</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Date */}
        <div className="md:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-800/20 rounded-full blur-xl"></div>
          <div className="flex justify-between items-center z-10 border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sistem Saati</span>
            <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <div className="my-auto flex flex-row items-center justify-center gap-6 z-10">
            {/* Analog Clock */}
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg opacity-90">
                <circle cx="50" cy="50" r="46" fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                
                {/* Ticks */}
                {[...Array(12)].map((_, i) => (
                  <line 
                    key={i} 
                    x1="50" 
                    y1="10" 
                    x2="50" 
                    y2={i % 3 === 0 ? "16" : "13"} 
                    stroke="rgba(255,255,255,0.5)" 
                    strokeWidth={i % 3 === 0 ? "3" : "1.5"} 
                    transform={`rotate(${i * 30} 50 50)`} 
                  />
                ))}
                
                {/* KAS Logo / Text */}
                <text x="50" y="38" fontSize="15" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontWeight="bold" letterSpacing="1">KAS</text>

                {/* Hands */}
                <line 
                  x1="50" y1="50" x2="50" y2="28" 
                  stroke="rgba(255,255,255,0.9)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  transform={`rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5} 50 50)`} 
                />
                <line 
                  x1="50" y1="50" x2="50" y2="15" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  transform={`rotate(${currentTime.getMinutes() * 6 + currentTime.getSeconds() * 0.1} 50 50)`} 
                />
                <line 
                  x1="50" y1="50" x2="50" y2="12" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  transform={`rotate(${currentTime.getSeconds() * 6} 50 50)`} 
                />
                <circle cx="50" cy="50" r="3" fill="#ef4444" />
              </svg>
            </div>
            
            <div className="text-left">
              <div className="text-3xl font-black text-slate-100 tracking-wider">
                {currentTime.toLocaleTimeString('tr-TR')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aurora Glassmorphism KPI Stat Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Toplam Öğrenci */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden group border border-white/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#4F7DFF]/15 rounded-full blur-xl group-hover:bg-[#4F7DFF]/30 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Toplam Öğrenci</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tracking-tight">{stats.totalStudents ?? 0}</span>
                <span className="text-xs font-extrabold text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">+12 Bu Ay</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Aktif Kayıtlı Öğrenci Portföyü</p>
            </div>
            <div className="p-3 bg-[#4F7DFF]/10 text-[#4F7DFF] border border-[#4F7DFF]/20 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
              <Users size={22} />
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between h-8">
            <svg className="w-full h-8" viewBox="0 0 100 25">
              <path d="M0,20 Q20,5 40,15 T80,8 T100,2" fill="none" stroke="#4F7DFF" strokeWidth="2.5" />
              <path d="M0,20 Q20,5 40,15 T80,8 T100,2 L100,25 L0,25 Z" fill="rgba(79, 125, 255, 0.15)" />
            </svg>
          </div>
        </div>

        {/* Card 2: Aktif Öğretmen */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden group border border-white/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7C5CFF]/15 rounded-full blur-xl group-hover:bg-[#7C5CFF]/30 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Aktif Öğretmen</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tracking-tight">{stats.teacherAnalysis?.length ?? 0}</span>
                <span className="text-xs font-extrabold text-[#29D8FF] bg-[#29D8FF]/10 px-2 py-0.5 rounded-full border border-[#29D8FF]/20">%100 Katılım</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Branş & Rehberlik Kadrosu</p>
            </div>
            <div className="p-3 bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
              <GraduationCap size={22} />
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between h-8">
            <svg className="w-full h-8" viewBox="0 0 100 25">
              <path d="M0,18 Q25,8 50,12 T100,5" fill="none" stroke="#7C5CFF" strokeWidth="2.5" />
              <path d="M0,18 Q25,8 50,12 T100,5 L100,25 L0,25 Z" fill="rgba(124, 92, 255, 0.15)" />
            </svg>
          </div>
        </div>

        {/* Card 3: Ortalama Başarı */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden group border border-white/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#29D8FF]/15 rounded-full blur-xl group-hover:bg-[#29D8FF]/30 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ortalama Başarı</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tracking-tight">
                  {stats.totalExams > 0 ? (stats.averageTytNet > 0 ? `%${stats.averageTytNet}` : '%0') : 'N/A'}
                </span>
                {stats.trends && stats.trends.length > 1 && stats.trends[stats.trends.length - 1].ortalama_net > stats.trends[stats.trends.length - 2].ortalama_net && (
                  <span className="text-xs font-extrabold text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">
                    +{((stats.trends[stats.trends.length - 1].ortalama_net - stats.trends[stats.trends.length - 2].ortalama_net) / stats.trends[stats.trends.length - 2].ortalama_net * 100).toFixed(1)}% Yükseliş
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Genel Sınav Net Performansı</p>
            </div>
            <div className="p-3 bg-[#29D8FF]/10 text-[#29D8FF] border border-[#29D8FF]/20 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              <TrendingUp size={22} />
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between h-8">
            <svg className="w-full h-8" viewBox="0 0 100 25">
              {stats.trends && stats.trends.length > 0 ? (
                <>
                  <path d={`M0,22 Q30,${22 - (stats.trends.length > 1 ? (stats.trends[1].ortalama_net / 120 * 20) : 10)} 60,${22 - (stats.trends.length > 2 ? (stats.trends[2].ortalama_net / 120 * 20) : 15)} T100,${25 - (stats.trends[stats.trends.length-1].ortalama_net / 120 * 25)}`} fill="none" stroke="#29D8FF" strokeWidth="2.5" />
                  <path d={`M0,22 Q30,${22 - (stats.trends.length > 1 ? (stats.trends[1].ortalama_net / 120 * 20) : 10)} 60,${22 - (stats.trends.length > 2 ? (stats.trends[2].ortalama_net / 120 * 20) : 15)} T100,${25 - (stats.trends[stats.trends.length-1].ortalama_net / 120 * 25)} L100,25 L0,25 Z`} fill="rgba(41, 216, 255, 0.15)" />
                </>
              ) : (
                <>
                  <path d="M0,22 Q30,22 60,22 T100,22" fill="none" stroke="#29D8FF" strokeWidth="2.5" strokeDasharray="4 4" />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Card 4: Riskli Öğrenci */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden group border border-red-500/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF5F57]/20 rounded-full blur-xl group-hover:bg-[#FF5F57]/40 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Riskli Öğrenci</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-[#FF5F57] tracking-tight">{stats.riskCount ?? 0}</span>
                <span className="text-xs font-extrabold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded-full border border-[#FFB020]/20">Takipte</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Limit Altı Performans Grubu</p>
            </div>
            <div className="p-3 bg-[#FF5F57]/15 text-[#FF5F57] border border-[#FF5F57]/30 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20 animate-pulse">
              <AlertTriangle size={22} />
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between h-8">
            <svg className="w-full h-8" viewBox="0 0 100 25">
              <path d="M0,5 Q40,20 70,12 T100,22" fill="none" stroke="#FF5F57" strokeWidth="2.5" />
              <path d="M0,5 Q40,20 70,12 T100,22 L100,25 L0,25 Z" fill="rgba(255, 95, 87, 0.15)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Aurora Glassmorphism AI Paneli (Premium Yapay Zeka Öneriler Paneli) */}
      <div className="glass-card ai-glow-panel p-6 border border-[#7C5CFF]/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4F7DFF]/15 via-[#7C5CFF]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#4F7DFF] to-[#7C5CFF] rounded-2xl text-white shadow-lg shadow-indigo-500/30">
              <Sparkles size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                ✨ KAS.ai Akıllı Yönetim & Analiz Paneli
              </h3>
              <p className="text-xs font-bold text-[#29D8FF] mt-0.5">
                Kurum verileriniz yapay zeka tarafından anlık olarak analiz ediliyor
              </p>
            </div>
          </div>

          <span className="text-xs font-black bg-[#7C5CFF]/20 text-[#29D8FF] border border-[#7C5CFF]/40 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#29D8FF] animate-ping"></span>
            GÜNCEL ANALİZ RAPORU
          </span>
        </div>

        {/* 5 AI Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 relative z-10">
          {/* Module 1: ✨ Bugünkü Öneriler */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#4F7DFF]/50 transition-all group cursor-pointer hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#29D8FF] uppercase tracking-wider">✨ Bugünkü Öneriler</span>
              <span className="text-lg">💡</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {dynamicInsights.oneriler}
            </p>
          </div>

          {/* Module 2: 📊 Başarı Analizi */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#30D158]/50 transition-all group cursor-pointer hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#30D158] uppercase tracking-wider">📊 Başarı Analizi</span>
              <span className="text-lg">📈</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {dynamicInsights.basari}
            </p>
          </div>

          {/* Module 3: Risk Uyarıları */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#FF5F57]/50 transition-all group cursor-pointer hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#FF5F57] uppercase tracking-wider">Risk Uyarıları</span>
              <span className="text-lg">🚨</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {dynamicInsights.risk}
            </p>
          </div>

          {/* Module 4: 📚 Çalışma Tavsiyeleri */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#7C5CFF]/50 transition-all group cursor-pointer hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#7C5CFF] uppercase tracking-wider">📚 Çalışma Tavsiyeleri</span>
              <span className="text-lg">📖</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {dynamicInsights.calisma}
            </p>
          </div>

          {/* Module 5: 🎯 Akıllı Öneriler */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#FFB020]/50 transition-all group cursor-pointer hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#FFB020] uppercase tracking-wider">🎯 Akıllı Öneriler</span>
              <span className="text-lg">🎯</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {dynamicInsights.akilli}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Study Tracker Widget (Features 1, 2, 4) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
              Aktif Çalışma Odası (Canlı Takip)
            </h3>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
            Anlık Canlı ({stats.activeStudyingCount || 0})
          </span>
        </div>

        {stats.activeStudyingStudents && stats.activeStudyingStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {stats.activeStudyingStudents.map((stud: any) => (
              <div 
                key={stud.id} 
                className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex justify-between items-start gap-1.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-200 block truncate group-hover:text-emerald-400 transition-colors">
                      {stud.ad_soyad}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block">
                      {stud.sinif_adi}
                    </span>
                  </div>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded font-black uppercase flex-shrink-0 tracking-wider">
                    {stud.mod === 'pomodoro' ? 'Pomodoro' : 'Serbest'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-900 flex justify-between items-center">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Çalışılan Ders</span>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]" title={stud.ders_adi}>
                      {stud.ders_adi}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Kalan/Geçen</span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {stud.mod === 'pomodoro' 
                        ? `${Math.floor(stud.kalan_sure / 60)}:${(stud.kalan_sure % 60).toString().padStart(2, '0')}`
                        : `${Math.floor(stud.kalan_sure / 60)} dk`
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs italic bg-slate-950/20 rounded-xl border border-slate-850/60 border-dashed">
            Şu an ders çalışan canlı öğrenci bulunmamaktadır. Öğrenciler ders kronometresini/pomodorosunu başlattığında burada anlık görebilirsiniz.
          </div>
        )}
      </div>

      {/* Analytics, Calendar & Risk Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (xl:col-span-8) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Exam trend chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={18} />
                Sınav Net Gelişim Grafikleri (Ayrı Ayrı)
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Sınav türlerine göre ayrılmış ortalama net grafikleri</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
              {(['TYT', 'AYT', 'LGS'] as const).map((t) => {
                const count = stats.trends.filter(x => x.tur === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveChartTab(t)}
                    className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                      activeChartTab === t
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
            const filteredTrends = stats.trends.filter(t => t.tur === activeChartTab);
            const maxLimit = activeChartTab === 'TYT' ? 120 : activeChartTab === 'AYT' ? 80 : 90;
            const currentMaxNetValue = filteredTrends.length > 0 
              ? Math.max(maxLimit, ...filteredTrends.map(t => Math.max(t.ortalama_net, t.en_yuksek_net)))
              : maxLimit;

            if (filteredTrends.length === 0) {
              return (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs italic">
                  {activeChartTab} türünde henüz deneme sınavı sonucu girilmemiştir.
                </div>
              );
            }

            return (
              <div className="w-full">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                  {/* Horizontal guide lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                    const val = Math.round(p * currentMaxNetValue);
                    const y = chartHeight - p * (chartHeight - 20) - 10;
                    return (
                      <g key={i}>
                        <line x1="30" y1={y} x2={chartWidth} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                        <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                      </g>
                    );
                  })}

                  {/* Plot curves */}
                  {(() => {
                    const pointsAvg: string[] = [];
                    const pointsMax: string[] = [];
                    const count = filteredTrends.length;
                    const stepX = (chartWidth - 50) / (count > 1 ? count - 1 : 1);

                    filteredTrends.forEach((t, index) => {
                      const x = 40 + index * stepX;
                      const yAvg = chartHeight - (t.ortalama_net / currentMaxNetValue) * (chartHeight - 20) - 10;
                      const yMax = chartHeight - (t.en_yuksek_net / currentMaxNetValue) * (chartHeight - 20) - 10;
                      pointsAvg.push(`${x},${yAvg}`);
                      pointsMax.push(`${x},${yMax}`);
                    });

                    return (
                      <>
                        {/* Average Net Line */}
                        <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={pointsAvg.join(' ')} />
                        {/* Max Net Line */}
                        <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" points={pointsMax.join(' ')} />

                        {/* Points Circles */}
                        {filteredTrends.map((t, index) => {
                          const x = 40 + index * stepX;
                          const yAvg = chartHeight - (t.ortalama_net / currentMaxNetValue) * (chartHeight - 20) - 10;
                          const yMax = chartHeight - (t.en_yuksek_net / currentMaxNetValue) * (chartHeight - 20) - 10;

                          return (
                            <g key={index}>
                              <circle cx={x} cy={yAvg} r="4" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
                              <circle cx={x} cy={yMax} r="3" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                              {/* Value label */}
                              <text x={x} y={yAvg - 8} fill="#94a3b8" className="text-[9px] font-bold font-mono" textAnchor="middle">{t.ortalama_net}</text>
                              {/* Name label on axis */}
                              <text x={x} y={chartHeight + 12} fill="#64748b" className="text-[8px] font-semibold" textAnchor="middle" transform={`rotate(-15, ${x}, ${chartHeight + 12})`}>
                                {t.sinav_adi.substring(0, 10)}...
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
                <div className="flex justify-center items-center gap-6 mt-6 text-[10px] font-bold">
                  <span className="flex items-center gap-2 text-blue-400">
                    <span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Ortalama Net
                  </span>
                  <span className="flex items-center gap-2 text-emerald-400">
                    <span className="w-3 h-0.5 bg-emerald-500 stroke-dasharray inline-block"></span> En Yüksek Net
                  </span>
                  <span className="text-slate-600 font-medium">• {activeChartTab} Sınavı Maksimum Limit: {maxLimit} Net</span>
                </div>
              </div>
            );
          })()}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span className="font-extrabold text-blue-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={13} className="text-blue-400" /> Rehberlik & Motivasyon Köşesi
              </span>
              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/10 font-bold uppercase">Günün Tavsiyesi</span>
            </div>
            
            {/* Dynamic motivation and tip selection based on day of month */}
            {(() => {
              const tips = [
                {
                  quote: "Gelecek, bugünden ona hazırlananlarındır.",
                  author: "Malcolm X",
                  advice: "Deneme sınavlarından sonra mutlaka yanlış analizlerinizi yapın. Her yanlış soru, öğrenilecek yeni bir kazanımdır."
                },
                {
                  quote: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
                  author: "Robert Collier",
                  advice: "Pomodoro tekniği ile çalışırken mola sürelerinde ekrandan uzak durun. Gözlerinizi ve zihninizi dinlendirmek odaklanmayı %40 artırır."
                },
                {
                  quote: "Nereye gideceğini bilmiyorsan, hangi yoldan gittiğinin hiçbir önemi yoktur.",
                  author: "Lewis Carroll",
                  advice: "Haftalık hedeflerinizi somutlaştırın. 'Çok soru çözeceğim' yerine 'Bu hafta fizikten 120, matematikten 150 soru çözeceğim' şeklinde plan yapın."
                },
                {
                  quote: "Hiç kimse geriye gidip yeni bir başlangıç yapamaz; ama bugün yeni bir son yazabilir.",
                  author: "Carl Bard",
                  advice: "Zorlandığınız dersleri günün ilk saatlerinde çalışın. Zihniniz en dinç durumdayken soyut kavramları ve formülleri çok daha kolay kavrarsınız."
                },
                {
                  quote: "Yapabildiğin her şeyi yap, ancak o zaman kendinin ne olduğunu anlayabilirsin.",
                  author: "Cicero",
                  advice: "Uykudan hemen önce yapılan 15 dakikalık hızlı konu tekrarları, bilginin uzun süreli belleğe geçişini (pekişmeyi) muazzam şekilde hızlandırır."
                },
                {
                  quote: "Düşlemek yetmez, yaşamak için de eyleme geçmek gerekir.",
                  author: "Johann Wolfgang von Goethe",
                  advice: "Deneme çözmek sadece bilgi ölçmez, aynı zamanda zaman yönetimi ve stres kontrolü sınavıdır. Sınav esnasında turlama tekniğini mutlaka uygulayın."
                },
                {
                  quote: "Yarınlar bugünün azimli adımlarında saklıdır.",
                  author: "Bilinmiyor",
                  advice: "Masada çalışırken telefonunuzu başka bir odaya bırakın. Sadece bildirim ışığı bile odaklanma derinliğinizi kesintiye uğratmak için yeterlidir."
                }
              ];
              const index = new Date().getDate() % tips.length;
              const current = tips[index];
              return (
                <div className="space-y-3">
                  <div className="bg-slate-950/40 border border-slate-850/80 p-3 rounded-xl relative">
                    <p className="text-xs text-slate-300 italic font-semibold leading-relaxed">
                      "{current.quote}"
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block text-right mt-1.5">— {current.author}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide block flex items-center gap-1">
                      💡 Başarı İpucu:
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                      {current.advice}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Calendar and Sidebar elements */}
        <div className="xl:col-span-4 space-y-4">
          {renderCalendar()}
        </div>
      </div>

      {/* 1. CLASSROOM & TEACHER ANALYSIS GRID (Suggestion 1) */}
      {user.rol === 'ogretmen' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Card 1: Ders İstatistikleri (Course & Class Metrics) */}
          <div className="xl:col-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">📊</span> Ders İstatistikleri
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sınıflarınızın başarı ve konu seviyelerini analiz edin</p>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full font-bold uppercase">Canlı Veri</span>
              </div>

              {/* Filters: Class and Subject Selectors */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Sınıf Seçimi</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedClassStats('HEPSİ')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${
                        selectedClassStats === 'HEPSİ'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/15'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      Tüm Sınıflar
                    </button>
                    {teacherProfile?.siniflar?.map((c: string, idx: number) => (
                      <button
                        key={c || idx}
                        type="button"
                        onClick={() => setSelectedClassStats(c)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${
                          selectedClassStats === c
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/15'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Branş/Ders Seçimi</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(['turkce', 'matematik', 'sosyal', 'fen'] as const).map((subject) => {
                      const labels = { turkce: 'Türkçe', matematik: 'Matematik', sosyal: 'Sosyal', fen: 'Fen' };
                      const colors = {
                        turkce: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
                        matematik: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5',
                        sosyal: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
                        fen: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                      };
                      const activeColors = {
                        turkce: 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/15',
                        matematik: 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/15',
                        sosyal: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/15',
                        fen: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/15'
                      };
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => setSelectedSubjectStats(subject)}
                          className={`text-[10px] font-bold py-2 px-1 rounded-lg border text-center transition ${
                            selectedSubjectStats === subject
                              ? activeColors[subject]
                              : `bg-slate-950/60 border-slate-850 hover:bg-slate-900 ${colors[subject]}`
                          }`}
                        >
                          {labels[subject]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Success Metrics Display */}
              {(() => {
                let avgNet = 0;
                if (selectedClassStats === 'HEPSİ') {
                  const count = stats.classAnalysis?.length || 0;
                  if (count > 0) {
                    const sum = stats.classAnalysis.reduce((acc, c) => {
                      const val = selectedSubjectStats === 'turkce' ? c.turkce
                        : selectedSubjectStats === 'matematik' ? c.matematik
                        : selectedSubjectStats === 'sosyal' ? c.sosyal
                        : c.fen;
                      return acc + (Number(val) || 0);
                    }, 0);
                    avgNet = Number((sum / count).toFixed(1));
                  }
                } else {
                  const selectedClassData = stats.classAnalysis?.find(c => c.sinif_adi === selectedClassStats);
                  avgNet = selectedClassData 
                    ? (selectedSubjectStats === 'turkce' ? selectedClassData.turkce
                       : selectedSubjectStats === 'matematik' ? selectedClassData.matematik
                       : selectedSubjectStats === 'sosyal' ? selectedClassData.sosyal
                       : selectedClassData.fen)
                    : 0;
                }

                const maxQ = (selectedSubjectStats === 'turkce' || selectedSubjectStats === 'matematik') ? 40 : 20;
                const successPct = Math.min(100, Math.max(0, Math.round((avgNet / maxQ) * 100)));

                // Dynamic topics generator helper
                const modifier = (avgNet / maxQ) * 100;
                const adjust = (base: number) => Math.min(100, Math.max(10, Math.round(base * 0.35 + modifier * 0.65)));
                const getTopics = () => {
                  if (selectedSubjectStats === 'turkce') {
                    return [
                      { name: 'Paragrafta Anlam', pct: adjust(75), state: 'Güçlü' },
                      { name: 'Yazım ve Noktalama', pct: adjust(55), state: 'Geliştirilmeli' },
                      { name: 'Sözcükte Anlam', pct: adjust(82), state: 'Güçlü' },
                      { name: 'Dil Bilgisi / Yapı', pct: adjust(60), state: 'Sınırda' }
                    ];
                  } else if (selectedSubjectStats === 'sosyal') {
                    return [
                      { name: 'Tarih - Temel Olaylar', pct: adjust(78), state: 'Güçlü' },
                      { name: 'Coğrafya - Harita Okuma', pct: adjust(48), state: 'Kritik' },
                      { name: 'Felsefe Kavramları', pct: adjust(68), state: 'Sınırda' },
                      { name: 'Din Kültürü Bilgisi', pct: adjust(88), state: 'Güçlü' }
                    ];
                  } else if (selectedSubjectStats === 'fen') {
                    return [
                      { name: 'Fizik - Mekanik', pct: adjust(44), state: 'Kritik' },
                      { name: 'Kimya - Bileşikler', pct: adjust(65), state: 'Sınırda' },
                      { name: 'Biyoloji - Hücre', pct: adjust(72), state: 'Ortalama' },
                      { name: 'Optik ve Dalgalar', pct: adjust(52), state: 'Geliştirilmeli' }
                    ];
                  } else {
                    return [
                      { name: 'Trigonometri', pct: adjust(58), state: 'Geliştirilmeli' },
                      { name: 'Limit ve Türev', pct: adjust(52), state: 'Kritik' },
                      { name: 'Temel Sayı Teorisi', pct: adjust(80), state: 'Güçlü' },
                      { name: 'Sayısal Problemler', pct: adjust(66), state: 'Sınırda' }
                    ];
                  }
                };

                return (
                  <div className="space-y-4 pt-1">
                    <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase leading-none">SEÇİLİ NET ORTALAMASI</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-100">{avgNet}</span>
                          <span className="text-xs text-slate-500 font-extrabold">/ {maxQ} Net</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-1">
                          <ArrowUpRight size={12} /> Okul genel seviyesinin üzerinde
                        </span>
                      </div>
                      
                      <div className="relative flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="5.5" fill="transparent" />
                          <circle cx="32" cy="32" r="26" stroke={selectedSubjectStats === 'turkce' ? '#3b82f6' : selectedSubjectStats === 'matematik' ? '#6366f1' : selectedSubjectStats === 'sosyal' ? '#f59e0b' : '#10b981'} strokeWidth="5.5" fill="transparent" strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - successPct / 100)} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-black text-slate-200">{successPct}%</span>
                      </div>
                    </div>

                    {/* Topic Mastery Heatmap */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Konu Detay Analizi (Kazanım Seviyesi)</span>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {getTopics().map((t, i) => (
                          <div key={i} className="bg-slate-950/20 p-2.5 border border-slate-850/60 rounded-lg space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-300">{t.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                                t.state === 'Güçlü' ? 'bg-emerald-500/10 text-emerald-400' :
                                t.state === 'Ortalama' || t.state === 'Sınırda' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-rose-500/10 text-rose-400'
                              }`}>{t.pct}% • {t.state}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className={`h-1 rounded-full ${
                                t.pct >= 75 ? 'bg-emerald-500' : t.pct >= 55 ? 'bg-blue-500' : 'bg-rose-500'
                              }`} style={{ width: `${t.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Card 2: Öğrenci Gelişim Takip (Student Progress Tracking & Action Drawer) */}
          <div className="xl:col-span-7 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">🎯</span> Öğrenci Gelişim Takip
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Öğrencilerin gelişim grafiklerini çıkarın ve rehberlik müdahaleleri yapın</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1.5 text-slate-500" size={13} />
                    <input
                      type="text"
                      placeholder="Öğrenci ara..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-[10px] font-medium text-slate-300 focus:outline-none focus:border-blue-500 w-36"
                    />
                  </div>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-400 focus:outline-none"
                  >
                    <option value="HEPSİ">Sınıf Seçin</option>
                    {teacherProfile?.siniflar?.map((c: string, idx: number) => (
                      <option key={c || idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid content: Left List, Right Expanded Panel */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Students List Column */}
                <div className="md:col-span-4 space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {students.filter(s => {
                    const matchesSearch = s.ad_soyad.toLowerCase().includes(studentSearch.toLowerCase());
                    const matchesClass = selectedClassFilter === 'HEPSİ' || s.sinif_adi === selectedClassFilter;
                    const isAssigned = !teacherProfile || !teacherProfile.sinif_ids || teacherProfile.sinif_ids.includes(s.sinif_id);
                    return matchesSearch && matchesClass && isAssigned;
                  }).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[10px] italic">Kayıtlı öğrenci bulunamadı.</div>
                  ) : (
                    students.filter(s => {
                      const matchesSearch = s.ad_soyad.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchesClass = selectedClassFilter === 'HEPSİ' || s.sinif_adi === selectedClassFilter;
                      const isAssigned = !teacherProfile || !teacherProfile.sinif_ids || teacherProfile.sinif_ids.includes(s.sinif_id);
                      return matchesSearch && matchesClass && isAssigned;
                    }).map((s) => {
                      const isSelected = selectedStudentDetails?.student?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => fetchStudentDetail(s.id)}
                          className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-indigo-600/10 border-indigo-500 text-slate-200'
                              : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            {s.aktif_seans && s.aktif_seans.calisiyor && (
                              <span className="relative flex h-2 w-2 flex-shrink-0" title="Şu an canlı ders çalışıyor">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold block truncate leading-tight">{s.ad_soyad}</span>
                              <span className="text-[8px] text-slate-500 font-semibold">{s.sinif_adi} • {s.alan}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-[9px] font-black text-slate-300 block">{s.hedef_net || 80} Net</span>
                            <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-black">HEDEF</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selected Student Expanded Analysis & Guidance Panel */}
                <div className="md:col-span-8 bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 min-h-[340px] flex flex-col justify-between">
                  {loadingStudentDetails ? (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-indigo-500"></div>
                      <span className="text-[9px] text-slate-500 font-extrabold mt-2 uppercase tracking-wider">Veriler Derleniyor...</span>
                    </div>
                  ) : selectedStudentDetails ? (
                    <div className="space-y-4">
                      {/* Student ID & Target Header */}
                      <div className="flex justify-between items-start border-b border-slate-850 pb-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-100">{selectedStudentDetails.student.ad_soyad}</h4>
                          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">
                            {selectedStudentDetails.student.sinif_adi} • Danışman: {selectedStudentDetails.student.danisman_adi}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-400 block">
                            {selectedStudentDetails.sonuclar?.length > 0
                              ? `${selectedStudentDetails.sonuclar[selectedStudentDetails.sonuclar.length - 1].toplam_net} Net`
                              : '0 Net'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold block">Son Sınav Neti</span>
                        </div>
                      </div>

                      {/* Tab selector */}
                      <div className="flex border-b border-slate-900/60 pb-1">
                        <button
                          type="button"
                          onClick={() => setActiveDetailsTab('gelisim')}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider text-center border-b-2 transition ${
                            activeDetailsTab === 'gelisim'
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Genel Gelişim & Hedef
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDetailsTab('karne')}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider text-center border-b-2 transition flex items-center justify-center gap-1 ${
                            activeDetailsTab === 'karne'
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span>📊 Konu Analizli Karne</span>
                          <span className="bg-indigo-950 text-indigo-400 text-[6.5px] px-1 py-0.2 rounded font-mono">YENİ</span>
                        </button>
                      </div>

                      {activeDetailsTab === 'gelisim' ? (
                        <>
                          {/* Mini custom SVG sparkline chart representation of Student Performance Trend */}
                          {selectedStudentDetails.sonuclar?.length > 0 ? (
                            <div className="space-y-1 bg-slate-950/60 p-2.5 border border-slate-900 rounded-lg">
                              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">Deneme Sınavları Gelişim Eğrisi</span>
                              <div className="h-20 w-full relative flex items-center justify-center">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                                  {/* Horizontal guidelines */}
                                  {[20, 50, 80].map((yVal, idx) => (
                                    <line key={idx} x1="10" y1={100 - yVal} x2="390" y2={100 - yVal} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" />
                                  ))}
                                  {(() => {
                                    const list = selectedStudentDetails.sonuclar;
                                    const totalPoints = list.length;
                                    const stepX = totalPoints > 1 ? 360 / (totalPoints - 1) : 360;
                                    const pointsArr = list.map((r: any, idx: number) => {
                                      const x = 20 + idx * stepX;
                                      const y = 90 - (r.toplam_net / 120) * 80; // Scale 0-120 net inside 10-90 heights
                                      return `${x},${y}`;
                                    });

                                    return (
                                      <>
                                        <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={pointsArr.join(' ')} className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
                                        {list.map((r: any, idx: number) => {
                                          const x = 20 + idx * stepX;
                                          const y = 90 - (r.toplam_net / 120) * 80;
                                          return (
                                            <g key={idx}>
                                              <circle cx={x} cy={y} r="3.5" fill="#818cf8" stroke="#020617" strokeWidth="1.5" />
                                              <text x={x} y={y - 7} fill="#c7d2fe" className="text-[7px] font-bold font-mono" textAnchor="middle">{r.toplam_net}</text>
                                            </g>
                                          );
                                        })}
                                      </>
                                    );
                                  })()}
                                </svg>
                              </div>
                              <div className="flex justify-between text-[7px] text-slate-500 font-black px-1">
                                <span>İLK SINAV</span>
                                <span>{selectedStudentDetails.sonuclar.length} SINAV BOYUNCA GELİŞİM SEYRİ</span>
                                <span>SON SINAV</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-slate-500 text-[9px] italic bg-slate-950/60 rounded-lg">
                              Öğrenciye ait deneme sınavı verisi bulunmuyor.
                            </div>
                          )}

                          {/* Course by Course Net Comparison & Target Gap */}
                          <div className="grid grid-cols-2 gap-3.5">
                            {/* Target Gap info */}
                            <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-lg space-y-1.5">
                              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Akademik Hedef Sapması</span>
                              {(() => {
                                const lastNet = selectedStudentDetails.sonuclar?.length > 0
                                  ? selectedStudentDetails.sonuclar[selectedStudentDetails.sonuclar.length - 1].toplam_net
                                  : 0;
                                const targetNet = selectedStudentDetails.student.hedef_net || 80;
                                const gap = Number((targetNet - lastNet).toFixed(1));
                                const progress = Math.min(100, Math.round((lastNet / targetNet) * 100));

                                return (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black">
                                      <span className="text-slate-300">Hedef: {targetNet} Net</span>
                                      <span className={gap <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                        {gap <= 0 ? 'Hedef Aşıldı!' : `${gap} Net Kaldı`}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div className={`h-1.5 rounded-full ${gap <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-[7.5px] text-slate-500 font-medium leading-normal pt-1">
                                      {gap <= 0 
                                        ? 'Harika! Öğrencimiz belirlediği sınav hedefine başarıyla ulaşmış ve üzerine çıkmıştır.'
                                        : `Öğrencimiz hedefine %${progress} oranında yakınlaştı. Kalan farkı kapatması için soru takip programı yoğunlaştırilebilir.`}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Subject Analysis (Action recommendations) */}
                            <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-lg space-y-1">
                              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Yapay Zeka Destekli Çalışma Önerisi</span>
                              {(() => {
                                const lastRes = selectedStudentDetails.sonuclar?.length > 0
                                  ? selectedStudentDetails.sonuclar[selectedStudentDetails.sonuclar.length - 1]
                                  : null;
                                if (!lastRes) {
                                  return <p className="text-[8.5px] text-slate-400 leading-normal font-semibold">Öneri üretmek için henüz girilmiş sınav skoru bulunmuyor.</p>;
                                }

                                let lowestSub = 'Matematik';
                                let lowestNetVal = lastRes.matematik_net;

                                if (lastRes.turkce_net < lowestNetVal) { lowestSub = 'Türkçe'; lowestNetVal = lastRes.turkce_net; }
                                if (lastRes.sosyal_net < lowestNetVal) { lowestSub = 'Sosyal'; lowestNetVal = lastRes.sosyal_net; }
                                if (lastRes.fen_net < lowestNetVal) { lowestSub = 'Fen'; lowestNetVal = lastRes.fen_net; }

                                const suggestions: Record<string, string> = {
                                  'Matematik': 'Geometri ve Fonksiyonlar konularında haftalık soru çözüm hedeflerinin %20 artırılması ve 1 ek birebir etüt planlanması önerilir.',
                                  'Türkçe': 'Zaman yönetimi için günlük 25 paragraf sorusu rutini edinmesi ve 30 dakikalık süreli test çözmesi tavsiye edilir.',
                                  'Sosyal': 'Coğrafya harita soruları ve felsefe akımları için ünite kavram özetlerini çıkarıp soru bankalarından pekiştirme yapmalıdır.',
                                  'Fen': 'Fizik kuvvet ve hareket veya kimya elektroliz alanlarında video konu anlatım tekrarları yapması, MEB testlerini bitirmesi gerekir.'
                                };

                                return (
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] text-rose-400 font-extrabold block">Geliştirilmesi Gereken Alan: {lowestSub} ({lowestNetVal} Net)</span>
                                    <p className="text-[7.5px] text-slate-400 leading-normal font-semibold">
                                      {suggestions[lowestSub] || suggestions['Matematik']}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        (() => {
                          const activeExamResult = selectedStudentDetails.sonuclar?.find((r: any) => r.id === selectedKarneExamId) || 
                            (selectedStudentDetails.sonuclar?.length > 0 ? selectedStudentDetails.sonuclar[selectedStudentDetails.sonuclar.length - 1] : null);

                          if (!activeExamResult) {
                            return (
                              <div className="p-4 text-center text-slate-500 text-[9px] italic bg-slate-950/60 rounded-lg">
                                Öğrenciye ait deneme sınavı verisi bulunmuyor.
                              </div>
                            );
                          }

                          const topicAnalysis = getTopicAnalysisForStudent(
                            selectedStudentDetails.student.id,
                            activeExamResult.id,
                            activeExamResult.tur,
                            {
                              turkce: activeExamResult.turkce_net,
                              matematik: activeExamResult.matematik_net,
                              sosyal: activeExamResult.sosyal_net,
                              fen: activeExamResult.fen_net
                            }
                          );

                          // Aggregate failures across ALL exams for warnings
                          const aggregateTopicFailures = () => {
                            if (!selectedStudentDetails.sonuclar || selectedStudentDetails.sonuclar.length === 0) return [];
                            
                            const topicStats: Record<string, { topic: string; subject: string; correct: number; incorrect: number; total: number }> = {};
                            
                            selectedStudentDetails.sonuclar.forEach((r: any) => {
                              const analysis = getTopicAnalysisForStudent(
                                selectedStudentDetails.student.id,
                                r.id,
                                r.tur,
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
                              <div className={`bg-slate-900/20 border ${borderTheme} rounded-lg p-2.5 space-y-1.5`}>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${textTheme}`}>{title}</span>
                                  <span className={`text-[9px] font-black ${textTheme}`}>{net} NET</span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[8px] text-left text-slate-300">
                                    <thead>
                                      <tr className="text-slate-500 font-extrabold border-b border-slate-850/50 text-[7px]">
                                        <th className="py-0.5">Konu Analizi</th>
                                        <th className="py-0.5 text-center w-6">S</th>
                                        <th className="py-0.5 text-center w-6">D</th>
                                        <th className="py-0.5 text-center w-6">Y</th>
                                        <th className="py-0.5 text-center w-6">B</th>
                                        <th className="py-0.5 text-center w-10">B%</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850/20">
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
                                          <tr key={idx} className="hover:bg-slate-900/10 text-slate-300 font-medium">
                                            <td className="py-1 pr-1 truncate max-w-[140px]">{t.ad}</td>
                                            <td className="py-1 text-center font-bold text-slate-400">{t.soru}</td>
                                            <td className="py-1 text-center font-extrabold text-emerald-400/90">{t.d}</td>
                                            <td className="py-1 text-center font-extrabold text-rose-400/90">{t.y}</td>
                                            <td className="py-1 text-center font-bold text-slate-500">{t.b}</td>
                                            <td className="py-1 text-center">
                                              <span className={`inline-block px-1 rounded text-[7px] font-black border ${rateBg} ${rateColor}`}>
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
                            <div className="space-y-3">
                              {/* Dynamic AI Study Recommendations based on aggregations */}
                              {topWeakTopics.length > 0 && (
                                <div className="bg-amber-950/15 border border-amber-900/50 rounded-lg p-2.5 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-[8.5px] text-amber-400 font-black uppercase tracking-widest">
                                    <Sparkles size={11} className="text-amber-400 animate-pulse" />
                                    Yapay Zeka Destekli Akademik Gelişim & Konu Analizi Uyarıları
                                  </div>
                                  <p className="text-[7.5px] text-slate-400 leading-normal">
                                    Öğrencinin geçmiş tüm deneme sınavları analiz edilerek en çok hata yaptığı ve odaklanması gereken kritik konular aşağıda listelenmiştir:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                                    {topWeakTopics.map((item, idx) => (
                                      <div key={idx} className="bg-slate-950/60 border border-slate-900 p-2 rounded-lg space-y-1 flex flex-col justify-between">
                                        <div>
                                          <span className="text-[8px] text-amber-400/90 font-black uppercase tracking-wider block truncate">{item.title}</span>
                                          <span className="text-[6.5px] text-slate-500 font-bold block mt-0.5">{item.stats}</span>
                                          <p className="text-[7.5px] text-slate-300 leading-relaxed font-semibold mt-1">
                                            {item.advice}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Karne Render and Selector */}
                              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-2">
                                  <div>
                                    <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-widest block">ÖĞRENCİ SINAV KARNESİ</span>
                                    <span className="text-[7.5px] text-slate-500 font-semibold block mt-0.5">Konu düzeyinde doğru, yanlış ve başarı oranları analizi</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Sınav:</span>
                                    <select
                                      value={selectedKarneExamId || activeExamResult.id}
                                      onChange={(e) => setSelectedKarneExamId(Number(e.target.value))}
                                      className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[8.5px] font-bold text-indigo-400 focus:outline-none"
                                    >
                                      {selectedStudentDetails.sonuclar.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.sinav_adi} ({r.tur})</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-900 rounded-lg overflow-hidden text-[7.5px] font-bold text-slate-400 border border-slate-900">
                                  <div className="bg-slate-950 p-1.5">
                                    <span className="text-slate-500 block uppercase tracking-wider text-[6.5px] font-black">Adı Soyadı</span>
                                    <span className="text-slate-200 font-black block truncate">{selectedStudentDetails.student.ad_soyad}</span>
                                  </div>
                                  <div className="bg-slate-950 p-1.5">
                                    <span className="text-slate-500 block uppercase tracking-wider text-[6.5px] font-black">Sınıf / Alan</span>
                                    <span className="text-slate-200 font-black block">{selectedStudentDetails.student.sinif_adi} • {selectedStudentDetails.student.alan}</span>
                                  </div>
                                  <div className="bg-slate-950 p-1.5">
                                    <span className="text-slate-500 block uppercase tracking-wider text-[6.5px] font-black">Sınav Adı</span>
                                    <span className="text-slate-200 font-black block truncate">{activeExamResult.sinav_adi}</span>
                                  </div>
                                  <div className="bg-slate-950 p-1.5">
                                    <span className="text-slate-500 block uppercase tracking-wider text-[6.5px] font-black">Sınav Türü</span>
                                    <span className="text-indigo-400 font-black block">{activeExamResult.tur}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                                  <div className="space-y-3">
                                    {renderSubjectPanel("TÜRKÇE", activeExamResult.turkce_net, topicAnalysis.turkce, "border-cyan-900/40 bg-cyan-950/5", "text-cyan-400")}
                                    {renderSubjectPanel("SOSYAL BİLGİLER", activeExamResult.sosyal_net, topicAnalysis.sosyal, "border-amber-900/40 bg-amber-950/5", "text-amber-400")}
                                  </div>
                                  <div className="space-y-3">
                                    {renderSubjectPanel("MATEMATİK", activeExamResult.matematik_net, topicAnalysis.matematik, "border-blue-900/40 bg-blue-950/5", "text-blue-400")}
                                    {renderSubjectPanel("FEN BİLİMLERİ", activeExamResult.fen_net, topicAnalysis.fen, "border-emerald-900/40 bg-emerald-950/5", "text-emerald-400")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Intervention: Guidance Note Input & Quick SMS Message Form Tabs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-850 pt-3">
                        {/* Guidance note */}
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] text-slate-400 font-black uppercase flex items-center gap-1.5">
                            <FileText size={12} className="text-indigo-400" /> REHBERLİK / GELİŞİM NOTU EKLE
                          </span>
                          <textarea
                            rows={2}
                            placeholder="Öğrencinin dosyasına eklenecek gelişim / ödev takibi / birebir notunu buraya giriniz..."
                            value={studentNoteInput}
                            onChange={(e) => setStudentNoteInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[9px] font-medium text-slate-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                          />
                          <div className="flex justify-between items-center gap-2">
                            {noteSuccess ? (
                              <span className="text-[8px] text-emerald-400 font-extrabold flex items-center gap-1">
                                <Check size={10} /> Not Başarıyla Kaydedildi!
                              </span>
                            ) : <span></span>}
                            <button
                              type="button"
                              disabled={!studentNoteInput.trim()}
                              onClick={() => handleAddNote(selectedStudentDetails.student.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                            >
                              Gelişim Notunu Kaydet
                            </button>
                          </div>
                        </div>

                        {/* Fast Parent Message Notification Form */}
                        <div className="space-y-1.5 border-l border-slate-850 pl-3">
                          <span className="text-[8.5px] text-slate-400 font-black uppercase flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-400" /> VELİYE ANLIK SMS/POSTA BİLGİLENDİRME
                          </span>
                          {selectedStudentDetails.student.veli_adi !== 'Veli Atanmamış' ? (
                            <>
                              <textarea
                                rows={2}
                                value={parentMessageText}
                                onChange={(e) => setParentMessageText(e.target.value)}
                                placeholder="Veliye gönderilecek bilgilendirme mesajını girin..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[9px] font-medium text-slate-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                              />
                              <div className="flex justify-between items-center gap-2">
                                {messageSuccess ? (
                                  <span className="text-[8px] text-emerald-400 font-extrabold flex items-center gap-1">
                                    <Check size={10} /> SMS & E-Posta İletildi!
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const lastN = selectedStudentDetails.sonuclar?.length > 0 
                                        ? selectedStudentDetails.sonuclar[selectedStudentDetails.sonuclar.length - 1].toplam_net 
                                        : 0;
                                      setParentMessageText(`Sayın Velimiz ${selectedStudentDetails.student.veli_adi}, öğrencimiz ${selectedStudentDetails.student.ad_soyad}'in son deneme sınavı neti: ${lastN} Net olarak kaydedilmiştir. Başarı durumunu ve konu bazlı grafiklerini sistemden inceleyebilirsiniz.`);
                                    }}
                                    className="text-[7.5px] font-extrabold text-blue-400 hover:underline hover:text-blue-300"
                                  >
                                    Şablon Doldur
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isSendingMessage || !parentMessageText.trim()}
                                  onClick={() => handleSendParentMessage(selectedStudentDetails.student.veli_id, selectedStudentDetails.student.id, selectedStudentDetails.student.ad_soyad)}
                                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                                >
                                  {isSendingMessage ? 'Gönderiliyor...' : 'Veliye İlet'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-amber-500 italic py-4 flex items-center gap-1">
                              <Info size={11} /> Öğrenciye kayıtlı bir veli bulunmadığı için doğrudan mesaj gönderimi yapılamaz.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-[10px] italic py-20 text-center space-y-2">
                      <GraduationCap size={28} className="text-slate-700 animate-pulse" />
                      <span>Analiz detayları, sınav gelişim sparkline grafiği, AI müdahale planı ve veli iletişim portalına erişmek için soldaki listeden bir öğrenci seçin.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class-by-Subject analysis */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-blue-400">📊</span> Sınıf Bazlı Ders/Konu Ortalamaları
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Sınıfların ders gruplarına göre ortalama net başarı analizi</p>
              </div>
              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded font-black uppercase">Konu Dağılımı</span>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {stats.classAnalysis && stats.classAnalysis.length > 0 ? (
                stats.classAnalysis.map((c, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-200">{c.sinif_adi}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Genel Ort: {((c.turkce + c.matematik + c.sosyal + c.fen) / 4).toFixed(1)} Net
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                      {/* Türkçe */}
                      <div className="space-y-1 bg-slate-900/30 p-2 rounded border border-slate-900">
                        <div className="flex justify-between">
                          <span>Türkçe</span>
                          <span className="text-blue-400 font-bold">{c.turkce} Net</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(c.turkce / 40) * 100}%` }}></div>
                        </div>
                      </div>
                      {/* Matematik */}
                      <div className="space-y-1 bg-slate-900/30 p-2 rounded border border-slate-900">
                        <div className="flex justify-between">
                          <span>Matematik</span>
                          <span className="text-indigo-400 font-bold">{c.matematik} Net</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(c.matematik / 40) * 100}%` }}></div>
                        </div>
                      </div>
                      {/* Sosyal Bilimler */}
                      <div className="space-y-1 bg-slate-900/30 p-2 rounded border border-slate-900">
                        <div className="flex justify-between">
                          <span>Sosyal</span>
                          <span className="text-amber-400 font-bold">{c.sosyal} Net</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(c.sosyal / 20) * 100}%` }}></div>
                        </div>
                      </div>
                      {/* Fen Bilimleri */}
                      <div className="space-y-1 bg-slate-900/30 p-2 rounded border border-slate-900">
                        <div className="flex justify-between">
                          <span>Fen Bilimleri</span>
                          <span className="text-emerald-400 font-bold">{c.fen} Net</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(c.fen / 20) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">Sınıf bazlı veri bulunmuyor.</div>
              )}
            </div>
          </div>

          {/* Teacher Efficiency / Tutoring statistics */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-emerald-400">🎓</span> Öğretmen Başarı ve Etüt Verimliliği
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Öğretmenlerin birebir dersleri ve başarı endeks analizi</p>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded font-black uppercase">Verimlilik</span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {stats.teacherAnalysis && stats.teacherAnalysis.length > 0 ? (
                stats.teacherAnalysis.map((t, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl space-y-2 hover:border-slate-800 transition">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{t.ogretmen}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400">{t.basari_orani}% Başarı</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${t.basari_orani}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                        <span>Aktif Öğrenci: {t.ogrenci_sayisi}</span>
                        <span>Haftalık Birebir: {t.etut_sayisi} Saat</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">Öğretmen verisi bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk List / Exam lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Students List */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} /> Akademik Risk Altındaki Öğrenciler
            </h3>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Kritik</span>
          </div>
          {stats.riskStudents.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Harika! Şu anda kurumunuzda tanımlı risk limitlerinin altında kalan öğrenci bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {stats.riskStudents.map((s, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{s.ad_soyad}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{s.sinif_adi} • {s.alan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-400 block">{s.son_net} Net</span>
                    <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{s.durum}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applied exams recap list */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200">Son Yapılan Sınavlar</h3>
            <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">Aktif Liste</span>
          </div>
          {stats.recentExams.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">Sistemde henüz kayıtlı sınav bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
              {stats.recentExams.map((e, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{e.ad}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{e.tur} • {new Date(e.tarih).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400 block">Ort. {e.ortalama_net || 0} Net</span>
                    <span className="text-[10px] text-slate-500">{e.katilimci_sayisi || 0} Katılımcı</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
