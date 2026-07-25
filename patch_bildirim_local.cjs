const fs = require('fs');
let code = fs.readFileSync('src/components/BildirimKutusu.tsx', 'utf8');

const target = `  useEffect(() => {
    const storageKey = \`kas_notifications_user_\${user.id}\`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }`;

const replacement = `  useEffect(() => {
    const storageKey = \`kas_notifications_user_\${user.id}\`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear dummy data
        if (!parsed.some(p => p.id === 'n1' || p.id === 'n1_admin')) {
            setNotifications(parsed);
        } else {
            setNotifications([]);
            localStorage.removeItem(storageKey);
        }
        return;
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/BildirimKutusu.tsx', code);
console.log("PATCHED BİLDİRİM LOCAL STORAGE");
