const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const oldStr = `✓ Aktif Lisansınız`;
const newStr = `✓ Bu plana zaten sahipsiniz`;
code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('patched btn');
