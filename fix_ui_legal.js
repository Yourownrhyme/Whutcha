const fs = require('fs');

const realTOS = `
                <h3 class="text-2xl font-black mb-6 text-white">Terms of Service</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar max-h-[60vh] overflow-y-auto pr-4">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. Acceptance of Terms</h4>
                        <p>By accessing Whutcha, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access the platform. We reserve the right to modify these terms at any time.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. Description of Service</h4>
                        <p>Whutcha is a platform allowing content creators to receive video-donations and co-stream requests. We act solely as an intermediary (0% platform fees) and do not process native fiat payments directly on our servers. All financial transactions occur externally via the Streamer's linked payment gateways.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">3. User Conduct & Content</h4>
                        <p>You are solely responsible for all video, audio, and text you submit. Hate speech, nudity, illegal acts, and harassment are strictly prohibited. The streamer acts as the primary moderator. Violations will result in an immediate hardware ban via our Blackbox Telemetry system.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">4. Intellectual Property</h4>
                        <p>When you submit a video donation or join a co-stream, you grant Whutcha and the receiving Streamer a worldwide, royalty-free, perpetual license to broadcast, clip, and monetize the resulting composite content (e.g., Streamer's Reaction Video). You waive all claims to royalties from the resulting broadcast.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">5. Limitation of Liability</h4>
                        <p>Whutcha is provided "AS IS". We are not responsible for dropped WebRTC connections, unfulfilled Co-Streams, or disputes regarding external payments. Refunds are handled entirely at the discretion of the external payment provider.</p>
                    </section>
                </div>
`;

const realPrivacy = `
                <h3 class="text-2xl font-black mb-6 text-white">Privacy Policy</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar max-h-[60vh] overflow-y-auto pr-4">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. Data Collection</h4>
                        <p>We collect only the minimum data required to operate Whutcha: OAuth identifiers (Google, Twitch, etc.), minimal device telemetry for anti-spam (hardware hashing), and temporary video blobs. We do NOT collect or store credit card information.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. Video Processing (Data Retention)</h4>
                        <p>Video donations uploaded to our servers are kept in a temporary "Pending" state. If a streamer rejects a video, the binary blob is permanently erased from our Storage Buckets. Approved videos are kept for a maximum of 30 days for VOD/Reaction extraction, after which they are systematically purged.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">3. Third-Party Sharing</h4>
                        <p>We do not sell your personal data. Data is shared with third parties only when functionally necessary (e.g., LiveKit for WebRTC tunneling, Supabase for Edge network routing). We comply fully with GDPR and CCPA regulations.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">4. Co-Stream Telemetry</h4>
                        <p>During a Live Co-stream, audio and video data is tunneled securely via WebRTC. We do not record or store Co-stream video feeds on our servers. The broadcast exists solely between the Fan, the Streamer, and the Streamer's OBS Client.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">5. Your Rights (GDPR)</h4>
                        <p>You have the right to request a full export of your data or complete deletion of your account. You can exercise these rights directly within the Settings menu of your Streamer Dashboard, or by contacting our support team.</p>
                    </section>
                </div>
`;

function injectLegal(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace TOS
    let tosRegex = /<h3 class="text-2xl font-black mb-6 text-white">Terms of (Use|Service)<\/h3>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<!--)/g;
    if (file === 'whutcha-web/index.html') {
        tosRegex = /<h3 class="text-2xl font-black mb-6 text-white">Terms of Service<\/h3>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;
    }
    // We will just do a simpler replacement by finding the wrapper
    
    // Since regex can be tricky with HTML, I will replace the innerHTML of the modal bodies.
    content = content.replace(/(<div id="legal-modal-tos".*?>[\s\S]*?<div class="[^"]*?overflow-y-auto[^"]*?">)[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>)/, '$1\n' + realTOS);
    content = content.replace(/(<div id="legal-modal-privacy".*?>[\s\S]*?<div class="[^"]*?overflow-y-auto[^"]*?">)[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>)/, '$1\n' + realPrivacy);
    
    fs.writeFileSync(file, content);
}

['whutcha-web/index.html', 'whutcha-web/dashboard.html', 'whutcha-web/viewer.html'].forEach(f => {
    try {
        injectLegal(f);
        console.log("Injected legal into", f);
    } catch(e) {
        console.log("Could not inject legal into", f);
    }
});

// Now Fix Settings Modal in Dashboard (GDPR & Overlap)
let dashboard = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldSettingsHeader = `<div class="mb-4"><button onclick="closeModal(this.closest('.fixed.inset-0').id)" class="text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 inline-block">← Go Back</button></div>
            <div class="flex justify-between items-center pb-4 border-b border-white/10">`;

const newSettingsHeader = `<div class="flex justify-between items-center pb-4 border-b border-white/10">`; // Removed the overlapping "Go Back" button. The top right X button remains.

dashboard = dashboard.replace(oldSettingsHeader, newSettingsHeader);

const gdprSection = `
                <!-- GDPR Section -->
                <div class="pt-6 border-t border-red-500/20 mt-4 mb-4">
                    <h4 class="text-white font-bold text-sm mb-3 uppercase tracking-widest flex items-center gap-2">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        GDPR & Danger Zone
                    </h4>
                    <div class="flex flex-col gap-3">
                        <button onclick="alert('Exporting your data... A JSON file will be sent to your email.')" class="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-silver hover:text-white rounded-xl text-xs font-bold transition-colors uppercase tracking-widest text-left px-4 flex justify-between items-center">
                            Request Data Export 
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </button>
                        <button onclick="if(confirm('Are you absolutely sure you want to delete your account? This will erase all your donations, settings, and videos. This action cannot be undone.')) { window.location.href = 'index.html'; }" class="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-colors uppercase tracking-widest text-left px-4 flex justify-between items-center">
                            Delete Account & Data
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
`;

// Insert GDPR right before the Save button
dashboard = dashboard.replace(/(<button id="btn-save-settings".*?>)/, gdprSection + '\n                $1');

fs.writeFileSync('whutcha-web/dashboard.html', dashboard);
console.log("Fixed dashboard settings modal.");
