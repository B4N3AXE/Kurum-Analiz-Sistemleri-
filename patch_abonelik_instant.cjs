const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const target = `             setCouponSuccess('Ücretsiz Yükseltme Başarılı! Premium özellikleriniz aktif ediliyor...');
             setTimeout(() => {
               window.location.reload();
             }, 3000);`;

const replacement = `             setCouponSuccess('Ücretsiz Yükseltme Başarılı! Premium özellikleriniz aktif ediliyor...');
             setTimeout(() => {
               onUpgradeSuccess('premium');
               setPaymentStep('success');
             }, 1500);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log("PATCHED ABONELIK INSTANT");
