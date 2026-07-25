const fs = require('fs');
let code = fs.readFileSync('src/components/BildirimKutusu.tsx', 'utf8');

const target = `    // Default notifications generated per role
    let defaultList: NotificationItem[] = [];`;

const replacement = `    // Default notifications generated per role
    // Only generate defaults if there are no dbNotifications to avoid dummy data on live systems
    let defaultList: NotificationItem[] = [];`;

// Remove dummy defaults for new users
const defaultLogicTarget = `    if (user.rol === 'ogrenci') {`;
const defaultLogicReplacement = `    if (false && user.rol === 'ogrenci') { // Dummy notifications disabled for live`;

code = code.replace(defaultLogicTarget, defaultLogicReplacement);

fs.writeFileSync('src/components/BildirimKutusu.tsx', code);
console.log("PATCHED BİLDİRİM");
