const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const target = `      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setPaytrToken(data.token);
        } else {
          setPaytrError(data.error || 'Token oluşturulamadı.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setPaytrError(errData.error || 'Ödeme sunucusuna bağlanırken hata oluştu.');
      }`;

const replacement = `      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.isFreeUpgrade) {
             setCouponSuccess('Ücretsiz Yükseltme Başarılı! Premium özellikleriniz aktif ediliyor...');
             setTimeout(() => {
               window.location.reload();
             }, 3000);
          } else if (data.token) {
             setPaytrToken(data.token);
          } else {
             setPaytrError(data.error || 'Token oluşturulamadı.');
          }
        } else {
          setPaytrError(data.error || 'Token oluşturulamadı.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setPaytrError(errData.error || 'Ödeme sunucusuna bağlanırken hata oluştu.');
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Abonelik.tsx', code);
