const fs = require('fs');

// Patch server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
const oldPrices = `const PLAN_PRICES: any = {
      'mikro': 2900,
      'bronz': 5900,
      'gumus': 9900,
      'altin': 14900,
      'platin': 24500,
      'elmas': 50000,
      'premium': 39000
    };`;
const newPrices = `const PLAN_PRICES: any = {
      'mikro': 3000,
      'bronz': 6000,
      'gumus': 10000,
      'altin': 15000,
      'platin': 24500,
      'elmas': 50100,
      'premium': 39100
    };`;
serverCode = serverCode.split(oldPrices).join(newPrices);

const oldTarget = `const annualPrice = PLAN_PRICES[targetPlanId] || 39000;`;
const newTarget = `const annualPrice = PLAN_PRICES[targetPlanId] || 39100;`;
serverCode = serverCode.split(oldTarget).join(newTarget);

fs.writeFileSync('server.ts', serverCode);
console.log('server.ts patched');

// Patch Abonelik.tsx
let abonelikCode = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

abonelikCode = abonelikCode.replace(/id: 'mikro',[\s\S]*?price: 2900,/, `id: 'mikro',
                  title: 'Mikro Paket',
                  capacity: '0 - 25 Öğrenci',
                  price: 3000,`);
abonelikCode = abonelikCode.replace(/id: 'bronz',[\s\S]*?price: 5900,/, `id: 'bronz',
                  title: 'Bronz Paket',
                  capacity: '25 - 50 Öğrenci',
                  price: 6000,`);
abonelikCode = abonelikCode.replace(/id: 'gumus',[\s\S]*?price: 9900,/, `id: 'gumus',
                  title: 'Gümüş Paket',
                  capacity: '50 - 100 Öğrenci',
                  price: 10000,`);
abonelikCode = abonelikCode.replace(/id: 'altin',[\s\S]*?price: 14900,/, `id: 'altin',
                  title: 'Altın (Gold) Paket',
                  capacity: '100 - 150 Öğrenci',
                  price: 15000,`);

abonelikCode = abonelikCode.replace(/id: "premium",\n\s*title: "K.A.S Sınırsız Premium",\n\s*price: "₺" \+ new Intl\.NumberFormat\('tr-TR'\)\.format\(39000\),\n\s*priceNum: 39000,/g, `id: "premium",
                    title: "K.A.S Sınırsız Premium",
                    price: "₺" + new Intl.NumberFormat('tr-TR').format(39100),
                    priceNum: 39100,`);

abonelikCode = abonelikCode.replace(/isAnnual: true, price: "₺39\.000" \} : null\);/g, `isAnnual: true, price: "₺39.100" } : null);`);

fs.writeFileSync('src/components/Abonelik.tsx', abonelikCode);
console.log('Abonelik.tsx patched');
