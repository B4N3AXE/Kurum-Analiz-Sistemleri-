import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Save, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface RiskLimitleriProps {
  user: User;
  token: string;
}

interface Threshold {
  id: number;
  tur: 'TYT' | 'AYT' | 'LGS';
  turkce_net: number;
  sosyal_net: number;
  matematik_net: number;
  fen_net: number;
  toplam_net: number;
}

export default function RiskLimitleri({ user, token }: RiskLimitleriProps) {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk-thresholds', {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setThresholds(data);
      } else {
        setError('Eşik değerleri yüklenemedi.');
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const handleInputChange = (id: number, field: keyof Threshold, value: string) => {
    const numVal = parseFloat(value) || 0;
    setThresholds(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: numVal } : t))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/risk-thresholds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ thresholds })
      });

      if (res.ok) {
        setSuccess('Risk limitleri başarıyla güncellendi. Artık öğrenci analizleri bu kurallara göre yapılacaktır.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError('Değişiklikler kaydedilemedi.');
      }
    } catch (err) {
      setError('Ağ bağlantı hatası.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
        <span className="text-sm font-bold text-slate-400">Yükleniyor...</span>
      </div>
    );
  }

  const tyt = thresholds.find(t => t.tur === 'TYT');
  const ayt = thresholds.find(t => t.tur === 'AYT');
  const lgs = thresholds.find(t => t.tur === 'LGS');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={22} /> Akademik Risk Eşik Ayarları
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Öğrencilerin deneme sınavı netlerine göre akademik risk grubuna (Kritik Takip) dahil edilme limitlerini ders bazlı özelleştirin.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="shrink-0" /> {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* TYT Threshold Box */}
          {tyt && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-blue-400 flex items-center gap-2">
                  <Award size={16} /> TYT Ders Bazlı Risk Eşikleri
                </h3>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                  Temel Yeterlilik Testi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sınavda ilgili dersin neti bu değerin altına düşen öğrenciler sistem tarafından otomatik olarak risk grubuna eklenir.
              </p>

              <div className="space-y-3.5">
                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Türkçe (40 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="40"
                    value={tyt.turkce_net}
                    onChange={e => handleInputChange(tyt.id, 'turkce_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Temel Matematik (40 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="40"
                    value={tyt.matematik_net}
                    onChange={e => handleInputChange(tyt.id, 'matematik_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Sosyal Bilimler (20 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={tyt.sosyal_net}
                    onChange={e => handleInputChange(tyt.id, 'sosyal_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Fen Bilimleri (20 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={tyt.fen_net}
                    onChange={e => handleInputChange(tyt.id, 'fen_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-slate-200 col-span-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> TYT Toplam Net Eşiği
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="120"
                    value={tyt.toplam_net}
                    onChange={e => handleInputChange(tyt.id, 'toplam_net', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AYT Threshold Box */}
          {ayt && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-purple-400 flex items-center gap-2">
                  <Award size={16} /> AYT Ders Bazlı Risk Eşikleri
                </h3>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                  Alan Yeterlilik Testleri
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Öğrencinin son girdiği AYT denemesinde branş netleri bu eşiklerin altına düşerse riskli olarak işaretlenir.
              </p>

              <div className="space-y-3.5">
                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Türk Dili ve Edebiyatı (24 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={ayt.turkce_net}
                    onChange={e => handleInputChange(ayt.id, 'turkce_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Matematik (40 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="40"
                    value={ayt.matematik_net}
                    onChange={e => handleInputChange(ayt.id, 'matematik_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Sosyal Bilimler-1/2 (40 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="40"
                    value={ayt.sosyal_net}
                    onChange={e => handleInputChange(ayt.id, 'sosyal_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Fen Bilimleri (40 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="40"
                    value={ayt.fen_net}
                    onChange={e => handleInputChange(ayt.id, 'fen_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-slate-200 col-span-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> AYT Toplam Net Eşiği
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="80"
                    value={ayt.toplam_net}
                    onChange={e => handleInputChange(ayt.id, 'toplam_net', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LGS Threshold Box */}
          {lgs && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                  <Award size={16} /> LGS Ders Bazlı Risk Eşikleri
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Liselere Geçiş Sistemi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Öğrencinin son girdiği LGS denemesinde branş netleri bu eşiklerin altına düşerse riskli olarak işaretlenir.
              </p>

              <div className="space-y-3.5">
                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Türkçe (20 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={lgs.turkce_net}
                    onChange={e => handleInputChange(lgs.id, 'turkce_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Matematik (20 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={lgs.matematik_net}
                    onChange={e => handleInputChange(lgs.id, 'matematik_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">İnkılap / Din / İngilizce (30 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="30"
                    value={lgs.sosyal_net}
                    onChange={e => handleInputChange(lgs.id, 'sosyal_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-xs font-bold text-slate-300 col-span-2">Fen Bilimleri (20 Soru)</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={lgs.fen_net}
                    onChange={e => handleInputChange(lgs.id, 'fen_net', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-slate-200 col-span-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> LGS Toplam Net Eşiği
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    value={lgs.toplam_net}
                    onChange={e => handleInputChange(lgs.id, 'toplam_net', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 px-6 py-3 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/15"
          >
            {saving ? (
              <RefreshCw className="animate-spin" size={15} />
            ) : (
              <Save size={15} />
            )}
            Değişiklikleri Kaydet ve Analizleri Güncelle
          </button>
        </div>
      </form>
    </div>
  );
}
