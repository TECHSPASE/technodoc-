import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Firmware } from '@/lib/types';
import type { CategoryKey } from '@/lib/constants';
import { Cpu, Search, Tag, Download, FileText, LoaderCircle } from 'lucide-react';
import { aiTasks } from '@/lib/ai';
import { AiAdvice } from '@/components/AiAdvice';

interface Props {
  category: CategoryKey;
}

export function FirmwareSection({ category }: Props) {
  const [items, setItems] = useState<Firmware[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('firmware')
      .select('*')
      .eq('category', category)
      .order('brand', { ascending: true });
    if (err) {
      setError('Не удалось загрузить прошивки. Проверьте подключение.');
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    setSearch('');
    load();
  }, [load]);

  const filtered = items.filter(
    (f) =>
      f.brand.toLowerCase().includes(search.toLowerCase()) ||
      f.model.toLowerCase().includes(search.toLowerCase()) ||
      f.version.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoaderCircle className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/80 text-sm">Загружаем прошивки...</p>
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
          <Cpu className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">ПРОШИВКИ</h2>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по бренду, модели или версии..."
          className="w-full rounded-2xl glass-input pl-11 pr-4 py-3 text-sm shadow-lg shadow-brand-950/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 text-center text-white/80 text-sm">
          {search ? 'Ничего не найдено' : 'Нет прошивок для этой категории'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((fw) => (
            <div
              key={fw.id}
              className="rounded-2xl glass-card p-4 hover:border-accent-400/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-white font-semibold">{fw.brand}</p>
                  <p className="text-sm text-white/70">{fw.model}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-success-500/20 ring-1 ring-success-400/40 px-2 py-1 text-xs text-success-300 flex-shrink-0">
                  <Tag className="w-3 h-3" />
                  {fw.version}
                </span>
              </div>
              <AiAdvice
                buttonLabel="Совет ИИ по прошивке"
                ask={() =>
                  aiTasks.firmwareAdvice({
                    category,
                    brand: fw.brand,
                    model: fw.model,
                    version: fw.version,
                  })
                }
              />
              {fw.description && (
                <div className="flex gap-2 mb-3">
                  <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/70 leading-snug">{fw.description}</p>
                </div>
              )}
              {fw.download_url ? (
                <a
                  href={fw.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" /> Скачать прошивку
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white/50">
                  <Download className="w-4 h-4" /> Ссылка недоступна
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
