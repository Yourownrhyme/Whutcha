const fs = require('fs');

// Patch overlay.html
let overlay = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const oldOverlayClear = `async function playVideoMessage(videoHash) {
            mediaContainer.innerHTML = ''; 
            
            // FETCH SECURE SIGNED URL (Valid for 60s)`;
            
const newOverlayClear = `async function playVideoMessage(videoHash) {
            // VAMPIRE MODE: Hard-stop any existing videos before wiping DOM to prevent OBS CEF memory leaks
            const oldVideos = mediaContainer.querySelectorAll('video');
            oldVideos.forEach(vid => { vid.pause(); vid.removeAttribute('src'); vid.load(); });
            mediaContainer.innerHTML = ''; 
            
            // FETCH SECURE SIGNED URL (Valid for 60s)`;

if (!overlay.includes('VAMPIRE MODE')) {
    overlay = overlay.replace(oldOverlayClear, newOverlayClear);
    fs.writeFileSync('whutcha-web/overlay.html', overlay);
    console.log('overlay.html patched for Vampire Mode.');
}

// Patch dashboard.js renderQueue
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldDashClear = `container.innerHTML = '';
    
    // WHALE MODE PROTECTOR: Hard limit to prevent DOM/Video OOM crashes`;
    
const newDashClear = `// VAMPIRE MODE: Aggressively destroy hidden <video> buffers before clearing DOM
    const oldVids = container.querySelectorAll('video');
    oldVids.forEach(vid => { vid.pause(); vid.removeAttribute('src'); vid.load(); });
    
    container.innerHTML = '';
    
    // WHALE MODE PROTECTOR: Hard limit to prevent DOM/Video OOM crashes`;

if (!dash.includes('VAMPIRE MODE: Aggressively destroy')) {
    dash = dash.replace(oldDashClear, newDashClear);
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js renderQueue patched for Vampire Mode.');
}

// Patch dashboard.js closeReactionModal
const oldReactionClear = `reactionViewerVid.pause();
    reactionViewerVid.src = '';
    
    if (cameraStream) {`;

const newReactionClear = `reactionViewerVid.pause();
    reactionViewerVid.removeAttribute('src');
    reactionViewerVid.load(); // VAMPIRE MODE: Force GC on media buffer
    
    if (cameraStream) {`;
    
if (!dash.includes('force GC on media buffer')) {
    dash = dash.replace(oldReactionClear, newReactionClear);
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js reaction cleanup patched for Vampire Mode.');
}

