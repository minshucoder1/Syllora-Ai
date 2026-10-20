/**
 * Syllora AI — Production Service Worker
 * Precaches app shell, static assets, and provides offline navigation fallback
 */

const CACHE_NAME = 'syllora-shell-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW Install Notice]:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Evicting outdated cache:', name);
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API requests, authentication routes, or non-GET requests
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Navigation requests: Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        return (
          cachedIndex ||
          new Response(
            `<!DOCTYPE html><html><head><title>Syllora AI — Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#050508;color:#f4f4f6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;"><div style="padding:24px;border:1px solid #7f1d1d;border-radius:16px;background:#0d0d18;max-width:400px;"><h1 style="color:#ef4444;font-size:20px;margin-bottom:8px;">You are currently offline</h1><p style="color:#94a3b8;font-size:14px;line-height:1.5;">You can continue reading all downloaded study notes, flashcards, questions, and solved problems in Syllora AI Offline Study Mode.</p><a href="/" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#dc2626;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:12px;">Open Offline Study Mode</a></div></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          )
        );
      })
    );
    return;
  }

  // Static Assets (scripts, styles, images, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => cachedResponse);
    })
  );
});
