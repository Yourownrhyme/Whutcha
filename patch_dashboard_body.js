const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const newBody = `<body class="bg-background text-white min-h-screen flex flex-col font-sans">
    <!-- Navbar -->
    <nav class="p-4 md:p-6 flex justify-between items-center border-b-4 border-surface bg-background sticky top-0 z-50">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary text-black flex items-center justify-center brutal-card" style="border-radius: 8px; border: 3px solid black; box-shadow: 3px 3px 0 #fff;">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tighter hidden sm:block">Dashboard</h1>
            <span class="bg-secondary text-white text-xs font-black px-3 py-1 rounded-full uppercase border-2 border-white shadow-[2px_2px_0_#fff]">LIVE</span>
        </div>
        <div class="flex items-center gap-4">
            <button id="pwa-install-banner" class="hidden brutal-btn-primary px-4 py-2 text-sm text-black">Get App</button>
            <button onclick="signOut()" class="brutal-btn-secondary px-4 py-2 text-sm text-gray-400">Sign Out</button>
        </div>
    </nav>

    <div class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-12">
        <!-- Links Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <!-- Viewer Link -->
            <div class="brutal-card p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                    <h3 class="text-2xl font-black uppercase mb-2">Viewer Link</h3>
                    <p class="text-gray-400 font-bold mb-6 text-sm">Send this to your viewers to get video donations.</p>
                </div>
                <div class="flex flex-col xl:flex-row items-center gap-2">
                    <code id="viewer-link" class="brutal-input p-4 w-full truncate text-sm">Loading...</code>
                    <button onclick="copyViewerLink()" class="brutal-btn-primary p-4 shrink-0 bg-white w-full xl:w-auto flex justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- OBS Link -->
            <div class="brutal-card p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                    <div class="flex justify-between items-start relative z-10">
                        <h3 class="text-2xl font-black uppercase mb-2">OBS Overlay</h3>
                        <div class="group/tooltip relative">
                            <div class="w-8 h-8 rounded-full bg-surface border-2 border-white text-white font-black flex items-center justify-center cursor-help shadow-[2px_2px_0_#D8FF00]">?</div>
                            <div class="absolute right-0 top-10 w-64 p-4 brutal-card bg-background border-primary text-sm text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                <strong class="text-primary block mb-2 text-lg uppercase">Why is it blank? 🧐</strong>
                                The overlay is meant to be transparent! Add this URL in OBS as a "Browser Source". The video appears automatically when a donation is sent.
                            </div>
                        </div>
                    </div>
                    <p class="text-gray-400 font-bold mb-6 text-sm">Add this as a Browser Source in OBS Studio.</p>
                </div>
                <button onclick="copyOverlayUrl()" class="brutal-btn-primary w-full py-4 bg-secondary text-white border-white shadow-[4px_4px_0_#fff]">
                    Copy OBS Link
                </button>
            </div>
        </div>

        <!-- Queue Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b-4 border-surface pb-6">
            <div>
                <h2 class="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                    Live Queue
                </h2>
                <p class="text-gray-400 font-bold mt-2">Approve videos before they hit the stream.</p>
            </div>
            <div class="flex items-center gap-4 brutal-card px-6 py-3 bg-white text-black border-black border-4 shadow-[4px_4px_0_#FF0055]">
                <div class="text-4xl font-black" id="queue-count">0</div>
                <div class="text-sm font-black uppercase leading-tight">Pending<br>Videos</div>
            </div>
        </div>

        <!-- Queue Container -->
        <div id="queue-container" class="grid grid-cols-1 gap-6">
            <!-- Cards will be injected here via dashboard.js -->
        </div>
        
        <div id="empty-state" class="text-center py-20 brutal-card border-dashed border-4 border-surface">
            <svg class="w-20 h-20 text-surface mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <h3 class="text-3xl font-black uppercase text-gray-500">Queue is Empty</h3>
            <p class="text-gray-600 font-bold mt-2">Share your link to get some action.</p>
        </div>
    </div>
    
    <div id="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 transform transition-all duration-300 translate-y-20 opacity-0 z-50">
        <div class="brutal-card bg-primary border-black px-6 py-3 flex items-center shadow-[4px_4px_0_#fff]">
            <span class="font-black uppercase text-black">Copied to clipboard!</span>
        </div>
    </div>
    
    <!-- Reaction Modal -->
    <div id="reaction-modal" class="fixed inset-0 z-[100] bg-black/90 hidden flex-col items-center justify-center p-6 backdrop-blur-md">
        <div class="brutal-card w-full max-w-4xl p-6 flex flex-col gap-6 relative">
            <div class="flex justify-between items-center border-b-4 border-surface pb-4">
                <h3 class="text-3xl font-black uppercase text-primary">Record Reaction</h3>
                <button onclick="closeReactionModal()" class="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-white hover:bg-secondary hover:text-white transition-colors border-2 border-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <canvas id="reaction-canvas" width="1280" height="720" class="hidden"></canvas>
            
            <div class="flex flex-col md:flex-row gap-6 h-[50vh]">
                <div class="flex-1 bg-black rounded-xl border-4 border-surface relative overflow-hidden">
                    <span class="absolute top-4 left-4 bg-primary text-black font-black px-3 py-1 text-xs uppercase z-10 shadow-[2px_2px_0_#fff]">Donation</span>
                    <video id="reaction-viewer-vid" class="w-full h-full object-cover" controls preload="metadata"></video>
                </div>
                
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
    
    <script type="module" src="./dashboard.js?v=13"></script>
</body>`;

html = html.replace(/<body[\s\S]*<\/body>/, newBody);
fs.writeFileSync('whutcha-web/dashboard.html', html);
