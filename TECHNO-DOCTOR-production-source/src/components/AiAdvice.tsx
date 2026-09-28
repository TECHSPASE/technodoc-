import { useState } from 'react';
import { Sparkles, LoaderCircle, AlertCircle, ChevronDown } from 'lucide-react';

interface Props {
  ask: () => Promise<{ ok: boolean; data?: { text?: string }; error?: string }>;
  buttonLabel?: string;
}

export function AiAdvice({ ask, buttonLabel = 'Спросить ИИ' }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setText(null);
    const res = await ask();
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'ИИ временно недоступен');
      return;
    }
    const t = res.data?.text;
    setText(t && t.trim() ? t.trim() : 'ИИ не дал ответа, попробуйте ещё раз');
  };

  return (
    <div className="mt-3">
      <button
        onClick={run}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-semibold text-brand-950 shadow-lg shadow-brand-950/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
      >
        {loading ? (
          <LoaderCircle className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? 'ИИ думает...' : buttonLabel}
      </button>

      {open && (
        <div className="mt-2 rounded-2xl bg-accent-50 ring-1 ring-accent-200 p-4 animate-slide-up">
          {loading && (
            <p className="text-sm text-accent-700 text-center py-2">Формируем подсказку...</p>
          )}
          {error && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}
          {text && <p className="text-sm text-slate-700 leading-relaxed">{text}</p>}
          {!loading && (text || error) && (
            <button
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 rotate-180" /> Скрыть
            </button>
          )}
        </div>
      )}
    </div>
  );
}
