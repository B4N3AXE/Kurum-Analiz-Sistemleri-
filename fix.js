const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "currentTab === 'mesaj'\n                          ? \"bg-blue-600 text-white shadow\"\n                          : \"bg-slate-900/40 text-slate-400 border border-slate-900/60\"\n                      }`}";

const correct = `currentTab === 'mesaj'
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

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes("currentTab === 'mesaj'"));
if (startIdx !== -1) {
    // Find the end of this block
    const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes("<Mail size={14} /> Mesaj Merkezi"));
    if (endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 2, correct);
    }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'));
