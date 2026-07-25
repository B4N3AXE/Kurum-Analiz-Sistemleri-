const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const target = `          if (data.isFreeUpgrade) {
             setCouponSuccess('Ücretsiz Yükseltme Başarılı! Premium özellikleriniz aktif ediliyor...');
             setTimeout(() => {
               window.location.reload();
             }, 3000);`;

const replacement = `          if (data.isFreeUpgrade) {
             localStorage.setItem('kas_subscription_plan', 'premium');
             if (user && user.kurum_id) {
               localStorage.setItem(\`kas_subscription_plan_kurum_\${user.kurum_id}\`, 'premium');
             }
             setCouponSuccess('Ücretsiz Yükseltme Başarılı! Premium özellikleriniz aktif ediliyor...');
             setTimeout(() => {
               window.location.reload();
             }, 3000);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Abonelik.tsx', code);
