const fs = require('fs');

let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const recoveryModal = `
    <!-- Password Recovery Modal -->
    <div id="recovery-modal" class="fixed inset-0 z-[100] modal-glass hidden flex-col items-center justify-center p-6">
        <div class="glass-card w-full max-w-md p-8 rounded-3xl flex flex-col gap-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div class="text-center">
                <h3 class="text-2xl font-black text-white mb-2">Reset Password</h3>
                <p class="text-silver text-sm">Please enter your new password below.</p>
            </div>
            
            <div class="space-y-4">
                <input type="password" id="new-password" placeholder="New Password (min 6 chars)" class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold">
                <button id="btn-save-password" onclick="saveNewPassword()" class="w-full py-4 bg-primary hover:bg-primary-hover text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]">SAVE NEW PASSWORD</button>
            </div>
        </div>
    </div>
`;

if (!html.includes('id="recovery-modal"')) {
    // Insert right before closing body tag
    html = html.replace('</body>', recoveryModal + '\n</body>');
    fs.writeFileSync('whutcha-web/dashboard.html', html);
    console.log('dashboard.html patched with recovery modal.');
} else {
    console.log('Recovery modal already exists.');
}
