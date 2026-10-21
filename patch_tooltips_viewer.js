const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Amount label tooltip
const oldAmountLabel = `<label class="block text-silver text-xs font-black uppercase tracking-widest mb-2">Amount (USD)</label>`;
const newAmountLabel = `<div class="relative group/tooltip inline-block mb-2">
    <label class="block text-silver text-xs font-black uppercase tracking-widest cursor-default">Amount (USD)</label>
    <div class="absolute left-0 bottom-full mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-primary/30 text-white text-[10px] rounded shadow-xl z-50 normal-case tracking-normal font-normal backdrop-blur-md">
        The higher the amount, the more likely the streamer will react to it!
    </div>
</div>`;
html = html.replace(oldAmountLabel, newAmountLabel);

// Video Area Tooltip
const oldVideoArea = `<div id="video-container" class="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300">`;
const newVideoArea = `<div id="video-container" class="relative group/cam w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300">
    <div class="absolute left-1/2 -translate-x-1/2 top-4 opacity-0 group-hover/cam:opacity-100 transition-opacity duration-300 pointer-events-none w-56 p-2 bg-black/80 border border-white/10 text-white text-xs font-bold text-center rounded-lg shadow-2xl z-50 backdrop-blur-md">
        Look directly at the camera! Your video will play live on stream.
    </div>`;
html = html.replace(oldVideoArea, newVideoArea);

// Pay Button Tooltip
const oldPayBtn = `class="w-full py-4 bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"`;
const newPayBtn = `class="w-full relative group/tooltip py-4 bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"`;
if (html.includes(oldPayBtn)) {
    html = html.replace(oldPayBtn, newPayBtn);
    html = html.replace('Pay & Send <span id="btn-amount">$5.00</span>\n                </button>', 'Pay & Send <span id="btn-amount">$5.00</span>\n                    <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-green-500/50 text-white text-[10px] rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.2)] z-50 text-center normal-case tracking-normal font-bold">Secure payment via Stripe. 100% goes to the creator!</div>\n                </button>');
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('viewer.html tooltips injected.');
