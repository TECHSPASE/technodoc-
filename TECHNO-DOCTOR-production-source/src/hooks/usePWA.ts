import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
}

/**
 * Tracks PWA install state:
 * - isInstalled: app is running in fullscreen/standalone mode (or was installed)
 * - isInstallable: browser captured a beforeinstallprompt we can trigger
 * - promptInstall(): shows the native install prompt; resolves with the user's choice
 */
export function usePWA(): PWAState & { promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'> } {
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: fullscreen)');

    const syncMode = () => setIsInstalled(detectStandalone());
    syncMode();
    media.addEventListener('change', syncMode);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      media.removeEventListener('change', syncMode);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return {
    isInstalled,
    isInstallable: deferredPrompt !== null,
    promptInstall,
  };
}

function detectStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}
