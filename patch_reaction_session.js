const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldReactionFunc = `async function openReactionModal(id, videoHash, username) {
    if(!canOpenModal('reaction-modal')) return;
    currentReactionId = id;`;

const newReactionFunc = `async function openReactionModal(id, videoHash, username) {
    if(!canOpenModal('reaction-modal')) return;
    if (!(await ensureSession())) return;
    currentReactionId = id;`;

if (!dash.includes('if (!(await ensureSession())) return;\\n    currentReactionId = id;')) {
    dash = dash.replace(oldReactionFunc, newReactionFunc);
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('Reaction Modal Time Traveler patched.');
}
