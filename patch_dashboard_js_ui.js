const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

js = js.split('<div class="p-4 bg-surface border border-white/10 rounded-xl relative">').join(`<div class="p-6 glass-panel rounded-2xl relative group overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(157,0,255,0.15)]">
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>`);

js = js.split('<span class="text-xs text-gray-500">').join(`<span class="text-xs text-gray-400 font-medium">`);
js = js.split('<h3 class="font-bold">').join(`<h3 class="font-black text-lg tracking-tight">`);
js = js.split('<span class="font-black text-green-400">').join(`<span class="font-black text-secondary text-lg">`);
js = js.split('<p class="text-sm text-gray-300 mt-2">').join(`<p class="text-sm text-gray-300 mt-3 leading-relaxed">`);

js = js.split('class="flex-1 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm font-bold transition-colors"').join(`class="flex-1 py-3 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 rounded-xl text-sm font-black transition-all hover:shadow-[0_0_15px_rgba(157,0,255,0.4)]"`);
js = js.split('class="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-colors"').join(`class="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"`);

fs.writeFileSync('whutcha-web/dashboard.js', js);
