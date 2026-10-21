const fs = require('fs');

// 1. Patch tailwind config in HTML files to include custom dopamine keyframes
const files = ['whutcha-web/index.html', 'whutcha-web/dashboard.html', 'whutcha-web/viewer.html'];

const originalTailwind = `colors: { background: '#0B0D12', surface: '#151822', primary: '#00F0FF', silver: '#8B949E', secondary: '#9D00FF' }
                }`;

const newTailwind = `colors: { background: '#0B0D12', surface: '#151822', primary: '#00F0FF', silver: '#8B949E', secondary: '#9D00FF' },
                    keyframes: {
                        shimmer: {
                            '100%': { transform: 'translateX(100%)' }
                        },
                        slideIn: {
                            '0%': { transform: 'translateY(-20px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' }
                        }
                    }
                }`;

files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('keyframes: {') && html.includes(originalTailwind)) {
        html = html.replace(originalTailwind, newTailwind);
        fs.writeFileSync(file, html);
        console.log(`${file} patched with Dopamine keyframes.`);
    }
});

// 2. Enhance viewer.html Submit Button
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
const oldBtn = `<button id="submit-btn" class="w-full py-4 mt-6 bg-primary hover:bg-[#00d0dd] text-black font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                <span id="submit-btn-text">PAY & SEND</span>
            </button>`;
const dopamineBtn = `<button id="submit-btn" class="w-full py-4 mt-6 bg-primary hover:bg-[#00d0dd] text-black font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:-translate-y-1 relative overflow-hidden group">
                <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span id="submit-btn-text" class="relative z-10">PAY & SEND</span>
            </button>`;
if (viewer.includes(oldBtn)) {
    viewer = viewer.replace(oldBtn, dopamineBtn);
    fs.writeFileSync('whutcha-web/viewer.html', viewer);
    console.log('viewer.html patched with Dopamine Button.');
}

// 3. Enhance dashboard.js with entrance animations and Whale Glow
let dashjs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
const oldCardInit = `const card = document.createElement('div');
    card.id = 'donation-' + d.id;
    card.className = 'glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 relative overflow-hidden group border border-white/10 transition-all duration-500';`;

const newCardInit = `const isPremium = parseFloat(d.amount) >= 50;
    const premiumGlow = isPremium ? 'border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.15)] bg-yellow-900/10' : 'border-white/10';
    
    const card = document.createElement('div');
    card.id = 'donation-' + d.id;
    // DOPAMINE MODE: Entrance animation and premium glow
    card.className = \`glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 relative overflow-hidden group transition-all duration-500 animate-[slideIn_0.4s_ease-out_forwards] \${premiumGlow}\`;`;

if (dashjs.includes(oldCardInit)) {
    dashjs = dashjs.replace(oldCardInit, newCardInit);
    fs.writeFileSync('whutcha-web/dashboard.js', dashjs);
    console.log('dashboard.js patched for Dopamine Mode.');
}
