const fs = require('fs');

// 1. Update sw.js to Cache the App Shell
let sw = fs.readFileSync('whutcha-web/sw.js', 'utf8');

const cacheLogic = `
const CACHE_NAME = 'whutcha-shell-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/viewer.html',
    '/app.js',
    '/dashboard.js',
    '/icon.svg'
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

// Network-first with Cache fallback for Submarine Mode
self.addEventListener('fetch', (event) => {
    // Only cache GET requests for HTML/JS/CSS/SVG (not API calls or videos)
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
`;

// Replace the top part of sw.js
if (!sw.includes('whutcha-shell-v1')) {
    sw = sw.replace(`self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});`, cacheLogic);
    fs.writeFileSync('whutcha-web/sw.js', sw);
    console.log('sw.js patched for Submarine mode.');
}

// 2. Add Offline/Online Listeners to app.js (Global UI)
let appjs = fs.readFileSync('whutcha-web/app.js', 'utf8');
const offlineBannerLogic = `
// ==========================================
// SUBMARINE MODE (OFFLINE DETECTION)
// ==========================================
function updateOnlineStatus() {
    let banner = document.getElementById('offline-banner');
    if (!navigator.onLine) {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.className = 'fixed top-0 left-0 w-full bg-red-600/90 backdrop-blur text-white text-center py-1 text-xs font-bold z-[9999] tracking-widest uppercase';
            banner.innerText = '🔴 You are offline. Waiting for connection...';
            document.body.prepend(banner);
        }
    } else {
        if (banner) banner.remove();
        // If we came back online on the dashboard, auto-sync
        if (window.location.pathname.includes('dashboard') && typeof fetchPendingQueue === 'function') {
            fetchPendingQueue();
        }
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
// Initial check
if (document.readyState === 'complete') {
    updateOnlineStatus();
} else {
    window.addEventListener('load', updateOnlineStatus);
}
`;

if (!appjs.includes('SUBMARINE MODE (OFFLINE DETECTION)')) {
    appjs += '\n\n' + offlineBannerLogic;
    fs.writeFileSync('whutcha-web/app.js', appjs);
    console.log('app.js patched for Submarine mode.');
}
