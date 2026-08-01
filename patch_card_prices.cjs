const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const regex = /<div className="flex flex-col justify-center min-h-\[64px\] py-2">[\s\S]*?\{plan\.isCustom \? \([\s\S]*?<span className="text-2xl font-black text-slate-50 tracking-tight">Özel Teklif<\/span>[\s\S]*?\) : \([\s\S]*?<>\n\s*<div className="flex items-baseline gap-1">[\s\S]*?<span className="text-4xl font-black text-slate-50 tracking-tight">[\s\S]*?₺\{\!isAnnualBilling \? new Intl\.NumberFormat\('tr-TR'\)\.format\(Math\.round\(plan\.price \/ 12\)\) : new Intl\.NumberFormat\('tr-TR'\)\.format\(plan\.price\)\}[\s\S]*?<\/span>[\s\S]*?<span className="text-\[11px\] font-bold text-slate-500">\{\!isAnnualBilling \? "\/ ay" : "\/ yıl"\}<\/span>[\s\S]*?<\/div>[\s\S]*?\{\!isAnnualBilling && \([\s\S]*?<span className="text-\[10px\] font-semibold text-slate-400 mt-1">[\s\S]*?\(Yıllık ₺\{new Intl\.NumberFormat\('tr-TR'\)\.format\(plan\.price\)\} olarak faturalandırılır\)[\s\S]*?<\/span>[\s\S]*?\)[\s\S]*?<\/div>/g;

const replacement = `<div className="flex flex-col justify-center min-h-[64px] py-2">
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

// Wait, the regex might fail. I'll just use string replacement.
code = code.split(`<div className="flex flex-col justify-center min-h-[64px] py-2">
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
                          {!isAnnualBilling && (
                            <span className="text-[10px] font-semibold text-slate-400 mt-1">
                              (Yıllık ₺{new Intl.NumberFormat('tr-TR').format(plan.price)} olarak faturalandırılır)
                            </span>
                          )}
                        </>
                      )}
                    </div>`).join(replacement);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('patched card display');
