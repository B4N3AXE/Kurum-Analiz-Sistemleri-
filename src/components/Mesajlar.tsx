import React, { useState, useEffect } from 'react';
import { User, Mesaj } from '../types';
import { Mail, Send, AlertCircle, Check, CheckCircle2 } from 'lucide-react';

interface MesajlarProps {
  user: User;
  token: string;
}

export default function Mesajlar({ user, token }: MesajlarProps) {
  const [messages, setMessages] = useState<Mesaj[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Send message form state
  const [aliciId, setAliciId] = useState('');
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  
  // Dropdown list
  const [usersList, setUsersList] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mesaj?user_id=${user.id}&rol=${user.rol}`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/kullanici/liste?kurum_id=${user.kurum_id}`, { 
          headers: { 'Authorization': token } 
        });
        if (res.ok) {
          const list = await res.json();
          setUsersList(list.filter((u: any) => u.id !== user.id)); // exclude self
        }
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    fetchUsers();
  }, [user.id, user.rol, token]);

  // Mark a message as read
  const handleMarkAsRead = async (msgId: number) => {
    try {
      const res = await fetch(`/api/mesaj/${msgId}/oku`, {
        method: 'PUT',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setMessages(messages.map(m => m.id === msgId ? { ...m, okundu: true } : m));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Submit message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!aliciId || !konu || !mesaj) {
      setError("Lütfen alıcı, konu ve mesaj alanlarını eksiksiz doldurun.");
      return;
    }

    try {
      const res = await fetch('/api/mesaj', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          gonderen_id: user.id,
          alici_id: parseInt(aliciId),
          ogrenci_id: null,
          konu,
          mesaj
        })
      });

      if (res.ok) {
        setSuccess("Mesajınız başarıyla iletildi.");
        setMesaj('');
        setKonu('');
        setAliciId('');
        loadMessages();
      } else {
        setError("Mesaj gönderilemedi, lütfen bilgileri kontrol edin.");
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return 'Yönetici';
      case 'ogretmen': return 'Öğretmen';
      case 'rehber': return 'Rehberlik';
      case 'veli': return 'Veli';
      case 'ogrenci': return 'Öğrenci';
      default: return r;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* COLUMN 1: Messenger Form */}
      <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
          <Send size={14} className="text-blue-500 animate-pulse" /> 
          Yeni Mesaj Gönder
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Alıcı Seçimi *</label>
            <select
              value={aliciId}
              onChange={e => setAliciId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Kişi Seçin --</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.ad_soyad} ({getRoleLabel(u.rol)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Mesaj Konusu *</label>
            <input
              type="text"
              value={konu}
              placeholder="Konu başlığı"
              onChange={e => setKonu(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Mesaj İçeriği *</label>
            <textarea
              rows={5}
              placeholder="İletmek istediğiniz mesajınızı yazın..."
              value={mesaj}
              onChange={e => setMesaj(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition shadow-md shadow-blue-500/10"
          >
            <Send size={12} /> Mesajı Gönder
          </button>
        </form>
      </div>

      {/* COLUMN 2: Message Logs */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Mail size={14} className="text-indigo-400" />
            Mesaj Kutunuz / Geçmiş
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Kutunuzda henüz hiç mesaj bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {messages.slice().reverse().map(m => (
                <div
                  key={m.id}
                  className={`p-4 border rounded-xl space-y-2 relative transition ${
                    m.okundu
                      ? "bg-slate-950/40 border-slate-850"
                      : "bg-blue-500/5 border-blue-500/20 shadow-sm shadow-blue-500/5"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide block">
                        {m.gonderen_id === user.id ? `Alıcı: ${m.alici_adi}` : `Gönderen: ${m.gonderen_adi}`}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-0.5">{m.konu}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-500 font-medium">{m.tarih}</span>
                      {m.alici_id === user.id && !m.okundu && (
                        <button
                          onClick={() => handleMarkAsRead(m.id)}
                          className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold transition border border-blue-500/20"
                          title="Okundu olarak işaretle"
                        >
                          <Check size={11} /> Okudum
                        </button>
                      )}
                      {m.okundu && (
                        <span className="text-slate-500 text-[10px] flex items-center gap-1 font-bold">
                          <CheckCircle2 size={12} className="text-slate-500" /> Görüldü
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line">{m.mesaj}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
