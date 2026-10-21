const fs = require('fs');
let idx = fs.readFileSync('whutcha-web/index.html', 'utf8');

const newBtns = `
        <button id="btn-onboarding-next" class="px-10 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform mb-4">GET STARTED</button>
        <button id="btn-install" class="hidden px-10 py-3 bg-primary/10 border border-primary/30 text-primary font-black rounded-full hover:bg-primary/20 transition-colors">📱 INSTALL APP</button>
`;

idx = idx.replace(/<button id="btn-onboarding-next"[\s\S]*?<\/button>/, newBtns);
fs.writeFileSync('whutcha-web/index.html', idx);
console.log("index.html patched with Install App button");
