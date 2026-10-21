const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldHeader = `<h2 class="text-5xl md:text-6xl font-black tracking-tighter mb-2 uppercase drop-shadow-2xl">
    <span class="bg-gradient-to-r from-[#00f0ff] via-[#9d00ff] to-white bg-clip-text text-transparent">Streamer</span> 
    <span class="text-white">Nexus</span>
</h2>`;

const newHeader = `<h2 class="text-5xl md:text-6xl font-black tracking-tighter mb-2 uppercase drop-shadow-2xl">
    <span class="bg-gradient-to-r from-[#00f0ff] via-[#9d00ff] to-white bg-clip-text text-transparent">WHUTCHA,</span> 
    <span class="text-white">DAWG?</span>
</h2>`;

html = html.replace(oldHeader, newHeader);
fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Replaced Streamer Nexus with WHUTCHA DAWG');
