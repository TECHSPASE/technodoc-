import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { CalculatorRate } from '@/lib/types';
import type { CategoryKey } from '@/lib/constants';
import { COMPLEXITY_MULTIPLIER, COMPLEXITY_LABEL } from '@/lib/constants';
import {
  Calculator as CalcIcon,
  Plus,
  Minus,
  Clock,
  Trash2,
  Receipt,
  LoaderCircle,
  Wrench,
} from 'lucide-react';
import { aiTasks } from '@/lib/ai';
import { AiAdvice } from '@/components/AiAdvice';
import { useToast } from '@/components/Toast';

interface Props {
  category: CategoryKey;
}

interface CartItem {
  rate: CalculatorRate;
  quantity: number;
}

export function CalculatorSection({ category }: Props) {
  const toast = useToast();
  const [rates, setRates] = useState<CalculatorRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [urgency, setUrgency] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('calculator_rates')
      .select('*')
      .eq('category', category)
      .order('base_price', { ascending: true });
    if (err) {
      setError('Не удалось загрузить услуги. Проверьте подключение.');
    } else {
      setRates(data ?? []);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    setCart([]);
    setUrgency(false);
    load();
  }, [load]);

  const addToCart = (rate: CalculatorRate) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.rate.id === rate.id);
      if (existing) {
        return prev.map((i) => (i.rate.id === rate.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { rate, quantity: 1 }];
    });
    toast.success('Услуга добавлена в смету');
  };

  const removeFromCart = (rateId: string) => {
    setCart((prev) =>
      prev
        .map((i) => (i.rate.id === rateId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const itemTotal = useCallback((item: CartItem) => {
    const mult = COMPLEXITY_MULTIPLIER[item.rate.complexity ?? ''] ?? 1;
    return Number(item.rate.base_price ?? 0) * mult * item.quantity;
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + itemTotal(i), 0), [cart, itemTotal]);
  const urgencyFee = urgency ? Math.round(subtotal * 0.3) : 0;
  const total = subtotal + urgencyFee;

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoaderCircle className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/80 text-sm">Загружаем услуги...</p>
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
          <CalcIcon className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">КАЛЬКУЛЯТОР</h2>
      </div>

      {/* Услуги */}
      <h3 className="text-xs text-white/70 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
        <Wrench className="w-3.5 h-3.5" /> Услуги — нажмите, чтобы добавить в смету
      </h3>
      {rates.length === 0 ? (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 text-center text-white/80 text-sm">
          Нет услуг для этой категории
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {rates.map((rate) => {
            const mult = COMPLEXITY_MULTIPLIER[rate.complexity ?? ''] ?? 1;
            const price = Math.round(Number(rate.base_price ?? 0) * mult);
            return (
              <button
                key={rate.id}
                onClick={() => addToCart(rate)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl glass-card-hover py-3 px-4 active:scale-[0.98] transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{rate.service_type}</p>
                  <span
                    className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      rate.complexity === 'high'
                        ? 'bg-danger-100 text-danger-700'
                        : rate.complexity === 'medium'
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-success-100 text-success-700'
                    }`}
                  >
                    Сложность: {COMPLEXITY_LABEL[rate.complexity ?? ''] ?? '—'}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-lg text-brand-700">{fmt(price)} ₽</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-medium">
                    <Plus className="w-3 h-3" /> добавить
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Смета */}
      <div className="rounded-2xl glass-card p-4">
        <h3 className="text-sm text-brand-900 mb-3 flex items-center gap-2 font-display tracking-wide uppercase">
          <Receipt className="w-4 h-4 text-brand-500" /> Смета ремонта
        </h3>

        {cart.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-5">Добавьте услуги из списка выше</p>
        ) : (
          <div className="space-y-2 mb-3">
            {cart.map((item) => (
              <div key={item.rate.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{item.rate.service_type}</p>
                  <p className="text-xs text-slate-400">
                    {fmt(Number(item.rate.base_price))} ₽ × {COMPLEXITY_MULTIPLIER[item.rate.complexity ?? ''] ?? 1} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => removeFromCart(item.rate.id)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 active:scale-90 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-slate-700 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => addToCart(item.rate)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 active:scale-90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-brand-800 w-[70px] text-right">
                    {fmt(itemTotal(item))} ₽
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <AiAdvice
            buttonLabel="Объяснить смету клиенту (ИИ)"
            ask={() =>
              aiTasks.calculatorAdvice({
                category,
                services: cart.map((i) => ({
                  name: i.rate.service_type,
                  price: Math.round(itemTotal(i)),
                  qty: i.quantity,
                })),
                urgent: urgency,
                total,
              })
            }
          />
        )}

        {cart.length > 0 && (
          <>
            <label className="flex items-center justify-between py-3 border-t border-slate-100 cursor-pointer select-none">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-400" />
                Срочный ремонт (+30%)
              </span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={urgency}
                  onChange={(e) => setUrgency(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-brand-500 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <div className="border-t-2 border-slate-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Услуги:</span>
                <span className="font-medium">{fmt(subtotal)} ₽</span>
              </div>
              {urgency && (
                <div className="flex justify-between text-sm text-accent-600">
                  <span>Срочность:</span>
                  <span className="font-medium">+{fmt(urgencyFee)} ₽</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-sm text-slate-700 font-display tracking-wide uppercase">Итого:</span>
                <span className="font-display text-2xl text-brand-700">{fmt(total)} ₽</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCart([]);
                setUrgency(false);
                toast.info('Смета очищена');
              }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-sm text-slate-500 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Очистить смету
            </button>
          </>
        )}
      </div>
    </div>
  );
}
