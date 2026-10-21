const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const target = `<span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>`;
const replacement = `<span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>
                        </div>
                    </div>
                </div>
                <div class="text-xs text-silver/50 font-bold mb-4">
                    ⚡ Power-User Hotkeys: <kbd class="bg-white/10 px-1.5 py-0.5 rounded">Shift+A</kbd> Approve / <kbd class="bg-white/10 px-1.5 py-0.5 rounded">Shift+R</kbd> Reject top video
                </div>`;

// Wait, the structure in dashboard.html:
/*
                    <div class="flex items-center gap-3">
                        <button id="btn-sync-queue" ...>...</button>
                        <div class="px-4 py-2 glass-card rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
                            <span class="text-2xl font-black text-white" id="queue-count">0</span>
                            <span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>
                        </div>
                    </div>
                </div>
                <div id="queue-container" class="space-y-4">
*/
// I will replace `Pending<br>Videos</span>\n                        </div>\n                    </div>\n                </div>`

html = html.replace(
    /<span class="text-\[10px\] font-black text-silver uppercase leading-tight">Pending<br>Videos<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/,
    `<span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>
                        </div>
                    </div>
                </div>
                <div class="text-[10px] text-silver/50 font-bold mb-4 uppercase tracking-wider">
                    ⚡ Hotkeys: <kbd class="bg-white/10 px-1.5 py-0.5 rounded text-white mx-1">Shift + A</kbd> Approve <kbd class="bg-white/10 px-1.5 py-0.5 rounded text-white mx-1 ml-3">Shift + R</kbd> Reject
                </div>`
);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('dashboard.html UI hint added.');
