const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const normRegex = /<span>\{selectedPlan\.isAnnual \? "₺39\.000" : "₺3\.250"\}<\/span>/g;
const normRep = `<span>{"₺" + new Intl.NumberFormat('tr-TR').format(selectedPlan.isAnnual ? selectedPlan.priceNum : Math.round(selectedPlan.priceNum / 12))}</span>`;
code = code.replace(normRegex, normRep);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('checkout normal fiyat patched');
