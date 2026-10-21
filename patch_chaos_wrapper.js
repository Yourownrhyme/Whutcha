const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// 1. Rename window.approveDonation
dash = dash.replace('window.approveDonation = async (id, isCoStream, username) => {', 'const _innerApprove = async (id, isCoStream, username) => {');

// 2. Inject Chaos Monkey wrapper and missing rejectDonation
const chaosWrapper = `
// CHAOS MONKEY MODE: Prevent Rage Clicking
window.actionLocks = window.actionLocks || new Set();

window.approveDonation = async (id, isCoStream, username) => {
    if (window.actionLocks.has(id)) return;
    window.actionLocks.add(id);
    try {
        await _innerApprove(id, isCoStream, username);
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => window.actionLocks.delete(id), 2000); // Unlock after 2s if still in DOM
    }
};

window.rejectDonation = async (id) => {
    if (window.actionLocks.has(id)) return;
    window.actionLocks.add(id);
    try {
        vibrate([50]);
        window.lockCardActions(id);
        await updateStatus(id, 'rejected');
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => window.actionLocks.delete(id), 2000);
    }
};

const _innerApprove = async (id, isCoStream, username) => {`;

if (!dash.includes('window.actionLocks.has(id)')) {
    dash = dash.replace('const _innerApprove = async (id, isCoStream, username) => {', chaosWrapper);
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js Chaos Monkey applied.');
}
