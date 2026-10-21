const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const target = /<div class="px-4 py-2 glass-card rounded-xl border border-white\/10 flex items-center gap-3">\s*<span class="text-2xl font-black text-white" id="queue-count">0<\/span>\s*<span class="text-\[10px\] font-black text-silver uppercase leading-tight">Pending<br>Videos<\/span>\s*<\/div>/;

const replacement = `<div class="flex items-center gap-3">
                        <button id="btn-sync-queue" onclick="syncQueue()" class="p-2 glass-card rounded-xl border border-white/10 text-silver hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center group shadow-lg" title="Force Sync Queue">
                            <svg id="sync-icon" class="w-6 h-6 group-active:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <div class="px-4 py-2 glass-card rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
                            <span class="text-2xl font-black text-white" id="queue-count">0</span>
                            <span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>
                        </div>
                    </div>`;

if (!html.includes('btn-sync-queue')) {
    html = html.replace(target, replacement);
    fs.writeFileSync('whutcha-web/dashboard.html', html);
    console.log('Patched dashboard.html');
}
