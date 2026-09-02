/**
 * Dobby's service worker.
 *
 * It exists mostly because Chrome will not offer to install a site without
 * one that handles fetch, but since it's here it may as well make him work
 * on the Underground.
 */

const CACHE = "dobby-v1";
const PRECACHE = ["/", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 doesn't sink the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Navigations go network-first so a fresh deploy is picked up immediately,
  // falling back to the cached shell when there's no signal.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = (await caches.match(request)) ?? (await caches.match("/"));
          return cached ?? new Response("Dobby is offline and unreachable.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }),
    );
    return;
  }

  // Everything else is hashed build output, so cache-first is safe.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
