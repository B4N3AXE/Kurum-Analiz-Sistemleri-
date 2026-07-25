import React, { useState, useEffect } from 'react';
import { User, Ogrenci, TaksitPlani, Taksit } from '../types';
import { Coins, Plus, Edit2, CheckCircle, Clock, AlertCircle, X, Check, Save } from 'lucide-react';

interface TaksitYonetimiProps {
  user: User;
}

export default function TaksitYonetimi({ user }: TaksitYonetimiProps) {
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [planlar, setPlanlar] = useState<(TaksitPlani & { ogrenci_adi: string, taksit_listesi: Taksit[] })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOgrenci, setSelectedOgrenci] = useState('');
  const [toplamTutar, setToplamTutar] = useState('');
  const [pesinat, setPesinat] = useState('');
  const [taksitSayisi, setTaksitSayisi] = useState('');
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [error, setError] = useState('');
  
  const [activePlan, setActivePlan] = useState<number | null>(null); // For accordion

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('kas_token');
      const [ogrRes, planRes] = await Promise.all([
        fetch(`/api/ogrenci?kurum_id=${user.kurum_id}`, { headers: { 'Authorization': token || '' } }),
        fetch('/api/taksitler', { headers: { 'Authorization': token || '' } })
      ]);
      
      if (ogrRes.ok) {
        const data = await ogrRes.json();
        setOgrenciler(data);
      }
      if (planRes.ok) {
        const data = await planRes.json();
        setPlanlar(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedOgrenci || !toplamTutar || !taksitSayisi || !baslangicTarihi) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('/api/taksitler/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          ogrenci_id: selectedOgrenci,
          toplam_tutar: toplamTutar,
          pesinat: pesinat || 0,
          taksit_sayisi: taksitSayisi,
          baslangic_tarihi: baslangicTarihi
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedOgrenci('');
        setToplamTutar('');
        setPesinat('');
        setTaksitSayisi('');
        setBaslangicTarihi('');
        fetchData();
      } else {
        setError(data.error || 'Plan oluşturulamadı.');
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    }
  };

  const handleUpdateTaksit = async (taksitId: number, odenen: number, durum: string) => {
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch(`/api/taksitler/odeme/${taksitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          odenen_tutar: odenen,
          durum
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-8">Yükleniyor...</div>;
  }

  // Öğrencilerin planı olanları ayırıp, planı olmayanları listelemek için:
  const planliOgrenciIdleri = planlar.map(p => p.ogrenci_id);
  const plansizOgrenciler = ogrenciler.filter(o => !planliOgrenciIdleri.includes(o.id));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="text-[#30D158]" /> Öğrenci Ödeme & Taksit Takibi
          </h2>
          <p className="text-slate-400 text-sm mt-1">Öğrencilerin kurs ücreti ve taksit ödemelerini buradan yönetebilirsiniz.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} /> Yeni Taksit Planı
        </button>
      </div>

      <div className="space-y-4">
        {planlar.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Coins className="text-slate-600 mx-auto mb-3" size={48} />
            <p className="text-slate-400">Henüz hiçbir öğrenci için taksit planı oluşturulmamış.</p>
          </div>
        ) : (
          planlar.map(plan => {
            const isExpanded = activePlan === plan.id;
            const odenenToplam = plan.taksit_listesi.reduce((acc, t) => acc + (t.durum === 'odendi' ? t.tutar : t.odenen_tutar), 0) + plan.pesinat;
            const kalanToplam = plan.toplam_tutar - odenenToplam;
            const yuzde = Math.round((odenenToplam / plan.toplam_tutar) * 100) || 0;

            return (
              <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                  onClick={() => setActivePlan(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
                      {plan.ogrenci_adi.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{plan.ogrenci_adi}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Coins size={12}/> Toplam: {plan.toplam_tutar.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center gap-1 text-[#30D158]"><CheckCircle size={12}/> Ödenen: {odenenToplam.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center gap-1 text-red-400"><Clock size={12}/> Kalan: {kalanToplam.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${yuzde}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-300">{yuzde}%</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${plan.durum === 'tamamlandi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {plan.durum.toUpperCase()}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {plan.pesinat > 0 && (
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-400">PEŞİNAT</span>
                            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold">ÖDENDİ</span>
                          </div>
                          <div className="text-lg font-bold text-white mb-1">{plan.pesinat.toLocaleString('tr-TR')} ₺</div>
                          <div className="text-xs text-slate-400">{new Date(plan.baslangic_tarihi).toLocaleDateString('tr-TR')}</div>
                        </div>
                      )}
                      
                      {plan.taksit_listesi.map((taksit, idx) => {
                        const isOdendi = taksit.durum === 'odendi';
                        const isGecikti = taksit.durum === 'gecikti';
                        return (
                          <div key={taksit.id} className={`p-3 rounded-lg border transition ${isOdendi ? 'bg-slate-800/40 border-slate-700/50 opacity-80' : isGecikti ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-400">{idx + 1}. TAKSİT</span>
                              {isOdendi ? (
                                <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><Check size={10}/> ÖDENDİ</span>
                              ) : isGecikti ? (
                                <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><AlertCircle size={10}/> GECİKTİ</span>
                              ) : (
                                <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><Clock size={10}/> BEKLİYOR</span>
                              )}
                            </div>
                            <div className="text-lg font-bold text-white mb-1">{taksit.tutar.toLocaleString('tr-TR')} ₺</div>
                            <div className="flex justify-between items-end">
                              <div className="text-xs text-slate-400 flex flex-col gap-0.5">
                                <span>Vade: {new Date(taksit.vade_tarihi).toLocaleDateString('tr-TR')}</span>
                                {taksit.odeme_tarihi && <span className="text-[#30D158]">Ödendi: {new Date(taksit.odeme_tarihi).toLocaleDateString('tr-TR')}</span>}
                              </div>
                              
                              {!isOdendi && (
                                <button
                                  onClick={() => handleUpdateTaksit(taksit.id, taksit.tutar, 'odendi')}
                                  className="bg-slate-700 hover:bg-[#30D158] text-white hover:text-black p-1.5 rounded transition text-xs font-bold flex items-center gap-1"
                                  title="Ödendi Olarak İşaretle"
                                >
                                  <Check size={14} /> Tahsil Et
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Yeni Taksit Planı</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Öğrenci Seçimi *</label>
                <select
                  value={selectedOgrenci}
                  onChange={e => setSelectedOgrenci(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Öğrenci Seçin --</option>
                  {plansizOgrenciler.map(o => (
                    <option key={o.id} value={o.id}>{o.ad_soyad} ({o.tc_no})</option>
                  ))}
                </select>
                {plansizOgrenciler.length === 0 && <p className="text-xs text-yellow-500 mt-1">Tüm öğrencilerin taksit planı bulunmaktadır.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Toplam Ücret (₺) *</label>
                <input
                  type="number"
                  value={toplamTutar}
                  onChange={e => setToplamTutar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Örn: 12000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Peşinat Tutarı (₺)</label>
                <input
                  type="number"
                  value={pesinat}
                  onChange={e => setPesinat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Örn: 2000 (Yoksa boş bırakın)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Taksit Sayısı *</label>
                  <select
                    value={taksitSayisi}
                    onChange={e => setTaksitSayisi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Seçiniz</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Taksit</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">İlk Taksit Tarihi *</label>
                  <input
                    type="date"
                    value={baslangicTarihi}
                    onChange={e => setBaslangicTarihi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              {toplamTutar && taksitSayisi && (
                <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Kalan Tutar:</span>
                    <span className="text-white font-bold">{ (Number(toplamTutar) - Number(pesinat || 0)).toLocaleString('tr-TR') } ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aylık Taksit Tutarı:</span>
                    <span className="text-[#30D158] font-bold">
                      { ((Number(toplamTutar) - Number(pesinat || 0)) / Number(taksitSayisi)).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) } ₺
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition mt-4"
              >
                Planı Oluştur
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
