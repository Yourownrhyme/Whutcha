const fs = require('fs');

// --- 1. Patch viewer.html ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// A. Defer external scripts
viewerHtml = viewerHtml.replace(
    /<script src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase\/supabase-js@2"><\/script>/,
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>'
);
viewerHtml = viewerHtml.replace(
    /<script src="https:\/\/cdn.jsdelivr.net\/npm\/livekit-client\/dist\/livekit.umd.min.js"><\/script>/,
    '<script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit.umd.min.js" defer></script>'
);
viewerHtml = viewerHtml.replace(
    /<script src="https:\/\/cdn.jsdelivr.net\/npm\/canvas-confetti@1.6.0\/dist\/confetti.browser.min.js"><\/script>/,
    '<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js" defer></script>'
);

// B. Module main script
viewerHtml = viewerHtml.replace(
    /<script>\s*const supabaseUrl = 'https:\/\/kjoffilncbybquvjytxx.supabase.co';/,
    '<script type="module">\n        const supabaseUrl = \'https://kjoffilncbybquvjytxx.supabase.co\';'
);

// C. Compress Video Bitrate
const oldMediaRecorder = /mediaRecorder = new MediaRecorder\(stream, \{ mimeType \}\);/;
const newMediaRecorder = `const options = { mimeType };
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    options.videoBitsPerSecond = 1000000; // 1 Mbps for fast 3G upload
                }
                mediaRecorder = new MediaRecorder(stream, options);`;
viewerHtml = viewerHtml.replace(oldMediaRecorder, newMediaRecorder);

// D. Upload UX
viewerHtml = viewerHtml.replace(
    /btnText\.innerText = "UPLOADING\.\.\.";/,
    'btnText.innerHTML = "UPLOADING... <span class=\'text-[10px] block opacity-70 animate-pulse\'>Compressing & uploading</span>";'
);

fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);


// --- 2. Patch dashboard.html ---
let dashboardHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Defer external scripts
dashboardHtml = dashboardHtml.replace(
    /<script src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase\/supabase-js@2"><\/script>/,
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>'
);
dashboardHtml = dashboardHtml.replace(
    /<script src="https:\/\/cdn.jsdelivr.net\/npm\/livekit-client\/dist\/livekit.umd.min.js"><\/script>/,
    '<script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit.umd.min.js" defer></script>'
);

fs.writeFileSync('whutcha-web/dashboard.html', dashboardHtml);

console.log("Mode 1 (Potato Phone) Phase 2 patches applied.");
