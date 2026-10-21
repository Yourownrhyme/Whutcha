const fs = require('fs');

let html = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

// The original header block
const originalHeader = `<div class="absolute -top-6 left-1/2 -translate-x-1/2 w-[90%] flex items-center justify-between z-10 px-2">
            <div class="flex items-center gap-4 bg-dark/90 backdrop-blur-md p-2 pr-6 rounded-full border border-white/10 shadow-xl">
                <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-inner" id="donor-initial">
                    V
                </div>
                <div>
                    <h2 class="text-white font-black text-xl flex items-center gap-3">
                        <span id="donor-name" class="truncate inline-block max-w-[250px] align-bottom">Viewer</span>
                        <span class="text-sm px-3 py-1 bg-white/10 rounded-full text-gray-300 font-bold" id="donation-type">Video Message</span>
                    </h2>
                </div>
            </div>
            <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-8 py-3 rounded-2xl border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <span id="donor-amount" class="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">+$0.00</span>
            </div>
        </div>`;

// The frankenstein-proof header block
const frankensteinHeader = `<div class="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] flex flex-col md:flex-row items-center md:justify-between z-10 px-2 gap-2 md:gap-0">
            <!-- FRANKENSTEIN MODE: Flex-col on small sources, min-w-0 for truncating -->
            <div class="flex items-center gap-3 md:gap-4 bg-dark/90 backdrop-blur-md p-2 pr-4 md:pr-6 rounded-full border border-white/10 shadow-xl max-w-full">
                <div class="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-black text-lg md:text-xl text-white shadow-inner" id="donor-initial">
                    V
                </div>
                <div class="min-w-0 flex-1">
                    <h2 class="text-white font-black text-base md:text-xl flex flex-wrap items-center gap-2">
                        <span id="donor-name" class="truncate min-w-0 max-w-[120px] md:max-w-[250px] align-bottom">Viewer</span>
                        <span class="text-[10px] md:text-sm px-2 md:px-3 py-1 bg-white/10 rounded-full text-gray-300 font-bold whitespace-nowrap" id="donation-type">Video Message</span>
                    </h2>
                </div>
            </div>
            <!-- Scalable Amount -->
            <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 md:px-8 py-1.5 md:py-3 rounded-xl md:rounded-2xl border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] shrink-0">
                <span id="donor-amount" class="text-xl md:text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] whitespace-nowrap">+$0.00</span>
            </div>
        </div>`;

if (!html.includes('FRANKENSTEIN MODE: Flex-col on small sources')) {
    html = html.replace(originalHeader, frankensteinHeader);
    fs.writeFileSync('whutcha-web/overlay.html', html);
    console.log('overlay.html patched for Frankenstein mode.');
} else {
    console.log('Already patched.');
}
