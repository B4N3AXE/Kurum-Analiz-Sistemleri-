import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
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
      rol: u.rol,
      telefon: u.telefon || ''
    }));
  
  // also add students
  const classes = db.getSiniflar().filter(c => c.kurum_id === kurum_id).map(c => c.id);
  const students = db.getOgrenciler()
    .filter(s => classes.includes(s.sinif_id))
    .map(s => ({
      id: s.id + 10000,
      ad_soyad: s.ad_soyad,
      rol: 'ogrenci',
      telefon: ''
    }));
    
  res.json([...users, ...students]);
});
`;

code = code.replace(/app\.get\('\/api\/kullanici\/liste'[\s\S]*?res\.json\(users\);\n\}\);/, replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('patched');
