const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    if (final_amount <= 0) {
      // 100% discount, bypass PayTR and return success
      return res.json({
        success: true,
        isFreeUpgrade: true,
        amount: 0,
        message: 'Ücretsiz Yükseltme Başarılı'
      });
    }`;

const replacement = `    if (final_amount <= 0) {
      // 100% discount, bypass PayTR and return success
      const user = db.getKullanicilar().find(u => u.id === userId);
      if (user && user.kurum_id) {
        db.update('kurumlar', user.kurum_id, { abonelik_turu: 'premium' });
        console.log(\`100% İndirim ile Üyelik Veritabanında Kalıcı Olarak Onaylandı! Kullanıcı: \${user.ad_soyad}, Kurum ID: \${user.kurum_id}\`);
      }
      
      return res.json({
        success: true,
        isFreeUpgrade: true,
        amount: 0,
        message: 'Ücretsiz Yükseltme Başarılı'
      });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
