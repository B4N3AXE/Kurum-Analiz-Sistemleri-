const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update validate-coupon
const vcRegex = /app\.post\('\/api\/paytr\/validate-coupon', \(req, res\) => \{\n\s*try \{\n\s*const \{ isAnnualBilling, couponCode \} = req\.body;\n\s*const basePrice = isAnnualBilling \? 39000 : 3250;/;
const vcRep = `app.post('/api/paytr/validate-coupon', (req, res) => {
  try {
    const { isAnnualBilling, couponCode, planId } = req.body;
    const PLAN_PRICES: any = {
      'mikro': 2900,
      'bronz': 5900,
      'gumus': 9900,
      'altin': 14900,
      'platin': 24500,
      'elmas': 50000,
      'premium': 39000
    };
    const targetPlanId = planId || 'premium';
    const annualPrice = PLAN_PRICES[targetPlanId] || 39000;
    const basePrice = isAnnualBilling ? annualPrice : Math.round(annualPrice / 12);`;
code = code.replace(vcRegex, vcRep);

// Update token generation
const tRegex = /const targetPlanId = planId \|\| 'premium';\n\s*const baseAmount = PLAN_PRICES\[targetPlanId\] \|\| 39000;/;
const tRep = `const targetPlanId = planId || 'premium';
    const annualPrice = PLAN_PRICES[targetPlanId] || 39000;
    const baseAmount = isAnnualBilling ? annualPrice : Math.round(annualPrice / 12);`;
code = code.replace(tRegex, tRep);

fs.writeFileSync('server.ts', code);
console.log('server.ts billing patched');
