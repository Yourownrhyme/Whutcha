const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Viewer Link Tooltip Replacement
const oldViewer = `
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                Viewer Link
                                <div class="relative group cursor-help">
                                    <svg class="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div class="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-white/10 rounded-lg text-xs text-silver shadow-xl opacity-0 visibility-hidden transform translate-y-2 transition-all z-50 text-center">
                                        Paste this in your Twitch chat (!donate) or channel panels.
                                    </div>
                                </div>
                            </h3>`;
                            
const newViewer = `
                            <div class="relative group/tooltip inline-block">
                                <h3 class="text-lg font-bold text-white cursor-default">
                                    Viewer Link
                                </h3>
                                <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-white/10 text-silver text-[10px] font-bold rounded-lg shadow-2xl z-50 text-center backdrop-blur-md">
                                    Paste this in your Twitch chat (!donate) or channel panels.
                                </div>
                            </div>`;
                            
html = html.replace(oldViewer, newViewer);

// OBS Link Tooltip Replacement
const oldObs = `
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                OBS Overlay Link
                                <div class="relative group cursor-help">
                                    <svg class="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div class="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-white/10 rounded-lg text-xs text-silver shadow-xl opacity-0 visibility-hidden transform translate-y-2 transition-all z-50 text-center">
                                        Add as a Browser Source in OBS. Recommended size: 1920x1080. Check "Control audio via OBS".
                                    </div>
                                </div>
                            </h3>`;
                            
const newObs = `
                            <div class="relative group/tooltip inline-block">
                                <h3 class="text-lg font-bold text-white cursor-default">
                                    OBS Overlay Link
                                </h3>
                                <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-56 p-3 bg-black/90 border border-secondary/30 text-white text-[11px] font-bold rounded-lg shadow-[0_0_30px_rgba(157,0,255,0.3)] z-50 text-center backdrop-blur-md leading-relaxed">
                                    Add as a Browser Source in OBS.<br>Size: 1920x1080.<br><span class="text-secondary">Check "Control audio via OBS".</span>
                                </div>
                            </div>`;

html = html.replace(oldObs, newObs);

// Queue Empty Tooltip
const oldEmptyCopy = `onclick="copyViewerUrl()" aria-label="Copy viewer link" class="mt-6 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"`;
const newEmptyCopy = `onclick="copyViewerUrl(this)" aria-label="Copy viewer link" class="mt-6 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 relative group/tooltip"`;

if (html.includes(oldEmptyCopy)) {
    html = html.replace(oldEmptyCopy, newEmptyCopy);
    // Add tooltip inside the button
    html = html.replace('Copy Viewer Link\n                    </button>', 'Copy Viewer Link\n                        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-white/10 text-silver text-[10px] rounded-lg shadow-2xl z-50 text-center normal-case">Instantly copies your viral link.</div>\n                    </button>');
}

// Add tooltip to "Test Alert" button
const oldTest = `onclick="testOverlay()" class="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-colors border border-white/10"`;
const newTest = `onclick="testOverlay()" class="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-colors border border-white/10 relative group/tooltip"`;
if (html.includes(oldTest)) {
    html = html.replace(oldTest, newTest);
    html = html.replace('Test Overlay\n                    </button>', 'Test Overlay\n                        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-white/10 text-silver text-[10px] rounded-lg shadow-2xl z-50 text-center normal-case tracking-normal font-normal">Sends a fake $50 whale donation to OBS.</div>\n                    </button>');
}

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('dashboard.html tooltips injected.');
