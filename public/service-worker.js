// Load Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded');

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.precaching.cleanupOutdatedCaches();

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Cache Supabase API calls
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('supabase.co') && url.pathname.startsWith('/rest/v1/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'supabase-api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        }),
      ],
    })
  );

  // Cache Google Fonts
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
      ],
    })
  );

  // Handle push notifications
  self.addEventListener('push', (event) => {
    if (event.data) {
      try {
        const notification = event.data.json();
        self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [100, 50, 100],
          data: notification.data || {},
          actions: notification.actions || [],
          tag: notification.tag || 'default',
          renotify: notification.renotify || false,
          requireInteraction: notification.requireInteraction || false
        });
      } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to simple notification if JSON parsing fails
        self.registration.showNotification('New Notification', {
          body: event.data.text(),
          icon: '/pwa-192x192.png'
        });
      }
    }
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // This looks to see if the current is already open and focuses it
    event.waitUntil(
      clients.matchAll({
        type: 'window'
      }).then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  });
} else {
  console.error('Workbox failed to load');
}
