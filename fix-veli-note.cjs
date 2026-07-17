const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const handlerTarget = `  const handleAddNote = async (e: React.FormEvent) => {`;
const handlerRep = `  const handleAddVeliNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVeliNote.trim() || !selectedStudentId) return;

    try {
      const res = await fetch(\`/api/ogrenci/\${selectedStudentId}/velinot\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          ekleyen_id: user.id,
          not_metni: newVeliNote
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (detailData) {
          setDetailData({
            ...detailData,
            veli_notlari: [data.veliNot, ...(detailData.veli_notlari || [])]
          });
        }
        setNewVeliNote('');
      } else {
        const err = await res.json();
        alert('Geri bildirim eklenemedi: ' + err.error);
      }
    } catch (error) {
      console.error("Geri bildirim ekleme hatası:", error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {`;

code = code.replace(handlerTarget, handlerRep);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
