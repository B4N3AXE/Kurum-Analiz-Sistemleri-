import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, User as UserIcon, Trash2, MessageSquare, ArrowRight, Award, Activity, CheckCircle2, Target, BookOpen, Terminal, Settings, HelpCircle, TrendingUp, UserCheck, Search, Info, ChevronRight, CheckSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiChatWidgetProps {
  mode?: "widget" | "full";
  isOpen: boolean;
  onClose: () => void;
  user: any;
  token: string;
}

export default function AiChatWidget({ isOpen, onClose, user, token, mode = 'widget' }: AiChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'context' | 'templates'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [systemStudents, setSystemStudents] = useState<any[]>([]);

  const userRole = user?.rol || 'guest';
  const userName = user?.ad_soyad || 'Ziyaretçi';

  // Fetch real students to use in suggestions
  useEffect(() => {
    if (user && token && (userRole === 'admin' || userRole === 'ogretmen' || userRole === 'rehber')) {
      fetch('/api/ogrenci', {
        headers: {
          'Authorization': token
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to load students');
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSystemStudents(data);
        }
      })
      .catch(err => console.error('Error fetching students for chatbot suggestions:', err));
    }
  }, [user, token, userRole]);

  // Role-based greeting text
  const getGreeting = () => {
    if (userRole === 'admin') {
      return `Merhaba değerli yöneticim **${userName}**! KAS.ai Asistanı'na hoş geldiniz. 🌟 Kurumunuzdaki öğrencilerin gelişim durumlarını, sınav netlerini veya ders çalışma sürelerini anlık sorgulamak için buradayım. Size bugün nasıl yardımcı olabilirim?`;
    } else if (userRole === 'ogretmen' || userRole === 'rehber') {
      return `Merhaba değerli öğretmenim **${userName}**! KAS.ai Asistanı'na hoş geldiniz. 🍎 Öğrencilerinizin deneme sınavı gelişimlerini veya ödev durumlarını sorgulamak isterseniz buradayım. Size nasıl destek olabilirim?`;
    } else if (userRole === 'veli') {
      return `Merhaba değerli velimiz **${userName}**! KAS.ai Asistanı'na hoş geldiniz. ✨ Öğrencinizin güncel deneme sınav netlerini veya haftalık ödevlerini benimle sorgulayabilirsiniz. Size bugün hangi konuda bilgi vermemi istersiniz?`;
    } else if (userRole === 'ogrenci') {
      return `Selam öğrenci dostum **${userName}**! KAS.ai Yapay Zeka Asistanı'na hoş geldin! 🚀 Son deneme sınavı netlerini analiz etmek, güncel haftalık ödevlerini görmek veya ders çalışma sürelerini raporlamak için buradayım. Bugün hangi dersi çalışıyoruz?`;
    } else {
      return `Merhaba! KAS.ai Yapay Zeka Kurum Asistanı'na hoş geldiniz. 👋 Kurum Analiz Sistemi (K.A.S) hakkında bilgi edinmek, öğretmen-veli panellerini keşfetmek veya yapay zeka özelliklerimizi öğrenmek için dilediğinizi sorabilirsiniz. Size nasıl yardımcı olabilirim?`;
    }
  };

  // Role-based suggestion chips
  const getSuggestions = () => {
    if (userRole === 'admin' || userRole === 'ogretmen' || userRole === 'rehber') {
      const suggestions: string[] = [];
      if (systemStudents && systemStudents.length > 0) {
        const s1 = systemStudents[0];
        suggestions.push(`${s1.ad_soyad} öğrencisini ara`);
        if (systemStudents.length > 1) {
          const s2 = systemStudents[1];
          suggestions.push(`${s2.ad_soyad} deneme netlerini özetle`);
        }
      }
      suggestions.push('Kurum genel başarı analiz raporu');
      return suggestions;
    } else if (userRole === 'veli') {
      return [
        'Öğrencinin son deneme netleri nedir?',
        'Öğrencinin ödevleri/haftalık görevleri'
      ];
    } else if (userRole === 'ogrenci') {
      return [
        'Son deneme sınavı netlerimi analiz et',
        'Bu haftaki ödevlerimi göster',
        'Çalışma seanslarımı raporla',
        'Netlerimi yükseltmek için tavsiye ver'
      ];
    } else {
      return [
        'K.A.S sistemi nedir ve ne işe yarar?',
        'Öğretmen ve Veli panellerinde hangi özellikler var?',
        'Yapay zeka asistanı sınav analizi yapabilir mi?',
        'Sisteme nasıl kayıt olabilirim?'
      ];
    }
  };

  // Initialize messages with warm welcome greeting once
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: getGreeting(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [userRole]);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Map ChatMessage history to the format expected by Gemini API (role: user/model)
      const formattedHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory,
          user: user
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'Üzgünüm, şu anda yanıt veremiyorum.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('KAS.ai chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Şu anda bağlantı kuramıyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: getGreeting(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Custom regex markdown formatter
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      } else if (/^\d+\.\s/.test(line.trim())) {
        // Number list
        isBullet = true;
        cleanLine = line.trim().replace(/^\d+\.\s/, '');
      }

      const parts = [];
      let currentIndex = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > currentIndex) {
          parts.push(cleanLine.substring(currentIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="text-indigo-300 font-extrabold font-sans">
            {match[1]}
          </strong>
        );
        currentIndex = regex.lastIndex;
      }

      if (currentIndex < cleanLine.length) {
        parts.push(cleanLine.substring(currentIndex));
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-2 items-start mt-1 pl-1">
            <span className="text-indigo-400 text-xs shrink-0 mt-1">•</span>
            <span className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {parts.length > 0 ? parts : cleanLine}
            </span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="text-xs text-slate-200 leading-relaxed font-sans font-medium mt-1 min-h-[0.5rem]">
          {parts.length > 0 ? parts : cleanLine}
        </p>
      );
    });
  };

  const promptCategories = {
    admin: [
      {
        title: "🎯 Bireysel Analizler",
        items: [
          { label: "Öğrenci Deneme Karnesi", prompt: "Sistemde kayıtlı bir öğrencinin son deneme sınavı netlerini analiz ederek zayıf kaldığı branşları ve kazanım eksiklerini çıkarır mısın?" },
          { label: "Başarı Eğrisi Düşüşü", prompt: "Son denemelerde başarı yüzdesi düşüş eğiliminde olan, risk limitlerinin altında kalan öğrencileri tespit edip listeler misin?" },
          { label: "Konu Eksiklik Raporu", prompt: "Sistemdeki öğrencilerin en çok yanlış yaptığı matematik ve fen konularını analiz edip ortak kazanım eksiklerini listeler misin?" }
        ]
      },
      {
        title: "📊 Kurumsal Raporlama",
        items: [
          { label: "Sınıf Karşılaştırması", prompt: "Mevcut sınıfların deneme sınavlarındaki toplam net ortalamalarını karşılaştırarak en başarılı sınıfı ve takviye gereken sınıfı söyler misin?" },
          { label: "Veli SMS Taslağı Üret", prompt: "Velilerle paylaşılmak üzere, öğrencilerin haftalık genel ders çalışma sürelerini ve deneme başarılarını özetleyen samimi bir SMS bilgilendirme mesaj taslağı hazırlar mısın?" },
          { label: "Çalışma Stratejisi Önerisi", prompt: "Tüm kurum için genel ders çalışma verimliliğini artıracak, yapay zeka destekli haftalık etüt ve birebir ders planlama stratejisi önerir misin?" }
        ]
      }
    ],
    ogretmen: [
      {
        title: "📚 Eğitsel Rehberlik",
        items: [
          { label: "Öğrenci Gelişim Analizi", prompt: "Öğrencilerimin deneme netlerindeki son 3 sınavlık gelişim trendini ve ders bazlı net artışlarını analiz eder misin?" },
          { label: "Soru Çözüm & Ödev Takibi", prompt: "Öğrencilere verilen haftalık hedeflerin ve çözülen soru sayılarının verimliliğini değerlendirip tavsiyeler üretir misin?" },
          { label: "Zayıf Kazanım Tespiti", prompt: "Sınıf bazında TYT Matematik dersinde en çok zorlanılan konuları tespit edip bu konulara yönelik etüt önerisi yapar mısın?" }
        ]
      },
      {
        title: "💬 Etkileşim & İletişim",
        items: [
          { label: "Birebir Ders Müfredatı", prompt: "Eksikleri yoğun olan bir öğrenci için 4 haftalık hızlandırılmış Matematik birebir ders programı şablonu hazırlar mısın?" },
          { label: "Öğretmen Görüş Notu", prompt: "Rehberlik görüşmelerinde velilere sunulmak üzere yapıcı, motive edici ve akademik odaklı öğretmen tavsiyeleri yazar mısın?" }
        ]
      }
    ],
    rehber: [
      {
        title: "🎯 Rehberlik Analizleri",
        items: [
          { label: "Risk Grubu Öğrencileri", prompt: "Belirlenen başarı risk limitlerinin altında kalan öğrencileri ve onlara yönelik özel çalışma planı önerilerini listeler misin?" },
          { label: "Motivasyon ve Takip", prompt: "Haftalık hedeflerine ulaşmakta zorlanan öğrenciler için rehberlik servisi tarafından uygulanabilecek motivasyon teknikleri nelerdir?" },
          { label: "Veli Görüşme Hazırlığı", prompt: "Başarısı düşüşte olan bir öğrencinin velisiyle yapılacak kritik toplantı için rehberlik görüşme planı ve konuşma başlıkları hazırlar mısın?" }
        ]
      }
    ],
    ogrenci: [
      {
        title: "🧠 Akademik Koçluk",
        items: [
          { label: "Matematik Net Artırma", prompt: "Matematik denemelerinde netlerimi artırmak için haftalık nasıl bir çalışma ve soru çözüm stratejisi izlemeliyim?" },
          { label: "Zaman Yönetimi Taktikleri", prompt: "Deneme sınavlarında özellikle Türkçe ve Matematik arasında zamanı yetiştiremiyorum. Bana profesyonel sınav zaman yönetimi taktikleri verir misin?" },
          { label: "Haftalık Çalışma Programı", prompt: "Bana haftalık ders çalışma, dinlenme ve pomodoro seansları içeren dengeli bir ders programı şablonu hazırlar mısın?" }
        ]
      },
      {
        title: "🗺️ Yol Haritası & Analiz",
        items: [
          { label: "Eksik Konu Kapatma", prompt: "Yanlış yaptığım konuları belirledikten sonra, bu konuları sıfırdan öğrenmek ve pekiştirmek için en verimli çalışma adımları nelerdir?" },
          { label: "Sınav Stresi ve Motivasyon", prompt: "Sınav yaklaştıkça odaklanma sorunu ve stres yaşıyorum. Motivasyonumu yüksek tutmak ve kaygıyı azaltmak için yapay zeka tavsiyeleri alabilir miyim?" }
        ]
      }
    ],
    veli: [
      {
        title: "👨‍👩‍👦 Veli Rehberliği",
        items: [
          { label: "Öğrenci Sınav Eğrisi", prompt: "Öğrencimin deneme sınavlarındaki başarı eğrisini, net gelişimini ve derslerdeki istikrarını genel olarak analiz eder misiniz?" },
          { label: "Evde Verimli Çalışma", prompt: "Öğrencimizin evde daha verimli çalışmasını sağlamak, odaklanmasını artırmak için veli olarak ev ortamında ne gibi destekler sunabiliriz?" },
          { label: "Sınav Kaygısı Desteği", prompt: "Sınav sürecindeki öğrencimize kaygısını azaltması ve özgüvenini taze tutması için aile içi iletişimde nasıl yaklaşmalıyız?" }
        ]
      }
    ],
    guest: [
      {
        title: "⚡ KAS Altyapı Tanıtımı",
        items: [
          { label: "KAS Nedir ve Nasıl Çalışır?", prompt: "KAS.ai Kurum Analiz Sistemi nedir, hangi eğitim süreçlerini otomatikleştirir ve kurumlara ne gibi faydalar sağlar?" },
          { label: "Öğretmen ve Veli Panelleri", prompt: "Sistemde öğretmenler ve veliler için ne gibi takip ekranları, karne analizleri ve iletişim kolaylıkları sunulmaktadır?" },
          { label: "Yapay Zeka Özellikleri", prompt: "KAS.ai yapay zeka motoru sınav sonuçlarını ve PDF'leri nasıl analiz eder? Hangi tahmin algoritmalarını kullanır?" }
        ]
      }
    ]
  };

  const activeCategories = promptCategories[userRole as keyof typeof promptCategories] || promptCategories.guest;

  // Render full screen dashboard layout with split panels
  if (mode === 'full') {
    return (
      <div className="flex flex-col w-full animate-fade-in text-slate-200">
        
        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80 mb-3 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 ${
              mobileTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10 border border-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <Sparkles size={11} />
            <span>Sohbet</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('context')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 ${
              mobileTab === 'context'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10 border border-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <UserCheck size={11} />
            <span>{userRole === 'admin' || userRole === 'ogretmen' || userRole === 'rehber' ? 'Öğrenciler' : 'Durum'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('templates')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 ${
              mobileTab === 'templates'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10 border border-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <MessageSquare size={11} />
            <span>Şablonlar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full h-[520px] lg:h-[680px] lg:min-h-[600px]">
          
          {/* LEFT COLUMN: Contextual Info Card: Interactive Students List or Student Scorecard */}
          <div className={`lg:col-span-3 gap-4 h-full overflow-hidden ${mobileTab === 'context' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex-1 flex flex-col gap-3 overflow-hidden shadow-lg shadow-slate-950/20">
            
            {/* If Admin/Teacher/Counselor, show system students clickable */}
            {(userRole === 'admin' || userRole === 'ogretmen' || userRole === 'rehber') ? (
              <>
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Öğrencileriniz ({systemStudents.length})</h4>
                    <p className="text-[9px] text-slate-500 font-bold">Hızlı analiz için öğrenci seçin:</p>
                  </div>
                  <UserCheck size={14} className="text-indigo-400" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {systemStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-[10px] font-medium italic">
                      Yüklü öğrenci bulunmuyor.
                    </div>
                  ) : (
                    systemStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSendMessage(`${student.ad_soyad} isimli öğrencinin son durumunu, deneme netlerini ve varsa konu eksiklerini analiz eder misin?`)}
                        className="w-full text-left p-2 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/40 hover:bg-indigo-950/25 transition duration-150 flex items-center justify-between group"
                      >
                        <div className="overflow-hidden mr-2">
                          <span className="text-[11px] font-bold text-slate-300 group-hover:text-indigo-300 block truncate">
                            {student.ad_soyad}
                          </span>
                          <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wide">
                            {student.sinif_adi || 'Sınıfsız'} • {student.alan}
                          </span>
                        </div>
                        <ChevronRight size={10} className="text-slate-600 group-hover:text-indigo-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : userRole === 'ogrenci' ? (
              /* If Student, show their study analytics status card */
              <div className="flex flex-col gap-3.5 h-full overflow-y-auto pr-1 scrollbar-thin">
                <div className="flex items-center gap-2 shrink-0">
                  <Target size={14} className="text-indigo-400" />
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Akademik Hedef</h4>
                </div>

                <div className="bg-slate-950/50 border border-slate-900/60 p-3 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Hedeflenen Net:</span>
                    <span className="text-slate-200 font-mono font-black">95.00 Net</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">KAS.ai Projeksiyonu:</span>
                    <span className="text-emerald-400 font-mono font-black">78.40 Net</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                  <div className="text-[8px] text-slate-500 font-bold text-right uppercase tracking-wider">%82 Hedef Yakınlığı</div>
                </div>

                <div className="border-t border-slate-900/60 pt-3 space-y-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">🚨 KAS.ai Tespitleri</span>
                  <div className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-900 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-bold">
                      <BookOpen size={10} />
                      <span>Konu Eksikliği Odak Alanı:</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                      Son 3 deneme sınavı analizine göre <strong>Matematik (Trigonometri)</strong> ve <strong>Fizik (Optik)</strong> konularından gelen sorularda boş kalma oranı yüksek. Bu konulara odaklanmanız netlerinizi hızla artıracaktır.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* If Parent or other, show tracking card */
              <div className="flex flex-col gap-3.5 h-full">
                <div className="flex items-center gap-2 shrink-0">
                  <TrendingUp size={14} className="text-indigo-400" />
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Veli Takip Asistanı</h4>
                </div>
                <div className="bg-slate-950/50 border border-slate-900/60 p-3.5 rounded-xl space-y-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">💡 Öneri Paneli</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                    Öğrencinizin gelişim eğrisi, deneme netleri ve haftalık ödev tamamlama yüzdesi KAS.ai tarafından anlık olarak izlenmektedir. Haftalık karne yayınlandığında asistanınızdan rapor talep edebilirsiniz.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* MIDDLE COLUMN: Core Chat Room */}
        <div className={`lg:col-span-6 h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-lg shadow-indigo-950/40 ${mobileTab === 'chat' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-4 border-b border-indigo-900/40 flex items-center justify-between relative shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 animate-pulse">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white tracking-wide">KAS.ai Sohbet</h3>
                  <span className="bg-emerald-500/10 text-emerald-300 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                    Çevrimiçi
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Yapay Zeka Destekli Kurumsal Eğitim Ortağınız
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-950/60 transition cursor-pointer"
                title="Sohbeti Temizle"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-950/45">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${
                    msg.role === 'user'
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-indigo-950 border-indigo-900/60 text-indigo-400'
                  }`}
                >
                  {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                </div>

                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`p-3 rounded-2xl break-words ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="space-y-1.5 whitespace-pre-wrap min-w-0">
                      {msg.role === 'user' ? (
                        <p className="text-xs font-sans font-medium leading-relaxed">{msg.text}</p>
                      ) : (
                        formatMessageText(msg.text)
                      )}
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold text-slate-500 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[92%] sm:max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-900/60 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={12} />
                </div>
                <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="KAS.ai'ye sorun... (örn: Matematik başarısını nasıl artırırız?)"
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition placeholder-slate-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-8.5 h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0 shadow shadow-indigo-600/20"
            >
              <Send size={13} />
            </button>
          </form>

        </div>

        {/* RIGHT COLUMN: Interactive Prompt Templates / Shortcuts Library */}
        <div className={`lg:col-span-3 gap-4 h-full overflow-hidden ${mobileTab === 'templates' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex-1 flex flex-col gap-3.5 overflow-hidden shadow-lg shadow-slate-950/20">
            <div className="flex items-center gap-2 shrink-0">
              <MessageSquare size={14} className="text-indigo-400" />
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Hazır İstek Şablonları</h4>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-medium shrink-0">
              KAS.ai'den hızlıca rapor, analiz veya plan şablonu almak için aşağıdaki hazır komutlara tıklayabilirsiniz:
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {activeCategories.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block pl-0.5">
                    {cat.title}
                  </span>
                  <div className="space-y-1.5">
                    {cat.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        type="button"
                        onClick={() => handleSendMessage(item.prompt)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500 hover:bg-indigo-950/20 transition duration-150 flex gap-2 items-start group"
                      >
                        <Sparkles size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <span className="text-[10.5px] font-bold text-slate-300 group-hover:text-indigo-200 block leading-snug">
                            {item.label}
                          </span>
                          <span className="text-[8.5px] text-slate-500 font-medium block truncate mt-0.5 leading-none">
                            {item.prompt}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl shrink-0 flex items-center gap-2 text-[9px] text-slate-500 font-bold leading-tight">
              <Info size={11} className="text-indigo-400 shrink-0" />
              <span>Hazır komutlar, yapay zeka tarafından rolünüze göre özel hazırlanmıştır.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
    );
  }

  // Original widget view
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: mode === 'widget' ? 50 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: mode === 'widget' ? 50 : 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="kas-ai-chat-widget"
          className={
            mode === 'widget' 
              ? "fixed bottom-4 right-4 z-50 w-[380px] h-[550px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/40 flex flex-col overflow-hidden"
              : "w-full h-full min-h-[600px] bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden relative"
          }
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-4 border-b border-indigo-900/40 flex items-center justify-between relative shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white tracking-wide">KAS.ai</h3>
                  <span className="bg-indigo-500/10 text-indigo-300 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest animate-pulse">
                    Aktif Asistan
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {userRole === 'admin' ? 'Yönetici Asistanı' : userRole === 'ogretmen' ? 'Öğretmen Asistanı' : userRole === 'veli' ? 'Veli Rehberi' : 'Sınav & Ders Koçu'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-950/60 transition cursor-pointer"
                title="Sohbeti Temizle"
              >
                <Trash2 size={14} />
              </button>
              {mode === 'widget' && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-950/60 transition cursor-pointer"
                  title="Kapat"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-950/45">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${
                    msg.role === 'user'
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-indigo-950 border-indigo-900/60 text-indigo-400'
                  }`}
                >
                  {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                </div>

                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`p-3 rounded-2xl break-words ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="space-y-1.5 whitespace-pre-wrap min-w-0">
                      {msg.role === 'user' ? (
                        <p className="text-xs font-sans font-medium leading-relaxed">{msg.text}</p>
                      ) : (
                        formatMessageText(msg.text)
                      )}
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold text-slate-500 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[92%] sm:max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-900/60 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={12} />
                </div>
                <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions (if there are only a couple of messages, keep it helpful!) */}
          {messages.length <= 2 && !isLoading && (
            <div className="p-3 bg-slate-950/30 border-t border-slate-900 shrink-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">💡 Hızlı Soru Kısayolları</span>
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                {getSuggestions().map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sug)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-300 hover:text-indigo-200 px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap text-left"
                  >
                    {sug} <ArrowRight size={10} className="opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="KAS.ai'ye sorun... (örn: Ahmet'in netleri)"
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition placeholder-slate-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-8.5 h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0 shadow shadow-indigo-600/20"
            >
              <Send size={14} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
