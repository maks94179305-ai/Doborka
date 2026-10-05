const CACHE = "doborka-web-v1";
self.addEventListener("install", (event) => { event.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh.ok) caches.open(CACHE).then((cache) => cache.put(req, fresh.clone())).catch(() => {});
      return fresh;
    } catch {
      if (req.mode === "navigate") {
        const home = await caches.match("./") || await caches.match("index.html");
        if (home) return home;
      }
      return cached || new Response("Нет сети. Откройте Доборку один раз при связи, затем она будет работать офлайн.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  })());
});
