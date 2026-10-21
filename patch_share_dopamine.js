const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldCopyViewerLink = `function copyViewerLink() {
    if (!currentUser) return;
    const url = \`\${window.location.origin}/viewer.html?streamer=\${currentUser.id}\`;
    fallbackCopyTextToClipboard(url, 'Viewer link');
}`;

const newCopyViewerLink = `window.copyViewerLink = async function(btnElement) {
    if (!currentUser) return;
    vibrate([50]);
    const url = \`\${window.location.origin}/viewer.html?streamer=\${currentUser.id}\`;
    
    try {
        await navigator.clipboard.writeText(url);
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className;
            
            // Dopamine mode animation
            btnElement.innerHTML = '<span class="text-white font-black text-xs uppercase tracking-widest">COPIED!</span>';
            // Swap to green
            btnElement.classList.add('bg-green-500', 'border-green-400');
            btnElement.classList.remove('bg-white/5', 'hover:bg-white/10', 'border-white/10');
            
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses;
            }, 2000);
        }
    } catch (err) {
        fallbackCopyTextToClipboard(url, 'Viewer link');
    }
};`;

if (dash.includes(oldCopyViewerLink)) {
    dash = dash.replace(oldCopyViewerLink, newCopyViewerLink);
}

const oldCopyViewerUrl = `window.copyViewerUrl = function() {
    vibrate([50]);
    if (!currentUser || !currentUser.id) return;
    // Attempt to use profile username if available, else UUID
    const idToUse = currentUser.id; // Could query profiles, but UUID is guaranteed safe
    const url = \`\${window.location.origin}/viewer.html?streamer=\${idToUse}\`;
    fallbackCopyTextToClipboard(url, 'Viewer Link');
};`;

const newCopyViewerUrl = `window.copyViewerUrl = async function(btnElement) {
    vibrate([50]);
    if (!currentUser || !currentUser.id) return;
    const url = \`\${window.location.origin}/viewer.html?streamer=\${currentUser.id}\`;
    
    try {
        await navigator.clipboard.writeText(url);
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className;
            
            // Dopamine mode animation
            btnElement.innerHTML = '<span class="font-black">COPIED!</span>';
            // Swap to green
            btnElement.classList.add('bg-green-500', 'text-white', 'border-green-400');
            btnElement.classList.remove('bg-white', 'text-black', 'hover:bg-gray-200');
            
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses;
            }, 2000);
        }
    } catch (err) {
        fallbackCopyTextToClipboard(url, 'Viewer Link');
    }
};`;

if (dash.includes(oldCopyViewerUrl)) {
    dash = dash.replace(oldCopyViewerUrl, newCopyViewerUrl);
}

fs.writeFileSync('whutcha-web/dashboard.js', dash);
console.log('dashboard.js patched for dopamine share buttons.');
