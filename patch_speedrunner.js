const fs = require('fs');

// 1. Patch viewer.html for Cmd+Enter submit
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
const viewerHotkey = `
        // Speedrunner Mode: Cmd+Enter / Ctrl+Enter to Submit
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('submit-btn').click();
            }
        });
`;
if (!viewer.includes('Speedrunner Mode: Cmd+Enter')) {
    viewer = viewer.replace('// Submit Logic', viewerHotkey + '\n        // Submit Logic');
    fs.writeFileSync('whutcha-web/viewer.html', viewer);
    console.log('viewer.html patched for Speedrunner mode (Cmd+Enter).');
}

// 2. Patch dashboard.js for Shift+A (Approve) and Shift+R (Reject)
let dashboard = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
const dashboardHotkey = `
// ==========================================
// SPEEDRUNNER MODE (POWER USER HOTKEYS)
// ==========================================
document.addEventListener('keydown', (e) => {
    // Only if user is not typing in an input field
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    
    // Check if we have pending donations
    const pending = currentDonations.filter(d => d.status === 'pending');
    if (pending.length === 0) return;
    
    const topDonation = pending[0];
    const isCoStream = topDonation.videoHash === 'costream';

    // Shift + A -> Approve Top
    if (e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        approveDonation(topDonation.id, isCoStream, sanitize(topDonation.username));
    }
    
    // Shift + R -> Reject Top
    if (e.shiftKey && (e.key === 'R' || e.key === 'r' || e.key === 'К' || e.key === 'к')) {
        e.preventDefault();
        rejectDonation(topDonation.id);
    }
});
`;

if (!dashboard.includes('SPEEDRUNNER MODE (POWER USER HOTKEYS)')) {
    dashboard += '\n\n' + dashboardHotkey;
    fs.writeFileSync('whutcha-web/dashboard.js', dashboard);
    console.log('dashboard.js patched for Speedrunner mode (Shift+A/R).');
}
