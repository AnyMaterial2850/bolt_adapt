// Log service worker activation
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activated', new Date().toISOString());
  // Claim clients to ensure the service worker takes control immediately
  event.waitUntil(self.clients.claim());
});

// Log service worker installation
self.addEventListener('install', event => {
  console.log('[Service Worker] Installed', new Date().toISOString());
  // Skip waiting to ensure the service worker activates immediately
  self.skipWaiting();
});

// Enhanced push event handler with detailed logging
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received at', new Date().toISOString());
  
  let data = {};
  let rawData = null;
  
  if (event.data) {
    try {
      rawData = event.data.text();
      console.log('[Service Worker] Raw push data:', rawData);
      data = event.data.json();
      console.log('[Service Worker] Parsed push data:', JSON.stringify(data));
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      data = { title: 'Notification', body: rawData || 'No content' };
    }
  } else {
    console.warn('[Service Worker] Push event received without data');
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data.data || {},
    tag: data.tag || undefined,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    timestamp: Date.now()
  };

  console.log('[Service Worker] Showing notification:', { title, options });
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notification shown successfully');
        // Attempt to send a message to any open clients
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(clients => {
        if (clients && clients.length) {
          console.log('[Service Worker] Sending message to clients:', clients.length);
          clients.forEach(client => {
            client.postMessage({
              type: 'PUSH_RECEIVED',
              title,
              options,
              timestamp: Date.now()
            });
          });
        }
      })
      .catch(err => {
        console.error('[Service Worker] Error showing notification:', err);
      })
  );
});

// Enhanced notification click handler with logging
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked:', {
    tag: event.notification.tag,
    title: event.notification.title,
    timestamp: new Date().toISOString(),
    data: event.notification.data
  });
  
  // Close the notification
  event.notification.close();
  
  // Extract any custom data
  const notificationData = event.notification.data || {};
  console.log('[Service Worker] Notification data:', notificationData);
  
  // Handle the click based on the notification data
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        console.log('[Service Worker] Found clients:', clientList.length);
        
        if (clientList.length > 0) {
          // Find a focused client or use the first one
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
              break;
            }
          }
          
          // Send a message to the client about the notification click
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notificationData,
            timestamp: Date.now()
          });
          
          console.log('[Service Worker] Focusing existing client:', client.url);
          return client.focus();
        }
        
        // If no clients are open, open a new window
        console.log('[Service Worker] No clients found, opening new window');
        return clients.openWindow('/');
      })
      .catch(err => {
        console.error('[Service Worker] Error handling notification click:', err);
      })
  );
});

if(!self.define){let e,n={};const i=(i,c)=>(i=new URL(i+".js",c).href,n[i]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=n,document.head.appendChild(e)}else e=i,importScripts(i),n()})).then((()=>{let e=n[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(c,s)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(n[o])return;let a={};const r=e=>i(e,o),t={module:{uri:o},exports:a,require:r};n[o]=Promise.all(c.map((e=>t[e]||r(e)))).then((e=>(s(...e),a)))}}define(["./workbox-e4bdc1e6"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"apple-touch-icon.png",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"favicon.ico",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"mask-icon.svg",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"pwa-192x192.png",revision:"b71cf576800f4995f8d38e9277b33177"},{url:"pwa-512x512.png",revision:"1daecbe82da3a514bbab4612c0f6bee3"}],{}),e.registerRoute(/\.(?:png|jpg|jpeg|svg|gif)$/,new e.CacheFirst({cacheName:"images-cache",plugins:[new e.ExpirationPlugin({maxEntries:60,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/https:\/\/supabase.co\/rest\/v1\//,new e.NetworkFirst({cacheName:"api-cache",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:50,maxAgeSeconds:604800})]}),"GET")}));
