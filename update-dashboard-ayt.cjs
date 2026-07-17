const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

if (!code.includes('AYT_SAY_SUBJECT_TOPICS')) {
  const aytTopics = `
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
`;

  code = code.replace('export const LGS_SUBJECT_TOPICS', aytTopics + '\nexport const LGS_SUBJECT_TOPICS');
  fs.writeFileSync('src/components/Dashboard.tsx', code);
}
