const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const t1 = /setSelectedPlan\(prev => prev \? \{ \.\.\.prev, isAnnual: false, price: "₺3\.250" \} : null\);/g;
const r1 = `setSelectedPlan(prev => prev ? { ...prev, isAnnual: false } : null);`;
code = code.replace(t1, r1);

const t2 = /setSelectedPlan\(prev => prev \? \{ \.\.\.prev, isAnnual: true, price: "₺39\.000" \} : null\);/g;
const r2 = `setSelectedPlan(prev => prev ? { ...prev, isAnnual: true } : null);`;
code = code.replace(t2, r2);

const valCalc = /let finalVal = selectedPlan\.priceNum;/g;
const valRep = `let finalVal = selectedPlan.isAnnual ? selectedPlan.priceNum : Math.round(selectedPlan.priceNum / 12);`;
code = code.replace(valCalc, valRep);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('checkout sidebar patched');
