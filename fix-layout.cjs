const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const target1 = `                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yeni Ödev / Görev Atama</span>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 xl:grid-cols-12 gap-2">
                    <div className="xl:col-span-6">
                      <input
                        type="text"
                        placeholder="Görev/ödev detayını yazın... (Örn: 150 Soru Paragraf)"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                      />
                    </div>
                    <div className="xl:col-span-3">
                      <select
                        value={newTaskSubject}
                        onChange={e => setNewTaskSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
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
                    <div className="xl:col-span-2">
                      <select
                        value={newTaskDay}
                        onChange={e => setNewTaskDay(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="Pazartesi">Pzt</option>
                        <option value="Salı">Salı</option>
                        <option value="Çarşamba">Çarş</option>
                        <option value="Perşembe">Perş</option>
                        <option value="Cuma">Cuma</option>
                        <option value="Cumartesi">Cmt</option>
                        <option value="Pazar">Paz</option>
                      </select>
                    </div>
                    <div className="xl:col-span-1">
                      <button
                        type="button"
                        onClick={handleCreateWeeklyTask}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Ata
                      </button>
                    </div>
                  </div>`;

const replacement1 = `                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yeni Ödev / Görev Atama</span>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Görev/ödev detayını yazın... (Örn: 150 Soru Paragraf)"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newTaskSubject}
                        onChange={e => setNewTaskSubject(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
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
                        className="w-[80px] shrink-0 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="Pazartesi">Pzt</option>
                        <option value="Salı">Salı</option>
                        <option value="Çarşamba">Çarş</option>
                        <option value="Perşembe">Perş</option>
                        <option value="Cuma">Cuma</option>
                        <option value="Cumartesi">Cmt</option>
                        <option value="Pazar">Paz</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateWeeklyTask}
                        className="px-3 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Ata
                      </button>
                    </div>
                  </div>`;

const regex1 = new RegExp(target1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
code = code.replace(regex1, replacement1);

const target2 = `                          <div key={subjKey} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">{label}</span>
                              <span className="text-cyan-400 font-mono">{completedInSubj}/{topics.length} (%{pct})</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: \`\${pct}%\` }}></div>
                            </div>
                          </div>`;

const replacement2 = `                          <button 
                            key={subjKey} 
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('subject-accordions');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                              setExpandedChecklistSubject(expandedChecklistSubject === subjKey ? null : subjKey);
                            }}
                            className="space-y-1 block w-full text-left cursor-pointer hover:bg-slate-900/50 p-2 rounded-lg transition-colors -m-2"
                          >
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">{label}</span>
                              <span className="text-cyan-400 font-mono">{completedInSubj}/{topics.length} (%{pct})</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: \`\${pct}%\` }}></div>
                            </div>
                          </button>`;

const regex2 = new RegExp(target2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
console.log('Replaced successfully');
