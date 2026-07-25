const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const target = `              <a 
                href="#planlar" 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shrink-0 animate-pulse"
              >
                Paketi İncele & Yükselt
              </a>`;

const replacement = `              <button 
                type="button"
                onClick={() => {
                   document.getElementById('planlar')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shrink-0 animate-pulse"
              >
                Paketi İncele & Yükselt
              </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log("PATCHED ABONELIK SCROLL");
