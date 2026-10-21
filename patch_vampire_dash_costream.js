const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const searchStr = `if (typeof currentRoom !== 'undefined' && currentRoom) {
        currentRoom.disconnect();
        currentRoom = null;
    }
    if (typeof activeCoStreamRoom !== 'undefined' && activeCoStreamRoom) {
        activeCoStreamRoom.disconnect();`;

const replaceStr = `if (typeof currentRoom !== 'undefined' && currentRoom) {
        // VAMPIRE MODE: Ensure hardware is released before disconnect
        if (currentRoom.localParticipant) {
            currentRoom.localParticipant.setCameraEnabled(false);
            currentRoom.localParticipant.setMicrophoneEnabled(false);
        }
        currentRoom.disconnect();
        currentRoom = null;
    }
    if (typeof activeCoStreamRoom !== 'undefined' && activeCoStreamRoom) {
        if (activeCoStreamRoom.localParticipant) {
            activeCoStreamRoom.localParticipant.setCameraEnabled(false);
            activeCoStreamRoom.localParticipant.setMicrophoneEnabled(false);
        }
        activeCoStreamRoom.disconnect();`;

if (dash.includes(searchStr) && !dash.includes('setCameraEnabled(false)')) {
    dash = dash.replace(searchStr, replaceStr);
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js LiveKit Vampire patched.');
} else {
    console.log('Not patched. String mismatch or already patched.');
}
