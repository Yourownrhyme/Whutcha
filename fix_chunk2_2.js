const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldSubmitLogic = `                if (currentTab === 'costream') {
                    alert("Co-stream requested! In a real app, this waits for streamer approval.");
                    // Simplified: We would connect to LiveKit here
                }`;

const newSubmitLogic = `                if (currentTab === 'costream') {
                    // CHUNK 2: VAMPIRE & WHALE MODE CO-STREAM LOGIC
                    currentDonationId = donationData.id;
                    document.getElementById('costream-viewer-modal').classList.remove('hidden');
                    document.getElementById('costream-viewer-modal').classList.add('flex');
                    document.getElementById('costream-status-text').innerText = "Waiting for Streamer to Approve...";
                    document.getElementById('submit-btn-text').innerText = "IN QUEUE";
                    
                    // Stop preview camera so it doesn't run in background
                    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
                    
                    // Listen for approval via Supabase Realtime
                    subscribeToCoStreamApproval(currentDonationId);
                }`;

// Also we need to get the inserted ID. The insert logic is:
/*
                const { error } = await supabase.from('donations').insert([{
                    id: 'WTCH-' + Math.floor(100000 + Math.random() * 900000), ...
*/
// Let's modify the insert statement to capture the ID.
const oldInsert = `                const { error } = await supabase.from('donations').insert([{
                    id: 'WTCH-' + Math.floor(100000 + Math.random() * 900000),
                    streamer_id: streamerId,
                    viewer_device_id: viewerDeviceId,
                    amount: amount,
                    username: document.getElementById('nickname').value || 'Anonymous',
                    videoHash: videoHash,
                    video_hash: videoHash,
                    status: 'pending' // STRYKER DOCTRINE: Force all donations to pending. Never trust the client.
                }]);`;

const newInsert = `                const donationId = 'WTCH-' + Math.floor(100000 + Math.random() * 900000);
                const donationData = {
                    id: donationId,
                    streamer_id: streamerId,
                    viewer_device_id: viewerDeviceId,
                    amount: amount,
                    username: document.getElementById('nickname').value || 'Anonymous',
                    videoHash: videoHash,
                    video_hash: videoHash,
                    status: 'pending'
                };
                const { error } = await supabase.from('donations').insert([donationData]);`;

if (html.includes(oldSubmitLogic) && html.includes(oldInsert)) {
    html = html.replace(oldInsert, newInsert);
    html = html.replace(oldSubmitLogic, newSubmitLogic);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Chunk 2.2 Submit logic replaced.");
} else {
    console.log("Failed regex for Chunk 2.2");
}
