const CACHE_NAME = "hireos-offline-v2";
const OFFLINE_URL = "/offline.html";
const LOTTIE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.0/lottie.min.js";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([OFFLINE_URL, LOTTIE_CDN]).catch(() => {
          return cache.add(OFFLINE_URL);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
