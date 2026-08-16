// App-shell + runtime caching, hand-rolled (no Workbox — the strategy is
// simple enough not to need it). Three rules:
//  1. Never cache anything but GET (writes always hit the network).
//  2. Same-origin API GETs: network-first, falling back to the last cached
//     response when offline (so History/Account can still show stale data).
//  3. Everything else (app shell, JS/CSS, icons): cache-first, filling the
//     cache as things are fetched; SPA navigations fall back to the cached
//     shell so a direct/offline visit to a client-side route still boots.
// Bump the shell version on every fix that touches this file — it also forces
// a clean cache for anyone whose cache was poisoned by the bug fixed below.
const SHELL_CACHE = 'visionwise-shell-v2'
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
      // vercel.json's SPA rewrite (`/(.*) -> /index.html`) is a catch-all: if a
      // hashed asset request ever falls through it — a deploy-timing race, a
      // dropped file — Vercel returns index.html with a 200, not a 404. Caching
      // that blindly under the asset's own URL poisons this cache permanently
      // for that URL, breaking the app until the user manually clears site
      // data, immune to any later fix since cache-first serves it forever.
      // Only cache real hits: ok status, and no HTML swapped in for a
      // non-HTML request.
      const looksSwapped = res.ok && !request.url.endsWith('.html') && !request.url.endsWith('/')
        && (res.headers.get('content-type') || '').includes('text/html')
      if (res.ok && !looksSwapped) {
        const copy = res.clone()
        caches.open(SHELL_CACHE).then(c => c.put(request, copy))
      }
      return res
    }))
  )
})
