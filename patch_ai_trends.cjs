const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  const getInstitutionTrendsLocal = () => {
    if (userRole !== 'admin' && userRole !== 'ogretmen') return { error: "Bu veriye erişim yetkiniz yoktur." };
    const students = db.getOgrenciler();
    const exams = db.getSinavSonuclari();
    const examDefs = db.getSinavTanimlari();
    
    // Very simple trend calculator for AI
    const resultsByStudent: Record<number, any[]> = {};
    exams.forEach(r => {
       if (!resultsByStudent[r.ogrenci_id]) resultsByStudent[r.ogrenci_id] = [];
       resultsByStudent[r.ogrenci_id].push(r);
    });

    let topStudents = [];
    let riskStudents = [];

    students.forEach(s => {
       const res = resultsByStudent[s.id];
       if (res && res.length >= 2) {
          // simple check
          const last = res[0].toplam_net; // Assuming ordered or just first is last
          const prev = res[1].toplam_net;
          if (last > prev + 5) topStudents.push(s.ad_soyad + " (Yükselişte)");
          if (last < prev - 5) riskStudents.push(s.ad_soyad + " (Düşüşte)");
       }
    });

    return {
       aktifOgrenciSayisi: students.length,
       yukselisteOlanOgrenciler: topStudents.slice(0, 5),
       dususteRiskliOgrenciler: riskStudents.slice(0, 5),
       genelDurum: "Kurum geneli başarı stabil. Analiz edilen son denemelere göre yükseliş ve düşüş trendleri yukarıda listelenmiştir."
    };
  };`;

const replacement = `  const getInstitutionTrendsLocal = () => {
    if (userRole !== 'admin' && userRole !== 'ogretmen') return { error: "Bu veriye erişim yetkiniz yoktur." };
    const students = db.getOgrenciler();
    const exams = db.getSinavSonuclari();
    const examDefs = db.getSinavTanimlari();
    
    // Sort exams by date for each student to find true trends
    const resultsByStudent: Record<number, any[]> = {};
    exams.forEach(r => {
       if (!resultsByStudent[r.ogrenci_id]) resultsByStudent[r.ogrenci_id] = [];
       const eDef = examDefs.find(ed => ed.id === r.sinav_id);
       resultsByStudent[r.ogrenci_id].push({ ...r, date: eDef?.tarih || '2020-01-01' });
    });

    let topStudents: string[] = [];
    let riskStudents: string[] = [];

    students.forEach(s => {
       const res = resultsByStudent[s.id];
       if (res && res.length >= 2) {
          res.sort((a, b) => b.date.localeCompare(a.date)); // Descending
          const last = res[0].toplam_net;
          const prev = res[1].toplam_net;
          if (last > prev + 5) topStudents.push(s.ad_soyad + \` (Son 2 Sınav: \${prev} -> \${last} net)\`);
          if (last < prev - 5) riskStudents.push(s.ad_soyad + \` (Son 2 Sınav: \${prev} -> \${last} net)\`);
       }
    });

    // Calculate teacher success rate
    const teachersFromDb = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
    const allTeacherNames = new Set<string>();
    teachersFromDb.forEach(t => allTeacherNames.add(t.ad_soyad));
    db.getDersProgramlari().forEach(t => allTeacherNames.add(t.ogretmen_adi));
    
    const distinctTeachers = Array.from(allTeacherNames).filter(Boolean);
    const teacherAnalysis = distinctTeachers.map((teacher) => {
      const teacherLessons = db.getDersProgramlari().filter(l => l.ogretmen_adi === teacher);
      const uniqueStudents = new Set(teacherLessons.map(l => l.ogrenci_id));
      const ogrenci_sayisi = uniqueStudents.size;
      let basari_orani = 0;
      if (ogrenci_sayisi > 0) {
        const studentIds = Array.from(uniqueStudents);
        const studentResults = exams.filter(r => studentIds.includes(r.ogrenci_id));
        if (studentResults.length > 0) {
          const avgNet = studentResults.reduce((sum, r) => sum + (r.toplam_net || 0), 0) / studentResults.length;
          basari_orani = Math.min(100, Math.max(50, Math.round(50 + (avgNet / 120) * 50)));
        }
      }
      return { ogretmen: teacher, basari_orani_yuzde: basari_orani, ogrenci_sayisi };
    });

    return {
       aktifOgrenciSayisi: students.length,
       yukselisteOlanOgrenciler: topStudents.slice(0, 5),
       dususteRiskliOgrenciler: riskStudents.slice(0, 5),
       ogretmenPerformansAnalizleri: teacherAnalysis,
       genelDurum: "Kurum geneli başarı analizi ve öğretmen performansları yukarıda listelenmiştir."
    };
  };`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED AI TRENDS");
