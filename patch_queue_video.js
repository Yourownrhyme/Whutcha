const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Fix 1: The thumbnail videoUrl bug
const oldVideoTag = `? '<div class="w-full h-full flex flex-col items-center justify-center bg-secondary/20"><svg class="w-8 h-8 text-secondary mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="font-black text-xs text-secondary uppercase tracking-widest">Co-Stream</span></div>'
                : \`<video src="\${videoUrl}" class="w-full h-full object-cover" controls preload="metadata"></video>\``;
                
const newVideoTag = `? '<div class="w-full h-full flex flex-col items-center justify-center bg-secondary/20"><svg class="w-8 h-8 text-secondary mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="font-black text-xs text-secondary uppercase tracking-widest">Co-Stream</span></div>'
                : \`<div id="vid-container-\${d.id}" class="w-full h-full flex items-center justify-center bg-gray-900 text-silver text-[10px] font-bold uppercase text-center p-2"><button onclick="loadVideoPreview('\${d.id}', '\${d.video_hash || d.videoHash}')" class="px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors">▶ Load Preview</button></div>\``;

if (dash.includes(oldVideoTag)) {
    dash = dash.replaceAll(oldVideoTag, newVideoTag);
}

// Fix 2: The Reaction button arguments
const oldReaction1 = `\${!isCoStream ? \`<button onclick="openReactionModal('\${videoUrl}')" class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-colors">Reaction</button>\` : ''}`;
const newReaction1 = `\${!isCoStream ? \`<button onclick="openReactionModal('\${d.id}', '\${d.video_hash || d.videoHash}', '\${sanitize(d.username)}')" class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-colors">Reaction</button>\` : ''}`;

if (dash.includes(oldReaction1)) {
    dash = dash.replaceAll(oldReaction1, newReaction1);
}

const oldReaction2 = `\${!isCoStream ? \`<button onclick="openReactionModal('\${d.id}', '\${videoUrl}')" class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-colors">Reaction</button>\` : ''}`;
if (dash.includes(oldReaction2)) {
    dash = dash.replaceAll(oldReaction2, newReaction1);
}

// Fix 3: Add loadVideoPreview function
const loaderFunc = `
window.loadVideoPreview = async function(id, videoHash) {
    const container = document.getElementById('vid-container-' + id);
    if (!container) return;
    if (!(await ensureSession())) return;
    
    container.innerHTML = '<span class="animate-pulse">Loading...</span>';
    
    const { data, error } = await supabaseClient.storage.from('videos').createSignedUrl(videoHash, 300);
    if (error || !data) {
        container.innerHTML = '<span class="text-red-500">Failed</span>';
        return;
    }
    
    container.innerHTML = \`<video src="\${data.signedUrl}" class="w-full h-full object-cover" controls autoplay muted></video>\`;
};
`;

if (!dash.includes('window.loadVideoPreview =')) {
    dash += '\n' + loaderFunc;
}

fs.writeFileSync('whutcha-web/dashboard.js', dash);
console.log('dashboard.js video URLs patched.');
