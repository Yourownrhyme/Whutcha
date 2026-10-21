const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Body & Layout
html = html.replace('<body class="bg-[#0f1115] text-white min-h-screen font-sans selection:bg-primary/30 flex relative overflow-x-hidden">',
'<body class="bg-[#000000] text-white h-screen font-sans selection:bg-primary/30 flex p-4 gap-4 overflow-hidden relative">');

// Update background blobs
html = html.replace(/<div class="fixed inset-0 pointer-events-none z-0">[\s\S]*?<\/div>\s*<\/div>/,
`<div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#9D00FF]/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style="animation-delay: 2s;"></div>
    </div>`);

// 2. Sidebar Redesign (Make it a floating island)
html = html.replace(/<aside class="w-64 h-screen bg-bg\/80 backdrop-blur-2xl border-r border-white\/10 flex flex-col relative z-20 flex-shrink-0 transition-transform duration-300">/g,
`<aside class="w-72 h-full bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] flex flex-col relative z-20 flex-shrink-0 transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">`);

// 3. Main Content Redesign (Make it a floating island)
html = html.replace(/<main class="flex-1 h-screen overflow-y-auto relative z-10">/g,
`<main class="flex-1 h-full bg-white/[0.01] backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-y-auto relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] custom-scrollbar">`);

// 4. Update the inner containers of Main Content
html = html.replace(/<div class="p-8 md:p-12 pb-32">/g, '<div class="p-8 md:p-14 pb-32">');

// 5. Upgrade the Header
html = html.replace('<h2 class="text-4xl font-black bg-gradient-to-r from-white via-white to-silver bg-clip-text text-transparent tracking-tight mb-1">Broadcaster Dashboard</h2>',
'<h2 class="text-5xl font-black tracking-tighter mb-2"><span class="text-white">STREAMER</span> <span class="bg-gradient-to-r from-primary to-[#9D00FF] bg-clip-text text-transparent">DASHBOARD</span></h2>');

// 6. Upgrade Cards (Viewer Link & OBS Overlay)
html = html.replace(/class="bg-surface\/50 border border-white\/5/g, 'class="bg-white/[0.03] backdrop-blur-xl border border-white/5');
html = html.replace(/class="glass-panel p-6 rounded-3xl/g, 'class="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl');

// 7. Upgrade Queue Cards Container
html = html.replace(/<div id="queue-list" class="space-y-4">/g, '<div id="queue-list" class="space-y-6">');
html = html.replace(/<div id="history-list" class="space-y-4 opacity-70">/g, '<div id="history-list" class="space-y-6 opacity-70">');

// 8. Fix the logo in Sidebar
html = html.replace('<h1 class="text-2xl font-black tracking-tight text-glow"><span class="text-4xl text-primary">W</span>hutcha</h1>',
'<h1 class="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"><span class="text-5xl text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#9D00FF]">W</span>HUTCHA</h1>');

// 9. Navigation links in Sidebar
html = html.replace(/class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-silver hover:text-white hover:bg-white\/5 transition-all font-bold text-sm"/g,
'class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm group"');

// 10. Sidebar padding
html = html.replace(/<div class="p-6 flex items-center gap-4 border-b border-white\/10">/g, '<div class="p-8 flex items-center gap-4 border-b border-white/5">');
html = html.replace(/<nav class="flex-1 p-4 space-y-2">/g, '<nav class="flex-1 p-6 space-y-3">');
html = html.replace(/<div class="p-6 border-t border-white\/10">/g, '<div class="p-6 border-t border-white/5">');

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Successfully rewrote dashboard layout to floating island 2026 design.');
