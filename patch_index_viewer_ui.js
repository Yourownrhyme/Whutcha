const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// Wrap the text center block in an ID
html = html.replace(/<div class="text-center mb-8 w-full">/, '<div id="onboarding-text" class="text-center mb-8 w-full">');

// Add a viewer specific block that is hidden by default
const viewerBlock = `
            <div id="viewer-profile" class="hidden text-center mb-8 w-full flex-col items-center">
                <div class="w-24 h-24 bg-gradient-to-br from-secondary to-primary rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.4)] border-4 border-white/10">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <h2 class="text-3xl font-black text-white mb-2">Live Streamer</h2>
                <p class="text-gray-400 font-medium text-sm mt-2 mb-6">
                    Support the stream with a Video Donation or join the Co-stream!
                </p>
                <div class="w-full h-px bg-white/10 mb-6"></div>
                <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary animate-pulse">Panel is open on the right 👉</h3>
            </div>`;

html = html.replace(/<div id="onboarding-text"/, viewerBlock + '\n            <div id="onboarding-text"');

fs.writeFileSync('whutcha-web/index.html', html);
