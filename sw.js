/**
 * Cookbook PWA - Service Worker
 * Provides offline caching for the cookbook application
 */

const CACHE_NAME = 'cookbook-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/recipe.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/recipe.js',
    '/data/recipes.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('🧹 Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (like fonts, images from CDN)
    if (!event.request.url.startsWith(self.location.origin)) {
        // For external images, try network first, then cache
        if (event.request.destination === 'image') {
            event.respondWith(
                caches.open(CACHE_NAME).then((cache) => {
                    return fetch(event.request)
                        .then((response) => {
                            cache.put(event.request, response.clone());
                            return response;
                        })
                        .catch(() => cache.match(event.request));
                })
            );
        }
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, networkResponse);
                            });
                        }
                    }).catch(() => { });
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache successful responses
                        if (networkResponse.ok) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Return offline fallback for HTML pages
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
