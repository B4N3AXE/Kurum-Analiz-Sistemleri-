import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
app.get('/api/kullanici/liste', (req, res) => {
  const requester = getRequesterFromToken(req);
  if (!requester) {
    return res.status(401).json({ error: 'Kimlik doğrulaması başarısız.' });
  }
  const kurum_id = Number(req.query.kurum_id) || requester.kurum_id;
  const users = db.getKullanicilar()
    .filter(u => u.kurum_id === kurum_id)
    .map(u => ({
      id: u.id,
      ad_soyad: u.ad_soyad,
      rol: u.rol
    }));
  res.json(users);
});
`;

code = code.replace("app.get('/api/veli',", newRoute + "\napp.get('/api/veli',");
fs.writeFileSync('server.ts', code);
console.log('patched');
