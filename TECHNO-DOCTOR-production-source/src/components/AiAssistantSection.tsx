import { useState } from 'react';
import { Bot, Send, Loader2, AlertCircle } from 'lucide-react';
import { askAi } from '@/lib/ai';

type Message = { role: 'user' | 'assistant'; text: string };

export function AiAssistantSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, text }];
    setMessages(next); setInput(''); setLoading(true); setError(null);
    const res = await askAi<{ text?: string }>('chat', {
      message: text,
      history: messages.slice(-10),
    });
    setLoading(false);
    if (!res.ok || !res.data?.text) { setError(res.error || 'Помощник временно недоступен'); return; }
    setMessages([...next, { role: 'assistant', text: res.data.text }]);
  };

  return <div>
    <div className="flex items-center gap-3 mb-5">
      <span className="w-11 h-11 rounded-2xl glass-icon flex items-center justify-center"><Bot className="w-6 h-6 text-accent-300" /></span>
      <div><h2 className="font-display text-2xl text-white">AI МАСТЕР</h2><p className="text-xs text-white/55">GEMINI • ТЕХНИЧЕСКИЙ ПОМОЩНИК</p></div>
    </div>
    <div className="tech-frame p-4 min-h-[48vh] max-h-[58vh] overflow-y-auto scrollbar-thin space-y-3">
      {messages.length === 0 && <div className="text-sm text-white/65 leading-relaxed py-8 text-center">Опиши технику, модель, симптом или код ошибки.<br/>Например: «Samsung UE32F6200AK, пульт не реагирует, джойстик работает».</div>}
      {messages.map((m,i)=><div key={i} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${m.role==='user'?'ml-auto bg-accent-500 text-brand-950':'mr-auto glass-card text-white'}`}>{m.text}</div>)}
      {loading && <div className="flex items-center gap-2 text-sm text-accent-300"><Loader2 className="w-4 h-4 animate-spin"/>Анализирую...</div>}
    </div>
    {error && <div className="mt-3 flex gap-2 text-sm text-danger-300"><AlertCircle className="w-4 h-4 mt-0.5"/>{error}</div>}
    <div className="mt-3 flex gap-2">
      <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} rows={2} placeholder="Опиши неисправность..." className="glass-input flex-1 resize-none rounded-2xl px-4 py-3 text-sm" />
      <button onClick={send} disabled={!input.trim()||loading} className="w-14 rounded-2xl bg-accent-400 text-brand-950 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all" aria-label="Отправить"><Send className="w-5 h-5"/></button>
    </div>
  </div>;
}
