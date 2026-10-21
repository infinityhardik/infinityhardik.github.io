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

// Download every listed asset fresh from the server into the cache
const precache = () => caches.open(CACHE_NAME).then((cache) => {
    // Use cache: 'reload' to force a fresh fetch from the network
    return Promise.all(
        ASSETS.map(url => {
            return fetch(new Request(url, { cache: 'reload' }))
                .then(response => {
                    if (response.ok) return cache.put(url, response);
                    throw new Error(`Failed to fetch ${url}`);
                })
                .catch(err => console.warn('Caching failed for:', url, err));
        })
    );
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
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

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Background fetch to update the cache (Stale-While-Revalidate)
                const fetchPromise = fetch(event.request, {
                    // Bypass the browser cache for app files so the update is the server version
                    cache: (isAppFile(url) ? 'no-cache' : 'default')
                }).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Silently fail network errors in background
                });

                // Return cached version immediately, or wait for network if not in cache
                return cachedResponse || fetchPromise;
            });
        })
    );
});
