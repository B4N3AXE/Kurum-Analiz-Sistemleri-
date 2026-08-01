const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div className="md:col-span-2 lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 mb-4">
                  <h4 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    Tüm Paketlerde Bulunan Sınırsız Özellikler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "🤖 KAS.ai Yapay Zeka Analiz Motoru (Konu/Kazanım Tespiti & Akıllı Rehberlik)",
                      "👨‍🏫 Sınırsız Öğretmen & Personel Tanımlama (Kişi başı ücret yok)",
                      "🏫 Sınırsız Sınıf & Şube Oluşturma",
                      "📊 Sınırsız Deneme Sınavı Yükleme & PDF Raporlama",
                      "📱 Öğrenci & Veli Analiz Paneli Erişimi"
                    ].map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {[
                  {
                    title: 'Mikro Paket',
                    capacity: '0 - 25 Öğrenci',
                    desc: 'VIP Özel Ders Büroları ve Bireysel Koçlar İçin.',
                    features: [
                      '🤖 KAS.ai Temel Sınav & Net Analizi',
                      '📄 Otomatik PDF Öğrenci Karnesi Oluşturma',
                      '📊 Konu & Kazanım Eksik Tespiti',
                      '♾️ Sınırsız Öğretmen & Sınıf Ekleme'
                    ]
                  },
                  {
                    title: 'Bronz Paket',
                    capacity: '25 - 50 Öğrenci',
                    desc: 'Butik Kurslar ve VIP Etüt Merkezleri İçin.',
                    features: [
                      'Mikro Paket Özelliklerinin Tamamı',
                      '🧠 KAS.ai Derin Konu & Soru Tipi Analizi',
                      '📈 Sınıf Genel Başarı ve Öğrenme Kaybı Grafikleri',
                      '💬 Tek Tıkla Veliye Gönderilebilir AI Rapor Özetleri'
                    ]
                  },
                  {
                    title: 'Gümüş Paket',
                    capacity: '50 - 100 Öğrenci',
                    desc: 'Büyümekte Olan Hazırlık Kursları İçin.',
                    features: [
                      'Bronz Paket Özelliklerinin Tamamı',
                      '🎯 KAS.ai Akıllı Çalışma & Soru Çözüm Tavsiye Motoru',
                      '📱 WhatsApp / SMS Formatında Hazır AI Veli Bildirimleri',
                      '🔍 Öğrenci Bazlı İlerleme ve Hedef Takip Analitiği'
                    ]
                  },
                  {
                    title: 'Altın (Gold) Paket',
                    capacity: '100 - 150 Öğrenci',
                    desc: 'Butik Dershaneler İçin Tam Kapsamlı AI Çözümü.',
                    features: [
                      'Gümüş Paket Özelliklerinin Tamamı',
                      '🎨 Kuruma Özel Logo & Tema Özelleştirme',
                      '📊 Detaylı Ders & Branş Bazlı Performans Raporları',
                      '⚡ VIP Hızlı Destek & Kurulum Rehberliği'
                    ]
                  },
                  {
                    title: 'Platin (Platinum) Paket',
                    capacity: '150 - 200 Öğrenci',
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
                    title: 'Elmas (Diamond) / Kurumsal',
                    capacity: '200+ Öğrenci & Çoklu Şube',
                    desc: 'Büyük Dershaneler, Kolejler ve Franchise Markalar İçin.',
                    features: [
                      '🏢 Çoklu Şube & Merkezi Kampüs Yönetimi',
                      '🤝 Kuruma Özel Birebir Müşteri Temsilcisi & 7/24 VIP Destek',
                      '🔌 Özel Veri & API Entegrasyonları',
                      '🛠️ Kuruma Özel Eğitim ve Yerinde Kurulum Desteği'
                    ]
                  }
                ].map((plan, i) => (
                  <div key={i} className={\`border bg-slate-900/40 rounded-3xl p-6 flex flex-col justify-between relative transition-all duration-300 \${plan.isPopular ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 scale-105 z-10' : 'border-slate-800 hover:border-slate-700'}\`}>
                    {plan.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-blue-400/50 shadow-md">
                        EN POPÜLER
                      </span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{plan.capacity}</span>
                        <h4 className="text-xl font-black text-slate-100 mt-1">{plan.title}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-2">{plan.desc}</p>
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
                  </div>
                ))}
              </div>
`;

// Replace from: <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
// to:           {/* Dashboard Preview Overlay Section */}
const startIdx = app.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">');
const endIdx = app.indexOf('{/* Dashboard Preview Overlay Section */}');

if(startIdx !== -1 && endIdx !== -1) {
  app = app.substring(0, startIdx) + replacement + "\n" + app.substring(endIdx);
  fs.writeFileSync('src/App.tsx', app);
  console.log('App.tsx updated');
} else {
  console.log('Could not find replace bounds');
}
