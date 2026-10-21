const fs = require('fs');

let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// We will replace the entire <aside> tag contents.
// Let's find the boundaries of <aside>...</aside>
const asideRegex = /<aside[\s\S]*?<\/aside>/;

const newAside = `<aside class="w-full md:w-72 h-auto md:h-screen glass-card flex md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 z-20 relative border-b md:border-r border-white/10 shrink-0 sticky top-0 md:static backdrop-blur-3xl">
        <div class="w-full">
            <!-- Logo -->
            <div class="flex items-center gap-4 md:mb-12">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <div class="w-full h-full bg-surface rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <h1 class="text-2xl font-black tracking-tight text-glow">Whutcha</h1>
            </div>

            <!-- Network Status Indicator (Moved Up) -->
            <div class="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 mb-4 group transition-colors">
                <div class="relative flex items-center justify-center w-8 h-8">
                    <div id="network-ping" class="absolute w-full h-full bg-green-500 rounded-full animate-ping opacity-20"></div>
                    <div id="network-dot" class="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-colors"></div>
                </div>
                <div>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Database Link</p>
                    <p class="text-xs font-black text-white uppercase tracking-wider" id="network-text">Connected</p>
                </div>
            </div>

            <!-- Alerts ON (Moved Up) -->
            <div class="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5 mb-8 group cursor-pointer hover:border-primary/50 transition-colors" onclick="requestNotifications()">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Notifications</p>
                        <p class="text-xs font-black text-white uppercase tracking-wider" id="notif-status">Alerts OFF</p>
                    </div>
                </div>
            </div>

            <!-- Nav Links -->
            <nav class="hidden md:block space-y-2">
                <a href="#" class="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5 shadow-inner">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    Live Queue
                </a>
                
                <button onclick="openSettingsModal()" class="w-full flex items-center gap-3 px-4 py-3 text-silver hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all text-left">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Settings
                </button>
            </nav>
        </div>

        <div class="flex md:flex-col items-center gap-2 md:space-y-4 md:gap-0 mt-4 md:mt-0 w-full md:w-auto">
            <!-- PWA Install -->
            <button id="pwa-install-banner" class="hidden w-full relative group overflow-hidden rounded-xl p-[1px] mb-2">
                <div class="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-50 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <div class="relative flex items-center justify-center gap-2 bg-surface w-full py-3 rounded-xl transition-all">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span class="text-xs font-black text-white tracking-widest uppercase">Install App</span>
                </div>
            </button>

            <!-- Sign Out (Desktop) -->
            <button onclick="signOut()" class="hidden md:flex w-full items-center gap-3 px-4 py-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all text-left">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Sign Out
            </button>
        </div>
    </aside>`;

html = html.replace(asideRegex, newAside);

// Fix the Terms & Privacy links to open modals
html = html.replace(/<a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use<\/a>/g, `<button onclick="openModal('legal-modal-tos')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</button>`);
html = html.replace(/<a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy<\/a>/g, `<button onclick="openModal('legal-modal-privacy')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>`);

// Fix footer in index.html too
let idx = fs.readFileSync('whutcha-web/index.html', 'utf8');
idx = idx.replace(/<a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use<\/a>/g, `<a href="dashboard.html" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</a>`);
idx = idx.replace(/<a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy<\/a>/g, `<a href="dashboard.html" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</a>`);
fs.writeFileSync('whutcha-web/index.html', idx);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log("dashboard.html aside replaced successfully");
