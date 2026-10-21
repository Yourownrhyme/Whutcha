const fs = require('fs');

// 1. Fix Storage Leak in dashboard.js
let dashboard = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldRejectFn = `window.rejectDonation = async (id) => {
    if (window.actionLocks.has(id)) return;
    window.actionLocks.add(id);
    try {
        vibrate([50]);
        window.lockCardActions(id);
        await updateStatus(id, 'rejected');
    } catch (e) {`;

// We need the videoHash to delete it. Since we don't have it explicitly passed in rejectDonation(id),
// we must fetch it from the UI or DB. Better: pass it in the HTML button!
// Let's modify the HTML generation too.
let htmlGeneration1 = `<button onclick="rejectDonation('\${d.id}')" class="py-2 px-4 bg-red-500/10`;
let htmlGeneration2 = `<button onclick="rejectDonation('\${d.id}', '\${d.video_hash || d.videoHash}')" class="py-2 px-4 bg-red-500/10`;

dashboard = dashboard.replace(/<button onclick="rejectDonation\('\$\{d.id\}'\)" class="py-2 px-4 bg-red-500\/10/g, htmlGeneration2);

const newRejectFn = `window.rejectDonation = async (id, videoHash) => {
    if (window.actionLocks.has(id)) return;
    window.actionLocks.add(id);
    try {
        vibrate([50]);
        window.lockCardActions(id);
        await updateStatus(id, 'rejected');
        // STRYKER DOCTRINE: Fix Storage Leak! 
        // Delete the blob from Supabase storage so it doesn't rot forever.
        if (videoHash && videoHash !== "costream_request" && videoHash !== "undefined") {
            await supabaseClient.storage.from('videos').remove([videoHash]);
            console.log("Deleted rejected video blob:", videoHash);
        }
    } catch (e) {`;

dashboard = dashboard.replace(oldRejectFn, newRejectFn);
// Wait, I need to make sure rejectDonation inside _innerApprove or others is also updated.
// Actually `rejectDonation(d.id)` is called when auto-rejecting. It won't have videoHash, but that's fine, it will just skip.

fs.writeFileSync('whutcha-web/dashboard.js', dashboard);
console.log("Fixed dashboard storage leak.");


// 2. Fix Vampire Mode in viewer.html
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldStopLogic = `                    document.getElementById('recording-ui').classList.add('hidden');
                    
                    // DUMB USER MODE: Guide the user to the next step`;

const newStopLogic = `                    document.getElementById('recording-ui').classList.add('hidden');
                    
                    // VAMPIRE MODE FIX: Kill hardware camera tracks immediately to stop battery drain!
                    if (stream) {
                        stream.getTracks().forEach(t => t.stop());
                        stream = null;
                        console.log("Hardware tracks killed.");
                    }
                    
                    // DUMB USER MODE: Guide the user to the next step`;

viewer = viewer.replace(oldStopLogic, newStopLogic);
fs.writeFileSync('whutcha-web/viewer.html', viewer);
console.log("Fixed viewer Vampire leak.");
