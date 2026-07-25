const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const tytResults = results.filter(r => tytExamIds.includes(r.sinav_id));`;
const replacement = `    const studentIds = students.map(s => s.id);
    const tytResults = results.filter(r => tytExamIds.includes(r.sinav_id) && studentIds.includes(r.ogrenci_id));`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED RESULTS");
