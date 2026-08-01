const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const injection = `
  const getPlanCapacity = (planId: string | undefined): number | null => {
    if (!planId) return null;
    const p = planId.toLowerCase();
    if (p === 'mikro') return 25;
    if (p === 'bronz') return 50;
    if (p === 'gumus') return 100;
    if (p === 'altin') return 150;
    if (p === 'platin') return 200;
    if (p === 'trial') return 25;
    return null;
  };
  const planCapacity = getPlanCapacity(user?.abonelik_turu);
  const studentRatio = planCapacity ? Math.min(100, Math.round(((stats.totalStudents || 0) / planCapacity) * 100)) : 0;
`;

code = code.replace(/export default function Dashboard\(\{ user, token \}: DashboardProps\) \{/, `export default function Dashboard({ user, token }: DashboardProps) {` + injection);

const oldCard = `<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Toplam Öğrenci</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tracking-tight">{stats.totalStudents ?? 0}</span>
                <span className="text-xs font-extrabold text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">+12 Bu Ay</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Aktif Kayıtlı Öğrenci Portföyü</p>`;

const newCard = `<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Toplam Öğrenci</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tracking-tight">
                  {stats.totalStudents ?? 0}{planCapacity ? \` / \${planCapacity}\` : ''}
                </span>
                <span className="text-xs font-extrabold text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">+12</span>
              </div>
              {planCapacity && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-[#4F7DFF] h-1.5 rounded-full" style={{ width: \`\${studentRatio}%\` }}></div>
                </div>
              )}
              <p className="text-[11px] font-bold text-slate-400 mt-2">Aktif Kayıtlı Öğrenci Portföyü</p>`;

code = code.split(oldCard).join(newCard);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('patched Dashboard.tsx');
