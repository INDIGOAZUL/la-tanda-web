if(!self.define){let s,e={};const l=(l,n)=>(l=new URL(l+".js",n).href,e[l]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()}).then(()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s}));self.define=(n,i)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const t=s=>l(s,r),o={module:{uri:r},exports:a,require:t};e[r]=Promise.all(n.map(s=>o[s]||t(s))).then(s=>(i(...s),a))}}define(["./workbox-58bd4dca"],function(s){"use strict";/*v7.55.1*/self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"/home-dashboard.html",revision:"0546ec92fdda9a2b296f46a21dea5956"},{url:"/recompensas.html",revision:"3e42469b4f5090732f5b862a10e77560"},{url:"/explorar.html",revision:"7981fde1c31e45d628a2bcce6ef040c4"},{url:"/groups-advanced-system.html",revision:"c76d034a327a5b51b0b77530d3d20545"},{url:"/mi-perfil.html",revision:"b5c3846ed6acf9d45a3d709bbcb3d909"},{url:"/mineria.html",revision:"e2178c090ac4efa08c69188475a4c950"},{url:"/mia.html",revision:"eadf0d1e2ac2fe4d9bdd0ca09643af88"},{url:"/invitaciones.html",revision:"aadad425ce7c0c7414fa80d97e318a10"},{url:"/governance.html",revision:"53aaf2bd88704a1103867f9ff0d170e4"},{url:"/configuracion.html",revision:"9992416c33bb5c399ab998566506cbe5"},{url:"/seguridad.html",revision:"a2d426e2617fb8c60b715e49beca990f"},{url:"/my-wallet.html",revision:"b1cb87ed3ada5312b6cfaa319c781e3b"},{url:"/my-tandas.html",revision:"154896956bcc9b835d2295287b76a911"},{url:"/perfil.html",revision:"8d6f5559844dcaa92e723a711ba087f4"},{url:"/kyc-registration.html",revision:"b5f65b0d36d4466b2ccd9a325790ead7"},{url:"/lottery-predictor.html",revision:"db7ea02cea55a01fb591eb09d8454eda"},{url:"/lottery-stats.html",revision:"027415d32ca667b68d4a5b5fb0ec0de3"},{url:"/ltd-token-economics.html",revision:"001ecdaee5ae3589fcee7b422ac3993c"},{url:"/mensajes.html",revision:"f9b20fb0a74de3e94266246827e1baf4"},{url:"/creator-hub.html",revision:"623d2bcd5f4c30ee93490e8a0e7d3032"},{url:"/guardados.html",revision:"be253313e28fde618bcf7a1835541c9d"},{url:"/trabajo.html",revision:"b7673cb1f18193a1758a46c0bc0a3ebf"},{url:"/help-center.html",revision:"fa56635fcf8ea1039e59a60fbeb1fc71"},{url:"/contact.html",revision:"7bb44d03bd9dc108f708b6b3591b7776"},{url:"/auth-enhanced.html",revision:"b78e6d69211a158899268664d1ad78ca"},{url:"/index.html",revision:"37b10bbe12143f9dc057a7a4ee763863"},{url:"/registerSW.js",revision:"dcc3286bae15bd5a953fd9e27100ba58"},{url:"/manifest.webmanifest",revision:"ede254e1494ed09e965073194920cc2a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i,new s.CacheFirst({cacheName:"google-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i,new s.CacheFirst({cacheName:"gstatic-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/cdnjs\.cloudflare\.com\/.*/i,new s.CacheFirst({cacheName:"cdn-cache",plugins:[new s.ExpirationPlugin({maxEntries:50,maxAgeSeconds:2592e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\/api\/.*/i,new s.NetworkFirst({cacheName:"api-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:300}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/,new s.CacheFirst({cacheName:"image-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET"),s.registerRoute(/\/translations\/.*\.json$/,new s.CacheFirst({cacheName:"i18n-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:604800}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")});

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
