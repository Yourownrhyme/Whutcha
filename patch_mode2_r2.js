const fs = require('fs');

let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// 1. Completely replace closeCoStreamModal and inject dropCaller
const oldCloseRegex = /function closeCoStreamModal\(\) \{[\s\S]*?modal\.classList\.add\('hidden'\);\n\s*\}/;

const newDropCaller = `
window.dropCaller = function(reason = "Call dropped") {
    vibrate([50, 100, 50]);
    
    // 1. Kill the 15-second SLA timer if it exists
    if (window.coStreamTimeout) {
        clearTimeout(window.coStreamTimeout);
        window.coStreamTimeout = null;
    }

    // 2. Ironclad WebRTC Disconnect
    if (typeof currentRoom !== 'undefined' && currentRoom) {
        currentRoom.disconnect();
        currentRoom = null;
    }
    if (typeof activeCoStreamRoom !== 'undefined' && activeCoStreamRoom) {
        activeCoStreamRoom.disconnect();
        activeCoStreamRoom = null; // Clean up old mock variables just in case
    }
    if (window.currentRoom) {
        window.currentRoom.disconnect();
        window.currentRoom = null;
    }

    // 3. Reset UI
    const modal = document.getElementById('costream-modal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    
    // 4. Purge DOM elements to free memory
    document.getElementById('costream-local-vid').innerHTML = '';
    document.getElementById('costream-remote-vid').innerHTML = '';

    showToast(reason);
};

window.closeCoStreamModal = function() {
    window.dropCaller("Co-Stream Modal Closed");
};
`;

if (oldCloseRegex.test(dashJs)) {
    dashJs = dashJs.replace(oldCloseRegex, newDropCaller);
} else {
    // If not found, just append
    dashJs += '\n' + newDropCaller;
}

// 2. Fix variable scope in approveDonation & Inject 15s Timer
const oldRoomConnect = /currentRoom = room; \/\/ Save globally for Drop Caller/;
const newRoomConnect = `window.currentRoom = room; currentRoom = room; // Save globally
            
            // 15-SECOND SLA TIMER: If viewer doesn't connect, nuke the room
            if (window.coStreamTimeout) clearTimeout(window.coStreamTimeout);
            window.coStreamTimeout = setTimeout(() => {
                // If room exists but no remote participants joined
                if (window.currentRoom && window.currentRoom.participants.size === 0) {
                    window.dropCaller("Viewer failed to connect (Timeout).");
                }
            }, 15000);`;
            
dashJs = dashJs.replace(oldRoomConnect, newRoomConnect);

// Fix phantom disconnects using the new dropCaller
dashJs = dashJs.replace(/closeCoStreamModal\(\);/g, 'window.dropCaller("Viewer Disconnected");');

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
console.log("Mode 2 (Round 2) patches applied.");
