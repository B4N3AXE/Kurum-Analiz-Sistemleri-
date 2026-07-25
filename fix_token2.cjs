const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `        if (coupon.code === 'YENISEZON10' && !isAnnualBilling) {
          return res.status(400).json({ error: 'Bu kod sadece yıllık üyeliklerde geçerlidir.' });
        }
        if (isAnnualBilling) {
          if (coupon.discount_type === 'percentage') {
            final_amount = baseAmount * (1 - coupon.discount_value / 100);
          } else if (coupon.discount_type === 'fixed') {
            final_amount = Math.max(0, baseAmount - coupon.discount_value);
          }
        } else {
          return res.status(400).json({ error: 'Bu kod sadece yıllık üyeliklerde geçerlidir.' });
        }`;

const replacement = `        if (coupon.code === 'YENISEZON10' && !isAnnualBilling) {
          return res.status(400).json({ error: 'Bu kod sadece yıllık üyeliklerde geçerlidir.' });
        }
        
        if (coupon.discount_type === 'percentage') {
          final_amount = baseAmount * (1 - coupon.discount_value / 100);
        } else if (coupon.discount_type === 'fixed') {
          final_amount = Math.max(0, baseAmount - coupon.discount_value);
        }`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("REPLACED");
} else {
    console.log("NOT FOUND");
}
