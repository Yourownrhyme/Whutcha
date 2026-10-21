const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Update head styling
html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>
        body {
            background-color: #0A0A0F;
            color: white;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .bg-glow {
            position: fixed;
            width: 50vw;
            height: 50vw;
            border-radius: 50%;
            filter: blur(140px);
            opacity: 0.1;
            z-index: 0;
            pointer-events: none;
            animation: float 25s infinite alternate;
        }
        .glow-1 { background: #9D00FF; top: -20%; left: -10%; }
        .glow-2 { background: #00E5FF; bottom: -20%; right: -10%; animation-delay: -7s; }

        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(5%, 5%) scale(1.1); }
            100% { transform: translate(-5%, 10%) scale(0.9); }
        }

        .glass-panel {
            background: rgba(21, 21, 26, 0.7);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        
        .glass-nav {
            background: rgba(10, 10, 15, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>`);

// Update body tags and background
html = html.replace(/<body class=".*?">/, `<body class="bg-background text-white min-h-screen font-sans relative">
    <div class="bg-glow glow-1"></div>
    <div class="bg-glow glow-2"></div>
    <div class="relative z-10">`);

html = html.replace(/<\/body>/, `</div>\n</body>`);

// Update Navbar
html = html.replace(/<nav class=".*?">/, `<nav class="glass-nav px-6 py-4 flex justify-between items-center sticky top-0 z-50">`);
html = html.replace(/Whutcha Dashboard/, `<div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg"><span class="font-black text-xl">W</span></div><span class="tracking-tight hidden sm:block">Dashboard</span></div>`);

// Update Viewer Link Block
html = html.replace(/<div class="mb-8 p-4 bg-white\/5 border border-white\/10 rounded-xl flex items-center justify-between">/, `<div class="mb-10 p-6 glass-panel rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">`);
html = html.replace(/<code id="viewer-link" class=".*?">/, `<code id="viewer-link" class="text-secondary font-mono text-sm bg-black/40 border border-white/10 px-4 py-3 rounded-xl block w-full max-w-lg truncate shadow-inner">`);
html = html.replace(/<button onclick="copyViewerLink\(\)" class=".*?">/, `<button onclick="copyViewerLink()" class="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white shadow-md active:scale-95 flex-shrink-0">`);

// Update Queue Header
html = html.replace(/<h2 class="text-2xl font-bold">Incoming Queue<\/h2>/, `<h2 class="text-3xl font-black tracking-tight flex items-center gap-3"><span class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span> Live Queue</h2>`);

// Update PWA Banner
html = html.replace(/<!-- Install PWA Banner -->[\s\S]*?<\/div>/, `<!-- Install PWA Banner -->
    <div id="pwa-install-banner" class="fixed left-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-primary to-[#5b0099] backdrop-blur-md px-2 py-8 rounded-r-2xl z-50 cursor-pointer hover:scale-105 hover:pr-4 transition-all flex flex-col items-center shadow-[0_0_30px_rgba(157,0,255,0.6)] border border-white/20 border-l-0">
        <svg class="w-6 h-6 text-white mb-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        <span class="text-sm font-black text-white tracking-widest" style="writing-mode: vertical-rl; transform: rotate(180deg);">INSTALL APP</span>
    </div>`);

fs.writeFileSync('whutcha-web/dashboard.html', html);
