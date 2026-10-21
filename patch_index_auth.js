const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const oldAuthBlock = `<div class="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">
        <div class="text-center mb-8">
            <h1 class="text-6xl font-black tracking-tighter mb-2">W</h1>
            <p class="text-gray-300 font-medium text-sm mt-2 max-w-xs mx-auto mb-6">
                The ultimate platform for video donations and live co-streams. Connect with your audience instantly.
            </p>
            <h2 class="text-2xl font-bold text-gray-300">Sign In</h2>
        </div>
        
        <div class="w-full max-w-sm space-y-3 h-[60vh] overflow-y-auto pb-8 no-scrollbar px-2">`;

const newAuthBlock = `<div class="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 relative z-10">
        <div class="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-[28rem] flex flex-col items-center">
            <div class="text-center mb-8 w-full">
                <div class="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(157,0,255,0.4)]">
                    <h1 class="text-5xl font-black tracking-tighter text-white">W</h1>
                </div>
                <h2 class="text-3xl font-black text-white mb-2">Whutcha</h2>
                <p class="text-gray-400 font-medium text-sm mt-2 mb-6">
                    The ultimate platform for video donations and live co-streams.
                </p>
                <div class="w-full h-px bg-white/10 mb-6"></div>
                <h3 id="sign-in-heading" class="text-xl font-bold text-gray-200">Sign In</h3>
            </div>
            
            <div id="login-block" class="w-full space-y-3 h-[40vh] overflow-y-auto pb-4 no-scrollbar px-1">`;

html = html.replace(oldAuthBlock, newAuthBlock);

// Replace the end part correctly
const oldEndBlock = `                <svg class="w-5 h-5 mr-3" viewBox="0 0 512 512" fill="currentColor"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
                X (Twitter)
            </button>
        </div>
    </div>`;

const newEndBlock = `                <svg class="w-5 h-5 mr-3" viewBox="0 0 512 512" fill="currentColor"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
                Continue with X
            </button>
            </div>
            
            <div class="mt-8 text-center text-xs text-gray-500 flex flex-wrap justify-center gap-4">
                <button onclick="document.getElementById('legal-modal-terms').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">Terms of Use</button>
                <button onclick="document.getElementById('legal-modal-privacy').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">Privacy Policy</button>
                <button onclick="document.getElementById('legal-modal-gdpr').classList.remove('hidden')" class="hover:text-white transition-colors hover:underline">GDPR</button>
            </div>
        </div>
    </div>`;

html = html.replace(oldEndBlock, newEndBlock);

fs.writeFileSync('whutcha-web/index.html', html);
