const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const target1 = `<span className="text-xs font-black text-slate-200 tracking-wide uppercase">{subjKey === 'turkce' ? 'TÜRKÇE' : subjKey === 'matematik' ? 'MATEMATİK' : subjKey === 'sosyal' ? 'SOSYAL BİLGİLER' : 'FEN BİLİMLERİ'}</span>`;

const replace1 = `<span className="text-xs font-black text-slate-200 tracking-wide uppercase">{subjKey.toUpperCase().replace(/_/g, ' ')}</span>`;

code = code.replace(target1, replace1);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
