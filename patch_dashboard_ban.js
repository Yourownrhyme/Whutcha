const fs = require('fs');

let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// 1. Update the tag container to include the ban button
js = js.replace(
    /<div class="flex items-center gap-2 mb-1">/g,
    `<div class="flex items-center justify-between mb-1 w-full">
                <div class="flex items-center gap-2">`
);

js = js.replace(
    /<\/span>\s*<\/div>\s*<h4/g,
    `</span>
                </div>
                <button onclick="banViewer('\${d.viewer_device_id || ''}')" title="Ban User" class="text-[10px] text-red-500/50 hover:text-red-500 font-black uppercase transition-colors px-2 py-0.5 rounded hover:bg-red-500/10">Ban 🚫</button>
            </div>
            <h4`
);

// 2. Add window.banViewer logic
const banLogic = `
window.banViewer = async function(deviceId) {
    if(!deviceId) {
        alert("Cannot ban: Old donation format without Device ID.");
        return;
    }
    const confirmed = confirm("Are you sure you want to BAN this viewer? They will never be able to send you videos again.");
    if(!confirmed) return;
    
    // 1. Insert into banned_viewers
    const { error: banError } = await supabaseClient.from('banned_viewers').insert([{
        streamer_id: currentUser.id,
        viewer_device_id: deviceId
    }]);
    
    if(banError && banError.code !== '23505') { // Ignore unique violation if already banned
        alert("Error banning viewer: " + banError.message);
        return;
    }
    
    showToast("Viewer Banned Successfully");
    
    // 2. Auto-decline all currently pending videos from this deviceId in the DOM
    pendingDonations.forEach(d => {
        if(d.viewer_device_id === deviceId && d.status === 'pending') {
            declineDonation(d.id); // Decline them visually and in DB
        }
    });
};
`;

if (!js.includes('window.banViewer')) {
    js += '\n\n' + banLogic;
}

fs.writeFileSync('whutcha-web/dashboard.js', js);
console.log('Patched dashboard.js');
