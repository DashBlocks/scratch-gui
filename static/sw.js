/*
    Dash service worker: installable app + offline shell.

    - Same-origin static assets (js/css/media/fonts) are cached cache-first,
      so the editor shell loads offline and instantly on repeat visits.
    - Navigations are network-first with a cached fallback.
    - API and cross-origin requests are never cached: projects, accounts and
      collaboration must always talk to the server.
*/

const CACHE_NAME = 'dash-shell-v1';
const CACHEABLE_PATHS = /(?:^|\/)static\/|\/[^/?]+\.(?:js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|webp|mp3|wav)(?:\?|$)/i;

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) {
            if (key !== CACHE_NAME) await caches.delete(key);
        }
        await self.clients.claim();
    })());
});

const cacheableRequest = request => {
    if (request.method !== 'GET') return false;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    return CACHEABLE_PATHS.test(url.pathname);
};

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return; // API stays live
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone());
                return response;
            } catch (error) {
                const cached = await caches.match(request);
                return cached || Response.error();
            }
        })());
        return;
    }
    if (!cacheableRequest(request)) return;
    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    })());
});
