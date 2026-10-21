const fs = require('fs');
let appJs = fs.readFileSync('whutcha-web/app.js', 'utf8');

appJs = appJs.replace(
    /if\(authError\) {\s*authError\.textContent = "Please accept the Terms of Use and Privacy Policy to continue\.";\s*authError\.classList\.remove\('hidden'\);\s*}/g,
    'if(typeof showAuthMessage === "function") { showAuthMessage("Please accept the Terms of Use and Privacy Policy to continue.", true); } else if(authError) { authError.textContent = "Please accept the Terms of Use and Privacy Policy to continue."; authError.className = "mb-4 p-3 border rounded-xl text-sm font-bold text-center bg-red-500/20 border-red-500/50 text-red-200"; }'
);

fs.writeFileSync('whutcha-web/app.js', appJs);
console.log('Patched validateTerms');
