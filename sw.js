if(!self.define){let s,e={};const l=(l,n)=>(l=new URL(l+".js",n).href,e[l]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()}).then(()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s}));self.define=(n,i)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const t=s=>l(s,r),o={module:{uri:r},exports:a,require:t};e[r]=Promise.all(n.map(s=>o[s]||t(s))).then(s=>(i(...s),a))}}define(["./workbox-58bd4dca"],function(s){"use strict";/*v7.55.1*/self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"/home-dashboard.html",revision:"25e540272110c4155704dd7cfbfbeb42"},{url:"/recompensas.html",revision:"3f207e56d2b71ae5c003925618483ab3"},{url:"/explorar.html",revision:"b1f95b64de9cea98da610db1b49d0da5"},{url:"/groups-advanced-system.html",revision:"a135e1ce7e5fcd5ce161e4a2995d6bef"},{url:"/mi-perfil.html",revision:"c96a8b5ddb7f25abff899c454e94e17c"},{url:"/mineria.html",revision:"8942b296664f55316d4a5b2114e180eb"},{url:"/mia.html",revision:"4760b2e313b0bda0c307f1397611161e"},{url:"/invitaciones.html",revision:"570909a4d9296fefb8656291a1945f13"},{url:"/governance.html",revision:"42d8b8bff9fe25976734ce50dbe01d63"},{url:"/configuracion.html",revision:"b1b18f852f487d03080b9ed7904fa663"},{url:"/seguridad.html",revision:"33f6f17be681a072fdd2db461e8abe37"},{url:"/my-wallet.html",revision:"60b6bef2515663854562429b0d6f1c60"},{url:"/my-tandas.html",revision:"f6f2b67ba94c4bfae8c45b1e858660d2"},{url:"/perfil.html",revision:"30b7ebd032e58c7b9bdac1345917b608"},{url:"/kyc-registration.html",revision:"1d7cdce5689849f2a72173539b795e25"},{url:"/lottery-predictor.html",revision:"0de96a767b1cfcb4e5f4f38db772d8c2"},{url:"/lottery-stats.html",revision:"42a27a28423de30a5a8d87bb85ee1bcc"},{url:"/ltd-token-economics.html",revision:"e089cbbe3c10ee47e2db360549b4abbb"},{url:"/mensajes.html",revision:"00c08b8e557beab445230e5edc87f5d4"},{url:"/creator-hub.html",revision:"c1bf4abb51e8d538eddeaf9fe31f9f96"},{url:"/guardados.html",revision:"5981b7ec20e32f584f163744f7f18fc6"},{url:"/trabajo.html",revision:"8dc568e32f76f59778f0a6160180d15e"},{url:"/help-center.html",revision:"f75f484399cff61a501491c1c9bb1f28"},{url:"/contact.html",revision:"27b3cff6304aab731b941497de6cd7a3"},{url:"/auth-enhanced.html",revision:"6c38efc56f941abdc73c35f7f9014943"},{url:"/index.html",revision:"37b10bbe12143f9dc057a7a4ee763863"},{url:"/registerSW.js",revision:"dcc3286bae15bd5a953fd9e27100ba58"},{url:"/manifest.webmanifest",revision:"ede254e1494ed09e965073194920cc2a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i,new s.CacheFirst({cacheName:"google-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i,new s.CacheFirst({cacheName:"gstatic-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/cdnjs\.cloudflare\.com\/.*/i,new s.CacheFirst({cacheName:"cdn-cache",plugins:[new s.ExpirationPlugin({maxEntries:50,maxAgeSeconds:2592e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\/api\/.*/i,new s.NetworkFirst({cacheName:"api-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:300}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/,new s.CacheFirst({cacheName:"image-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET"),s.registerRoute(/\/translations\/.*\.json$/,new s.CacheFirst({cacheName:"i18n-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:604800}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")});

// Firebase Cloud Messaging — background message handler
// FCM via Firebase JS SDK routes through the standard 'push' event below,
// so no separate onBackgroundMessage handler is needed.
// Firebase SDK is initialized here for FCM token management.
try {
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
} catch (e) {
    // Firebase SDK not available — VAPID push handler below still works
}

// Firebase init — receives config from main thread
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        try {
            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                firebase.initializeApp(event.data.config);
                firebase.messaging();
            }
        } catch (e) {}
    }
});

// Web Push Notification Handlers (v3.95.0 - URL validated)
self.addEventListener('push', function(event) {
    var data = event.data ? event.data.json() : {};
    var title = data.title || 'La Tanda';
    var options = {
        body: data.body || '',
        icon: data.icon || '/assets/images/pwa-192x192.svg',
        badge: data.badge || '/assets/images/pwa-192x192.svg',
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
