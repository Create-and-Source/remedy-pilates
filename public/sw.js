const CACHE_NAME = 'remedy-v2';
const OFFLINE_URL = '/offline.html';

// Core shell to pre-cache on install
const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// ── Install: pre-cache app shell + offline page ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches, claim clients ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── Fetch: strategy depends on request type ──
self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Skip non-GET requests (form posts, etc.)
  if (request.method !== 'GET') return;

  // Skip chrome-extension, external URLs, etc.
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation requests (HTML pages) → Network-first, fall back to cache, then offline page
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache-first (hashed filenames are immutable)
  if (
    request.url.includes('/assets/') ||
    request.url.includes('.woff') ||
    request.url.includes('.woff2') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.svg') ||
    request.url.includes('.ico')
  ) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Google Fonts → Cache-first with network fallback
  if (request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  // Everything else → Network-first, fall back to cache
  e.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push notifications ──
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Remedy Pilates & Barre';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
