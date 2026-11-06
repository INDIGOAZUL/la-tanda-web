/**
 * La Tanda - Minimal-safe Service Worker (v1.0.0, 2026-07-21)
 *
 * Replaces the stale vite-plugin-pwa/Workbox build that:
 *  - precached /registerSW.js (missing on disk -> SW update failed on every load)
 *  - pinned 27 HTML pages to stale revisions (defeating the no-store HTML policy)
 *
 * Policy:
 *  - install/activate: skipWaiting + clients.claim
 *  - activate: delete ALL old caches (Workbox precache/runtime caches included)
 *  - fetch: network passthrough for everything EXCEPT same-origin static assets
 *    with a ?v= cache-bust param, which are cache-first in a small runtime cache
 *  - Web Push + FCM handlers preserved unchanged (real, in-use functionality)
 */

var RUNTIME_CACHE = 'lt-static-v1';
var RUNTIME_CACHE_MAX_ENTRIES = 80;

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys.filter(function (k) { return k !== RUNTIME_CACHE; })
                        .map(function (k) { return caches.delete(k); })
                );
            })
            .then(function () { return self.clients.claim(); })
    );
});

function isVersionedStaticAsset(url) {
    if (url.origin !== self.location.origin) return false;
    if (!url.searchParams.has('v')) return false;
    return /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf)$/.test(url.pathname);
}

function trimCache(cache) {
    return cache.keys().then(function (keys) {
        if (keys.length <= RUNTIME_CACHE_MAX_ENTRIES) return;
        return cache.delete(keys[0]).then(function () { return trimCache(cache); });
    });
}

self.addEventListener('fetch', function (event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (e) { return; }

    // Everything that is not a versioned static asset goes straight to the
    // network (browser default) - HTML stays no-store, APIs stay live.
    if (!isVersionedStaticAsset(url)) return;

    event.respondWith(
        caches.open(RUNTIME_CACHE).then(function (cache) {
            return cache.match(req).then(function (hit) {
                if (hit) return hit;
                return fetch(req).then(function (resp) {
                    if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'default')) {
                        var clone = resp.clone();
                        cache.put(req, clone).then(function () { return trimCache(cache); });
                    }
                    return resp;
                });
            });
        })
    );
});

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
    var data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
    var title = data.title || 'La Tanda';
    // 2026-11-02: deep link del push = data.url (o data.data.url si viene anidado). El tag lleva el
    // url (p. ej. el token de la invitacion) para que varias invitaciones no se pisen en una sola.
    var url = data.url || (data.data && data.data.url) || '/home-dashboard.html';
    var type = data.type || (data.data && data.data.type) || 'default';
    var tag = data.tag || (type + (url && url !== '/home-dashboard.html' ? ':' + url : ''));
    var options = {
        body: data.body || '',
        icon: data.icon || '/assets/images/pwa-192x192.svg',
        badge: data.badge || '/assets/images/pwa-192x192.svg',
        data: { url: url },
        vibrate: [200, 100, 200],
        tag: tag,
        renotify: true
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var rawUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/home-dashboard.html';
    // C2: Validate URL is same-origin (must start with /) to prevent open redirect
    // C2: solo mismo origen. Acepta ruta "/x" o URL absoluta de este mismo origen (FCM manda absoluta).
    var url = '/home-dashboard.html';
    if (typeof rawUrl === 'string') {
        if (rawUrl.charAt(0) === '/' && rawUrl.charAt(1) !== '/' && rawUrl.charAt(1) !== '\\') url = rawUrl;
        else if (rawUrl.indexOf(self.location.origin + '/') === 0) url = rawUrl.slice(self.location.origin.length);
    }
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
