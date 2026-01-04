/**
 * TinniTune Service Worker
 * Provides offline support and performance optimization through intelligent caching
 */

const CACHE_VERSION = 'tinnitune-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.PNG',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Maximum cache size for dynamic content
const MAX_DYNAMIC_CACHE_SIZE = 50;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions
            if (cacheName.startsWith('tinnitune-') &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== DATA_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event - Serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external requests
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('localhost')) {
    return;
  }

  // API/Data requests - Network first, cache fallback
  if (request.url.includes('/api/') || request.url.includes('tinnitune_')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, network fallback
  if (STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
      request.url.includes('/assets/') ||
      request.url.includes('/icons/') ||
      request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Everything else - Stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request));
});

/**
 * Cache First Strategy - For static assets
 * Serves from cache, falls back to network, caches new responses
 */
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache the new response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline');
  }
}

/**
 * Network First Strategy - For API/data requests
 * Tries network first, falls back to cache on failure
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache either, return error
    return new Response(JSON.stringify({
      error: 'Offline - data not available',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Stale While Revalidate - For HTML pages
 * Returns cached version immediately, updates cache in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse); // Return cached if network fails

  // Return cached immediately if available
  return cachedResponse || fetchPromise;
}

/**
 * Background Sync - Sync data when connection restored
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-therapy-data') {
    event.waitUntil(syncTherapyData());
  }
});

/**
 * Sync therapy data to server when online
 */
async function syncTherapyData() {
  try {
    // Check if there's pending data in IndexedDB or localStorage
    const clients = await self.clients.matchAll();

    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_DATA',
        message: 'Connection restored, syncing data...'
      });
    });

    console.log('[Service Worker] Data sync initiated');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

/**
 * Message Handler - Communication with main app
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls;
    caches.open(DYNAMIC_CACHE)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

/**
 * Limit cache size to prevent storage overflow
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[Service Worker] Trimmed ${deleteCount} items from ${cacheName}`);
  }
}

// Periodically clean up dynamic cache
setInterval(() => {
  limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
}, 60000); // Every minute

console.log('[Service Worker] Loaded');
