const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// The current logo block in dashboard:
const logoRegex = /<h1 class="text-2xl font-black tracking-tight text-glow"><span class="text-4xl text-primary">W<\/span>hutcha<\/h1>/;
html = html.replace(logoRegex, '<h1 class="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"><span class="text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#9D00FF]">W</span>HUTCHA</h1>');

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Fixed dashboard logo');
