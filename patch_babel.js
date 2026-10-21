const fs = require('fs');

// 1. Patch viewer.html
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
if (!viewer.includes('maxlength="25"')) {
    viewer = viewer.replace('id="nickname" placeholder="Anonymous"', 'id="nickname" placeholder="Anonymous" maxlength="25" dir="auto"');
    fs.writeFileSync('whutcha-web/viewer.html', viewer);
    console.log('viewer.html patched for Babel Mode.');
}

// 2. Patch overlay.html
let overlay = fs.readFileSync('whutcha-web/overlay.html', 'utf8');
if (!overlay.includes('dir="auto"')) {
    overlay = overlay.replace('id="donor-name" class="truncate', 'id="donor-name" dir="auto" class="truncate leading-tight');
    fs.writeFileSync('whutcha-web/overlay.html', overlay);
    console.log('overlay.html patched for Babel Mode.');
}

// 3. Patch dashboard.js
let dashjs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
if (!dashjs.includes('dir="auto"')) {
    // Replace <h4 class="..."> with <h4 class="..." dir="auto">
    // Since there are two places (because of previous duped blocks), we regex replace all instances of:
    // <h4 class="text-xl font-bold text-white mb-1 truncate max-w-[200px] sm:max-w-[150px] flex items-center gap-2">
    dashjs = dashjs.replace(/<h4 class="text-xl font-bold text-white mb-1 truncate max-w-\[200px\] sm:max-w-\[150px\] flex items-center gap-2">/g, 
                            '<h4 class="text-xl font-bold text-white mb-1 truncate max-w-[200px] sm:max-w-[150px] flex items-center gap-2 leading-tight" dir="auto">');
    fs.writeFileSync('whutcha-web/dashboard.js', dashjs);
    console.log('dashboard.js patched for Babel Mode.');
}
