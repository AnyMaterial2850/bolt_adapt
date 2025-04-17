self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
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
    actions: data.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

if(!self.define){let e,n={};const i=(i,c)=>(i=new URL(i+".js",c).href,n[i]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=n,document.head.appendChild(e)}else e=i,importScripts(i),n()})).then((()=>{let e=n[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(c,s)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(n[o])return;let a={};const r=e=>i(e,o),t={module:{uri:o},exports:a,require:r};n[o]=Promise.all(c.map((e=>t[e]||r(e)))).then((e=>(s(...e),a)))}}define(["./workbox-e4bdc1e6"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"apple-touch-icon.png",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"favicon.ico",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"mask-icon.svg",revision:"f6e2c6874aa0f50a4c2e42df38a0fd98"},{url:"pwa-192x192.png",revision:"b71cf576800f4995f8d38e9277b33177"},{url:"pwa-512x512.png",revision:"1daecbe82da3a514bbab4612c0f6bee3"}],{}),e.registerRoute(/\.(?:png|jpg|jpeg|svg|gif)$/,new e.CacheFirst({cacheName:"images-cache",plugins:[new e.ExpirationPlugin({maxEntries:60,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/https:\/\/supabase.co\/rest\/v1\//,new e.NetworkFirst({cacheName:"api-cache",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:50,maxAgeSeconds:604800})]}),"GET")}));
