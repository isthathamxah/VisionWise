// App-shell + runtime caching, hand-rolled (no Workbox — the strategy is
// simple enough not to need it). Three rules:
//  1. Never cache anything but GET (writes always hit the network).
//  2. Same-origin API GETs: network-first, falling back to the last cached
//     response when offline (so History/Account can still show stale data).
//  3. Everything else (app shell, JS/CSS, icons): cache-first, filling the
//     cache as things are fetched; SPA navigations fall back to the cached
//     shell so a direct/offline visit to a client-side route still boots.
const SHELL_CACHE = 'visionwise-shell-v1'
const API_CACHE = 'visionwise-api-v1'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(c => c.add('/')))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone()
          caches.open(API_CACHE).then(c => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(res => {
      const copy = res.clone()
      caches.open(SHELL_CACHE).then(c => c.put(request, copy))
      return res
    }))
  )
})
