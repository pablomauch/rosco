// Subir CACHE cada vez que se publique una versión nueva (por ejemplo, una tanda nueva de roscos)
const CACHE = 'rosco-v7';
const FILES = ['./', 'index.html', 'data.js', 'multi.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png', 'fonts/unbounded-latin-400-normal.woff2', 'fonts/unbounded-latin-600-normal.woff2', 'fonts/unbounded-latin-800-normal.woff2', 'fonts/onest-latin-400-normal.woff2', 'fonts/onest-latin-500-normal.woff2', 'fonts/onest-latin-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // red primero (para recibir tandas nuevas), caché si no hay internet
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: true})));
});
