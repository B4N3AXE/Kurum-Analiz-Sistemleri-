const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const rol = req.query.rol as string;
    const userId = Number(req.query.user_id);

    let students = db.getOgrenciler();`;

const replacement = `    const rol = req.query.rol as string;
    const userId = Number(req.query.user_id);
    const kurumId = Number(req.query.kurum_id);

    let students = db.getOgrenciler();
    let classes = db.getSiniflar();
    let teachers = db.getKullanicilar().filter(u => u.rol === 'ogretmen');
    
    // Filter by kurum_id if provided
    if (kurumId) {
       classes = classes.filter(c => c.kurum_id === kurumId);
       const classIds = classes.map(c => c.id);
       students = students.filter(s => classIds.includes(s.sinif_id));
       teachers = teachers.filter(t => t.kurum_id === kurumId);
    }`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED");
