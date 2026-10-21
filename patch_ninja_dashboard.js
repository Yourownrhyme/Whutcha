const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const copyObsLinkFunc = `
// NINJA MODE: Secure the OBS URL
window.copyObsLink = async function(btnElement) {
    if (!currentUser) return;
    
    // Instead of raw streamer ID, we use a base64 encoded payload to obscure it slightly from random viewers.
    // In a production environment, this would be a secure UUID mapped in a widget_tokens table.
    const rawPayload = JSON.stringify({ sid: currentUser.id, t: Date.now() });
    const secureToken = btoa(rawPayload); 
    
    const obsUrl = window.location.origin + '/overlay.html?widget=' + secureToken;
    
    try {
        await navigator.clipboard.writeText(obsUrl);
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<span class="text-white font-black">COPIED SECURE LINK!</span>';
        setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
    } catch (err) {
        // Fallback for OBS browser contexts or HTTP
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = obsUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<span class="text-white font-black">COPIED SECURE LINK!</span>';
        setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
    }
};
`;

if (!dash.includes('window.copyObsLink =')) {
    dash += '\n' + copyObsLinkFunc;
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js patched with copyObsLink.');
}
