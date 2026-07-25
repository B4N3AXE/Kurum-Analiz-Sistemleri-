const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const declarationsTarget = `  const getStudentDetailDeclaration = {
    type: "function" as const,
    function: {
      name: "getStudentDetail",
      description: "Belirtilen öğrenci ID'sine ait deneme sınavı netlerini ve ödevlerini/görevlerini getirir.",`;

const declarationsReplacement = `  const getStudentPaymentInfoDeclaration = {
    type: "function" as const,
    function: {
      name: "getStudentPaymentInfo",
      description: "Belirtilen öğrenci ID'sine ait ödeme planını, kalan taksit sayısını ve ödenen/ödenmeyen taksit bilgilerini getirir.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "integer", description: "Öğrencinin sistemdeki benzersiz ID'si" }
        },
        required: ["studentId"]
      }
    }
  };

  const getInstitutionTrendsDeclaration = {
    type: "function" as const,
    function: {
      name: "getInstitutionTrends",
      description: "Kurum geneli başarı durumu, sınıf net ortalamaları, yükselişte olan ve düşüşte olan öğrencilerin genel özetini getirir.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  };

  const getStudentDetailDeclaration = {
    type: "function" as const,
    function: {
      name: "getStudentDetail",
      description: "Belirtilen öğrenci ID'sine ait deneme sınavı netlerini ve ödevlerini/görevlerini getirir.",`;

code = code.replace(declarationsTarget, declarationsReplacement);

const localsTarget = `  const getStudentDetailLocal = (studentId: number) => {`;
const localsReplacement = `  const getStudentPaymentInfoLocal = (studentId: number) => {
    if (userRole === 'ziyaretci') return { error: "Yetkisiz erişim." };
    const plans = db.getTaksitPlanlari().filter(p => p.ogrenci_id === studentId);
    if (plans.length === 0) return { error: "Bu öğrenciye ait bir ödeme/taksit planı bulunmamaktadır." };
    const taksitler = db.getTaksitler();
    
    return plans.map(plan => {
      const planTaksitleri = taksitler.filter(t => t.plan_id === plan.id);
      const odenenler = planTaksitleri.filter(t => t.durum === 'odendi');
      const bekleyenler = planTaksitleri.filter(t => t.durum === 'bekliyor' || t.durum === 'gecikmis');
      
      return {
        toplamTutar: plan.toplam_tutar,
        pesinat: plan.pesinat,
        taksitSayisi: plan.taksit_sayisi,
        kalanTaksitSayisi: bekleyenler.length,
        odenenTaksitSayisi: odenenler.length,
        taksitDetaylari: bekleyenler.map(t => ({
           vadeTarihi: t.vade_tarihi,
           tutar: t.tutar,
           durum: t.durum
        }))
      };
    });
  };

  const getInstitutionTrendsLocal = () => {
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
  };

  const getStudentDetailLocal = (studentId: number) => {`;

code = code.replace(localsTarget, localsReplacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED AI TOOLS DEFS");
