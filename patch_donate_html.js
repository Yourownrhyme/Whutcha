const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

// Replace soft gradients and rounded-3xl with brutalist classes
html = html.replace(/bg-gradient-to-r from-primary to-secondary/g, 'bg-primary border-4 border-black shadow-[4px_4px_0_#fff]');
html = html.replace(/bg-gradient-to-br from-primary to-secondary/g, 'bg-primary border-4 border-black shadow-[4px_4px_0_#fff]');
html = html.replace(/rounded-3xl/g, 'rounded-xl');
html = html.replace(/rounded-2xl/g, 'rounded-xl');
html = html.replace(/border border-white\/10/g, 'border-4 border-surface');
html = html.replace(/border border-white\/20/g, 'border-4 border-surface');

// Amount buttons
html = html.replace(/bg-white\/5 border border-white\/10 hover:bg-white\/10 hover:border-primary/g, 'bg-surface border-4 border-surface hover:border-primary hover:bg-black font-black');
html = html.replace(/bg-primary\/20 border-primary text-primary/g, 'bg-primary border-primary text-black font-black shadow-[2px_2px_0_#fff]');

// Inputs
html = html.replace(/bg-black\/50 border border-white\/10/g, 'bg-background border-4 border-surface text-primary focus:border-primary font-bold');

// Payment buttons
html = html.replace(/w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-secondary text-white hover:scale-\[1\.02\] active:scale-95 shadow-lg/g, 'brutal-btn-primary w-full py-4 text-lg');

// Form titles
html = html.replace(/text-xl font-bold/g, 'text-2xl font-black uppercase tracking-tighter');

fs.writeFileSync('whutcha-web/donate-v2.html', html);
