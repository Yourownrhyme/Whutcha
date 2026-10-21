const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// Update tailwind config colors
html = html.replace(/background: '#0A0A0F',[\s\S]*?secondary: '#00E5FF'/, `background: '#0c001a',
                        surface: '#180033',
                        primary: '#b000ff',
                        secondary: '#00e5ff'`);
                        
// Update background css
const oldStyles = `<style>
        body {
            background-color: #0A0A0F;
            color: white;
            overflow: hidden;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Modern UI Background Glow */
        .bg-glow {
            position: fixed;
            width: 60vw;
            height: 60vw;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
            animation: float 20s infinite alternate;
        }
        .glow-primary { background: #9D00FF; top: -10%; left: -10%; }
        .glow-secondary { background: #00E5FF; bottom: -20%; right: -10%; animation-delay: -5s; }

        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(5%, 5%) scale(1.1); }
            100% { transform: translate(-5%, 10%) scale(0.9); }
        }

        .glass-panel {
            background: rgba(21, 21, 26, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .sidebar-open { transform: translateX(0); box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        .sidebar-closed { transform: translateX(100%); }
    </style>`;

const newStyles = `<style>
        body {
            background-color: #0c001a;
            color: white;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            overflow: hidden;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Aurora Background */
        .aurora-bg {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 0;
            overflow: hidden;
            background: #0c001a;
        }
        .aurora-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.5;
            animation: moveBlob 20s infinite alternate;
        }
        .blob-1 { top: -20%; left: -10%; width: 60vw; height: 60vw; background: #b000ff; }
        .blob-2 { bottom: -20%; right: -10%; width: 70vw; height: 70vw; background: #00e5ff; animation-delay: -5s; }
        .blob-3 { top: 40%; left: 40%; width: 50vw; height: 50vw; background: #ff007f; animation-delay: -10s; }
        
        @keyframes moveBlob {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(10%, 15%) scale(1.2); }
        }

        .glass-panel {
            background: rgba(24, 0, 51, 0.4);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
        }
    </style>`;

html = html.replace(oldStyles, newStyles);

// Replace background divs
html = html.replace(/<div class="bg-glow glow-primary"><\/div><div class="bg-glow glow-secondary"><\/div>/, `<div class="aurora-bg">
        <div class="aurora-blob blob-1"></div>
        <div class="aurora-blob blob-2"></div>
        <div class="aurora-blob blob-3"></div>
    </div>`);

// Update OAuth buttons
html = html.replace(/<button onclick="signInOAuth\('google'\)" class="w-full py-4 bg-white\/5 hover:bg-white\/10 text-white font-semibold rounded-2xl border border-white\/10 flex items-center justify-center transition-colors">/g, `<button onclick="signInOAuth('google')" class="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 flex items-center justify-center transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">`);

// Update Apple button style (the first button in the list)
html = html.replace(/<button onclick="signInOAuth\('apple'\)" class="w-full py-4 bg-white hover:bg-gray-200 text-black font-semibold rounded-2xl border border-white\/10 flex items-center justify-center transition-colors">/, `<button onclick="signInOAuth('apple')" class="w-full py-4 bg-white hover:bg-gray-200 text-black font-semibold rounded-2xl flex items-center justify-center transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">`);

// Remove Sidebar completely
html = html.replace(/<!-- 4\. SIDEBAR -->[\s\S]*?<\/div>\s*<\/div>/, '');

// Clean up viewer profile logic from index.html (since we moved it to viewer.html)
html = html.replace(/<div id="viewer-profile"[\s\S]*?<\/div>/, '');

fs.writeFileSync('whutcha-web/index.html', html);
