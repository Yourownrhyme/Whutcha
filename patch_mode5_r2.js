const fs = require('fs');

// --- 1. Patch viewer.html (Dynamic Presets & Disclaimer) ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// A. Wrap preset buttons in a container with an ID
const presetGridRegex = /<div class="grid grid-cols-4 gap-2 mb-6">[\s\S]*?<\/div>/;
const presetContainerStr = `<div class="grid grid-cols-4 gap-2 mb-4" id="preset-buttons-container"></div>
            <p id="costream-disclaimer" class="hidden text-[10px] text-gray-400 text-center mb-6 px-4 leading-tight">
                *Live duration is at the streamer's discretion (Target: 60s). Early drops due to TOS violations or time limits are non-refundable.
            </p>`;
viewerHtml = viewerHtml.replace(presetGridRegex, presetContainerStr);

// B. Inject updatePresets JS function
const updatePresetsFn = `
            function updatePresets() {
                const container = document.getElementById('preset-buttons-container');
                if(!container) return;
                const multipliers = [1, 2, 5, 10];
                container.innerHTML = '';
                multipliers.forEach(m => {
                    const val = currentMinPrice * m;
                    const btn = document.createElement('button');
                    btn.className = "preset-btn py-2 rounded-xl font-black text-sm";
                    btn.innerText = "$" + val;
                    btn.onclick = () => window.setAmount(val);
                    container.appendChild(btn);
                });
            }
`;
viewerHtml = viewerHtml.replace(/window\.setAmount = function\(val\)/, updatePresetsFn + '\n            window.setAmount = function(val)');

// C. Call updatePresets in switchTab and fetch
viewerHtml = viewerHtml.replace(/currentMinPrice = typeof minCostreamPrice !== 'undefined' \? minCostreamPrice : 10;\s*amountInput\.value = currentMinPrice\.toFixed\(2\);/g, 
`currentMinPrice = typeof minCostreamPrice !== 'undefined' ? minCostreamPrice : 10;
                amountInput.value = currentMinPrice.toFixed(2);
                document.getElementById('costream-disclaimer').classList.remove('hidden');
                updatePresets();`);

viewerHtml = viewerHtml.replace(/currentMinPrice = typeof minVideoPrice !== 'undefined' \? minVideoPrice : 5;\s*amountInput\.value = currentMinPrice\.toFixed\(2\);/g, 
`currentMinPrice = typeof minVideoPrice !== 'undefined' ? minVideoPrice : 5;
                amountInput.value = currentMinPrice.toFixed(2);
                document.getElementById('costream-disclaimer').classList.add('hidden');
                updatePresets();`);

// Also call in the initial fetch block
viewerHtml = viewerHtml.replace(/currentMinPrice = minVideoPrice;\s*const amountInput = document.getElementById\('amount'\);\s*if \(amountInput\) amountInput\.value = currentMinPrice\.toFixed\(2\);/, 
`currentMinPrice = minVideoPrice;
                const amountInput = document.getElementById('amount');
                if (amountInput) amountInput.value = currentMinPrice.toFixed(2);
                updatePresets();`);

fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);


// --- 2. Patch dashboard.html (60s Timer UI) ---
let dashHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
const timerUI = `<div id="costream-timer" class="absolute top-6 left-6 z-50 bg-black/80 text-primary font-black text-xl px-4 py-2 rounded-xl border-2 border-primary shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all">
                60s
            </div>`;
dashHtml = dashHtml.replace(/<div id="costream-modal" class="fixed inset-0 z-\[100\] modal-glass hidden flex-col items-center justify-center p-6">/, 
    `<div id="costream-modal" class="fixed inset-0 z-[100] modal-glass hidden flex-col items-center justify-center p-6 relative">` + timerUI);
fs.writeFileSync('whutcha-web/dashboard.html', dashHtml);


// --- 3. Patch dashboard.js (60s Timer Logic) ---
let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// A. Add Timer Logic
const timerLogic = `
window.liveTimerInterval = null;
window.startLiveTimer = function() {
    let timeLeft = 60;
    const timerEl = document.getElementById('costream-timer');
    if(!timerEl) return;
    
    // Reset classes
    timerEl.className = "absolute top-6 left-6 z-50 bg-black/80 text-primary font-black text-xl px-4 py-2 rounded-xl border-2 border-primary shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all";
    timerEl.innerText = timeLeft + 's';
    
    if(window.liveTimerInterval) clearInterval(window.liveTimerInterval);
    
    window.liveTimerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft + 's';
        
        if (timeLeft === 10) {
            timerEl.classList.replace('text-primary', 'text-red-500');
            timerEl.classList.replace('border-primary', 'border-red-500');
            timerEl.classList.replace('shadow-[0_0_20px_rgba(0,240,255,0.5)]', 'shadow-[0_0_30px_rgba(239,68,68,0.8)]');
            timerEl.classList.add('animate-pulse');
            vibrate([50, 50, 50]); // Haptic warning for streamer
        }
        
        if (timeLeft <= 0) {
            clearInterval(window.liveTimerInterval);
            timerEl.innerText = "TIME UP";
            timerEl.classList.add('bg-red-900/50');
        }
    }, 1000);
};
`;
dashJs = dashJs.replace(/window\.dropCaller = function/, timerLogic + '\nwindow.dropCaller = function');

// B. Hook timer clear into dropCaller
dashJs = dashJs.replace(/if \(window\.coStreamTimeout\) \{/, `if(window.liveTimerInterval) { clearInterval(window.liveTimerInterval); window.liveTimerInterval = null; }
    if (window.coStreamTimeout) {`);

// C. Hook timer start into LiveKit participant connect
dashJs = dashJs.replace(/room\.on\('participantConnected', participant => \{/, 
`room.on('participantConnected', participant => {
                    window.startLiveTimer();`);

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);

console.log("Mode 5 (Round 2) Game Economist patches applied.");
