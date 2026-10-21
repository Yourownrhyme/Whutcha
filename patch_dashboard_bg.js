const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

html = html.replace(/background: '#0A0A0F',[\s\S]*?secondary: '#00E5FF'/, `background: '#0c001a',
                        surface: '#180033',
                        primary: '#b000ff',
                        secondary: '#00e5ff'`);
                        
html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>
        body {
            background-color: #0c001a;
            color: white;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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
            opacity: 0.4;
            animation: moveBlob 25s infinite alternate;
        }
        .blob-1 { top: -20%; left: -10%; width: 50vw; height: 50vw; background: #b000ff; }
        .blob-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: #00e5ff; animation-delay: -7s; }
        .blob-3 { top: 40%; left: 50%; width: 40vw; height: 40vw; background: #ff007f; animation-delay: -12s; }

        @keyframes moveBlob {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(10%, 15%) scale(1.2); }
        }

        .glass-panel {
            background: rgba(24, 0, 51, 0.4);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        
        .glass-nav {
            background: rgba(12, 0, 26, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>`);

html = html.replace(/<div class="bg-glow glow-1"><\/div>\s*<div class="bg-glow glow-2"><\/div>/, `<div class="aurora-bg">
        <div class="aurora-blob blob-1"></div>
        <div class="aurora-blob blob-2"></div>
        <div class="aurora-blob blob-3"></div>
    </div>`);

fs.writeFileSync('whutcha-web/dashboard.html', html);
