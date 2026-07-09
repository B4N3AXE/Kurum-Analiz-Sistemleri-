import React, { useState } from 'react';
import { Coins, CheckCircle, Shield, CreditCard, Sparkles, AlertCircle, Zap, ShieldCheck, Landmark, Check, RefreshCw, Key } from 'lucide-react';

interface AbonelikProps {
  user: any;
  token: string;
  onUpgradeSuccess: (newPlan: string) => void;
  currentPlan: string;
  trialDaysLeft: number;
  setTrialDaysLeft: (days: number) => void;
}

export default function Abonelik({ user, token, onUpgradeSuccess, currentPlan, trialDaysLeft, setTrialDaysLeft }: AbonelikProps) {
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; title: string; price: string; isAnnual: boolean } | null>(null);
  
  // Card payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  // Payment processing states
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [processMessage, setProcessMessage] = useState('');
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  // Institution's Own Payment Gateway Settings
  const [merchantType, setMerchantType] = useState<'bank' | 'iyzico' | 'paytr' | 'stripe'>(
    () => (localStorage.getItem('kas_merchant_type') as any) || 'bank'
  );
  const [bankName, setBankName] = useState(() => localStorage.getItem('kas_bank_name') || 'Ziraat Bankası');
  const [bankOwner, setBankOwner] = useState(() => localStorage.getItem('kas_bank_owner') || '');
  const [bankIban, setBankIban] = useState(() => localStorage.getItem('kas_bank_iban') || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('kas_api_key') || '');
  const [apiSecret, setApiSecret] = useState(() => localStorage.getItem('kas_api_secret') || '');
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [integrationSuccess, setIntegrationSuccess] = useState('');

  // Auto format card number: 4-4-4-4
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add spaces every 4 characters
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  // Auto format expiry date: MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Auto format CVC: 3 digits
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvc(value);
  };

  // Detect Card Provider (Visa, Mastercard, Amex, Troy)
  const getCardProvider = () => {
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.startsWith('4')) return { name: 'Visa', color: 'from-blue-600 to-sky-500' };
    if (/^5[1-5]/.test(cleanNum)) return { name: 'Mastercard', color: 'from-orange-600 to-amber-500' };
    if (/^3[47]/.test(cleanNum)) return { name: 'Amex', color: 'from-emerald-600 to-teal-500' };
    if (/^9792/.test(cleanNum) || cleanNum.startsWith('65')) return { name: 'Troy', color: 'from-red-600 to-rose-500' };
    return { name: 'Kredi Kartı', color: 'from-slate-800 to-slate-900 border border-slate-700/60' };
  };

  const cardProvider = getCardProvider();

  // Simulate secure payment processing
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvc.length < 3) {
      alert("Lütfen tüm kart bilgilerini doğru formatta eksiksiz doldurun.");
      return;
    }

    setPaymentStep('processing');
    
    // Step 1: Verification
    setProcessMessage('Kart güvenlik algoritması (Luhn) doğrulanıyor...');
    
    setTimeout(() => {
      // Step 2: 3D Provisioning
      setProcessMessage('Banka 3D Secure provizyonu alınıyor ve provizyon kodu bekleniyor...');
      
      setTimeout(() => {
        // Step 3: Activation
        setProcessMessage('Provizyon alındı! SaaS lisans veri tabanı güncelleniyor ve aktivasyon tamamlanıyor...');
        
        setTimeout(() => {
          // Success
          setPaymentStep('success');
          if (selectedPlan) {
            onUpgradeSuccess(selectedPlan.id);
          }
        }, 1200);
      }, 1400);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">LİSANS & ABONELİK</span>
          <h2 className="text-2xl font-black text-slate-100">Hesap ve Faturalandırma Yönetimi</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Kurumunuzun dijital lisans durumunu inceleyin ve ödemelerinizi güvenle yönetin.</p>
        </div>

        {/* Plan Status Badges */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/10">
            <Coins size={18} className="text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Mevcut Lisansınız</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded ${
                currentPlan === 'trial' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                {currentPlan === 'trial' ? "14 Günlük Deneme Sürümü ⚡" : "Sınırsız Premium Lisansı 💎"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {paymentStep === 'form' && (
        <div className="space-y-10 animate-fade-in">
          {/* Main info cards */}
          {currentPlan === 'trial' && (
            <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-extrabold text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Zap size={15} /> Deneme Sürenizin Bitmesine {trialDaysLeft} Gün Kaldı!
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Deneme süreniz boyunca K.A.S'ın tüm özelliklerini sınırsız test edebilirsiniz. Bilgileriniz kaybolmadan tek fiyat avantajıyla yükseltebilirsiniz.
                </p>
              </div>
              <a 
                href="#planlar" 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shrink-0 animate-pulse"
              >
                Paketi İncele & Yükselt
              </a>
            </div>
          )}

          {/* Secure Checkout Overlay Dialog */}
          {selectedPlan && (
            <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-2xl relative scroll-mt-6 animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                ✕ Vazgeç
              </button>

              {/* Left checkout: Form input fields */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">GÜVENLİ 3D SECURE ÖDEME</span>
                  <h3 className="text-lg font-black text-slate-100">Kart Bilgilerinizi Girin</h3>
                  <p className="text-xs text-slate-500 font-semibold">256-bit SSL şifreli güvenli ödeme geçidi.</p>
                </div>

                <form onSubmit={handlePaySubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Kart Sahibinin Adı Soyadı</label>
                    <input
                      type="text"
                      required
                      placeholder="Kart üzerindeki isim"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Kart Numarası</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium tracking-widest"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {cardProvider.name}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Son Kullanma Tarihi</label>
                      <input
                        type="text"
                        required
                        placeholder="AA/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium tracking-wider text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Güvenlik Kodu (CVC)</label>
                      <input
                        type="password"
                        required
                        placeholder="***"
                        value={cardCvc}
                        onChange={handleCvcChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer flex justify-center items-center gap-2"
                  >
                    <Shield size={14} /> Ödemeyi Güvenle Tamamla ve Yükselt ({selectedPlan.price})
                  </button>
                </form>
              </div>

              {/* Right checkout: Live visual Credit Card Mockup & Order Summary */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-8">
                
                {/* Responsive Simulated Card Front View */}
                <div className={`w-full aspect-[1.586/1] bg-gradient-to-br ${cardProvider.color} rounded-2xl p-5 md:p-6 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  
                  {/* Top: Chip and Provider */}
                  <div className="flex justify-between items-start">
                    {/* Golden Chip representation */}
                    <div className="w-9 h-7 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-md opacity-85 border border-amber-300"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2 py-1 rounded">
                      {cardProvider.name}
                    </span>
                  </div>

                  {/* Middle: Number */}
                  <div className="py-2">
                    <span className="text-sm md:text-base font-bold font-mono tracking-widest block drop-shadow-md">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </span>
                  </div>

                  {/* Bottom: Name & Date */}
                  <div className="flex justify-between items-end text-[9px] uppercase font-bold tracking-wider">
                    <div>
                      <span className="text-[7px] text-slate-400 block font-black">Kart Sahibi</span>
                      <span className="block font-mono drop-shadow-md">{cardName || 'İSİM SOYAD'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-slate-400 block font-black">Son Kul.</span>
                      <span className="block font-mono">{cardExpiry || 'AA/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">SİPARİŞ ÖZETİ</span>
                  <div className="space-y-1.5 text-xs text-slate-300 font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{selectedPlan.title} ({selectedPlan.isAnnual ? 'Yıllık' : 'Aylık'})</span>
                      <span>{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">%18 KDV</span>
                      <span>Dahil</span>
                    </div>
                    <div className="border-t border-slate-800/80 pt-2 flex justify-between font-black text-slate-100 text-sm">
                      <span>Toplam Tutar</span>
                      <span className="text-blue-400">{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold leading-normal bg-slate-950/40 p-3 rounded-xl border border-slate-850/40">
                  <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                  <span>Kredi kartı bilgileriniz hiçbir şekilde sunucularımızda saklanmaz, doğrudan BDDK onaylı iyzico / Stripe ödeme geçidine iletilir.</span>
                </div>

              </div>
            </div>
          )}

          {/* Pricing Grid Section */}
          <div id="planlar" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">ŞEFFAF VE TEK FİYAT</span>
                <h3 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">K.A.S Sınırsız Portal Lisansı</h3>
                <p className="text-xs text-slate-400 font-medium">Bütün modüller, sınırsız öğrenci ve şube yönetimi tek paket altında birleşti.</p>
              </div>

              {/* Billing Toggle Switcher */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsAnnualBilling(false)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${!isAnnualBilling ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Aylık Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnualBilling(true)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition flex items-center gap-1 ${isAnnualBilling ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Yıllık Ödeme <span className="bg-emerald-500 text-slate-950 font-black text-[8px] px-1 rounded-md">%20 İndirim</span>
                </button>
              </div>
            </div>

            {/* Single Plan Card */}
            <div className="max-w-2xl mx-auto bg-gradient-to-b from-blue-500/10 to-slate-900/40 border border-blue-500/30 rounded-3xl p-6 md:p-8 space-y-6 relative hover:border-blue-500/50 transition-all duration-300 shadow-xl shadow-blue-500/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-blue-400">
                TEK LİSANS • HER ŞEY DAHİL
              </span>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <h4 className="text-lg font-black text-slate-100">K.A.S Sınırsız Premium Lisansı</h4>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Sınırsız Öğrenci, Veli, Şube ve Tüm Özellikler</span>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-50 tracking-tight">
                      {isAnnualBilling ? "₺750" : "₺950"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">/aylık</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-bold">
                    {isAnnualBilling ? "*Yıllık peşin (₺9.000) faturalandırılır." : "*Aylık faturalandırılır, iptal edilebilir."}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  "Sınırsız Öğrenci, Veli ve Öğretmen Girişi",
                  "Akıllı PDF Sınav Sonuç Analizi & OCR",
                  "YKS Hedef ve Sayaç Entegrasyonları",
                  "Birebir Ders Planlama & Çakışma Kontrolü",
                  "Rehberlik Görüşme Günlükleri",
                  "Karne & Rapor Çıktıları (PDF/Grafik)",
                  "E-posta & WhatsApp Destek Hattı",
                  "Sürekli Güncellenen SaaS Bulut Altyapısı"
                ].map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                    <CheckCircle size={12} className="text-blue-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPlan === 'premium'}
                onClick={() => {
                  setSelectedPlan({
                    id: "premium",
                    title: "K.A.S Sınırsız Premium",
                    price: isAnnualBilling ? "₺750" : "₺950",
                    isAnnual: isAnnualBilling
                  });
                  setTimeout(() => {
                    document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPlan === 'premium'
                    ? "bg-slate-950 border border-slate-850 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                }`}
              >
                {currentPlan === 'premium' ? "✓ Aktif Lisansınız" : "Sınırsız Premium'a Yükselt ⚡"}
              </button>
            </div>
          </div>


        </div>
      )}


      {paymentStep === 'processing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px] animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="text-blue-400 animate-pulse" size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-100">Güvenli 3D Secure Ödemesi Gerçekleştiriliyor</h3>
            <p className="text-xs text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
              Lütfen tarayıcınızı kapatmayın veya sayfayı yenilemeyin. İşleminiz SSL şifreli tünelde tamamlanmaktadır.
            </p>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-850 font-mono text-[10px] text-blue-400 font-bold">
            {processMessage}
          </div>
        </div>
      )}

      {paymentStep === 'success' && (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px] animate-fade-in relative overflow-hidden">
          {/* Confetti simulation overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>

          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/35 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
            <CheckCircle size={32} />
          </div>

          <div className="space-y-2 relative z-10">
            <h3 className="text-xl font-black text-slate-50">Ödeme Başarıyla Tamamlandı! 🎉</h3>
            <p className="text-xs text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
              Tebrikler! Kurumunuz başarıyla <strong className="text-slate-100 uppercase">{selectedPlan?.title}</strong> paketine yükseltildi. Lisans haklarınız anında aktif edildi.
            </p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1.5 text-xs text-slate-400 font-semibold max-w-md w-full text-left">
            <div className="flex justify-between">
              <span>Kurum:</span>
              <span className="text-slate-200 font-bold">{user.kurum_adi}</span>
            </div>
            <div className="flex justify-between">
              <span>Yeni Paket:</span>
              <span className="text-blue-400 font-black">{selectedPlan?.title}</span>
            </div>
            <div className="flex justify-between">
              <span>Fatura Tipi:</span>
              <span>{selectedPlan?.isAnnual ? 'Yıllık Peşin' : 'Aylık'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ödenen Tutar:</span>
              <span className="text-emerald-400 font-black">{selectedPlan?.price}</span>
            </div>
            <div className="flex justify-between text-[10px] border-t border-slate-850/80 pt-2 text-slate-500">
              <span>İşlem Referansı:</span>
              <span className="font-mono">KAS-TX-{(Math.random() * 1000000).toFixed(0)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPaymentStep('form');
              setSelectedPlan(null);
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/10"
          >
            Abonelik Sayfasına Dön
          </button>
        </div>
      )}
    </div>
  );
}
