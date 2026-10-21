const fs = require('fs');

// --- 1. Create sw.js (Service Worker) ---
const swCode = `// Whutcha Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
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

    const title = data.title || "Whutcha";
    const options = {
        body: data.body || "You have a new alert!",
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200, 100, 200], // Aggressive vibration for money
        data: {
            url: data.url || '/dashboard.html'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle clicking on the notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the dashboard
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url.includes(event.notification.data.url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
`;
fs.writeFileSync('whutcha-web/sw.js', swCode);

// --- 2. Patch dashboard.js to register Service Worker ---
let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldRequestNotifs = /window\.requestNotifications = async function\(\) \{[\s\S]*?\}\s*\};/m;

const newRequestNotifs = `window.requestNotifications = async function() {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications");
        return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        notificationsEnabled = true;
        
        // Register Service Worker for Offline Pushes
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                console.log('Whutcha Service Worker registered!', reg);
                
                // TODO for Backend: 
                // const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: 'YOUR_VAPID_KEY' });
                // await supabaseClient.from('profiles').update({ push_subscription: subscription }).eq('id', currentUser.id);
            } catch (err) {
                console.error('Service Worker registration failed:', err);
            }
        }

        showToast("Background notifications enabled!");
        const statusEl = document.getElementById('notification-status');
        if(statusEl) {
            statusEl.innerText = 'ON';
            statusEl.classList.replace('text-red-400', 'text-green-400');
        }
    }
};`;

if (oldRequestNotifs.test(dashJs)) {
    dashJs = dashJs.replace(oldRequestNotifs, newRequestNotifs);
    fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
    console.log("sw.js created and dashboard.js patched!");
} else {
    console.log("Regex failed to find requestNotifications.");
}
