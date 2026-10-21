const fs = require('fs');

// --- 1. Patch dashboard.html ---
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Inject Settings button into Sidebar (Desktop)
const settingsBtnDesktop = `
                    <a href="#" onclick="openSettingsModal()" class="flex items-center gap-4 text-silver hover:text-white group transition-colors">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors border border-white/5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <span class="font-bold">Settings</span>
                    </a>
`;
html = html.replace(/<a href="#" class="flex items-center gap-4 text-silver hover:text-white group transition-colors" onclick="openModal\('legal-modal-tos'\)">/, settingsBtnDesktop + '\n                    <a href="#" class="flex items-center gap-4 text-silver hover:text-white group transition-colors" onclick="openModal(\'legal-modal-tos\')">');

// Inject Settings button into Bottom Nav (Mobile)
const settingsBtnMobile = `
        <button onclick="openSettingsModal()" class="flex flex-col items-center gap-1 text-silver hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span class="text-[10px] font-bold">Settings</span>
        </button>
`;
html = html.replace(/<button onclick="openModal\('legal-modal-tos'\)"/, settingsBtnMobile + '\n        <button onclick="openModal(\'legal-modal-tos\')"');

// Inject Settings Modal
const settingsModal = `
    <!-- Settings Modal -->
    <div id="settings-modal" class="fixed inset-0 z-[120] modal-glass hidden flex-col items-center justify-center p-6">
        <div class="glass-card w-full max-w-lg p-8 rounded-3xl flex flex-col gap-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
            <div class="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 class="text-2xl font-black text-white flex items-center gap-3">
                    <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Settings
                </h3>
                <button onclick="closeSettingsModal()" class="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-black uppercase text-silver mb-2">Display Name</label>
                    <input type="text" id="settings-username" placeholder="e.g. Ninja" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-colors">
                    <p class="text-[10px] text-gray-500 mt-1">This appears on your public viewer page.</p>
                </div>
                
                <div>
                    <label class="block text-xs font-black uppercase text-silver mb-2">Payout Link (REQUIRED)</label>
                    <input type="url" id="settings-paylink" placeholder="https://donationalerts.com/r/yourname" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-colors">
                    <p class="text-[10px] text-gray-500 mt-1">DonationAlerts, PayPal.me, or Ko-fi link. Viewers will be redirected here to pay.</p>
                </div>
            </div>
            
            <button onclick="saveSettings()" id="btn-save-settings" class="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-black font-black text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:opacity-90 transition-opacity mt-4">
                Save Changes
            </button>
        </div>
    </div>
`;
html = html.replace(/<!-- Co-Stream Modal -->/, settingsModal + '\n    <!-- Co-Stream Modal -->');

fs.writeFileSync('whutcha-web/dashboard.html', html);

// --- 2. Patch dashboard.js ---
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const settingsJs = `
// Settings Modal Logic
window.openSettingsModal = async function() {
    vibrate([50]);
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('settings-modal').classList.add('flex');
    
    // Fetch latest profile
    const { data } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    if(data) {
        document.getElementById('settings-username').value = data.username || '';
        document.getElementById('settings-paylink').value = data.external_pay_link || '';
    }
};

window.closeSettingsModal = function() {
    vibrate([30]);
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('flex');
};

window.saveSettings = async function() {
    vibrate([50]);
    const btn = document.getElementById('btn-save-settings');
    const username = document.getElementById('settings-username').value.trim();
    const paylink = document.getElementById('settings-paylink').value.trim();
    
    if(!paylink) {
        alert("Payout Link is required to receive money!");
        return;
    }
    
    btn.innerText = "SAVING...";
    btn.disabled = true;
    
    const { error } = await supabaseClient.from('profiles').update({
        username: username,
        external_pay_link: paylink
    }).eq('id', currentUser.id);
    
    if(error) {
        alert("Error saving: " + error.message);
    } else {
        showToast("Settings saved successfully!");
        closeSettingsModal();
    }
    
    btn.innerText = "SAVE CHANGES";
    btn.disabled = false;
};
`;

js = js.replace(/function fallbackCopyTextToClipboard/, settingsJs + '\nfunction fallbackCopyTextToClipboard');

// We also need to prompt the user to open settings if paylink is missing on load.
const promptSettingsJs = `
            // Check if profile has paylink, if not, prompt them
            const { data: profileData } = await supabaseClient.from('profiles').select('external_pay_link').eq('id', user.id).single();
            if (!profileData || !profileData.external_pay_link) {
                setTimeout(() => openSettingsModal(), 1500); // Auto-open settings if missing
            }
`;
// Inject this into checkAuth() after getting the session
js = js.replace(/currentUser = user;\n\n        \/\/ Upsert profile/, `currentUser = user;
        
        ${promptSettingsJs}

        // Upsert profile`);

fs.writeFileSync('whutcha-web/dashboard.js', js);
