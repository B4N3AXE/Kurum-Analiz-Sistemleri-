const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                            <button
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

const renderBtn = `                            <div className="flex items-center gap-2">
                              <button
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

code = code.replace(targetStr, renderBtn);
code = code.replace(`                              Yönetici Çıkışı Yap
                            </button>
                          </div>`, `                              Yönetici Çıkışı Yap
                              </button>
                            </div>
                          </div>`);

fs.writeFileSync('src/App.tsx', code);
console.log('patched');
