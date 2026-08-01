const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex1 = /app\.post\('\/api\/paytr\/token', async \(req, res\) => \{[\s\S]*?let final_amount = baseAmount;/;
const replacement1 = `app.post('/api/paytr/token', async (req, res) => {
  try {
    const { isAnnualBilling, couponCode, userEmail, userName, userPhone, userId, clientIp, planId } = req.body;

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
    const baseAmount = PLAN_PRICES[targetPlanId] || 39000;
    
    let final_amount = baseAmount;`;

code = code.replace(regex1, replacement1);

// Replace 100% discount auto upgrade
const regex2 = /if \(user && user\.kurum_id\) \{\s*db\.update\('kurumlar', user\.kurum_id, \{ abonelik_turu: 'premium' \}\);\s*console\.log\([^)]+\);\s*\}/;
const replacement2 = `if (user && user.kurum_id) {
        db.update('kurumlar', user.kurum_id, { abonelik_turu: targetPlanId });
        console.log(\`100% İndirim ile Üyelik Veritabanında Kalıcı Olarak Onaylandı! Kullanıcı: \${user.ad_soyad}, Kurum ID: \${user.kurum_id}, Plan: \${targetPlanId}\`);
      }`;
code = code.replace(regex2, replacement2);

// Replace merchant_oid generation
const regex3 = /const merchant_oid = `KAS\$\{userId\}X\$\{Date\.now\(\)\}`;/;
const replacement3 = `const merchant_oid = \`KAS\${userId}X\${targetPlanId}X\${Date.now()}\`;`;
code = code.replace(regex3, replacement3);

// Update callback parser
const regex4 = /if \(status === 'success' && merchant_oid && merchant_oid\.startsWith\('KAS'\)\) \{[\s\S]*?const payload = merchant_oid\.substring\(3\);[\s\S]*?const parts = payload\.split\('X'\);[\s\S]*?if \(parts\.length >= 2\) \{[\s\S]*?const userId = Number\(parts\[0\]\);[\s\S]*?const user = db\.getKullanicilar\(\)\.find\(u => u\.id === userId\);[\s\S]*?if \(user && user\.kurum_id\) \{[\s\S]*?db\.update\('kurumlar', user\.kurum_id, \{ abonelik_turu: 'premium' \}\);[\s\S]*?console\.log\(.*?\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}/;
const replacement4 = `if (status === 'success' && merchant_oid && merchant_oid.startsWith('KAS')) {
      const payload = merchant_oid.substring(3); // 'KAS' kaldır
      const parts = payload.split('X');
      if (parts.length >= 2) {
        const userId = Number(parts[0]);
        let purchasedPlan = 'premium';
        if (parts.length >= 3) {
           purchasedPlan = parts[1]; // The second part is the plan ID
        }
        const user = db.getKullanicilar().find(u => u.id === userId);
        if (user && user.kurum_id) {
          // Kurumun abonelik statüsünü veritabanında (db.json) kalıcı olarak güncelle
          db.update('kurumlar', user.kurum_id, { abonelik_turu: purchasedPlan });
          console.log(\`PayTR Bildirimi ile Üyelik Veritabanında Kalıcı Olarak Onaylandı! Kullanıcı: \${user.ad_soyad}, Kurum ID: \${user.kurum_id}, Plan: \${purchasedPlan}\`);
        }
      }
    }`;
code = code.replace(regex4, replacement4);

fs.writeFileSync('server.ts', code);
console.log('server.ts PayTR logic patched');
