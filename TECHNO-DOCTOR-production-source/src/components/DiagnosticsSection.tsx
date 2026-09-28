import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CategoryKey } from '@/lib/constants';
import { Stethoscope, Search, ChevronDown, ClipboardList, Lightbulb, Wrench, LoaderCircle } from 'lucide-react';
import { aiTasks } from '@/lib/ai';
import { AiAdvice } from '@/components/AiAdvice';

interface DiagnosticsCheck {
  id: string;
  category: string;
  brand: string | null;
  symptom: string;
  checks: string;
  cause: string | null;
  solution: string | null;
}

interface Props {
  category: CategoryKey;
}

export function DiagnosticsSection({ category }: Props) {
  const [items, setItems] = useState<DiagnosticsCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('diagnostics_checks')
      .select('*')
      .eq('category', category)
      .order('symptom', { ascending: true });
    if (err) {
      setError('Не удалось загрузить базу диагностики. Проверьте подключение.');
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    setExpanded(null);
    setSearch('');
    load();
  }, [load]);

  const q = search.toLowerCase();
  const filtered = items.filter(
    (d) =>
      d.symptom.toLowerCase().includes(q) ||
      d.checks.toLowerCase().includes(q) ||
      (d.cause ?? '').toLowerCase().includes(q),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoaderCircle className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/80 text-sm">Загружаем базу диагностики...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl glass-card p-6 text-center">
        <p className="text-danger-600 text-sm font-medium">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-xl bg-brand-500 px-6 py-2.5 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98] transition-all duration-200"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl glass-icon flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">ДИАГНОСТИКА</h2>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по симптому или причине..."
          className="w-full rounded-2xl glass-input pl-11 pr-4 py-3 text-sm shadow-lg shadow-brand-950/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 text-center text-white/80 text-sm">
          {search ? 'Ничего не найдено' : 'Нет методик для этой категории'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const isOpen = expanded === d.id;
            return (
              <div
                key={d.id}
                className={`rounded-2xl overflow-hidden transition-all shadow-lg shadow-brand-950/20 ${
                  isOpen ? 'ring-2 ring-accent-400 glass-card' : 'glass-card-hover'
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  className="w-full flex items-center gap-3 p-3.5 text-left"
                >
                  <span className="flex-1 text-sm font-medium text-white/90">{d.symptom}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 space-y-2.5 animate-slide-up">
                    <div className="flex gap-2.5 rounded-xl glass-chip p-3">
                      <ClipboardList className="w-4 h-4 text-accent-300 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 uppercase tracking-wide mb-0.5">Что проверить</p>
                        <div className="text-sm text-white/90 whitespace-pre-line">{d.checks}</div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 rounded-xl bg-accent-50 p-3 ring-1 ring-accent-100">
                      <Lightbulb className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-accent-700/70 uppercase tracking-wide mb-0.5">Вероятная причина</p>
                        <p className="text-sm text-slate-700">{d.cause || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 rounded-xl bg-success-50 p-3 ring-1 ring-success-100">
                      <Wrench className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-success-700/70 uppercase tracking-wide mb-0.5">Решение</p>
                        <p className="text-sm text-slate-700">{d.solution || '—'}</p>
                      </div>
                    </div>
                    <AiAdvice
                      buttonLabel="Подсказка ИИ по этому симптому"
                      ask={() =>
                        aiTasks.diagnosticsAdvice({
                          category,
                          symptom: d.symptom,
                          checks: d.checks,
                          cause: d.cause ?? undefined,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
