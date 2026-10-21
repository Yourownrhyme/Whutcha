const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const modalHtml = `
    <!-- Co-Stream Modal -->
    <div id="costream-modal" class="fixed inset-0 z-[110] bg-black/90 hidden flex-col items-center justify-center p-6 backdrop-blur-md">
        <div class="brutal-card w-full max-w-5xl p-6 flex flex-col gap-6 relative">
            <div class="flex justify-between items-center border-b-4 border-surface pb-4">
                <div class="flex items-center gap-4">
                    <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                    <h3 class="text-3xl font-black uppercase text-primary">Live Co-Stream</h3>
                </div>
                <button onclick="closeCoStreamModal()" class="brutal-btn-secondary px-6 py-2 border-white hover:bg-secondary">
                    END STREAM
                </button>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6 h-[60vh]">
                <!-- Streamer Video -->
                <div class="flex-1 bg-black rounded-xl border-4 border-primary relative overflow-hidden flex items-center justify-center">
                    <span class="absolute top-4 left-4 bg-primary text-black font-black px-3 py-1 text-xs uppercase z-10 shadow-[2px_2px_0_#fff]">You</span>
                    <div id="costream-local-vid" class="w-full h-full flex items-center justify-center"></div>
                </div>
                
                <!-- Viewer Video -->
                <div class="flex-1 bg-black rounded-xl border-4 border-secondary relative overflow-hidden flex items-center justify-center">
                    <span class="absolute top-4 right-4 bg-secondary text-white font-black px-3 py-1 text-xs uppercase z-10 shadow-[2px_2px_0_#fff]">Viewer</span>
                    <div id="costream-remote-vid" class="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest">Waiting for viewer...</div>
                </div>
            </div>
        </div>
    </div>
`;

html = html.replace('<!-- Reaction Modal -->', modalHtml + '\n    <!-- Reaction Modal -->');
fs.writeFileSync('whutcha-web/dashboard.html', html);
