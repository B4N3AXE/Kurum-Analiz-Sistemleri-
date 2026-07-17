import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, User as UserIcon, Trash2, MessageSquare, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  token: string;
}

export default function AiChatWidget({ isOpen, onClose, user, token }: AiChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      return `Merhaba değerli yöneticim **${userName}**! KAS.ai Asistanı'na hoş geldiniz. 🌟 Kurumunuzdaki öğrencilerin gelişim durumlarını, sınav netlerini, ders çalışma sürelerini veya devamsızlıklarını anlık sorgulamak için buradayım. Size bugün nasıl yardımcı olabilirim?`;
    } else if (userRole === 'ogretmen' || userRole === 'rehber') {
      return `Merhaba değerli öğretmenim **${userName}**! KAS.ai Asistanı'na hoş geldiniz. 🍎 Öğrencilerinizin deneme sınavı gelişimlerini, ödev durumlarını veya devamsızlık karnelerini sorgulamak isterseniz buradayım. Size nasıl destek olabilirim?`;
    } else if (userRole === 'veli') {
      return `Merhaba değerli velimiz **${userName}**! KAS.ai Asistanı'na hoş geldiniz. ✨ Öğrencinizin güncel deneme sınav netlerini, haftalık ödevlerini veya devamsızlık durumunu benimle sorgulayabilirsiniz. Size bugün hangi konuda bilgi vermemi istersiniz?`;
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
      suggestions.push('Öğrenci devamsızlık durumları');
      suggestions.push('Kurum genel başarı analiz raporu');
      return suggestions;
    } else if (userRole === 'veli') {
      return [
        'Öğrencinin son deneme netleri nedir?',
        'Öğrencinin ödevleri/haftalık görevleri',
        'Öğrencinin devamsızlık durumu'
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="kas-ai-chat-widget"
          className="fixed bottom-4 right-4 z-50 w-[380px] h-[550px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/40 flex flex-col overflow-hidden"
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
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-950/60 transition cursor-pointer"
                title="Kapat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-950/45">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
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
                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="space-y-1.5 whitespace-pre-wrap">
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
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
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
