const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpointCode = `
// Super Admin Endpoints
app.get('/api/super-admin/users', (req, res) => {
  const users = db.getKullanicilar();
  const kurumlar = db.getKurumlar();
  
  const enrichedUsers = users.map(u => {
    const k = kurumlar.find(k => k.id === u.kurum_id);
    return {
      ...u,
      kurum_adi: k ? k.ad : null,
      abonelik_turu: k ? k.abonelik_turu : null
    };
  }).sort((a, b) => b.id - a.id);
  
  res.json(enrichedUsers);
});
`;

if (!code.includes('/api/super-admin/users')) {
  // Find a good place to insert it. e.g. after Auth endpoints.
  const authEnd = "app.post('/api/auth/login', (req, res) => {";
  code = code.replace(authEnd, endpointCode + '\n' + authEnd);
  fs.writeFileSync('server.ts', code);
  console.log('patched server.ts with super-admin users endpoint');
} else {
  console.log('endpoint already exists');
}
