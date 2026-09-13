# File: sw.js
- **Original Path:** `frontend/public/sw.js`
- **Language / Type:** `javascript`
- **Lines of Code:** 87

---

```javascript
// Natal Vagas PWA Service Worker (v1.0.0)
const CACHE_NAME = 'natalvagas-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/logo-natalvagas.jpg',
  '/assets/pwa-192x192.png',
  '/assets/pwa-512x512.png'
];

// Instalação: Pré-cache dos ativos fundamentais da casca da aplicação (App Shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: Limpeza de caches obsoletos de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Estratégias inteligentes de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de outras origens ou de APIs externas (ex: AdSense, Google Fonts, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignora chamadas de API serverless do backend
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Catálogo de Vagas (/data/jobs.json): Network First com Fallback para Cache
  if (url.pathname.includes('/data/jobs.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 2. Navegação de Páginas HTML (SPA): Network First com Fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Ativos Estáticos (JS, CSS, Imagens, Fontes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

```
