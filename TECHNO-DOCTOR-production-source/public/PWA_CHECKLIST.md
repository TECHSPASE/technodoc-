# PWA Verification Checklist

## 1. Chrome DevTools
- Open **Application tab → Manifest**: verify name, `display: fullscreen`, `orientation: portrait`, all 10 icons load without warnings, and shortcuts appear.
- **Application tab → Service Workers**: `sw.js` should show "activated and running" after first load.
- **Application tab → Storage**: tick "Bypass for network" off, go **offline**, reload — app shell should still render.
- **Application tab → Cache Storage**: confirm `taskflow-cache-v1` contains the app shell files.

## 2. Lighthouse
```bash
npx lighthouse <url> --preset=experimental --view
# or in Chrome DevTools: Lighthouse panel → category "Progressive Web App" → Analyze
```

## 3. Install prompt on mobile (Android/Chrome)
- Serve over **HTTPS** (or localhost). Open the app, wait for the banner (fires when `beforeinstallprompt` is captured).
- Chrome menu → "Install app" / "Add to Home screen" also works without the banner.
- After install, launching from the home screen icon must open with **no browser UI** (fullscreen).

## 4. Verify fullscreen display mode
- DevTools console after launching from home screen:
```js
matchMedia('(display-mode: fullscreen)').matches // true
```
- The `usePWA` hook's `isInstalled` reflects this automatically.

## 5. Common pitfalls
- **HTTPS required**: service workers and install prompts don't work on plain HTTP (localhost is exempt).
- **Icon format/sizes**: manifest icons must be real PNGs at the declared sizes; missing icons fail the installability check.
- **Scope mismatch**: `start_url` and `scope` must be within the SW's scope (`/` here). Don't deploy under a subpath without adjusting both plus `base` in vite config.
- **Maskable icons**: 192/512 maskable variants exist; browsers cropping into them must still show the full glyph (safe zone).
- **Stale cache**: bump `CACHE_NAME` in `src/sw.ts` whenever you ship changed static assets, otherwise users keep the old app shell.
- **iOS**: `beforeinstallprompt` is not supported — users must use Safari "Add to Home Screen"; `apple-mobile-web-app-capable` covers fullscreen there.
