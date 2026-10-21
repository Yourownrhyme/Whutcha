const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const ensureSession = `
// TIME TRAVELER MODE: Guard against PC sleep / expired sessions
async function ensureSession() {
    if (!currentUser) return false;
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
        alert("Your session has expired. Please log in again.");
        window.location.href = './index.html';
        return false;
    }
    return true;
}
`;

if (!dash.includes('TIME TRAVELER MODE: Guard')) {
    dash = dash.replace('async function updateStatus(id, status) {', ensureSession + '\nasync function updateStatus(id, status) {\n    if (!(await ensureSession())) return;');
}

const syncPatchOld = `window.syncQueue = async function() {
    vibrate([30]);`;
const syncPatchNew = `window.syncQueue = async function() {
    vibrate([30]);
    if (!(await ensureSession())) return;`;
if (dash.includes(syncPatchOld) && !dash.includes('if (!(await ensureSession())) return;')) {
    dash = dash.replace(syncPatchOld, syncPatchNew);
}

fs.writeFileSync('whutcha-web/dashboard.js', dash);
console.log('Time Traveler patched in dashboard.js.');
