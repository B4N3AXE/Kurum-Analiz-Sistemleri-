const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = "import React, { useState, useEffect, useRef } from 'react';";
const stateStr = `
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (e) {
      console.error('Kullanıcılar alınamadı', e);
    }
  };
  
  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAllUsers();
    }
  }, [isAdminLoggedIn]);
`;

code = code.replace("  const [showAIWidget, setShowAIWidget] = useState(false);", "  const [showAIWidget, setShowAIWidget] = useState(false);" + stateStr);

const renderBtn = `                              <button
                                type="button"
                                onClick={() => setShowUsersModal(true)}
                                className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition cursor-pointer"
                              >
                                👥 Kayıtlı Kullanıcıları Gör
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAdminLoggedIn(false);`;

code = code.replace(`                              <button
                                type="button"
                                onClick={() => {
                                  setIsAdminLoggedIn(false);`, renderBtn);

const renderModal = `
              {showUsersModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
                    <button onClick={() => setShowUsersModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200">
                      <X size={20} />
                    </button>
                    <h3 className="text-lg font-black text-slate-100 mb-4 flex items-center gap-2">
                      <Users size={20} className="text-blue-400" /> 
                      Sisteme Kayıtlı Tüm Kullanıcılar ({allUsers.length})
                    </h3>
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            <th className="pb-3 pr-4">ID / İsim</th>
                            <th className="pb-3 pr-4">Rol</th>
                            <th className="pb-3 pr-4">İletişim</th>
                            <th className="pb-3 pr-4">Kurum</th>
                            <th className="pb-3">Abonelik</th>
                          </tr>
                        </thead>
                        <tbody className="text-[11px] text-slate-300">
                          {allUsers.map((u, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="py-3 pr-4">
                                <div className="font-bold text-slate-200">{u.ad_soyad}</div>
                                <div className="text-[9px] text-slate-500 font-mono">ID: {u.id}</div>
                              </td>
                              <td className="py-3 pr-4">
                                <span className={\`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase \${
                                  u.rol === 'admin' ? 'bg-amber-500/10 text-amber-400' :
                                  u.rol === 'ogretmen' ? 'bg-blue-500/10 text-blue-400' :
                                  u.rol === 'veli' ? 'bg-pink-500/10 text-pink-400' :
                                  u.rol === 'ogrenci' ? 'bg-emerald-500/10 text-emerald-400' :
                                  'bg-slate-800 text-slate-400'
                                }\`}>
                                  {u.rol}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="text-slate-300">{u.email}</div>
                                <div className="text-slate-500">{u.telefon || '-'}</div>
                              </td>
                              <td className="py-3 pr-4">
                                {u.kurum_adi || '-'}
                              </td>
                              <td className="py-3">
                                {u.abonelik_turu ? (
                                  <span className={\`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase \${
                                    u.abonelik_turu === 'trial' ? 'bg-slate-800 text-slate-400' :
                                    u.abonelik_turu === 'mikro' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }\`}>
                                    {u.abonelik_turu}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
`;

code = code.replace("{/* Moderation instructions info */}", renderModal + "\n                          {/* Moderation instructions info */}");

fs.writeFileSync('src/App.tsx', code);
console.log('patched app users');
