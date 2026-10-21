const fs = require('fs');

// --- 1. Patch viewer.html (Crypto UUID for files) ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Replace Date.now() with crypto.randomUUID()
const oldFilename = /generatedVideoHash = \`vid_\\\$\\{Date\.now\(\)\}\./;
const newFilename = 'generatedVideoHash = `vid_${crypto.randomUUID()}.';
if (oldFilename.test(viewerHtml)) {
    viewerHtml = viewerHtml.replace(oldFilename, newFilename);
} else {
    // Fallback if regex misses
    viewerHtml = viewerHtml.replace(/generatedVideoHash = \`vid_\$\{Date\.now\(\)\}/g, 'generatedVideoHash = `vid_${crypto.randomUUID()}');
}
fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);


// --- 2. Patch dashboard.js (Signed URLs for Reaction) ---
let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// A. Remove public URL generation in renderQueue
dashJs = dashJs.replace(
    /const videoUrl = \`\$\{supabaseUrl\}\/storage\/v1\/object\/public\/videos\/\$\{d\.video_hash \|\| d\.videoHash\}\`;/g,
    'const videoHashRaw = d.video_hash || d.videoHash;'
);

// Update openReactionModal call to pass raw hash
dashJs = dashJs.replace(
    /onclick="openReactionModal\('\$\{d\.id\}', '\$\{videoUrl\}', '\$\{sanitize\(d\.username\)\}'\)"/g,
    'onclick="openReactionModal(\'${d.id}\', \'${videoHashRaw}\', \'${sanitize(d.username)}\')"'
);

// B. Update openReactionModal to fetch signed URL
const oldOpenReaction = /async function openReactionModal\(id, videoUrl, username\) \{[\s\S]*?reactionViewerVid\.src = videoUrl;/;
const newOpenReaction = `async function openReactionModal(id, videoHash, username) {
    currentReactionId = id;
    currentReactionUsername = username;
    reactionModal.classList.remove('hidden');
    reactionModal.classList.add('flex');
    
    // FETCH SECURE SIGNED URL (Valid for 60s)
    const { data, error } = await supabaseClient.storage.from('videos').createSignedUrl(videoHash, 60);
    if (error || !data) {
        alert("Security Error: Failed to generate signed URL for this video.");
        closeReactionModal();
        return;
    }
    
    reactionViewerVid.src = data.signedUrl;`;
dashJs = dashJs.replace(oldOpenReaction, newOpenReaction);

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);


// --- 3. Patch overlay.html (Signed URLs for OBS) ---
let overlayHtml = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const oldPlayVideo = /function playVideoMessage\(videoHash\) \{[\s\S]*?const videoUrl = \`\$\{supabaseUrl\}\/storage\/v1\/object\/public\/videos\/\$\{videoHash\}\?t=\$\{Date\.now\(\)\}\`;/;
const newPlayVideo = `async function playVideoMessage(videoHash) {
            mediaContainer.innerHTML = ''; 
            
            // FETCH SECURE SIGNED URL (Valid for 60s)
            const { data, error } = await supabase.storage.from('videos').createSignedUrl(videoHash, 60);
            if (error || !data) {
                console.error("OBS Security Error: Failed to generate signed URL");
                hideWidget();
                return;
            }
            const videoUrl = data.signedUrl;`;
overlayHtml = overlayHtml.replace(oldPlayVideo, newPlayVideo);

fs.writeFileSync('whutcha-web/overlay.html', overlayHtml);
console.log("Mode 1 (Round 2) patches applied.");
