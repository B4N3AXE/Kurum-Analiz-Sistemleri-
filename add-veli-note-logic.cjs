const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const stateTarget = `  const [newNote, setNewNote] = useState('');`;
const stateRep = `  const [newNote, setNewNote] = useState('');
  const [newVeliNote, setNewVeliNote] = useState('');`;

const handlerTarget = `  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedStudentId) return;

    try {
      const db = getDb();
      const st = db.prepare(\`
        INSERT INTO rehberlik_notlari (ogrenci_id, rehber_id, rehber_adi, not_metni, tarih)
        VALUES (?, ?, ?, ?, ?)
      \`);
      st.run(selectedStudentId, user.id, user.ad_soyad, newNote, new Date().toISOString());
      
      setNewNote('');
      fetchStudentDetails(selectedStudentId);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };`;

const handlerRep = handlerTarget + `

  const handleAddVeliNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVeliNote.trim() || !selectedStudentId) return;

    try {
      const db = getDb();
      const st = db.prepare(\`
        INSERT INTO veli_notlari (ogrenci_id, veli_id, veli_adi, not_metni, tarih)
        VALUES (?, ?, ?, ?, ?)
      \`);
      // If admin adds it, just say Admin, if veli, say user.ad_soyad
      const adderName = user.rol === 'admin' ? \`\${user.ad_soyad} (Admin)\` : user.ad_soyad;
      st.run(selectedStudentId, user.id, adderName, newVeliNote, new Date().toISOString());
      
      setNewVeliNote('');
      fetchStudentDetails(selectedStudentId);
    } catch (error) {
      console.error("Error adding veli note:", error);
    }
  };`;

const uiTarget = `                {/* Veli Geri Bildirim display */}
                {!(detailData.veli_notlari && detailData.veli_notlari.length > 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">Veliden henüz bir geri bildirim notu gelmemiş.</div>
                ) : (`;

const uiRep = `                {/* Veli Note form (Only Admin or Veli can add) */}
                {(user.rol === 'admin' || user.rol === 'veli') && (
                  <form onSubmit={handleAddVeliNote} className="flex flex-col gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Velinin evdeki gözlemlerini ekleyin..."
                      value={newVeliNote}
                      onChange={e => setNewVeliNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow shadow-purple-500/20 cursor-pointer"
                    >
                      <Send size={14} /> Geri Bildirim Ekle
                    </button>
                  </form>
                )}

                {/* Veli Geri Bildirim display */}
                {!(detailData.veli_notlari && detailData.veli_notlari.length > 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">Veliden henüz bir geri bildirim notu gelmemiş.</div>
                ) : (`;

code = code.replace(stateTarget, stateRep);
code = code.replace(handlerTarget, handlerRep);
code = code.replace(uiTarget, uiRep);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
