// BountyTimer service worker (PRD §5.4).
//
// Strategy:
//  - App shell + same-origin static assets: cache-first, so the UI opens
//    instantly and works offline.
//  - Navigations: network-first, falling back to the cached shell when offline.
//  - API requests (cross-origin): never cached — they go straight to the
//    network; the app's own sync layer queues writes while offline.

const CACHE = 'bountytimer-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle same-origin requests; let API/cross-origin pass through.
  if (url.origin !== self.location.origin) return

  // Navigations: network-first with offline shell fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    )
    return
  }

  // Static assets: cache-first, then populate the cache on first fetch.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return resp
        }),
    ),
  )
})
