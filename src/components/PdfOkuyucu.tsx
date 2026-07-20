import React, { useState, useEffect } from 'react';
import { User, Sinif, Ogrenci } from '../types';
import { UploadCloud, FileText, Sparkles, CheckCircle, AlertCircle, Trash2, Save, HelpCircle, Edit } from 'lucide-react';

interface PdfOkuyucuProps {
  user: User;
  token: string;
}

interface ParsedRow {
  ogrenci_id: number | null;
  eslesen_ogrenci_adi: string;
  eslesme_orani: number;
  okunan_isim: string;
  turkce_net: number;
  sosyal_net: number;
  matematik_net: number;
  fen_net: number;
  toplam_net: number;
  puan: number;
}

export default function PdfOkuyucu({ user, token }: PdfOkuyucuProps) {
  // Setup fields
  const [examName, setExamName] = useState('3D Türkiye Geneli TYT-2');
  const [examType, setExamType] = useState<'TYT' | 'AYT'>('TYT');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [publisher, setPublisher] = useState('3D');
  const [scanMode, setScanMode] = useState<'table' | 'ocr'>('table');

  // File loading state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  // Scanned lists
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [allStudents, setAllStudents] = useState<Ogrenci[]>([]);

  // Load all students for the review selector
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/ogrenci?kurum_id=${user.kurum_id}&aktif=true`, {
          headers: { 'Authorization': token }
        });
        if (res.ok) {
          setAllStudents(await res.json());
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, [user.kurum_id, token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setError('');
    setSuccess('');
    
    // Check file formats
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Hatalı dosya formatı! Sadece PDF dosyaları veya deneme sonuç resimleri (JPEG/PNG) yüklenebilir.");
      return;
    }

    setFile(selectedFile);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFileBase64(base64String);
    };
    reader.onerror = () => {
      setError("Dosya okuma hatası oluştu.");
    };
    reader.readAsDataURL(selectedFile);
  };

  // Perform AI parsing
  const handleStartParsing = async () => {
    if (!fileBase64 || !file) {
      setError("Lütfen önce analiz edilecek PDF veya resim dosyasını yükleyin.");
      return;
    }

    setLoading(true);
    setParsedRows([]);
    setError('');
    setWarning('');

    const steps = [
      "Dosya sunucuya gönderiliyor...",
      "Gemini 3.5 Flash yapay zeka modeli başlatılıyor...",
      "Sınav tablosu sütunları ayrıştırılıyor...",
      "Türkçe, Sosyal, Matematik ve Fen netleri matematiksel olarak denetleniyor...",
      "İsimler fuzzy-match string benzerlik algoritmasıyla eşleştiriliyor..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx += 1;
        setLoadingStep(steps[stepIdx]);
      }
    }, 2200);

    try {
      const res = await fetch('/api/pdf-parser/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          fileData: fileBase64,
          fileName: file.name,
          mimeType: file.type,
          publisher,
          examType,
          examDate,
          kurum_id: user.kurum_id
        })
      });

      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        setParsedRows(data.results);
        if (data.warning) {
          setWarning(data.warning);
        }
        setSuccess(`Tebrikler! Dosya başarıyla okundu. Toplam ${data.extractedCount} adet öğrencinin sınav sonuçları çıkarıldı. Lütfen aşağıdaki eşleştirmeleri ve ders netlerini kontrol edip onaylayın.`);
      } else {
        const errData = await res.json();
        setError(errData.error || "Yapay zeka analiz hatası oluştu. Lütfen dosya kalitesini kontrol edip tekrar deneyin.");
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError("Bağlantı hatası oluştu. Büyük dosyalar için işlem süresi uzayabilir.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Inline row editor
  const handleUpdateRow = (index: number, key: keyof ParsedRow, value: any) => {
    const updated = [...parsedRows];
    updated[index] = {
      ...updated[index],
      [key]: value
    };

    // Auto-calculate Total Net if component courses change
    if (['turkce_net', 'sosyal_net', 'matematik_net', 'fen_net'].includes(key as string)) {
      const t = parseFloat(updated[index].turkce_net as any) || 0;
      const s = parseFloat(updated[index].sosyal_net as any) || 0;
      const m = parseFloat(updated[index].matematik_net as any) || 0;
      const f = parseFloat(updated[index].fen_net as any) || 0;
      updated[index].toplam_net = parseFloat((t + s + m + f).toFixed(2));
    }

    setParsedRows(updated);
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows(parsedRows.filter((_, i) => i !== index));
  };

  // Matcher selector
  const handleSelectStudentMatch = (index: number, studentId: string) => {
    const updated = [...parsedRows];
    if (studentId === "") {
      updated[index].ogrenci_id = null;
      updated[index].eslesen_ogrenci_adi = "Eşleşmedi (Yeni Öğrenci Olarak Eklenecek)";
      updated[index].eslesme_orani = 0;
    } else {
      const sid = parseInt(studentId);
      const matchedSt = allStudents.find(s => s.id === sid);
      updated[index].ogrenci_id = sid;
      updated[index].eslesen_ogrenci_adi = matchedSt ? matchedSt.ad_soyad : "";
      updated[index].eslesme_orani = 100;
    }
    setParsedRows(updated);
  };

  // Save parsed results to DB
  const handleSaveResults = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/pdf/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          examName,
          examType,
          examDate,
          results: parsedRows,
          kurum_id: user.kurum_id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`Başarılı! ${data.savedCount} adet öğrencinin sınav sonuçları ve yeni oluşturulan öğrenci kayıtları başarıyla kuruma kaydedildi.`);
        setParsedRows([]);
        setFile(null);
        setFileBase64('');
      } else {
        const errData = await res.json();
        setError(errData.error || "Sonuçlar kaydedilirken hata oluştu.");
      }
    } catch (err) {
      setError("Kayıt işlemi sırasında ağ bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="text-blue-500 animate-pulse" size={16} />
          Deneme Sınav Tanımları ve Analiz Şablonu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınav / Yayın Adı *</label>
            <input
              type="text"
              value={examName}
              onChange={e => setExamName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınav Türü *</label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="TYT">TYT Formatı</option>
              <option value="AYT">AYT Formatı</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Sınav Tarihi *</label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Yayınevi Şablonu *</label>
            <select
              value={publisher}
              onChange={e => setPublisher(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="3D">3D Yayınları</option>
              <option value="Bilgi Sarmal">Bilgi Sarmal</option>
              <option value="Özdebir">Özdebir</option>
              <option value="Limit">Limit</option>
              <option value="Apotemi">Apotemi</option>
              <option value="Genel">Genel Şablon (Otomatik)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Taramalı Mod *</label>
            <select
              value={scanMode}
              onChange={e => setScanMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="table">PDF Dijital Tablo</option>
              <option value="ocr">OCR / El Yazısı Taraması</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      {parsedRows.length === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition flex flex-col items-center justify-center ${
            dragActive
              ? "border-blue-500 bg-blue-500/5"
              : "border-slate-800 bg-slate-900/10 hover:bg-slate-900/25"
          }`}
        >
          <input
            type="file"
            id="pdf-upload-input"
            accept=".pdf, image/jpeg, image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="text-slate-500 mb-4 animate-bounce" size={44} />

          {file ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full inline-block">
                {file.name}
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">Dosya boyutu: {Math.round(file.size / 1024)} KB</p>
              <div className="pt-3">
                <button
                  onClick={handleStartParsing}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 transition"
                >
                  Yapay Zeka Analizini Başlat
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">Deneme sınav listesini veya resmini buraya sürükleyin</p>
              <p className="text-[10px] text-slate-500 font-medium">veya dosya seçmek için tıklayın</p>
              <label
                htmlFor="pdf-upload-input"
                className="mt-4 inline-block bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3.5 py-1.8 rounded-lg text-xs cursor-pointer transition border border-slate-750"
              >
                Dosya Seçin
              </label>
            </div>
          )}
        </div>
      )}

      {/* Loading Progress messages */}
      {loading && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs font-semibold text-slate-300 animate-pulse">{loadingStep || "Analiz ediliyor..."}</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Gelişmiş yapay zeka (Gemini 3.5 Flash) modelimiz tablo koordinatlarını çıkartıp,<br />
            virgüllü net hesaplamalarını doğrulamaktadır. Lütfen pencereyi kapatmayın.
          </p>
        </div>
      )}

      {/* Alert states */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <p className="font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      {warning && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <p className="font-semibold leading-relaxed">{warning}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
          <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
          <p className="font-semibold leading-relaxed">{success}</p>
        </div>
      )}

      {/* Interactive Matcher & Review Matrix Grid */}
      {parsedRows.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={14} />
              AI Sınav Değerlendirme ve Eşleştirme Paneli
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">{parsedRows.length} Öğrenci Okundu</span>
          </div>

          <div className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-3 pl-4">Okunan İsim (Belgede)</th>
                    <th className="p-3">Sistem Eşleşmesi (Fuzzy Match)</th>
                    <th className="p-3 text-center">Türkçe Net</th>
                    <th className="p-3 text-center">Sosyal Net</th>
                    <th className="p-3 text-center">Matematik Net</th>
                    <th className="p-3 text-center">Fen Net</th>
                    <th className="p-3 text-center">Toplam Net</th>
                    <th className="p-3 text-center">Puan</th>
                    <th className="p-3 text-right pr-4">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20">
                      <td className="p-3 pl-4 font-bold text-slate-100">{row.okunan_isim}</td>
                      <td className="p-3">
                        <div className="space-y-1 max-w-xs">
                          <select
                            value={row.ogrenci_id || ""}
                            onChange={e => handleSelectStudentMatch(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                          >
                            <option value="">-- Yeni Öğrenci Olarak Oluştur --</option>
                            {allStudents.map(s => (
                              <option key={s.id} value={s.id}>{s.ad_soyad} ({s.sinif_adi})</option>
                            ))}
                          </select>
                          {row.ogrenci_id ? (
                            <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                              Eşleşme Oranı: %{row.eslesme_orani}
                            </span>
                          ) : (
                            <span className="text-[9px] text-yellow-500 bg-yellow-500/5 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                              Yeni Kayıt Oluşturulacak
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          value={row.turkce_net}
                          onChange={e => handleUpdateRow(idx, 'turkce_net', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.8 text-center text-xs font-mono text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          value={row.sosyal_net}
                          onChange={e => handleUpdateRow(idx, 'sosyal_net', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.8 text-center text-xs font-mono text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          value={row.matematik_net}
                          onChange={e => handleUpdateRow(idx, 'matematik_net', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.8 text-center text-xs font-mono text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          value={row.fen_net}
                          onChange={e => handleUpdateRow(idx, 'fen_net', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.8 text-center text-xs font-mono text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-blue-400">{row.toplam_net}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.1"
                          value={row.puan}
                          onChange={e => handleUpdateRow(idx, 'puan', parseFloat(e.target.value) || 100)}
                          className="w-20 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.8 text-center text-xs font-mono text-slate-100 font-bold"
                        />
                      </td>
                      <td className="p-3 text-right pr-4">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="text-slate-500 hover:text-red-400 transition"
                          title="Listeden Çıkar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              onClick={() => setParsedRows([])}
              className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              Listeyi Temizle
            </button>
            <button
              onClick={handleSaveResults}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow shadow-blue-500/10"
            >
              <Save size={13} /> Sonuçları Kuruma Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
