const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

code = code.replace(
  "userId: user?.id || 1,",
  "userId: user?.id || 1,\n          planId: selectedPlan?.id || 'premium',"
);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('Abonelik.tsx frontend patched');
