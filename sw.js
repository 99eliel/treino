const CACHE = 'shape-pwa-v2.3.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=2.0.0',
  './app.js?v=2.1.0',
  './cardio-phase.js?v=2.2.0',
  './phase-watch.js?v=2.2.0',
  './enhancements.js?v=2.3.0',
  './manifest.webmanifest?v=2.2.0',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'no-store' })
    : event.request;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
  );
});
