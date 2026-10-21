const fs = require('fs');

let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// --- 1. Patch Camera Constraints (4K CPU Melt Fix) ---
const oldGetUserMedia = /cameraStream = await navigator\.mediaDevices\.getUserMedia\(\{ video: true, audio: true \}\);/;
const newGetUserMedia = `const constraints = { 
            video: { 
                width: { ideal: 1280, max: 1920 }, 
                height: { ideal: 720, max: 1080 }, 
                frameRate: { ideal: 30, max: 30 } 
            }, 
            audio: true 
        };
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);`;

if (oldGetUserMedia.test(dashJs)) {
    dashJs = dashJs.replace(oldGetUserMedia, newGetUserMedia);
} else {
    // If exact spacing varies
    dashJs = dashJs.replace(/navigator\.mediaDevices\.getUserMedia\(\{[\s\S]*?\}\)/, `navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 }, frameRate: { ideal: 30, max: 30 } }, audio: true })`);
}

// --- 2. Patch Modal Overlap (Z-Index Traps) ---
const modalGuardian = `
// GLOBAL MODAL GUARDIAN
window.canOpenModal = function(targetId) {
    const isReaction = document.getElementById('reaction-modal') && !document.getElementById('reaction-modal').classList.contains('hidden');
    const isCoStream = document.getElementById('costream-modal') && !document.getElementById('costream-modal').classList.contains('hidden');
    
    // If trying to open Settings or TOS while busy
    if ((isReaction || isCoStream) && targetId !== 'reaction-modal' && targetId !== 'costream-modal') {
        alert("Please finish your current active call or recording before opening this menu.");
        return false;
    }
    
    // Auto-close Settings/TOS if they are open and we are opening something else
    const bgModals = ['settings-modal', 'legal-modal-tos'];
    bgModals.forEach(id => {
        const el = document.getElementById(id);
        if (el && targetId !== id) {
            el.classList.remove('flex');
            el.classList.add('hidden');
        }
    });
    
    return true;
};
`;
dashJs = dashJs.replace(/window\.openSettingsModal = async function\(\) \{/, modalGuardian + '\nwindow.openSettingsModal = async function() {');

// Inject guardian checks into open functions
dashJs = dashJs.replace(/window\.openSettingsModal = async function\(\) \{[\s]*vibrate\(\[50\]\);/, 
    "window.openSettingsModal = async function() {\n    if(!canOpenModal('settings-modal')) return;\n    vibrate([50]);");

dashJs = dashJs.replace(/async function openReactionModal\(id, videoHash, username\) \{/, 
    "async function openReactionModal(id, videoHash, username) {\n    if(!canOpenModal('reaction-modal')) return;");

// Update generic openModal (used for TOS)
if (!dashJs.includes('window.openModal =')) {
    dashJs += `
window.openModal = function(id) {
    if(!canOpenModal(id)) return;
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
    }
};`;
} else {
    dashJs = dashJs.replace(/window\.openModal = function\(id\) \{/, "window.openModal = function(id) {\n    if(!canOpenModal(id)) return;");
}

fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
console.log("Mode 3 (Round 2) patches applied.");
