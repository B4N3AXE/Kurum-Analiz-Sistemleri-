const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const target1 = `                {/* Guidance Add note form (Only Counselor/Admin can add notes) */}
                {(user.rol === 'admin' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Görüşme veya gelişim notu girin..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow shadow-blue-500/10"
                    >
                      <Send size={12} /> Ekle
                    </button>
                  </form>
                )}`;

const rep1 = `                {/* Guidance Add note form (Only Counselor/Admin can add notes) */}
                {(user.rol === 'admin' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Görüşme veya gelişim notu girin..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow shadow-blue-500/20 cursor-pointer"
                    >
                      <Send size={14} /> Ekle
                    </button>
                  </form>
                )}`;

const target2 = `                {/* Add Teacher Advice Form (Only Admin, Teacher, Counselor can add) */}
                {(user.rol === 'admin' || user.rol === 'ogretmen' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddTavsiye} className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <select
                        value={newTavsiyeCourse}
                        onChange={e => setNewTavsiyeCourse(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none w-full shrink-0"
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
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Özel ders tavsiyesi ekleyin..."
                          value={newTavsiyeText}
                          onChange={e => setNewTavsiyeText(e.target.value)}
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                        >
                          <Send size={11} />
                        </button>
                      </div>
                    </div>
                  </form>
                )}`;

const rep2 = `                {/* Add Teacher Advice Form (Only Admin, Teacher, Counselor can add) */}
                {(user.rol === 'admin' || user.rol === 'ogretmen' || user.rol === 'rehber') && (
                  <form onSubmit={handleAddTavsiye} className="space-y-3">
                    <div className="flex flex-col gap-3">
                      <select
                        value={newTavsiyeCourse}
                        onChange={e => setNewTavsiyeCourse(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full shrink-0 shadow-inner"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shrink-0 cursor-pointer shadow shadow-emerald-500/20"
                      >
                        <Send size={14} /> Ekle
                      </button>
                    </div>
                  </form>
                )}`;

code = code.replace(target1, rep1);
code = code.replace(target2, rep2);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
