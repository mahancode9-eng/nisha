const CACHE_NAME = 'nisha-v1';
const STATIC_ASSETS = [
  '/',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/manifest.json',
];

// Auth-gated route prefixes whose HTML must never be cached, to avoid serving
// stale or leaked authenticated pages from the cache when back online.
const AUTH_PREFIXES = ['/customer', '/seller', '/admin', '/api/'];

function isAuthGated(url) {
  const path = new URL(url).pathname;
  return AUTH_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path === p);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // API requests: always go to the network, fall back to cache when offline.
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: network-first so users always see fresh content and
  // authenticated state. Fall back to cache only when the network fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !isAuthGated(request.url)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first (stale-while-revalidate).
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
