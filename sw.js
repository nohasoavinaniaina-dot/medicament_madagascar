const CACHE_NAME = 'medicaments-mada-v74';
const BASE = '/medicament_madagascar';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request).then(r => { if (r && r.status===200) caches.open(CACHE_NAME+'-ext').then(c=>c.put(e.request,r.clone())); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => {
    fetch(e.request).then(r => { if (r && r.status===200) caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone())); }).catch(()=>{});
    return cached || fetch(e.request);
  }));
});
