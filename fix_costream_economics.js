const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Add payment instructions to the UI
const oldStatusUI = `<h3 id="costream-status-text" class="text-xl font-black text-white uppercase text-center drop-shadow-lg animate-pulse">Waiting for Streamer to Approve...</h3>`;
const newStatusUI = `<h3 id="costream-status-text" class="text-xl font-black text-white uppercase text-center drop-shadow-lg animate-pulse">Waiting for Streamer to Approve...</h3>
            <p id="costream-payment-hint" class="text-silver text-xs font-bold text-center px-4">A new tab opened for payment. Complete it there so the Streamer can verify and approve you!</p>`;
html = html.replace(oldStatusUI, newStatusUI);

// 2. Open payment link in a new tab when entering queue
const oldSubmitLogic = `                    // Listen for approval via Supabase Realtime
                    subscribeToCoStreamApproval(currentDonationId);
                }`;

const newSubmitLogic = `                    // Listen for approval via Supabase Realtime
                    subscribeToCoStreamApproval(currentDonationId);
                    
                    // ECONOMICS FIX: Open payment in new tab so they stay in the WebRTC waiting room!
                    if (payoutLink) {
                        window.open(payoutLink, '_blank');
                    }
                }`;
                
if (html.includes(oldSubmitLogic)) {
    html = html.replace(oldSubmitLogic, newSubmitLogic);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Co-stream economics fixed.");
} else {
    console.log("Failed regex costream economics");
}
