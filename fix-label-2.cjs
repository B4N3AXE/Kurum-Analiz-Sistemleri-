const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

code = code.replace(
  "const label = subjKey.toUpperCase();",
  "const label = subjKey.toUpperCase().replace(/_/g, ' ');"
);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
