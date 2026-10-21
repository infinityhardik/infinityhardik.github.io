const CACHE_NAME = 'mt-order-v5'; // Bump when the asset list changes
const ASSETS = [
    './',            // start_url — lets the installed app open offline
    'index.html',
    'style.css',
    'products.json',
    'assets/manifest.json',
    'assets/logo-144.webp',
    'assets/favicon-32.png',
    'assets/apple-touch-icon.png',
    'assets/icon-192.png',
    'assets/fonts/inter-latin-var.woff2',
    'assets/help-modal-content.html',
    'src/script_pwa.js',
    'dist/main.min.js'
];

// Files that change with each deploy (page, styles, scripts, product data).
// Their background refresh always asks the server, never the browser's HTTP cache.
const isAppFile = (url) => {
    const { pathname } = new URL(url);
    return pathname.endsWith('/') || /\.(html|css|js|json)$/.test(pathname);
};

// Download every listed asset fresh from the server into the cache.
// A missing file is logged but doesn't fail the install, so one bad asset
// can't keep the whole app from working offline.
const precache = () => caches.open(CACHE_NAME).then((cache) => Promise.all(
    // cache: 'reload' skips the browser's HTTP cache
    ASSETS.map((url) => fetch(new Request(url, { cache: 'reload' }))
        .then((response) => {
            if (response.ok) return cache.put(url, response);
            throw new Error(`HTTP ${response.status}`);
        })
        .catch((err) => console.warn('Caching failed for:', url, err)))
));

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// A hard refresh bypasses the service worker, so the page asks for the cache to
// be refreshed (see script_pwa.js) — otherwise the next normal load would show
// the old cached copy again.
self.addEventListener('message', (event) => {
    if (event.data !== 'refresh-cache') return;
    event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
        await precache();
        // Also refresh anything cached at runtime (e.g. src/ scripts on master)
        const requests = await cache.keys();
        await Promise.all(requests.map(request =>
            fetch(request.url, { cache: 'reload' })
                .then(response => { if (response.ok) return cache.put(request, response); })
                .catch(() => { })
        ));
    }));
});

// Stale-while-revalidate: answer from the cache at once, and refresh the cached
// copy in the background for the next load.
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    // Only this site's files are cached; anything else goes straight to the network
    if (new URL(request.url).origin !== self.location.origin) return;

    const networkResponse = fetch(request, {
        // Bypass the browser cache for app files so the update is the server version
        cache: isAppFile(request.url) ? 'no-cache' : 'default'
    });
    // The copy for the cache is taken first, before the page can start reading the body
    const responseForCache = networkResponse.then((response) => response.clone());

    // Keep the worker alive until the refreshed copy is stored
    event.waitUntil(Promise.all([caches.open(CACHE_NAME), responseForCache])
        .then(([cache, response]) => {
            if (response.status === 200) return cache.put(request, response);
        })
        .catch(() => { /* offline: keep the cached copy */ }));

    event.respondWith(caches.open(CACHE_NAME)
        .then((cache) => cache.match(request))
        // Not cached yet: wait for the network (a network error if offline)
        .then((cachedResponse) => cachedResponse || networkResponse.catch(() => Response.error())));
});
