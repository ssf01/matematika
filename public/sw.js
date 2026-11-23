/* Matematika service worker — offline support.
 *
 * At build time the `precache-manifest` integration in astro.config.mjs prepends
 * `self.__PRECACHE_MANIFEST__` (list of built files) and `self.__PRECACHE_VERSION__`
 * (content hash) to dist/sw.js, so every deploy gets a fresh cache. In `astro dev`
 * they are undefined and the SW is not registered anyway (see Layout.astro).
 *
 * Strategies (same-origin GET only; third-party requests such as analytics are
 * never intercepted or cached):
 *   - HTML / navigations: network-first, fall back to cache (offline)
 *   - /_astro/* (hashed, immutable): cache-first
 *   - other same-origin files: stale-while-revalidate
 */
// Without a build-time manifest (e.g. raw public/sw.js served by `astro dev`)
// this worker must not cache anything: unregister and bail out.
const IS_BUILD = Array.isArray(self.__PRECACHE_MANIFEST__);
const PRECACHE = self.__PRECACHE_MANIFEST__ || [];
const VERSION = self.__PRECACHE_VERSION__ || 'dev';
const CACHE = `matematika-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // bypass the HTTP cache so a fresh deploy never precaches stale HTML
        cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  if (!IS_BUILD) {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith('matematika-')).map((k) => caches.delete(k))))
        .then(() => self.registration.unregister()),
    );
    return;
  }
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('matematika-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/'));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  if (!IS_BUILD) return;
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // analytics & other third parties

  const isHtml =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname !== '/sw.js') {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
