const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Force the body to the sleek black padding
const bodyRegex = /<body[^>]*>/;
html = html.replace(bodyRegex, '<body class="bg-[#000000] text-white h-screen font-sans selection:bg-primary/30 flex p-4 gap-4 overflow-hidden relative">');

// 2. Change the Aside wrapper completely.
// Currently it's <aside class="..."> and ends at </aside>
html = html.replace(/<aside class="w-full md:w-72 h-auto md:h-screen glass-card flex md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 z-20 relative border-b md:border-r border-white\/10 shrink-0 sticky top-0 md:static backdrop-blur-3xl">/,
`<aside class="w-72 h-full bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] flex flex-col relative z-20 flex-shrink-0 transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden p-6">`);

// 3. Change Main Content wrapper
html = html.replace(/<main class="flex-1 h-screen overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar pb-32">/,
`<main class="flex-1 h-full bg-white/[0.01] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 overflow-y-auto relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] custom-scrollbar">`);

// 4. Overhaul the Cards inside the main content
html = html.replace(/class="glass-panel p-6 rounded-3xl/g, 'class="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl');

// 5. Update the Background blobs to animate and look premium
const globalBgRegex = /<!-- Global Background Elements -->[\s\S]*?<!-- SIDEBAR -->/;
const newGlobalBg = `<!-- Premium Background Elements -->
    <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30"></div>
        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#9D00FF]/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style="animation-delay: 2s;"></div>
    </div>
    
    <!-- SIDEBAR -->`;
html = html.replace(globalBgRegex, newGlobalBg);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Force-patched dashboard.html');
