// Service worker: cachea la app (no la API). Subir VERSION en cada publicación.
const VERSION = 'flota-v2.1.0';
const SHELL = ['./', 'index.html', 'styles.css?v=2.1.0', 'app.js?v=2.1.0', 'config.js?v=2.1.0', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return; // API: siempre red
  if (url.origin === location.origin) {
    // App: red primero (para tomar actualizaciones), caché si no hay señal
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: false }).then((r) => r || caches.match('index.html'))));
    return;
  }
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return res;
    })));
  }
});
