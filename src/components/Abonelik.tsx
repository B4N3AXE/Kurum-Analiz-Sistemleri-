import React, { useState } from 'react';
import { Coins, CheckCircle, Shield, CreditCard, Sparkles, AlertCircle, Zap, ShieldCheck, Landmark, Check, RefreshCw, Key } from 'lucide-react';

interface AbonelikProps {
  user: any;
  token: string;
  onUpgradeSuccess: (newPlan: string) => void;
  currentPlan: string;
  trialDaysLeft: number;
  setTrialDaysLeft: (days: number) => void;
  trialTimeLeftStr?: string;
}

export default function Abonelik({ user, token, onUpgradeSuccess, currentPlan, trialDaysLeft, setTrialDaysLeft, trialTimeLeftStr }: AbonelikProps) {
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; title: string; price: string; isAnnual: boolean } | null>(null);
  
  // Payment processing states
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [processMessage, setProcessMessage] = useState('');
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  // PayTR Secure Integration States
  const [paytrToken, setPaytrToken] = useState<string>('');
  const [paytrLoading, setPaytrLoading] = useState<boolean>(false);
  const [paytrError, setPaytrError] = useState<string>('');

  // Coupon and Pricing States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handlePaytrTokenFetch = async (planIsAnnual: boolean, code: string) => {
    setPaytrLoading(true);
    setPaytrError('');
    setPaytrToken('');
    
    try {
      // Kullanıcının gerçek IP adresini tespit edelim (PayTR IP eşleşmesi için kritik)
      let clientIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip;
        }
      } catch (e) {
        console.warn('IP adresi alınamadı, sunucu tespitine geçiliyor:', e);
      }
      
      const res = await fetch('/api/paytr/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          isAnnualBilling: planIsAnnual,
          couponCode: code,
          userEmail: user?.email || 'dibiadam81@gmail.com',
          userName: user?.ad_soyad || 'K.A.S Kullanıcısı',
          userPhone: user?.telefon || '05555555555',
          userId: user?.id || 1,
          clientIp
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setPaytrToken(data.token);
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

  const handleApplyCoupon = async (code: string, isAnnual: boolean) => {
    if (!code.trim()) {
      setAppliedCoupon('');
      setCouponError('');
      setCouponSuccess('');
      handlePaytrTokenFetch(isAnnual, '');
      return;
    }

    const codeClean = code.trim().toUpperCase();
    if (codeClean === 'YENISEZON10' && !isAnnual) {
      setAppliedCoupon('');
      setCouponSuccess('');
      setCouponError('Bu kod sadece yıllık üyeliklerde geçerlidir.');
      handlePaytrTokenFetch(isAnnual, '');
      return;
    }

    try {
      const res = await fetch('/api/paytr/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          couponCode: codeClean,
          isAnnualBilling: isAnnual
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.valid) {
          setAppliedCoupon(codeClean);
          setCouponError('');
          setCouponSuccess(`${codeClean} (%${data.discountValue} İndirim) uygulandı.`);
          handlePaytrTokenFetch(isAnnual, codeClean);
        } else {
          setAppliedCoupon('');
          setCouponSuccess('');
          setCouponError(data.error || 'Geçersiz kupon kodu.');
          handlePaytrTokenFetch(isAnnual, '');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setAppliedCoupon('');
        setCouponSuccess('');
        setCouponError(errData.error || 'Kupon doğrulama hatası.');
        handlePaytrTokenFetch(isAnnual, '');
      }
    } catch (e) {
      setAppliedCoupon('');
      setCouponSuccess('');
      setCouponError('Kupon doğrulama bağlantı hatası.');
      handlePaytrTokenFetch(isAnnual, '');
    }
  };

  React.useEffect(() => {
    if (selectedPlan) {
      if (selectedPlan.isAnnual) {
        setCouponInput('YENISEZON10');
        handleApplyCoupon('YENISEZON10', true);
      } else {
        setCouponInput('');
        setAppliedCoupon('');
        setCouponSuccess('');
        setCouponError('');
        handlePaytrTokenFetch(false, '');
      }
    }
  }, [selectedPlan?.isAnnual]);

  React.useEffect(() => {
    if (selectedPlan) {
      handlePaytrTokenFetch(selectedPlan.isAnnual, appliedCoupon);
    }
  }, [selectedPlan?.id]);

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
                  <Zap size={15} /> Deneme Sürenizin Bitmesine {trialTimeLeftStr || `${trialDaysLeft} Gün`} Kaldı!
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Side: Payment Area */}
                  <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-850 p-6 md:p-8 space-y-6">
                    <div className="space-y-6 min-h-[300px] flex flex-col justify-center">
                      {paytrLoading && (
                        <div className="text-center py-12 space-y-4 animate-fade-in">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-xs text-slate-400 font-bold">Güvenli PayTR Ortak Ödeme Sayfası Hazırlanıyor...</p>
                        </div>
                      )}

                      {paytrError && (
                        <div className="text-center py-8 space-y-4 max-w-md mx-auto animate-fade-in">
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-red-400">
                            <AlertCircle size={22} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-200">PayTR Token Alınamadı</h4>
                            <p className="text-[11px] text-slate-400 leading-normal font-semibold">{paytrError}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePaytrTokenFetch(selectedPlan?.isAnnual ?? false, appliedCoupon)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <RefreshCw size={12} /> Tekrar Dene
                          </button>
                        </div>
                      )}

                      {!paytrLoading && !paytrError && paytrToken && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Güvenli PayTR SSL Bağlantısı</span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Mağaza Canlı Mod</span>
                            </div>
                            <div className="w-full aspect-[4/3] min-h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                              <iframe
                                src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
                                className="w-full h-full border-0"
                                allow="payment"
                                title="PayTR Güvenli Ödeme Ekranı"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Order Summary */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-8">
                    <div className="bg-slate-950 p-5 border border-slate-850 rounded-2xl space-y-4">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">SİPARİŞ ÖZETİ</span>
                      
                      {/* Interactive Plan Selectors inside Checkout */}
                      <div className="space-y-1.5 pb-2 border-b border-slate-900/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Plan Süresi Seçin:</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-850 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan(prev => prev ? { ...prev, isAnnual: false, price: "₺3.250" } : null);
                            }}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition ${!selectedPlan.isAnnual ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            Aylık Ödeme
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan(prev => prev ? { ...prev, isAnnual: true, price: "₺39.000" } : null);
                            }}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition ${selectedPlan.isAnnual ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            Yıllık Ödeme
                          </button>
                        </div>
                      </div>

                      {/* Coupon input field */}
                      <div className="space-y-1.5 pb-2 border-b border-slate-900/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Kupon Kodu:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Kupon Kodu Girin"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1 uppercase font-black"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(couponInput, selectedPlan.isAnnual)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shrink-0"
                          >
                            Uygula
                          </button>
                        </div>
                        {couponError && (
                          <span className="text-[10px] text-red-400 font-extrabold block leading-tight mt-1">
                            ⚠️ {couponError}
                          </span>
                        )}
                        {couponSuccess && (
                          <span className="text-[10px] text-emerald-400 font-extrabold block leading-tight mt-1">
                            ✓ {couponSuccess}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-300 font-semibold pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Normal Fiyat</span>
                          <span>{selectedPlan.isAnnual ? "₺39.000" : "₺3.250"}</span>
                        </div>

                        {selectedPlan.isAnnual && appliedCoupon === 'YENISEZON10' && (
                          <div className="flex justify-between text-emerald-400 font-extrabold bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg text-[11px]">
                            <span>Uygulanan Kupon</span>
                            <span>YENISEZON10 (%10 İndirim)</span>
                          </div>
                        )}

                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">%18 KDV</span>
                          <span>Dahil</span>
                        </div>

                        <div className="border-t border-slate-800/80 pt-3 flex justify-between font-black text-slate-100 text-sm">
                          <span>Ödenecek Tutar</span>
                          <span className="text-blue-400">
                            {selectedPlan.isAnnual && appliedCoupon === 'YENISEZON10' ? "₺35.100" : (selectedPlan.isAnnual ? "₺39.000" : "₺3.250")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-bold leading-normal bg-slate-950/40 p-4 rounded-xl border border-slate-850/40">
                      <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                      <span>Ödemeleriniz doğrudan BDDK denetimindeki PayTR Sanal POS altyapısı üzerinden 3D Secure güvencesiyle tahsil edilir.</span>
                    </div>
                  </div>
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
                  Yıllık Ödeme <span className="bg-emerald-500 text-slate-950 font-black text-[8px] px-1 rounded-md">%10 İndirim</span>
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
                      {isAnnualBilling ? "₺2.925" : "₺3.250"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">/aylık</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-bold">
                    {isAnnualBilling ? (
                      <>
                        <span className="line-through text-slate-600">₺39.000 yerine</span>{" "}
                        <span className="text-emerald-400 font-extrabold">₺35.100</span> faturalandırılır (%10 İndirim).
                      </>
                    ) : "*Aylık (₺3.250) faturalandırılır."}
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
                    price: isAnnualBilling ? "₺35.100" : "₺3.250",
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
