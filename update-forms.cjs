const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const targetForm1 = `                 {/* Task Assigner Form (Coach assigns tasks) */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yeni Ödev / Görev Atama</span>
                  <div className="flex flex-col gap-3 mt-2">
                    <input
                      type="text"
                      placeholder="Görev/ödev detayını yazın... (Örn: 150 Soru Paragraf)"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={newTaskSubject}
                        onChange={e => setNewTaskSubject(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Genel Rehberlik">Rehberlik</option>
                      </select>
                      <select
                        value={newTaskDay}
                        onChange={e => setNewTaskDay(e.target.value)}
                        className="flex-1 sm:w-32 sm:flex-none bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="Pazartesi">Pazartesi</option>
                        <option value="Salı">Salı</option>
                        <option value="Çarşamba">Çarşamba</option>
                        <option value="Perşembe">Perşembe</option>
                        <option value="Cuma">Cuma</option>
                        <option value="Cumartesi">Cumartesi</option>
                        <option value="Pazar">Pazar</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateWeeklyTask}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus size={14} /> Ata
                      </button>
                    </div>
                  </div>
                </div>`;

const replaceForm1 = `                 {/* Task Assigner Form (Coach assigns tasks) */}
                <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest block pb-2 border-b border-slate-800/60">YENİ ÖDEV / GÖREV ATAMA</span>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Görev Detayı</label>
                      <input
                        type="text"
                        placeholder="Örn: 150 Soru Paragraf Çözülecek"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder-slate-600 shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Ders</label>
                        <select
                          value={newTaskSubject}
                          onChange={e => setNewTaskSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-inner"
                        >
                          <option value="Matematik">Matematik</option>
                          <option value="Türkçe">Türkçe</option>
                          <option value="Fizik">Fizik</option>
                          <option value="Kimya">Kimya</option>
                          <option value="Biyoloji">Biyoloji</option>
                          <option value="Tarih">Tarih</option>
                          <option value="Coğrafya">Coğrafya</option>
                          <option value="Felsefe">Felsefe</option>
                          <option value="Genel Rehberlik">Rehberlik</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Gün</label>
                        <select
                          value={newTaskDay}
                          onChange={e => setNewTaskDay(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-inner"
                        >
                          <option value="Pazartesi">Pazartesi</option>
                          <option value="Salı">Salı</option>
                          <option value="Çarşamba">Çarşamba</option>
                          <option value="Perşembe">Perşembe</option>
                          <option value="Cuma">Cuma</option>
                          <option value="Cumartesi">Cumartesi</option>
                          <option value="Pazar">Pazar</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateWeeklyTask}
                      className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.15)]"
                    >
                      <Plus size={16} /> Görevi Ata
                    </button>
                  </div>
                </div>`;

let regex = new RegExp(targetForm1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
code = code.replace(regex, replaceForm1);

const targetForm2 = `                 {/* Manual Log Adder */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manuel Çalışma Süresi Girişi (Koç Ekler)</span>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <select
                      value={manualSessionSubject}
                      onChange={e => setManualSessionSubject(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      <option value="Matematik">Matematik</option>
                      <option value="Türkçe">Türkçe</option>
                      <option value="Fizik">Fizik</option>
                      <option value="Kimya">Kimya</option>
                      <option value="Biyoloji">Biyoloji</option>
                      <option value="Tarih">Tarih</option>
                      <option value="Coğrafya">Coğrafya</option>
                      <option value="Felsefe">Felsefe</option>
                    </select>
                    <div className="flex gap-3">
                      <div className="flex-1 sm:w-32 sm:flex-none flex items-center justify-between gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase hidden sm:block">Süre:</span>
                        <div className="flex items-center gap-1 mx-auto sm:mx-0">
                          <input
                            type="number"
                            min="5"
                            max="300"
                            value={manualSessionDuration}
                            onChange={e => setManualSessionDuration(Number(e.target.value))}
                            className="w-12 bg-transparent border-none text-sm text-slate-100 font-bold font-mono focus:outline-none text-right sm:text-center"
                          />
                          <span className="text-[10px] text-slate-500 font-bold">dk</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateStudySession}
                        className="px-6 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Plus size={14} /> Kaydet
                      </button>
                    </div>
                  </div>
                </div>`;

const replaceForm2 = `                 {/* Manual Log Adder */}
                <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest block pb-2 border-b border-slate-800/60">Manuel Çalışma Süresi Ekleme</span>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Ders Seçimi</label>
                      <select
                        value={manualSessionSubject}
                        onChange={e => setManualSessionSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-medium cursor-pointer shadow-inner"
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block px-1">Çalışma Süresi (Dakika)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={manualSessionDuration}
                        onChange={e => setManualSessionDuration(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateStudySession}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    >
                      <Plus size={16} /> Çalışma Süresini Kaydet
                    </button>
                  </div>
                </div>`;

regex = new RegExp(targetForm2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
code = code.replace(regex, replaceForm2);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
