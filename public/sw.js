const CACHE_NAME = 'vacaciones-sitt-v8';
const STATIC_ASSETS = [
  '/vacaciones-frontend/',
  '/vacaciones-frontend/index.html',
  '/vacaciones-frontend/escudo-sitt.png',
  '/vacaciones-frontend/LOGO_VACACIONES.png',
  '/vacaciones-frontend/icon-192x192.png',
  '/vacaciones-frontend/icon-512x512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('onrender.com') || e.request.url.includes('/api/')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      }).catch(() => caches.match('/vacaciones-frontend/'));
    })
  );
});
