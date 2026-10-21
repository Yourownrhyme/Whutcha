const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

// Container fixes
html = html.replace('<div class="brand-container">', '<div class="text-center mb-6">');
html = html.replace('<h1 class="brand-title">WHUTCHA</h1>', '<h1 class="text-4xl font-black text-primary tracking-tighter uppercase drop-shadow-[4px_4px_0_#FF0055] -rotate-2">WHUTCHA</h1>');
html = html.replace('<p class="brand-subtitle">Drop a vibe</p>', '<p class="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Drop a vibe</p>');

// Card box
html = html.replace('<div id="main-form-ui" class="card-box">', '<div id="main-form-ui" class="flex flex-col gap-4 w-full px-2 sm:px-6">');

// Tabs
html = html.replace('<div class="tabs-container">', '<div class="flex bg-surface p-1 rounded-xl border-2 border-surface shadow-[4px_4px_0_#000] mb-2">');
html = html.replace('id="tab-video" class="tab-btn active-tab"', 'id="tab-video" class="flex-1 py-3 text-sm font-black uppercase text-black bg-primary rounded-lg transition-all"');
html = html.replace('id="tab-costream" class="tab-btn inactive-tab"', 'id="tab-costream" class="flex-1 py-3 text-sm font-black uppercase text-gray-500 hover:text-white rounded-lg transition-all"');

// Form groups
html = html.replace(/<div class="form-group">/g, '<div class="flex flex-col gap-2 mb-4">');
html = html.replace(/<label class="form-label">/g, '<label class="text-xs font-black text-gray-400 uppercase tracking-wider">');
html = html.replace(/class="form-input"/g, 'class="brutal-input p-4 w-full"');

// Media Box
html = html.replace('<div id="video-section" class="media-box">', '<div id="video-section" class="relative w-full aspect-[9/16] bg-black rounded-xl border-4 border-surface overflow-hidden shadow-[6px_6px_0_#000] mx-auto max-w-[280px]">');

// Waiting UI
html = html.replace('<div id="waiting-ui" class="hidden card-box" style="text-align: center;">', '<div id="waiting-ui" class="hidden flex-col items-center justify-center p-6 text-center h-full">');

// Co-Stream UI
html = html.replace('<div id="costream-ui" class="hidden card-box">', '<div id="costream-ui" class="hidden flex-col h-full relative">');

// Fix body layout
html = html.replace('<body>', '<body class="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden p-4 pb-24">');

fs.writeFileSync('whutcha-web/donate-v2.html', html);
