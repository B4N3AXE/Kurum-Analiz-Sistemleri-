import React, { useState, useEffect } from 'react';
import { User, Ogrenci, Sinif, SinavSonuc, RehberlikNotu } from '../types';
import { Search, Plus, Edit, Trash2, FileText, Download, ToggleLeft, ToggleRight, ArrowLeft, Send, AlertCircle, Sparkles, Calendar, Clock, Award, Layers, Target, CheckSquare, BookOpen, Home, Timer, PlusCircle, Activity } from 'lucide-react';
import { getTopicAnalysisForStudent, TYT_SUBJECT_TOPICS, LGS_SUBJECT_TOPICS, AYT_SAY_SUBJECT_TOPICS, AYT_EA_SUBJECT_TOPICS, AYT_SOZ_SUBJECT_TOPICS } from './Dashboard';
import { motion, AnimatePresence } from 'motion/react';

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
  const [studentChartTab, setStudentChartTab] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Lists
  const [students, setStudents] = useState<Ogrenci[]>([]);
  const [classes, setClasses] = useState<Sinif[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
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
    tavsiyeler?: any[];
    veli_notlari?: any[];
    konu_takip?: any[];
    calisma_seanslari?: any[];
    haftalik_gorevler?: any[];
  } | null>(null);

  // New Engagement Tools states for Teachers/Coaches
  const [expandedChecklistSubject, setExpandedChecklistSubject] = useState<string | null>(null);
  const [konuTakipTab, setKonuTakipTab] = useState<'tyt' | 'ayt'>('tyt');
  
  // Weekly Tasks form state
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Matematik');
  const [newTaskDay, setNewTaskDay] = useState('Pazartesi');

  // Manual study session form state
  const [manualSessionSubject, setManualSessionSubject] = useState('Matematik');
  const [manualSessionDuration, setManualSessionDuration] = useState(30); // in minutes

  // Teacher advice form state
  const [newTavsiyeCourse, setNewTavsiyeCourse] = useState('Matematik');
  const [newTavsiyeText, setNewTavsiyeText] = useState('');
  const [deleteConfirmTavsiyeId, setDeleteConfirmTavsiyeId] = useState<number | null>(null);

  // Selected exam for detailed topic analysis / report card
  const [selectedKarneExamId, setSelectedKarneExamId] = useState<number | null>(null);
  const [aiKarneAnalysis, setAiKarneAnalysis] = useState<any>(null);
  const [aiKarneLoading, setAiKarneLoading] = useState(false);
  const [aiKarneError, setAiKarneError] = useState<string | null>(null);

  // Note text input
  const [newNote, setNewNote] = useState('');
  const [newVeliNote, setNewVeliNote] = useState('');

  // Form states for Add/Edit student
  const [formData, setFormData] = useState({
    id: 0,
    ad_soyad: '',
    tc_no: '',
    sinif_id: '',
    veli_id: '',
    danisman_id: '',
    sifre: '',
    alan: 'Sayısal' as any,
    aktif: true
  });

  const [formError, setFormError] = useState('');
  const [targetNetInput, setTargetNetInput] = useState('');

  // Handle Target Net updating
  const handleUpdateTargetNet = async (newTarget: number) => {
    if (!detailData) return;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ hedef_net: newTarget })
      });
      if (res.ok) {
        setDetailData(prev => prev ? {
          ...prev,
          student: {
            ...prev.student,
            hedef_net: newTarget
          }
        } : null);
      }
    } catch (err) {
      console.error("Error updating target net:", err);
    }
  };

  // Toggle Topic Completion on behalf of Student
  const handleToggleTopic = async (topicKey: string, currentStatus: boolean) => {
    if (!detailData || !token) return;
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/konu-takip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ konu_key: topicKey.toLowerCase(), tamamlandi: newStatus })
      });
      if (res.ok) {
        setDetailData(prev => {
          if (!prev) return null;
          const existingList = prev.konu_takip || [];
          const exists = existingList.some(kt => kt.konu_key?.toLowerCase() === topicKey.toLowerCase());
          let newList;
          if (exists) {
            newList = existingList.map(kt => kt.konu_key?.toLowerCase() === topicKey.toLowerCase() ? { ...kt, tamamlandi: newStatus, tarih: new Date().toISOString() } : kt);
          } else {
            newList = [...existingList, { id: Date.now(), ogrenci_id: prev.student.id, konu_key: topicKey.toLowerCase(), tamamlandi: newStatus, tarih: new Date().toISOString() }];
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

  // Create Weekly Task on behalf of Student (As Coach/Teacher!)
  const handleCreateWeeklyTask = async () => {
    if (!detailData || !token || !newTaskText.trim()) return;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/haftalik-gorevler`, {
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
        setDetailData(prev => {
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

  // Toggle Weekly Task
  const handleToggleWeeklyTask = async (taskId: number, currentCompleted: boolean) => {
    if (!detailData || !token) return;
    const newStatus = !currentCompleted;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/haftalik-gorevler/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ tamamlandi: newStatus })
      });
      if (res.ok) {
        setDetailData(prev => {
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

  // Delete Weekly Task
  const handleDeleteWeeklyTask = async (taskId: number) => {
    if (!detailData || !token) return;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/haftalik-gorevler/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      if (res.ok) {
        setDetailData(prev => {
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

  // Create Manual Study Session
  const handleCreateStudySession = async () => {
    if (!detailData || !token || manualSessionDuration <= 0) return;
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/calisma-seanslari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          ders_adi: manualSessionSubject,
          sure: manualSessionDuration * 60 // convert to seconds
        })
      });
      if (res.ok) {
        const savedSession = await res.json();
        setDetailData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            calisma_seanslari: [savedSession, ...(prev.calisma_seanslari || [])]
          };
        });
      }
    } catch (err) {
      console.error("Çalışma seansı eklenemedi:", err);
    }
  };

  // Fetch student records & lookup tables
  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Build API query string
      let query = `/api/ogrenci?kurum_id=${user.kurum_id}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedClass) query += `&sinif_id=${selectedClass}`;
      if (selectedAlan) query += `&alan=${encodeURIComponent(selectedAlan)}`;
      if (selectedStatus !== 'all') query += `&aktif=${selectedStatus}`;

      const [resStudents, resClasses, resParents, resTeachers, resCounselors] = await Promise.all([
        fetch(query, { headers: { 'Authorization': token } }),
        fetch(`/api/sinif?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } }),
        fetch(`/api/veli?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } }),
        fetch(`/api/ogretmen?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } }),
        fetch(`/api/rehber?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token } })
      ]);

      if (resStudents.ok && resClasses.ok && resParents.ok && resTeachers.ok && resCounselors.ok) {
        setStudents(await resStudents.json());
        setClasses(await resClasses.json());
        setParents(await resParents.json());
        
        const teachersList = await resTeachers.json();
        const counselorsList = await resCounselors.json();
        setAdvisors([...teachersList, ...counselorsList]);
      }
    } catch (err) {
      console.error("Error loading students data:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [view, search, selectedClass, selectedAlan, selectedStatus]);

  // Live background polling for live student timers and session status (Features 1, 2, 4)
  useEffect(() => {
    if (view !== 'list') return;
    const interval = setInterval(() => {
      loadData(true); // background silent load
    }, 5000);
    return () => clearInterval(interval);
  }, [view, search, selectedClass, selectedAlan, selectedStatus]);

  // Load particular student detail
  const loadStudentDetail = async (id: number, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`/api/ogrenci/${id}`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
        if (!isBackground) {
          setTargetNetInput(data.student.hedef_net ? String(data.student.hedef_net) : '95');
          setSelectedStudentId(id);
          setSelectedKarneExamId(null);
          setAiKarneAnalysis(null);
          setAiKarneError(null);
          setView('detail');
        }
      }
    } catch (err) {
      console.error("Error loading student detail:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Reset AI Karne analysis whenever selected exam changes
  useEffect(() => {
    setAiKarneAnalysis(null);
    setAiKarneError(null);
  }, [selectedKarneExamId]);

  const handleTriggerAiKarneAnalysis = async (examId: number, examType: string, topicAnalysisData: any) => {
    if (!detailData) return;
    setAiKarneLoading(true);
    setAiKarneError(null);
    setAiKarneAnalysis(null);
    try {
      const res = await fetch(`/api/ogrenci/${detailData.student.id}/ai-karne-analizi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          examId,
          examType,
          topicAnalysisData
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAiKarneAnalysis(data.analysis);
        } else {
          setAiKarneError('Yapay zeka analiz sonuçları alınamadı.');
        }
      } else {
        const err = await res.json();
        setAiKarneError(err.error || 'Yapay zeka analizi başarısız oldu.');
      }
    } catch (err: any) {
      console.error("AI karne analysis error:", err);
      setAiKarneError('Bağlantı hatası oluştu.');
    } finally {
      setAiKarneLoading(false);
    }
  };

  // Live background polling for active student detail view (Features 1, 2, 4)
  useEffect(() => {
    if (view !== 'detail' || !selectedStudentId) return;
    const interval = setInterval(() => {
      loadStudentDetail(selectedStudentId, true); // background silent update
    }, 5000);
    return () => clearInterval(interval);
  }, [view, selectedStudentId]);

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

    if (!formData.ad_soyad || !formData.sinif_id || !formData.alan) {
      setFormError('Lütfen tüm zorunlu alanları (*) doldurun.');
      return;
    }

    const payload: any = {
      ad_soyad: formData.ad_soyad,
      tc_no: formData.tc_no,
      sinif_id: parseInt(formData.sinif_id),
      veli_id: formData.veli_id ? parseInt(formData.veli_id) : null,
      danisman_id: formData.danisman_id ? parseInt(formData.danisman_id) : null,
      alan: formData.alan,
      aktif: formData.aktif
    };

    if (formData.sifre) {
      payload.sifre = formData.sifre;
    }

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
  const handleAddVeliNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVeliNote.trim() || !selectedStudentId) return;

    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/velinot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          ekleyen_id: user.id,
          not_metni: newVeliNote
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (detailData) {
          setDetailData({
            ...detailData,
            veli_notlari: [data.veliNot, ...(detailData.veli_notlari || [])]
          });
        }
        setNewVeliNote('');
      } else {
        const err = await res.json();
        alert('Geri bildirim eklenemedi: ' + err.error);
      }
    } catch (error) {
      console.error("Geri bildirim ekleme hatası:", error);
    }
  };

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

  // Add teacher recommendation
  const handleAddTavsiye = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTavsiyeText.trim() || !newTavsiyeCourse) return;

    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/tavsiye`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          ogretmen_id: user.id,
          ogretmen_adi: user.ad_soyad,
          ders_adi: newTavsiyeCourse,
          tavsiye_metni: newTavsiyeText
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (detailData) {
          setDetailData({
            ...detailData,
            tavsiyeler: [data.tavsiye, ...(detailData.tavsiyeler || [])]
          });
        }
        setNewTavsiyeText('');
      }
    } catch (err) {
      console.error("Error adding teacher advice:", err);
    }
  };

  // Delete teacher recommendation
  const handleDeleteTavsiye = async (tavsiyeId: number) => {
    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/tavsiye/${tavsiyeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        if (detailData) {
          setDetailData({
            ...detailData,
            tavsiyeler: (detailData.tavsiyeler || []).filter(t => t.id !== tavsiyeId)
          });
        }
      }
    } catch (err) {
      console.error("Error deleting teacher advice:", err);
    }
  };

  // Delete parent feedback note
  const handleDeleteVeliNot = async (noteId: number) => {
    try {
      const res = await fetch(`/api/ogrenci/${selectedStudentId}/veli-not/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        if (detailData) {
          setDetailData({
            ...detailData,
            veli_notlari: (detailData.veli_notlari || []).filter(n => n.id !== noteId)
          });
        }
      }
    } catch (err) {
      console.error("Error deleting parent note:", err);
    }
  };

  const openAddView = () => {
    setFormData({
      id: 0,
      ad_soyad: '',
      tc_no: '',
      sinif_id: classes.length > 0 ? classes[0].id.toString() : '',
      veli_id: '',
      danisman_id: '',
      sifre: '',
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
      danisman_id: s.danisman_id ? s.danisman_id.toString() : '',
      sifre: s.sifre || '',
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
                      <th className="p-3.5">Bugün Çalışma / Canlı</th>
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
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 justify-center">
                            {/* Today's total work minutes */}
                            <div className="flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              <span className="text-[11px] text-slate-300 font-bold">
                                {s.bugun_calisma_suresi || 0} dk
                              </span>
                            </div>
                            
                            {/* Live study session status */}
                            {s.aktif_seans && s.aktif_seans.calisiyor ? (
                              <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 w-fit">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span className="truncate max-w-[100px]">{s.aktif_seans.ders_adi}</span>
                                <span className="text-[9px] text-emerald-300 font-mono">
                                  {s.aktif_seans.mod === 'pomodoro' 
                                    ? `${Math.floor(s.aktif_seans.kalan_sure / 60)}:${(s.aktif_seans.kalan_sure % 60).toString().padStart(2, '0')}`
                                    : `${Math.floor(s.aktif_seans.kalan_sure / 60)} dk`
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium">Pasif</span>
                            )}
                          </div>
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
                        <td className="p-3.5 text-right pr-4 whitespace-nowrap">
                          <div className="flex justify-end gap-1.5 whitespace-nowrap">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Danışman Öğretmen</label>
                <select
                  value={formData.danisman_id}
                  onChange={e => setFormData({ ...formData, danisman_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">-- Danışman Yok --</option>
                  {advisors.map(adv => (
                    <option key={`${adv.id}-${adv.rol}`} value={adv.id}>
                      {adv.ad_soyad} ({adv.rol === 'ogretmen' ? 'Öğretmen' : 'Rehberlik'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Giriş Şifresi</label>
                <input
                  type="text"
                  placeholder={view === 'edit' ? "Değiştirmek istemiyorsanız boş bırakın" : "Varsayılan: Şifresiz / T.C. ile giriş"}
                  value={formData.sifre}
                  onChange={e => setFormData({ ...formData, sifre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
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
                <h3 className="text-2xl font-bold text-slate-100 mt-1 flex items-center gap-2">
                  {detailData.student.ad_soyad}
                  {detailData.student.aktif_seans && detailData.student.aktif_seans.calisiyor ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full animate-pulse select-none">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span>Canlı: {detailData.student.aktif_seans.ders_adi} ({detailData.student.aktif_seans.mod === 'pomodoro' ? `${Math.floor(detailData.student.aktif_seans.kalan_sure / 60)}:${(detailData.student.aktif_seans.kalan_sure % 60).toString().padStart(2, '0')}` : `${Math.floor(detailData.student.aktif_seans.kalan_sure / 60)} dk`})</span>
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-950/55 border border-slate-800 px-2 py-0.5 rounded-full select-none">
                      Çevrimdışı / Pasif
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-medium">
                  <span><strong>Sınıf:</strong> {detailData.student.sinif_adi}</span>
                  <span><strong>T.C. No:</strong> {detailData.student.tc_no}</span>
                  <span><strong>Veli:</strong> {detailData.student.veli_adi} • {detailData.student.veli_telefon}</span>
                  <span><strong>Bugün Toplam:</strong> {detailData.student.bugun_calisma_suresi || 0} dk çalışma</span>
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* SVG Development curve graph */}
            <div className="xl:col-span-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gelişim Eğrisi</h4>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  {(['TYT', 'AYT', 'LGS'] as const).map((t) => {
                    const count = detailData.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === t).length;
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
                const filteredSonuclar = detailData.sonuclar.filter(res => (res.tur || res.sinav_turu || 'TYT') === studentChartTab);
                const scaleMax = studentChartTab === 'TYT' ? 120 : studentChartTab === 'AYT' ? 80 : 90;
                const scaleValues = studentChartTab === 'TYT' 
                  ? [0, 25, 50, 75, 100, 120] 
                  : studentChartTab === 'AYT' 
                    ? [0, 20, 40, 60, 80] 
                    : [0, 15, 30, 45, 60, 75, 90];

                if (filteredSonuclar.length === 0) {
                  return (
                    <div className="h-44 flex items-center justify-center text-slate-500 text-xs italic">
                      Bu öğrencinin henüz {studentChartTab} türünde girilmiş bir sınav sonucu bulunmamaktadır.
                    </div>
                  );
                }

                return (
                  <div className="w-full">
                    <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
                      {/* Grid Lines */}
                      {scaleValues.map((val, i) => {
                        const y = 160 - (val / scaleMax) * 140 - 10;
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
                        const count = filteredSonuclar.length;
                        // We use division by count to leave space for projection point on the right
                        const stepX = (500 - 80) / count;

                        filteredSonuclar.forEach((res, index) => {
                          const x = 40 + index * stepX;
                          const y = 160 - (res.toplam_net / scaleMax) * 140 - 10;
                          points.push(`${x},${y}`);
                        });

                        // Calculate the expected projection for the upcoming practice exam
                        const projectedNet = getProjectedNet(filteredSonuclar);
                        const projX = 40 + count * stepX;
                        const projY = 160 - (projectedNet / scaleMax) * 140 - 10;
                        const lastX = 40 + (count - 1) * stepX;
                        const lastY = 160 - (Number(filteredSonuclar[count - 1].toplam_net) / scaleMax) * 140 - 10;

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
                            {filteredSonuclar.map((res, index) => {
                              const x = 40 + index * stepX;
                              const y = 160 - (res.toplam_net / scaleMax) * 140 - 10;
                              return (
                                <g key={index}>
                                  <circle cx={x} cy={y} r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                                  <text x={x} y={y - 8} fill="#f1f5f9" className="text-[10px] font-extrabold font-mono" textAnchor="middle">{res.toplam_net}</text>
                                  <text x={x} y="158" fill="#64748b" className="text-[8px] font-bold" textAnchor="middle">{res.sinav_adi.substring(0, 10)}...</text>
                                </g>
                              );
                            })}

                            {/* Projected upcoming exam point */}
                            <g>
                              <circle cx={projX} cy={projY} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" className="animate-pulse" />
                              <circle cx={projX} cy={projY} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,2" />
                              <text x={projX} y={projY - 9} fill="#f59e0b" className="text-[11px] font-black font-mono" textAnchor="middle">{projectedNet}</text>
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
                        <span>Gerçekleşen {studentChartTab} Netleri</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                        <span className="text-amber-400">Gelecek Sınav Projeksiyonu</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Course-by-course Net Comparison */}
            <div className="xl:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
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

            {/* Academic Target Tracking (Suggestion 4) */}
            <div className="xl:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">🎯 Akademik Hedef</h4>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.5 rounded font-black uppercase">YKS / LGS</span>
                </div>

                {(() => {
                  const target = detailData.student.hedef_net || 95;
                  const currentNet = detailData.sonuclar.length > 0 
                    ? Number(detailData.sonuclar[detailData.sonuclar.length - 1].toplam_net) 
                    : 0;
                  const achievementPct = Math.min(100, Math.round((currentNet / target) * 100));
                  const gap = Math.max(0, parseFloat((target - currentNet).toFixed(1)));

                  let tip = '';
                  if (gap === 0) {
                    tip = "Harika! Öğrencimiz belirlediği net hedefine ulaştı! Motivasyonu koruyalım. 🎉";
                  } else if (gap <= 10) {
                    tip = "Müthiş! Hedefe son derece yakın. Nokta atışı konu eksik analizleriyle hedefe ulaşabiliriz! 💪";
                  } else if (gap <= 22) {
                    tip = "İstikrarlı gidiyor. Hatalı soruların analizine ve düzenli etütlere ağırlık verilmeli. 📈";
                  } else {
                    tip = "Öğrenme eğrisi başlangıcında. Haftalık ders çalışma planına tam sadakat gerekiyor. 🎯";
                  }

                  return (
                    <div className="space-y-4">
                      {/* Radial-like visual block */}
                      <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-4 text-center space-y-2">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Hedef Başarı Oranı</span>
                        <div className="text-3xl font-black text-indigo-400 tracking-tight">{achievementPct}%</div>
                        
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${achievementPct}%` }}></div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1.5">
                          <span>Son Net: {currentNet}</span>
                          <span>Hedef Net: {target}</span>
                        </div>
                      </div>

                      {/* Gap message */}
                      <div className="text-[11px] font-bold text-slate-200">
                        {gap > 0 ? (
                          <span className="text-amber-400">Hedefe Kalan: {gap} Net</span>
                        ) : (
                          <span className="text-emerald-400">🎯 Hedef Başarıyla Gerçekleşti!</span>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{tip}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Target edit input */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Hedef Net Güncelle</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={targetNetInput}
                    onChange={(e) => setTargetNetInput(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold text-center"
                    placeholder="95"
                    min="1"
                    max="120"
                  />
                  <button 
                    onClick={() => handleUpdateTargetNet(Number(targetNetInput) || 95)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow"
                  >
                    🎯 Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KONU ANALİZLİ SINAV KARNESİ (YENİ EK) */}
          {detailData.sonuclar.length > 0 && (
            (() => {
              const activeExamResult = detailData.sonuclar.find(r => r.id === selectedKarneExamId) || 
                detailData.sonuclar[detailData.sonuclar.length - 1];

              const topicAnalysis = getTopicAnalysisForStudent(
                detailData.student.id,
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
                
                detailData.sonuclar.forEach(r => {
                  const analysis = getTopicAnalysisForStudent(
                    detailData.student.id,
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
                  advice = "Okuma anlama and odaklanma hızı artırılmalı, günlük 20 paragraf sorusu süreli (dakika tutarak) çözülmelidir.";
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
                        <span>Yapay Zeka Destekli Akademik Gelişim & Konu Analizi Uyarıları</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        Öğrencinin geçmiş tüm deneme sınavları analiz edilerek en çok hata yaptığı ve odaklanması gereken kritik konular aşağıda listelenmiştir:
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
                          <span>Öğrenci Sınav Karnesi & Konu Analizi</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold block mt-0.5">Konu düzeyinde doğru, yanlış ve başarı oranları analizi</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sınav Seçimi:</span>
                        <select
                          value={selectedKarneExamId || activeExamResult.id}
                          onChange={(e) => setSelectedKarneExamId(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-750 text-xs font-black text-indigo-400 rounded-xl px-3 py-1.5 focus:outline-none"
                        >
                          {detailData.sonuclar.map((r) => (
                            <option key={r.id} value={r.id}>{r.sinav_adi} ({r.tur || (r as any).sinav_turu || 'TYT'})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-400">
                      <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                        <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Öğrenci</span>
                        <span className="text-slate-200 font-black block truncate mt-0.5">{detailData.student.ad_soyad}</span>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                        <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">Sınıf / Alan</span>
                        <span className="text-slate-200 font-black block mt-0.5">{detailData.student.sinif_adi} • {detailData.student.alan}</span>
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

                    {/* YAPAY ZEKA DERS DERS ANALIZ ALANI */}
                    <div className="space-y-4 pt-1">
                      <button
                        onClick={() => handleTriggerAiKarneAnalysis(
                          activeExamResult.id,
                          activeExamResult.tur || (activeExamResult as any).sinav_turu || 'TYT',
                          topicAnalysis
                        )}
                        disabled={aiKarneLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-100 font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <Sparkles size={16} className={aiKarneLoading ? "animate-spin" : "animate-pulse"} />
                        {aiKarneLoading ? "KAS.ai Karneni Ders Ders Analiz Ediyor, Lütfen Bekle..." : "Yapay Zeka Karnemi Ders Ders İncelesin"}
                      </button>

                      {aiKarneError && (
                        <div className="bg-rose-950/20 border border-rose-900/40 text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <span className="text-sm">⚠️</span>
                          <span>{aiKarneError}</span>
                        </div>
                      )}

                      {aiKarneAnalysis && (
                        <div className="bg-slate-950/40 border border-indigo-900/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                          <div className="flex items-center gap-2.5 border-b border-indigo-950/80 pb-3">
                            <div className="p-1.5 bg-indigo-950 text-indigo-400 rounded-lg">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-100 uppercase tracking-tight">KAS.ai Yapay Zeka Karne Teşhis Raporu</h5>
                              <p className="text-[10px] text-indigo-400 font-bold block mt-0.5">Ders ve Konu Odaklı Bireysel Teşhisler • "Bu konuda şu sıkıntın var"</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {aiKarneAnalysis.map((subj: any, sIdx: number) => {
                              const isDanger = subj.status === 'danger';
                              const isWarning = subj.status === 'warning';
                              
                              let statusBg = "bg-emerald-950/20 border-emerald-900/40 text-emerald-400";
                              let statusText = "Başarılı Seviye";
                              if (isDanger) {
                                statusBg = "bg-rose-950/20 border-rose-900/40 text-rose-400";
                                statusText = "Kritik Dikkat";
                              } else if (isWarning) {
                                statusBg = "bg-amber-950/20 border-amber-900/40 text-amber-400";
                                statusText = "Geliştirilmeli";
                              }

                              return (
                                <div key={sIdx} className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 space-y-3 hover:border-slate-800 transition flex flex-col justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-850/80 pb-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-slate-100 uppercase tracking-wider">{subj.subject}</span>
                                        <span className="text-[10px] font-mono font-bold text-slate-500">({subj.net} Net)</span>
                                      </div>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusBg}`}>
                                        {statusText}
                                      </span>
                                    </div>

                                    <p className="text-[10.5px] text-slate-300 font-medium italic leading-relaxed">
                                      "{subj.general_comment}"
                                    </p>

                                    {subj.topics_issues && subj.topics_issues.length > 0 ? (
                                      <div className="space-y-2 pt-1">
                                        {subj.topics_issues.map((issue: any, iIdx: number) => (
                                          <div key={iIdx} className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[10px] font-bold text-slate-200">{issue.topic_name}</span>
                                              <span className="text-[9px] font-bold text-slate-500">Başarı Oranı: %{issue.success_rate}</span>
                                            </div>
                                            
                                            <div className="space-y-1 font-semibold">
                                              <div className="text-[9.5px] text-rose-300 leading-relaxed flex items-start gap-1">
                                                <span className="text-rose-500 font-bold block">⚠️</span>
                                                <span><strong>Sıkıntı:</strong> {issue.issue}</span>
                                              </div>
                                              <div className="text-[9.5px] text-emerald-300 leading-relaxed flex items-start gap-1">
                                                <span className="text-emerald-500 font-bold block">💡</span>
                                                <span><strong>Tavsiye:</strong> {issue.solution}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-[9.5px] text-emerald-400 font-bold bg-emerald-950/10 border border-emerald-950/30 p-2 rounded-lg flex items-center gap-1.5 mt-2">
                                        ✨ Kritik konu eksiği bulunmuyor. Süpersin!
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

            {/* COACH/TEACHER STUDENT ENGAGEMENT TRACKING (FEATURES 1, 2, 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Feature 4: Haftalık Çalışma Görevleri & Ödev Takip */}
              <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>Haftalık Çalışma Görevleri & Ödev Takip</span>
                  </h4>
                  <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wide">
                    Koçluk Paneli
                  </span>
                </div>

                {/* Progress bar */}
                {(() => {
                  const tasks = detailData.haftalik_gorevler || [];
                  const completedCount = tasks.filter((t: any) => t.tamamlandi).length;
                  const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
                  return (
                    <div className="space-y-1.5 bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Genel Görev Tamamlama Oranı</span>
                        <span className="text-indigo-400 font-mono">{completedCount}/{tasks.length} (%{pct})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}                 {/* Task Assigner Form (Coach assigns tasks) */}
                <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest block pb-2 border-b border-slate-800/60">YENİ ÖDEV / GÖREV ATAMA</span>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Görev Detayı</label>
                      <input
                        type="text"
                        placeholder="Örn: 150 Soru Paragraf Çözülecek"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder-slate-600 shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Ders</label>
                        <select
                          value={newTaskSubject}
                          onChange={e => setNewTaskSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-inner"
                        >
                          <option value="Matematik">Matematik</option>
                          <option value="Türkçe">Türkçe</option>
                          <option value="Fizik">Fizik</option>
                          <option value="Kimya">Kimya</option>
                          <option value="Biyoloji">Biyoloji</option>
                          <option value="Tarih">Tarih</option>
                          <option value="Coğrafya">Coğrafya</option>
                          <option value="Felsefe">Felsefe</option>
                          <option value="Genel Rehberlik">Rehberlik</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Gün</label>
                        <select
                          value={newTaskDay}
                          onChange={e => setNewTaskDay(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-inner"
                        >
                          <option value="Pazartesi">Pazartesi</option>
                          <option value="Salı">Salı</option>
                          <option value="Çarşamba">Çarşamba</option>
                          <option value="Perşembe">Perşembe</option>
                          <option value="Cuma">Cuma</option>
                          <option value="Cumartesi">Cumartesi</option>
                          <option value="Pazar">Pazar</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateWeeklyTask}
                      className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.15)]"
                    >
                      <Plus size={16} /> Görevi Ata
                    </button>
                  </div>
                </div>

                {/* Assigned Tasks list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {!(detailData.haftalik_gorevler && detailData.haftalik_gorevler.length > 0) ? (
                    <p className="text-xs text-slate-500 text-center py-6 italic">Öğrenciye atanmış haftalık çalışma görevi bulunmuyor.</p>
                  ) : (
                    (detailData.haftalik_gorevler || []).map((task: any) => (
                      <div key={task.id} className="bg-slate-950/50 p-3 border border-slate-850 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleWeeklyTask(task.id, task.tamamlandi)}
                            className={`mt-0.5 rounded border transition flex items-center justify-center shrink-0 w-4 h-4 cursor-pointer ${
                              task.tamamlandi 
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                                : 'border-slate-700 hover:border-slate-500 text-transparent'
                            }`}
                          >
                            <svg className="w-2.5 h-2.5 stroke-2 stroke-current" fill="none" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold leading-tight ${task.tamamlandi ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.gorev_metni}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-bold">
                              <span className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400">{task.ders_adi}</span>
                              <span>•</span>
                              <span>{task.gun} günü için</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteWeeklyTask(task.id)}
                          className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition shrink-0"
                          title="Görevi Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Feature 2: Çalışma Seansları & Odak Takip */}
              <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    <span>Çalışma Seansları & Odak Takip</span>
                  </h4>
                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wide">
                    Süre Analizi
                  </span>
                </div>

                {/* Stats */}
                {(() => {
                  const sessions = detailData.calisma_seanslari || [];
                  const totalSeconds = sessions.reduce((sum: number, s: any) => sum + (s.sure || 0), 0);
                  const totalMinutes = Math.round(totalSeconds / 60);
                  const hours = Math.floor(totalMinutes / 60);
                  const remainingMins = totalMinutes % 60;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Toplam Çalışma Süresi</span>
                        <span className="text-lg font-black text-emerald-400 font-mono block mt-1">
                          {hours > 0 ? `${hours} sa ${remainingMins} dk` : `${remainingMins} dakika`}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Kayıtlı Seans Adedi</span>
                        <span className="text-lg font-black text-indigo-400 font-mono block mt-1">
                          {sessions.length} Seans
                        </span>
                      </div>
                    </div>
                  );
                })()}                 {/* Manual Log Adder */}
                <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest block pb-2 border-b border-slate-800/60">Manuel Çalışma Süresi Ekleme</span>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Ders Seçimi</label>
                      <select
                        value={manualSessionSubject}
                        onChange={e => setManualSessionSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-medium cursor-pointer shadow-inner"
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Çalışma Süresi (Dakika)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={manualSessionDuration}
                        onChange={e => setManualSessionDuration(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateStudySession}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    >
                      <Plus size={16} /> Çalışma Süresini Kaydet
                    </button>
                  </div>
                </div>

                {/* Session Logs list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {!(detailData.calisma_seanslari && detailData.calisma_seanslari.length > 0) ? (
                    <p className="text-xs text-slate-500 text-center py-6 italic font-medium">Öğrenciye ait kayıtlı odak seansı bulunmuyor.</p>
                  ) : (
                    (detailData.calisma_seanslari || []).map((session: any) => (
                      <div key={session.id} className="bg-slate-950/40 border border-slate-850 px-3 py-2.5 rounded-xl flex items-center justify-between hover:border-slate-800 transition">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                            <Activity size={12} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200">{session.ders_adi} Çalışması</span>
                            <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">
                              {session.tarih ? new Date(session.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Belirsiz Tarih'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                          +{Math.round(session.sure / 60)} dk
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Feature 1: Konu Takip Çizelgesi (Tüm Müfredat) */}
              <div className="lg:col-span-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-2">
                      <Layers size={15} className="text-cyan-400" />
                      <span>Müfredat Konu Takip Çizelgesi</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Öğrencinin YKS konularındaki hazırlık ve bitirme durumunu takip edin.</p>
                  </div>
                  <span className="self-start sm:self-center text-[10px] font-black bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wide">
                    {detailData.student.alan || 'Sayısal'} Alanı
                  </span>
                </div>

                {/* TYT / AYT Tab Switcher */}
                {(() => {
                  const isLgs = detailData.student.alan === 'LGS' || detailData.student.sinif_adi?.toLowerCase().includes('lgs');
                  if (isLgs) return null;
                  return (
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 max-w-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setKonuTakipTab('tyt');
                          setExpandedChecklistSubject(null);
                        }}
                        className={`flex-1 py-2.5 px-4 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                          konuTakipTab === 'tyt'
                            ? 'bg-cyan-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/45'
                        }`}
                      >
                        TYT Konuları
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKonuTakipTab('ayt');
                          setExpandedChecklistSubject(null);
                        }}
                        className={`flex-1 py-2.5 px-4 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                          konuTakipTab === 'ayt'
                            ? 'bg-cyan-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/45'
                        }`}
                      >
                        AYT ({detailData.student.alan || 'Sayısal'}) Konuları
                      </button>
                    </div>
                  );
                })()}

                {/* Progress Grid summary */}
                {(() => {
                  let subjMap = {};
                  const isLgs = detailData.student.alan === 'LGS' || detailData.student.sinif_adi?.toLowerCase().includes('lgs');
                  if (isLgs) {
                    subjMap = LGS_SUBJECT_TOPICS;
                  } else {
                    if (konuTakipTab === 'tyt') {
                      subjMap = TYT_SUBJECT_TOPICS;
                    } else {
                      if (detailData.student.alan === 'Sayısal') {
                        subjMap = AYT_SAY_SUBJECT_TOPICS;
                      } else if (detailData.student.alan === 'Sözel') {
                        subjMap = AYT_SOZ_SUBJECT_TOPICS;
                      } else if (detailData.student.alan === 'Eşit Ağırlık') {
                        subjMap = AYT_EA_SUBJECT_TOPICS;
                      } else {
                        subjMap = AYT_SAY_SUBJECT_TOPICS;
                      }
                    }
                  }
                  const studentDoneKeys = (detailData.konu_takip || [])
                    .filter((kt: any) => kt.tamamlandi)
                    .map((kt: any) => kt.konu_key?.toLowerCase());

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/30 p-4 border border-slate-850 rounded-xl">
                      {Object.keys(subjMap).map((subjKey) => {
                        const topics = (subjMap as any)[subjKey] || [];
                        const completedInSubj = topics.filter((t: any) => {
                          const uniqueKey = `${subjKey}_${t.ad}`.toLowerCase();
                          return studentDoneKeys.includes(uniqueKey);
                        }).length;
                        const pct = topics.length > 0 ? Math.round((completedInSubj / topics.length) * 100) : 0;
                        const label = subjKey.toUpperCase().replace(/_/g, ' ');
                        
                        return (
                          <button 
                            key={subjKey} 
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('subject-accordions');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                              setExpandedChecklistSubject(expandedChecklistSubject === subjKey ? null : subjKey);
                            }}
                            className="space-y-2 block w-full text-left cursor-pointer hover:bg-slate-900/60 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-800"
                          >
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-300 font-black">{label}</span>
                              <span className="text-cyan-400 font-mono">{completedInSubj}/{topics.length} (%{pct})</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Subject Accordions */}
                <div id="subject-accordions" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {(() => {
                    let subjMap = {};
                    const isLgs = detailData.student.alan === 'LGS' || detailData.student.sinif_adi?.toLowerCase().includes('lgs');
                    if (isLgs) {
                      subjMap = LGS_SUBJECT_TOPICS;
                    } else {
                      if (konuTakipTab === 'tyt') {
                        subjMap = TYT_SUBJECT_TOPICS;
                      } else {
                        if (detailData.student.alan === 'Sayısal') {
                          subjMap = AYT_SAY_SUBJECT_TOPICS;
                        } else if (detailData.student.alan === 'Sözel') {
                          subjMap = AYT_SOZ_SUBJECT_TOPICS;
                        } else if (detailData.student.alan === 'Eşit Ağırlık') {
                          subjMap = AYT_EA_SUBJECT_TOPICS;
                        } else {
                          subjMap = AYT_SAY_SUBJECT_TOPICS;
                        }
                      }
                    }
                    const studentDoneKeys = (detailData.konu_takip || [])
                      .filter((kt: any) => kt.tamamlandi)
                      .map((kt: any) => kt.konu_key?.toLowerCase());

                    return Object.keys(subjMap).map((subjKey) => {
                      const topics = (subjMap as any)[subjKey] || [];
                      const completedCount = topics.filter((t: any) => {
                        const uniqueKey = `${subjKey}_${t.ad}`.toLowerCase();
                        return studentDoneKeys.includes(uniqueKey);
                      }).length;
                      const isOpen = expandedChecklistSubject === subjKey;

                      return (
                        <div key={subjKey} className="bg-slate-950/60 border border-slate-850 rounded-xl overflow-hidden transition">
                          <button
                            type="button"
                            onClick={() => setExpandedChecklistSubject(isOpen ? null : subjKey)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-950/90 transition text-left cursor-pointer"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-200 tracking-wider uppercase">{subjKey.toUpperCase().replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-slate-500 font-extrabold block mt-0.5">Toplam {topics.length} ders başlığı</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-900/30 px-2.5 py-1 rounded-lg">
                                {completedCount} / {topics.length} Bitti
                              </span>
                              <span className={`text-slate-500 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="p-3 bg-slate-950/30 border-t border-slate-900/80 space-y-2">
                              {topics.map((topic: any, idx: number) => {
                                const uniqueKey = `${subjKey}_${topic.ad}`.toLowerCase();
                                const isDone = studentDoneKeys.includes(uniqueKey);
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleToggleTopic(uniqueKey, isDone)}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold cursor-pointer transition select-none ${
                                      isDone 
                                        ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-200 hover:bg-cyan-950/30' 
                                        : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:bg-slate-900/60 hover:border-slate-700'
                                    }`}
                                  >
                                    <span className="truncate pr-2 font-black text-xs">{topic.ad}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-[10px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850/60 font-mono font-bold">
                                        Önem: {topic.soru} Soru
                                      </span>
                                      <motion.div
                                        animate={{
                                          scale: isDone ? [1, 1.2, 1] : 1,
                                          backgroundColor: isDone ? "rgba(6, 182, 212, 0.2)" : "rgba(15, 23, 42, 0.4)",
                                          borderColor: isDone ? "#06b6d4" : "#475569"
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
                                              className="w-3.5 h-3.5 text-cyan-400 stroke-[3.5]"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </motion.svg>
                                          )}
                                        </AnimatePresence>
                                      </motion.div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>

            {/* School-Parent-Teacher Communication Hub */}
            <div className="grid grid-cols-1 gap-6">
              {/* Card 1: Rehberlik & Görüşme Notları */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-400" />
                      <span>Rehberlik & Görüşme Değerlendirme Notları</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Rehberlik servisi ve danışman öğretmenlerin öğrenci takip değerlendirmeleri.</p>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
                    🏠 Rehber Panel
                  </span>
                </div>

                {/* Guidance Add note form (Only Counselor/Admin can add notes) */}
                {(user.rol === 'admin' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      placeholder="Görüşme detaylarını, gelişim notlarını veya ödev uyarılarını buraya detaylıca yazın..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition shadow shadow-blue-500/20 cursor-pointer"
                      >
                        <Send size={13} /> Değerlendirme Notu Ekle
                      </button>
                    </div>
                  </form>
                )}

                {/* Notes display */}
                {detailData.notlar.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 italic font-semibold">Öğrenciye ait rehberlik veya görüşme kaydı bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {detailData.notlar.map(n => (
                      <div key={n.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-700 transition">
                        <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                          <span className="text-xs font-black text-blue-400">{n.rehber_adi}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold">{n.tarih}</span>
                             {(user.rol === 'admin' || user.rol === 'rehber') && (
                              deleteConfirmNoteId === n.id ? (
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-red-500/30">
                                  <span className="text-[10px] text-red-400 font-bold px-1">Sil?</span>
                                  <button
                                    onClick={() => {
                                      handleDeleteNote(n.id);
                                      setDeleteConfirmNoteId(null);
                                    }}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black rounded cursor-pointer leading-none"
                                  >
                                    Evet
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmNoteId(null)}
                                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black rounded cursor-pointer leading-none"
                                  >
                                    Hayır
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmNoteId(n.id)}
                                  className="text-slate-600 hover:text-red-400 transition ml-1"
                                  title="Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Öğretmenlerin Ders Tavsiyeleri */}
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

                {/* Add Teacher Advice Form (Only Admin, Teacher, Counselor can add) */}
                {(user.rol === 'admin' || user.rol === 'ogretmen' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddTavsiye} className="space-y-3">
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select
                          value={newTavsiyeCourse}
                          onChange={e => setNewTavsiyeCourse(e.target.value)}
                          className="sm:col-span-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full shrink-0 shadow-inner cursor-pointer"
                        >
                          <option value="Matematik">Matematik</option>
                          <option value="Geometri">Geometri</option>
                          <option value="Türkçe">Türkçe</option>
                          <option value="Fizik">Fizik</option>
                          <option value="Kimya">Kimya</option>
                          <option value="Biyoloji">Biyoloji</option>
                          <option value="Tarih">Tarih</option>
                          <option value="Coğrafya">Coğrafya</option>
                          <option value="Felsefe">Felsefe</option>
                          <option value="Rehberlik">Rehberlik</option>
                        </select>
                        <textarea
                          placeholder="Öğrencinin bu dersten eksiklerini kapatması için özel ders tavsiyesi yazın..."
                          value={newTavsiyeText}
                          onChange={e => setNewTavsiyeText(e.target.value)}
                          rows={2}
                          className="sm:col-span-3 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner resize-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shrink-0 cursor-pointer shadow shadow-emerald-500/20"
                        >
                          <Send size={13} /> Ders Tavsiyesi Ekle
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Teacher Advice display */}
                {!(detailData.tavsiyeler && detailData.tavsiyeler.length > 0) ? (
                  <div className="text-center py-10 text-xs text-slate-500 italic font-semibold">Öğrenciye eklenmiş ders çalışma tavsiyesi bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {detailData.tavsiyeler.map(t => (
                      <div key={t.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-700 transition">
                        <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                              {t.ders_adi}
                            </span>
                            <span className="text-xs font-black text-slate-300">{t.ogretmen_adi}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {t.tarih ? new Date(t.tarih).toLocaleDateString('tr-TR') : ''}
                            </span>
                            {(user.rol === 'admin' || user.id === t.ogretmen_id) && (
                              deleteConfirmTavsiyeId === t.id ? (
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-red-500/30">
                                  <button
                                    onClick={() => {
                                      handleDeleteTavsiye(t.id);
                                      setDeleteConfirmTavsiyeId(null);
                                    }}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black rounded cursor-pointer leading-none"
                                  >
                                    Sil
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmTavsiyeId(null)}
                                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black rounded cursor-pointer leading-none"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmTavsiyeId(t.id)}
                                  className="text-slate-600 hover:text-red-400 transition"
                                  title="Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{t.tavsiye_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Veli Geri Bildirim Notları */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-2">
                      <Home size={14} className="text-purple-400" />
                      <span>Velilerden Geri Bildirim ve Ev Takip Notları</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Velilerimizin evdeki çalışma disiplini, motivasyon ve gözlem bildirimleri.</p>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                    🏠 Ev Geri Bildirim
                  </span>
                </div>

                {/* Veli Note form (Only Admin or Veli can add) */}
                {(user.rol === 'admin' || user.rol === 'veli') && (
                  <form onSubmit={handleAddVeliNote} className="space-y-3">
                    <textarea
                      placeholder="Öğrencinin evdeki çalışma durumunu, günlük odak düzenini veya sormak istediklerinizi buraya yazın..."
                      value={newVeliNote}
                      onChange={e => setNewVeliNote(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow shadow-purple-500/20 cursor-pointer"
                      >
                        <Send size={13} /> Geri Bildirim Gönder
                      </button>
                    </div>
                  </form>
                )}

                {/* Veli Geri Bildirim display */}
                {!(detailData.veli_notlari && detailData.veli_notlari.length > 0) ? (
                  <div className="text-center py-10 text-xs text-slate-500 italic font-semibold">Veliden henüz bir geri bildirim notu gelmemiş.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {detailData.veli_notlari.map(n => (
                      <div key={n.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-700 transition">
                        <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                          <span className="text-xs font-black text-purple-400">{n.veli_adi}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {n.tarih ? new Date(n.tarih).toLocaleDateString('tr-TR') : ''}
                            </span>
                            {(user.rol === 'admin' || user.rol === 'rehber') && (
                              <button
                                onClick={() => handleDeleteVeliNot(n.id)}
                                className="text-slate-600 hover:text-red-400 transition"
                                title="Geri Bildirimi Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
