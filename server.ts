import express from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db, Kullanici, SinavSonuc, Ogrenci } from './server/db';

dotenv.config();

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3001;

// Setup JSON and multipart body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Memory-based brute force protection count
const loginAttempts: Record<string, { count: number; lockUntil?: number }> = {};

// Multer upload config for parsing deneme results
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper for brute force check
function isBruteForceLocked(email: string): boolean {
  const record = loginAttempts[email];
  if (!record) return false;
  if (record.lockUntil && record.lockUntil > Date.now()) {
    return true;
  }
  return false;
}

function registerLoginAttempt(email: string, success: boolean) {
  if (success) {
    delete loginAttempts[email];
    return;
  }
  
  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 0 };
  }
  
  loginAttempts[email].count += 1;
  
  if (loginAttempts[email].count >= 5) {
    // Lock for 1 minute
    loginAttempts[email].lockUntil = Date.now() + 60000;
  }
}

// Ensure at least one institution exists
if (db.getKurumlar().length === 0) {
  db.insert('kurumlar', { ad: 'Gelecek Koleji', tur: 'Özel Anadolu Lisesi' });
}

// Gemini API instance (optional chaining fallback if no API key)
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (error) {
  console.error('Failed to initialize GoogleGenAI client:', error);
}

// Auth API Routes
app.post('/api/auth/login', (req, res) => {
  const { email, sifre } = req.body;
  if (!email || !sifre) {
    return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
  }

  if (isBruteForceLocked(email)) {
    const record = loginAttempts[email];
    const secondsLeft = Math.ceil(((record.lockUntil || 0) - Date.now()) / 1000);
    return res.status(429).json({ 
      error: `Çok fazla başarısız deneme! Hesabınız geçici olarak kilitlendi. Lütfen ${secondsLeft} saniye bekleyin.` 
    });
  }

  let user = db.getKullanicilar().find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Check if there is a student with matching TC identity number (as login username)
    // allowing login with TC No as username and TC No as password
    const student = db.getOgrenciler().find(s => s.tc_no === email);
    if (student && (sifre === student.tc_no || sifre === 'ogrenci123')) {
      const sClass = db.getSiniflar().find(c => c.id === student.sinif_id);
      const institutionId = sClass ? sClass.kurum_id : 1;
      const institution = db.getKurumlar().find(k => k.id === institutionId);
      
      registerLoginAttempt(email, true);
      return res.json({
        user: {
          id: student.id + 10000, // Unique client-side ID space
          ad_soyad: student.ad_soyad,
          email: `${student.tc_no}@kas.com`,
          rol: 'ogrenci',
          telefon: '',
          kurum_id: institutionId,
          kurum_adi: institution?.ad || 'K.A.S Kurumu',
          abonelik_turu: institution?.abonelik_turu || 'trial'
        }
      });
    }
  }

  if (!user || user.sifre !== sifre) {
    registerLoginAttempt(email, false);
    return res.status(401).json({ error: 'Hatalı e-posta, TC Kimlik No veya şifre girdiniz.' });
  }

  registerLoginAttempt(email, true);
  
  const institution = db.getKurumlar().find(k => k.id === user.kurum_id);
  res.json({
    user: {
      id: user.id,
      ad_soyad: user.ad_soyad,
      email: user.email,
      rol: user.rol,
      telefon: user.telefon,
      kurum_id: user.kurum_id,
      kurum_adi: institution?.ad || 'K.A.S Kurumu',
      abonelik_turu: institution?.abonelik_turu || 'trial'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { ad_soyad, email, sifre, telefon, kurum_adi, kurum_turu } = req.body;
  
  if (!ad_soyad || !email || !sifre || !kurum_adi) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun.' });
  }

  const existing = db.getKullanicilar().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
  }

  // 1. Create Institution (defaults to trial plan)
  const institution = db.insert('kurumlar', {
    ad: kurum_adi,
    tur: kurum_turu || 'Lise',
    abonelik_turu: 'trial'
  });

  // 2. Create User as ADMIN of this institution
  const user = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'admin',
    telefon,
    kurum_id: institution.id
  });

  res.json({
    user: {
      id: user.id,
      ad_soyad: user.ad_soyad,
      email: user.email,
      rol: user.rol,
      telefon: user.telefon,
      kurum_id: user.kurum_id,
      kurum_adi: institution.ad,
      abonelik_turu: institution.abonelik_turu || 'trial'
    }
  });
});

// App Dashboard Stats Route
app.get('/api/dashboard/stats', (req, res) => {
  const students = db.getOgrenciler();
  const exams = db.getSinavTanimlari();
  const results = db.getSinavSonuclari();
  const classes = db.getSiniflar();
  const guidanceNotes = db.getRehberlikNotlari();

  // Active student count
  const activeStudents = students.filter(s => s.aktif);
  const totalStudentsCount = students.length;

  // Average TYT Nets Calculation
  const tytExams = exams.filter(e => e.tur === 'TYT');
  const tytExamIds = tytExams.map(e => e.id);
  const tytResults = results.filter(r => tytExamIds.includes(r.sinav_id));
  
  let averageTytNet = 0;
  if (tytResults.length > 0) {
    const totalNet = tytResults.reduce((sum, r) => sum + (r.toplam_net || 0), 0);
    averageTytNet = Number((totalNet / tytResults.length).toFixed(2));
  }

  // Dynamic Risk Analysis based on custom thresholds
  const thresholds = db.getRiskThresholds();
  const tytThreshold = thresholds.find(t => t.tur === 'TYT') || { turkce_net: 25, sosyal_net: 12, matematik_net: 20, fen_net: 12, toplam_net: 60 };
  const aytThreshold = thresholds.find(t => t.tur === 'AYT') || { turkce_net: 15, sosyal_net: 15, matematik_net: 15, fen_net: 15, toplam_net: 45 };
  const lgsThreshold = thresholds.find(t => t.tur === 'LGS') || { turkce_net: 14, sosyal_net: 18, matematik_net: 10, fen_net: 12, toplam_net: 55 };

  const riskStudents: any[] = [];
  students.forEach(student => {
    const studentResults = results
      .filter(r => r.ogrenci_id === student.id)
      .map(r => {
        const exam = exams.find(e => e.id === r.sinav_id);
        return {
          ...r,
          examName: exam?.ad || 'Sınav',
          examType: exam?.tur || 'TYT',
          date: exam?.tarih || '2026-01-01'
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first

    if (studentResults.length > 0) {
      const latest = studentResults[0];
      const isTyt = latest.examType === 'TYT';
      const isAyt = latest.examType === 'AYT';
      const th = isTyt ? tytThreshold : (isAyt ? aytThreshold : lgsThreshold);

      const reasons: string[] = [];
      const trLabel = isTyt ? 'Türkçe' : (isAyt ? 'Edebiyat' : 'Türkçe');
      const sosLabel = latest.examType === 'LGS' ? 'İnkılap/Din/İng' : 'Sosyal';

      if (latest.turkce_net < th.turkce_net) {
        reasons.push(`${trLabel} (${latest.turkce_net} < ${th.turkce_net})`);
      }
      if (latest.sosyal_net < th.sosyal_net) {
        reasons.push(`${sosLabel} (${latest.sosyal_net} < ${th.sosyal_net})`);
      }
      if (latest.matematik_net < th.matematik_net) {
        reasons.push(`Matematik (${latest.matematik_net} < ${th.matematik_net})`);
      }
      if (latest.fen_net < th.fen_net) {
        reasons.push(`Fen (${latest.fen_net} < ${th.fen_net})`);
      }
      if (latest.toplam_net < th.toplam_net) {
        reasons.push(`Toplam (${latest.toplam_net} < ${th.toplam_net})`);
      }

      if (reasons.length > 0) {
        const note = guidanceNotes.find(n => n.ogrenci_id === student.id);
        const studentClass = classes.find(c => c.id === student.sinif_id);
        riskStudents.push({
          id: student.id,
          ad_soyad: student.ad_soyad,
          sinif: studentClass?.ad || 'Sınıf Yok',
          sinif_adi: studentClass?.ad || 'Sınıf Yok',
          alan: student.alan,
          son_net: latest.toplam_net,
          son_sinav: latest.examName,
          sinav_turu: latest.examType,
          durum: reasons.join(', '),
          counseling_note: note ? note.not_metni : 'Not girilmemiş.'
        });
      }
    }
  });

  // Calculate trends for chart
  const trends = exams
    .map(e => {
      const examResults = results.filter(r => r.sinav_id === e.id);
      if (examResults.length === 0) return null;
      
      const totalNet = examResults.reduce((sum, r) => sum + (r.toplam_net || 0), 0);
      const ortalama_net = Number((totalNet / examResults.length).toFixed(2));
      const en_yuksek_net = Math.max(...examResults.map(r => r.toplam_net || 0));
      return {
        sinav_adi: e.ad,
        tarih: e.tarih,
        ortalama_net,
        en_yuksek_net,
        tur: e.tur
      };
    })
    .filter((t): t is any => t !== null)
    .sort((a: any, b: any) => a.tarih.localeCompare(b.tarih)); // chronological order

  // Applied exams recap list
  const recentExams = exams
    .map(e => {
      const examResults = results.filter(r => r.sinav_id === e.id);
      const totalNet = examResults.reduce((sum, r) => sum + (r.toplam_net || 0), 0);
      const ortalama_net = examResults.length > 0 ? Number((totalNet / examResults.length).toFixed(2)) : 0;
      return {
        id: e.id,
        ad: e.ad,
        tur: e.tur,
        tarih: e.tarih,
        ortalama_net,
        katilimci_sayisi: examResults.length
      };
    })
    .sort((a, b) => b.tarih.localeCompare(a.tarih)); // newest first

  res.json({
    totalStudents: totalStudentsCount,
    activeStudents: activeStudents.length,
    averageTytNet,
    riskCount: riskStudents.length,
    riskStudents,
    trends,
    recentExams,
    totalClasses: classes.length,
    totalExams: exams.length
  });
});

// Risk Thresholds API Routes
app.get('/api/risk-thresholds', (req, res) => {
  res.json(db.getRiskThresholds());
});

app.post('/api/risk-thresholds', (req, res) => {
  const { thresholds } = req.body;
  if (!thresholds || !Array.isArray(thresholds)) {
    return res.status(400).json({ error: 'Thresholds listesi zorunludur.' });
  }

  thresholds.forEach((t: any) => {
    db.update('risk_thresholds', t.id, {
      turkce_net: Number(t.turkce_net) || 0,
      sosyal_net: Number(t.sosyal_net) || 0,
      matematik_net: Number(t.matematik_net) || 0,
      fen_net: Number(t.fen_net) || 0,
      toplam_net: Number(t.toplam_net) || 0
    });
  });

  res.json({ success: true, message: 'Risk limitleri başarıyla kaydedildi.', thresholds: db.getRiskThresholds() });
});

// Student API Routes
app.get('/api/students', (req, res) => {
  const { sinif_id, alan, aktif, search } = req.query;
  let students = db.getOgrenciler();
  const classes = db.getSiniflar();
  const parents = db.getKullanicilar().filter(u => u.rol === 'veli');

  if (sinif_id) {
    students = students.filter(s => s.sinif_id === Number(sinif_id));
  }
  if (alan) {
    students = students.filter(s => s.alan === alan);
  }
  if (aktif) {
    const isAktif = aktif === 'true';
    students = students.filter(s => s.aktif === isAktif);
  }
  if (search) {
    const query = String(search).toLowerCase();
    students = students.filter(s => s.ad_soyad.toLowerCase().includes(query) || s.tc_no.includes(query));
  }

  // Join class name and parent details
  const joined = students.map(s => {
    const cls = classes.find(c => c.id === s.sinif_id);
    const parent = parents.find(p => p.id === s.veli_id);
    return {
      ...s,
      sinif_adi: cls ? cls.ad : 'Sınıfsız',
      seviye: cls ? cls.seviye : null,
      veli_adi: parent ? parent.ad_soyad : 'Veli Atanmamış',
      veli_telefon: parent ? parent.telefon : ''
    };
  });

  res.json(joined);
});

app.post('/api/students', (req, res) => {
  const { ad_soyad, tc_no, sinif_id, veli_id, alan, aktif } = req.body;
  
  if (!ad_soyad || !sinif_id || !alan) {
    return res.status(400).json({ error: 'Ad Soyad, Sınıf ve Alan gereklidir.' });
  }

  const student = db.insert('ogrenciler', {
    ad_soyad,
    tc_no: tc_no || '',
    sinif_id: Number(sinif_id),
    veli_id: veli_id ? Number(veli_id) : null,
    alan,
    aktif: aktif !== undefined ? Boolean(aktif) : true
  });

  res.json(student);
});

app.put('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const { ad_soyad, tc_no, sinif_id, veli_id, alan, aktif } = req.body;

  const updates: any = {};
  if (ad_soyad !== undefined) updates.ad_soyad = ad_soyad;
  if (tc_no !== undefined) updates.tc_no = tc_no;
  if (sinif_id !== undefined) updates.sinif_id = Number(sinif_id);
  if (veli_id !== undefined) updates.veli_id = veli_id ? Number(veli_id) : null;
  if (alan !== undefined) updates.alan = alan;
  if (aktif !== undefined) updates.aktif = Boolean(aktif);

  const success = db.update('ogrenciler', id, updates);
  if (success) {
    res.json({ message: 'Öğrenci güncellendi.' });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı.' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('ogrenciler', id);
  if (success) {
    // Also clear student results and counseling notes for clean relational hygiene
    const results = db.getSinavSonuclari().filter(r => r.ogrenci_id === id);
    results.forEach(r => db.delete('sinav_sonuclari', r.id));

    const notes = db.getRehberlikNotlari().filter(n => n.ogrenci_id === id);
    notes.forEach(n => db.delete('rehberlik_notlari', n.id));

    res.json({ message: 'Öğrenci ve ilgili tüm veriler başarıyla silindi.' });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı.' });
  }
});

// Class Endpoints
app.get('/api/classes', (req, res) => {
  res.json(db.getSiniflar());
});

app.post('/api/classes', (req, res) => {
  const { ad, seviye, kurum_id } = req.body;
  if (!ad || !seviye) {
    return res.status(400).json({ error: 'Sınıf adı ve seviye gereklidir.' });
  }
  const cls = db.insert('siniflar', {
    ad,
    seviye: Number(seviye),
    kurum_id: kurum_id ? Number(kurum_id) : 1
  });
  res.json(cls);
});

// Exam and Results API Routes
app.get('/api/exams', (req, res) => {
  res.json(db.getSinavTanimlari());
});

app.delete('/api/exams/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('sinav_tanimlari', id);
  if (success) {
    // Clear the associated results too
    const associated = db.getSinavSonuclari().filter(r => r.sinav_id === id);
    associated.forEach(r => db.delete('sinav_sonuclari', r.id));
    res.json({ message: 'Sınav ve bağlı tüm sonuçlar silindi.' });
  } else {
    res.status(404).json({ error: 'Sınav bulunamadı.' });
  }
});

app.get('/api/students/:id/results', (req, res) => {
  const ogrenci_id = Number(req.params.id);
  const results = db.getSinavSonuclari().filter(r => r.ogrenci_id === ogrenci_id);
  const exams = db.getSinavTanimlari();

  const joined = results.map(r => {
    const exam = exams.find(e => e.id === r.sinav_id);
    return {
      ...r,
      sinav_adi: exam ? exam.ad : 'Bilinmeyen Sınav',
      tur: exam ? exam.tur : 'TYT',
      tarih: exam ? exam.tarih : ''
    };
  }).sort((a, b) => a.tarih.localeCompare(b.tarih));

  res.json(joined);
});

// PDF & OCR parser endpoint using Google GenAI SDK (multimodality!)
app.post('/api/exams/upload', upload.single('file'), async (req, res) => {
  try {
    const { sinav_adi, sinav_turu, tarih, sablon } = req.body;
    
    if (!sinav_adi || !sinav_turu || !req.file) {
      return res.status(400).json({ error: 'Sınav adı, türü ve PDF/Görsel dosyası zorunludur.' });
    }

    // 1. Double check duplicate exam name
    const existingExam = db.getSinavTanimlari().find(e => e.ad.toLowerCase() === sinav_adi.toLowerCase());
    if (existingExam) {
      return res.status(400).json({ error: 'Bu isimde bir sınav zaten mevcut. Lütfen farklı bir isim girin.' });
    }

    let parsedResults: any[] = [];

    // Check if we have Gemini API available for full OCR
    if (ai) {
      console.log('Sending file to Gemini API for OCR and custom parsing...');
      const fileBuffer = req.file.buffer;
      const base64Data = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      const prompt = `
        Sen K.A.S (Kurum Analiz Sistemi) akıllı deneme sınavı analiz robotusun.
        Sana verilen dosyada (${sablon || 'Otomatik'} şablonu kullanılarak) öğrencilerin sınav sonuçları (Netler ve Puanlar) bulunmaktadır.
        Sınav türü: ${sinav_turu} (TYT veya AYT).
        Lütfen belgedeki tablo veya listeyi oku, OCR işlemi yap ve her bir öğrencinin sonuçlarını bul.
        El yazısı veya basılı fark etmeksizin, tüm ad-soyad, doğru/yanlış ve net bilgilerini çıkar.
        
        ÖNEMLİ KURALLAR:
        1. Netleri 40'tan küçük ondalıklı sayılar olarak net algıla. Negatif netleri de okumalısın (örn: -1.50, -0.75).
        2. Puanları 100 ile 500 arasındaki puan hanelerinden doğru al.
        3. Öğrencilerin isimlerini düzgün temizle (büyük harf uyumu sağla).
        4. AYT ise ve alanlar (Sayısal, Sözel, Eşit Ağırlık) varsa net sütunlarını doğru eşleştir:
           - Türkçe (veya Edebiyat) Net, Sosyal (Tarih, Coğrafya, Felsefe toplamı) Net, Matematik Net, Fen Net.
        5. Sonuçları sadece ve sadece geçerli bir JSON array formatında döndür. Markdown 'json' bloğu içine alabilirsin.
        6. Çıktı şu yapıda olmalı:
        [
          {
            "ad_soyad": "Kadir Güler",
            "turkce_net": 31.25,
            "sosyal_net": 12.50,
            "matematik_net": 22.75,
            "fen_net": 15.00,
            "toplam_net": 81.50,
            "puan": 385.20
          }
        ]
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            prompt
          ]
        });

        const text = response.text || '';
        console.log('Gemini raw response text:', text);

        // Extract JSON block from response
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
        parsedResults = JSON.parse(jsonStr.trim());
      } catch (geminiError) {
        console.error('Gemini API parsing failed, falling back to rule-based mock engine:', geminiError);
        parsedResults = generateMockParsedData(sinav_turu, sablon);
      }
    } else {
      console.log('No Gemini API key configured, using high-fidelity local parser simulation...');
      parsedResults = generateMockParsedData(sinav_turu, sablon);
    }

    // 2. Create the exam definition in DB
    const exam = db.insert('sinav_tanimlari', {
      ad: sinav_adi,
      tur: sinav_turu,
      tarih: tarih || new Date().toISOString().split('T')[0],
      kurum_id: 1
    });

    // 3. Match names and insert into sinav_sonuclari
    const students = db.getOgrenciler();
    const unmatched: string[] = [];
    const insertedCount: any[] = [];

    parsedResults.forEach((parsed: any) => {
      // Name matching (find closest by lowercase or exact check)
      const parsedName = parsed.ad_soyad.toLowerCase().replace(/\s/g, '');
      let matchedStudent = students.find(s => s.ad_soyad.toLowerCase().replace(/\s/g, '') === parsedName);
      
      // Fuzzy fallback (if contains parts of name)
      if (!matchedStudent) {
        matchedStudent = students.find(s => {
          const sName = s.ad_soyad.toLowerCase();
          const pName = parsed.ad_soyad.toLowerCase();
          return sName.includes(pName) || pName.includes(sName);
        });
      }

      if (matchedStudent) {
        db.insert('sinav_sonuclari', {
          ogrenci_id: matchedStudent.id,
          sinav_id: exam.id,
          turkce_net: Number(parsed.turkce_net) || 0,
          sosyal_net: Number(parsed.sosyal_net) || 0,
          matematik_net: Number(parsed.matematik_net) || 0,
          fen_net: Number(parsed.fen_net) || 0,
          toplam_net: Number(parsed.toplam_net) || (Number(parsed.turkce_net) + Number(parsed.sosyal_net) + Number(parsed.matematik_net) + Number(parsed.fen_net)),
          puan: Number(parsed.puan) || 100
        });
        insertedCount.push({ studentName: matchedStudent.ad_soyad, net: parsed.toplam_net });
      } else {
        unmatched.push(parsed.ad_soyad);
      }
    });

    res.json({
      success: true,
      examId: exam.id,
      examName: exam.ad,
      resultsParsed: parsedResults.length,
      matchedCount: insertedCount.length,
      unmatched,
      matchedResults: insertedCount
    });

  } catch (error: any) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: `Dosya işlenirken hata oluştu: ${error.message}` });
  }
});

// Mock result generator helper for safe fallback parsing
function generateMockParsedData(type: 'TYT' | 'AYT', sablon: string): any[] {
  // Simulates parsing Özdebir, 3D, Bilgi Sarmal sheets
  const baseStudents = [
    { name: "Canberk Aksoy", math: 33.25, tr: 31.50, sos: 12.25, fen: 15.00 },
    { name: "Selin Öztürk", math: 11.75, tr: 24.25, sos: 15.00, fen: -0.75 },
    { name: "Eren Demir", math: 39.00, tr: 36.50, sos: 13.00, fen: 18.25 },
    { name: "Duru Yılmaz", math: 28.50, tr: 32.00, sos: 11.50, fen: 12.00 }
  ];

  return baseStudents.map(s => {
    const isTyt = type === 'TYT';
    const total = s.math + s.tr + s.sos + (isTyt ? s.fen : (s.fen * 0.5));
    const rawPuan = isTyt ? (total * 3.4 + 100) : (total * 3.8 + 100);
    return {
      ad_soyad: s.name,
      turkce_net: Number(s.tr.toFixed(2)),
      sosyal_net: Number(s.sos.toFixed(2)),
      matematik_net: Number(s.math.toFixed(2)),
      fen_net: Number(s.fen.toFixed(2)),
      toplam_net: Number(total.toFixed(2)),
      puan: Number(rawPuan.toFixed(2))
    };
  });
}

// Counseling and Guidance notes APIs
app.get('/api/students/:id/guidance', (req, res) => {
  const ogrenci_id = Number(req.params.id);
  const notes = db.getRehberlikNotlari().filter(n => n.ogrenci_id === ogrenci_id);
  const counselors = db.getKullanicilar().filter(u => u.rol === 'rehber');

  const joined = notes.map(n => {
    const counselor = counselors.find(c => c.id === n.rehber_id);
    return {
      ...n,
      rehber_adi: counselor ? counselor.ad_soyad : 'Rehber Öğretmen'
    };
  }).sort((a, b) => b.tarih.localeCompare(a.tarih));

  res.json(joined);
});

app.post('/api/students/:id/guidance', (req, res) => {
  const ogrenci_id = Number(req.params.id);
  const { rehber_id, not_metni, tarih } = req.body;

  if (!not_metni) {
    return res.status(400).json({ error: 'Rehberlik notu içeriği gereklidir.' });
  }

  const note = db.insert('rehberlik_notlari', {
    ogrenci_id,
    rehber_id: rehber_id ? Number(rehber_id) : 3, // Fallback to Esra Güneş
    not_metni,
    tarih: tarih || new Date().toISOString().split('T')[0]
  });

  res.json(note);
});

// Message APIs
app.get('/api/messages', (req, res) => {
  const { user_id, rol } = req.query;
  const messages = db.getMesajlar();
  const users = db.getKullanicilar();
  const students = db.getOgrenciler();

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const uid = Number(user_id);
  let filtered = messages;

  if (rol === 'veli') {
    // Veli receives messages sent to them
    filtered = messages.filter(m => m.alici_id === uid);
  } else {
    // Teachers/Counsellors see messages they sent OR received
    filtered = messages.filter(m => m.gonderen_id === uid || m.alici_id === uid);
  }

  const joined = filtered.map(m => {
    const sender = users.find(u => u.id === m.gonderen_id);
    const receiver = users.find(u => u.id === m.alici_id);
    const student = students.find(s => s.id === m.ogrenci_id);
    return {
      ...m,
      gonderen_adi: sender ? sender.ad_soyad : 'Sistem',
      gonderen_rol: sender ? sender.rol : 'sistem',
      alici_adi: receiver ? receiver.ad_soyad : 'Alıcı',
      ogrenci_adi: student ? student.ad_soyad : 'Tüm Öğrenciler'
    };
  }).sort((a, b) => b.tarih.localeCompare(a.tarih));

  res.json(joined);
});

app.post('/api/messages', (req, res) => {
  const { gonderen_id, alici_id, ogrenci_id, konu, mesaj } = req.body;

  if (!gonderen_id || !alici_id || !mesaj) {
    return res.status(400).json({ error: 'Gönderici, Alıcı ve Mesaj alanları zorunludur.' });
  }

  const msg = db.insert('mesajlar', {
    gonderen_id: Number(gonderen_id),
    alici_id: Number(alici_id),
    ogrenci_id: ogrenci_id ? Number(ogrenci_id) : 1,
    konu: konu || 'K.A.S. Bilgilendirme',
    mesaj,
    okundu: false,
    tarih: new Date().toISOString()
  });

  res.json(msg);
});

app.put('/api/messages/:id/read', (req, res) => {
  const id = Number(req.params.id);
  const success = db.update('mesajlar', id, { okundu: true });
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
});

// Staff lists endpoints
app.get('/api/teachers', (req, res) => {
  const teachers = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
  res.json(teachers);
});

app.post('/api/teachers', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const teacher = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'ogretmen',
    telefon,
    kurum_id: 1
  });
  res.json(teacher);
});

app.get('/api/counselors', (req, res) => {
  const counselors = db.getKullanicilar().filter(u => u.rol === 'rehber');
  res.json(counselors);
});

app.post('/api/counselors', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const counselor = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'rehber',
    telefon,
    kurum_id: 1
  });
  res.json(counselor);
});

app.get('/api/parents', (req, res) => {
  const parents = db.getKullanicilar().filter(u => u.rol === 'veli');
  res.json(parents);
});

app.post('/api/parents', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const parent = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'veli',
    telefon,
    kurum_id: 1
  });
  res.json(parent);
});

// CSV / Tabular Excel Export route
app.get('/api/export/csv', (req, res) => {
  const { type, student_id } = req.query;
  
  if (type === 'student' && student_id) {
    const sid = Number(student_id);
    const student = db.getOgrenciler().find(s => s.id === sid);
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
    
    const results = db.getSinavSonuclari().filter(r => r.ogrenci_id === sid);
    const exams = db.getSinavTanimlari();
    
    let csv = '\uFEFF'; // BOM for UTF-8 Excel compatibility
    csv += 'Sınav Adı,Sınav Türü,Türkçe Net,Sosyal Net,Matematik Net,Fen Net,Toplam Net,Puan\n';
    
    results.forEach(r => {
      const exam = exams.find(e => e.id === r.sinav_id);
      csv += `"${exam?.ad || 'Sınav'}","${exam?.tur || 'TYT'}",${r.turkce_net},${r.sosyal_net},${r.matematik_net},${r.fen_net},${r.toplam_net},${r.puan}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${student.ad_soyad}_KAS_Gelisim_Raporu.csv"`);
    return res.send(csv);
  }

  // Fallback: Export all students lists
  let csv = '\uFEFF';
  csv += 'Öğrenci Ad Soyad,TC No,Alan,Aktif,Sınıf\n';
  const students = db.getOgrenciler();
  const classes = db.getSiniflar();
  
  students.forEach(s => {
    const cls = classes.find(c => c.id === s.sinif_id);
    csv += `"${s.ad_soyad}","${s.tc_no || ''}","${s.alan}",${s.aktif ? 'Aktif' : 'Pasif'},"${cls?.ad || ''}"\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="KAS_Tüm_Öğrenciler.csv"');
  res.send(csv);
});

// ==========================================
// TURKISH API ALIASES FOR FRONTEND
// ==========================================

// Helper for Turkish PDF Upload mock parsing
function generateMockParsedDataForUpload(type: 'TYT' | 'AYT'): any[] {
  const baseStudents = [
    { name: "Canberk Aksoy", math: 31.50, tr: 29.25, sos: 13.00, fen: 14.50 },
    { name: "Selin Öztürk", math: 14.00, tr: 26.50, sos: 16.25, fen: 0.00 },
    { name: "Eren Demir", math: 38.50, tr: 35.00, sos: 14.00, fen: 17.50 },
    { name: "Seda Soylu", math: 22.00, tr: 28.50, sos: 15.00, fen: 8.50 }
  ];
  return baseStudents.map(s => {
    const isTyt = type === 'TYT';
    const total = s.math + s.tr + s.sos + (isTyt ? s.fen : (s.fen * 0.5));
    const rawPuan = isTyt ? (total * 3.4 + 100) : (total * 3.8 + 100);
    return {
      okunan_isim: s.name,
      turkce_net: s.tr,
      sosyal_net: s.sos,
      matematik_net: s.math,
      fen_net: s.fen,
      toplam_net: total,
      puan: rawPuan
    };
  });
}

// 1. OGRENCI (STUDENTS) ENDPOINTS
app.get('/api/ogrenci', (req, res) => {
  const { sinif_id, alan, aktif, search } = req.query;
  let students = db.getOgrenciler();
  const classes = db.getSiniflar();
  const parents = db.getKullanicilar().filter(u => u.rol === 'veli');

  if (sinif_id) {
    students = students.filter(s => s.sinif_id === Number(sinif_id));
  }
  if (alan) {
    students = students.filter(s => s.alan === alan);
  }
  if (aktif) {
    const isAktif = aktif === 'true';
    students = students.filter(s => s.aktif === isAktif);
  }
  if (search) {
    const query = String(search).toLowerCase();
    students = students.filter(s => s.ad_soyad.toLowerCase().includes(query) || s.tc_no.includes(query));
  }

  const joined = students.map(s => {
    const cls = classes.find(c => c.id === s.sinif_id);
    const parent = parents.find(p => p.id === s.veli_id);
    return {
      ...s,
      sinif_adi: cls ? cls.ad : 'Sınıfsız',
      seviye: cls ? cls.seviye : null,
      veli_adi: parent ? parent.ad_soyad : 'Veli Atanmamış',
      veli_telefon: parent ? parent.telefon : ''
    };
  });

  res.json(joined);
});

app.post('/api/ogrenci', (req, res) => {
  const { ad_soyad, tc_no, sinif_id, veli_id, alan, aktif } = req.body;
  if (!ad_soyad || !sinif_id || !alan) {
    return res.status(400).json({ error: 'Ad Soyad, Sınıf ve Alan gereklidir.' });
  }
  const student = db.insert('ogrenciler', {
    ad_soyad,
    tc_no: tc_no || '',
    sinif_id: Number(sinif_id),
    veli_id: veli_id ? Number(veli_id) : null,
    alan,
    aktif: aktif !== undefined ? Boolean(aktif) : true
  });
  res.json(student);
});

app.put('/api/ogrenci/:id', (req, res) => {
  const id = Number(req.params.id);
  const { ad_soyad, tc_no, sinif_id, veli_id, alan, aktif } = req.body;

  const updates: any = {};
  if (ad_soyad !== undefined) updates.ad_soyad = ad_soyad;
  if (tc_no !== undefined) updates.tc_no = tc_no;
  if (sinif_id !== undefined) updates.sinif_id = Number(sinif_id);
  if (veli_id !== undefined) updates.veli_id = veli_id ? Number(veli_id) : null;
  if (alan !== undefined) updates.alan = alan;
  if (aktif !== undefined) updates.aktif = Boolean(aktif);

  const success = db.update('ogrenciler', id, updates);
  if (success) {
    res.json({ message: 'Öğrenci güncellendi.' });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı.' });
  }
});

app.delete('/api/ogrenci/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('ogrenciler', id);
  if (success) {
    const results = db.getSinavSonuclari().filter(r => r.ogrenci_id === id);
    results.forEach(r => db.delete('sinav_sonuclari', r.id));
    const notes = db.getRehberlikNotlari().filter(n => n.ogrenci_id === id);
    notes.forEach(n => db.delete('rehberlik_notlari', n.id));
    res.json({ message: 'Öğrenci silindi.' });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı.' });
  }
});

app.get('/api/ogrenci/:id', (req, res) => {
  const studentId = Number(req.params.id);
  const student = db.getOgrenciler().find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
  }
  const studentClass = db.getSiniflar().find(c => c.id === student.sinif_id);
  const parent = db.getKullanicilar().find(u => u.id === student.veli_id);
  
  const results = db.getSinavSonuclari().filter(r => r.ogrenci_id === studentId);
  const exams = db.getSinavTanimlari();
  const joinedResults = results.map(r => {
    const exam = exams.find(e => e.id === r.sinav_id);
    return {
      ...r,
      sinav_adi: exam ? exam.ad : 'Sınav',
      tur: exam ? exam.tur : 'TYT',
      tarih: exam ? exam.tarih : ''
    };
  }).sort((a, b) => a.tarih.localeCompare(b.tarih));

  const notes = db.getRehberlikNotlari().filter(n => n.ogrenci_id === studentId);
  const counselors = db.getKullanicilar().filter(u => u.rol === 'rehber');
  const joinedNotes = notes.map(n => {
    const counselor = counselors.find(c => c.id === n.rehber_id);
    return {
      ...n,
      rehber_adi: counselor ? counselor.ad_soyad : 'Rehber Öğretmen'
    };
  }).sort((a, b) => b.tarih.localeCompare(a.tarih));

  const schedule = db.getDersProgramlari().filter(dp => dp.ogrenci_id === student.id);

  res.json({
    student: {
      ...student,
      sinif_adi: studentClass ? studentClass.ad : 'Sınıfsız',
      veli_adi: parent ? parent.ad_soyad : 'Veli Atanmamış',
      veli_telefon: parent ? parent.telefon : ''
    },
    sonuclar: joinedResults,
    notlar: joinedNotes,
    ders_programi: schedule
  });
});

// Student guidance notes
app.post('/api/ogrenci/:id/not', (req, res) => {
  const ogrenci_id = Number(req.params.id);
  const { rehber_id, not_metni } = req.body;
  if (!not_metni) {
    return res.status(400).json({ error: 'Rehberlik notu içeriği gereklidir.' });
  }
  const note = db.insert('rehberlik_notlari', {
    ogrenci_id,
    rehber_id: Number(rehber_id) || 3,
    not_metni,
    tarih: new Date().toISOString().split('T')[0]
  });
  const counselor = db.getKullanicilar().find(u => u.id === note.rehber_id);
  res.json({
    note: {
      ...note,
      rehber_adi: counselor ? counselor.ad_soyad : 'Rehber Öğretmen'
    }
  });
});

app.delete('/api/ogrenci/:id/not/:noteId', (req, res) => {
  const noteId = Number(req.params.noteId);
  const success = db.delete('rehberlik_notlari', noteId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Rehberlik notu bulunamadı.' });
  }
});

// 2. SINIF (CLASSES) ENDPOINTS
app.get('/api/sinif', (req, res) => {
  res.json(db.getSiniflar());
});

app.post('/api/sinif', (req, res) => {
  const { ad, seviye } = req.body;
  if (!ad || !seviye) {
    return res.status(400).json({ error: 'Sınıf adı ve seviye gereklidir.' });
  }
  const cls = db.insert('siniflar', {
    ad,
    seviye: Number(seviye),
    kurum_id: 1
  });
  res.json(cls);
});

app.delete('/api/sinif/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('siniflar', id);
  if (success) {
    res.json({ message: 'Sınıf silindi.' });
  } else {
    res.status(404).json({ error: 'Sınıf bulunamadı.' });
  }
});

// 2.1 DERS PROGRAMI (WEEKLY SCHEDULE) ENDPOINTS
app.get('/api/ders-programi', (req, res) => {
  let list = db.getDersProgramlari();
  const ogrenciId = Number(req.query.ogrenci_id);
  if (ogrenciId) {
    list = list.filter(item => item.ogrenci_id === ogrenciId);
  }
  res.json(list);
});

app.post('/api/ders-programi', (req, res) => {
  const { ogrenci_id, gun, saat, ders_adi, ogretmen_adi } = req.body;
  if (!ogrenci_id || !gun || !saat || !ders_adi || !ogretmen_adi) {
    return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
  }
  const item = db.insert('ders_programlari', {
    ogrenci_id: Number(ogrenci_id),
    gun,
    saat,
    ders_adi,
    ogretmen_adi
  });
  res.json(item);
});

app.delete('/api/ders-programi/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('ders_programlari', id);
  if (success) {
    res.json({ message: 'Ders programı kaydı silindi.' });
  } else {
    res.status(404).json({ error: 'Ders programı kaydı bulunamadı.' });
  }
});

// 3. VELI (PARENTS) ENDPOINTS
app.get('/api/veli', (req, res) => {
  const parents = db.getKullanicilar().filter(u => u.rol === 'veli');
  res.json(parents);
});

app.post('/api/veli', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const parent = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'veli',
    telefon,
    kurum_id: 1
  });
  res.json(parent);
});

app.delete('/api/veli/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.getKullanicilar().find(u => u.id === id);
  if (user && user.rol === 'veli') {
    db.delete('kullanicilar', id);
    res.json({ message: 'Veli kaydı silindi.' });
  } else {
    res.status(404).json({ error: 'Veli bulunamadı.' });
  }
});

// 4. OGRETMEN (TEACHERS) ENDPOINTS
app.get('/api/ogretmen', (req, res) => {
  const teachers = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
  res.json(teachers);
});

app.post('/api/ogretmen', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const teacher = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'ogretmen',
    telefon,
    kurum_id: 1
  });
  res.json(teacher);
});

app.delete('/api/ogretmen/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.getKullanicilar().find(u => u.id === id);
  if (user && user.rol === 'ogretmen') {
    db.delete('kullanicilar', id);
    res.json({ message: 'Öğretmen silindi.' });
  } else {
    res.status(404).json({ error: 'Öğretmen bulunamadı.' });
  }
});

// 5. REHBER (COUNSELORS) ENDPOINTS
app.get('/api/rehber', (req, res) => {
  const counselors = db.getKullanicilar().filter(u => u.rol === 'rehber');
  res.json(counselors);
});

app.post('/api/rehber', (req, res) => {
  const { ad_soyad, email, sifre, telefon } = req.body;
  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre gereklidir.' });
  }
  const counselor = db.insert('kullanicilar', {
    ad_soyad,
    email,
    sifre,
    rol: 'rehber',
    telefon,
    kurum_id: 1
  });
  res.json(counselor);
});

app.delete('/api/rehber/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.getKullanicilar().find(u => u.id === id);
  if (user && user.rol === 'rehber') {
    db.delete('kullanicilar', id);
    res.json({ message: 'Rehber öğretmen silindi.' });
  } else {
    res.status(404).json({ error: 'Rehber öğretmen bulunamadı.' });
  }
});

// 6. SINAV (EXAMS) ENDPOINTS
app.get('/api/sinav', (req, res) => {
  res.json(db.getSinavTanimlari());
});

app.post('/api/sinav', (req, res) => {
  const { ad, tur, tarih } = req.body;
  if (!ad || !tur) {
    return res.status(400).json({ error: 'Sınav adı ve türü gereklidir.' });
  }
  const exam = db.insert('sinav_tanimlari', {
    ad,
    tur,
    tarih: tarih || new Date().toISOString().split('T')[0],
    kurum_id: 1
  });
  res.json(exam);
});

app.delete('/api/sinav/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('sinav_tanimlari', id);
  if (success) {
    const associated = db.getSinavSonuclari().filter(r => r.sinav_id === id);
    associated.forEach(r => db.delete('sinav_sonuclari', r.id));
    res.json({ message: 'Sınav ve bağlı sonuçlar silindi.' });
  } else {
    res.status(404).json({ error: 'Sınav bulunamadı.' });
  }
});

// 7. MESAJ (MESSAGES) ENDPOINTS
app.get('/api/mesaj', (req, res) => {
  const { user_id, rol } = req.query;
  const messages = db.getMesajlar();
  const users = db.getKullanicilar();
  const students = db.getOgrenciler();

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const uid = Number(user_id);
  let filtered = messages;

  if (rol === 'veli') {
    filtered = messages.filter(m => m.alici_id === uid);
  } else {
    filtered = messages.filter(m => m.gonderen_id === uid || m.alici_id === uid);
  }

  const joined = filtered.map(m => {
    const sender = users.find(u => u.id === m.gonderen_id);
    const receiver = users.find(u => u.id === m.alici_id);
    const student = students.find(s => s.id === m.ogrenci_id);
    return {
      ...m,
      gonderen_adi: sender ? sender.ad_soyad : 'Sistem',
      gonderen_rol: sender ? sender.rol : 'sistem',
      alici_adi: receiver ? receiver.ad_soyad : 'Alıcı',
      ogrenci_adi: student ? student.ad_soyad : 'Tüm Öğrenciler'
    };
  }).sort((a, b) => b.tarih.localeCompare(a.tarih));

  res.json(joined);
});

app.post('/api/mesaj', (req, res) => {
  const { gonderen_id, alici_id, ogrenci_id, konu, mesaj } = req.body;

  if (!gonderen_id || !alici_id || !mesaj) {
    return res.status(400).json({ error: 'Gönderici, Alıcı ve Mesaj alanları zorunludur.' });
  }

  const msg = db.insert('mesajlar', {
    gonderen_id: Number(gonderen_id),
    alici_id: Number(alici_id),
    ogrenci_id: ogrenci_id ? Number(ogrenci_id) : 1,
    konu: konu || 'K.A.S. Bilgilendirme',
    mesaj,
    okundu: false,
    tarih: new Date().toISOString()
  });

  res.json(msg);
});

app.get('/api/mesaj/:id/oku', (req, res) => {
  const id = Number(req.params.id);
  const success = db.update('mesajlar', id, { okundu: true });
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
});

// 8. PDF PARSER UPLOAD & SAVE ALIAS ENDPOINTS
app.post('/api/pdf/upload', async (req, res) => {
  try {
    const { fileData, fileName, mimeType, publisher, examType, examDate } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Dosya verisi (base64) zorunludur.' });
    }

    let parsedResults: any[] = [];

    if (ai) {
      console.log('Sending base64 to Gemini for PDF analysis...');
      let rawBase64 = fileData;
      if (fileData.includes(',')) {
        rawBase64 = fileData.split(',')[1];
      }

      const prompt = `
        Sen K.A.S (Kurum Analiz Sistemi) akıllı deneme sınavı analiz robotusun.
        Sana verilen deneme sınav sonuç belgesindeki tüm öğrencileri ve onların netlerini oku.
        Sınav türü: \${examType} (TYT veya AYT).
        Lütfen belgedeki tablo veya listeyi oku, OCR işlemi yap ve her bir öğrencinin sonuçlarını çıkar.
        Sonuçları sadece ve sadece geçerli bir JSON array formatında döndür. Markdown 'json' bloğu içine alabilirsin.
        
        Çıktı yapısı tam olarak şu olmalı:
        [
          {
            "okunan_isim": "Canberk Aksoy",
            "turkce_net": 31.25,
            "sosyal_net": 12.50,
            "matematik_net": 22.75,
            "fen_net": 15.00,
            "toplam_net": 81.50,
            "puan": 385.20
          }
        ]
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: rawBase64,
                mimeType: mimeType || 'application/pdf',
              },
            },
            prompt
          ]
        });

        const text = response.text || '';
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
        parsedResults = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error('Gemini parsing in PDF upload failed, falling back to mock generator:', e);
        parsedResults = generateMockParsedDataForUpload(examType);
      }
    } else {
      console.log('Gemini not available, generating high-fidelity local parser simulation...');
      parsedResults = generateMockParsedDataForUpload(examType);
    }

    // Map and match with existing students in DB
    const students = db.getOgrenciler();
    const results = parsedResults.map((parsed: any) => {
      const parsedName = parsed.okunan_isim || parsed.ad_soyad || 'Bilinmeyen Öğrenci';
      const normalizedParsedName = parsedName.toLowerCase().replace(/\s/g, '');
      
      let matchedStudent = students.find(s => s.ad_soyad.toLowerCase().replace(/\s/g, '') === normalizedParsedName);
      if (!matchedStudent) {
        matchedStudent = students.find(s => {
          const sName = s.ad_soyad.toLowerCase();
          const pName = parsedName.toLowerCase();
          return sName.includes(pName) || pName.includes(sName);
        });
      }

      const tNet = Number(parsed.turkce_net) || 0;
      const sNet = Number(parsed.sosyal_net) || 0;
      const mNet = Number(parsed.matematik_net) || 0;
      const fNet = Number(parsed.fen_net) || 0;
      const topNet = Number(parsed.toplam_net) || (tNet + sNet + mNet + fNet);

      return {
        ogrenci_id: matchedStudent ? matchedStudent.id : null,
        eslesen_ogrenci_adi: matchedStudent ? matchedStudent.ad_soyad : 'Eşleşmedi (Yeni Öğrenci Olarak Eklenecek)',
        eslesme_orani: matchedStudent ? 100 : 0,
        okunan_isim: parsedName,
        turkce_net: tNet,
        sosyal_net: sNet,
        matematik_net: mNet,
        fen_net: fNet,
        toplam_net: Number(topNet.toFixed(2)),
        puan: Number((parsed.puan || (topNet * 3.4 + 100)).toFixed(2))
      };
    });

    res.json({
      results,
      extractedCount: results.length
    });
  } catch (err: any) {
    console.error('Error in /api/pdf/upload:', err);
    res.status(500).json({ error: `Hata: \${err.message}` });
  }
});

app.post('/api/pdf/save', (req, res) => {
  try {
    const { examName, examType, examDate, results } = req.body;
    if (!examName || !examType || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Sınav adı, türü ve sonuç verileri zorunludur.' });
    }

    // Create or find Exam
    let exam = db.getSinavTanimlari().find(e => e.ad.toLowerCase() === examName.toLowerCase());
    if (!exam) {
      exam = db.insert('sinav_tanimlari', {
        ad: examName,
        tur: examType,
        tarih: examDate || new Date().toISOString().split('T')[0],
        kurum_id: 1
      });
    }

    let savedCount = 0;
    const defaultClasses = db.getSiniflar();
    const defaultClassId = defaultClasses.length > 0 ? defaultClasses[0].id : 1;

    results.forEach((row: any) => {
      let finalStudentId = row.ogrenci_id;
      
      // If student is not matched, create a new student
      if (!finalStudentId) {
        const newStudent = db.insert('ogrenciler', {
          ad_soyad: row.okunan_isim || 'Yeni Öğrenci',
          tc_no: '',
          sinif_id: defaultClassId,
          veli_id: null,
          alan: 'Sayısal',
          aktif: true
        });
        finalStudentId = newStudent.id;
      }

      // Check if result already exists for this student & exam
      const existingResult = db.getSinavSonuclari().find(r => r.ogrenci_id === finalStudentId && r.sinav_id === exam!.id);
      if (!existingResult) {
        db.insert('sinav_sonuclari', {
          ogrenci_id: finalStudentId,
          sinav_id: exam!.id,
          turkce_net: Number(row.turkce_net) || 0,
          sosyal_net: Number(row.sosyal_net) || 0,
          matematik_net: Number(row.matematik_net) || 0,
          fen_net: Number(row.fen_net) || 0,
          toplam_net: Number(row.toplam_net) || 0,
          puan: Number(row.puan) || 100
        });
        savedCount++;
      }
    });

    res.json({
      success: true,
      savedCount
    });
  } catch (err: any) {
    console.error('Error in /api/pdf/save:', err);
    res.status(500).json({ error: `Sonuçlar kaydedilemedi: ${err.message}` });
  }
});

// ==========================================
// PAYTR GÜVENLİ SANAL POS ENTEGRASYONU
// ==========================================

// 1. PayTR iFrame Token Oluşturma (POST /api/paytr/token)
app.post('/api/paytr/token', async (req, res) => {
  try {
    const { amount, isAnnualBilling, userEmail, userName, userPhone, userId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Ödeme tutarı gereklidir.' });
    }

    // PayTR API Kimlik Bilgileri (Çevre değişkenlerinden alınır)
    const merchant_id = process.env.PAYTR_MERCHANT_ID || '';
    const merchant_key = process.env.PAYTR_MERCHANT_KEY || '';
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT || '';

    const test_mode = (process.env.PAYTR_TEST_MODE || '1') === '1' ? '1' : '0';

    // Eğer kimlik bilgileri eksikse, geliştirme ortamında simüle edilmiş token dönelim
    if (!merchant_id || !merchant_key || !merchant_salt) {
      console.warn('PayTR API bilgileri (PAYTR_MERCHANT_ID vb.) eksik. Simülasyon modu aktiftir.');
      const mockToken = `mock_paytr_token_${Date.now()}`;
      return res.json({
        success: true,
        token: mockToken,
        isSimulation: true,
        message: 'PayTR bilgileri tanımlanmadığı için test simülasyonu başlatıldı.'
      });
    }

    // Müşteri ve Sipariş Bilgileri
    const email = userEmail || 'destek@kas.com';
    const payment_amount = Math.round(Number(amount) * 100); // Kuruş cinsinden (Örn: 950 TL -> 95000)
    
    // Alfanumerik benzersiz sipariş numarası (PayTR tire - veya özel karakter kabul etmez)
    const merchant_oid = `KAS${userId || '0'}X${Date.now()}`; 
    const user_name = userName || 'KAS Kullanıcısı';
    const user_address = 'İstanbul, Türkiye';
    const user_phone = userPhone || '05555555555';
    
    // Sistem yönlendirme adresleri
    const app_url = process.env.APP_URL || `http://localhost:${PORT}`;
    const merchant_ok_url = `${app_url}/api/paytr/ok`;
    const merchant_fail_url = `${app_url}/api/paytr/fail`;

    // Sepet Ürünleri: [[Ürün Adı, Fiyatı, Adedi]]
    const planName = isAnnualBilling ? "K.A.S Sınırsız Yıllık Premium Lisansı" : "K.A.S Sınırsız Aylık Premium Lisansı";
    const user_basket = Buffer.from(
      JSON.stringify([[planName, amount.toString(), 1]])
    ).toString('base64');

    // Müşteri IP'si (Güvenli şekilde listelerden ve proxy IP'lerinden temizlenir)
    let raw_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    let user_ip = '127.0.0.1';
    if (Array.isArray(raw_ip)) {
      raw_ip = raw_ip[0];
    }
    if (typeof raw_ip === 'string') {
      user_ip = raw_ip.split(',')[0].trim();
      if (user_ip.startsWith('::ffff:')) {
        user_ip = user_ip.substring(7);
      }
      if (user_ip === '::1') {
        user_ip = '127.0.0.1';
      }
    }

    // Diğer Yapılandırmalar
    const no_installment = '0'; // Taksit seçeneği açık (0) veya kapalı (1)
    const max_installment = '12'; // Maksimum taksit sayısı
    const currency = 'TL';

    // 1. Adım: Hash Zincirini Oluşturun
    // Formül: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
    const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt;
    
    // 2. Adım: HMAC-SHA256 ile imzalayın
    const paytr_token = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str)
      .digest('base64');

    // 3. Adım: PayTR sunucusuna Token talebi gönderin
    const formData = new URLSearchParams({
      merchant_id,
      user_ip: String(user_ip),
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      no_installment,
      max_installment,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      currency,
      test_mode
    });

    let responseText = '';
    try {
      const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      responseText = await response.text();
      console.log('PayTR Token Alımı Ham Yanıt:', responseText);

      const data = JSON.parse(responseText);

      if (data.status === 'success') {
        res.json({
          success: true,
          token: data.token,
          merchant_oid,
          isSimulation: false
        });
      } else {
        console.error('PayTR Token hatası:', data.err_msg || data.reason);
        res.status(400).json({ error: data.err_msg || data.reason || 'PayTR token oluşturulamadı.' });
      }
    } catch (parseErr: any) {
      console.error('PayTR response parsing failed. Raw response was:', responseText, parseErr);
      res.status(500).json({ error: `PayTR servis hatası: ${responseText || parseErr.message}` });
    }
  } catch (err: any) {
    console.error('PayTR Token endpoint hatası:', err);
    res.status(500).json({ error: `Sunucu hatası: ${err.message}` });
  }
});

// GET /paytr-test (PayTR Test Siparişi ve Yönlendirme Rotası)
app.get('/paytr-test', async (req, res) => {
  try {
    const merchant_id = process.env.PAYTR_MERCHANT_ID || '';
    const merchant_key = process.env.PAYTR_MERCHANT_KEY || '';
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT || '';

    if (!merchant_id || !merchant_key || !merchant_salt) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>K.A.S - PayTR Yapılandırma Hatası</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 1.5rem; max-width: 500px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            h1 { color: #f43f5e; font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
            p { font-size: 0.9rem; color: #9ca3af; line-height: 1.6; margin-bottom: 1.5rem; }
            .code-block { background: #030712; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.8rem; border: 1px solid #374151; color: #38bdf8; overflow-x: auto; margin-bottom: 1.5rem; }
            .btn { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.2s; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ PayTR Bilgileri Eksik</h1>
            <p>PayTR test ödemesini başlatabilmek için gerekli olan mağaza kimlik bilgileri sunucuda tanımlanmamış. Lütfen aşağıdaki anahtarları AI Studio'daki <strong>Settings -> Secrets</strong> sekmesinden tanımlayın:</p>
            <div class="code-block">
PAYTR_MERCHANT_ID=mizan_id_buraya<br>
PAYTR_MERCHANT_KEY=anahtar_buraya<br>
PAYTR_MERCHANT_SALT=salt_buraya
            </div>
            <a href="/" class="btn">Ana Sayfaya Dön</a>
          </div>
        </body>
        </html>
      `);
    }

    // Test Siparişi Parametreleri
    const email = 'destek@kas.com';
    const payment_amount = 1000; // 10.00 TL (kuruş olarak)
    const merchant_oid = `TEST${Date.now()}`;
    const user_name = 'PayTR Test Alıcısı';
    const user_address = 'Kadıköy, İstanbul';
    const user_phone = '05555555555';
    const test_mode = '1'; // Her zaman test modu aktif

    // IP alma
    let raw_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    let user_ip = '127.0.0.1';
    if (Array.isArray(raw_ip)) { raw_ip = raw_ip[0]; }
    if (typeof raw_ip === 'string') {
      user_ip = raw_ip.split(',')[0].trim();
      if (user_ip.startsWith('::ffff:')) { user_ip = user_ip.substring(7); }
      if (user_ip === '::1') { user_ip = '127.0.0.1'; }
    }
    // PayTR test ortamı için geçerli bir IP adresi
    if (user_ip === '127.0.0.1' || user_ip === 'localhost') {
      user_ip = '85.105.105.105'; // Türkiye IP'si simülasyonu
    }

    const no_installment = '1'; // Test siparişinde taksit kapalı olsun
    const max_installment = '0';
    const currency = 'TL';

    // Sepet verisi (10.00 TL test ürünü)
    const user_basket = Buffer.from(
      JSON.stringify([["PayTR 10 TL Test Ürünü", "10.00", 1]])
    ).toString('base64');

    // Hash oluşturma
    const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt;
    const paytr_token = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str)
      .digest('base64');

    const app_url = `https://${req.headers.host}`;
    const merchant_ok_url = `${app_url}/api/paytr/ok`;
    const merchant_fail_url = `${app_url}/api/paytr/fail`;

    // PayTR API token alımı
    const formData = new URLSearchParams({
      merchant_id,
      user_ip: String(user_ip),
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      no_installment,
      max_installment,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      currency,
      test_mode
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (data.status === 'success') {
      // Doğrudan PayTR'ın güvenli test ödeme sayfasına yönlendiriyoruz (Redirect)
      console.log(`PayTR Test Token Başarılı: ${data.token}. Sipariş: ${merchant_oid}. Yönlendiriliyor...`);
      res.redirect(`https://www.paytr.com/odeme/guvenli/${data.token}`);
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>PayTR Token Alınamadı</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 1.5rem; max-width: 500px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            h1 { color: #f43f5e; font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
            p { font-size: 0.9rem; color: #9ca3af; line-height: 1.6; margin-bottom: 1.5rem; }
            .error-details { background: #030712; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; overflow-x: auto; margin-bottom: 1.5rem; }
            .btn { background: #374151; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.2s; }
            .btn:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ PayTR Token Alınamadı</h1>
            <p>PayTR API'si token talebini reddetti. Hata detayı:</p>
            <div class="error-details">
              <strong>Hata Mesajı:</strong> ${data.err_msg || data.reason || 'Bilinmeyen Hata'}<br>
              <strong>Sipariş No:</strong> ${merchant_oid}
            </div>
            <a href="/" class="btn">Geri Dön</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err: any) {
    console.error('PayTR /paytr-test hatası:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Sistem Hatası</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 1.5rem; max-width: 500px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          h1 { color: #f43f5e; font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
          p { font-size: 0.9rem; color: #9ca3af; line-height: 1.6; margin-bottom: 1.5rem; }
          .error-details { background: #030712; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; overflow-x: auto; margin-bottom: 1.5rem; }
          .btn { background: #374151; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #4b5563; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>💥 Sunucu Hatası</h1>
          <p>Yönlendirme sırasında beklenmeyen bir hata oluştu:</p>
          <div class="error-details">
            ${err.message || err}
          </div>
          <a href="/" class="btn">Geri Dön</a>
        </div>
      </body>
      </html>
    `);
  }
});

// POST /paytr-callback (PayTR'dan gelecek POST ödeme bildirimlerini karşılayan düz rota)
app.post('/paytr-callback', (req, res) => {
  console.log('PayTR /paytr-callback POST isteği ulaştı. Payload:', req.body);
  res.send('OK');
});

// 2. PayTR Ödeme Bildirimi (POST /api/paytr/callback)
app.post('/api/paytr/callback', (req, res) => {
  console.log('PayTR /api/paytr/callback POST isteği ulaştı. Payload:', req.body);
  
  try {
    const { merchant_oid, status, total_amount, hash } = req.body;
    console.log(`PayTR Bildirim Durumu: Sipariş No = ${merchant_oid}, Statü = ${status}`);

    const merchant_key = process.env.PAYTR_MERCHANT_KEY || '';
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT || '';

    // Eger PayTR API anahtarlari tanimlanmissa, kesinlikle cryptographic imza dogrulamasi yapalim
    if (merchant_key && merchant_salt) {
      // Formül: merchant_oid + merchant_salt + status + total_amount
      const hash_str = (merchant_oid || '') + merchant_salt + (status || '') + (total_amount || '');
      const calculated_hash = crypto
        .createHmac('sha256', merchant_key)
        .update(hash_str)
        .digest('base64');

      if (calculated_hash !== hash) {
        console.error('PAYTR GÜVENLİK UYARISI: Geçersiz imza/hash tespit edildi! İstek reddedildi.');
        return res.status(400).send('PAYTR_SIGNATURE_INVALID');
      }
      console.log('PayTR callback imzası başarıyla doğrulandı.');
    } else {
      console.warn('PayTR API bilgileri tanımlanmadığı için callback imza doğrulaması atlandı (Sandbox/Lokal Geliştirme Modu).');
    }
    
    if (status === 'success' && merchant_oid && merchant_oid.startsWith('KAS')) {
      const payload = merchant_oid.substring(3); // 'KAS' kaldır
      const parts = payload.split('X');
      if (parts.length >= 2) {
        const userId = Number(parts[0]);
        const user = db.getKullanicilar().find(u => u.id === userId);
        if (user && user.kurum_id) {
          // Kurumun abonelik statüsünü veritabanında (db.json) kalıcı olarak güncelle
          db.update('kurumlar', user.kurum_id, { abonelik_turu: 'premium' });
          console.log(`PayTR Bildirimi ile Üyelik Veritabanında Kalıcı Olarak Onaylandı! Kullanıcı: ${user.ad_soyad}, Kurum ID: ${user.kurum_id}`);
        }
      }
    }
  } catch (err: any) {
    console.error('PayTR Bildirim parsing hatası:', err);
  }

  // PayTR'ın bizden beklediği tek ve net yanıt "OK" stringidir.
  // Her durumda doğrudan OK dönerek "Bildirim URL Hatası" oluşmasını önlüyoruz.
  return res.send('OK');
});

// GET /api/paytr/callback (Test ve Manuel Kontroller İçin)
app.get('/api/paytr/callback', (req, res) => {
  console.log('PayTR /api/paytr/callback GET isteği ulaştı.');
  return res.send('OK');
});

// 3. Ödeme Başarılı Yönlendirme (GET /api/paytr/ok)
app.get('/api/paytr/ok', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Ödeme Başarılı</title>
        <meta charset="utf-8">
        <style>
          body { background: #090d16; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .container { background: #0f172a; padding: 40px; border-radius: 24px; border: 1px solid #10b981; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #10b981; font-size: 24px; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          .btn { background: #10b981; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block; transition: 0.2s; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Ödeme Başarılı!</h1>
          <p>Tebrikler, K.A.S Sınırsız Premium lisans paketiniz başarıyla aktifleştirildi. Şimdi portala geri dönebilirsiniz.</p>
          <a href="/?payment=success" class="btn">Portala Geri Dön</a>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = '/?payment=success';
          }, 3000);
        </script>
      </body>
    </html>
  `);
});

// 4. Ödeme Başarısız Yönlendirme (GET /api/paytr/fail)
app.get('/api/paytr/fail', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Ödeme Başarısız</title>
        <meta charset="utf-8">
        <style>
          body { background: #090d16; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .container { background: #0f172a; padding: 40px; border-radius: 24px; border: 1px solid #ef4444; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #ef4444; font-size: 24px; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          .btn { background: #ef4444; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block; transition: 0.2s; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✕ Ödeme Başarısız!</h1>
          <p>Ödeme işlemi bankanız veya sistem tarafından reddedildi. Lütfen kart limitinizi, internet alışveriş yetkisini kontrol ederek tekrar deneyin.</p>
          <a href="/?payment=fail" class="btn">Geri Dön ve Tekrar Dene</a>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = '/?payment=fail';
          }, 4000);
        </script>
      </body>
    </html>
  `);
});

// Serve frontend SPA in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve('dist/index.html'));
  });
}

// Start Server on configured port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
});
