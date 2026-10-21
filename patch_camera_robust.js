const fs = require('fs');

// 1. Update donate-v2.html
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');
html = html.replace(/<\/script>\s*<\/body>/, `
            // Notify parent that iframe is ready to receive messages
            window.parent.postMessage('iframeReady', '*');
        </script>
    </body>`);
fs.writeFileSync('whutcha-web/donate-v2.html', html);

// 2. Update app.js
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');
const listenerCode = `
window.addEventListener('message', (event) => {
    if (event.data === 'iframeReady') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('sidebar-open')) {
            const iframe = document.getElementById('donate-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage('startCamera', '*');
            }
        }
    }
});
`;
// Append listener to app.js
js += '\n' + listenerCode;
fs.writeFileSync('whutcha-web/app.js', js);
