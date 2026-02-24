if(!self.define){let s,e={};const l=(l,n)=>(l=new URL(l+".js",n).href,e[l]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()}).then(()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s}));self.define=(n,i)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const t=s=>l(s,r),o={module:{uri:r},exports:a,require:t};e[r]=Promise.all(n.map(s=>o[s]||t(s))).then(s=>(i(...s),a))}}define(["./workbox-58bd4dca"],function(s){"use strict";/*v7.55.1*/self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"whitepaper.html",revision:"eb1edf181780b342895d859cd77ef735"},{url:"web3-dashboard.html",revision:"99ac18acfab495beee5c69f0e4fb16a8"},{url:"transacciones.html",revision:"bcf9ced33629b41fca1a87cef963acc3"},{url:"trading.html",revision:"becaf0f84e2b6aa02cd740f968331dae"},{url:"staking.html",revision:"32e279ca282b236562dcc86edc891cdd"},{url:"seguridad.html",revision:"aeda342b7b881c2abc56bf5717b03fb2"},{url:"registerSW.js",revision:"3ff501127047fae0687c833b2ff1fc1f"},{url:"nft-memberships.html",revision:"a266afea17632ed8849a9d89d0125bab"},{url:"my-tandas.html",revision:"15f1cae71ff2ae7c462fc250ee2b79cd"},{url:"monitoring-dashboard.html",revision:"8c3c5ef5772070a78df8123cb724201c"},{url:"mi-perfil.html",revision:"54cceef3d08bb539f49678585f115058"},{url:"marketplace-social.html",revision:"9f1b908225e74b09775c43109009105d"},{url:"ltd-token-economics.html",revision:"9490163680a6bfe044ddbfb8c987a3da"},{url:"lending.html",revision:"9fb3635b917fc6aa2afa2ff51d40ab98"},{url:"kyc-registration.html",revision:"a4655bc9be63b619c61a087324f88619"},{url:"invitaciones.html",revision:"09ca47d33373b5a9fb292b32e38469ec"},{url:"index.html",revision:"033b3c320e707f2676bd16009afe5db8"},{url:"home-dashboard.html",revision:"72e004aa5674e24719aabeee7f8f11b7"},{url:"explorar.html",revision:"d261eb82dc3c9b5a8c09255aca5828e4"},{url:"trabajo.html",revision:"ac809524b2d1ed846e1163a78e22a12f"},{url:"creator-hub.html",revision:"213ff53b3e7838b873f1c77271d3935d"},{url:"guardados.html",revision:"004bb081549714376f84b67c042c00e7"},{url:"mensajes.html",revision:"adeac0ac8d2aa46d92603828ccd25685"},{url:"help-center.html",revision:"a009f24914cd250333e23a659ffdc303"},{url:"governance.html",revision:"e69202421219a747cded6ad7617511f8"},{url:"documentation.html",revision:"d85acd84f2ed88b284311904c4141f6c"},{url:"contact.html",revision:"3d497ec49a79e7c2cb1019beaffebf7a"},{url:"configuracion.html",revision:"57403fb520b3316a398fffe3c8a809bd"},{url:"commission-system.html",revision:"046e3276f32ae3fd94cfa5778775c59d"},{url:"bridge.html",revision:"184d879760e98e9ecaf203866b6b6a03"},{url:"auth.html",revision:"465ed67b6478aa6081f4449c8b73b201"},{url:"auth-enhanced.html",revision:"9be4b61cb9ede37bf9607b0fa9acabc1"},{url:"analytics.html",revision:"4ee2372b5209c743d4c17a5558cd732a"},{url:"manifest.webmanifest",revision:"ede254e1494ed09e965073194920cc2a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i,new s.CacheFirst({cacheName:"google-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i,new s.CacheFirst({cacheName:"gstatic-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/cdnjs\.cloudflare\.com\/.*/i,new s.CacheFirst({cacheName:"cdn-cache",plugins:[new s.ExpirationPlugin({maxEntries:50,maxAgeSeconds:2592e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\/api\/.*/i,new s.NetworkFirst({cacheName:"api-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:300}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/,new s.CacheFirst({cacheName:"image-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET")});

// Web Push Notification Handlers (v3.95.0 - URL validated)
self.addEventListener('push', function(event) {
    var data = event.data ? event.data.json() : {};
    var title = data.title || 'La Tanda';
    var options = {
        body: data.body || '',
        icon: data.icon || '/img/icons/icon-192x192.png',
        badge: data.badge || '/img/icons/badge-72x72.png',
        data: { url: data.url || '/home-dashboard.html' },
        vibrate: [200, 100, 200],
        tag: data.type || 'default',
        renotify: true
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var rawUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/home-dashboard.html';
    // C2: Validate URL is same-origin (must start with /) to prevent open redirect
    var url = (typeof rawUrl === 'string' && rawUrl.charAt(0) === '/') ? rawUrl : '/home-dashboard.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                if (clientList[i].url.indexOf(url) !== -1 && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
