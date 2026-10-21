const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Inject Co-Stream Modal UI before </body>
const costreamModal = `
    <!-- Co-Stream Viewer Modal -->
    <div id="costream-viewer-modal" class="hidden fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
        <div class="glass-card w-full max-w-lg p-6 rounded-3xl flex flex-col items-center gap-6 border border-primary/30 relative">
            <h3 id="costream-status-text" class="text-xl font-black text-white uppercase text-center drop-shadow-lg animate-pulse">Waiting for Streamer to Approve...</h3>
            
            <div id="costream-video-container" class="w-full aspect-[9/16] bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                <!-- Our local camera rendering here during Co-stream -->
                <div id="local-costream-video" class="w-full h-full flex items-center justify-center bg-[#0a0a0c]">
                    <span class="text-silver text-xs font-bold uppercase tracking-widest text-center px-4">Camera activates on connect</span>
                </div>
                <span class="absolute top-4 left-4 bg-primary text-black font-black px-2 py-1 text-[10px] rounded uppercase z-10 shadow">You (LIVE)</span>
            </div>

            <button id="cancel-costream-btn" class="w-full py-3.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-500 rounded-xl font-black uppercase text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">Cancel / Disconnect</button>
        </div>
    </div>
    <script>
`;
html = html.replace(/<script>/, costreamModal);

// 2. Fix LiveKit CDN link if incorrect
html = html.replace(/livekit-client\.umd\.min\.js/g, 'livekit.umd.min.js');

// 3. Inject variables and functions inside <script>
const scriptTop = `
        let currentMinPrice = 5;
        let isRecording = false;
        let stream = null;
        let finalVideoBlob = null;
        let currentTab = 'video';
        let viewerRoom = null; // LiveKit Room
        let currentDonationId = null; // Store ID for DB listener
`;
html = html.replace(/let currentMinPrice = 5;[\s\S]*?let currentTab = 'video';/, scriptTop);

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log("Chunk 2.1 (UI) done.");
