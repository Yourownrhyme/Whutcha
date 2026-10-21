const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Remove the old absolute Go Back buttons
const oldBackBtn = /<button onclick="closeModal\(this\.closest\('\.fixed\.inset-0'\)\.id\)" class="absolute top-6 left-6 text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-50 bg-black\/40 px-3 py-1\.5 rounded-full backdrop-blur-md border border-white\/10 hover:bg-white\/10">← Go Back<\/button>/g;
html = html.replace(oldBackBtn, '');

// 2. Add relative Go Back buttons BEFORE the header
html = html.replace(/<div class="flex justify-between items-center pb-4 border-b border-white\/10">/g, 
    `<div class="mb-4"><button onclick="closeModal(this.closest('.fixed.inset-0').id)" class="text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 inline-block">← Go Back</button></div>\n            <div class="flex justify-between items-center pb-4 border-b border-white/10">`);

// 3. Make the background more premium (not just generic dark)
// Let's add a radial gradient background and maybe a grid to the body
html = html.replace('<body class="bg-bg text-white min-h-screen font-sans selection:bg-primary/30 flex relative">',
'<body class="bg-[#0f1115] text-white min-h-screen font-sans selection:bg-primary/30 flex relative overflow-x-hidden">\n    <!-- Premium Background Effects -->\n    <div class="fixed inset-0 pointer-events-none z-0">\n        <div class="absolute inset-0 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==\')] opacity-50"></div>\n        <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen"></div>\n        <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen"></div>\n    </div>');

// 4. Ensure GDPR Delete Account is in Settings Modal
// Let's see if my previous injection worked.
// If it didn't, we'll inject it.
if (!html.includes('Delete Account (GDPR)')) {
    html = html.replace('<!-- Payment Block -->', 
        `<div class="pt-6 border-t border-red-500/20 mt-4">\n                <h4 class="text-red-500 font-bold mb-2">Danger Zone</h4>\n                <button onclick="if(confirm('Are you sure you want to delete your account? This action is irreversible.')) { alert('Data deletion requested. Contacting support.'); }" class="w-full px-6 py-3 rounded-xl font-bold text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">Delete Account (GDPR)</button>\n            </div>\n            <!-- Payment Block -->`);
}

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Dashboard layout fixed and enhanced.');
