const fs = require('fs');
let donate = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const oldCheck = `        // Prevent accidental swipe/close during upload`;
const newCheck = `        if (finalVideoBlob && finalVideoBlob.size > 15 * 1024 * 1024) {
            alert('Video is too large (max 15MB). Please record a shorter video.');
            submitBtn.disabled = false;
            return;
        }
        
        // Prevent accidental swipe/close during upload`;

donate = donate.replace(oldCheck, newCheck);
fs.writeFileSync('whutcha-web/donate-v2.html', donate);
