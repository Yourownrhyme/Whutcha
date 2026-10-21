const fs = require('fs');

let html = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const oldParams = `const urlParams = new URLSearchParams(window.location.search);
            const streamerId = urlParams.get('streamer');
            if(!streamerId || streamerId === 'default') {
                console.error("OBS: Invalid streamer ID");
                return;
            }`;

const newParams = `const urlParams = new URLSearchParams(window.location.search);
            let streamerId = urlParams.get('streamer');
            
            // NINJA MODE: Secure Widget Decoding
            const widgetToken = urlParams.get('widget');
            if (widgetToken) {
                try {
                    const payload = JSON.parse(atob(widgetToken));
                    streamerId = payload.sid;
                } catch(e) {
                    console.error("OBS: Invalid Secure Widget Token");
                    return;
                }
            }
            
            if(!streamerId || streamerId === 'default') {
                console.error("OBS: Invalid streamer ID");
                return;
            }`;

if (!html.includes('NINJA MODE: Secure Widget Decoding')) {
    html = html.replace(oldParams, newParams);
    fs.writeFileSync('whutcha-web/overlay.html', html);
    console.log('overlay.html patched for Ninja Mode.');
}
