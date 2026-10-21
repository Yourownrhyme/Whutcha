const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldSuccess = `document.getElementById('submit-btn-text').innerText = "SUCCESS! 🎉";
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }`;

const newSuccess = `document.getElementById('submit-btn-text').innerText = "SUCCESS! 🎉";
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    // VAMPIRE MODE: Turn off camera to save fan's battery/CPU after successful send
                    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
                }`;

if (!html.includes('VAMPIRE MODE: Turn off camera')) {
    html = html.replace(oldSuccess, newSuccess);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log('viewer.html camera cleanup patched.');
}
