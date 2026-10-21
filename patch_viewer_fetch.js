const fs = require('fs');
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Inject globals right after streamId declaration
const globals = `let minVideoPrice = 5;
        let minCostreamPrice = 10;
        let currentMinPrice = 5;`;
if (!viewerHtml.includes('minVideoPrice')) {
    viewerHtml = viewerHtml.replace(/let streamId = null;/, 'let streamId = null;\n        ' + globals);
}

// 2. Replace the old fetch (lines 207-211)
const oldFetch = /const \{ data: profile \} = await supabase\.from\('profiles'\)\.select\('username'\)\.eq\('id', streamerId\)\.single\(\);\n\s*if\(profile\) \{[\s\S]*?\}\n/;

const newFetch = `const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', streamerId).single();
            if (profileError || !profile) {
                document.body.innerHTML = '<div class="flex min-h-screen bg-background items-center justify-center p-6"><div class="glass-card w-full max-w-sm p-8 rounded-3xl text-center border-red-500/30 border shadow-[0_0_50px_rgba(239,68,68,0.2)]"><div class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><h2 class="text-2xl font-black text-white mb-2">Streamer Not Found</h2><p class="text-silver text-sm">This link is invalid or the streamer deleted their account.</p></div></div>';
                return;
            }
            
            if(profile) {
                document.getElementById('streamer-name').innerText = profile.username || 'Streamer';
                document.getElementById('streamer-avatar').innerText = (profile.username || 'S').charAt(0).toUpperCase();
                document.title = "Donate to " + (profile.username || 'Streamer');
                
                if (profile.min_video_price) minVideoPrice = parseFloat(profile.min_video_price);
                if (profile.min_costream_price) minCostreamPrice = parseFloat(profile.min_costream_price);
                
                currentMinPrice = minVideoPrice;
                const amountInput = document.getElementById('amount');
                if (amountInput) amountInput.value = currentMinPrice.toFixed(2);
            }
`;
viewerHtml = viewerHtml.replace(oldFetch, newFetch);

// 3. Fix switchTab logic for dynamic pricing
const oldSwitch = /if \(tab === 'costream'\) \{[\s\S]*?amountInput\.value = "10\.00";[\s\S]*?\} else \{[\s\S]*?amountInput\.value = "5\.00";[\s\S]*?\}/;
const newSwitch = `if (tab === 'costream') {
                tabCostream.classList.replace('text-silver', 'text-white');
                tabCostream.classList.add('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                tabVideo.classList.replace('text-white', 'text-silver');
                tabVideo.classList.remove('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                document.getElementById('video-upload-ui').classList.add('hidden');
                currentMinPrice = typeof minCostreamPrice !== 'undefined' ? minCostreamPrice : 10;
                amountInput.value = currentMinPrice.toFixed(2);
            } else {
                tabVideo.classList.replace('text-silver', 'text-white');
                tabVideo.classList.add('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                tabCostream.classList.replace('text-white', 'text-silver');
                tabCostream.classList.remove('bg-white/10', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
                document.getElementById('video-upload-ui').classList.remove('hidden');
                currentMinPrice = typeof minVideoPrice !== 'undefined' ? minVideoPrice : 5;
                amountInput.value = currentMinPrice.toFixed(2);
            }`;
if (oldSwitch.test(viewerHtml)) viewerHtml = viewerHtml.replace(oldSwitch, newSwitch);

// 4. Fix submit button validation
const validationHook = `
                const amount = parseFloat(amountInput.value);
                const minAllowed = typeof currentMinPrice !== 'undefined' ? currentMinPrice : 1;
                if (isNaN(amount) || amount < minAllowed) {
                    alert(\`Minimum amount for this request is $\${minAllowed.toFixed(2)}\`);
                    return;
                }
                
                const btnText = document.getElementById('submit-btn-text');`;
viewerHtml = viewerHtml.replace(/const btnText = document\.getElementById\('submit-btn-text'\);/, validationHook);

fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
console.log("Fixed profile fetch, ghost streamer, and dynamic pricing!");
