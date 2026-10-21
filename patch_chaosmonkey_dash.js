const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldApprove = `window.approveDonation = async (id, isCoStream, username) => {
    vibrate([50]);
    lockCardActions(id);`;

const newApprove = `// CHAOS MONKEY MODE: Prevent double-execution from rage clicks or held keyboard shortcuts
window.processingActions = window.processingActions || new Set();

window.approveDonation = async (id, isCoStream, username) => {
    if (window.processingActions.has(id)) return;
    window.processingActions.add(id);
    
    vibrate([50]);
    lockCardActions(id);`;

if (!dash.includes('window.processingActions.has(id)')) {
    dash = dash.replace(oldApprove, newApprove);
}

const oldReject = `window.rejectDonation = async (id) => {
    vibrate([50]);
    lockCardActions(id);`;
    
const newReject = `window.rejectDonation = async (id) => {
    if (window.processingActions.has(id)) return;
    window.processingActions.add(id);
    
    vibrate([50]);
    lockCardActions(id);`;

if (!dash.includes('window.rejectDonation = async (id) => {\n    if (window.processingActions.has(id)) return;')) {
    dash = dash.replace(oldReject, newReject);
}

// Ensure processingActions gets cleared if there's an error so the card isn't permanently locked
const oldCatchApprove = `console.error("Approval error:", err);
        alert("Failed to approve video.");
    }`;
const newCatchApprove = `console.error("Approval error:", err);
        alert("Failed to approve video.");
    } finally {
        window.processingActions.delete(id);
    }`;
    
const oldCatchReject = `console.error("Reject error:", err);
        alert("Failed to reject video.");
    }`;
const newCatchReject = `console.error("Reject error:", err);
        alert("Failed to reject video.");
    } finally {
        window.processingActions.delete(id);
    }`;

// Wait, the original code in dashboard.js might not have try/catch around the DB update for simple video approves.
