import { CATEGORIES, MENU_ITEMS } from '@/lib/constants';
import type { CategoryKey, MenuKey } from '@/lib/constants';

interface CategoryPickerProps {
  title: string;
  lastCategory: CategoryKey | null;
  onSelect: (key: CategoryKey) => void;
  onBack: () => void;
}

const SECTION_HINT: Partial<Record<MenuKey, string>> = {
  'КАЛЬКУЛЯТОР': 'Расчёт стоимости ремонта',
  'КОДЫ ОШИБОК': 'Расшифровка и решения',
  'ДИАГНОСТИКА': 'Симптомы и методики проверки',
  'ПРОШИВКИ': 'Скачивание прошивок',
  'БАЗА МОДЕЛЕЙ': 'Характеристики и заметки',
  'ЗАПЧАСТИ': 'Наличие и цены',
};

export function CategoryPicker({ title, lastCategory, onSelect, onBack }: CategoryPickerProps) {
  const lastMeta = lastCategory ? CATEGORIES.find((c) => c.key === lastCategory) : null;

  return (
    <div className="flex-1 px-4 py-6 animate-fade-in flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight text-center">
          {title}
        </h2>
        <p className="text-sm text-brand-100/90 mt-1">
          {SECTION_HINT[title as MenuKey] ?? 'Выберите категорию техники'}
        </p>
      </div>

      {lastMeta && (
        <div className="w-full max-w-md mx-auto mb-4">
          <button
            onClick={() => onSelect(lastMeta.key)}
            className="group w-full flex items-center gap-3 rounded-2xl bg-accent-400/15 ring-1 ring-accent-400/40 backdrop-blur-sm py-3.5 px-5 hover:bg-accent-400/25 active:scale-[0.98] transition-all"
          >
            <span className="w-10 h-10 rounded-xl bg-accent-400 flex items-center justify-center flex-shrink-0">
              <lastMeta.icon className="w-5 h-5 text-brand-950" strokeWidth={2.2} />
            </span>
            <span className="flex-1 text-left min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-accent-200 leading-none mb-1">
                Последняя категория
              </span>
              <span className="block font-display text-base text-white truncate">
                {lastMeta.label}
              </span>
            </span>
            <span className="font-display text-sm text-accent-300 flex-shrink-0">ОТКРЫТЬ →</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-md mx-auto">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(cat.key)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl glass-card-hover py-4 px-2 active:scale-[0.96] transition-all animate-slide-up"
            >
              <Icon className="w-7 h-7 text-accent-300 transition-colors" strokeWidth={1.9} />
              <span className="font-display text-[10px] font-semibold tracking-wide text-white text-center leading-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 flex justify-center">
        <button
          onClick={onBack}
          className="rounded-xl bg-white/15 backdrop-blur-sm px-6 py-2.5 text-white font-semibold text-sm ring-1 ring-white/25 hover:bg-white/25 active:scale-95 transition-all"
        >
          В ГЛАВНОЕ МЕНЮ
        </button>
      </div>
    </div>
  );
}
