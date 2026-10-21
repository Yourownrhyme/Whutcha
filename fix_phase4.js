const fs = require('fs');

// 1. Fix OBS CSS (Frankenstein Mode)
let overlay = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const oldWidgetCss = `#widget-container {
            width: 1280px; /* Standard 720p box for 1080p canvas */
            background: rgba(15, 17, 26, 0.95);
            
            border: 2px solid rgba(0, 240, 255, 0.5);
            border-radius: 30px;
            box-shadow: 0 0 50px rgba(0, 240, 255, 0.3);
            overflow: hidden;
            
            transform: scale(0.9);
            opacity: 0;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }`;

const newWidgetCss = `#widget-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: rgba(15, 17, 26, 0.95);
            
            border: 2px solid rgba(0, 240, 255, 0.5);
            border-radius: 30px;
            box-shadow: 0 0 50px rgba(0, 240, 255, 0.3);
            overflow: hidden;
            box-sizing: border-box;
            
            transform: scale(0.9);
            opacity: 0;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }`;

const oldMediaCss = `#media-container {
            width: 100%;
            height: 720px;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }`;

const newMediaCss = `#media-container {
            width: 100%;
            flex-grow: 1;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }`;

overlay = overlay.replace(oldWidgetCss, newWidgetCss);
overlay = overlay.replace(oldMediaCss, newMediaCss);
fs.writeFileSync('whutcha-web/overlay.html', overlay);
console.log("Fixed overlay CSS.");


// 2. Fix Zombie Recording (Vampire Mode)
let dashboard = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldClose = `function closeReactionModal() {
    reactionModal.classList.remove('flex');
    reactionModal.classList.add('hidden');
    
    reactionViewerVid.pause();`;

const newClose = `function closeReactionModal() {
    // VAMPIRE MODE FIX: Stop actively recording instances if aborted
    if (typeof mediaRecorder !== 'undefined' && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    reactionModal.classList.remove('flex');
    reactionModal.classList.add('hidden');
    
    reactionViewerVid.pause();`;

dashboard = dashboard.replace(oldClose, newClose);
fs.writeFileSync('whutcha-web/dashboard.js', dashboard);
console.log("Fixed dashboard zombie recording.");
