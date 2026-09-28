import { useCallback, useEffect, useState } from 'react';
import { User, X, LogOut, Loader2, AlertCircle, CheckCircle2, Phone, KeyRound, ShieldCheck } from 'lucide-react';
import type { FinanceTotals } from '@/components/FinanceSection';
import { BrandLogo as requireBrandLogo } from '@/components/BrandLogo';

const AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const STORAGE_KEY = 'td_session_token';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function getSessionToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

async function authCall(body: Record<string, unknown>) {
  const resp = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error((data as { error?: string })?.error || 'Ошибка входа');
  }
  return data;
}

export function useSession() {
  const [session, setSession] = useState<{ token: string; phone: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setChecking(false);
      return;
    }
    authCall({ action: 'check', token })
      .then((d: { valid?: boolean }) => {
        if (d?.valid) {
          setSession({ token, phone: localStorage.getItem('td_session_phone') ?? '' });
        } else {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('td_session_phone');
        }
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (phone: string, pin: string) => {
    const d = (await authCall({ action: 'login', phone, pin })) as { token: string };
    localStorage.setItem(STORAGE_KEY, d.token);
    localStorage.setItem('td_session_phone', phone);
    setSession({ token: d.token, phone });
  }, []);

  const logout = useCallback(async () => {
    const token = getSessionToken();
    if (token) {
      await authCall({ action: 'logout', token }).catch(() => undefined);
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('td_session_phone');
    setSession(null);
  }, []);

  return { session, checking, login, logout };
}

export function Logo() {
  const BrandLogo = requireBrandLogo;
  return (
    <div className="w-full px-4 pt-5 pb-2 animate-fade-in">
      <div className="max-w-md mx-auto tech-frame px-4 py-3">
        <BrandLogo />
      </div>
    </div>
  );
}

interface HeaderProps {
  totals: FinanceTotals | null;
  onOpenProfile: () => void;
}

export function Header({ totals, onOpenProfile }: HeaderProps) {
  const profit = totals?.profit ?? 0;
  const loaded = totals !== null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4">
      {/* Счётчик прибыли */}
      <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 px-4 py-2.5 flex items-center gap-3 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-400 animate-pulse flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] tracking-wide uppercase text-white/70 leading-none">
            Прибыль
          </div>
          <div
            className={`font-display text-xl leading-tight truncate ${
              profit < 0 ? 'text-danger-300' : 'text-success-300'
            }`}
          >
            {!loaded ? (
              '—'
            ) : (
              <>
                {profit < 0 ? '−' : ''}
                {fmt(Math.abs(profit))} ₽
              </>
            )}
          </div>
        </div>
      </div>

      {/* Кнопка профиля */}
      <button
        onClick={onOpenProfile}
        aria-label="Профиль"
        className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/20 active:scale-95 transition-all"
      >
        <User className="w-6 h-6 text-white" strokeWidth={2} />
      </button>
    </div>
  );
}

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { session, checking, login, logout } = useSession();
  const [mode, setMode] = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneValid = /^9\d{9}$/.test(phoneDigits);

  const submitPhone = async () => {
    if (!phoneValid || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    setMode('pin');
    setBusy(false);
  };

  const submitPin = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(phoneDigits, pin);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    await logout();
    setBusy(false);
    setMode('phone');
    setPhone('');
    setPin('');
  };

  const setNewPin = async () => {
    if (pin.length < 4 || busy || !session) return;
    setBusy(true);
    setError(null);
    try {
      await authCall({ action: 'set_pin', token: session.token, newPin: pin });
      setInfo('Код доступа обновлён');
      setPin('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const keypadPress = (k: string) => {
    setError(null);
    setPin((p) => (p + k).slice(0, 8));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center shadow-lg mb-3">
            <User className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h3 className="font-display text-xl text-brand-900">ПРОФИЛЬ</h3>
        </div>

        {checking ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : session ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-success-50 ring-1 ring-success-200 px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-success-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success-800">Вы вошли</p>
                <p className="text-xs text-success-700">
                  {session.phone.startsWith('9') ? `+7 ${session.phone}` : session.phone}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">
                Сменить код доступа
              </label>
              <div className="rounded-xl border-2 border-brand-200 bg-slate-50 px-4 py-3 min-h-[3rem] flex items-center justify-end">
                <span className={`font-display text-2xl tracking-[0.4em] ${pin ? 'text-brand-900' : 'text-slate-300'}`}>
                  {pin ? '•'.repeat(pin.length) : '····'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {['1','2','3','4','5','6','7','8','9'].map((k) => (
                  <button key={k} onClick={() => keypadPress(k)} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-brand-900 hover:bg-brand-50 active:scale-95 transition-all">{k}</button>
                ))}
                <button onClick={() => setPin((p) => p.slice(0, -1))} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-slate-500 hover:bg-brand-50 active:scale-95 transition-all">⌫</button>
                <button onClick={() => keypadPress('0')} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-brand-900 hover:bg-brand-50 active:scale-95 transition-all">0</button>
                <button onClick={() => setPin('')} className="rounded-xl bg-slate-100 py-3 font-display text-sm text-slate-500 hover:bg-danger-50 hover:text-danger-600 active:scale-95 transition-all">СБРОС</button>
              </div>
              <button
                onClick={setNewPin}
                disabled={pin.length < 4 || busy}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-display text-sm tracking-wider text-white uppercase hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98] transition-all"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Сохранить код
              </button>
            </div>

            {info && (
              <div className="flex items-center gap-2 rounded-xl bg-accent-50 ring-1 ring-accent-200 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-accent-800">{info}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 py-3 font-display text-sm tracking-wider text-danger-700 uppercase hover:bg-danger-100 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        ) : (
          <div>
            {mode === 'phone' ? (
              <>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">
                  Номер телефона
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    value={phone}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '');
                      const trimmed = d.length >= 11 && (d.startsWith('7') || d.startsWith('8')) ? d.slice(1) : d;
                      setPhone(trimmed.slice(0, 10));
                      setError(null);
                    }}
                    placeholder="9012713157"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 font-display text-lg text-brand-900 placeholder:text-slate-300 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Без 8 и +7, начиная с 9 — например 9012713157
                </p>
                <button
                  onClick={submitPhone}
                  disabled={!phoneValid || busy}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-display text-base tracking-wider text-white uppercase hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98] transition-all"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-4 h-4" />}
                  Продолжить
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3 text-center">
                  Введите код доступа для <span className="font-semibold">+7 {phoneDigits}</span>
                </p>
                <div className="rounded-xl border-2 border-brand-200 bg-slate-50 px-4 py-3 min-h-[3rem] flex items-center justify-end">
                  <span className={`font-display text-2xl tracking-[0.4em] ${pin ? 'text-brand-900' : 'text-slate-300'}`}>
                    {pin ? '•'.repeat(pin.length) : '····'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {['1','2','3','4','5','6','7','8','9'].map((k) => (
                    <button key={k} onClick={() => keypadPress(k)} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-brand-900 hover:bg-brand-50 active:scale-95 transition-all">{k}</button>
                  ))}
                  <button onClick={() => setPin((p) => p.slice(0, -1))} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-slate-500 hover:bg-brand-50 active:scale-95 transition-all">⌫</button>
                  <button onClick={() => keypadPress('0')} className="rounded-xl bg-slate-100 py-3 font-display text-xl text-brand-900 hover:bg-brand-50 active:scale-95 transition-all">0</button>
                  <button onClick={() => { setMode('phone'); setPin(''); }} className="rounded-xl bg-slate-100 py-3 text-xs text-slate-500 hover:bg-brand-50 active:scale-95 transition-all">НАЗАД</button>
                </div>
                <button
                  onClick={submitPin}
                  disabled={pin.length < 4 || busy}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-display text-base tracking-wider text-white uppercase hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98] transition-all"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Войти
                </button>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Первый вход? Придумайте код из 4–8 цифр — он и станет вашим кодом доступа.
                </p>
              </>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-danger-700">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
