// TIKKIT X service worker, v3.
//
// What it does:
//  * keeps the offline page and the app icons ready
//  * keeps the guest's Today, My tickets and Schedule pages available offline, so a QR ticket opens with no signal
//  * serves static files instantly and refreshes them in the background
//
// What it never touches: sign in, the API, the admin area, other sites (Supabase), anything that is not a GET.
// The saved guest pages live in one cache that the app deletes when the person signs out.

const VERSION = 'v3'
const STATIC_CACHE = `tkx-static-${VERSION}`
const PAGES_CACHE = 'tkx-pages-v2' // keep in sync with src/lib/pwa.ts
const OFFLINE_URL = '/offline'
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/brand/tikkit-x-logo.png']
const OFFLINE_PAGES = ['/guest', '/guest/tickets', '/guest/schedule']
const NEVER = ['/api', '/auth', '/master', '/open', '/suspended']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(c => Promise.allSettled(PRECACHE.map(u => c.add(u)))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, PAGES_CACHE])
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k)
    // The offline page must always be on hand, even if the cache was cleared after install.
    try { const c = await caches.open(STATIC_CACHE); if (!(await c.match(OFFLINE_URL))) await c.add(OFFLINE_URL) } catch {}
    await self.clients.claim()
  })())
})

const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
const pageKey = url => new Request(url.origin + url.pathname)

async function pageRequest(req, url) {
  const saved = OFFLINE_PAGES.includes(url.pathname)
  const hit = saved ? await caches.match(pageKey(url), { cacheName: PAGES_CACHE }) : null
  const network = fetch(req).then(res => {
    // Only keep real pages for a signed in guest. A redirect (for example to the login page) is never stored.
    if (saved && res.ok && res.status === 200 && !res.redirected && res.type === 'basic') {
      const copy = res.clone()
      caches.open(PAGES_CACHE).then(c => c.put(pageKey(url), copy))
    }
    return res
  })
  network.catch(() => {}) // if we answer from the saved copy first, a later network failure is not an error
  try {
    // With a saved copy, give the network a few seconds and then show the copy (the network answer still refreshes it).
    // With no saved copy there is nothing better to show, so wait for the network however long it takes.
    return await (hit ? Promise.race([network, timeout(5000)]) : network)
  } catch {
    if (hit) return hit
    return (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

async function staticRequest(req) {
  const cache = await caches.open(STATIC_CACHE)
  const hit = await cache.match(req)
  const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => null)
  return hit || (await fresh) || Response.error()
}

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (NEVER.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) return

  if (req.mode === 'navigate') { event.respondWith(pageRequest(req, url)); return }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/') || /\.(?:woff2?|png|jpe?g|webp|svg)$/.test(url.pathname)) {
    event.respondWith(staticRequest(req))
  }
})
