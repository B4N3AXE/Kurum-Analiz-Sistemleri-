const fs = require('fs');
let code = fs.readFileSync('src/components/BildirimKutusu.tsx', 'utf8');

const target = `    } else {
      // Admin
      defaultList = [`;

const replacement = `    } else if (false) { // Dummy disabled for admin
      // Admin
      defaultList = [`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/BildirimKutusu.tsx', code);
console.log("PATCHED BİLDİRİM ADMIN");
