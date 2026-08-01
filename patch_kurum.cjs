const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(
  "abonelik_turu?: 'trial' | 'premium';",
  "abonelik_turu?: 'trial' | 'mikro' | 'bronz' | 'gumus' | 'altin' | 'platin' | 'elmas' | 'premium';"
);

fs.writeFileSync('server/db.ts', code);
console.log('server/db.ts patched');
