/* Service worker de Radar de Clientes.
 * - Navegación: red primero, con la app guardada como respaldo sin conexión.
 * - /assets/* (archivos con hash): caché primero.
 * - Resto del mismo origen: sirve la copia guardada y la refresca en segundo plano.
 * - Google Places, PageSpeed, Gemini y demás orígenes externos NO se interceptan: siempre van a la red. */
const VERSION = 'radar-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.addAll(SHELL_URLS);
      // Guarda también el JS/CSS con hash que referencia el index.html para que arranque sin conexión.
      try {
        const html = await (await fetch('/', { cache: 'no-store' })).text();
        const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll(assets);
      } catch (_) {
        /* si falla, se guardarán al usarse */
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put('/', fresh.clone());
          return fresh;
        } catch (_) {
          return (await caches.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) (await caches.open(RUNTIME)).put(request, res.clone());
        return res;
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then(async (res) => {
          if (res.ok) (await caches.open(RUNTIME)).put(request, res.clone());
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })()
  );
});
