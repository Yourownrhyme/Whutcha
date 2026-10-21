const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const originalCatch = `                if (error) throw error;

                if (currentTab === 'costream') {`;
                
const skynetCatch = `                if (error) {
                    if (error.message.includes('SKYNET_BLOCKED')) {
                        alert("Spam protection triggered. Please wait 1 minute before sending another donation.");
                        btn.disabled = false;
                        document.getElementById('submit-btn-text').innerText = "PAY & SEND";
                        return;
                    }
                    throw error;
                }

                if (currentTab === 'costream') {`;

if (!html.includes('SKYNET_BLOCKED')) {
    html = html.replace(originalCatch, skynetCatch);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log('viewer.html patched for Skynet Error Handling.');
} else {
    console.log('Already patched.');
}
