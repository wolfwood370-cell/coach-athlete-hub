// Kill-switch service worker (alias of /sw.js).
// vite-plugin-pwa shipped its worker at /sw.js, but we ship the same
// cleanup logic at /service-worker.js too in case any client
// registered it under that path. See public/sw.js for full details.

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
        console.warn("[sw] cleanup failed", err);
      }
    })()
  );
});

self.addEventListener("fetch", () => {});
