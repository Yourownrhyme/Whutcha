const fs = require('fs');

// --- 1. Fix WebRTC Memory Leak (Ghost Cameras) in viewer.html ---
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldStartCamera = /window\.startCamera = async function\(\) \{[\s\S]*?try \{/m;
const newStartCamera = `window.startCamera = async function() {
    // SRE Fix: Stop existing tracks before requesting new ones to prevent ghost cameras
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    try {`;

if (viewerHtml.includes('window.startCamera = async function() {')) {
    viewerHtml = viewerHtml.replace(oldStartCamera, newStartCamera);
    fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
    console.log("WebRTC Ghost Camera leak fixed in viewer.html");
}

// --- 2. Fix Race Condition (Double Co-Stream) in dashboard.js ---
let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldApprove = /window\.approveDonation = async function\(id\) \{/m;
const newApprove = `window.approveDonation = async function(id) {
    // SRE Fix: Prevent accepting another call while currently in a live Co-Stream
    if (window.currentRoom && window.currentRoom.state === 'connected') {
        alert("You are already in a live Co-Stream! Drop the current caller first.");
        return;
    }`;

if (dashJs.includes('window.approveDonation = async function(id) {')) {
    dashJs = dashJs.replace(oldApprove, newApprove);
    fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
    console.log("Co-Stream Race Condition fixed in dashboard.js");
}
