import React, { useState, useEffect } from 'react';
import { User, SinavTanim } from '../types';
import { Clock, Calendar, AlertTriangle, TrendingUp, Users, BookOpen, Layers } from 'lucide-react';

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

export default function Dashboard({ user, token }: DashboardProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalClasses: 0,
    totalExams: 0,
    riskCount: 0,
    riskStudents: [] as RiskStudent[],
    trends: [] as TrendData[],
    recentExams: [] as any[],
    thresholds: { TYT: 60, AYT: 45, LGS: 55 } as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/stats?kurum_id=${user.kurum_id}`, {
          headers: { 'Authorization': token }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Stats fetching error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.kurum_id, token]);

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const weekDays = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

    const blankDays = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);
    const dayCells = Array.from({ length: totalDays }, (_, i) => i + 1);
    const allCells = [...blankDays, ...dayCells];

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
          <span className="font-bold text-blue-400 text-sm flex items-center gap-2">
            <Calendar size={15} /> {monthNames[month]} {year}
          </span>
          <span className="text-xs text-slate-400">Mini Takvim</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 mb-1">
          {weekDays.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {allCells.map((d, index) => {
            const isToday = d === today.getDate();
            return (
              <div
                key={index}
                className={`py-1 rounded font-medium ${
                  d === null
                    ? ""
                    : isToday
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {d || ""}
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <div className="my-auto text-center z-10">
            <div className="text-3xl font-black text-slate-100 tracking-wider">
              {currentTime.toLocaleTimeString('tr-TR')}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-medium">
              {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-bold uppercase">Aktif Öğrenciler</span>
            <Users className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats.activeStudents} <span className="text-xs text-slate-500">/ {stats.totalStudents}</span></p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-bold uppercase">Sınıflar</span>
            <Layers className="text-indigo-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats.totalClasses}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-bold uppercase">Uygulanan Sınavlar</span>
            <BookOpen className="text-cyan-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats.totalExams}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Risk Grubu Limitleri</span>
            <AlertTriangle className="text-amber-500" size={18} />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2.5 pt-0.5 border-t border-slate-800/50">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 font-bold block">TYT</span>
              <span className="text-xs font-black text-amber-500">{stats.thresholds?.TYT ?? 60} Net</span>
            </div>
            <div className="text-center border-x border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-bold block">AYT</span>
              <span className="text-xs font-black text-amber-500">{stats.thresholds?.AYT ?? 45} Net</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-500 font-bold block">LGS</span>
              <span className="text-xs font-black text-amber-500">{stats.thresholds?.LGS ?? 55} Net</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-xs text-red-400 font-bold uppercase">Riskli Öğrenciler</span>
            <AlertTriangle className="text-red-500 animate-bounce" size={18} />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{stats.riskCount}</p>
        </div>
      </div>

      {/* Analytics, Calendar & Risk Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Exam trend chart */}
        <div className="xl:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={18} />
                Genel Sınav Net Gelişim Trendi
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Uygulanan son deneme sınavlarının ortalama net grafiği</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Kurum Ortalaması</span>
          </div>

          {stats.trends.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
              Trend çizelgesi için sisteme henüz sınav sonucu girilmemiştir.
            </div>
          ) : (
            <div className="w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                {/* Horizontal guide lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                  const val = Math.round(p * maxNetValue);
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
                  const count = stats.trends.length;
                  const stepX = (chartWidth - 50) / (count > 1 ? count - 1 : 1);

                  stats.trends.forEach((t, index) => {
                    const x = 40 + index * stepX;
                    const yAvg = chartHeight - (t.ortalama_net / maxNetValue) * (chartHeight - 20) - 10;
                    const yMax = chartHeight - (t.en_yuksek_net / maxNetValue) * (chartHeight - 20) - 10;
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
                      {stats.trends.map((t, index) => {
                        const x = 40 + index * stepX;
                        const yAvg = chartHeight - (t.ortalama_net / maxNetValue) * (chartHeight - 20) - 10;
                        const yMax = chartHeight - (t.en_yuksek_net / maxNetValue) * (chartHeight - 20) - 10;

                        return (
                          <g key={index}>
                            <circle cx={x} cy={yAvg} r="4" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
                            <circle cx={x} cy={yMax} r="3" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                            {/* Value label */}
                            <text x={x} y={yAvg - 8} fill="#94a3b8" className="text-[9px] font-bold" textAnchor="middle">{t.ortalama_net}</text>
                            {/* Name label on axis */}
                            <text x={x} y={chartHeight + 12} fill="#64748b" className="text-[8px] font-bold" textAnchor="middle" transform={`rotate(-15, ${x}, ${chartHeight + 12})`}>
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
              </div>
            </div>
          )}
        </div>

        {/* Calendar and Sidebar elements */}
        <div className="xl:col-span-4 space-y-4">
          {renderCalendar()}
        </div>
      </div>

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
