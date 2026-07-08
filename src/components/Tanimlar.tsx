import React, { useState, useEffect } from 'react';
import { User, Sinif, User as Staff, SinavTanim } from '../types';
import { Plus, Trash2, Award, Briefcase, Key, Shield, Layers, HelpCircle, AlertCircle, CheckCircle2, Calendar, Clock, BookOpen } from 'lucide-react';

interface TanimlarProps {
  user: User;
  token: string;
  activeTab?: 'sinif' | 'ogretmen' | 'rehber' | 'veli' | 'sinav' | 'ders_programi';
  setActiveTab?: (tab: 'sinif' | 'ogretmen' | 'rehber' | 'veli' | 'sinav' | 'ders_programi') => void;
}

export default function Tanimlar({ user, token, activeTab: propActiveTab, setActiveTab: propSetActiveTab }: TanimlarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'sinif' | 'ogretmen' | 'rehber' | 'veli' | 'sinav' | 'ders_programi'>('sinif');

  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = propSetActiveTab || setInternalActiveTab;

  // Lists state
  const [classes, setClasses] = useState<Sinif[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<Staff[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [exams, setExams] = useState<SinavTanim[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'sinif' | 'sinav' | 'ders_programi' | 'ogretmen' | 'rehber' | 'veli'; id: number } | null>(null);

  // Form states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Class Form fields
  const [classAd, setClassAd] = useState('');
  const [classSeviye, setClassSeviye] = useState('12');

  // Staff Form fields (shared)
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  const [students, setStudents] = useState<any[]>([]);

  // Manual Exam Form fields
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Ders Programi Form fields
  const [schedStudentId, setSchedStudentId] = useState<string | number>('');
  const [schedGun, setSchedGun] = useState('Pazartesi');
  const [schedSaat, setSchedSaat] = useState('09:00 - 10:30');
  const [schedDersAdi, setSchedDersAdi] = useState('');
  const [schedOgretmenAdi, setSchedOgretmenAdi] = useState('');
  const [selectedStudentIdForView, setSelectedStudentIdForView] = useState<string | number>('');

  const loadTabData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'sinif') {
        const res = await fetch(`/api/sinif?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } });
        if (res.ok) setClasses(await res.json());
      } else if (activeTab === 'ogretmen') {
        const [resT, resC] = await Promise.all([
          fetch(`/api/ogretmen?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } }),
          fetch(`/api/sinif?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } })
        ]);
        if (resT.ok && resC.ok) {
          setTeachers(await resT.json());
          setClasses(await resC.json());
        }
      } else if (activeTab === 'rehber') {
        const res = await fetch(`/api/rehber?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } });
        if (res.ok) setCounselors(await res.json());
      } else if (activeTab === 'veli') {
        const res = await fetch(`/api/veli?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } });
        if (res.ok) setParents(await res.json());
      } else if (activeTab === 'sinav') {
        const res = await fetch(`/api/sinav?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } });
        if (res.ok) setExams(await res.json());
      } else if (activeTab === 'ders_programi') {
        const [resO, resS] = await Promise.all([
          fetch(`/api/ogrenci?aktif=true`, { headers: { 'Authorization': token } }),
          fetch(`/api/ders-programi`, { headers: { 'Authorization': token } })
        ]);
        if (resO.ok && resS.ok) {
          const stdList = await resO.json();
          const schedList = await resS.json();
          setStudents(stdList);
          setSchedules(schedList);
          if (stdList.length > 0) {
            if (!schedStudentId) setSchedStudentId(stdList[0].id);
            if (!selectedStudentIdForView) setSelectedStudentIdForView(stdList[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Tab data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  // Handle Class Creation
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classAd) return;
    try {
      const res = await fetch('/api/sinif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ ad: classAd, seviye: classSeviye, kurum_id: user.kurum_id })
      });
      if (res.ok) {
        setSuccess("Sınıf başarıyla tanımlandı.");
        setClassAd('');
        loadTabData();
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    }
  };

  // Handle Class Deletion
  const handleDeleteClass = async (classId: number) => {
    try {
      const res = await fetch(`/api/sinif/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setSuccess("Sınıf başarıyla silindi.");
        loadTabData();
      } else {
        const data = await res.json();
        setError(data.error || "Sınıf silinemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    }
  };

  // Handle Teacher/Counselor/Parent Creation
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!staffName || !staffEmail || !staffPassword || !staffPhone) {
      setError("Lütfen zorunlu alanları eksiksiz doldurun.");
      return;
    }

    const payload = {
      ad_soyad: staffName,
      email: staffEmail,
      sifre: staffPassword,
      telefon: staffPhone,
      kurum_id: user.kurum_id,
      sinif_ids: activeTab === 'ogretmen' ? selectedClassIds : []
    };

    try {
      const endpoint = activeTab === 'ogretmen' ? '/api/ogretmen' : activeTab === 'rehber' ? '/api/rehber' : '/api/veli';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess("Kullanıcı kaydı başarıyla oluşturuldu.");
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffPhone('');
        setSelectedClassIds([]);
        loadTabData();
      } else {
        const data = await res.json();
        setError(data.error || "Kayıt eklenemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    }
  };

  // Handle Manual Exam Definition Creation
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName) return;

    try {
      const res = await fetch('/api/sinav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ ad: examName, tur: examType, tarih: examDate, kurum_id: user.kurum_id })
      });
      if (res.ok) {
        setSuccess("Sınav tanımı manuel olarak eklendi.");
        setExamName('');
        loadTabData();
      }
    } catch (err) {
      setError("Hata oluştu.");
    }
  };

  // Handle Exam Deletion (Sınav Silme)
  const handleDeleteExam = async (examId: number) => {
    try {
      const res = await fetch(`/api/sinav/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setSuccess("Sınav ve tüm sınav sonuçları başarıyla silindi.");
        loadTabData();
      } else {
        const data = await res.json();
        setError(data.error || "Sınav silinemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
      console.error("Error deleting exam:", err);
    }
  };

  // Handle Ders Programı Ekleme
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!schedStudentId || !schedGun || !schedSaat || !schedDersAdi || !schedOgretmenAdi) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      const res = await fetch('/api/ders-programi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({
          ogrenci_id: Number(schedStudentId),
          gun: schedGun,
          saat: schedSaat,
          ders_adi: schedDersAdi,
          ogretmen_adi: schedOgretmenAdi
        })
      });
      if (res.ok) {
        setSuccess("Öğrenci birebir ders programı kaydı başarıyla eklendi.");
        setSchedDersAdi('');
        setSchedOgretmenAdi('');
        loadTabData();
      } else {
        const data = await res.json();
        setError(data.error || "Program kaydı eklenemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    }
  };

  // Handle Ders Programı Silme
  const handleDeleteSchedule = async (id: number) => {
    try {
      const res = await fetch(`/api/ders-programi/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setSuccess("Program kaydı başarıyla silindi.");
        loadTabData();
      } else {
        const data = await res.json();
        setError(data.error || "Silme işlemi başarısız.");
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  const handleClassCheckbox = (classId: number) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter(id => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      {/* Grid container: Left is Form, Right is List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register Form */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow h-fit space-y-4">
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
            {activeTab === 'sinif' && "Yeni Sınıf Tanımla"}
            {activeTab === 'ogretmen' && "Öğretmen Kaydet"}
            {activeTab === 'rehber' && "Rehber Öğretmen Kaydet"}
            {activeTab === 'veli' && "Yeni Veli Kaydet"}
            {activeTab === 'sinav' && "Manuel Sınav Tanımla"}
            {activeTab === 'ders_programi' && "Ders Programı Girişi"}
          </h3>

          {/* Form: Sınıf */}
          {activeTab === 'sinif' && (
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınıf / Şube Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 12-C SAY"
                  value={classAd}
                  onChange={e => setClassAd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Öğretim Seviyesi *</label>
                <select
                  value={classSeviye}
                  onChange={e => setClassSeviye(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="5">5. Sınıf</option>
                  <option value="6">6. Sınıf</option>
                  <option value="7">7. Sınıf</option>
                  <option value="8">8. Sınıf (LGS)</option>
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf / Mezun</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition">Sınıfı Tanımla</button>
            </form>
          )}

          {/* Form: Staff (Teacher, Counselor, Parent) */}
          {(activeTab === 'ogretmen' || activeTab === 'rehber' || activeTab === 'veli') && (
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Kullanıcı Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Burak Kaya"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">İletişim Telefon No *</label>
                <input
                  type="tel"
                  required
                  placeholder="Örn: 0555..."
                  value={staffPhone}
                  onChange={e => setStaffPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">E-posta (Giriş) *</label>
                  <input
                    type="email"
                    required
                    placeholder="burak@kas.com"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Şifre *</label>
                  <input
                    type="password"
                    required
                    placeholder="Şifre"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {activeTab === 'ogretmen' && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Sorumlu Olduğu Sınıf Atamaları</label>
                  <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg max-h-36 overflow-y-auto space-y-1.5">
                    {classes.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cls-${c.id}`}
                          checked={selectedClassIds.includes(c.id)}
                          onChange={() => handleClassCheckbox(c.id)}
                          className="rounded text-blue-600 bg-slate-950 border-slate-800"
                        />
                        <label htmlFor={`cls-${c.id}`} className="text-xs text-slate-300 font-medium">{c.ad}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition">
                {activeTab === 'ogretmen' ? 'Öğretmen Hesabını Aç' : activeTab === 'rehber' ? 'Rehber Hesabını Aç' : 'Veli Hesabını Aç'}
              </button>
            </form>
          )}

          {/* Form: Sınav Tanımı */}
          {activeTab === 'sinav' && (
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınav / Deneme Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Limit Türkiye Geneli AYT-1"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınav Türü *</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS (Ortaokul)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Tarih *</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition">Sınavı Tanımla</button>
            </form>
          )}

          {/* Form: Ders Programı */}
          {activeTab === 'ders_programi' && (
            <form onSubmit={handleCreateSchedule} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Hedef Öğrenci (Birebir Ders) *</label>
                {students.length === 0 ? (
                  <p className="text-[11px] text-amber-500 font-medium">Öncelikle sistemde en az bir aktif öğrenci bulunmalıdır.</p>
                ) : (
                  <select
                    value={schedStudentId}
                    onChange={e => setSchedStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.ad_soyad} ({s.sinif_adi || 'Sınıf Yok'})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Gün *</label>
                <select
                  value={schedGun}
                  onChange={e => setSchedGun(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Saat Aralığı (Örn: 09:00 - 10:30) *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 09:00 - 10:30"
                  value={schedSaat}
                  onChange={e => setSchedSaat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Ders Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Birebir Matematik veya Fizik"
                  value={schedDersAdi}
                  onChange={e => setSchedDersAdi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Öğretmen Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={schedOgretmenAdi}
                  onChange={e => setSchedOgretmenAdi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={students.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Programa Ders Ekle
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Listing Table */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow overflow-hidden">
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">
            Kayıtlı {activeTab === 'sinif' ? 'Sınıflar' : activeTab === 'ogretmen' ? 'Öğretmenler' : activeTab === 'rehber' ? 'Rehberlik Ekibi' : activeTab === 'veli' ? 'Veliler' : activeTab === 'sinav' ? 'Sınav Tanımları' : 'Haftalık Ders Programları'}
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'ders_programi' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={13} className="text-blue-500" /> Görüntülenecek Öğrenci:
                </label>
                <select
                  value={selectedStudentIdForView}
                  onChange={e => setSelectedStudentIdForView(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.ad_soyad} ({s.sinif_adi || 'Sınıf Yok'})</option>
                  ))}
                </select>
              </div>

              {/* Weekly Calendar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"].map(day => {
                  const daySchedules = schedules
                    .filter(s => s.ogrenci_id === Number(selectedStudentIdForView) && s.gun === day)
                    .sort((a, b) => a.saat.localeCompare(b.saat));

                  return (
                    <div key={day} className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 space-y-2.5 flex flex-col">
                      <div className="text-center font-bold text-xs pb-1.5 border-b border-slate-800 text-slate-300 uppercase tracking-wide">
                        {day}
                      </div>
                      <div className="space-y-2 flex-1 max-h-[22rem] overflow-y-auto pr-0.5">
                        {daySchedules.length === 0 ? (
                          <div className="text-center text-[10px] text-slate-600 py-6 italic">Ders Yok</div>
                        ) : (
                          daySchedules.map(item => (
                            <div key={item.id} className="relative group bg-slate-900 border border-slate-800/80 rounded p-2 space-y-1 hover:border-slate-700 hover:bg-slate-900/80 transition">
                              {deleteConfirm?.type === 'ders_programi' && deleteConfirm.id === item.id ? (
                                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-1 rounded z-10 p-1 text-center">
                                  <span className="text-[8px] text-red-400 font-bold leading-none">Ders Silinsin mi?</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        handleDeleteSchedule(item.id);
                                        setDeleteConfirm(null);
                                      }}
                                      className="px-1 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[8px] font-black rounded cursor-pointer leading-none"
                                    >
                                      Evet
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-black rounded cursor-pointer leading-none"
                                    >
                                      Hayır
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'ders_programi', id: item.id })}
                                  className="absolute top-1 right-1 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5 bg-slate-950/80 rounded cursor-pointer"
                                  title="Dersi Sil"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                              <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 font-mono">
                                <Clock size={8} /> {item.saat}
                              </div>
                              <div className="text-xs font-bold text-slate-100 truncate">{item.ders_adi}</div>
                              <div className="text-[10px] text-slate-400 truncate">{item.ogretmen_adi}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] uppercase font-bold text-slate-500">
                    {activeTab === 'sinif' && (
                      <>
                        <th className="pb-2">Sınıf Adı</th>
                        <th className="pb-2">Öğretim Seviyesi</th>
                        <th className="pb-2">Durum</th>
                        <th className="pb-2 text-right">Sil</th>
                      </>
                    )}
                    {activeTab === 'ogretmen' && (
                      <>
                        <th className="pb-2">Öğretmen</th>
                        <th className="pb-2">İrtibat / E-Posta</th>
                        <th className="pb-2">Atanmış Sınıflar</th>
                      </>
                    )}
                    {(activeTab === 'rehber' || activeTab === 'veli') && (
                      <>
                        <th className="pb-2">Adı Soyadı</th>
                        <th className="pb-2">E-Posta Adresi</th>
                        <th className="pb-2">Telefon Numarası</th>
                      </>
                    )}
                    {activeTab === 'sinav' && (
                      <>
                        <th className="pb-2">Sınav Adı</th>
                        <th className="pb-2">Türü / Tarihi</th>
                        <th className="pb-2 text-center">Katılımcı Sayısı</th>
                        <th className="pb-2 text-center">Ort. Net</th>
                        <th className="pb-2 text-right">Sil</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-medium">
                  {activeTab === 'sinif' && classes.map(c => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-bold text-slate-200">{c.ad}</td>
                      <td className="py-2.5 text-slate-400">{c.seviye}. Sınıf</td>
                      <td className="py-2.5 text-emerald-400">Aktif</td>
                      <td className="py-2.5 text-right">
                        {deleteConfirm?.type === 'sinif' && deleteConfirm.id === c.id ? (
                          <div className="flex justify-end gap-1 items-center">
                            <span className="text-[10px] text-red-400 font-bold">Silinsin mi?</span>
                            <button
                              onClick={() => {
                                handleDeleteClass(c.id);
                                setDeleteConfirm(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-extrabold rounded cursor-pointer"
                            >
                              Evet
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-700 text-slate-300 text-[9px] font-extrabold rounded cursor-pointer"
                            >
                              Hayır
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm({ type: 'sinif', id: c.id })}
                            className="p-1 bg-slate-950 hover:bg-slate-800 text-red-500 rounded transition cursor-pointer"
                            title="Sınıfı Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'ogretmen' && teachers.map(t => (
                    <tr key={t.id}>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-200 block">{t.ad_soyad}</span>
                        <span className="text-[10px] text-slate-500">{t.telefon}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{t.email}</td>
                      <td className="py-2.5">
                        {t.siniflar && t.siniflar.length > 0 ? (
                          <span className="text-xs text-blue-400">{t.siniflar.join(', ')}</span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Sınıf Atanmamış</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'rehber' && counselors.map(c => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-bold text-slate-200">{c.ad_soyad}</td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{c.email}</td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{c.telefon}</td>
                    </tr>
                  ))}

                  {activeTab === 'veli' && parents.map(p => (
                    <tr key={p.id}>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-200 block">{p.ad_soyad}</span>
                        {p.cocuklar && p.cocuklar.length > 0 && (
                          <span className="text-[10px] text-indigo-400 block font-semibold">
                            Öğrencisi: {p.cocuklar.map((ch: any) => ch.ad_soyad).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{p.email}</td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{p.telefon}</td>
                    </tr>
                  ))}

                  {activeTab === 'sinav' && exams.map(e => (
                    <tr key={e.id}>
                      <td className="py-2.5 font-bold text-slate-200">{e.ad}</td>
                      <td className="py-2.5">
                        <span className="bg-slate-900 text-slate-400 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">{e.tur}</span>
                        <span className="text-[11px] text-slate-500 ml-2">{e.tarih}</span>
                      </td>
                      <td className="py-2.5 text-center text-slate-300 font-mono">{e.katilimci_sayisi || 0}</td>
                      <td className="py-2.5 text-center text-blue-400 font-bold font-mono">{e.ortalama_net || 0}</td>
                      <td className="py-2.5 text-right">
                        {deleteConfirm?.type === 'sinav' && deleteConfirm.id === e.id ? (
                          <div className="flex justify-end gap-1 items-center">
                            <span className="text-[10px] text-red-400 font-bold">Silinsin mi?</span>
                            <button
                              onClick={() => {
                                handleDeleteExam(e.id);
                                setDeleteConfirm(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-extrabold rounded cursor-pointer"
                            >
                              Evet
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-700 text-slate-300 text-[9px] font-extrabold rounded cursor-pointer"
                            >
                              Hayır
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm({ type: 'sinav', id: e.id })}
                            className="p-1 bg-slate-950 hover:bg-slate-800 text-red-500 rounded transition cursor-pointer"
                            title="Sınavı Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
