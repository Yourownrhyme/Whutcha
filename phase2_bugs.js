const fs = require('fs');

let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// 1. Add Haptic controller and robust copy function at the top
const utils = `
// Phase 2 Utilities
function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

async function copyText(text, btnElement) {
    try {
        await navigator.clipboard.writeText(text);
        vibrate([50]);
        if (btnElement) {
            const origHTML = btnElement.innerHTML;
            btnElement.innerHTML = '<span class="text-green-500 font-bold">✅ Copied!</span>';
            setTimeout(() => { btnElement.innerHTML = origHTML; }, 2000);
        }
    } catch (e) {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            vibrate([50]);
            if (btnElement) {
                const origHTML = btnElement.innerHTML;
                btnElement.innerHTML = '<span class="text-green-500 font-bold">✅ Copied!</span>';
                setTimeout(() => { btnElement.innerHTML = origHTML; }, 2000);
            }
        } catch (ex) {
            alert("Failed to copy. Please copy manually.");
        }
        document.body.removeChild(textArea);
    }
}
`;

dash = dash.replace(/let currentUser = null;/, utils + '\nlet currentUser = null;');

// 2. Fix signOut
dash = dash.replace(/async function signOut\(\) \{[\s\S]*?window\.location\.href = '\.\/index\.html';\n\}/, 
`async function signOut() {
    vibrate([50, 50]);
    document.body.style.opacity = '0.5';
    document.body.style.pointerEvents = 'none';
    try {
        await supabaseClient.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = './index.html';
    } catch(e) {
        localStorage.clear();
        window.location.href = './index.html';
    }
}`);

// 3. Fix copyViewerLink and add copyObsLink
dash = dash.replace(/window\.copyViewerLink = function\(\) \{[\s\S]*?\};/, 
`window.copyViewerLink = function(btn) {
    const link = document.getElementById('viewer-link').textContent;
    if (link && link !== 'Loading...') copyText(link, btn || event.currentTarget);
};
window.copyObsLink = function(btn) {
    const link = document.getElementById('obs-link').textContent || \`\${window.location.origin}/overlay.html?streamer=\${currentUser.id}\`;
    copyText(link, btn || event.currentTarget);
};
`);

// 4. Fix Payout Link save button with visual/haptic feedback
dash = dash.replace(/window\.savePayoutLink = async \(\) => \{[\s\S]*?alert\('Payout link saved!'\);[\s\S]*?\};/, 
`window.savePayoutLink = async (btnElement) => {
    const btn = btnElement || event.currentTarget;
    const input = document.getElementById('payout-link-input');
    const link = input.value.trim();
    if (!link) return;
    
    const origHTML = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;
    
    try {
        const { error } = await supabaseClient.from('profiles').upsert({ id: currentUser.id, external_pay_link: link });
        if (error) throw error;
        
        vibrate([50, 50, 50]);
        btn.innerHTML = '<span class="text-green-500 font-bold">SAVED!</span>';
    } catch (e) {
        vibrate([100, 50, 100]);
        btn.innerHTML = '<span class="text-red-500 font-bold">ERROR</span>';
        console.error(e);
    }
    
    setTimeout(() => {
        btn.innerHTML = origHTML;
        btn.disabled = false;
    }, 2000);
};`);

fs.writeFileSync('whutcha-web/dashboard.js', dash);
console.log("Applied Phase 2 patches to dashboard.js");

// Now patch dashboard.html to pass `this` to copy functions
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
html = html.replace(/onclick="copyViewerLink\(\)"/g, 'onclick="copyViewerLink(this)"');
html = html.replace(/onclick="savePayoutLink\(\)"/g, 'onclick="savePayoutLink(this)"');
// Add copyObsLink click
html = html.replace(/class="brutal-btn-secondary p-4 w-full font-black text-xl"/g, 'class="brutal-btn-secondary p-4 w-full font-black text-xl" onclick="copyObsLink(this)"');

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log("Applied Phase 2 patches to dashboard.html");
