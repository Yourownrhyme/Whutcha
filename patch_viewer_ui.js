const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Update Tailwind Config and Font
html = html.replace(/tailwind\.config[\s\S]*?\}\n        \}/, 
`tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        background: '#1a1d24',
                        surface: '#252a34',
                        primary: '#00F0FF',
                        secondary: '#9D00FF',
                        silver: '#b0b5c0'
                    }
                }
            }
        }`);

// Replace Google Fonts
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=(Outfit|Space\+Grotesk)[\s\S]*?>/g, 
`<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">`);

// 2. Update Global CSS
html = html.replace(/body \{[\s\S]*?overflow-x: hidden;\n    \}/, 
`body {
        background: radial-gradient(circle at top right, #343b49 0%, #1a1d24 60%, #111318 100%);
        color: #ffffff;
        font-family: 'Inter', system-ui, sans-serif;
        min-height: 100vh;
        overflow-x: hidden;
    }
    
    .glass-card {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }`);

// Strip out brutalist CSS
html = html.replace(/\.brutal-card[\s\S]*?\}\n/g, '');
html = html.replace(/\.brutal-input[\s\S]*?\}\n/g, '');
html = html.replace(/\.brutal-btn-primary[\s\S]*?\}\n/g, '');
html = html.replace(/\.brutal-btn-secondary[\s\S]*?\}\n/g, '');

// 3. Replace brutalist classes with Liquid Silver classes in HTML body
html = html.replace(/brutal-card/g, 'glass-card rounded-3xl');
html = html.replace(/brutal-input/g, 'bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-gray-500 font-bold');
html = html.replace(/brutal-btn-primary/g, 'bg-gradient-to-r from-primary to-blue-500 text-black font-black uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:opacity-90 transition-opacity border-none');
html = html.replace(/brutal-btn-secondary/g, 'bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors border border-white/10');

// Fix headers to look premium
html = html.replace(/text-primary drop-shadow-\[4px_4px_0_rgba\(0,0,0,1\)\]/g, 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-white drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]');
html = html.replace(/shadow-\[.*?\]/g, ''); // Clear old hard shadows

fs.writeFileSync('whutcha-web/viewer.html', html);
