const fs = require('fs');

let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

js = js.replace(/function copyViewerLink\(\) \{[\s\S]*?\n\}/, `function copyViewerLink() {
    if (!currentUser) return;
    const url = \`\${window.location.origin}/index.html?streamer=\${currentUser.id}\`;
    fallbackCopyTextToClipboard(url, 'Viewer link');
}`);

js = js.replace(/function copyOverlayUrl\(\) \{[\s\S]*?\n\}/, `function copyOverlayUrl() {
    if (!currentUser || !currentUser.id) {
        alert('Error: You are not fully logged in. Please sign out and sign in again.');
        return;
    }
    const url = \`\${window.location.origin}/overlay.html?streamer=\${currentUser.id}\`;
    fallbackCopyTextToClipboard(url, 'OBS Overlay URL');
}`);

js += `
function fallbackCopyTextToClipboard(text, name) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert(name + ' copied to clipboard!\\n\\n' + text);
        }).catch(() => manualCopy(text));
    } else {
        // Fallback for non-secure contexts (like [::]:3000)
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            let successful = document.execCommand('copy');
            if (successful) {
                alert(name + ' copied to clipboard using fallback!\\n\\n' + text);
            } else {
                manualCopy(text);
            }
        } catch (err) {
            manualCopy(text);
        }
        document.body.removeChild(textArea);
    }
}

function manualCopy(text) {
    prompt("Your browser blocked automatic copying. Copy this manually:", text);
}
`;

fs.writeFileSync('whutcha-web/dashboard.js', js);
