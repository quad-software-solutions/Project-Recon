const CACHE_NAME = 'media-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Only cache GET requests for media (images/videos) or our /media API endpoint
  if (e.request.method === 'GET' && 
      (url.pathname.startsWith('/media/') || 
       e.request.destination === 'image' || 
       e.request.destination === 'video')) {
       
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        // Return cached response if found (CacheFirst strategy)
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network and cache it
        return fetch(e.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }

          // Clone the response because it's a stream that can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});
