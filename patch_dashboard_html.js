const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const bodyRegex = /<body class="bg-background text-white font-sans min-h-screen">[\s\S]*?<script type="module" src="\.\/dashboard\.js\?v=12"><\/script>\s*<\/body>/;

const newBody = `<body class="bg-background text-white min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav class="p-6 flex justify-between items-center border-b-4 border-surface bg-background sticky top-0 z-50">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary text-black flex items-center justify-center brutal-card" style="border-radius: 8px; border: 3px solid black; box-shadow: 3px 3px 0 #fff;">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tighter hidden sm:block">Dashboard</h1>
            <span class="bg-secondary text-white text-xs font-black px-3 py-1 rounded-full uppercase border-2 border-white shadow-[2px_2px_0_#fff]">LIVE</span>
        </div>
        <div class="flex items-center gap-4">
            <a href="https://your-store.lemonsqueezy.com/checkout/buy/product-id" class="hidden md:flex brutal-btn-primary px-4 py-2 text-sm bg-secondary text-white border-white hover:bg-white hover:text-black">
                Upgrade Pro
            </a>
            <button id="pwa-install-banner" class="hidden brutal-btn-primary px-4 py-2 text-sm">Get App</button>
            <button onclick="signOut()" class="brutal-btn-secondary px-4 py-2 text-sm text-gray-400">Sign Out</button>
        </div>
    </nav>

    <div class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
        <!-- Links Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <!-- Viewer Link -->
            <div class="brutal-card p-6 flex flex-col justify-between group relative overflow-hidden">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary rounded-full opacity-10 group-hover:scale-150 transition-transform"></div>
                <div>
                    <h3 class="text-2xl font-black uppercase mb-2 relative z-10">Viewer Link</h3>
                    <p class="text-gray-400 font-bold mb-6 text-sm relative z-10">Send this to your viewers to get video donations.</p>
                </div>
                <div class="flex items-center gap-2 relative z-10">
                    <code id="viewer-link" class="brutal-input p-4 w-full truncate text-sm">Loading...</code>
                    <button onclick="copyViewerLink()" class="brutal-btn-primary p-4 shrink-0 bg-white">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- OBS Link -->
            <div class="brutal-card p-6 flex flex-col justify-between group relative overflow-hidden">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-secondary rounded-full opacity-10 group-hover:scale-150 transition-transform"></div>
                <div>
                    <div class="flex justify-between items-start relative z-10">
                        <h3 class="text-2xl font-black uppercase mb-2">OBS Overlay</h3>
                        <div class="group/tooltip relative">
                            <div class="w-8 h-8 rounded-full bg-surface border-2 border-white text-white font-black flex items-center justify-center cursor-help shadow-[2px_2px_0_#D8FF00]">?</div>
                            <!-- Fixed tooltip positioning to prevent cutoff -->
                            <div class="absolute right-0 top-10 w-64 p-4 brutal-card bg-background border-primary text-sm text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                <strong class="text-primary block mb-2 text-lg uppercase">Why is it blank? 🧐</strong>
                                The overlay is meant to be transparent! Add this URL in OBS as a "Browser Source". The video appears automatically when a donation is sent.
                            </div>
                        </div>
                    </div>
                    <p class="text-gray-400 font-bold mb-6 text-sm relative z-10">Add this as a Browser Source in OBS Studio.</p>
                </div>
                <button onclick="copyOverlayUrl()" class="brutal-btn-primary w-full py-4 relative z-10 bg-secondary text-white border-white shadow-[4px_4px_0_#fff]">
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
    
    <script type="module" src="./dashboard.js?v=13"></script>
</body>`;

html = html.replace(bodyRegex, newBody);
fs.writeFileSync('whutcha-web/dashboard.html', html);
