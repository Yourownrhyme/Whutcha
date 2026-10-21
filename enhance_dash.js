const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Fix Logo
html = html.replace(/<span class="text-5xl text-transparent bg-clip-text bg-gradient-to-br from-primary to-\[#9D00FF\]">W<\/span>/g, 
'<span class="text-5xl text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">W</span>');

// 2. Main Header "STREAMER DASHBOARD"
// Current: <h2 class="text-5xl font-black tracking-tighter mb-2"><span class="text-white">STREAMER</span> <span class="bg-gradient-to-r from-primary to-[#9D00FF] bg-clip-text text-transparent">DASHBOARD</span></h2>
html = html.replace(/<h2 class="text-5xl font-black tracking-tighter mb-2">[\s\S]*?<\/h2>/, 
`<h2 class="text-5xl md:text-6xl font-black tracking-tighter mb-2 uppercase drop-shadow-2xl">
    <span class="bg-gradient-to-r from-[#00f0ff] via-[#9d00ff] to-white bg-clip-text text-transparent">Streamer</span> 
    <span class="text-white">Nexus</span>
</h2>`);

// Subtitle: Manage your interactive streams...
html = html.replace(/<p class="text-silver font-bold">Manage your interactive streams and payout settings\.<\/p>/,
'<p class="text-gray-300 font-bold tracking-widest text-sm uppercase">Manage your interactive streams and payout settings.</p>');

// 3. Section Titles (Payout Link, Viewer Link, OBS Overlay Link)
// They currently look like: <h3 class="text-lg font-black text-white mb-1">
// We make them neon uppercase
html = html.replace(/<h3 class="text-lg font-black text-white mb-1">/g, 
'<h3 class="text-xl font-black text-[#00f0ff] mb-1 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center gap-2">');

// Payout Link subtitle
html = html.replace(/<p class="text-xs text-silver font-medium leading-relaxed mb-4">/g,
'<p class="text-xs text-gray-400 font-semibold leading-relaxed mb-5 tracking-wide">');

// "Live Queue" Title
// Current: <h2 class="text-2xl font-black text-white">Live Queue</h2>
html = html.replace(/<h2 class="text-2xl font-black text-white">Live Queue<\/h2>/,
'<h2 class="text-3xl font-black bg-gradient-to-r from-red-500 to-[#9d00ff] bg-clip-text text-transparent uppercase tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">Live Queue</h2>');

// Queue is Empty text
// Current: <h3 class="text-xl font-black text-white mb-2">Queue is Empty</h3>
html = html.replace(/<h3 class="text-xl font-black text-white mb-2">Queue is Empty<\/h3>/,
'<h3 class="text-2xl font-black text-white mb-2 tracking-widest uppercase">Queue is <span class="text-[#00f0ff]">Empty</span></h3>');

// "You're all caught up!"
html = html.replace(/<p class="text-silver text-sm max-w-sm mx-auto">/g,
'<p class="text-gray-400 text-sm max-w-sm mx-auto font-medium tracking-wide">');

// Sidebar Links
// "Live Queue" in Sidebar
html = html.replace(/Live Queue\s*<\/a>/, 'Live Queue</span></a>');
html = html.replace(/<a href="#" class="flex items-center gap-3 px-4 py-3 bg-white\/10 text-white rounded-xl font-bold transition-all border border-white\/5 shadow-inner">/,
`<a href="#" class="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#00f0ff]/10 to-transparent text-white rounded-xl font-black transition-all border-l-4 border-[#00f0ff] shadow-[inset_0_0_20px_rgba(0,240,255,0.05)] tracking-widest uppercase text-xs">`);

// "Settings" in Sidebar
html = html.replace(/Settings\s*<\/button>/, 'Settings</span></button>');
html = html.replace(/<button onclick="openSettingsModal\(\)" class="w-full flex items-center gap-3 px-4 py-3 text-silver hover:text-white hover:bg-white\/5 rounded-xl font-bold transition-all text-left">/,
`<button onclick="openSettingsModal()" class="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-black transition-all text-left uppercase tracking-widest text-xs">`);

// "Sign Out" in Sidebar
html = html.replace(/Sign Out\s*<\/button>/, 'Sign Out</span></button>');
html = html.replace(/<button onclick="signOut\(\)" aria-label="Sign out" class="hidden md:flex w-full items-center gap-3 px-4 py-3 text-red-500\/70 hover:text-red-500 hover:bg-red-500\/10 rounded-xl font-bold transition-all text-left">/,
`<button onclick="signOut()" aria-label="Sign out" class="hidden md:flex w-full items-center gap-3 px-4 py-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-black transition-all text-left uppercase tracking-widest text-xs">`);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Enhanced dashboard.html typography and colors');
