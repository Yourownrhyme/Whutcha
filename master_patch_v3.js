const fs = require('fs');

// --- 1. PATCH dashboard.js (Zombie UI & Error Boundaries) ---
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

dash = dash.replace(
    /window\.rejectDonation = async \(id\) => \{[\s\S]*?await supabaseClient\.from\('donations'\)\.update\(\{ status: 'rejected' \}\)\.eq\('id', id\);/g,
    `window.rejectDonation = async (id) => {
    const { error } = await supabaseClient.from('donations').update({ status: 'rejected' }).eq('id', id);
    if (error) { alert("Network error: Could not reject."); return; }`
);

dash = dash.replace(
    /window\.approveDonation = async \(id\) => \{[\s\S]*?await supabaseClient\.from\('donations'\)\.update\(\{ status: 'approved' \}\)\.eq\('id', id\);/g,
    `window.approveDonation = async (id) => {
    const { error } = await supabaseClient.from('donations').update({ status: 'approved' }).eq('id', id);
    if (error) { alert("Network error: Could not approve."); return; }`
);

// Cache buster for videos
dash = dash.replace(
    /const videoUrl = \`\$\{supabaseUrl\}\/storage\/v1\/object\/public\/videos\/\$\{\(d\.videoHash \|\| d\.video_hash\)\}\`;/g,
    `const videoUrl = \`\$\{supabaseUrl\}/storage/v1/object/public/videos/\$\{\(d.videoHash || d.video_hash\)\}?t=\$\{Date.now()\}\`;`
);

fs.writeFileSync('whutcha-web/dashboard.js', dash);

// --- 2. PATCH donate-v2.html (Top Frame Redirect & Local Track Race) ---
let donate = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

donate = donate.replace(
    /window\.location\.href = externalLink;/g,
    `window.top.location.href = externalLink;`
);

donate = donate.replace(
    /const localPublication = room\.localParticipant\.videoTrackPublications\.values\(\)\.next\(\)\.value;[\s\S]*?document\.getElementById\('local-video-container'\)\.appendChild\(videoElement\);[\s\S]*?\}/g,
    `room.localParticipant.on('localTrackPublished', (publication) => {
        if (publication.track) {
            const videoElement = publication.track.attach();
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
            videoElement.style.objectFit = "cover";
            document.getElementById('local-video-container').appendChild(videoElement);
        }
    });`
);

fs.writeFileSync('whutcha-web/donate-v2.html', donate);

