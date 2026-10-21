const fs = require('fs');
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// --- 1. Patch Ghost Streamer ---
// We have two fetch logic blocks (I might have injected one earlier). Let's replace the fetch profile logic.
const fetchRegex = /const \{ data: profile \} = await supabase\.from\('profiles'\)\.select\('\*'\)\.eq\('id', streamerId\)\.single\(\);\n\s*if \(profile\) \{[\s\S]*?updateSubmitBtn\(\);\n\s*\}/;
const newFetch = `const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', streamerId).single();
            if (profileError || !profile) {
                document.body.innerHTML = '<div class="flex min-h-screen bg-background items-center justify-center p-6"><div class="glass-card w-full max-w-sm p-8 rounded-3xl text-center border-red-500/30 border shadow-[0_0_50px_rgba(239,68,68,0.2)]"><div class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><h2 class="text-2xl font-black text-white mb-2">Streamer Not Found</h2><p class="text-silver text-sm">This link is invalid or the streamer deleted their account.</p></div></div>';
                return;
            }
            
            if (profile.username) {
                streamerNameDisplay.innerText = profile.username;
                document.title = "Donate to " + profile.username;
            }
            if (profile.avatar_url) {
                streamerAvatar.src = profile.avatar_url;
            }
            if (profile.min_video_price) minVideoPrice = parseFloat(profile.min_video_price);
            if (profile.min_costream_price) minCostreamPrice = parseFloat(profile.min_costream_price);
            
            currentMinPrice = minVideoPrice;
            amountInput.value = currentMinPrice.toFixed(2);
            updateSubmitBtn();`;

if (fetchRegex.test(viewerHtml)) {
    viewerHtml = viewerHtml.replace(fetchRegex, newFetch);
} else {
    console.log("Could not find exact profile fetch block.");
}

// --- 2. Patch Silent Retake ---
const retakeEvent = /retakeBtn\.addEventListener\('click', \(\) => \{[\s]*vibrate\(\[30\]\);/;
const retakeEventNew = `retakeBtn.addEventListener('click', () => {
                if (!confirm("Are you sure you want to delete this recording and start over?")) return;
                vibrate([30]);`;
viewerHtml = viewerHtml.replace(retakeEvent, retakeEventNew);

// --- 3. Patch Camera Block UI ---
const oldCameraError = /document\.getElementById\('camera-error-text'\)\.innerText = "Camera access denied\. Check browser settings\.";/;
const newCameraError = `document.getElementById('camera-error-text').innerHTML = "🔒 <b>Camera Blocked!</b><br><br>Please click the lock icon in your browser's address bar to allow camera access, then refresh the page.";`;
viewerHtml = viewerHtml.replace(oldCameraError, newCameraError);


fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
console.log("Mode 4 (Round 2) patches applied.");
