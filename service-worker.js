const CACHE_NAME = 'mt-order-v1'; // Incremented version
const ASSETS = [
    'index.html',
    'style.css',
    'products.json',
    'assets/manifest.json',
    'assets/favicon.webp',
    'assets/help-modal-content.html',
    'src/script_pwa.js',
    'dist/main.min.js'
];

// Helper to check if a request is for one of our static assets
const isStaticAsset = (url) => {
    return ASSETS.some(asset => url.endsWith(asset)) || url === self.location.origin + '/';
};

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use cache: 'reload' to force a fresh fetch from the network during install
            return Promise.all(
                ASSETS.map(url => {
                    return fetch(new Request(url, { cache: 'reload' }))
                        .then(response => {
                            if (response.ok) return cache.put(url, response);
                            throw new Error(`Failed to fetch ${url}`);
                        })
                        .catch(err => console.warn('Install caching failed for:', url, err));
                })
            );
        })
    );
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

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Background fetch to update the cache (Stale-While-Revalidate)
                const fetchPromise = fetch(event.request, {
                    // Try to bypass browser cache if it's a critical file to ensure we get the server version
                    cache: (isStaticAsset(url) ? 'no-cache' : 'default')
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
