const fs = require('fs');
let code = fs.readFileSync('src/components/BildirimKutusu.tsx', 'utf8');

const target1 = `} else if (user.rol === 'veli') {`;
const replacement1 = `} else if (false && user.rol === 'veli') {`;

const target2 = `} else if (user.rol === 'ogretmen') {`;
const replacement2 = `} else if (false && user.rol === 'ogretmen') {`;


code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/BildirimKutusu.tsx', code);
console.log("PATCHED BİLDİRİM ALL");
