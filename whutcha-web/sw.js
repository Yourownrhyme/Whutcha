// Whutcha Service Worker (Submarine Mode PWA Shell)

const CACHE_NAME = 'whutcha-shell-v54';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './dashboard.html',
    './viewer.html',
    './leaderboard.html',
    './overlay.html',
    './app.js',
    './dashboard.js',
    './stream-dive.js',
    './icon.svg',
    './style.css',
    './style-dash.css',
    './cyber-theme.css',
    './manifest.json',
    './assets/loco-kwokka.jpg',
    './og-banner.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    event.waitUntil(self.clients.claim());
});

// PWA Update Channel: allow client to trigger skipWaiting
self.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting')) {
        self.skipWaiting();
    }
});

// SUBMARINE MODE: Network-first with dynamic cache update and offline shell fallback
self.addEventListener('fetch', (event) => {
    // Only cache GET requests for shell assets (ignore Supabase API and video streaming)
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co') || event.request.url.includes('.mp4')) {
        return;
    }

    event.respondWith(
        fetch(event.request, { cache: 'no-cache' })
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./dashboard.html') || caches.match('./index.html');
                    }
                });
            })
    );
});

// Listen for remote push notifications (when app is closed)
self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { body: event.data.text() };
        }
    }

    const title = data.title || "Whutcha Radar";
    const options = {
        body: data.body || "Incoming broadcast alert!",
        icon: './icon.svg',
        badge: './icon.svg',
        vibrate: [200, 100, 200, 100, 200], // Aggressive vibration for money
        data: {
            url: data.url || './dashboard.html'
        },
        actions: [
            { action: 'open_cockpit', title: '👁️ Open Cockpit' },
            { action: 'dismiss', title: '✕ Dismiss' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle clicking on the notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'dismiss') {
        return;
    }
    const targetUrl = (event.notification.data && event.notification.data.url) || './dashboard.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the dashboard
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url && client.url.includes('dashboard.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
