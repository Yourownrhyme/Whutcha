const fs = require('fs');

// --- 1. PATCH dashboard.js (XSS) ---
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Fix Stored XSS by encoding HTML entities
const encodeHTML = `function sanitize(str) {
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}`;
dash = encodeHTML + '\n' + dash;

dash = dash.replace(/\$\{d\.username\}/g, '${sanitize(d.username)}');
dash = dash.replace(/approveDonation\('\$\{d\.id\}'\)/g, 'approveDonation(`${sanitize(d.id)}`)');

fs.writeFileSync('whutcha-web/dashboard.js', dash);

// --- 2. PATCH overlay.html (Deadlock & Zombie Room) ---
let overlay = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

// Fix Zombie Connection
overlay = overlay.replace(
    /async function connectToLiveKit\(token\) \{/,
    `async function connectToLiveKit(token) {
        if (currentRoom) { currentRoom.disconnect(); currentRoom = null; }`
);

// Fix UI Deadlock on video error
overlay = overlay.replace(
    /videoEl\.onended = \(\) => \{[\s\S]*?hideWidget\(\);[\s\S]*?\};/,
    `videoEl.onended = () => { hideWidget(); };
    videoEl.onerror = () => { console.error("Video failed to play"); hideWidget(); };`
);

fs.writeFileSync('whutcha-web/overlay.html', overlay);

