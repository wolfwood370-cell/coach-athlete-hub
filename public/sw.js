// Kill-switch service worker.
//
// A previous build registered a Workbox-powered service worker via
// `vite-plugin-pwa`. That worker cached navigation responses with stale
// validators and produced "HTTP 412" errors on the Lovable preview origin,
// blocking login for both the coach platform and the athlete app.
//
// This file replaces that worker. It claims all clients, deletes every
// Cache Storage entry, force-navigates open tabs to a fresh URL so the
// next request bypasses the SW, then unregisters itself. Keep this file
// for at least one release cycle so devices that still have the old SW
// installed can self-clean.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        await Promise.all(
          clientList.map((client) => {
            try {
              const url = new URL(client.url);
              url.searchParams.set("sw-cleanup", Date.now().toString());
              return client.navigate(url.toString());
            } catch {
              return Promise.resolve();
            }
          })
        );

        await self.registration.unregister();
      } catch (err) {
        // Best-effort cleanup; swallow errors to avoid leaving the SW in
        // a broken active state.
        console.warn("[sw] cleanup failed", err);
      }
    })()
  );
});

// Pass-through fetch handler so navigations hit the network directly while
// the worker is still controlling clients (between activate and the
// post-cleanup reload).
self.addEventListener("fetch", () => {});
