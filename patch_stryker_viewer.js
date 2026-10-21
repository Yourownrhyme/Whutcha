const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldInsert = `status: currentTab === 'costream' ? 'approved' : 'pending' // For MVP, auto-approve costreams so they can connect`;
const newInsert = `status: 'pending' // STRYKER DOCTRINE: Force all donations to pending. Never trust the client.`;

if (html.includes(oldInsert)) {
    html = html.replace(oldInsert, newInsert);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log('viewer.html patched for Stryker Doctrine.');
} else {
    console.log('Already patched or string missing.');
}
