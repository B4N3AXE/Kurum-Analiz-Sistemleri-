const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    let teachers = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
    
    // Filter by kurum_id if provided
    if (kurumId) {
       classes = classes.filter(c => c.kurum_id === kurumId);
       const classIds = classes.map(c => c.id);
       students = students.filter(s => classIds.includes(s.sinif_id));
       teachers = teachers.filter(t => t.kurum_id === kurumId);
    }

    const exams = db.getSinavTanimlari();
    const results = db.getSinavSonuclari();
    let classes = db.getSiniflar();
    const guidanceNotes = db.getRehberlikNotlari();`;

const replacement = `    let teachers = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
    
    // Filter by kurum_id if provided
    if (kurumId) {
       classes = classes.filter(c => c.kurum_id === kurumId);
       const classIds = classes.map(c => c.id);
       students = students.filter(s => classIds.includes(s.sinif_id));
       teachers = teachers.filter(t => t.kurum_id === kurumId);
    }

    const exams = db.getSinavTanimlari();
    const results = db.getSinavSonuclari();
    const guidanceNotes = db.getRehberlikNotlari();`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED");
