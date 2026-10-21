const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Remove console.log for payload
const searchLog = `console.log('Queue updated!', payload);`;
const replaceLog = `// console.log removed for Ninja Mode privacy`;
if (dash.includes(searchLog)) {
    dash = dash.replace(searchLog, replaceLog);
}

// Remove dead copyOverlayUrl
const searchCopy = `function copyOverlayUrl() {
    if (!currentUser || !currentUser.id) {
        alert('Error: You are not fully logged in. Please sign out and sign in again.');
        return;
    }
    const url = \`\${window.location.origin}/overlay.html?streamer=\${currentUser.id}\`;
    fallbackCopyTextToClipboard(url, 'OBS Overlay URL');
}`;
if (dash.includes(searchCopy)) {
    dash = dash.replace(searchCopy, '');
}

fs.writeFileSync('whutcha-web/dashboard.js', dash);
console.log('dashboard.js Ninja cleanup applied.');
