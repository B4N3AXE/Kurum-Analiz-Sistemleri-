const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{currentTab === 'mesaj' && 'MESAJ'}                    {/* Tab: KAS.ai AI Chatbot */}`;

const correct = `{currentTab === 'mesaj' && 'MESAJ'}
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-slate-950/95 backdrop-blur-xl z-40 flex flex-col overflow-y-auto">
              <div className="p-4 flex-1 flex flex-col gap-2">
                {/* Mobile Menu Items */}
                <button
                  onClick={() => { setCurrentTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={\`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer \${
                    currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900/40 text-slate-400 border border-slate-900/60'
                  }\`}
                >
                  <LayoutDashboard size={14} /> Panel Özeti
                </button>
                <button
                  onClick={() => { setCurrentTab('mesaj'); setIsMobileMenuOpen(false); }}
                  className={\`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer \${
                    currentTab === 'mesaj' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900/40 text-slate-400 border border-slate-900/60'
                  }\`}
                >
                  <Mail size={14} /> Mesaj Merkezi
                </button>
                {user.rol === 'admin' && (
                  <button
                    onClick={() => { setCurrentTab('taksit-yonetimi'); setIsMobileMenuOpen(false); }}
                    className={\`flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl w-full text-left transition cursor-pointer \${
                      currentTab === 'taksit-yonetimi' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900/40 text-slate-400 border border-slate-900/60'
                    }\`}
                  >
                    <Coins size={14} /> Taksit Takibi
                  </button>
                )}
                
                {/* Tab: KAS.ai AI Chatbot */}`;

code = code.replace(target, correct);
fs.writeFileSync('src/App.tsx', code);
