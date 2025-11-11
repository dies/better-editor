const CACHE_VERSION = Date.now(); // Auto-updated on deploy
const CACHE_NAME = `notais-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/logo.svg'
];

// Check if running in development
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1';

// Install event - cache resources (skip in development)
self.addEventListener('install', (event) => {
  if (isDevelopment) {
    console.log('Development mode: Skipping cache');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Production: Caching resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache in production, always network in development
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // In development, always fetch from network (no cache)
  if (isDevelopment) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Production: cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Handle file opening from file handler API
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'OPEN_FILE') {
    // Forward to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'OPEN_FILE',
          file: event.data.file
        });
      });
    });
  }
});

