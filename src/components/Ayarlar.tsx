import React, { useState } from 'react';
import { User as UserIcon, Settings, Shield, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface AyarlarProps {
  user: User;
  token: string;
  onUserUpdate: (user: User) => void;
}

const Ayarlar: React.FC<AyarlarProps> = ({ user, token, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    ad_soyad: user.ad_soyad || '',
    kurum_adi: user.kurum_adi || '',
    email: user.email || '',
    mevcut_sifre: '',
    yeni_sifre: '',
    yeni_sifre_tekrar: '',
  });

  const [status, setStatus] = useState<{type: 'success' | 'error' | '', message: string}>({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/user/ayarlar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_soyad: formData.ad_soyad,
          kurum_adi: formData.kurum_adi,
          email: formData.email
        })
      });

      if (!response.ok) {
        throw new Error('Ayarlar güncellenirken bir hata oluştu.');
      }

      const data = await response.json();
      
      onUserUpdate({
        ...user,
        ad_soyad: formData.ad_soyad,
        kurum_adi: formData.kurum_adi,
        email: formData.email
      });
      
      setStatus({ type: 'success', message: 'Profil bilgileriniz başarıyla güncellendi.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Bir hata oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    
    if (formData.yeni_sifre !== formData.yeni_sifre_tekrar) {
      setStatus({ type: 'error', message: 'Yeni şifreler eşleşmiyor.' });
      return;
    }

    if (formData.yeni_sifre.length < 6) {
      setStatus({ type: 'error', message: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/user/sifre-degistir', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mevcut_sifre: formData.mevcut_sifre,
          yeni_sifre: formData.yeni_sifre
        })
      });

      if (!response.ok) {
        throw new Error('Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.');
      }
      
      setFormData(prev => ({ ...prev, mevcut_sifre: '', yeni_sifre: '', yeni_sifre_tekrar: '' }));
      setStatus({ type: 'success', message: 'Şifreniz başarıyla değiştirildi.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Bir hata oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="text-[#4F7DFF]" size={28} />
            Hesap ve Kurum Ayarları
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Kişisel bilgilerinizi ve kurum ayarlarınızı buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          status.type === 'success' 
            ? 'bg-[#30D158]/10 border-[#30D158]/30 text-[#30D158]' 
            : 'bg-[#FF5F57]/10 border-[#FF5F57]/30 text-[#FF5F57]'
        }`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Settings */}
        <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F7DFF]/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-2.5 bg-[#4F7DFF]/20 rounded-xl text-[#29D8FF]">
              <UserIcon size={20} />
            </div>
            <h3 className="text-lg font-black text-white">Profil Bilgileri</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Ad Soyad</label>
              <input
                type="text"
                name="ad_soyad"
                value={formData.ad_soyad}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Kurum Adı</label>
              <input
                type="text"
                name="kurum_adi"
                value={formData.kurum_adi}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">E-posta Adresi</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F7DFF] to-[#7C5CFF] text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <Save size={18} />
              Bilgileri Kaydet
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB020]/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-2.5 bg-[#FFB020]/20 rounded-xl text-[#FFB020]">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-black text-white">Güvenlik ve Şifre</h3>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Mevcut Şifre</label>
              <input
                type="password"
                name="mevcut_sifre"
                value={formData.mevcut_sifre}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Yeni Şifre</label>
              <input
                type="password"
                name="yeni_sifre"
                value={formData.yeni_sifre}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                name="yeni_sifre_tekrar"
                value={formData.yeni_sifre_tekrar}
                onChange={handleChange}
                className="glass-input w-full p-3 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-3 px-4 rounded-xl hover:bg-white/20 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <Lock size={18} />
              Şifreyi Güncelle
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Ayarlar;
