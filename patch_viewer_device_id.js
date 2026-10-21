const fs = require('fs');

let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Generate/Retrieve device ID in the script init
const deviceInit = `
        // --- Device ID for Anti-Troll system ---
        let viewerDeviceId = localStorage.getItem('wtch_device_id');
        if (!viewerDeviceId) {
            viewerDeviceId = 'dev_' + crypto.randomUUID();
            localStorage.setItem('wtch_device_id', viewerDeviceId);
        }
`;

if (!html.includes('wtch_device_id')) {
    html = html.replace("const streamerId = urlParams.get('streamer');", "const streamerId = urlParams.get('streamer');\n" + deviceInit);
}

// 2. Add it to the insert payload
html = html.replace(
    /streamer_id: streamerId,/,
    "streamer_id: streamerId,\n                    viewer_device_id: viewerDeviceId,"
);

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Patched viewer.html');
