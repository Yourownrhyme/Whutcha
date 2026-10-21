const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldHeader = `<h1 class="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg"><span class="font-black text-xl">W</span></div><span class="tracking-tight hidden sm:block">Dashboard</span></div></h1>`;
const newHeader = `<div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(157,0,255,0.4)] border border-white/20">
                    <span class="font-black text-xl text-white">W</span>
                </div>
                <h1 class="text-2xl font-black tracking-tighter text-white hidden sm:block">Dashboard</h1>
            </div>`;

html = html.replace(oldHeader, newHeader);

// Move PWA Install Banner to Top Right (Below Navbar)
const oldPwa = `<!-- Install PWA Banner -->
    <div id="pwa-install-banner" class="fixed left-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-primary to-[#5b0099] backdrop-blur-md px-2 py-8 rounded-r-2xl z-50 cursor-pointer hover:scale-105 hover:pr-4 transition-all flex flex-col items-center shadow-[0_0_30px_rgba(157,0,255,0.6)] border border-white/20 border-l-0">
        <svg class="w-6 h-6 text-white mb-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        <span class="text-sm font-black text-white tracking-widest" style="writing-mode: vertical-rl; transform: rotate(180deg);">INSTALL APP</span>
    </div>`;
html = html.replace(oldPwa, '');

const newPwa = `<!-- Install PWA Button -->
            <button id="pwa-install-banner" class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Install App
            </button>`;

// Insert the new PWA button into the Navbar, before Sign Out
html = html.replace(/<button onclick="signOut\(\)"/, newPwa + '\n            <button onclick="signOut()"');

fs.writeFileSync('whutcha-web/dashboard.html', html);
