const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Ensure processingActions exists
if (!dash.includes('window.processingActions = window.processingActions || new Set();')) {
    const oldApprove = `window.approveDonation = async (id, isCoStream, username) => {
    vibrate([50]);
    lockCardActions(id);`;
    
    const newApprove = `// CHAOS MONKEY MODE: Track in-flight actions to prevent multi-click / held-key spam
window.processingActions = window.processingActions || new Set();

window.approveDonation = async (id, isCoStream, username) => {
    if (window.processingActions.has(id)) return;
    window.processingActions.add(id);
    vibrate([50]);
    lockCardActions(id);`;
    
    dash = dash.replace(oldApprove, newApprove);
}

// Ensure processingActions gets cleared on success/error inside approveDonation
// approveDonation has multiple exit points, but the main one for videos is:
// updateStatus(id, 'approved');
// and for costream it has its own logic. 
// A simpler Chaos Monkey fix for a monolithic function is to wrap the original logic, or just clear the set in `updateStatus` since `updateStatus` is the terminal point for DB writes.

// Wait, let's patch updateStatus directly! It's much safer.
