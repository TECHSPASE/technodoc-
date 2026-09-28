import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from '@/components/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);

// PWA: register the hand-written service worker (built to /sw.js by Vite)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (worker) {
            worker.addEventListener('statechange', () => {
              if (worker.state === 'activated') {
                console.info('[PWA] Service worker activated — app is available offline');
              }
            });
          }
        });
      })
      .catch((error) => console.error('[PWA] Service worker registration failed:', error));
  });
}
