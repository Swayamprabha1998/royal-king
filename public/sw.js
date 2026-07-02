const CACHE_NAME = 'aqua-match-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-first with Cache fallback)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      // Clone response to cache it
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        // Only cache GET requests from our origin
        if (e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
          cache.put(e.request, resClone);
        }
      });
      return res;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});
