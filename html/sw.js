if(!self.define){let s,e={};const l=(l,n)=>(l=new URL(l+".js",n).href,e[l]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()}).then(()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s}));self.define=(n,i)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const t=s=>l(s,r),o={module:{uri:r},exports:a,require:t};e[r]=Promise.all(n.map(s=>o[s]||t(s))).then(s=>(i(...s),a))}}define(["./workbox-58bd4dca"],function(s){"use strict";/*v7.55.1*/self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"whitepaper.html",revision:"004e07eb8f0a76cb0b3237a7c2ded3f5"},{url:"web3-dashboard.html",revision:"f8defcaa40201bc853687956cea55970"},{url:"trading.html",revision:"5c9680f8a96ad40f83385f5b44341964"},{url:"staking.html",revision:"38707f9eb7edf28653395336e6060da9"},{url:"seguridad.html",revision:"cb87b637c03d36bdafa11aeeedb70e1f"},{url:"registerSW.js",revision:"dcc3286bae15bd5a953fd9e27100ba58"},{url:"nft-memberships.html",revision:"486bad0508febe732d6086a882e0ed81"},{url:"my-tandas.html",revision:"6ce81065d8324e5400a4e7e4d82d18d8"},{url:"mi-perfil.html",revision:"af17116f226811fd497d4c701f6ca525"},{url:"marketplace-social.html",revision:"0fd4e340ee36b87c17ac9e2acaf6eb43"},{url:"ltd-token-economics.html",revision:"74bc26d9a40c5f120df82733689c0bd4"},{url:"lending.html",revision:"c1bd0757ad310b8bad1500bd8326e0ef"},{url:"kyc-registration.html",revision:"3061e2e28808e80b25dcac9524d586fb"},{url:"invitaciones.html",revision:"4092d2dac28dc8f413f275ef4bde409c"},{url:"index.html",revision:"37b10bbe12143f9dc057a7a4ee763863"},{url:"home-dashboard.html",revision:"9a7347cbe0fc6a293cc41487fc59d671"},{url:"explorar.html",revision:"549a66cdd79a1cb81f2dcbc14077eca0"},{url:"trabajo.html",revision:"edf9b98d58c343b22944d2caecc8d1b8"},{url:"creator-hub.html",revision:"6fd971d064a6b73f6276b85c7a46ba1c"},{url:"guardados.html",revision:"3255f9b3a20c398197342e4c1010c798"},{url:"mensajes.html",revision:"38c9a6bf06c127baa1f9eeeeab91ca10"},{url:"help-center.html",revision:"51333c5c3ec404f4e2433592d92440ab"},{url:"governance.html",revision:"390e5cd07ca4d3c54215a48ed98010ed"},{url:"documentation.html",revision:"d85acd84f2ed88b284311904c4141f6c"},{url:"contact.html",revision:"b07006e519df4ba7885940addc675cec"},{url:"configuracion.html",revision:"e4a4cd38de538704cde15e5aca786d9d"},{url:"commission-system.html",revision:"67b8e80d3f6fadd0b1ec8b73df98b403"},{url:"bridge.html",revision:"b28a92263905e9e3fbf6355c66bb6cc3"},{url:"auth.html",revision:"465ed67b6478aa6081f4449c8b73b201"},{url:"auth-enhanced.html",revision:"6dc61c42e5674828e83a933fcf152dd2"},{url:"analytics.html",revision:"c826fc22cd3774bbbb825537af749a8d"},{url:"manifest.webmanifest",revision:"ede254e1494ed09e965073194920cc2a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i,new s.CacheFirst({cacheName:"google-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i,new s.CacheFirst({cacheName:"gstatic-fonts-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:31536e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/^https:\/\/cdnjs\.cloudflare\.com\/.*/i,new s.CacheFirst({cacheName:"cdn-cache",plugins:[new s.ExpirationPlugin({maxEntries:50,maxAgeSeconds:2592e3}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\/api\/.*/i,new s.NetworkFirst({cacheName:"api-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:300}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),s.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/,new s.CacheFirst({cacheName:"image-cache",plugins:[new s.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET"),s.registerRoute(/\/translations\/.*\.json$/,new s.CacheFirst({cacheName:"i18n-cache",plugins:[new s.ExpirationPlugin({maxEntries:10,maxAgeSeconds:604800}),new s.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")});

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
