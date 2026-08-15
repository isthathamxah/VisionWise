// Minimal service worker — its only job is to make the app installable
// ("Add to Home Screen"), which Chrome requires a registered SW with a
// fetch handler for. No offline caching yet.
// ponytail: pass-through only; add a cache strategy if offline support matters.
self.addEventListener('fetch', () => {})
