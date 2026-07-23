import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Search, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, BookOpen, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface RaporlarProps {
  user: User;
  token: string;
}

const Raporlar: React.FC<RaporlarProps> = ({ user, token }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/ogrenci', {
          headers: { 'Authorization': token }
        });
        if (response.ok) {
          const data = await response.json();
          const studentsList = Array.isArray(data) ? data : (data.ogrenciler || []);
          const augmentedData = studentsList.map((s: any) => {
            const history = s.examHistory || [];
            let tytNet = s.son_net && s.son_net !== '-' ? Number(s.son_net) : 0;
            let riskStatus = 'medium';
            let trend = 'up';
            
            if (history.length >= 2) {
              const last = history[history.length - 1].toplam_net;
              const prev = history[history.length - 2].toplam_net;
              trend = last >= prev ? 'up' : 'down';
            } else {
              trend = tytNet > 40 ? 'up' : 'down';
            }

            if (tytNet > 60) riskStatus = 'low';
            else if (tytNet < 30) riskStatus = 'high';

            return {
              ...s,
              tytNet,
              aytNet: Math.floor(tytNet * 0.7),
              trend,
              riskStatus,
              historyData: history.map((h: any) => ({
                name: h.ad,
                net: h.toplam_net,
                tarih: new Date(h.tarih).toLocaleDateString('tr-TR')
              }))
            };
          });
          setStudents(augmentedData);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [token]);

  const filteredStudents = students.filter(s => 
    s.ad_soyad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sinif_adi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="text-[#4F7DFF]" size={28} />
            Öğrenci Analiz Raporları
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Öğrencilerin sınav performansları, gelişim trendleri ve risk durumları.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Öğrenci veya sınıf ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full py-2.5 pl-10 pr-4 text-sm font-medium"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>
      </div>

      <div className="glass-card border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="p-4">Öğrenci</th>
                <th className="p-4">Sınıf</th>
                <th className="p-4 text-center">TYT Ortalama</th>
                <th className="p-4 text-center">AYT Ortalama</th>
                <th className="p-4 text-center">Gelişim Trendi</th>
                <th className="p-4 text-center">Risk Durumu</th>
                <th className="p-4 text-right">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Yükleniyor...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Sonuç bulunamadı.</td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <React.Fragment key={student.id || idx}>
                    <tr 
                      className={`hover:bg-white/5 transition-colors group cursor-pointer ${expandedStudentId === student.id ? 'bg-white/5' : ''}`}
                      onClick={() => toggleExpand(student.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#4F7DFF]/20 text-[#4F7DFF] flex items-center justify-center font-bold text-xs border border-[#4F7DFF]/30">
                            {student.ad_soyad?.charAt(0) || 'Ö'}
                          </div>
                          <span className="font-bold text-white text-sm">{student.ad_soyad || 'İsimsiz Öğrenci'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">
                          {student.sinif_adi || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-white">{student.tytNet}</span>
                        <span className="text-[10px] text-slate-500 ml-1">Net</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-white">{student.aytNet}</span>
                        <span className="text-[10px] text-slate-500 ml-1">Net</span>
                      </td>
                      <td className="p-4 text-center">
                        {student.trend === 'up' ? (
                          <div className="inline-flex items-center gap-1.5 text-[#30D158] bg-[#30D158]/10 px-2.5 py-1 rounded-full border border-[#30D158]/20 text-xs font-bold">
                            <TrendingUp size={14} /> Yükselişte
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[#FF5F57] bg-[#FF5F57]/10 px-2.5 py-1 rounded-full border border-[#FF5F57]/20 text-xs font-bold">
                            <TrendingUp size={14} className="rotate-180" /> Düşüşte
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {student.riskStatus === 'high' && (
                          <span className="inline-flex items-center gap-1.5 text-[#FF5F57] bg-[#FF5F57]/10 px-2.5 py-1 rounded-full border border-[#FF5F57]/30 text-xs font-bold animate-pulse">
                            <AlertTriangle size={14} /> Yüksek Risk
                          </span>
                        )}
                        {student.riskStatus === 'medium' && (
                          <span className="inline-flex items-center gap-1.5 text-[#FFB020] bg-[#FFB020]/10 px-2.5 py-1 rounded-full border border-[#FFB020]/30 text-xs font-bold">
                            Orta Risk
                          </span>
                        )}
                        {student.riskStatus === 'low' && (
                          <span className="inline-flex items-center gap-1.5 text-[#30D158] bg-[#30D158]/10 px-2.5 py-1 rounded-full border border-[#30D158]/30 text-xs font-bold">
                            Güvenli
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/5">
                          {expandedStudentId === student.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedStudentId === student.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-black/20 border-b border-white/5"
                        >
                          <td colSpan={7} className="p-0">
                            <div className="p-6 md:p-8">
                              <div className="flex items-center gap-2 mb-6">
                                <Activity className="text-[#4F7DFF]" size={20} />
                                <h4 className="text-white font-bold text-sm">Gelişim Grafiği (Son Sınavlar)</h4>
                              </div>
                              
                              {student.historyData && student.historyData.length > 0 ? (
                                <div className="h-64 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={student.historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id={`colorNet-${student.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={student.trend === 'up' ? "#30D158" : "#FF5F57"} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={student.trend === 'up' ? "#30D158" : "#FF5F57"} stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                      <XAxis 
                                        dataKey="name" 
                                        stroke="rgba(255,255,255,0.4)" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                      />
                                      <YAxis 
                                        stroke="rgba(255,255,255,0.4)" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                        domain={['dataMin - 10', 'dataMax + 10']}
                                      />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="net" 
                                        stroke={student.trend === 'up' ? "#30D158" : "#FF5F57"} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill={`url(#colorNet-${student.id})`} 
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                  Yeterli sınav verisi bulunmuyor.
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Raporlar;
