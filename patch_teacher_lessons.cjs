const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const teacherAnalysis = distinctTeachers.map((teacher) => {
      const teacherLessons = db.getDersProgramlari().filter(l => l.ogretmen_adi === teacher);`;

const replacement = `    const teacherAnalysis = distinctTeachers.map((teacher) => {
      const teacherLessons = db.getDersProgramlari().filter(l => l.ogretmen_adi === teacher && studentIds.includes(l.ogrenci_id));`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED TEACHER LESSONS");
