const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldBtn = `<button id="submit-btn" class="w-full mt-8 py-4 bg-white text-black font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group">
            <div id="upload-progress-bar" class="absolute inset-0 bg-primary/20 w-0 transition-all duration-300"></div>
            <span id="submit-btn-text" class="relative z-10">SEND FOR $5.00</span>
        </button>`;
        
const newBtn = `<button id="submit-btn" class="w-full mt-8 py-4 bg-white hover:bg-gray-200 text-black font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group">
            <!-- DOPAMINE MODE: Animated shimmer -->
            <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div id="upload-progress-bar" class="absolute inset-0 bg-primary w-0 transition-all duration-300 z-0 opacity-20"></div>
            <span id="submit-btn-text" class="relative z-10">SEND FOR $5.00</span>
        </button>`;

if (html.includes('SEND FOR $5.00') && !html.includes('animate-[shimmer_1.5s_infinite]')) {
    html = html.replace(oldBtn, newBtn);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log('viewer.html button patched.');
} else {
    console.log('Not patched. Button code mismatch.');
}
