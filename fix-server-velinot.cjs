const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target1 = `app.delete('/api/ogrenci/:id/not/:noteId', (req, res) => {
  const noteId = Number(req.params.noteId);
  const success = db.delete('rehberlik_notlari', noteId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Rehberlik notu bulunamadı.' });
  }
});`;

const rep1 = target1 + `

app.post('/api/ogrenci/:id/velinot', (req, res) => {
  const ogrenci_id = Number(req.params.id);
  const { ekleyen_id, not_metni } = req.body;
  if (!not_metni) {
    return res.status(400).json({ error: 'Not içeriği gereklidir.' });
  }
  const note = db.insert('veli_notlari', {
    ogrenci_id,
    veli_id: Number(ekleyen_id) || 4,
    not_metni,
    tarih: new Date().toISOString().split('T')[0]
  });
  
  // Find the user who added it to get their name
  const adder = db.getKullanicilar().find(u => u.id === note.veli_id);
  let ekleyenKisi = 'Veli';
  if (adder) {
    ekleyenKisi = adder.rol === 'admin' ? \`\${adder.ad_soyad} (Admin)\` : adder.ad_soyad;
  }

  res.json({
    veliNot: {
      ...note,
      ekleyen_kisi: ekleyenKisi,
      veli_adi: ekleyenKisi
    }
  });
});

app.delete('/api/ogrenci/:id/velinot/:noteId', (req, res) => {
  const noteId = Number(req.params.noteId);
  const success = db.delete('veli_notlari', noteId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Veli notu bulunamadı.' });
  }
});`;

code = code.replace(target1, rep1);

fs.writeFileSync('server.ts', code);
