const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Body & Background
html = html.replace('<body class="bg-bg text-white min-h-screen font-sans selection:bg-primary/30 flex flex-col relative overflow-x-hidden pt-8">',
'<body class="bg-[#000000] text-white min-h-screen font-sans selection:bg-primary/30 flex flex-col relative overflow-x-hidden pt-8 md:pt-16 px-4">');

html = html.replace(/<div class="fixed inset-0 pointer-events-none z-0">[\s\S]*?<\/div>\s*<\/div>/,
`<div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[150px] mix-blend-screen animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#9D00FF]/15 rounded-full blur-[150px] mix-blend-screen animate-pulse" style="animation-delay: 2s;"></div>
    </div>`);

// 2. Streamer Info Card
html = html.replace(/<div class="glass-panel p-6 rounded-3xl/g, 'class="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl');

// 3. Tab Container (Video vs Co-Stream)
html = html.replace(/class="flex gap-2 p-1 bg-black\/50 backdrop-blur-xl rounded-2xl w-full max-w-sm mx-auto mb-8 border border-white\/10"/g,
'class="flex gap-2 p-1.5 bg-white/[0.03] backdrop-blur-2xl rounded-2xl w-full max-w-sm mx-auto mb-10 border border-white/5 shadow-inner"');

html = html.replace(/id="tab-video" class="flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-black shadow-lg"/g,
'id="tab-video" class="flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"');

// 4. Main form block
html = html.replace(/class="bg-surface border border-white\/5 rounded-3xl p-6 lg:p-8 relative shadow-2xl"/g,
'class="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 relative shadow-[0_30px_100px_rgba(0,0,0,1)]"');

// 5. Input fields (darker, softer)
html = html.replace(/bg-black\/50 border border-white\/10/g, 'bg-[#111113] border border-white/5');
html = html.replace(/bg-surface border border-white\/10/g, 'bg-[#111113] border border-white/5');
html = html.replace(/border-white\/10/g, 'border-white/5');

// 6. Camera Box
html = html.replace(/class="aspect-video bg-black rounded-2xl overflow-hidden relative border border-white\/10 shadow-inner group\/camera"/g,
'class="aspect-video bg-black rounded-[2rem] overflow-hidden relative border border-white/5 shadow-[inset_0_0_50px_rgba(0,0,0,1)] group/camera"');

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Successfully rewrote viewer.html');
