const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const bodyRegex = /<body class="bg-background text-white h-screen overflow-hidden flex items-center justify-center">[\s\S]*?<script type="module" src="\.\/app\.js\?v=12"><\/script>\s*<\/body>/;

const newBody = `<body class="bg-background text-white h-screen overflow-hidden flex flex-col">
    <!-- Navbar -->
    <nav class="p-6 flex justify-between items-center border-b-4 border-surface">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary text-black flex items-center justify-center brutal-card" style="border-radius: 8px; border: 3px solid black; box-shadow: 3px 3px 0 #fff;">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tighter">Whutcha</h1>
        </div>
        <button id="btn-install" class="hidden brutal-btn-primary px-4 py-2 text-sm">Get App</button>
    </nav>

    <div class="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 overflow-y-auto">
        
        <!-- Left: Hero -->
        <div class="flex-1 text-left max-w-xl">
            <div class="inline-block px-4 py-2 bg-secondary text-white font-black uppercase text-xs rounded-full border-2 border-white mb-6 transform -rotate-2">
                New Era of Streams
            </div>
            <h2 class="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
                Monetize <br>
                <span class="text-primary" style="text-shadow: 4px 4px 0 #FF0055;">Your Vibe.</span>
            </h2>
            <p class="text-xl text-gray-400 font-bold mb-8">
                Video donations and co-streams directly to your OBS. No corporate BS. Pure interaction.
            </p>
        </div>

        <!-- Right: Auth Panel -->
        <div id="auth-screen" class="w-full max-w-md brutal-card p-8 flex flex-col gap-4">
            <h3 class="text-2xl font-black uppercase text-center border-b-4 border-surface pb-4 mb-4">Streamer Login</h3>
            
            <button onclick="signInOAuth('apple')" class="w-full py-4 brutal-btn-secondary flex items-center justify-center">
                <svg class="w-6 h-6 mr-3" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                Continue with Apple
            </button>

            <button onclick="signInOAuth('google')" class="w-full py-4 brutal-btn-secondary flex items-center justify-center text-white">
                <svg class="w-6 h-6 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
            </button>
            
            <button onclick="signInOAuth('twitch')" class="w-full py-4 brutal-btn-secondary !border-[#9146FF] !text-[#9146FF] hover:!bg-[#9146FF]/10 flex items-center justify-center">
                <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                Continue with Twitch
            </button>
            
            <p class="text-xs text-gray-500 font-bold text-center mt-2">By logging in, you agree to our brutal terms of service.</p>
        </div>
    </div>
    
    <script type="module" src="./app.js?v=13"></script>
</body>`;

html = html.replace(bodyRegex, newBody);
fs.writeFileSync('whutcha-web/index.html', html);
