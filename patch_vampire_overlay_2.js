const fs = require('fs');
let overlay = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const oldHide = `function hideWidget() {
            widgetContainer.classList.remove('widget-show');
            setTimeout(() => {
                mediaContainer.innerHTML = ''; 
                if (currentRoom) {`;

const newHide = `function hideWidget() {
            widgetContainer.classList.remove('widget-show');
            setTimeout(() => {
                // VAMPIRE MODE: Destroy video buffers
                const vids = mediaContainer.querySelectorAll('video');
                vids.forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
                mediaContainer.innerHTML = ''; 
                if (currentRoom) {`;

if (!overlay.includes('Destroy video buffers')) {
    overlay = overlay.replace(oldHide, newHide);
    fs.writeFileSync('whutcha-web/overlay.html', overlay);
    console.log('overlay.html hideWidget patched.');
}
