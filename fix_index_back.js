const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// Replace absolute Go Back buttons with relative ones inside the padding wrapper
const absoluteBtn = /<button type="button" onclick="closeModal\(this\.closest\('\.fixed\.inset-0'\)\.id\)" class="absolute top-4 left-4 text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-50 bg-black\/40 px-3 py-1\.5 rounded-full backdrop-blur-md border border-white\/10 hover:bg-white\/10 cursor-pointer pointer-events-auto">← Go Back<\/button>/g;

html = html.replace(absoluteBtn, '');

// Now inject a relative version before the H3 titles inside the modals
html = html.replace(/<h3 class="text-2xl font-black/g, '<button type="button" onclick="closeModal(this.closest(\'.fixed.inset-0\').id)" class="text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 cursor-pointer pointer-events-auto mb-6 inline-flex">← Go Back</button>\n                <h3 class="text-2xl font-black');

// Fix body background in index.html to match dashboard (add gradient blooms)
if (!html.includes('mix-blend-screen')) {
    html = html.replace('<body class="bg-bg text-white min-h-screen font-sans selection:bg-primary/30 relative flex flex-col justify-between">',
    '<body class="bg-[#0f1115] text-white min-h-screen font-sans selection:bg-primary/30 relative flex flex-col justify-between overflow-x-hidden">\n    <!-- Premium Background Effects -->\n    <div class="fixed inset-0 pointer-events-none z-0">\n        <div class="absolute inset-0 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==\')] opacity-50"></div>\n        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen"></div>\n        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen"></div>\n    </div>');
}

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Fixed index.html Go Back and background.');
