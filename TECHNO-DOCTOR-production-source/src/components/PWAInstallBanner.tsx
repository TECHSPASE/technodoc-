import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const DISMISS_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const { isInstalled, isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState<boolean>(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [installing, setInstalling] = useState(false);

  const visible = !isInstalled && isInstallable && !dismissed;

  useEffect(() => {
    if (isInstalled) localStorage.removeItem(DISMISS_KEY);
  }, [isInstalled]);

  if (!visible) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-white" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm text-slate-900">Установить приложение</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Добавьте на главный экран — приложение откроется на весь экран, как обычное.
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.2} />
              {installing ? 'Установка…' : 'Установить'}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              Позже
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Скрыть предложение установки"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
