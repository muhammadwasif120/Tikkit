// Tikkit Service Worker — v1
// Minimal SW that satisfies PWA installability (Chrome requires fetch handler)
// Serves as a network-first pass-through; no aggressive caching for now.

const CACHE_NAME = 'tikkit-v1'

// Assets to pre-cache for basic offline shell
const PRECACHE_URLS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  // Activate immediately — don't wait for old SW to go away
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first strategy: always try network, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests on same origin or icons
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip Supabase API calls, auth, etc — always network
  if (url.hostname !== self.location.hostname) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for icons/static assets
        if (response.ok && url.pathname.startsWith('/icons/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(event.request)
      })
  )
})
