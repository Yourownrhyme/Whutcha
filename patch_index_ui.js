const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// Update styling in head
html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>
        body {
            background-color: #0A0A0F;
            color: white;
            overflow: hidden;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Modern UI Background Glow */
        .bg-glow {
            position: fixed;
            width: 60vw;
            height: 60vw;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
            animation: float 20s infinite alternate;
        }
        .glow-primary { background: #9D00FF; top: -10%; left: -10%; }
        .glow-secondary { background: #00E5FF; bottom: -20%; right: -10%; animation-delay: -5s; }

        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(5%, 5%) scale(1.1); }
            100% { transform: translate(-5%, 10%) scale(0.9); }
        }

        .glass-panel {
            background: rgba(21, 21, 26, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .sidebar-open { transform: translateX(0); box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        .sidebar-closed { transform: translateX(100%); }
    </style>`);

// Remove Unsplash image
html = html.replace(/<div class="fixed inset-0 z-0 bg-\[url.*?<\/div>/, `<div class="bg-glow glow-primary"></div><div class="bg-glow glow-secondary"></div>`);

// Enhance Auth/Landing container
html = html.replace(/<div class="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">[\s\S]*?<div class="w-full max-w-sm space-y-3/, `<div class="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 relative z-10">
        <div class="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-[28rem] flex flex-col items-center">
            <div class="text-center mb-8 w-full">
                <div class="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(157,0,255,0.4)]">
                    <h1 class="text-4xl font-black tracking-tighter text-white">W</h1>
                </div>
                <h2 class="text-3xl font-black text-white mb-2">Whutcha</h2>
                <p class="text-gray-400 font-medium text-sm mt-2 mb-6">
                    The ultimate platform for video donations and live co-streams.
                </p>
                <div class="w-full h-px bg-white/10 mb-6"></div>
                <h3 class="text-xl font-bold text-gray-200">Sign In</h3>
            </div>
            
            <div class="w-full space-y-3 h-[45vh] overflow-y-auto pb-4 no-scrollbar px-1">`);

// Close the new glass-panel div
html = html.replace(/<!-- Terms Link -->[\s\S]*?<\/div>/, `<!-- Terms Link -->
            <div class="mt-8 text-center text-xs text-gray-500 flex flex-wrap justify-center gap-4">
                <button onclick="document.getElementById('legal-modal-terms').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">Terms of Use</button>
                <button onclick="document.getElementById('legal-modal-privacy').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">Privacy Policy</button>
                <button onclick="document.getElementById('legal-modal-gdpr').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">GDPR</button>
            </div>
        </div>
    </div>`);

// Update PWA Banner
html = html.replace(/<!-- Install PWA Banner -->[\s\S]*?<\/div>/, `<!-- Install PWA Banner -->
    <div id="pwa-install-banner" class="fixed left-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-primary to-[#5b0099] backdrop-blur-md px-2 py-8 rounded-r-2xl z-50 cursor-pointer hover:scale-105 hover:pr-4 transition-all flex flex-col items-center shadow-[0_0_30px_rgba(157,0,255,0.6)] border border-white/20 border-l-0">
        <svg class="w-6 h-6 text-white mb-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        <span class="text-sm font-black text-white tracking-widest" style="writing-mode: vertical-rl; transform: rotate(180deg);">INSTALL APP</span>
    </div>`);

fs.writeFileSync('whutcha-web/index.html', html);
