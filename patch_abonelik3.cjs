const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

// 1. Add the toggle switch
const headerRegex = /<h3 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">K\.A\.S Abonelik Paketleri<\/h3>\n\s*<p className="text-xs text-slate-400 font-medium">Kurumunuzun kapasitesine en uygun paketi seçerek sınırsız yapay zeka deneyimine başlayın\.<\/p>\n\s*<\/div>\n\s*<\/div>/;

const toggleHtml = `<h3 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">K.A.S Abonelik Paketleri</h3>
                <p className="text-xs text-slate-400 font-medium">Kurumunuzun kapasitesine en uygun paketi seçerek sınırsız yapay zeka deneyimine başlayın.</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                <button 
                  onClick={() => setIsAnnualBilling(false)}
                  className={\`px-4 py-2 text-[11px] font-extrabold rounded-xl transition-all \${!isAnnualBilling ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
                >
                  Aylık Gösterim
                </button>
                <button 
                  onClick={() => setIsAnnualBilling(true)}
                  className={\`px-4 py-2 text-[11px] font-extrabold rounded-xl transition-all \${isAnnualBilling ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
                >
                  Yıllık Gösterim
                </button>
              </div>
            </div>`;

code = code.replace(headerRegex, toggleHtml);

// 2. Fix the plan pricing display
const priceBlockRegex = /<div className="flex items-baseline gap-1 pt-2 pb-2">\n\s*\{plan\.isCustom \? \(\n\s*<span className="text-2xl font-black text-slate-50 tracking-tight">Özel Teklif<\/span>\n\s*\) : \(\n\s*<>\n\s*<span className="text-3xl font-black text-slate-50 tracking-tight">\n\s*₺\{new Intl\.NumberFormat\('tr-TR'\)\.format\(plan\.price\)\}\n\s*<\/span>\n\s*<span className="text-\[10px\] font-bold text-slate-500">\/yıllık<\/span>\n\s*<\/>\n\s*\)\}\n\s*<\/div>/g;

const newPriceBlock = `<div className="flex flex-col justify-center min-h-[64px] py-2">
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
                    </div>`;

code = code.replace(priceBlockRegex, newPriceBlock);

// 3. Fix the checkout sidebar price display
// Current: {selectedPlan.isAnnual && appliedCoupon === 'YENISEZON10' ? "₺35.100" : (selectedPlan.isAnnual ? "₺39.000" : "₺3.250")}
const checkoutPriceRegex = /\{selectedPlan\.isAnnual && appliedCoupon === 'YENISEZON10' \? "₺35\.100" : \(selectedPlan\.isAnnual \? "₺39\.000" : "₺3\.250"\)\}/g;
const checkoutPriceReplacement = `{(() => {
                              let finalVal = selectedPlan.priceNum;
                              if (appliedCoupon === 'YENISEZON10') finalVal = finalVal * 0.9;
                              else if (appliedCoupon === 'KURUM100' || appliedCoupon === 'KAS100') finalVal = 0;
                              return "₺" + new Intl.NumberFormat('tr-TR').format(finalVal);
                            })()}`;
code = code.replace(checkoutPriceRegex, checkoutPriceReplacement);

// Fix another old hardcode logic: 
// 1. price: isAnnualBilling ? "₺35.100" : "₺3.250",
// 2. priceNum: isAnnualBilling ? 35100 : 3250
const trialUpgradeRegex = /price: isAnnualBilling \? "₺35\.100" : "₺3\.250",\n\s*isAnnual: isAnnualBilling/g;
const trialUpgradeReplacement = `price: "₺" + new Intl.NumberFormat('tr-TR').format(39000),
                    priceNum: 39000,
                    isAnnual: true`;
code = code.replace(trialUpgradeRegex, trialUpgradeReplacement);

fs.writeFileSync('src/components/Abonelik.tsx', code);
console.log('Abonelik patched');
