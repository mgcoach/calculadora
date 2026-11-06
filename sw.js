// Calculadora MG COACH 1.0.0 — service worker
// Página: busca a versão nova na rede primeiro e usa a cópia guardada sem internet.
// Fontes e ícones: usa a cópia guardada e atualiza em segundo plano.
// Buscas no Open Food Facts nunca passam pelo cache.
const CACHE_NAME = 'mgcoach-calculadora-v1-0-0';
const ASSETS = ['./', './index.html', './manifest.json', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith('mgcoach-calculadora') && k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE_NAME).then(c => c.put('./index.html', copia));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === self.location.origin || fonte) {
    e.respondWith(
      caches.match(req).then(cached => {
        const rede = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copia));
          }
          return res;
        }).catch(() => cached);
        return cached || rede;
      })
    );
  }
});
