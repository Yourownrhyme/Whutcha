const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Force the body to the sleek black padding
const bodyRegex = /<body[^>]*>/;
html = html.replace(bodyRegex, '<body class="bg-[#000000] text-white min-h-screen font-sans selection:bg-primary/30 flex flex-col relative overflow-x-hidden pt-8 md:pt-16 px-4">');

// 2. Add premium ambient glow
const ambientRegex = /<!-- Ambient Glow -->[\s\S]*?<div class="max-w-md mx-auto px-4 pt-6 relative z-10" id="main-ui">/;
const newAmbient = `<!-- Premium Background Elements -->
    <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[150px] mix-blend-screen animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#9D00FF]/15 rounded-full blur-[150px] mix-blend-screen animate-pulse" style="animation-delay: 2s;"></div>
    </div>
    
    <div class="max-w-md mx-auto w-full relative z-10" id="main-ui">`;
html = html.replace(ambientRegex, newAmbient);

// 3. Upgrade Streamer Info Card
html = html.replace(/class="flex items-center gap-4 mb-6 glass-card p-4 rounded-2xl"/, 'class="flex items-center gap-4 mb-6 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl"');

// 4. Upgrade Tab Container (Video vs Co-Stream)
html = html.replace(/class="flex p-1 bg-surface border border-white\/5 rounded-2xl mb-6 relative"/g,
'class="flex gap-2 p-1.5 bg-white/[0.03] backdrop-blur-2xl rounded-2xl w-full max-w-sm mx-auto mb-10 border border-white/5 shadow-inner relative"');

html = html.replace(/id="tab-video" class="flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 text-white"/g,
'id="tab-video" class="flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 text-white hover:text-white"');

// 5. Upgrade the sliding background active tab state (app.js toggles classes, but we can set the initial class)
// We will just upgrade the Main Form wrapper
html = html.replace(/<div class="glass-card border border-white\/5 rounded-3xl p-6 relative">/g,
'<div class="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 relative shadow-[0_30px_100px_rgba(0,0,0,1)]">');

// 6. Camera Box upgrade
html = html.replace(/class="w-full aspect-video bg-black rounded-2xl relative overflow-hidden mb-6 group"/g,
'class="w-full aspect-video bg-black rounded-[2rem] relative overflow-hidden mb-6 group border border-white/5 shadow-[inset_0_0_50px_rgba(0,0,0,1)]"');

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Force-patched viewer.html');
