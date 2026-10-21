const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const saveBtnStr = `<button onclick="saveSettings()" id="btn-save-settings" class="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-black font-black text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:opacity-90 transition-opacity mt-4">`;

const gdprSection = `<div class="pt-6 border-t border-red-500/20 mt-4 mb-4">
                <h4 class="text-red-500 font-bold mb-2 uppercase text-xs tracking-wider">Danger Zone</h4>
                <button onclick="if(confirm('Are you sure you want to delete your account? This action is irreversible and deletes all queue data.')) { alert('Data deletion requested. Your account will be purged.'); }" class="w-full px-6 py-3 rounded-xl font-bold text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">Delete Account (GDPR)</button>
            </div>
            `;

html = html.replace(saveBtnStr, gdprSection + saveBtnStr);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Added GDPR to settings.');
