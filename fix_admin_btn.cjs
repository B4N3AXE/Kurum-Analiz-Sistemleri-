const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                            <button
                              type="button"
                              onClick={() => {
                                setIsAdminLoggedIn(false);`;

const renderBtn = `                            <button
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
fs.writeFileSync('src/App.tsx', code);
console.log('patched');
