const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const oldCode = `<div className="flex flex-col justify-center min-h-[64px] py-2">
                      {plan.isCustom ? (
                        <span className="text-2xl font-black text-slate-50 tracking-tight">Özel Teklif</span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-50 tracking-tight">
                              ₺{new Intl.NumberFormat('tr-TR').format(Math.round(plan.price / 12))}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">/ ay</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 mt-1">
                            {isAnnualBilling ? \`(Yıllık ₺\${new Intl.NumberFormat('tr-TR').format(plan.price)} olarak faturalandırılır)\` : "(Aylık faturalandırılır)"}
                          </span>
                        </>
                      )}
                    </div>`;

const newCode = `<div className="flex flex-col justify-center min-h-[64px] py-2">
                      {plan.isCustom ? (
                        <span className="text-2xl font-black text-slate-50 tracking-tight">Özel Teklif</span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-50 tracking-tight">
                              ₺{!isAnnualBilling ? new Intl.NumberFormat('tr-TR').format(Math.round(plan.price / 12)) : new Intl.NumberFormat('tr-TR').format(plan.price)}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">{!isAnnualBilling ? "/ ay" : "/ yıl"}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 mt-1">
                            {!isAnnualBilling ? \`(Yıllık ₺\${new Intl.NumberFormat('tr-TR').format(plan.price)} olarak faturalandırılır)\` : \`(Aylık ₺\${new Intl.NumberFormat('tr-TR').format(Math.round(plan.price / 12))} avantajıyla)\`}
                          </span>
                        </>
                      )}
                    </div>`;

if (code.includes(oldCode)) {
  code = code.split(oldCode).join(newCode);
  fs.writeFileSync('src/components/Abonelik.tsx', code);
  console.log('patched');
} else {
  console.log('old code not found');
}
