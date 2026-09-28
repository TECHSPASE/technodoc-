import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
//
// PWA note: to auto-generate a service worker + precache manifest, add
// `vite-plugin-pwa` and register it like this:
//
//   import { VitePWA } from 'vite-plugin-pwa';
//   plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: false })],
//
// (manifest: false because /public/manifest.json is used directly.)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
