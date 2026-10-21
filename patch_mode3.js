const fs = require('fs');

// --- 1. Patch viewer.html (Maxlength) ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
viewerHtml = viewerHtml.replace(
    /<input type="text" id="nickname" placeholder="Anonymous"/, 
    '<input type="text" id="nickname" maxlength="20" placeholder="Anonymous"'
);
fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);

// --- 2. Patch overlay.html (Truncate OBS name) ---
let overlayHtml = fs.readFileSync('whutcha-web/overlay.html', 'utf8');
overlayHtml = overlayHtml.replace(
    /<span id="donor-name">/, 
    '<span id="donor-name" class="truncate inline-block max-w-[250px] align-bottom">'
);
fs.writeFileSync('whutcha-web/overlay.html', overlayHtml);

// --- 3. Patch dashboard.html (Reaction modal scroll & Gamified Empty State) ---
let dashboardHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Fix Reaction Modal Scroll
const oldReactionModal = /<div id="reaction-modal" class="fixed inset-0 z-\[110\] modal-glass hidden flex-col items-center justify-center p-6">/;
const newReactionModal = '<div id="reaction-modal" class="fixed inset-0 z-[110] modal-glass hidden flex-col items-center justify-start sm:justify-center p-6 overflow-y-auto">';
dashboardHtml = dashboardHtml.replace(oldReactionModal, newReactionModal);

// Fix Empty State
const oldEmptyStateRegex = /<div id="empty-state"[\s\S]*?<\/div>\s*<\/section>/;
const newEmptyState = `<div id="empty-state" class="text-center py-16 px-6 glass-card rounded-3xl border-dashed border-white/20 flex flex-col items-center justify-center">
                    <div class="w-16 h-16 mx-auto bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-black text-white mt-6">Queue is Empty</h3>
                    <p class="text-silver text-sm mt-2 max-w-sm mx-auto">You're all caught up! Drop your viewer link in your Twitch chat or bio to receive your first video donation.</p>
                    
                    <button onclick="copyViewerUrl()" class="mt-6 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        Copy Viewer Link
                    </button>
                </div>
            </section>`;
dashboardHtml = dashboardHtml.replace(oldEmptyStateRegex, newEmptyState);

fs.writeFileSync('whutcha-web/dashboard.html', dashboardHtml);

// --- 4. Patch dashboard.js (Truncate Queue text & Add copyViewerUrl) ---
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Add truncate to username in queue
js = js.replace(/<h4 class="text-xl font-bold text-white mb-1">/g, '<h4 class="text-xl font-bold text-white mb-1 truncate max-w-[200px] sm:max-w-[150px]">');

// Add copyViewerUrl function
const viewerUrlFunc = `
window.copyViewerUrl = function() {
    vibrate([50]);
    if (!currentUser || !currentUser.id) return;
    // Attempt to use profile username if available, else UUID
    const idToUse = currentUser.id; // Could query profiles, but UUID is guaranteed safe
    const url = \`\${window.location.origin}/viewer.html?streamer=\${idToUse}\`;
    fallbackCopyTextToClipboard(url, 'Viewer Link');
};
`;
js = js.replace(/function copyOverlayUrl/, viewerUrlFunc + '\nfunction copyOverlayUrl');

fs.writeFileSync('whutcha-web/dashboard.js', js);
console.log("Mode 3 (Sadist) patches applied.");
