const fs = require('fs');

let content = fs.readFileSync('server/db.ts', 'utf-8');

const replacement = `  siniflar: [
    { id: 1, ad: "12-A", seviye: 12, kurum_id: 1, alan: "Sayısal" },
    { id: 2, ad: "11-B", seviye: 11, kurum_id: 1, alan: "Eşit Ağırlık" }
  ],
  ogrenciler: [
    { id: 10001, ad_soyad: "Efe Yılmaz", tc_no: "11111111111", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: true, danisman_id: 3 },
    { id: 10002, ad_soyad: "Ayşe Kaya", tc_no: "22222222222", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: true, danisman_id: 3 },
    { id: 10003, ad_soyad: "Mehmet Demir", tc_no: "33333333333", sinif_id: 2, veli_id: null, alan: "Eşit Ağırlık", aktif: true, danisman_id: 3 }
  ],
  sinav_tanimlari: [
    { id: 1, ad: "TYT Deneme 1", tur: "TYT", tarih: "2023-09-15T09:00:00Z", kurum_id: 1 },
    { id: 2, ad: "TYT Deneme 2", tur: "TYT", tarih: "2023-10-15T09:00:00Z", kurum_id: 1 },
    { id: 3, ad: "AYT Deneme 1", tur: "AYT", tarih: "2023-10-16T09:00:00Z", kurum_id: 1 }
  ],
  sinav_sonuclari: [
    { id: 1, sinav_id: 1, ogrenci_id: 10001, turkce_net: 25, matematik_net: 15, sosyal_net: 10, fen_net: 10, toplam_net: 60, puan: 280, createdAt: "2023-09-15T12:00:00Z" },
    { id: 2, sinav_id: 2, ogrenci_id: 10001, turkce_net: 30, matematik_net: 20, sosyal_net: 12, fen_net: 15, toplam_net: 77, puan: 320, createdAt: "2023-10-15T12:00:00Z" },
    { id: 3, sinav_id: 1, ogrenci_id: 10002, turkce_net: 35, matematik_net: 30, sosyal_net: 15, fen_net: 18, toplam_net: 98, puan: 410, createdAt: "2023-09-15T12:00:00Z" },
    { id: 4, sinav_id: 2, ogrenci_id: 10002, turkce_net: 36, matematik_net: 32, sosyal_net: 16, fen_net: 19, toplam_net: 103, puan: 430, createdAt: "2023-10-15T12:00:00Z" },
    { id: 5, sinav_id: 1, ogrenci_id: 10003, turkce_net: 28, matematik_net: 10, sosyal_net: 15, fen_net: 5, toplam_net: 58, puan: 270, createdAt: "2023-09-15T12:00:00Z" },
    { id: 6, sinav_id: 2, ogrenci_id: 10003, turkce_net: 30, matematik_net: 8, sosyal_net: 18, fen_net: 4, toplam_net: 60, puan: 280, createdAt: "2023-10-15T12:00:00Z" }
  ],`;

content = content.replace(
  /  siniflar: \[\]\,\n  ogrenciler: \[\]\,\n  sinav_tanimlari: \[\]\,\n  sinav_sonuclari: \[\]\,/g,
  replacement
);

fs.writeFileSync('server/db.ts', content, 'utf-8');
console.log('DB updated!');
