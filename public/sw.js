const CACHE = "doborka-v5";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_serverFn")) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          const copy = fresh.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }
        return new Response("Нет сети. Откройте Доборку ещё раз, когда связь появится.", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
