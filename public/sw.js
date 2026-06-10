// cicloCRED CRM PWA Service Worker (PWA Installability Support - Cache Bypass)
const CACHE_NAME = 'ciclocred-v3-bypass';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Evicting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// A fetch event handler must be present for PWA installation capability,
// but we leave it empty/direct to allow the browser to always fetch fresh assets.
self.addEventListener('fetch', (event) => {
  // Direct bypass to ensure maximum runtime reliability and absolute prevention of blank screens
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


