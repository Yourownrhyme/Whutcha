const fs = require('fs');

// --- PATCH 1: viewer.html (Fix Camera Autoplay Block) ---
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Remove the dangerous auto-start setTimeout
viewer = viewer.replace(/\/\/ Auto-start camera directly[\s\S]*?\}\);/g, '');

// Inject a camera access overlay that requires a click
const cameraOverlay = `
    <!-- Camera Start Overlay -->
    <div id="camera-overlay" class="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div class="glass-card p-8 rounded-3xl max-w-sm w-full border border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h2 class="text-2xl font-black text-white mb-2">Record a Video</h2>
            <p class="text-silver text-sm mb-8">We need camera and microphone access to record your message.</p>
            <button id="btn-allow-camera" class="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-black font-black text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:opacity-90 transition-opacity">
                Allow Camera
            </button>
        </div>
    </div>
`;
// Insert overlay right inside main-form-ui or body
viewer = viewer.replace(/<div id="main-form-ui" class="w-full max-w-xl mx-auto flex flex-col h-full md:h-auto">/, '<div id="main-form-ui" class="w-full max-w-xl mx-auto flex flex-col h-full md:h-auto relative overflow-hidden rounded-3xl">' + cameraOverlay);

// Add listener to button to hide overlay and start camera
viewer = viewer.replace(/const submitBtn = document\.getElementById\('submit-btn'\);/, `const submitBtn = document.getElementById('submit-btn');
            const btnAllowCamera = document.getElementById('btn-allow-camera');
            if (btnAllowCamera) {
                btnAllowCamera.addEventListener('click', () => {
                    document.getElementById('camera-overlay').style.display = 'none';
                    startRecording();
                });
            }
`);

fs.writeFileSync('whutcha-web/viewer.html', viewer);
console.log("Patched viewer.html: Added Camera Start Overlay");


// --- PATCH 4: dashboard.html (Mobile Sidebar Layout Fix) ---
let dash = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Change sidebar classes so it doesn't take up the whole screen on mobile.
// Make it horizontal nav on mobile, or just hide the Install App button into a smaller footprint.
dash = dash.replace(/<aside class="w-full md:w-72 h-auto md:h-screen glass-card flex flex-col justify-between p-6 z-20 relative border-r border-white\/10 shrink-0">/, 
`<aside class="w-full md:w-72 h-auto md:h-screen glass-card flex md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 z-20 relative border-b md:border-r border-white/10 shrink-0 sticky top-0 md:static backdrop-blur-3xl">`);

// Adjust the inner divs of aside to flow horizontally on mobile
dash = dash.replace(/<div class="flex items-center gap-4 mb-12">/g, '<div class="flex items-center gap-4 md:mb-12">');
dash = dash.replace(/<nav class="space-y-2">/g, '<nav class="hidden md:block space-y-2">'); // Hide main nav items on mobile header
dash = dash.replace(/<div class="space-y-4">/, '<div class="flex md:flex-col items-center gap-2 md:space-y-4 md:gap-0 mt-4 md:mt-0 w-full md:w-auto">');

// Add a Bottom Navigation Bar specifically for mobile
const bottomNav = `
    <!-- Mobile Bottom Navigation (Hidden on Desktop) -->
    <div class="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-card border-t border-white/10 flex justify-around p-4 pb-8 backdrop-blur-xl bg-background/80">
        <a href="#" class="flex flex-col items-center gap-1 text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span class="text-[10px] font-bold">Queue</span>
        </a>
        <button onclick="openModal('legal-modal-tos')" class="flex flex-col items-center gap-1 text-silver">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span class="text-[10px] font-bold">Legal</span>
        </button>
        <button onclick="signOut()" class="flex flex-col items-center gap-1 text-red-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span class="text-[10px] font-bold">Sign Out</span>
        </button>
    </div>
`;
dash = dash.replace(/<\/body>/, bottomNav + '\n</body>');

fs.writeFileSync('whutcha-web/dashboard.html', dash);
console.log("Patched dashboard.html: Mobile Sidebar and Bottom Nav fixed");
