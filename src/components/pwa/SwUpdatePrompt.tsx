/**
 * Deprecated: PWA / Service Worker support was removed from this project
 * after the previous worker (registered via `vite-plugin-pwa`) caused
 * HTTP 412 errors on the Lovable preview origin and blocked login.
 *
 * The kill-switch workers in `public/sw.js` and `public/service-worker.js`
 * now uninstall any leftover service worker on browsers that still have
 * it. This component is kept as a no-op so existing imports do not break,
 * but it renders nothing.
 */
export function SwUpdatePrompt() {
  return null;
}
