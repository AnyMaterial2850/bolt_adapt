import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'Adapt-cache-v1';

// Add event listeners for the service worker lifecycle
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');

});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');

});

self.addEventListener('push', (event) => {
  if (event.data) {
    const notification = event.data.json();
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/pwa-192x192.png',
    });
  }
});