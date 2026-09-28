import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ErrorCode } from '@/lib/types';
import type { CategoryKey } from '@/lib/constants';
import {
  AlertTriangle,
  Search,
  ChevronDown,
  Lightbulb,
  Wrench,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { aiTasks } from '@/lib/ai';
import { AiAdvice } from '@/components/AiAdvice';

interface Props {
  category: CategoryKey;
}

export function ErrorCodesSection({ category }: Props) {
  const [codes, setCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [brand, setBrand] = useState<string>('ВСЕ');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('error_codes')
      .select('*')
      .eq('category', category)
      .order('code', { ascending: true });
    if (err) {
      setError('Не удалось загрузить коды ошибок. Проверьте подключение.');
    } else {
      setCodes(data ?? []);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    setExpanded(null);
    setSearch('');
    setBrand('ВСЕ');
    load();
  }, [load]);

  const brands = Array.from(new Set(codes.map((c) => c.brand))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'));
  const hasBrandChips = brands.length > 1;

  const filtered = codes
    .filter((c) => brand === 'ВСЕ' || c.brand === brand)
    .filter(
      (c) =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.brand ?? '').toLowerCase().includes(search.toLowerCase()),
    );

  // Группируем отфильтрованные коды по бренду, сохраняя порядок брендов
  const groupedByBrand = brands
    .map((b) => ({ brand: b, items: filtered.filter((c) => c.brand === b) }))
    .filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoaderCircle className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/80 text-sm">Загружаем коды ошибок...</p>
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
          <AlertTriangle className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">КОДЫ ОШИБОК</h2>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по коду или описанию..."
          className="w-full rounded-2xl glass-input pl-11 pr-4 py-3 text-sm shadow-lg shadow-brand-950/20"
        />
      </div>

      {hasBrandChips && (
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {['ВСЕ', ...brands].map((b) => (
            <button
              key={b}
              onClick={() => {
                setBrand(b);
                setExpanded(null);
              }}
              className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-display whitespace-nowrap ring-1 transition-all active:scale-95 ${
                b === brand
                  ? 'bg-accent-400 text-brand-950 ring-accent-300'
                  : 'glass-chip text-white/90'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 text-center text-white/80 text-sm">
          {search ? 'Ничего не найдено' : 'Нет кодов для этой категории'}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByBrand.map((group) => (
            <div key={group.brand}>
              {hasBrandChips && brand === 'ВСЕ' && (
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-1 h-5 rounded-full bg-accent-400" />
                  <h3 className="font-display text-sm tracking-widest uppercase text-accent-300">{group.brand}</h3>
                  <span className="text-[10px] text-white/40 ml-auto">{group.items.length}</span>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((code) => {
                  const isOpen = expanded === code.id;
                  return (
                    <div
                      key={code.id}
                      className={`rounded-2xl overflow-hidden transition-all shadow-lg shadow-brand-950/20 ${
                        isOpen ? 'ring-2 ring-accent-400 glass-card' : 'glass-card-hover'
                      }`}
                    >
                      <button
                        onClick={() => setExpanded(isOpen ? null : code.id)}
                        className="w-full flex items-center gap-3 p-3.5 text-left"
                      >
                        <span className="flex-shrink-0 inline-flex flex-col items-center justify-center rounded-xl bg-danger-100 px-3 py-1.5 min-w-[56px]">
                          <span className="font-display text-sm text-danger-700">{code.code}</span>
                          {code.brand && !hasBrandChips && <span className="text-[9px] uppercase tracking-wide text-danger-600/80 leading-none mt-0.5">{code.brand}</span>}
                        </span>
                        <span className="flex-1 text-sm text-white/90">{code.description}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 space-y-2.5 animate-slide-up">
                          <div className="flex gap-2.5 rounded-xl glass-chip p-3">
                            <Info className="w-4 h-4 text-accent-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wide mb-0.5">Описание</p>
                              <p className="text-sm text-white/90">{code.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2.5 rounded-xl bg-accent-50 p-3 ring-1 ring-accent-100">
                            <Lightbulb className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-accent-700/70 uppercase tracking-wide mb-0.5">Вероятная причина</p>
                              <p className="text-sm text-slate-700">{code.cause || '—'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2.5 rounded-xl bg-success-50 p-3 ring-1 ring-success-100">
                            <Wrench className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-success-700/70 uppercase tracking-wide mb-0.5">Решение</p>
                              <p className="text-sm text-slate-700">{code.solution || '—'}</p>
                            </div>
                          </div>
                          <AiAdvice
                            buttonLabel="Совет ИИ по этому коду"
                            ask={() =>
                              aiTasks.errorCodeAdvice({
                                category,
                                code: {
                                  code: code.code,
                                  brand: code.brand,
                                  description: code.description,
                                  cause: code.cause ?? undefined,
                                  solution: code.solution ?? undefined,
                                },
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
