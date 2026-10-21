const fs = require('fs');

let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// The VAPID logic and subscription update
const newLogic = `
        // Register Service Worker for Offline Pushes
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                console.log('Whutcha Service Worker registered!', reg);
                
                // Utility to convert VAPID key
                const urlB64ToUint8Array = (base64String) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding).replace(/\\-/g, '+').replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                // Subscribe to Push
                const VAPID_PUBLIC_KEY = 'BIRvY13lmdi_TLVT0yff3UPLXvwzeHNBU7wB805faSJUP90xTcYhKlRXQjJ96CYoWbKZShxPxOZP_x535o5BLwk';
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                
                // Save to Supabase
                const { error: subErr } = await supabaseClient.from('profiles').update({ push_subscription: subscription }).eq('id', currentUser.id);
                if (subErr) console.error("Could not save push subscription to DB:", subErr);
                else console.log("Push subscription saved to DB!");

            } catch (err) {
                console.error('Service Worker registration failed:', err);
            }
        }
`;

dashJs = dashJs.replace(/\/\/ Register Service Worker for Offline Pushes[\s\S]*?catch \(err\) \{/, newLogic + `            } catch (err) {`);

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
console.log("Frontend Push Subscription patched!");
