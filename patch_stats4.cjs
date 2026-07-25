const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const exams = db.getSinavTanimlari();
    const results = db.getSinavSonuclari();
    let classes = db.getSiniflar();
    const guidanceNotes = db.getRehberlikNotlari();`;

const replacement = `    const exams = db.getSinavTanimlari();
    const results = db.getSinavSonuclari();
    const guidanceNotes = db.getRehberlikNotlari();`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED");
