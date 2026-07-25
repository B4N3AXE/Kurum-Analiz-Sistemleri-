const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `        if (isAnnualBilling) {
          if (coupon.discount_type === 'percentage') {
            final_amount = baseAmount * (1 - coupon.discount_value / 100);
          } else if (coupon.discount_type === 'fixed') {
            final_amount = Math.max(0, baseAmount - coupon.discount_value);
          }
        } else {
          return res.status(400).json({ error: 'Bu kod sadece yıllık üyeliklerde geçerlidir.' });
        }`;

const replacement = `        if (coupon.discount_type === 'percentage') {
          final_amount = baseAmount * (1 - coupon.discount_value / 100);
        } else if (coupon.discount_type === 'fixed') {
          final_amount = Math.max(0, baseAmount - coupon.discount_value);
        }`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    
    // Add logic to bypass paytr if amount is 0
    const bypassTarget = `    // PayTR API Kimlik Bilgileri (Çevre değişkenlerinden alınır)
    const merchant_id = process.env.PAYTR_MERCHANT_ID || '722962';`;
    
    const bypassReplacement = `    if (final_amount <= 0) {
      // 100% discount, bypass PayTR and return success
      return res.json({
        success: true,
        isFreeUpgrade: true,
        amount: 0,
        message: 'Ücretsiz Yükseltme Başarılı'
      });
    }

    // PayTR API Kimlik Bilgileri (Çevre değişkenlerinden alınır)
    const merchant_id = process.env.PAYTR_MERCHANT_ID || '722962';`;
    
    code = code.replace(bypassTarget, bypassReplacement);
    
    fs.writeFileSync('server.ts', code);
    console.log("REPLACED");
} else {
    console.log("NOT FOUND");
}
