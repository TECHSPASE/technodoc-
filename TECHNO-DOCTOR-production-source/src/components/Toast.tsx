import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_META: Record<ToastKind, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-success-200', iconColor: 'text-success-600' },
  error: { icon: AlertCircle, ring: 'ring-danger-200', iconColor: 'text-danger-600' },
  info: { icon: Info, ring: 'ring-accent-200', iconColor: 'text-accent-600' },
  warning: { icon: AlertTriangle, ring: 'ring-accent-200', iconColor: 'text-accent-600' },
};

const AUTO_DISMISS_MS = 3500;
const LEAVE_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, LEAVE_MS);
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      warning: (m) => push('warning', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const meta = KIND_META[t.kind];
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl bg-white shadow-xl ring-1 ${meta.ring} px-3.5 py-3 ${
                t.leaving ? 'animate-toast-out' : 'animate-toast-in'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${meta.iconColor}`} strokeWidth={2.2} />
              <p className="flex-1 text-sm text-slate-800 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Закрыть уведомление"
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
