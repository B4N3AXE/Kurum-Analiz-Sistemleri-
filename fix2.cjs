const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `currentTab === 'mesaj'
                          ? "bg-blue-600 text-white shadow"
                          : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                      }\`}
                    >
                      <Mail size={14} /> Mesaj Merkezi
                    </button>

                    {/* Taksit Yönetimi */}
                    {user.rol === 'admin' && (
                      <button
                        onClick={() => { setCurrentTab('taksit-yonetimi'); setIsMobileMenuOpen(false); }}
                        className={\`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer \${
                          currentTab === 'taksit-yonetimi'
                            ? "bg-blue-600 text-white shadow"
                            : "bg-slate-900/40 text-slate-400 border border-slate-900/60"
                        }\`}
                      >
                        <Coins size={14} /> Taksit Takibi
                      </button>
                    )}`;

const replacement = `                {currentTab === 'mesaj' && 'MESAJ'}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
