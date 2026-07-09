import React, { useState, useEffect } from 'react';
import { User, Ogrenci, Sinif, SinavSonuc, RehberlikNotu } from '../types';
import { Search, Plus, Edit, Trash2, FileText, Download, ToggleLeft, ToggleRight, ArrowLeft, Send, AlertCircle, Sparkles, Calendar, Clock } from 'lucide-react';

// Helper function to calculate expected net projection for the next practice exam
const getProjectedNet = (sonuclar: any[]): number => {
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

interface OgrenciPaneliProps {
  user: User;
  token: string;
}

export default function OgrenciPaneli({ user, token }: OgrenciPaneliProps) {
  // Navigation & View State
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'detail'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Lists
  const [students, setStudents] = useState<Ogrenci[]>([]);
  const [classes, setClasses] = useState<Sinif[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmStudentId, setDeleteConfirmStudentId] = useState<number | null>(null);
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAlan, setSelectedAlan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('true'); // 'all', 'true', 'false'

  // Student details details
  const [detailData, setDetailData] = useState<{
    student: Ogrenci;
    sonuclar: SinavSonuc[];
    notlar: RehberlikNotu[];
    ders_programi?: any[];
  } | null>(null);

  // Note text input
  const [newNote, setNewNote] = useState('');

  // Form states for Add/Edit student
  const [formData, setFormData] = useState({
    id: 0,
    ad_soyad: '',
    tc_no: '',
    sinif_id: '',
    veli_id: '',
    alan: 'Sayısal' as any,
    aktif: true
  });

  const [formError, setFormError] = useState('');

  // Fetch student records & lookup tables
  const loadData = async () => {
    setLoading(true);
    try {
      // Build API query string
      let query = `/api/ogrenci?kurum_id=${user.kurum_id}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedClass) query += `&sinif_id=${selectedClass}`;
      if (selectedAlan) query += `&alan=${encodeURIComponent(selectedAlan)}`;
      if (selectedStatus !== 'all') query += `&aktif=${selectedStatus}`;

      const [resStudents, resClasses, resParents] = await Promise.all([
        fetch(query, { headers: { 'Authorization': token } }),
        fetch(`/api/sinif?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } }),
        fetch(`/api/veli?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } })
      ]);

      if (resStudents.ok && resClasses.ok && resParents.ok) {
        setStudents(await resStudents.json());
        setClasses(await resClasses.json());
        setParents(await resParents.json());
      }
    } catch (err) {
      console.error("Error loading students data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      loadData();
    }
  }, [view, search, selectedClass, selectedAlan, selectedStatus]);

  // Load particular student detail
  const loadStudentDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ogrenci/${id}`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
        setSelectedStudentId(id);
        setView('detail');
      }
    } catch (err) {
      console.error("Error loading student detail:", err);
    } finally {
      setLoading(false);
    }
  };

  // Export visible list to Excel compatible CSV
  const exportToCSV = () => {
    if (students.length === 0) return;
    
    // Header line
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for excel turkish support
    csvContent += "ID;Ad Soyad;T.C. No;Sınıf;Alan;Veli Adı;Veli Telefon;Durum;Son Sınav Toplam Net;Son Sınav Puan\n";

    students.forEach(o => {
      const row = [
        o.id,
        o.ad_soyad,
        o.tc_no,
        o.sinif_adi || '-',
        o.alan,
        o.veli_adi || '-',
        o.veli_telefon || '-',
        o.aktif ? 'Aktif' : 'Pasif',
        o.son_net || '-',
        o.son_puan || '-'
      ].join(';');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KAS_Ogrenci_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit add/edit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.ad_soyad || !formData.tc_no || !formData.sinif_id || !formData.alan) {
      setFormError('Lütfen tüm zorunlu alanları (*) doldurun.');
      return;
    }

    const payload = {
      ad_soyad: formData.ad_soyad,
      tc_no: formData.tc_no,
      sinif_id: parseInt(formData.sinif_id),
      veli_id: formData.veli_id ? parseInt(formData.veli_id) : null,
      alan: formData.alan,
      aktif: formData.aktif
    };

    try {
      const url = view === 'add' ? '/api/ogrenci' : `/api/ogrenci/${formData.id}`;
      const method = view === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setView('list');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'İşlem tamamlanamadı.');
      }
    } catch (err) {
      setFormError('Sistem hatası oluştu, lütfen daha sonra tekrar deneyin.');
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`/api/ogrenci/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  // Toggle active/passive student
  const handleToggleStatus = async (student: Ogrenci) => {
    try {
      const res = await fetch(`/api/ogrenci/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ aktif: !student.aktif })
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  // Submit Counselor/Guidance Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedStudentId) return;

    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/not`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          rehber_id: user.id,
          not_metni: newNote
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (detailData) {
          setDetailData({
            ...detailData,
            notlar: [data.note, ...detailData.notlar]
          });
        }
        setNewNote('');
      }
    } catch (err) {
      console.error("Error adding guidance note:", err);
    }
  };

  // Delete counseling note
  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/not/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        if (detailData) {
          setDetailData({
            ...detailData,
            notlar: detailData.notlar.filter(n => n.id !== noteId)
          });
        }
      }
    } catch (err) {
      console.error("Error deleting guidance note:", err);
    }
  };

  const openAddView = () => {
    setFormData({
      id: 0,
      ad_soyad: '',
      tc_no: '',
      sinif_id: classes.length > 0 ? classes[0].id.toString() : '',
      veli_id: '',
      alan: 'Sayısal',
      aktif: true
    });
    setView('add');
  };

  const openEditView = (s: Ogrenci) => {
    setFormData({
      id: s.id,
      ad_soyad: s.ad_soyad,
      tc_no: s.tc_no,
      sinif_id: s.sinif_id.toString(),
      veli_id: s.veli_id ? s.veli_id.toString() : '',
      alan: s.alan,
      aktif: s.aktif
    });
    setView('edit');
  };

  return (
    <div className="space-y-6">
      {/* Title block with back capability */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={() => { setView('list'); setDetailData(null); }}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {view === 'list' && "Öğrenci Yönetimi"}
              {view === 'add' && "Yeni Öğrenci Kaydı"}
              {view === 'edit' && "Öğrenci Bilgilerini Düzenle"}
              {view === 'detail' && `Gelişim Raporu: ${detailData?.student.ad_soyad}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {view === 'list' && "Kurumunuzdaki öğrencileri ekleyin, düzenleyin ve performans gelişimlerini izleyin."}
              {view === 'add' && "Sisteme yeni bir öğrenci tanımlayın."}
              {view === 'edit' && "Kayıtlı öğrenci bilgilerini ve atanmış veli durumunu güncelleyin."}
              {view === 'detail' && `${detailData?.student.sinif_adi} • Sınav net gelişim grafikleri ve rehberlik notları`}
            </p>
          </div>
        </div>
        {view === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={students.length === 0}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Download size={14} /> Excel/CSV Aktar
            </button>
            {(user.rol === 'admin' || user.rol === 'ogretmen') && (
              <button
                onClick={openAddView}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-md shadow-blue-500/10"
              >
                <Plus size={14} /> Yeni Öğrenci
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW: List */}
      {view === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {/* Student Login Guide Banner */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 flex gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="text-blue-400 mt-0.5 shrink-0">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-300">💡 Öğrenciler Sisteme Nasıl Giriş Yapacak?</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Sisteme eklediğiniz her öğrenci için otomatik olarak bir kullanıcı hesabı tanımlanır. Öğrencileriniz sisteme giriş yaparken <strong>T.C. Kimlik Numaralarını</strong> hem <strong>E-posta / T.C. No</strong> alanına hem de <strong>Şifre</strong> alanına girerek kendi özel gelişim grafiklerine, karnelerine ve mesaj merkezine anında erişebilirler. Ekstra bir e-posta açmanıza veya şifre tanımlamanıza gerek yoktur!
              </p>
            </div>
          </div>

          {/* Filters & search line */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/40 p-3.5 border border-slate-800 rounded-xl">
            <div className="md:col-span-4 relative">
              <input
                type="text"
                placeholder="Öğrenci adı veya T.C. Kimlik no ile arayın..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Tüm Sınıflar --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedAlan}
                onChange={e => setSelectedAlan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Tüm Alanlar --</option>
                <option value="Sayısal">Sayısal</option>
                <option value="Sözel">Sözel</option>
                <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                <option value="Yabancı Dil">Yabancı Dil</option>
                <option value="LGS">LGS (Ortaokul)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="true">Sadece Aktifler</option>
                <option value="false">Sadece Pasifler</option>
              </select>
            </div>
          </div>

          {/* Students table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs border border-slate-800 border-dashed rounded-xl bg-slate-950/20">
              Aradığınız kriterlere uygun kayıtlı öğrenci bulunamadı.
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="p-3.5 pl-4">Ad Soyad</th>
                      <th className="p-3.5">T.C. Kimlik No</th>
                      <th className="p-3.5">Sınıf / Seviye</th>
                      <th className="p-3.5">Alan</th>
                      <th className="p-3.5">İrtibat / Veli</th>
                      <th className="p-3.5">Son Sınav Neti</th>
                      <th className="p-3.5 text-center">Durum</th>
                      <th className="p-3.5 text-right pr-4">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3.5 pl-4">
                          <button
                            onClick={() => loadStudentDetail(s.id)}
                            className="font-bold text-slate-100 hover:text-blue-400 text-left cursor-pointer transition flex items-center gap-1.5"
                          >
                            {s.ad_soyad}
                            {!s.veli_id && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block" title="Veli Atanmamış"></span>}
                          </button>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">{s.tc_no}</td>
                        <td className="p-3.5 text-slate-200">{s.sinif_adi}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.alan === 'Sayısal' ? 'bg-blue-500/10 text-blue-400' :
                            s.alan === 'Eşit Ağırlık' ? 'bg-indigo-500/10 text-indigo-400' :
                            s.alan === 'LGS' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {s.alan}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px]">
                          <span className="text-slate-200 block">{s.veli_adi}</span>
                          <span className="text-slate-500 block">{s.veli_telefon}</span>
                        </td>
                        <td className="p-3.5">
                          {s.son_net !== "-" ? (
                            <span className={`font-bold ${parseFloat(s.son_net as string) < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {s.son_net} Net
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleToggleStatus(s)}
                            disabled={user.rol !== 'admin' && user.rol !== 'ogretmen'}
                            className="inline-flex items-center text-slate-500 hover:text-white transition disabled:opacity-50"
                            title={s.aktif ? "Pasif Yap" : "Aktif Yap"}
                          >
                            {s.aktif ? (
                              <ToggleRight className="text-emerald-500" size={20} />
                            ) : (
                              <ToggleLeft className="text-slate-600" size={20} />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => loadStudentDetail(s.id)}
                              className="p-1 bg-slate-850 hover:bg-slate-850 text-blue-400 rounded transition"
                              title="Gelişim Karnesi"
                            >
                              <FileText size={13} />
                            </button>
                            {(user.rol === 'admin' || user.rol === 'ogretmen') && (
                              <>
                                <button
                                  onClick={() => openEditView(s)}
                                  className="p-1 bg-slate-850 hover:bg-slate-800 text-amber-400 rounded transition"
                                  title="Düzenle"
                                >
                                  <Edit size={13} />
                                </button>
                                 {user.rol === 'admin' && (
                                  deleteConfirmStudentId === s.id ? (
                                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-red-500/30">
                                      <span className="text-[9px] text-red-400 font-bold px-1">Silinsin mi?</span>
                                      <button
                                        onClick={() => {
                                          handleDeleteStudent(s.id);
                                          setDeleteConfirmStudentId(null);
                                        }}
                                        className="px-1 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[8px] font-black rounded cursor-pointer"
                                      >
                                        Evet
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmStudentId(null)}
                                        className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-black rounded cursor-pointer"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmStudentId(s.id)}
                                      className="p-1 bg-slate-850 hover:bg-slate-800 text-red-400 rounded transition"
                                      title="Sil"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Add & Edit Student Form */}
      {(view === 'add' || view === 'edit') && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 max-w-xl mx-auto">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm mb-4">
              Öğrenci Bilgileri Formu
            </h3>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Öğrenci Adı Soyadı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Caner Çelik"
                value={formData.ad_soyad}
                onChange={e => setFormData({ ...formData, ad_soyad: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">T.C. Kimlik / Öğrenci No *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 12345678901"
                  value={formData.tc_no}
                  onChange={e => setFormData({ ...formData, tc_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Alan Seçimi *</label>
                <select
                  value={formData.alan}
                  onChange={e => setFormData({ ...formData, alan: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="Sayısal">Sayısal</option>
                  <option value="Sözel">Sözel</option>
                  <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                  <option value="Yabancı Dil">Yabancı Dil</option>
                  <option value="LGS">LGS (Ortaokul)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Atanacak Sınıf *</label>
                <select
                  value={formData.sinif_id}
                  onChange={e => setFormData({ ...formData, sinif_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500 transition-all"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Atanacak Veli</label>
                <select
                  value={formData.veli_id}
                  onChange={e => setFormData({ ...formData, veli_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">-- Veli Yok / Sonra Ata --</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.ad_soyad} ({p.email})</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="aktif"
                checked={formData.aktif}
                onChange={e => setFormData({ ...formData, aktif: e.target.checked })}
                className="rounded text-blue-600 bg-slate-950 border-slate-800"
              />
              <label htmlFor="aktif" className="text-xs text-slate-300 font-medium">Öğrenci Kurumda Aktif Olarak Öğretime Devam Ediyor</label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setView('list')}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow shadow-blue-500/10"
              >
                {view === 'add' ? 'Öğrenciyi Kaydet' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: Student Detail Dashboard */}
      {view === 'detail' && detailData && (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{detailData.student.alan} Alana Sahip</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{detailData.student.ad_soyad}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-medium">
                  <span><strong>Sınıf:</strong> {detailData.student.sinif_adi}</span>
                  <span><strong>T.C. No:</strong> {detailData.student.tc_no}</span>
                  <span><strong>Veli:</strong> {detailData.student.veli_adi} • {detailData.student.veli_telefon}</span>
                </div>
              </div>
              <div className="flex gap-4 border-l border-slate-800 pl-4 md:pl-8 py-1">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gelişim Durumu</span>
                  {detailData.sonuclar.length > 0 ? (
                    (() => {
                      const nets = detailData.sonuclar.map(r => r.toplam_net);
                      const current = nets[nets.length - 1];
                      const first = nets[0];
                      const diff = parseFloat((current - first).toFixed(1));
                      return (
                        <span className={`text-xl font-black block mt-1 ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff >= 0 ? `+${diff}` : diff} Net Değişim
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-sm font-semibold text-slate-500 block mt-1">Sınav Yapılmadı</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Haftalık Ders Programı Panel */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              <span>Haftalık Birebir Ders Programı</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"].map(day => {
                const dayLessons = (detailData.ders_programi || [])
                  .filter(dp => dp.gun === day)
                  .sort((a, b) => a.saat.localeCompare(b.saat));

                return (
                  <div key={day} className="bg-slate-950/50 border border-slate-800/85 rounded-xl p-3.5 space-y-3 flex flex-col">
                    <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 text-center border-b border-slate-800 pb-2">
                      {day}
                    </span>
                    <div className="space-y-2.5 flex-1">
                      {dayLessons.length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-6 italic font-medium">Bugün Ders Yok</p>
                      ) : (
                        dayLessons.map(lesson => (
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

          {/* Development Charts */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* SVG Development curve graph */}
            <div className="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Sınav Toplam Net Gelişim Eğrisi</h4>
              {detailData.sonuclar.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-slate-500 text-xs">Bu öğrenci henüz bir sınava girmemiştir.</div>
              ) : (
                <div className="w-full">
                  <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100, 120].map((val, i) => {
                      const y = 160 - (val / 120) * 140 - 10;
                      return (
                        <g key={i}>
                          <line x1="30" y1={y} x2="500" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                          <text x="5" y={y + 4} fill="#475569" className="text-[10px] font-bold">{val}</text>
                        </g>
                      );
                    })}

                    {/* Plot Line */}
                    {(() => {
                      const points: string[] = [];
                      const count = detailData.sonuclar.length;
                      // We use division by count to leave space for projection point on the right
                      const stepX = (500 - 80) / count;

                      detailData.sonuclar.forEach((res, index) => {
                        const x = 40 + index * stepX;
                        const y = 160 - (res.toplam_net / 120) * 140 - 10;
                        points.push(`${x},${y}`);
                      });

                      // Calculate the expected projection for the upcoming practice exam
                      const projectedNet = getProjectedNet(detailData.sonuclar);
                      const projX = 40 + count * stepX;
                      const projY = 160 - (projectedNet / 120) * 140 - 10;
                      const lastX = 40 + (count - 1) * stepX;
                      const lastY = 160 - (Number(detailData.sonuclar[count - 1].toplam_net) / 120) * 140 - 10;

                      return (
                        <>
                          {/* Actual scores path */}
                          <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={points.join(' ')} />
                          
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
                          {detailData.sonuclar.map((res, index) => {
                            const x = 40 + index * stepX;
                            const y = 160 - (res.toplam_net / 120) * 140 - 10;
                            return (
                              <g key={index}>
                                <circle cx={x} cy={y} r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                                <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-extrabold" textAnchor="middle">{res.toplam_net}</text>
                                <text x={x} y="158" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_turu}</text>
                              </g>
                            );
                          })}

                          {/* Projected upcoming exam point */}
                          <g>
                            <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                            <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                            <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black" textAnchor="middle">{projectedNet}</text>
                            <text x={projX} y="158" fill="#f59e0b" className="text-[8px] font-black tracking-wider uppercase" textAnchor="middle">Sıradaki (Beklenen 🎯)</text>
                          </g>
                        </>
                      );
                    })()}
                  </svg>
                  {/* Legends */}
                  <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
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

            {/* Course-by-course Net Comparison */}
            <div className="md:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Son Ders Netleri</h4>
              {detailData.sonuclar.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs">Ders net verisi yok.</div>
              ) : (
                (() => {
                  const lastResult = detailData.sonuclar[detailData.sonuclar.length - 1];
                  const courses = [
                    { name: "Türkçe", net: lastResult.turkce_net, max: 40, color: "bg-blue-500" },
                    { name: "Sosyal", net: lastResult.sosyal_net, max: 20, color: "bg-amber-500" },
                    { name: "Matematik", net: lastResult.matematik_net, max: 40, color: "bg-indigo-500" },
                    { name: "Fen Bilimleri", net: lastResult.fen_net, max: 20, color: "bg-emerald-500" }
                  ];

                  return (
                    <div className="space-y-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800 pb-1.5 flex justify-between">
                        <span>Ders</span>
                        <span>Net Oranı</span>
                      </div>
                      {courses.map((c, i) => {
                        const pct = Math.min(100, Math.max(0, (c.net / c.max) * 100));
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-300">{c.name}</span>
                              <span className="text-slate-200">{c.net} <span className="text-slate-500 text-[10px]">/ {c.max}</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
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

          {/* Exam log, Counselor guidance log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sınav Sonuçları Log */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">Tüm Sınav Sonuç Listesi</h4>
              {detailData.sonuclar.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Öğrencinin kayıtlı sınavı yoktur.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="text-slate-500 text-[9px] uppercase font-bold border-b border-slate-800">
                        <th className="pb-2">Sınav Adı</th>
                        <th className="pb-2">T/S/M/F</th>
                        <th className="pb-2 text-center">Toplam Net</th>
                        <th className="pb-2 text-right">Puan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-medium">
                      {detailData.sonuclar.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20">
                          <td className="py-2.5">
                            <span className="font-bold text-slate-200 block">{r.sinav_adi}</span>
                            <span className="text-[10px] text-slate-500">{r.sinav_tarih}</span>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-400">
                            {r.turkce_net}/{r.sosyal_net}/{r.matematik_net}/{r.fen_net}
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-200">{r.toplam_net}</td>
                          <td className="py-2.5 text-right font-black text-blue-400">{r.puan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Counselor notes log */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                <span>Rehberlik & Görüşme Notları</span>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> Rehber Panel
                </span>
              </h4>

              {/* Guidance Add note form (Only Counselor/Admin can add notes) */}
              {(user.rol === 'admin' || user.rol === 'rehber') && (
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Görüşme veya gelişim notu girin..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.8 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.8 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow shadow-blue-500/10"
                  >
                    <Send size={12} /> Ekle
                  </button>
                </form>
              )}

              {/* Notes display */}
              {detailData.notlar.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Öğrenciye ait rehberlik veya görüşme kaydı bulunmuyor.</div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {detailData.notlar.map(n => (
                    <div key={n.id} className="bg-slate-950/60 p-3 border border-slate-850 rounded-xl space-y-1 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400">{n.rehber_adi}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-medium">{n.tarih}</span>
                           {(user.rol === 'admin' || user.rol === 'rehber') && (
                            deleteConfirmNoteId === n.id ? (
                              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-red-500/30">
                                <span className="text-[9px] text-red-400 font-bold px-1">Silinsin mi?</span>
                                <button
                                  onClick={() => {
                                    handleDeleteNote(n.id);
                                    setDeleteConfirmNoteId(null);
                                  }}
                                  className="px-1 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[8px] font-black rounded cursor-pointer leading-none"
                                >
                                  Evet
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmNoteId(null)}
                                  className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-black rounded cursor-pointer leading-none"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmNoteId(n.id)}
                                className="text-slate-600 hover:text-red-400 transition ml-1"
                                title="Sil"
                              >
                                <Trash2 size={11} />
                              </button>
                            )
                          )}
                        </div>
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
  );
}
