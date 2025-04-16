/**
 * ADAPT Health Service Worker
 * Enhanced for better offline support and reliability
 * 
 * Version: 1.0.0
 * Last Updated: 2025-04-16
 */

// Configuration parameters - Keep in sync with serviceWorkerConfig.ts
const SW_CACHE_VERSION = '1.0.0';
const CACHE_NAMES = {
  STATIC: `static-assets-${SW_CACHE_VERSION}`,
  DYNAMIC: `dynamic-content-${SW_CACHE_VERSION}`,
  IMAGES: `images-${SW_CACHE_VERSION}`,
  API: `api-responses-${SW_CACHE_VERSION}`,
  COMPLETION: `habit-completions-${SW_CACHE_VERSION}`,
};

// URL patterns for different caching strategies
const URL_PATTERNS = {
  // Files that should never be cached
  NEVER_CACHE: [
    /\/src\/stores\/completionStore\.ts$/,
    /\/src\/stores\/habitStore\.ts$/,
    /\.env$/,
    /auth\/token/,
  ],
  
  // Files that should always be cached with network-first strategy
  NETWORK_FIRST: [
    /supabase\.co\/rest\/v1\//,
    /\/stores\//,
    /\/services\//,
  ],
  
  // Files that should be cached with stale-while-revalidate
  STALE_WHILE_REVALIDATE: [
    /\/components\//,
    /\/pages\//,
  ],
  
  // Files that should be cached with cache-first strategy
  CACHE_FIRST: [
    /\.(css|js|html|ico|jpg|jpeg|png|gif|svg|woff|woff2)$/,
    /fonts\.(googleapis|gstatic)\.com/,
  ],
};

// Helper functions - Keep in sync with serviceWorkerConfig.ts
function shouldCache(url) {
  return !URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(url));
}

function getCacheNameForUrl(url) {
  if (url.includes('habit_comp_track') || url.includes('completion')) {
    return CACHE_NAMES.COMPLETION;
  }
  
  if (url.includes('supabase.co')) {
    return CACHE_NAMES.API;
  }
  
  if (/\.(jpg|jpeg|png|gif|svg)$/.test(url)) {
    return CACHE_NAMES.IMAGES;
  }
  
  return CACHE_NAMES.STATIC;
}

function getCachingStrategyForUrl(url) {
  // Check if URL should never be cached
  if (URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(url))) {
    return 'no-cache';
  }
  
  // Check if URL should use network-first strategy
  if (URL_PATTERNS.NETWORK_FIRST.some(pattern => pattern.test(url))) {
    return 'network-first';
  }
  
  // Check if URL should use stale-while-revalidate strategy
  if (URL_PATTERNS.STALE_WHILE_REVALIDATE.some(pattern => pattern.test(url))) {
    return 'stale-while-revalidate';
  }
  
  // Check if URL should use cache-first strategy
  if (URL_PATTERNS.CACHE_FIRST.some(pattern => pattern.test(url))) {
    return 'cache-first';
  }
  
  // Default to network-first for safety
  return 'network-first';
}

// Try to load Workbox from CDN with fallback
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
  
  if (!workbox) {
    throw new Error('Workbox failed to load from CDN');
  }
  
  console.log('[Service Worker] Workbox loaded successfully');
  
  // Send version info to clients for logging
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_VERSION',
        version: SW_CACHE_VERSION
      });
    });
  });
} catch (error) {
  console.error('[Service Worker] Failed to load Workbox:', error);
  
  // Basic service worker functionality without Workbox
  self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', (event) => {
    // Don't cache sensitive files even in fallback mode
    const url = event.request.url;
    if (URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(url))) {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response('Offline mode - Resource cannot be loaded', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
      );
      return;
    }
    
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline mode - Please check your connection', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  });
}

// If Workbox loaded successfully, set up advanced caching
if (workbox) {
  // Listen for skip waiting messages
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  
  // Take control immediately
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
  
  // Clean up old caches
  workbox.precaching.cleanupOutdatedCaches();
  
  // Log cache events in development
  const DEBUG = false; // Set to true for debugging
  workbox.core.setLogLevel(DEBUG ? 'debug' : 'warn');
  
  // Precache core app files
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  // Create a queue for failed requests
  const bgSyncQueue = new workbox.backgroundSync.Queue('failed-requests-queue', {
    maxRetentionTime: 24 * 60 // Retry for up to 24 hours (specified in minutes)
  });
  
  // --- Cache Strategies ---
  
  // 1. Special handling for completion store - always use NetworkFirst with minimal caching
  workbox.routing.registerRoute(
    ({ url }) => url.toString().includes('completionStore') || 
                url.toString().includes('habit_comp_track'),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.COMPLETION,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1 hour
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ],
      networkTimeoutSeconds: 5
    })
  );
  
  // 2. Store files - don't cache certain store files
  workbox.routing.registerRoute(
    ({ url }) => {
      const urlString = url.toString();
      return urlString.includes('/stores/') && 
             !URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(urlString));
    },
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.DYNAMIC,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  // 3. Static Assets (JS, CSS, Images)
  workbox.routing.registerRoute(
    ({ request }) => 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.STATIC,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  // 4. Supabase API Calls - More comprehensive
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('supabase.co'),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.API,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        {
          // Add background sync for failed requests
          fetchDidFail: async ({ request }) => {
            // Clone the request to save it to the background sync queue
            await bgSyncQueue.pushRequest({ request: request.clone() });
          }
        }
      ],
      networkTimeoutSeconds: 10 // Timeout if network takes too long
    })
  );
  
  // 5. Chat API Calls
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('api.intellaigent.starti.no'),
    new workbox.strategies.NetworkOnly({
      plugins: [
        {
          // Add background sync for failed requests
          fetchDidFail: async ({ request }) => {
            // Clone the request to save it to the background sync queue
            await bgSyncQueue.pushRequest({ request: request.clone() });
          }
        }
      ]
    })
  );
  
  // 6. Google Fonts
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.STATIC,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  // 7. Components and pages - use stale-while-revalidate
  workbox.routing.registerRoute(
    ({ url }) => {
      const urlString = url.toString();
      return urlString.includes('/components/') || urlString.includes('/pages/');
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAMES.DYNAMIC,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  // 8. Default strategy for everything else
  workbox.routing.setDefaultHandler(
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAMES.DYNAMIC,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // 9. Offline fallback
  workbox.routing.setCatchHandler(async ({ event }) => {
    // Return specific fallbacks based on request type
    switch (event.request.destination) {
      case 'document':
        // If we're offline, return the cached homepage as a fallback
        return workbox.precaching.matchPrecache('/index.html')
          .then(response => response || caches.match('/index.html'))
          .catch(() => {
            return new Response('You are offline. Please check your connection.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      
      case 'image':
        // Return a placeholder image
        return new Response(
          '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="400" height="300" fill="#eee"/>' +
          '<text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24" fill="#999">Image Offline</text>' +
          '</svg>',
          { headers: { 'Content-Type': 'image/svg+xml' } }
        );
      
      default:
        // For all other requests, return a simple text response
        return new Response('Resource unavailable offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
    }
  });
}

// --- Push Notification Handling ---

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[Service Worker] Push event received but no data');
    return;
  }
  
  try {
    // Try to parse as JSON first
    let notification;
    try {
      notification = event.data.json();
    } catch (e) {
      // If JSON parsing fails, use text
      const text = event.data.text();
      notification = {
        title: 'ADAPT Health',
        body: text,
        data: { url: '/' }
      };
    }
    
    // Ensure we have all required fields
    const notificationOptions = {
      body: notification.body || 'New notification',
      icon: notification.icon || '/pwa-192x192.png',
      badge: notification.badge || '/pwa-192x192.png',
      vibrate: notification.vibrate || [100, 50, 100],
      data: notification.data || { url: '/' },
      actions: notification.actions || [],
      tag: notification.tag || 'default',
      renotify: notification.renotify || false,
      requireInteraction: notification.requireInteraction || false
    };
    
    event.waitUntil(
      self.registration.showNotification(
        notification.title || 'ADAPT Health',
        notificationOptions
      )
    );
  } catch (error) {
    console.error('[Service Worker] Error showing notification:', error);
    
    // Fallback to simple notification
    event.waitUntil(
      self.registration.showNotification('ADAPT Health', {
        body: 'You have a new notification',
        icon: '/pwa-192x192.png'
      })
    );
    
    // Send error to clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ERROR',
          error: `Error showing notification: ${error.message}`
        });
      });
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data || { url: '/' };
  const targetUrl = data.url || '/';
  
  // This looks to see if the current is already open and focuses it
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If we have a client already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  
  // Inform clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_LIFECYCLE',
        state: 'installed',
        version: SW_CACHE_VERSION
      });
    });
  });
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  
  // Immediately claim clients so the new service worker takes control
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches that aren't managed by Workbox
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete caches that don't match our current cache version
            return !cacheName.includes(SW_CACHE_VERSION) && 
                   !cacheName.startsWith('workbox-precache');
          })
          .map(cacheName => {
            console.log('[Service Worker] Removing old cache:', cacheName);
            
            // Notify clients about cache removal
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'CACHE_CLEARED',
                  cacheName: cacheName
                });
              });
            });
            
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Inform clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_LIFECYCLE',
        state: 'activated',
        version: SW_CACHE_VERSION
      });
    });
  });
});

// Log any errors that occur during service worker execution
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event.error);
  
  // Send error to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ERROR',
        error: event.error?.message || 'Unknown service worker error'
      });
    });
  });
});
