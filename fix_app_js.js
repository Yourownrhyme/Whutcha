const fs = require('fs');

let appJs = fs.readFileSync('whutcha-web/app.js', 'utf8');

// Wrap the PWA logic in an if (installBtn) check
appJs = appJs.replace(/installBtn\.addEventListener/g, 'if (installBtn) installBtn.addEventListener');
appJs = appJs.replace(/installBtn\.classList/g, 'if (installBtn) installBtn.classList');

fs.writeFileSync('whutcha-web/app.js', appJs);
console.log("app.js patched to fix TypeError on installBtn");
