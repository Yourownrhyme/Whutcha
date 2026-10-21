const fs = require('fs');

// --- 1. PATCH donate-v2.html ---
let donate = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

// Fix memory leak in retakeVideo
donate = donate.replace(
    /function retakeVideo\(\) \{/,
    `function retakeVideo() {
        if (videoElement.src) { URL.revokeObjectURL(videoElement.src); videoElement.src = ''; }`
);

// Fix double submit and missing streamerId
donate = donate.replace(
    /submitBtn\.addEventListener\('click', async \(\) => \{/,
    `submitBtn.addEventListener('click', async () => {
        if (submitBtn.disabled) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const streamerId = urlParams.get('streamer');
        if (!streamerId || streamerId === 'default') {
            alert('Invalid Streamer ID. Cannot send donation.');
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "UPLOADING...";
        
        // Prevent accidental swipe/close during upload
        const beforeUnloadHandler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        try {`
);

donate = donate.replace(
    /window\.location\.href = externalLink;[\s\S]*?\} catch \(e\) \{/,
    `window.removeEventListener('beforeunload', beforeUnloadHandler);
                        window.location.href = externalLink;
                    }
                } catch (e) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                    window.removeEventListener('beforeunload', beforeUnloadHandler);`
);

fs.writeFileSync('whutcha-web/donate-v2.html', donate);


// --- 2. PATCH dashboard.js ---
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Fix Auth Race Condition & Tab Sync
const authPatch = `
// Strict Auth Guard
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        window.location.href = './index.html';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Hide UI until authenticated
    document.body.style.display = 'none';
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = './index.html';
        return;
    }
    currentUser = user;
    document.body.style.display = 'block';
`;
dash = dash.replace(/document\.addEventListener\('DOMContentLoaded', async \(\) => \{[\s\S]*?currentUser = user;/, authPatch);

// Fix AudioContext suspension in Reaction
dash = dash.replace(
    /const audioCtx = new \(window\.AudioContext \|\| window\.webkitAudioContext\)\(\);/,
    `const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();`
);

// Fix silent Profile UPSERT (Data Loss)
dash = dash.replace(
    /await supabaseClient\s*\.from\('profiles'\)\s*\.update\(\{ external_pay_link: link \}\)\s*\.eq\('id', currentUser\.id\);/,
    `await supabaseClient.from('profiles').upsert({ id: currentUser.id, external_pay_link: link });`
);

fs.writeFileSync('whutcha-web/dashboard.js', dash);


// --- 3. PATCH viewer.html ---
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Fix iframe load race condition
viewer = viewer.replace(
    /document\.getElementById\('donate-iframe'\)\.contentWindow\.postMessage\('startCamera', '\*'\);/g,
    `const iframe = document.getElementById('donate-iframe');
    if (iframe.contentWindow) iframe.contentWindow.postMessage('startCamera', '*');`
);
// Force startCamera if iframe is already loaded
viewer = viewer.replace(
    /<iframe id="donate-iframe"/,
    `<iframe id="donate-iframe" onload="this.style.opacity=1; document.getElementById('iframe-loader').style.display='none'; this.contentWindow.postMessage('startCamera', '*');"`
);
// Clean up old onload
viewer = viewer.replace(/onload="this\.style\.opacity=1; document\.getElementById\('iframe-loader'\)\.style\.display='none';" /g, "");

fs.writeFileSync('whutcha-web/viewer.html', viewer);

