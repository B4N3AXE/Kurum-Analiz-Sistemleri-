const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const target = `             localStorage.setItem('kas_subscription_plan', 'premium');
             if (user && user.kurum_id) {
               localStorage.setItem(\`kas_subscription_plan_kurum_\${user.kurum_id}\`, 'premium');
             }`;

const replacement = `             localStorage.setItem('kas_subscription_plan', 'premium');
             if (user && user.kurum_id) {
               localStorage.setItem(\`kas_subscription_plan_kurum_\${user.kurum_id}\`, 'premium');
               try {
                 const storedUser = JSON.parse(localStorage.getItem('kas_user') || '{}');
                 storedUser.abonelik_turu = 'premium';
                 localStorage.setItem('kas_user', JSON.stringify(storedUser));
               } catch (e) {}
             }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log("PATCHED ABONELIK UPGRADE");
