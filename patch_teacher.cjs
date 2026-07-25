const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    // Calculate teacher success rate (Öğretmen Başarı Analizleri)
    const teachersFromDb = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
    const teachersFromLessons = Array.from(new Set(db.getDersProgramlari().map(dp => dp.ogretmen_adi))).filter(Boolean);`;

const replacement = `    // Calculate teacher success rate (Öğretmen Başarı Analizleri)
    const teachersFromDb = teachers; // Use already filtered teachers
    const teachersFromLessons = Array.from(new Set(db.getDersProgramlari().filter(dp => studentIds.includes(dp.ogrenci_id)).map(dp => dp.ogretmen_adi))).filter(Boolean);`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED TEACHER");
