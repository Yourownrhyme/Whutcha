const fs = require('fs');

// Add Toast HTML to dashboard.html
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
const toastHtml = `    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl opacity-0 pointer-events-none transition-opacity duration-300 z-50">
        Copied to clipboard!
    </div>
    <script src="./dashboard.js?v=8"></script>
</body>`;
html = html.replace(/<script src="\.\/dashboard\.js\?v=\d+"><\/script>[\s\S]*?<\/body>/, toastHtml);
fs.writeFileSync('whutcha-web/dashboard.html', html);

// Add Toast function and update fallback in dashboard.js
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const toastFunc = `
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 3000);
}

function fallbackCopyTextToClipboard(text, name) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(name + ' copied!');
        }).catch(() => manualCopy(text));
    } else {
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
                showToast(name + ' copied!');
            } else {
                manualCopy(text);
            }
        } catch (err) {
            manualCopy(text);
        }
        document.body.removeChild(textArea);
    }
}
`;

js = js.replace(/function fallbackCopyTextToClipboard[\s\S]*?function manualCopy/m, toastFunc + '\nfunction manualCopy');

fs.writeFileSync('whutcha-web/dashboard.js', js);
