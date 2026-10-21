const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const newReactionHtml = `
    <!-- Reaction Modal -->
    <div id="reaction-modal" class="fixed inset-0 z-[100] bg-black/90 hidden flex-col items-center justify-center p-6 backdrop-blur-md">
        <div class="brutal-card w-full max-w-4xl p-6 flex flex-col gap-6 relative">
            <div class="flex justify-between items-center border-b-4 border-surface pb-4">
                <h3 class="text-3xl font-black uppercase text-primary">Record Reaction</h3>
                <button onclick="closeReactionModal()" class="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-white hover:bg-secondary hover:text-white transition-colors border-2 border-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <!-- Hidden Canvas for Composite Recording -->
            <canvas id="reaction-canvas" width="1280" height="720" class="hidden"></canvas>
            
            <div class="flex flex-col md:flex-row gap-6 h-[50vh]">
                <!-- Viewer Video -->
                <div class="flex-1 bg-black rounded-xl border-4 border-surface relative overflow-hidden">
                    <span class="absolute top-4 left-4 bg-primary text-black font-black px-3 py-1 text-xs uppercase z-10 shadow-[2px_2px_0_#fff]">Donation</span>
                    <video id="reaction-viewer-vid" class="w-full h-full object-cover" controls preload="metadata"></video>
                </div>
                
                <!-- Streamer Camera -->
                <div class="flex-1 bg-black rounded-xl border-4 border-secondary relative overflow-hidden">
                    <span class="absolute top-4 right-4 bg-secondary text-white font-black px-3 py-1 text-xs uppercase z-10 shadow-[2px_2px_0_#fff]">You</span>
                    <video id="reaction-streamer-cam" class="w-full h-full object-cover" autoplay muted playsinline></video>
                </div>
            </div>
            
            <div class="flex justify-center gap-4 mt-4">
                <button id="btn-start-record" class="brutal-btn-primary py-4 px-12 text-xl bg-primary text-black shadow-[4px_4px_0_#fff]">
                    Start Recording
                </button>
                <button id="btn-stop-record" class="brutal-btn-primary py-4 px-12 text-xl bg-secondary text-white border-white shadow-[4px_4px_0_#fff] hidden">
                    Stop & Save
                </button>
            </div>
        </div>
    </div>
`;

// Replace the old reaction modal I just injected
html = html.replace(/<!-- Reaction Modal -->[\s\S]*?<\/div>\s*<\/div>/, newReactionHtml.trim());
fs.writeFileSync('whutcha-web/dashboard.html', html);
