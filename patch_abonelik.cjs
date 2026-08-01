const fs = require('fs');
let code = fs.readFileSync('src/components/Abonelik.tsx', 'utf8');

const replacement = `
          {/* Pricing Grid Section */}
          <div id="planlar" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">ŞEFFAF VE ESNEK FİYATLANDIRMA</span>
                <h3 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">K.A.S Abonelik Paketleri</h3>
                <p className="text-xs text-slate-400 font-medium">Kurumunuzun kapasitesine en uygun paketi seçerek sınırsız yapay zeka deneyimine başlayın.</p>
              </div>
            </div>

            {/* Common Features Banner */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
              <h4 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                Tüm Paketlerde Bulunan Ortak Özellikler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "🤖 KAS.ai Yapay Zeka Analiz Motoru",
                  "👨‍🏫 Sınırsız Öğretmen & Personel Tanımlama",
                  "🏫 Sınırsız Sınıf & Şube Oluşturma",
                  "📊 Sınırsız Deneme Sınavı Yükleme",
                  "📱 Öğrenci & Veli Analiz Paneli Erişimi"
                ].map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                {
                  id: 'mikro',
                  title: 'Mikro Paket',
                  capacity: '0 - 25 Öğrenci',
                  price: 2900,
                  desc: 'VIP Özel Ders Büroları ve Bireysel Koçlar İçin.',
                  features: [
                    '🤖 KAS.ai Temel Sınav & Net Analizi',
                    '📄 Otomatik PDF Öğrenci Karnesi Oluşturma',
                    '📊 Konu & Kazanım Eksik Tespiti',
                    '♾️ Sınırsız Öğretmen & Sınıf Ekleme'
                  ]
                },
                {
                  id: 'bronz',
                  title: 'Bronz Paket',
                  capacity: '25 - 50 Öğrenci',
                  price: 5900,
                  desc: 'Butik Kurslar ve VIP Etüt Merkezleri İçin.',
                  features: [
                    'Mikro Paket Özelliklerinin Tamamı',
                    '🧠 KAS.ai Derin Konu & Soru Tipi Analizi',
                    '📈 Sınıf Genel Başarı ve Öğrenme Kaybı Grafikleri',
                    '💬 Tek Tıkla Veliye Gönderilebilir AI Rapor Özetleri'
                  ]
                },
                {
                  id: 'gumus',
                  title: 'Gümüş Paket',
                  capacity: '50 - 100 Öğrenci',
                  price: 9900,
                  desc: 'Büyümekte Olan Hazırlık Kursları İçin.',
                  features: [
                    'Bronz Paket Özelliklerinin Tamamı',
                    '🎯 KAS.ai Akıllı Çalışma & Soru Çözüm Tavsiye Motoru',
                    '📱 WhatsApp / SMS Formatında Hazır AI Veli Bildirimleri',
                    '🔍 Öğrenci Bazlı İlerleme ve Hedef Takip Analitiği'
                  ]
                },
                {
                  id: 'altin',
                  title: 'Altın (Gold) Paket',
                  capacity: '100 - 150 Öğrenci',
                  price: 14900,
                  desc: 'Butik Dershaneler İçin Tam Kapsamlı AI Çözümü.',
                  features: [
                    'Gümüş Paket Özelliklerinin Tamamı',
                    '🎨 Kuruma Özel Logo & Tema Özelleştirme',
                    '📊 Detaylı Ders & Branş Bazlı Performans Raporları',
                    '⚡ VIP Hızlı Destek & Kurulum Rehberliği'
                  ]
                },
                {
                  id: 'platin',
                  title: 'Platin (Platinum) Paket',
                  capacity: '150 - 200 Öğrenci',
                  price: 24500,
                  desc: 'Standart Dershaneler ve Hazırlık Kursları İçin.',
                  isPopular: true,
                  features: [
                    'Altın Paket Özelliklerinin Tamamı',
                    '👨‍🏫 KAS.ai Zümre & Öğretmen Performans AI Analizi',
                    '🎓 YKS / LGS Tahmini Sıralama & Başarı Motoru',
                    '📞 VIP Hızlı Destek & Birebir Kurulum Eğitimi'
                  ]
                },
                {
                  id: 'elmas',
                  title: 'Elmas (Diamond) / Kurumsal',
                  capacity: '200+ Öğrenci & Çoklu Şube',
                  price: 0,
                  isCustom: true,
                  desc: 'Büyük Dershaneler, Kolejler ve Franchise Markalar İçin.',
                  features: [
                    '🏢 Çoklu Şube & Merkezi Kampüs Yönetimi',
                    '🤝 Kuruma Özel Birebir Müşteri Temsilcisi & 7/24 VIP Destek',
                    '🔌 Özel Veri & API Entegrasyonları',
                    '🛠️ Kuruma Özel Eğitim ve Yerinde Kurulum Desteği'
                  ]
                }
              ].map((plan, i) => (
                <div key={i} className={\`bg-gradient-to-b \${plan.isPopular ? 'from-blue-500/10 to-slate-900/40 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-105 z-10' : 'from-slate-900/40 to-slate-950/40 border-slate-800 hover:border-slate-700'} border rounded-3xl p-6 flex flex-col justify-between relative transition-all duration-300\`}>
                  {plan.isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-blue-400/50 shadow-md">
                      EN POPÜLER
                    </span>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{plan.capacity}</span>
                      <h4 className="text-xl font-black text-slate-100 mt-1">{plan.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-2 min-h-[32px]">{plan.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2 pb-2">
                      {plan.isCustom ? (
                        <span className="text-2xl font-black text-slate-50 tracking-tight">Özel Teklif</span>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-slate-50 tracking-tight">
                            ₺{new Intl.NumberFormat('tr-TR').format(plan.price)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">/yıllık</span>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
                      {plan.features.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 font-medium">
                          <CheckCircle size={12} className="text-blue-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={currentPlan === plan.id}
                    onClick={() => {
                      if (plan.isCustom) {
                        alert('Özel teklif için lütfen müşteri temsilcimizle (0850 000 00 00) iletişime geçin.');
                        return;
                      }
                      setSelectedPlan({
                        id: plan.id,
                        title: plan.title,
                        price: \`₺\${new Intl.NumberFormat('tr-TR').format(plan.price)}\`,
                        priceNum: plan.price,
                        isAnnual: true
                      });
                      setTimeout(() => {
                        document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className={\`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer \${
                      currentPlan === plan.id
                        ? "bg-slate-950 border border-slate-850 text-slate-500 cursor-not-allowed"
                        : plan.isPopular 
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                    }\`}
                  >
                    {currentPlan === plan.id ? "✓ Aktif Lisansınız" : plan.isCustom ? "İletişime Geç" : "Bu Planı Seç ⚡"}
                  </button>
                </div>
              ))}
            </div>
          </div>
`;

const startIdx = code.indexOf('{/* Pricing Grid Section */}');
const endIdx = code.indexOf('{paymentStep === \'processing\' && (');

if(startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + replacement + "\n\n        " + code.substring(endIdx - 11);
  fs.writeFileSync('src/components/Abonelik.tsx', code);
  console.log('Abonelik.tsx updated');
} else {
  console.log('Could not find replace bounds');
}
