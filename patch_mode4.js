const fs = require('fs');

// --- 1. Patch viewer.html ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// A. Cancel Button in waiting-ui
const waitingUiOld = /<p class="text-silver text-sm max-w-sm">The streamer has received your Co-Stream request\. If they decline, you will not be charged\.<\/p>\s*<\/div>/;
const waitingUiNew = `<p class="text-silver text-sm max-w-sm">The streamer has received your Co-Stream request. If they decline, you will not be charged.</p>
        <button onclick="cancelCoStream()" class="mt-8 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors border border-white/20">
            Cancel Request
        </button>
    </div>`;
viewerHtml = viewerHtml.replace(waitingUiOld, waitingUiNew);

// JS logic for Cancel
const listenApprovalRegex = /function listenForStreamerApproval\(donationId\) \{/g;
const listenApprovalNew = `
            window.approvalChannel = null;
            window.cancelCoStream = function() {
                vibrate([50]);
                if (window.approvalChannel) {
                    supabase.removeChannel(window.approvalChannel);
                    window.approvalChannel = null;
                }
                document.getElementById('waiting-ui').classList.add('hidden');
                document.getElementById('main-form-ui').classList.remove('hidden');
                const txt = document.getElementById('submit-btn-text');
                if(txt) txt.innerText = \`SEND FOR $\${parseFloat(amountInput.value).toFixed(2)}\`;
                submitBtn.disabled = false;
            };
            
            function listenForStreamerApproval(donationId) {`;
viewerHtml = viewerHtml.replace(listenApprovalRegex, listenApprovalNew);

// Capture channel
viewerHtml = viewerHtml.replace(/supabase\.channel\(\`donation-\$\{donationId\}\`\)/g, 'window.approvalChannel = supabase.channel(`donation-${donationId}`)');

// B. Co-Stream LIVE CALL badge
const costreamTabOld = /<button id="tab-costream" onclick="switchTab\('costream'\)" class="flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider text-silver hover:text-white transition-all">/;
const costreamTabNew = `<button id="tab-costream" onclick="switchTab('costream')" class="flex-1 py-3 px-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-silver hover:text-white transition-all flex justify-center items-center gap-1 sm:gap-2 relative">
                Live Co-Stream
                <span class="bg-red-600 text-white px-1 py-0.5 rounded text-[8px] sm:text-[9px] flex items-center gap-1 animate-pulse"><div class="w-1.5 h-1.5 bg-white rounded-full"></div>CALL</span>`;
viewerHtml = viewerHtml.replace(costreamTabOld, costreamTabNew);

// Make video tab smaller text to match
viewerHtml = viewerHtml.replace(/<button id="tab-video" onclick="switchTab\('video'\)" class="flex-1 py-3 px-4 rounded-xl font-black text-sm/, '<button id="tab-video" onclick="switchTab(\'video\')" class="flex-1 py-3 px-2 rounded-xl font-black text-xs sm:text-sm');


fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);

// --- 2. Patch dashboard.html ---
let dashboardHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Add micro-tooltip to OBS Overlay link (Desktop)
const obsDesktopOld = /<a href="#" onclick="copyOverlayUrl\(\)" class="flex items-center gap-4 text-silver hover:text-white group transition-colors">\s*<div class="[\s\S]*?<\/div>\s*<span class="font-bold">OBS Overlay<\/span>\s*<\/a>/;
const obsDesktopNew = `<a href="#" onclick="copyOverlayUrl()" class="flex items-center gap-4 text-silver hover:text-white group transition-colors">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors border border-white/5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-bold">OBS Overlay</span>
                            <span class="text-[9px] text-gray-500 font-normal">Browser Source (1280x720)</span>
                        </div>
                    </a>`;
dashboardHtml = dashboardHtml.replace(obsDesktopOld, obsDesktopNew);

fs.writeFileSync('whutcha-web/dashboard.html', dashboardHtml);

console.log("Mode 4 (Dumb User) patches applied.");
