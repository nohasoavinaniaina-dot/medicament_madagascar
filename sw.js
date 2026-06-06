// Service Worker — Médicaments Madagascar PWA v52
const CACHE_NAME = 'medicaments-mada-v52';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Installation : mise en cache des assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME && name !== CACHE_NAME + '-external'; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch : Cache-First pour local, Network-First pour externe (polices)
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ressources externes (Google Fonts, etc.) : réseau puis cache
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME + '-external').then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Fichiers locaux : cache d'abord, réseau en arrière-plan (stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      const networkFetch = fetch(event.request).then(function(fresh) {
        if (fresh && fresh.status === 200) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, fresh.clone());
          });
        }
        return fresh;
      }).catch(function() {});

      return cached || networkFetch;
    })
  );
});
