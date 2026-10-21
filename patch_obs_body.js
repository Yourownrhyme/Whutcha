const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldViewerBlock = `<div class="mb-10 p-6 glass-panel rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Share this link to get Video Donations & Co-streams!</p>
                <p class="text-[10px] text-primary/80 font-bold mb-2 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    FOR VIEWERS
                </p>
                <div class="flex items-center gap-2 mt-2">
                    <code id="viewer-link" class="text-secondary font-mono text-sm bg-black/40 border border-white/10 px-4 py-3 rounded-xl block w-full max-w-lg truncate shadow-inner">Loading...</code>
                    <button onclick="copyViewerLink()" class="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white shadow-md active:scale-95 flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            </div>
            
        </div>`;

const newLinksGrid = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <!-- Viewer Link -->
            <div class="p-6 glass-panel rounded-2xl flex flex-col justify-between">
                <div>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Share this link to get Video Donations!</p>
                    <p class="text-[10px] text-primary/80 font-bold mb-4 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        FOR VIEWERS
                    </p>
                </div>
                <div class="flex items-center gap-2 mt-auto">
                    <code id="viewer-link" class="text-secondary font-mono text-xs sm:text-sm bg-black/40 border border-white/10 px-4 py-3 rounded-xl block w-full truncate shadow-inner">Loading...</code>
                    <button onclick="copyViewerLink()" class="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white shadow-md active:scale-95 flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- OBS Link -->
            <div class="p-6 glass-panel rounded-2xl flex flex-col justify-between relative group overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div>
                    <div class="flex justify-between items-start">
                        <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Your OBS Studio Overlay URL</p>
                        <div class="group/tooltip relative">
                            <div class="w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center cursor-help">?</div>
                            <div class="absolute right-0 top-6 w-64 p-3 bg-black/90 backdrop-blur border border-white/10 rounded-xl text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                                <strong class="text-white block mb-1">Зачем пустой экран? 🧐</strong>
                                Оверлей должен быть полностью прозрачным! Добавь эту ссылку в OBS как "Browser Source" поверх игры. Видео появится автоматически только когда зритель пришлет донат.
                            </div>
                        </div>
                    </div>
                    <p class="text-[10px] text-secondary/80 font-bold mb-4 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        FOR STREAMERS
                    </p>
                </div>
                <button onclick="copyOverlayUrl()" class="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold flex items-center justify-center transition-colors mt-auto">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    Copy OBS Overlay Link
                </button>
            </div>
        </div>`;

html = html.replace(oldViewerBlock, newLinksGrid);

// Also remove the OBS button from Navbar to avoid duplicate confusion
const navObsBtn = `<div class="flex flex-col items-center">
                <button onclick="copyOverlayUrl()" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold flex items-center transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    Copy OBS Overlay
                </button>
                <span class="text-[10px] text-secondary/80 font-bold mt-1 uppercase">For Streamers</span>
            </div>`;
html = html.replace(navObsBtn, '');

fs.writeFileSync('whutcha-web/dashboard.html', html);
