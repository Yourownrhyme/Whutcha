const fs = require('fs');

// --- 1. Patch dashboard.html (Settings Modal Prices) ---
let dashHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const newSettingsFields = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black uppercase text-silver mb-2">Min Video $</label>
                        <input type="number" id="settings-min-video" min="1" placeholder="5" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-silver mb-2">Min Co-Stream $</label>
                        <input type="number" id="settings-min-costream" min="1" placeholder="10" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-colors">
                    </div>
                </div>
            </div>
            
            <button onclick="saveSettings()"`;

dashHtml = dashHtml.replace(/<\/div>\s*<button onclick="saveSettings\(\)"/, newSettingsFields);
fs.writeFileSync('whutcha-web/dashboard.html', dashHtml);

// --- 2. Patch dashboard.js (Save Prices & VIP Whale UI) ---
let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// A. Load Settings
dashJs = dashJs.replace(/document\.getElementById\('settings-paylink'\)\.value = data\.external_pay_link \|\| '';/, 
`document.getElementById('settings-paylink').value = data.external_pay_link || '';
        document.getElementById('settings-min-video').value = data.min_video_price || 5;
        document.getElementById('settings-min-costream').value = data.min_costream_price || 10;`);

// B. Save Settings
dashJs = dashJs.replace(/external_pay_link: paylink\n\s*\}\)\.eq/, 
`external_pay_link: paylink,
        min_video_price: parseFloat(document.getElementById('settings-min-video').value) || 5,
        min_costream_price: parseFloat(document.getElementById('settings-min-costream').value) || 10
    }).eq`);

// C. VIP Whale UI
const cardRegex = /<div id="actions-\$\{d\.id\}" class="p-4 rounded-3xl glass-card flex flex-col justify-between border border-white\/5 relative overflow-hidden group">/g;
const newCard = `<div id="actions-\${d.id}" class="p-4 rounded-3xl flex flex-col justify-between relative overflow-hidden group \${parseFloat(d.amount) >= 50 ? 'border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] bg-gradient-to-b from-yellow-900/30 to-black/80' : 'glass-card border border-white/5'}">`;
dashJs = dashJs.replace(cardRegex, newCard);

// Add Whale Crown Icon
const titleRegex = /<h4 class="text-xl font-bold text-white mb-1 truncate max-w-\[200px\] sm:max-w-\[150px\]">\$\{sanitize\(d\.username\)\}<\/h4>/g;
const newTitle = `<h4 class="text-xl font-bold text-white mb-1 truncate max-w-[200px] sm:max-w-[150px] flex items-center gap-2">
                    \${parseFloat(d.amount) >= 50 ? '<svg class="w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"></path></svg>' : ''}
                    \${sanitize(d.username)}
                </h4>`;
dashJs = dashJs.replace(titleRegex, newTitle);

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);

// --- 3. Patch viewer.html (Dynamic Prices & Validation) ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Global variables for prices
const globals = `
        let minVideoPrice = 5;
        let minCostreamPrice = 10;
        let currentMinPrice = 5;`;
viewerHtml = viewerHtml.replace(/let streamId = null;/, globals + '\n        let streamId = null;');

// Fetch prices on load
const fetchPrices = `
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', streamerId).single();
            if (profile) {
                if (profile.username) {
                    streamerNameDisplay.innerText = profile.username;
                    document.title = "Donate to " + profile.username;
                }
                if (profile.avatar_url) {
                    streamerAvatar.src = profile.avatar_url;
                }
                if (profile.min_video_price) minVideoPrice = parseFloat(profile.min_video_price);
                if (profile.min_costream_price) minCostreamPrice = parseFloat(profile.min_costream_price);
                
                // Initialize UI
                currentMinPrice = minVideoPrice;
                amountInput.value = currentMinPrice.toFixed(2);
                updateSubmitBtn();
            }
`;
viewerHtml = viewerHtml.replace(/const \{ data: profile \} = await supabase[\s\S]*?streamerAvatar\.src = profile\.avatar_url;\n\s*\}/, fetchPrices);

// Update switchTab to use dynamic prices
const oldSwitch = /if \(tab === 'costream'\) \{[\s\S]*?amountInput\.value = "10\.00";[\s\S]*?\} else \{[\s\S]*?amountInput\.value = "5\.00";[\s\S]*?\}/;
const newSwitch = `if (tab === 'costream') {
                tabCostream.classList.replace('text-silver', 'text-white');
                tabCostream.classList.add('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                tabVideo.classList.replace('text-white', 'text-silver');
                tabVideo.classList.remove('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                document.getElementById('video-upload-ui').classList.add('hidden');
                currentMinPrice = minCostreamPrice;
                amountInput.value = currentMinPrice.toFixed(2);
            } else {
                tabVideo.classList.replace('text-silver', 'text-white');
                tabVideo.classList.add('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                tabCostream.classList.replace('text-white', 'text-silver');
                tabCostream.classList.remove('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                document.getElementById('video-upload-ui').classList.remove('hidden');
                currentMinPrice = minVideoPrice;
                amountInput.value = currentMinPrice.toFixed(2);
            }`;
viewerHtml = viewerHtml.replace(oldSwitch, newSwitch);

// Frontend Validation in submitBtn
const validationHook = `
                const amount = parseFloat(amountInput.value);
                if (isNaN(amount) || amount < currentMinPrice) {
                    alert(\`Minimum amount for this request is $\${currentMinPrice.toFixed(2)}\`);
                    return;
                }
                
                const btnText = document.getElementById('submit-btn-text');`;
viewerHtml = viewerHtml.replace(/const btnText = document\.getElementById\('submit-btn-text'\);/, validationHook);


fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
console.log("Mode 5 (Game Economist) patches applied.");
