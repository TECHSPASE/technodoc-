import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  HandCoins,
  RotateCcw,
  Delete,
  Check,
  Loader2,
  AlertCircle,
  StickyNote,
} from 'lucide-react';
import { aiTasks } from '@/lib/ai';
import { AiAdvice } from '@/components/AiAdvice';
import { useToast } from '@/components/Toast';
import type { FinanceEntry, FinanceType } from '@/lib/types';

interface FinanceSectionProps {
  onTotalsChange: (totals: FinanceTotals) => void;
}

export interface FinanceTotals {
  income: number;
  expense: number;
  debt: number;
  profit: number;
}

const TYPE_BUTTONS: { key: FinanceType; label: string; activeClass: string }[] = [
  { key: 'доход', label: 'ДОХОД', activeClass: 'bg-brand-500 text-white ring-accent-400 shadow-lg shadow-brand-950/40' },
  { key: 'расход', label: 'РАСХОД', activeClass: 'bg-white text-brand-900 ring-white shadow-lg shadow-brand-950/40' },
  { key: 'долг', label: 'ДОЛГ', activeClass: 'bg-white text-brand-900 ring-white shadow-lg shadow-brand-950/40' },
  { key: 'вернул', label: 'ВЕРНУЛ', activeClass: 'bg-brand-500 text-white ring-accent-400 shadow-lg shadow-brand-950/40' },
];

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00'];

const fmt = (n: number) => n.toLocaleString('ru-RU');

// Плавно «докручивает» число от 0 до целевого значения за 0.8 с
function useCountUp(value: number) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}

export function FinanceSection({ onTotalsChange }: FinanceSectionProps) {
  const toast = useToast();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);  const [type, setType] = useState<FinanceType>('доход');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financeCall = useCallback(async (body: Record<string, unknown>) => {
    const token = localStorage.getItem('td_session_token');
    if (!token) throw new Error('Войдите в профиль для доступа к финансам');
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, token }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.error || 'Ошибка финансового сервиса');
    return data;
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await financeCall({ action: 'list' });
      setEntries((data.entries ?? []) as FinanceEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }, [financeCall]);

  useEffect(() => {
    load();
  }, [load]);

  const sum = (t: FinanceType) =>
    entries.filter((e) => e.type === t).reduce((acc, e) => acc + Number(e.amount), 0);

  const income = sum('доход');
  const expense = sum('расход');
  const debt = Math.max(sum('долг') - sum('вернул'), 0);
  const profit = income - expense;
  const animIncome = useCountUp(income);
  const animExpense = useCountUp(expense);
  const animDebt = useCountUp(debt);
  const animProfit = useCountUp(profit);

  useEffect(() => {
    onTotalsChange({ income, expense, debt, profit });
  }, [income, expense, debt, profit, onTotalsChange]);

  const pressKey = (k: string) => {
    setAmount((a) => (a === '0' ? k : (a + k).slice(0, 9)));
  };

  const backspace = () => setAmount((a) => a.slice(0, -1));

  const save = async () => {
    const value = parseInt(amount, 10);
    if (!value || saving) return;
    setSaving(true);
    setError(null);
    try {
      await financeCall({ action: 'add', type, amount: value, note: note.trim() || null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось сохранить запись';
      setSaving(false);
      setError(message);
      toast.error(message);
      return;
    }
    setSaving(false);
    setAmount('');
    setNote('');
    toast.success('Запись сохранена');
    load();
  };

  const numAmount = parseInt(amount, 10) || 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl glass-icon flex items-center justify-center">
          <Wallet className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">ДОХОДЫ / РАСХОДЫ</h2>
      </div>

      {/* Четыре кнопки-действия */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {TYPE_BUTTONS.map((b) => {
          const isActive = type === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setType(b.key)}
              className={`rounded-2xl py-4 font-display text-lg tracking-widest ring-1 transition-all active:scale-[0.97] ${
                isActive
                  ? b.activeClass
                  : 'bg-white/10 text-white ring-white/20 hover:bg-white/20'
              }`}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Окно суммы */}
      <div className="rounded-2xl glass-card p-5">
        <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">
          Сумма, ₽
        </label>
        <div className="rounded-xl border-2 border-brand-200 bg-slate-50 px-4 py-3 min-h-[3.25rem] flex items-center justify-end">
          <span className={`font-display text-2xl ${numAmount > 0 ? 'text-brand-900' : 'text-slate-300'}`}>
            {numAmount > 0 ? fmt(numAmount) : '0'}
          </span>
        </div>

        {/* Цифровая клавиатура */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {KEYPAD.map((k) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              className="rounded-xl bg-slate-100 py-3 font-display text-xl text-brand-900 hover:bg-brand-50 active:scale-95 transition-all"
            >
              {k}
            </button>
          ))}
          <button
            onClick={backspace}
            aria-label="Стереть"
            className="rounded-xl bg-slate-100 py-3 flex items-center justify-center text-slate-500 hover:bg-danger-50 hover:text-danger-600 active:scale-95 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Пометка */}
        <label className="text-xs text-slate-500 uppercase tracking-wide mt-4 mb-2 block">
          Пометка (необязательно)
        </label>
        <div className="relative">
          <StickyNote className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="От кого / за что..."
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-brand-900 placeholder:text-slate-400 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={save}
          disabled={numAmount <= 0 || saving}
          className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-display text-base tracking-wider text-white uppercase hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Записать
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-danger-700">{error}</span>
          </div>
        )}
      </div>

      {/* Итоги */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 p-5 mt-5">
        <h3 className="font-display text-sm tracking-wide text-white/80 uppercase mb-3">
          Итоги
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-4 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/85">
                <TrendingUp className="w-4 h-4 text-success-300" />
                Доходы
              </span>
              <span className="font-display text-lg text-success-300">{fmt(animIncome)} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/85">
                <TrendingDown className="w-4 h-4 text-danger-300" />
                Расходы
              </span>
              <span className="font-display text-lg text-danger-300">{fmt(animExpense)} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/85">
                <HandCoins className="w-4 h-4 text-accent-300" />
                Должны
              </span>
              <span className="font-display text-lg text-accent-300">{fmt(animDebt)} ₽</span>
            </div>
            <div className="border-t border-white/15 pt-3 flex items-center justify-between">
              <span className="font-display text-sm tracking-wider text-white uppercase">
                Прибыль
              </span>
              <span
                className={`font-display text-2xl ${
                  profit < 0 ? 'text-danger-300' : 'text-success-300'
                }`}
              >
                {profit < 0 ? '−' : ''}{fmt(Math.abs(animProfit))} ₽
              </span>
            </div>
          </div>
        )}

        {!loading && (entries.length > 0 || income > 0 || expense > 0) && (
          <AiAdvice
            buttonLabel="ИИ-сводка по деньгам"
            ask={() => aiTasks.financeAdvice({ income, expense, debt, profit })}
          />
        )}
      </div>
    </div>
  );
}
