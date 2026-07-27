import React, { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export default function GlobalSearch({ token, onNavigate }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetch('/api/ogrenci', {
        headers: { 'Authorization': token }
      })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.ogrenciler || []);
        setStudents(list);
      })
      .catch(err => console.error("Error fetching search data:", err));
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = searchTerm.length > 0 
    ? students.filter(s => s.ad_soyad?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')))
    : [];

  return (
    <div className="relative group w-full max-w-md mx-auto" ref={containerRef}>
      <input 
        type="text" 
        placeholder="Sistemde arayın..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="glass-input text-xs py-2 pl-9 pr-4 w-full transition-all placeholder:text-slate-400 font-medium"
      />
      <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#4F7DFF] transition-colors" />
      
      <AnimatePresence>
        {isFocused && searchTerm.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {filteredStudents.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-4 py-2 border-b border-white/5">
                  Öğrenciler
                </div>
                {filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                    onClick={() => {
                      setSearchTerm('');
                      setIsFocused(false);
                      sessionStorage.setItem('openStudentId', student.id.toString());
                      onNavigate('ogrenci'); // Navigate to student management or details
                      window.dispatchEvent(new CustomEvent('open-student-detail', { detail: { studentId: student.id } }));
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#4F7DFF]/20 text-[#4F7DFF] flex items-center justify-center font-bold text-xs border border-[#4F7DFF]/30 shrink-0">
                      {student.ad_soyad?.charAt(0) || 'Ö'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{student.ad_soyad}</div>
                      <div className="text-[10px] text-slate-400">{student.alan || 'Alan Belirtilmemiş'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                "{searchTerm}" için sonuç bulunamadı.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
