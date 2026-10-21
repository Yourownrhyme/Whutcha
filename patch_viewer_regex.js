const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Amount Label
const amountRegex = /<label class="block text-xs font-bold text-silver uppercase tracking-widest mb-2 flex justify-between">([\s\S]*?)<\/label>/;
const amountMatch = html.match(amountRegex);
if (amountMatch) {
    const newAmount = `<div class="relative group/tooltip mb-2">
        <label class="block text-xs font-bold text-silver uppercase tracking-widest flex justify-between cursor-default">` + amountMatch[1] + `</label>
        <div class="absolute left-0 bottom-full mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-primary/30 text-white text-[10px] rounded shadow-xl z-50 normal-case tracking-normal font-normal backdrop-blur-md">
            Higher amounts are more likely to get the streamer's attention!
        </div>
    </div>`;
    html = html.replace(amountMatch[0], newAmount);
}

// 2. Video Area
const videoRegex = /<div id="video-section" class="space-y-4">\s*<div class="relative bg-black rounded-3xl overflow-hidden aspect-\[9\/16\] border border-white\/10 shadow-2xl group">/;
const videoMatch = html.match(videoRegex);
if (videoMatch) {
    const newVideo = `<div id="video-section" class="space-y-4">\n<div class="relative group/cam bg-black rounded-3xl overflow-hidden aspect-[9/16] border border-white/10 shadow-2xl group">\n<div class="absolute left-1/2 -translate-x-1/2 top-4 opacity-0 group-hover/cam:opacity-100 transition-opacity duration-300 pointer-events-none w-56 p-2 bg-black/80 border border-white/10 text-white text-[10px] font-bold text-center rounded-lg shadow-2xl z-50 backdrop-blur-md">\nLook directly at the camera! Your video will play live on stream.\n</div>`;
    html = html.replace(videoMatch[0], newVideo);
}

// 3. Pay Button
const payRegex = /<button id="submit-btn" class="w-full py-4 bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black font-black text-lg rounded-xl transition-all shadow-\[0_0_20px_rgba\(0,255,136,0\.4\)\] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">([\s\S]*?)<\/button>/;
const payMatch = html.match(payRegex);
if (payMatch) {
    const newPay = `<button id="submit-btn" class="relative group/tooltip w-full py-4 bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">` + payMatch[1] + `\n<div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-green-500/50 text-white text-[10px] rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.2)] z-50 text-center normal-case tracking-normal font-bold">Secure payment via Stripe. 100% goes to the creator!</div>\n</button>`;
    html = html.replace(payMatch[0], newPay);
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Fixed viewer.html tooltips');
