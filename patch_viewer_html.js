const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const bodyRegex = /<body class="bg-background text-white h-screen w-screen overflow-hidden">[\s\S]*?<script src="\.\/viewer\.js\?v=12"><\/script>\s*<\/body>/;

const newBody = `<body class="bg-background text-white h-screen w-screen overflow-hidden flex items-center justify-center">

    <div class="viewer-container brutal-card w-full h-full max-w-lg mx-auto flex flex-col relative bg-surface border-x-4 border-y-0 sm:border-y-4 border-surface sm:my-4 sm:h-[calc(100vh-2rem)] overflow-hidden shadow-[8px_8px_0_#D8FF00]">
        
        <!-- Streamer Header -->
        <div class="p-6 text-center border-b-4 border-background flex flex-col items-center shrink-0 bg-[#09090b]">
            <div class="w-24 h-24 bg-primary text-black rounded-xl mx-auto mb-4 flex items-center justify-center border-4 border-black shadow-[4px_4px_0_#FF0055] transform -rotate-3 hover:rotate-0 transition-transform">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tighter">Live Streamer</h1>
            <div class="inline-block px-4 py-1 mt-2 bg-secondary text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_#fff]">
                Accepting Donations
            </div>
        </div>

        <!-- Donation Frame Container -->
        <div class="flex-1 w-full relative bg-background">
            <div id="iframe-loader" class="absolute inset-0 flex items-center justify-center z-0">
                <div class="w-12 h-12 border-8 border-primary border-t-secondary rounded-full animate-spin"></div>
            </div>
            <iframe id="donate-iframe" allow="camera; microphone; display-capture; autoplay; fullscreen" class="w-full h-full border-none relative z-10 opacity-0 transition-opacity duration-500" onload="this.style.opacity=1; document.getElementById('iframe-loader').style.display='none';"></iframe>
        </div>
        
        <div class="p-4 text-center border-t-4 border-background shrink-0 bg-[#09090b]">
            <p class="text-xs text-gray-500 font-black uppercase tracking-widest">Powered by <span class="text-primary">Whutcha</span></p>
        </div>
    </div>

    <script src="./viewer.js?v=13"></script>
</body>`;

html = html.replace(bodyRegex, newBody);
fs.writeFileSync('whutcha-web/viewer.html', html);
