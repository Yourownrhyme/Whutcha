const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// 1. Remove the dead button and iframe sidebar entirely
html = html.replace(/<button id="btn-open-sidebar"[\s\S]*?<\/button>/, '');
html = html.replace(/<!-- We append \?streamer=[\s\S]*?<\/iframe>\s*<\/div>\s*<\/div>/, '');

// 2. Make the Neo-brutalism design more responsive and less "gradient-y"
html = html.replace(/bg-gradient-to-r from-primary to-secondary drop-shadow-lg/g, 'text-primary shadow-[4px_4px_0_#FF0055]');
html = html.replace(/bg-gradient-to-r from-primary to-secondary rounded-2xl/g, 'bg-primary text-black border-4 border-black shadow-[8px_8px_0_#FF0055] rounded-none');
html = html.replace(/bg-gradient-to-b from-primary to-\[#5b0099\]/g, 'bg-primary border-4 border-black border-l-0 shadow-[8px_8px_0_#FF0055]');
html = html.replace(/text-white mb-3 animate-bounce/g, 'text-black mb-3 animate-bounce');
html = html.replace(/text-white tracking-widest/g, 'text-black tracking-widest');

fs.writeFileSync('whutcha-web/index.html', html);
