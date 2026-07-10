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

  // PayTR Secure Integration States
  const [payMethod, setPayMethod] = useState<'paytr' | 'simulation'>('paytr');
  const [paytrToken, setPaytrToken] = useState<string>('');
  const [paytrLoading, setPaytrLoading] = useState<boolean>(false);
  const [paytrError, setPaytrError] = useState<string>('');
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  const handlePaytrTokenFetch = async (plan: typeof selectedPlan) => {
    if (!plan) return;
    setPaytrLoading(true);
    setPaytrError('');
    setPaytrToken('');
    
    try {
      const numericPrice = plan.price === '₺750' ? 750 : 950;
      const totalAmount = plan.isAnnual ? numericPrice * 12 : numericPrice;
      
      const res = await fetch('/api/paytr/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          amount: totalAmount,
          isAnnualBilling: plan.isAnnual,
          userEmail: user?.email || 'dibiadam81@gmail.com',
          userName: user?.ad_soyad || 'K.A.S Kullanıcısı',
          userPhone: user?.telefon || '05555555555',
          userId: user?.id || 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPaytrToken(data.token);
          setIsSimulationMode(!!data.isSimulation);
        } else {
          setPaytrError(data.error || 'Token oluşturulamadı.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setPaytrError(errData.error || 'Ödeme sunucusuna bağlanırken hata oluştu.');
      }
    } catch (err: any) {
      setPaytrError('Bağlantı hatası: ' + err.message);
    } finally {
      setPaytrLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedPlan) {
      handlePaytrTokenFetch(selectedPlan);
    }
  }, [selectedPlan]);

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
            <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 relative scroll-mt-6 animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer z-10"
              >
                ✕ Vazgeç
              </button>

              {/* Payment Method Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 pt-2">
                <div>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">K.A.S LİSANS SİPARİŞİ</span>
                  <h3 className="text-lg font-black text-slate-100">Ödeme Sayfası</h3>
                  <p className="text-xs text-slate-500 font-semibold">PayTR BDDK güvenceli SSL korumalı altyapı.</p>
                </div>

                <div className="flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black items-center gap-1.5">
                  <ShieldCheck size={14} /> 3D Secure Güvenli Ödeme Aktif
                </div>
              </div>

              <div className="space-y-6">
                {paytrLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-slate-950 rounded-2xl border border-slate-850">
                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-bold text-slate-400">Güvenli PayTR ödeme tokenı oluşturuluyor, lütfen bekleyin...</p>
                  </div>
                )}

                {paytrError && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4 text-center">
                    <AlertCircle className="mx-auto text-red-500" size={32} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-200">Bağlantı Hatası</h4>
                      <p className="text-xs text-slate-400 font-medium">{paytrError}</p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePaytrTokenFetch(selectedPlan)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                      >
                        Yeniden Dene
                      </button>
                    </div>
                  </div>
                )}

                {paytrToken && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Real PayTR iFrame or Simulated interactive portal */}
                    <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-850 p-1 overflow-hidden min-h-[600px] flex flex-col justify-between">
                      {isSimulationMode ? (
                        <div className="p-8 flex flex-col justify-between h-full space-y-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-blue-600/15 border border-blue-500/25 rounded-lg text-blue-400">
                                <Shield size={16} />
                              </span>
                              <div>
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider block">GELİŞTİRİCİ / TEST MODU SİMÜLASYONU</span>
                                <h4 className="text-sm font-black text-slate-200">PayTR Entegrasyon Simülatörü</h4>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                              Tebrikler! PayTR backend imza doğrulama, token üretme ve güvenli yönlendirme altyapısı uygulamanızda başarıyla kuruldu.
                            </p>

                            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">ÜRETİLEN ÖDEME TOKENI (SHA256 HMAC)</span>
                              <code className="text-[10px] font-mono text-emerald-400 block break-all bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                                {paytrToken}
                              </code>
                            </div>

                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-1.5 text-[11px] text-amber-400 font-semibold leading-relaxed">
                              <h5 className="font-extrabold flex items-center gap-1">⚡ Gerçek Canlı Ödeme Almak İçin:</h5>
                              <p className="text-slate-400 font-medium text-[10px]">
                                Sol üstteki <strong>Settings &rarr; Secrets</strong> sekmesinden size ait olan <strong>PAYTR_MERCHANT_ID</strong>, <strong>PAYTR_MERCHANT_KEY</strong> ve <strong>PAYTR_MERCHANT_SALT</strong> değerlerini tanımlayın. Canlı (gerçek) ödeme almak için ayrıca <strong>PAYTR_TEST_MODE</strong> değerini <strong>0</strong> yapın. Bu değerler girildiğinde, sistemimiz otomatik olarak BDDK onaylı gerçek PayTR ödeme sayfasını güvenle yükleyecektir.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPaymentStep('processing');
                              setProcessMessage('Simüle edilmiş PayTR callback doğrulanıyor...');
                              setTimeout(() => {
                                setPaymentStep('success');
                                onUpgradeSuccess(selectedPlan.id);
                              }, 1500);
                            }}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex justify-center items-center gap-2"
                          >
                            <ShieldCheck size={14} /> Test Ödemesini Tamamla ve Premium'u Aktifleştir
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col">
                          <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> GERÇEK GÜVENLİ PAYTR EKRANI YÜKLENDİ
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono tracking-wide">SSL 256-BIT GÜVENLİ ÖDEME</span>
                          </div>

                          <iframe
                            src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
                            width="100%"
                            height="650px"
                            style={{ border: 'none', background: '#ffffff' }}
                            className="w-full bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side: Order Summary */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-8">
                      <div className="bg-slate-950 p-5 border border-slate-850 rounded-2xl space-y-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">SİPARİŞ ÖZETİ</span>
                        <div className="space-y-2 text-xs text-slate-300 font-semibold">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{selectedPlan.title} ({selectedPlan.isAnnual ? 'Yıllık' : 'Aylık'})</span>
                            <span>{selectedPlan.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">%18 KDV</span>
                            <span>Dahil</span>
                          </div>
                          <div className="border-t border-slate-800/80 pt-3 flex justify-between font-black text-slate-100 text-sm">
                            <span>Toplam Tutar</span>
                            <span className="text-blue-400">{selectedPlan.price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-bold leading-normal bg-slate-950/40 p-4 rounded-xl border border-slate-850/40">
                        <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                        <span>Ödemeleriniz doğrudan BDDK denetimindeki PayTR Sanal POS altyapısı üzerinden 3D Secure güvencesiyle tahsil edilir.</span>
                      </div>
                    </div>
                  </div>
                )}
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
