// Service Worker — build 时会按 BASE_PATH 重写；此处为开发默认
const CACHE_NAME = 'tiyu-sudi-v4'
const BASE = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        BASE,
        new URL('manifest.json', BASE).href,
        new URL('apple-touch-icon-v3.png', BASE).href,
        new URL('icon-192-v3.png', BASE).href,
        new URL('icon-512-v3.png', BASE).href,
        new URL('maskable-512-v3.png', BASE).href,
      ])
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})
