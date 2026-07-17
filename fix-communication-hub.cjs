const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const targetHub = `            {/* School-Parent-Teacher Communication Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Rehberlik & Görüşme Notları */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>Rehberlik & Görüşme Notları</span>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={11} /> Rehber Panel
                  </span>
                </h4>

                {/* Guidance Add note form (Only Counselor/Admin can add notes) */}
                {(user.rol === 'admin' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Görüşme veya gelişim notu girin..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow shadow-blue-500/20"
                    >
                      <Send size={14} /> Notu Ekle
                    </button>
                  </form>
                )}

                {/* Notes display */}
                {detailData.notlar.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">Öğrenciye ait rehberlik veya görüşme kaydı bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailData.notlar.map(n => (
                      <div key={n.id} className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-blue-400">{n.rehber_adi}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">{n.tarih}</span>
                             {(user.rol === 'admin' || user.rol === 'rehber') && (
                              deleteConfirmNoteId === n.id ? (
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-red-500/30">
                                  <span className="text-[10px] text-red-400 font-bold px-1">Sil?</span>
                                  <button
                                    onClick={() => {
                                      handleDeleteNote(n.id);
                                      setDeleteConfirmNoteId(null);
                                    }}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-md cursor-pointer leading-none"
                                  >
                                    Evet
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmNoteId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-md cursor-pointer leading-none"
                                  >
                                    Hayır
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmNoteId(n.id)}
                                  className="text-slate-600 hover:text-red-400 transition ml-1 p-1"
                                  title="Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{n.not_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Öğretmenlerin Ders Tavsiyeleri */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>Öğretmen Ders Tavsiyeleri</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    📖 Ders Bazlı
                  </span>
                </h4>
                
                {/* Add Teacher Advice Form (Only Admin, Teacher, Counselor can add) */}
                {(user.rol === 'admin' || user.rol === 'ogretmen' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddTavsiye} className="space-y-3">
                    <div className="flex flex-col gap-3">
                      <select
                        value={newTavsiyeCourse}
                        onChange={e => setNewTavsiyeCourse(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full shrink-0 shadow-inner"
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Geometri">Geometri</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Rehberlik">Rehberlik</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Özel ders tavsiyesi ekleyin..."
                        value={newTavsiyeText}
                        onChange={e => setNewTavsiyeText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow shadow-emerald-500/20"
                      >
                        <Send size={14} /> Tavsiye Ekle
                      </button>
                    </div>
                  </form>
                )}

                {/* Teacher Advice display */}
                {!(detailData.tavsiyeler && detailData.tavsiyeler.length > 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">Eklenmiş ders tavsiyesi bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailData.tavsiyeler.map(t => (
                      <div key={t.id} className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-1 rounded-md uppercase">
                              {t.ders_adi}
                            </span>
                            <span className="text-[11px] font-black text-slate-300 truncate max-w-[100px]">{t.ogretmen_adi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {t.tarih ? new Date(t.tarih).toLocaleDateString('tr-TR') : ''}
                            </span>
                            {(user.rol === 'admin' || user.id === t.ogretmen_id) && (
                              deleteConfirmTavsiyeId === t.id ? (
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-red-500/30">
                                  <button
                                    onClick={() => {
                                      handleDeleteTavsiye(t.id);
                                      setDeleteConfirmTavsiyeId(null);
                                    }}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-md cursor-pointer leading-none"
                                  >
                                    Sil
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmTavsiyeId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-md cursor-pointer leading-none"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmTavsiyeId(t.id)}
                                  className="text-slate-600 hover:text-red-400 transition p-1"
                                  title="Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{t.tavsiye_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Veli Geri Bildirim Notları */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>Veli Geri Bildirim Notları</span>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    🏠 Evden Geri Bildirim
                  </span>
                </h4>
                
                {/* Veli Note form (Only Admin or Veli can add) */}
                {(user.rol === 'admin' || user.rol === 'veli') && (
                  <form onSubmit={handleAddVeliNote} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Velinin evdeki gözlemlerini ekleyin..."
                      value={newVeliNote}
                      onChange={e => setNewVeliNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow shadow-purple-500/20"
                    >
                      <Send size={14} /> Geri Bildirim Ekle
                    </button>
                  </form>
                )}

                {/* Veli notes display */}
                {!(detailData.veli_notlari && detailData.veli_notlari.length > 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">Veliden henüz bir geri bildirim notu gelmemiş.</div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailData.veli_notlari.map(v => (
                      <div key={v.id} className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-purple-400">{v.ekleyen_kisi}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {v.tarih ? new Date(v.tarih).toLocaleDateString('tr-TR') : ''}
                            </span>
                            {(user.rol === 'admin' || user.rol === 'veli') && (
                               <button
                                  onClick={() => handleDeleteVeliNote(v.id)}
                                  className="text-slate-600 hover:text-red-400 transition p-1"
                                  title="Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{v.not_metni}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>`;

let startIndex = code.indexOf('{/* School-Parent-Teacher Communication Hub */}');
if (startIndex !== -1) {
  // Find the end of the Hub which is just before the closing </div> of the main OgrenciPaneli
  // We can locate it by the end of Card 3: Veli Geri Bildirim Notları
  let endIndexSearch = code.indexOf('{/* End of Communication Hub */}', startIndex);
  
  if (endIndexSearch === -1) {
      // Find the end of the grid div
      let gridDivEnd = code.indexOf('</div>', code.indexOf('Card 3: Veli Geri Bildirim Notları'));
      // Keep finding closing divs until we get past it, let's just use regex or a robust replace
  }
}
