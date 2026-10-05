const CACHE = "doborka-web-v2";
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
  if (req.method !== "GET" || req.mode === "navigate") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh.ok) caches.open(CACHE).then((cache) => cache.put(req, fresh.clone())).catch(() => {});
      return fresh;
    } catch {
      return (await caches.match(req)) || new Response("", { status: 504 });
    }
  })());
});
